import { create } from "zustand";
import { subscribeWithSelector } from "zustand/middleware";
import { immer } from "zustand/middleware/immer";
import type { Packet, RoutingStrategyKind } from "@/types";

// ─────────────────────────────────────────────
// Sub-types
// ─────────────────────────────────────────────

export interface TrafficConfig {
  /** Packets spawned per second, per active source node */
  packetsPerSecond: number;
  routingStrategy: RoutingStrategyKind;
  /** IDs of nodes that actively generate outbound traffic */
  sourceNodeIds: string[];
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
}

interface SimulationActions {
  // Lifecycle
  start: () => void;
  stop: () => void;
  reset: () => void;

  // Packet mutations — called by SimulationEngine only
  addPacket: (packet: Packet) => void;
  updatePacketProgress: (id: string, progress: number) => void;
  markPacketArrived: (id: string) => void;
  markPacketDropped: (id: string) => void;
  pruneFinishedPackets: () => void;

  // Config
  setConfig: (config: Partial<TrafficConfig>) => void;
  setRoutingStrategy: (strategy: RoutingStrategyKind) => void;
}

type SimulationStore = SimulationState & SimulationActions;

// ─────────────────────────────────────────────
// Defaults
// ─────────────────────────────────────────────

const DEFAULT_CONFIG: TrafficConfig = {
  packetsPerSecond: 2,
  routingStrategy: "roundRobin",
  sourceNodeIds: [],
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

      /**
       * Batch-remove arrived/dropped packets. Call once per second,
       * not every frame — we want the visual to linger briefly.
       */
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