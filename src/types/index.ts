import type { Node, Edge } from "@xyflow/react";

// ═══════════════════════════════════════════════════════
// COORDINATE SPACES
// Distinct types prevent accidental misuse at call sites.
// ═══════════════════════════════════════════════════════

export interface WorldPoint {
  x: number;
  y: number;
}

export interface PixiPoint {
  x: number;
  y: number;
}

export interface ViewportTransform {
  x: number;
  y: number;
  zoom: number;
}

// ═══════════════════════════════════════════════════════
// NODE SYSTEM
// ═══════════════════════════════════════════════════════

export type NodeKind =
  | "service"
  | "loadBalancer"
  | "database"
  | "s3Bucket"
  | "cache"
  | "messageQueue"
  | "cdn"
  // Cloud — Phase N additions (add kinds here, NodeFactory handles the rest)
  | "ec2Instance"
  | "rdsCluster"
  | "elasticacheCluster"
  | "cloudfrontDistribution"
  | "apiGateway";     // ← critical for your future API gateway work

export interface SystemNodeData extends Record<string, unknown> {
  label: string;
  kind: NodeKind;
  activeConnections: number;
  /** 0–1 load percentage — drives visual health indicator */
  load: number;
  metadata: Record<string, string | number | boolean>;

  /**
   * Security policies attached to this node.
   * Packets passing through a secured node are evaluated against these.
   * Empty array = no enforcement (default, backward-compatible).
   * Populated in the Security phase.
   */
  securityPolicies: SecurityPolicy[];
}

export type SystemNode = Node<SystemNodeData>;

// ═══════════════════════════════════════════════════════
// EDGE SYSTEM
// ═══════════════════════════════════════════════════════

export type Protocol = "HTTP" | "gRPC" | "TCP" | "UDP" | "WebSocket";

export interface MiddlewareConfig {
  type: "rateLimit" | "auth" | "transform" | "logging" | "circuitBreaker";
  enabled: boolean;
  config: Record<string, unknown>;
}

export interface SystemEdgeData extends Record<string, unknown> {
  protocol: Protocol;
  throughputLimit: number | null;
  latencyMs: number;
  /** 0–1 probability of packet loss */
  errorRate: number;
  /**
   * Middleware chain — evaluated in order when a packet traverses this edge.
   * API Gateway phase will populate this. Currently always [].
   */
  middleware: MiddlewareConfig[];
}

export type SystemEdge = Edge<SystemEdgeData>;

// ═══════════════════════════════════════════════════════
// SECURITY (application-layer stub)
// Populated in the Security phase. Types defined now so
// the shape is correct before any implementation exists.
// ═══════════════════════════════════════════════════════

export type SecurityPolicyKind =
  | "allowList"    // only listed source IDs may connect
  | "denyList"     // listed source IDs are blocked
  | "requireAuth"  // packet must carry a valid authToken
  | "rateLimit";   // max N connections per second

export interface SecurityPolicy {
  kind: SecurityPolicyKind;
  enabled: boolean;
  config: Record<string, unknown>;
}

// ═══════════════════════════════════════════════════════
// PACKET SYSTEM
// KEY CHANGE: `path` is REMOVED from this type.
// Packets in Zustand are pure UI-reactive data (progress, status, color).
// PathMetrics live ephemerally in PacketManager's ref map — never serialized.
// ═══════════════════════════════════════════════════════

export type PacketStatus = "traveling" | "arrived" | "dropped" | "queued";

export interface Packet {
  readonly id: string;
  readonly sourceId: string;
  readonly targetId: string;
  /** Normalised 0–1 progress along the path */
  progress: number;
  status: PacketStatus;
  readonly protocol: Protocol;
  readonly sizeBytes: number;
  readonly createdAt: number;
  /** Pixi hex color, resolved once at creation from protocol */
  readonly color: number;
  /**
   * Optional auth context — populated in Security phase.
   * Undefined = unauthenticated (default, backward-compatible).
   */
  readonly authToken?: string;
  /** Future: request headers for API gateway middleware evaluation */
  readonly headers?: Record<string, string>;
}

// ═══════════════════════════════════════════════════════
// WEB WORKER CONTRACT
// ═══════════════════════════════════════════════════════

export type RoutingStrategyKind =
  | "roundRobin"
  | "leastConnections"
  | "weighted";

export interface WorkerRequest {
  type: "CALCULATE_PATH";
  payload: {
    requestId: string;
    sourceId: string;
    targetId: string;
    nodes: SystemNode[];
    edges: SystemEdge[];
  };
}

export interface WorkerResponse {
  type: "PATH_RESULT";
  payload: {
    requestId: string;
    /** Empty array = no path found → packet will be dropped */
    path: WorldPoint[];
    edgeIds: string[];
  };
}

// ═══════════════════════════════════════════════════════
// COMMAND PATTERN — SERIALIZABLE
// Every command must be serializable to a plain JSON object.
// This is the contract that makes real-time collaboration possible.
// When two users perform commands simultaneously, Yjs broadcasts the
// serialized form and peers replay it via CommandInvoker.deserialize().
// ═══════════════════════════════════════════════════════

export interface SerializedCommand {
  /** Maps to a registered command class — e.g. "AddNode", "MoveNode" */
  type: string;
  /** JSON-serializable payload — no class instances, no functions */
  payload: Record<string, unknown>;
  /** UTC milliseconds — used for conflict resolution ordering */
  timestamp: number;
  /** Yjs client ID of the originating peer */
  clientId: string;
}

// ═══════════════════════════════════════════════════════
// COLLABORATION
// ═══════════════════════════════════════════════════════

export interface CollaboratorCursor {
  clientId: string;
  displayName: string;
  color: string;
  /** World-space position of their canvas cursor */
  position: WorldPoint;
  /** Currently selected node IDs */
  selectedNodeIds: string[];
}

export interface DiagramMeta {
  id: string;
  name: string;
  ownerId: string;
  collaborators: string[];
  createdAt: number;
  updatedAt: number;
}