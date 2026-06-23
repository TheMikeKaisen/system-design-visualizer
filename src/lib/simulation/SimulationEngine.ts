import { nanoid }              from "nanoid";
import type {
  SystemNode, SystemEdge, Packet,
  WorkerRequest, WorkerResponse,
  RoutingStrategyKind, WorldPoint, NodeMetrics,
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
import { NodeProcessingState }      from "./NodeProcessingState";

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
  /** Packets that entered "queued" status at a node this tick */
  queuedIds:       string[];
  /** Packets that entered "processing" status at a node this tick */
  processingIds:   string[];
  /** Per-node capacity metrics snapshot */
  nodeMetrics:     Map<string, NodeMetrics>;
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
    sourceId: string; targetId: string; protocol: string; gatewayId?: string; retryCount: number;
  }>();
  private spawnAccumulators  = new Map<string, number>();
  private bufferedNewPackets: Packet[] = [];

  /** Tracks which gateway a packet last traversed (for CB feedback) */
  private packetGateways     = new Map<string, string>();

  /** Per-node processing state (queues, active slots) */
  private nodeStates         = new Map<string, NodeProcessingState>();

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
      queuedIds:       [],
      processingIds:   [],
      nodeMetrics:     new Map(),
    };

    // Ensure NodeProcessingState exists for all nodes with capacity
    this.ensureNodeStates(nodes);

    // 1. Process completed packets at nodes → forward downstream
    this.tickNodeProcessing(nowMs, config.requestTimeoutMs, config.maxRetries, packets, nodes, edges, result);

    // 2. Advance traveling packets along edges
    this.advancePackets(deltaMs, nowMs, config.maxRetries, packets, pathMetrics, edges, nodes, result);

    // 3. Spawn new packets from source nodes
    this.spawnPackets(deltaMs, nodes, edges, config);

    // 4. Collect per-node metrics
    for (const [nodeId, state] of this.nodeStates) {
      state.tickMetrics(nowMs);
      result.nodeMetrics.set(nodeId, state.getMetrics());
    }

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
    maxRetries:  number,
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

      if (packet.progress < 1) {
        const dp          = deltaProgress(deltaMs, speed, metrics.totalLength);
        const newProgress = packet.progress + dp;

        // Random edge packet loss
        if (Math.random() < edgeER * (deltaMs / 1000)) {
          this.handlePacketDropped(id, packet, nowMs, maxRetries, nodes, edges, result);
          continue;
        }

        if (newProgress >= 1) {
          // Packet has arrived at its target
          const targetNode = nodeMap.get(packet.targetId);

          // Gateway middleware evaluation
          if (targetNode?.data.kind === "apiGateway") {
            const evalResult = this.evaluator.evaluate(packet, targetNode, nowMs);
            this.packetGateways.set(id, targetNode.id);

            switch (evalResult.verdict.action) {
              case "drop":
                this.evaluator.recordPacketOutcome(targetNode.id, false, nowMs);
                this.handlePacketDropped(id, packet, nowMs, maxRetries, nodes, edges, result);
                continue;

              case "queue":
                result.progressUpdates.set(id, 0.95);
                continue;

              case "pass":
              case "transform": {
                this.evaluator.recordPacketOutcome(targetNode.id, true, nowMs);
                this.packetSpeeds.delete(id);
                this.packetGateways.delete(id);
                // Admit through capacity system
                this.admitPacketAtNode(id, packet, targetNode, nowMs, maxRetries, nodes, edges, result);
                continue;
              }
            }
          }

          // Non-gateway arrival — admit through capacity system
          this.packetSpeeds.delete(id);
          if (targetNode) {
            this.admitPacketAtNode(id, packet, targetNode, nowMs, maxRetries, nodes, edges, result);
          } else {
            result.arrivedIds.push(id);
          }
        } else {
          result.progressUpdates.set(id, newProgress);
        }
      }
    }
  }

  /**
   * Admit a packet at a target node through the capacity system.
   * If the node has no capacity (e.g. client, CDN), it's instantly "arrived" and forwarded.
   */
  private admitPacketAtNode(
    packetId:   string,
    packet:     Packet,
    targetNode: SystemNode,
    nowMs:      number,
    maxRetries: number,
    nodes:      SystemNode[],
    edges:      SystemEdge[],
    result:     SimulationTickResult,
  ): void {
    const nodeState = this.nodeStates.get(targetNode.id);

    if (!nodeState) {
      // No capacity config — pass through instantly
      result.arrivedIds.push(packetId);
      this.forwardPacket(targetNode.id, nodes, edges);
      return;
    }

    const admission = nodeState.admit(packetId, nowMs);
    switch (admission) {
      case "processing":
        result.processingIds.push(packetId);
        break;
      case "queued":
        result.queuedIds.push(packetId);
        break;
      case "dropped":
        this.handlePacketDropped(packetId, packet, nowMs, maxRetries, nodes, edges, result);
        break;
    }
  }

  private handlePacketDropped(
    id:         string,
    packet:     Packet | undefined,
    nowMs:      number,
    maxRetries: number,
    nodes:      SystemNode[],
    edges:      SystemEdge[],
    result:     SimulationTickResult,
  ): void {
    // Notify CB of failure if this packet was going to a gateway
    const gwId = this.packetGateways.get(id);
    if (gwId) {
      this.evaluator.recordPacketOutcome(gwId, false, nowMs);
      this.packetGateways.delete(id);
    }
    result.droppedIds.push(id);
    this.packetSpeeds.delete(id);
    
    // Attempt retry if applicable
    if (packet && (packet.retryCount ?? 0) < maxRetries) {
      this.requestPath(
        packet.sourceId, 
        packet.targetId, 
        nodes, 
        edges, 
        packet.protocol, 
        packet.gatewayId,
        (packet.retryCount ?? 0) + 1
      );
    }
  }

  // ─────────────────────────────────────────────
  // Node processing lifecycle
  // ─────────────────────────────────────────────

  /** Ensure a NodeProcessingState exists for every node with capacity */
  private ensureNodeStates(nodes: SystemNode[]): void {
    const currentIds = new Set<string>();
    for (const node of nodes) {
      if (!node.data.capacity) continue;
      currentIds.add(node.id);
      const existing = this.nodeStates.get(node.id);
      if (existing) {
        // Update capacity in case user changed it in inspector
        existing.capacity = node.data.capacity;
      } else {
        this.nodeStates.set(node.id, new NodeProcessingState(node.id, node.data.capacity));
      }
    }
    // Remove states for deleted nodes
    for (const id of this.nodeStates.keys()) {
      if (!currentIds.has(id)) this.nodeStates.delete(id);
    }
  }

  /**
   * Tick node processing: complete finished packets, promote queued ones,
   * and forward completed packets downstream.
   */
  private tickNodeProcessing(
    nowMs:        number,
    timeoutMs:    number,
    maxRetries:   number,
    allPackets:   Record<string, Packet>,
    nodes:        SystemNode[],
    edges:        SystemEdge[],
    result:       SimulationTickResult,
  ): void {
    for (const [, state] of this.nodeStates) {
      // 1. Process Timeouts
      const timedOut = state.getTimedOutPackets(nowMs, timeoutMs);
      for (const packetId of timedOut) {
        const packet = allPackets[packetId];
        this.handlePacketDropped(packetId, packet, nowMs, maxRetries, nodes, edges, result);
      }
      
      // 2. Process Completions
      const completed = state.getCompletedPackets(nowMs);
      for (const packetId of completed) {
        state.completePacket(packetId, nowMs);
        result.arrivedIds.push(packetId);
        // Forward to next hop
        this.forwardPacket(state.nodeId, nodes, edges);
      }
    }
  }

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
    retryCount: number = 0,
  ): void {
    const requestId = nanoid();
    this.pendingRequests.set(requestId, { sourceId, targetId, protocol, gatewayId, retryCount });

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
    pending:  { sourceId: string; targetId: string; protocol: string; gatewayId?: string; retryCount: number },
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
      retryCount: pending.retryCount,
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
    this.nodeStates.clear();
  }

  /** Reset all node processing states (called on simulation reset) */
  resetNodeStates(): void {
    for (const state of this.nodeStates.values()) {
      state.reset();
    }
  }
}