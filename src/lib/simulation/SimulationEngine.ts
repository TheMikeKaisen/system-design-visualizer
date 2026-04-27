import { nanoid } from "nanoid";
import type {
  SystemNode,
  SystemEdge,
  Packet,
  WorkerRequest,
  WorkerResponse,
  RoutingStrategyKind,
  WorldPoint,
} from "@/types";
import type { IRoutingStrategy } from "@/lib/patterns/strategies/IRoutingStrategy";
import { RoundRobinStrategy } from "@/lib/patterns/strategies/RoundRobinStrategy";
import { LeastConnectionsStrategy } from "@/lib/patterns/strategies/LeastConnectionsStrategy";
import { computePathMetrics, deltaProgress } from "./coordinateBridge";
import type { PathMetrics } from "./coordinateBridge";
import type { TrafficConfig } from "@/lib/store/useSimulationStore";
import { WeightedStrategy } from "../patterns/strategies/WeightedStrategy";

// Public contracts


/**
 * The pure output of one simulation tick.
 * PacketManager receives this and applies it to the store.
 * No Zustand imports anywhere in this file.
 */
export interface SimulationTickResult {
  newPackets: Packet[];
  /** packetId → new progress value */
  progressUpdates: Map<string, number>;
  arrivedIds: string[];
  droppedIds: string[];
}

/**
 * Called by PacketManager the moment a path is resolved for a new packet.
 * PacketManager stores the metrics in its own ref map.
 */
export type OnPathReadyCallback = (
  packetId: string,
  metrics: PathMetrics
) => void;

const PROTOCOL_COLORS: Record<string, number> = {
  HTTP:      0x378add,
  gRPC:      0x7f77dd,
  TCP:       0x1d9e75,
  UDP:       0xef9f27,
  WebSocket: 0xd85a30,
};

const DEFAULT_SPEED_PX_PER_SECOND = 180;

// ─────────────────────────────────────────────
// Strategy factory
// ─────────────────────────────────────────────

function buildStrategy(kind: RoutingStrategyKind): IRoutingStrategy {
  switch (kind) {
    case "leastConnections": return new LeastConnectionsStrategy();
    case "weighted":         return new WeightedStrategy();
    default:                 return new RoundRobinStrategy();
  }
}

// ─────────────────────────────────────────────
// Engine
// ─────────────────────────────────────────────

export class SimulationEngine {
  private worker: Worker;
  private strategy: IRoutingStrategy;
  private onPathReady: OnPathReadyCallback;

  /** Ephemeral — speed and metrics per live packet. NOT in any store. */
  private packetSpeeds = new Map<string, number>();

  /** Worker requests awaiting a response */
  private pendingRequests = new Map<
    string,
    { sourceId: string; targetId: string; protocol: string }
  >();

  /** Fractional packet spawn accumulator, per source node */
  private spawnAccumulators = new Map<string, number>();

  constructor(
    strategyKind: RoutingStrategyKind,
    onPathReady: OnPathReadyCallback
  ) {
    this.strategy = buildStrategy(strategyKind);
    this.onPathReady = onPathReady;

    this.worker = new Worker(
      new URL("../workers/pathCalculator.worker.ts", import.meta.url)
    );
    this.worker.onmessage = this.handleWorkerMessage.bind(this);
    this.worker.onerror = (err) => {
      console.error("[SimulationEngine] Worker error:", err);
    };
  }

  setStrategy(kind: RoutingStrategyKind): void {
    this.strategy = buildStrategy(kind);
  }

  // ── PURE TICK ──────────────────────────────────────────

  /**
   * Receives the current world state, advances all live packets,
   * spawns new ones, and returns a diff.
   *
   * Zero side effects on any external store.
   */
  tick(
    deltaMs: number,
    packets: Record<string, Packet>,
    pathMetrics: Map<string, PathMetrics>,
    nodes: SystemNode[],
    edges: SystemEdge[],
    config: TrafficConfig
  ): SimulationTickResult {
    const result: SimulationTickResult = {
      newPackets: [],
      progressUpdates: new Map(),
      arrivedIds: [],
      droppedIds: [],
    };

    this.advancePackets(deltaMs, packets, pathMetrics, edges, result);
    this.spawnPackets(deltaMs, nodes, edges, config);

    return result;
  }

  // ── Packet advancement ─────────────────────────────────

  private advancePackets(
    deltaMs: number,
    packets: Record<string, Packet>,
    pathMetrics: Map<string, PathMetrics>,
    edges: SystemEdge[],
    result: SimulationTickResult
  ): void {
    for (const [id, packet] of Object.entries(packets)) {
      if (packet.status !== "traveling") continue;

      const metrics = pathMetrics.get(id);
      if (!metrics) continue;

      const speed = this.packetSpeeds.get(id) ?? DEFAULT_SPEED_PX_PER_SECOND;

      // Apply edge error rate — find the edge for current segment
      const errorRate = this.getErrorRateForPacket(packet, edges);
      if (Math.random() < errorRate * (deltaMs / 1000)) {
        result.droppedIds.push(id);
        this.packetSpeeds.delete(id);
        continue;
      }

      const dp = deltaProgress(deltaMs, speed, metrics.totalLength);
      const newProgress = packet.progress + dp;

      if (newProgress >= 1) {
        result.arrivedIds.push(id);
        this.packetSpeeds.delete(id);
      } else {
        result.progressUpdates.set(id, newProgress);
      }
    }
  }

  private getErrorRateForPacket(
    packet: Packet,
    edges: SystemEdge[]
  ): number {
    // Find any edge between source and target
    const edge = edges.find(
      (e) => e.source === packet.sourceId && e.target === packet.targetId
    );
    return edge?.data?.errorRate ?? 0;
  }

  // ── Packet spawning ────────────────────────────────────

  private spawnPackets(
    deltaMs: number,
    nodes: SystemNode[],
    edges: SystemEdge[],
    config: TrafficConfig
  ): void {
    const nodeMap = new Map(nodes.map((n) => [n.id, n]));

    for (const sourceId of config.sourceNodeIds) {
      const sourceNode = nodeMap.get(sourceId);
      if (!sourceNode) continue;

      const prev = this.spawnAccumulators.get(sourceId) ?? 0;
      const accumulated = prev + config.packetsPerSecond * (deltaMs / 1000);
      const toSpawn = Math.floor(accumulated);
      this.spawnAccumulators.set(sourceId, accumulated - toSpawn);

      const outEdges = edges.filter((e) => e.source === sourceId);
      if (outEdges.length === 0) continue;

      const candidateIds = new Set(outEdges.map((e) => e.target));
      const candidates = nodes.filter((n) => candidateIds.has(n.id));
      if (candidates.length === 0) continue;

      for (let i = 0; i < toSpawn; i++) {
        const target = this.strategy.selectTarget(sourceNode, candidates, edges);
        const outEdge = outEdges.find((e) => e.target === target.id);
        const protocol = outEdge?.data?.protocol ?? "HTTP";

        this.pendingRequests.set(nanoid(), {
          sourceId,
          targetId: target.id,
          protocol,
        });

        const req: WorkerRequest = {
          type: "CALCULATE_PATH",
          payload: {
            requestId: [...this.pendingRequests.keys()].at(-1)!,
            sourceId,
            targetId: target.id,
            nodes,
            edges,
          },
        };
        this.worker.postMessage(req);
      }
    }
  }

  // ── Worker response ────────────────────────────────────

  private handleWorkerMessage(event: MessageEvent<WorkerResponse>): void {
    const { type, payload } = event.data;
    if (type !== "PATH_RESULT") return;

    const { requestId, path } = payload;
    const pending = this.pendingRequests.get(requestId);
    this.pendingRequests.delete(requestId);
    if (!pending || path.length < 2) return;

    const packetId = nanoid();
    const protocol = pending.protocol as Packet["protocol"];

    const packet: Packet = {
      id: packetId,
      sourceId: pending.sourceId,
      targetId: pending.targetId,
      progress: 0,
      status: "traveling",
      protocol,
      sizeBytes: 512,
      createdAt: performance.now(),
      color: PROTOCOL_COLORS[protocol] ?? 0x378add,
    };

    const metrics = computePathMetrics(path);
    this.packetSpeeds.set(packetId, DEFAULT_SPEED_PX_PER_SECOND);

    // Notify PacketManager so it can store metrics in its own ref
    this.onPathReady(packetId, metrics);

    // The packet itself is returned to PacketManager via the tick result
    // on the next frame — but we need to add it immediately.
    // We use a micro-buffer approach: engine holds newPackets until tick collects them.
    this.bufferedNewPackets.push(packet);
  }

  /** Packets created between ticks — collected by the next tick() call */
  private bufferedNewPackets: Packet[] = [];

  // Expose for PacketManager to drain each frame
  drainNewPackets(): Packet[] {
    const packets = [...this.bufferedNewPackets];
    this.bufferedNewPackets.length = 0;
    return packets;
  }

  // ── Teardown ───────────────────────────────────────────

  destroy(): void {
    this.worker.terminate();
    this.packetSpeeds.clear();
    this.pendingRequests.clear();
    this.spawnAccumulators.clear();
    this.bufferedNewPackets.length = 0;
  }
}