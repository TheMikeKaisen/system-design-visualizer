import { create } from "zustand";
import { subscribeWithSelector } from "zustand/middleware";
import { immer } from "zustand/middleware/immer";
import type { Packet, RoutingStrategyKind, CircuitBreakerState, NodeMetrics } from "@/types";
import type { AuditEntry } from "../simulation/middleware/types";

// ─────────────────────────────────────────────
// Sub-types
// ─────────────────────────────────────────────

export type TrafficProfile = "constant" | "spiky" | "ddos";

export interface TrafficConfig {
  /** Packets spawned per second, per active source node */
  packetsPerSecond: number;
  routingStrategy: RoutingStrategyKind;
  /** IDs of nodes that actively generate outbound traffic */
  sourceNodeIds: string[];
  /** Maximum time (ms) a packet can spend in a queue before timeout */
  requestTimeoutMs: number;
  /** Maximum number of retries for dropped/timed-out packets */
  maxRetries: number;
  /** Scenario profile determining how packets are spawned over time */
  trafficProfile: TrafficProfile;
}

export interface GatewayRuntimeState {
  gatewayId: string;
  cbState: CircuitBreakerState;
  cbFailures: number;
  cbShedCount: number;
  rateLimiterFillPct: number;
  recentAudit: AuditEntry[];
}

export interface SimulationStats {
  totalSent: number;
  totalArrived: number;
  totalDropped: number;
  /** Rolling average over the last 60 arrived packets */
  avgLatencyMs: number;
  /** Used for rolling average calculation */
  _latencyBuffer: number[];
}

// ─────────────────────────────────────────────
// Shape
// ─────────────────────────────────────────────

interface SimulationState {
  packets: Record<string, Packet>;
  isRunning: boolean;
  config: TrafficConfig;
  stats: SimulationStats;
  gatewayStates: Record<string, GatewayRuntimeState>;
  nodeMetrics: Record<string, NodeMetrics>;
  edgeMetrics: Record<string, { throughputPerSec: number }>;
}

interface SimulationActions {
  // Lifecycle
  start: () => void;
  stop: () => void;
  reset: () => void;

  // Packet mutations — called by SimulationEngine only
  applySimulationDiff: (diff: {
    newPackets: Packet[];
    progressUpdates: Map<string, number>;
    arrivedIds: string[];
    droppedIds: string[];
    queuedIds: string[];
    processingIds: string[];
  }) => void;
  addPacket: (packet: Packet) => void;
  updatePacketProgress: (id: string, progress: number) => void;
  markPacketArrived: (id: string) => void;
  markPacketDropped: (id: string) => void;
  markPacketQueued: (id: string) => void;
  markPacketProcessing: (id: string) => void;
  pruneFinishedPackets: () => void;

  // Config
  setConfig: (config: Partial<TrafficConfig>) => void;
  setRoutingStrategy: (strategy: RoutingStrategyKind) => void;

  // Gateways
  setGatewayState: (state: GatewayRuntimeState) => void;
  clearGatewayState: (gatewayId: string) => void;

  // Node metrics
  setNodeMetrics: (metrics: Record<string, NodeMetrics>) => void;
  setEdgeMetrics: (metrics: Record<string, { throughputPerSec: number }>) => void;
}

type SimulationStore = SimulationState & SimulationActions;

// ─────────────────────────────────────────────
// Defaults
// ─────────────────────────────────────────────

const DEFAULT_CONFIG: TrafficConfig = {
  packetsPerSecond: 1,
  routingStrategy: "roundRobin",
  sourceNodeIds: [],
  requestTimeoutMs: 5000,
  maxRetries: 0,
  trafficProfile: "constant",
};

const DEFAULT_STATS: SimulationStats = {
  totalSent: 0,
  totalArrived: 0,
  totalDropped: 0,
  avgLatencyMs: 0,
  _latencyBuffer: [],
};

const ROLLING_WINDOW = 60;

// ─────────────────────────────────────────────
// Store
// ─────────────────────────────────────────────

export const useSimulationStore = create<SimulationStore>()(
  subscribeWithSelector(
    immer((set) => ({
      packets: {},
      isRunning: false,
      config: DEFAULT_CONFIG,
      stats: { ...DEFAULT_STATS },
      gatewayStates: {},
      nodeMetrics: {},
      edgeMetrics: {},

      start: () =>
        set((s) => {
          s.isRunning = true;
        }),

      stop: () =>
        set((s) => {
          s.isRunning = false;
        }),

      reset: () =>
        set((s) => {
          s.packets = {};
          s.isRunning = false;
          s.stats = { ...DEFAULT_STATS };
          s.gatewayStates = {};
          s.nodeMetrics = {};
          s.edgeMetrics = {};
        }),

      applySimulationDiff: (diff) =>
        set((s) => {
          // 1. New packets
          for (const p of diff.newPackets) {
            s.packets[p.id] = p;
            s.stats.totalSent += 1;
          }

          // 2. Progress updates
          for (const [id, progress] of diff.progressUpdates) {
            const p = s.packets[id];
            if (p && p.status === "traveling") p.progress = progress;
          }

          // 3. Arrived
          const now = performance.now();
          for (const id of diff.arrivedIds) {
            const p = s.packets[id];
            if (!p) continue;
            p.status = "arrived";
            p.progress = 1;
            
            const latency = now - p.createdAt;
            s.stats.totalArrived += 1;
            s.stats._latencyBuffer.push(latency);
          }
          // Fix latency rolling window if arrived added any
          if (diff.arrivedIds.length > 0) {
            while (s.stats._latencyBuffer.length > ROLLING_WINDOW) {
              s.stats._latencyBuffer.shift();
            }
            const sum = s.stats._latencyBuffer.reduce((a, b) => a + b, 0);
            s.stats.avgLatencyMs = sum / s.stats._latencyBuffer.length || 0;
          }

          // 4. Dropped
          for (const id of diff.droppedIds) {
            const p = s.packets[id];
            if (!p) continue;
            p.status = "dropped";
            s.stats.totalDropped += 1;
          }

          // 5. Queued
          for (const id of diff.queuedIds) {
            const p = s.packets[id];
            if (p) p.status = "queued";
          }

          // 6. Processing
          for (const id of diff.processingIds) {
            const p = s.packets[id];
            if (p) p.status = "processing";
          }
        }),

      addPacket: (packet) =>
        set((s) => {
          s.packets[packet.id] = packet;
          s.stats.totalSent += 1;
        }),

      updatePacketProgress: (id, progress) =>
        set((s) => {
          const p = s.packets[id];
          if (p && p.status === "traveling") p.progress = progress;
        }),

      markPacketArrived: (id) =>
        set((s) => {
          const p = s.packets[id];
          if (!p) return;
          p.status = "arrived";
          p.progress = 1;

          const latency = performance.now() - p.createdAt;
          s.stats.totalArrived += 1;
          s.stats._latencyBuffer.push(latency);
          if (s.stats._latencyBuffer.length > ROLLING_WINDOW) {
            s.stats._latencyBuffer.shift();
          }
          const sum = s.stats._latencyBuffer.reduce((a, b) => a + b, 0);
          s.stats.avgLatencyMs = sum / s.stats._latencyBuffer.length;
        }),

      markPacketDropped: (id) =>
        set((s) => {
          const p = s.packets[id];
          if (!p) return;
          p.status = "dropped";
          s.stats.totalDropped += 1;
        }),

      markPacketQueued: (id) =>
        set((s) => {
          const p = s.packets[id];
          if (p) p.status = "queued";
        }),

      markPacketProcessing: (id) =>
        set((s) => {
          const p = s.packets[id];
          if (p) p.status = "processing";
        }),

      pruneFinishedPackets: () =>
        set((s) => {
          for (const id of Object.keys(s.packets)) {
            const status = s.packets[id].status;
            if (status === "arrived" || status === "dropped") {
              delete s.packets[id];
            }
          }
        }),

      setConfig: (partial) =>
        set((s) => {
          Object.assign(s.config, partial);
        }),

      setRoutingStrategy: (strategy) =>
        set((s) => {
          s.config.routingStrategy = strategy;
        }),

      setGatewayState: (gs) =>
        set((s) => {
          s.gatewayStates[gs.gatewayId] = gs;
        }),

      clearGatewayState: (id) =>
        set((s) => {
          delete s.gatewayStates[id];
        }),

      setNodeMetrics: (metrics) =>
        set((s) => {
          s.nodeMetrics = metrics;
        }),

      setEdgeMetrics: (metrics) =>
        set((s) => {
          s.edgeMetrics = metrics;
        }),
    }))
  )
);

// ─────────────────────────────────────────────
// Selectors
// ─────────────────────────────────────────────

export const selectPackets = (s: SimulationStore) => s.packets;
export const selectIsRunning = (s: SimulationStore) => s.isRunning;
export const selectConfig = (s: SimulationStore) => s.config;
export const selectStats = (s: SimulationStore) => s.stats;
export const selectGatewayStates = (s: SimulationStore) => s.gatewayStates;