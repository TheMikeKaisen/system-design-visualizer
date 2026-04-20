import type { Node, Edge } from "@xyflow/react";

// Node System
export type NodeKind =
    | "service"
    | "loadBalancer"
    | "database"
    | "s3Bucket"
    | "cache"
    | "messageQueue"
    | "cdn";

export interface SystemNodeData extends Record<string, unknown> {
    label: string;
    kind: NodeKind;
    /** Current active connections — used by LeastConnections strategy */
    activeConnections: number;
    /** 0–1 percentage — drives visual health indicator */
    load: number;
    metadata: Record<string, string | number>;
}

/** React Flow Node with our typed data payload */
export type SystemNode = Node<SystemNodeData>;

// EDGE SYSTEM
export type Protocol = "HTTP" | "gRPC" | "TCP" | "UDP" | "WebSocket";

export interface SystemEdgeData extends Record<string, unknown> {
    protocol: Protocol;
    /** Packets per second cap. null = unlimited */
    throughputLimit: number | null;
    latencyMs: number;
    /** 0–1 probability of packet loss for simulation */
    errorRate: number;
    /** Cached world-space waypoints, updated on node move */
    cachedPath: WorldPoint[] | null;
}

export type SystemEdge = Edge<SystemEdgeData>;

// ─────────────────────────────────────────────
// Coordinate Spaces
// ─────────────────────────────────────────────

/** React Flow's internal "world" coordinate (before viewport transform) */
export interface WorldPoint {
    x: number;
    y: number;
}

/** Pixi canvas screen coordinate (after viewport transform applied) */
export interface PixiPoint {
    x: number;
    y: number;
}

export interface ViewportTransform {
    x: number;
    y: number;
    zoom: number;
}

// ─────────────────────────────────────────────
// Packet System
// ─────────────────────────────────────────────

export type PacketStatus = "traveling" | "arrived" | "dropped" | "queued";

export interface Packet {
    readonly id: string;
    /** Source node ID */
    sourceId: string;
    /** Destination node ID */
    targetId: string;
    /** The resolved edge path — world-space waypoints */
    path: WorldPoint[];
    /** Normalised 0–1 progress along the path */
    progress: number;
    status: PacketStatus;
    protocol: Protocol;
    sizeBytes: number;
    /** Timestamp when packet was created (performance.now()) */
    createdAt: number;
    /** Color tint driven by protocol — resolved at creation */
    color: number; // Pixi hex e.g. 0xff4444
}

// ─────────────────────────────────────────────
// Web Worker Message Contract
// ─────────────────────────────────────────────

export interface WorkerRequest {
    type: "CALCULATE_PATH";
    payload: {
        requestId: string;
        sourceId: string;
        targetId: string;
        nodes: SystemNode[];
        edges: SystemEdge[];
        strategy: RoutingStrategyKind;
    };
}

export type RoutingStrategyKind =
    | "roundRobin"
    | "leastConnections"
    | "weighted";

export interface WorkerResponse {
    type: "PATH_RESULT";
    payload: {
        requestId: string;
        path: WorldPoint[];
        /** The specific edge IDs the packet will traverse */
        edgeIds: string[];
    };
}