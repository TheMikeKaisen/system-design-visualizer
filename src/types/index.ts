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
  // General
  | "service" | "loadBalancer" | "database" | "s3Bucket"
  | "cache"   | "messageQueue" | "cdn" | "client"
  // API Gateway (already existed, gets full implementation now)
  | "apiGateway"
  // AWS
  | "awsEc2"         | "awsRds"       | "awsElastiCache"
  | "awsCloudFront"  | "awsLambda"    | "awsSqs"
  // GCP
  | "gcpCloudRun"    | "gcpCloudSql"  | "gcpCloudStorage"
  | "gcpPubSub"      | "gcpCloudCdn"  | "gcpCloudFunction"
  // Azure
  | "azureVm"        | "azureSql"     | "azureBlobStorage"
  | "azureServiceBus"| "azureCdn"     | "azureFunction";

export type CloudProvider = "aws" | "gcp" | "azure" | "general";

/** Determines which cloud badge to show on a node */
export function getCloudProvider(kind: NodeKind): CloudProvider {
  if (kind.startsWith("aws"))   return "aws";
  if (kind.startsWith("gcp"))   return "gcp";
  if (kind.startsWith("azure")) return "azure";
  return "general";
}

/**
 * An individual step in an API Gateway's middleware chain.
 * Stored as JSON in SystemNodeData.metadata.middlewareChain
 * so it survives Zustand serialization.
 */
export interface MiddlewareStep {
  id:      string;
  type:    "rateLimit" | "auth" | "transform" | "logging" | "circuitBreaker" | "cors";
  enabled: boolean;
  label:   string;
  /** Type-specific config — kept loosely typed for extensibility */
  config:  Record<string, unknown>;
}

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


// What Node<SystemNodeData> becomes:
// {
//   id:       string;
//   type?:    string;
//   position: { x: number; y: number };
//   data:     SystemNodeData;     // ← TData replaced with SystemNodeData
//   measured?: { width: number; height: number };
//   selected?: boolean;
//   dragging?: boolean;
// }
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

export type PacketStatus = "traveling" | "arrived" | "dropped";

export interface Packet {
  readonly id:          string;
  readonly sourceId:    string;
  readonly targetId:    string;
  progress:             number;
  status:               PacketStatus;
  readonly protocol:    Protocol;
  readonly sizeBytes:   number;
  readonly createdAt:   number;
  readonly color:       number;
  readonly authToken?:  string;
  headers?:             Record<string, string>;
  readonly gatewayId?:  string;
}

export type CircuitBreakerState = "CLOSED" | "OPEN" | "HALF_OPEN";

// ═══════════════════════════════════════════════════════
// ═══════════════════════════════════════════════════════
// OBSERVABILITY
// ═══════════════════════════════════════════════════════

/**
 * A single data point recorded once per second during simulation.
 * Kept in a rolling buffer — never grows unbounded.
 */
export interface SimulationDataPoint {
  /** Unix timestamp (Date.now()) */
  ts:             number;
  packetsPerSec:  number;
  activePackets:  number;
  avgLatencyMs:   number;
  dropRatePct:    number;
  /** Per-gateway circuit breaker state snapshot */
  gatewayStates:  Record<string, GatewaySnapshot>;
}

export interface GatewaySnapshot {
  gatewayId:   string;
  cbState:     CircuitBreakerState;
  shedCount:   number;
  tokenFillPct: number;
}

export interface SimulationRecording {
  id:         string;
  diagramId:  string;
  startedAt:  number;
  endedAt:    number | null;
  dataPoints: SimulationDataPoint[];
  /** Peak values across the recording */
  peaks: {
    maxPacketsPerSec: number;
    maxLatencyMs:     number;
    maxDropRatePct:   number;
  };
}

// ═══════════════════════════════════════════════════════
// EXPORT
// ═══════════════════════════════════════════════════════

export interface ExportOptions {
  format:        "png" | "svg" | "json";
  includeHud:    boolean;
  scale:         number;       // 1 = normal, 2 = retina
  background:    string;       // CSS color or "transparent"
}

export interface ShareLink {
  diagramId: string;
  token:     string;
  expiresAt: number | null;
  isPublic:  boolean;
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
    /** Ordered edge IDs to traverse — empty = no path */
    edgeIds: string[];
    /** Keep nodeIds for fallback straight-line if SVG extraction fails */
    nodeIds: string[];
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
// ═══════════════════════════════════════════════════════
// PERSISTENCE
// ═══════════════════════════════════════════════════════

/** Bumped when the serialization format changes. Old files must be migrated. */
export const DIAGRAM_FORMAT_VERSION = 1 as const;

/**
 * The complete, self-contained snapshot of a diagram.
 * This is what gets written to localStorage, exported as a file,
 * and stored in the database. Nothing else is needed to fully restore a session.
 */
export interface SerializedDiagram {
  version: typeof DIAGRAM_FORMAT_VERSION;
  meta: DiagramMeta;
  nodes: SystemNode[];
  edges: SystemEdge[];
  viewport: ViewportTransform;
}

/**
 * Lightweight summary for the diagram browser list.
 * Never includes nodes/edges — keeps the list fast to render.
 */
export interface DiagramListItem {
  id: string;
  name: string;
  updatedAt: number;
  nodeCount: number;
  edgeCount: number;
  /** Thumbnail — base64 PNG, generated on save. */
  thumbnail?: string;
}