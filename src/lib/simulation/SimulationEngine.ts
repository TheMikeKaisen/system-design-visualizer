import { nanoid }              from "nanoid";
import type {
  SystemNode, SystemEdge, Packet,
  WorkerRequest, WorkerResponse,
  RoutingStrategyKind, WorldPoint,
} from "@/types";
import type { IRoutingStrategy }    from "@/lib/patterns/strategies/IRoutingStrategy";
import { RoundRobinStrategy }       from "@/lib/patterns/strategies/RoundRobinStrategy";
import { LeastConnectionsStrategy } from "@/lib/patterns/strategies/LeastConnectionsStrategy";
import { WeightedStrategy }         from "@/lib/patterns/strategies/WeightedStrategy";
import { computePathMetrics, deltaProgress } from "./coordinateBridge";
import type { PathMetrics }         from "./coordinateBridge";
import type { TrafficConfig, GatewayRuntimeState } from "@/lib/store/useSimulationStore";
import { MiddlewareEvaluator }      from "./middleware/MiddlewareEvaluator";
import { useSimulationStore }       from "@/lib/store/useSimulationStore";
import { useCanvasStore }           from "@/lib/store/useCanvasStore";
import { extractMultiEdgePath }     from "./edgePathExtractor";

// ─────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────

const PROTOCOL_COLORS: Record<string, number> = {
  HTTP: 0x378add, gRPC: 0x7f77dd, TCP: 0x1d9e75,
  UDP:  0xef9f27, WebSocket: 0xd85a30,
};

const DEFAULT_SPEED_PX_PER_SECOND = 180;

// ─────────────────────────────────────────────
// Public types
// ─────────────────────────────────────────────

export interface SimulationTickResult {
  newPackets:      Packet[];
  progressUpdates: Map<string, number>;
  arrivedIds:      string[];
  droppedIds:      string[];
}

export type OnPathReadyCallback = (packetId: string, metrics: PathMetrics) => void;

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
// SimulationEngine
// ─────────────────────────────────────────────

export class SimulationEngine {
  private worker:     Worker;
  private strategy:   IRoutingStrategy;
  private onPathReady: OnPathReadyCallback;
  private evaluator:  MiddlewareEvaluator;

  private packetSpeeds       = new Map<string, number>();
  private pendingRequests    = new Map<string, {
    sourceId: string; targetId: string; protocol: string; gatewayId?: string;
  }>();
  private spawnAccumulators  = new Map<string, number>();
  private bufferedNewPackets: Packet[] = [];

  /** Tracks which gateway a packet last traversed (for CB feedback) */
  private packetGateways     = new Map<string, string>();

  /** Timer for pushing gateway states to Zustand (once/sec) */
  private gatewayPushTimer   = 0;
  private readonly GATEWAY_PUSH_INTERVAL_MS = 1000;

  constructor(
    strategyKind: RoutingStrategyKind,
    onPathReady: OnPathReadyCallback,
    worker: Worker
  ) {
    this.strategy    = buildStrategy(strategyKind);
    this.onPathReady = onPathReady;
    this.evaluator   = new MiddlewareEvaluator();

    this.worker = worker;
    this.worker.onmessage = this.handleWorkerMessage.bind(this);
    this.worker.onerror   = (err) => console.error("[SimulationEngine] Worker error:", err);
  }

  setStrategy(kind: RoutingStrategyKind): void {
    this.strategy = buildStrategy(kind);
  }

  // ─────────────────────────────────────────────
  // Pure tick — returns diff
  // ─────────────────────────────────────────────

  tick(
    deltaMs:     number,
    packets:     Record<string, Packet>,
    pathMetrics: Map<string, PathMetrics>,
    nodes:       SystemNode[],
    edges:       SystemEdge[],
    config:      TrafficConfig,
  ): SimulationTickResult {
    const nowMs  = performance.now();
    const result: SimulationTickResult = {
      newPackets:      this.drainBufferedPackets(packets, nodes),
      progressUpdates: new Map(),
      arrivedIds:      [],
      droppedIds:      [],
    };

    this.advancePackets(deltaMs, nowMs, packets, pathMetrics, edges, nodes, result);
    this.spawnPackets(deltaMs, nodes, edges, config);

    // Push gateway state to Zustand at most once per second
    this.gatewayPushTimer += deltaMs;
    if (this.gatewayPushTimer >= this.GATEWAY_PUSH_INTERVAL_MS) {
      this.gatewayPushTimer = 0;
      this.pushGatewayStates(nodes);
    }

    return result;
  }

  drainNewPackets(): Packet[] {
    const packets = [...this.bufferedNewPackets];
    this.bufferedNewPackets.length = 0;
    return packets;
  }

  // ─────────────────────────────────────────────
  // Packet advancement
  // ─────────────────────────────────────────────

  private advancePackets(
    deltaMs:     number,
    nowMs:       number,
    packets:     Record<string, Packet>,
    pathMetrics: Map<string, PathMetrics>,
    edges:       SystemEdge[],
    nodes:       SystemNode[],
    result:      SimulationTickResult,
  ): void {
    const nodeMap = new Map(nodes.map((n) => [n.id, n]));

    for (const [id, packet] of Object.entries(packets)) {
      if (packet.status !== "traveling") continue;

      const metrics = pathMetrics.get(id);
      if (!metrics) continue;

      const speed  = this.packetSpeeds.get(id) ?? DEFAULT_SPEED_PX_PER_SECOND;
      const edgeER = this.getEdgeErrorRate(packet, edges);

      // ── Middleware evaluation at gateway ─────────────────────────
      // If the packet is heading INTO a gateway node, evaluate the chain.
      // We do this at arrival (progress >= 1) so the packet has fully
      // traversed the edge before being evaluated.
      if (packet.progress < 1) {
        const dp          = deltaProgress(deltaMs, speed, metrics.totalLength);
        const newProgress = packet.progress + dp;

        // Random edge packet loss
        if (Math.random() < edgeER * (deltaMs / 1000)) {
          this.handlePacketDropped(id, nowMs, result);
          continue;
        }

        if (newProgress >= 1) {
          // Packet has arrived at its target — check if target is a gateway
          const targetNode = nodeMap.get(packet.targetId);
          if (targetNode?.data.kind === "apiGateway") {
            const evalResult = this.evaluator.evaluate(packet, targetNode, nowMs);
            this.packetGateways.set(id, targetNode.id);

            switch (evalResult.verdict.action) {
              case "drop":
                this.evaluator.recordPacketOutcome(targetNode.id, false, nowMs);
                this.handlePacketDropped(id, nowMs, result);
                continue;

              case "queue":
                // Deduct the delay from the packet's remaining progress
                // by reducing speed temporarily — simplification for simulation
                result.progressUpdates.set(id, 0.95); // Hold near arrival
                continue;

              case "pass":
              case "transform": {
                // Let it arrive — CB records success on next tick
                this.evaluator.recordPacketOutcome(targetNode.id, true, nowMs);
                result.arrivedIds.push(id);
                this.forwardPacket(targetNode.id, nodes, edges);
                this.packetSpeeds.delete(id);
                this.packetGateways.delete(id);
                continue;
              }
            }
          }

          // Non-gateway arrival
          result.arrivedIds.push(id);
          this.forwardPacket(packet.targetId, nodes, edges);
          this.packetSpeeds.delete(id);
        } else {
          result.progressUpdates.set(id, newProgress);
        }
      }
    }
  }

  private handlePacketDropped(
    id:     string,
    nowMs:  number,
    result: SimulationTickResult,
  ): void {
    // Notify CB of failure if this packet was going to a gateway
    const gwId = this.packetGateways.get(id);
    if (gwId) {
      this.evaluator.recordPacketOutcome(gwId, false, nowMs);
      this.packetGateways.delete(id);
    }
    result.droppedIds.push(id);
    this.packetSpeeds.delete(id);
  }

  // ─────────────────────────────────────────────
  // Packet spawning & forwarding
  // ─────────────────────────────────────────────

  private forwardPacket(
    sourceNodeId: string,
    nodes:        SystemNode[],
    edges:        SystemEdge[]
  ): void {
    const nodeMap = new Map(nodes.map((n) => [n.id, n]));
    const sourceNode = nodeMap.get(sourceNodeId);
    if (!sourceNode) return;

    const outEdges = edges.filter((e) => e.source === sourceNodeId);
    if (!outEdges.length) return;

    const candidateIds = new Set(outEdges.map((e) => e.target));
    const candidates   = nodes.filter((n) => candidateIds.has(n.id));
    if (!candidates.length) return;

    const target  = this.strategy.selectTarget(sourceNode, candidates, edges);
    const outEdge = outEdges.find((e) => e.target === target.id);
    const protocol = outEdge?.data?.protocol ?? "HTTP";

    const gatewayId = target.data.kind === "apiGateway" ? target.id : undefined;

    this.requestPath(sourceNodeId, target.id, nodes, edges, protocol, gatewayId);
  }

  private spawnPackets(
    deltaMs: number,
    nodes:   SystemNode[],
    edges:   SystemEdge[],
    config:  TrafficConfig,
  ): void {
    const nodeMap = new Map(nodes.map((n) => [n.id, n]));

    for (const sourceId of config.sourceNodeIds) {
      const sourceNode = nodeMap.get(sourceId);
      if (!sourceNode) continue;

      const prev        = this.spawnAccumulators.get(sourceId) ?? 0;
      const accumulated = prev + config.packetsPerSecond * (deltaMs / 1000);
      const toSpawn     = Math.floor(accumulated);
      this.spawnAccumulators.set(sourceId, accumulated - toSpawn);

      const outEdges     = edges.filter((e) => e.source === sourceId);
      if (!outEdges.length) continue;

      const candidateIds = new Set(outEdges.map((e) => e.target));
      const candidates   = nodes.filter((n) => candidateIds.has(n.id));
      if (!candidates.length) continue;

      for (let i = 0; i < toSpawn; i++) {
        const target  = this.strategy.selectTarget(sourceNode, candidates, edges);
        const outEdge = outEdges.find((e) => e.target === target.id);
        const protocol = outEdge?.data?.protocol ?? "HTTP";

        // Tag packet with gatewayId if heading into a gateway
        const gatewayId = target.data.kind === "apiGateway" ? target.id : undefined;

        this.requestPath(sourceId, target.id, nodes, edges, protocol, gatewayId);
      }
    }
  }

  private requestPath(
    sourceId:   string,
    targetId:   string,
    nodes:      SystemNode[],
    edges:      SystemEdge[],
    protocol:   string,
    gatewayId?: string,
  ): void {
    const requestId = nanoid();
    this.pendingRequests.set(requestId, { sourceId, targetId, protocol, gatewayId });

    const req: WorkerRequest = {
      type:    "CALCULATE_PATH",
      payload: { requestId, sourceId, targetId, nodes, edges },
    };
    this.worker.postMessage(req);
  }

  // ─────────────────────────────────────────────
  // Worker response
  // ─────────────────────────────────────────────

  private handleWorkerMessage(event: MessageEvent<WorkerResponse>): void {
    const { type, payload } = event.data;
    if (type !== "PATH_RESULT") return;

    const { requestId, edgeIds, nodeIds } = payload;
    const pending = this.pendingRequests.get(requestId);
    this.pendingRequests.delete(requestId);
    if (!pending) return;
    if (edgeIds.length === 0 && nodeIds.length <= 1) return;

    // One frame delay ensures React Flow has rendered the edge SVG
    requestAnimationFrame(() => {
      this.createPacketFromPath(pending, edgeIds, nodeIds);
    });
  }

  private createPacketFromPath(
    pending:  { sourceId: string; targetId: string; protocol: string; gatewayId?: string },
    edgeIds:  string[],
    nodeIds:  string[],
  ): void {
    const { nodes, edges, viewport } = useCanvasStore.getState();

    let waypoints: WorldPoint[];

    if (edgeIds.length > 0) {
      waypoints = extractMultiEdgePath(edgeIds, viewport, nodes, edges);
    } else {
      waypoints = [];
    }

    if (waypoints.length < 2) {
      const nodeMap   = new Map(nodes.map((n) => [n.id, n]));
      const nodeCenter = (id: string): WorldPoint => {
        const node = nodeMap.get(id);
        if (!node) return { x: 0, y: 0 };
        return {
          x: node.position.x + (node.measured?.width  ?? 180) / 2,
          y: node.position.y + (node.measured?.height ?? 60)  / 2,
        };
      };
      waypoints = nodeIds.map(nodeCenter);
    }

    if (waypoints.length < 2) return;

    const protocol  = pending.protocol as Packet["protocol"];
    const packetId  = nanoid();

    const packet: Packet = {
      id:         packetId,
      sourceId:   pending.sourceId,
      targetId:   pending.targetId,
      progress:   0,
      status:     "traveling",
      protocol,
      sizeBytes:  512,
      createdAt:  performance.now(),
      color:      PROTOCOL_COLORS[protocol] ?? 0x378add,
      gatewayId:  pending.gatewayId,
    };

    const metrics = computePathMetrics(waypoints);
    this.packetSpeeds.set(packetId, DEFAULT_SPEED_PX_PER_SECOND);
    this.onPathReady(packetId, metrics);
    this.bufferedNewPackets.push(packet);
  }

  // ─────────────────────────────────────────────
  // Gateway state push → Zustand
  // ─────────────────────────────────────────────

  private pushGatewayStates(nodes: SystemNode[]): void {
    const store = useSimulationStore.getState();
    for (const node of nodes) {
      if (node.data.kind !== "apiGateway") continue;

      const cbStatus = this.evaluator.getCircuitBreakerStatus(node.id);
      if (!cbStatus) continue; // CB not yet activated for this node

      const gs: GatewayRuntimeState = {
        gatewayId:          node.id,
        cbState:            cbStatus.state,
        cbFailures:         cbStatus.failureCount,
        cbShedCount:        cbStatus.shedCount,
        rateLimiterFillPct: this.evaluator.getRateLimiterFillPct(node.id),
        recentAudit:        this.evaluator.getAuditLog(node.id).slice(0, 20),
      };

      store.setGatewayState(gs);
    }
  }

  // ─────────────────────────────────────────────
  // Helpers
  // ─────────────────────────────────────────────

  private drainBufferedPackets(
    currentPackets: Record<string, Packet>,
    nodes:          SystemNode[],
  ): Packet[] {
    const packets = [...this.bufferedNewPackets];
    this.bufferedNewPackets.length = 0;
    return packets;
  }

  private getEdgeErrorRate(packet: Packet, edges: SystemEdge[]): number {
    const edge = edges.find(
      (e) => e.source === packet.sourceId && e.target === packet.targetId
    );
    return edge?.data?.errorRate ?? 0;
  }

  // ─────────────────────────────────────────────
  // Teardown
  // ─────────────────────────────────────────────

  destroy(): void {
    this.worker.terminate();
    this.evaluator.destroy();
    this.packetSpeeds.clear();
    this.pendingRequests.clear();
    this.spawnAccumulators.clear();
    this.packetGateways.clear();
    this.bufferedNewPackets.length = 0;
  }
}