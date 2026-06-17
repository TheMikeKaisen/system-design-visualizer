import { create }                  from "zustand";
import { subscribeWithSelector }   from "zustand/middleware";
import { immer }                   from "zustand/middleware/immer";
import type { SimulationDataPoint, SimulationRecording } from "@/types";
import { nanoid } from "nanoid";

// ─────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────

/** How many data points to keep in the rolling buffer (60 = 1 minute) */
const ROLLING_WINDOW = 120;

// ─────────────────────────────────────────────
// Shape
// ─────────────────────────────────────────────

interface ObservabilityState {
  /** Rolling buffer of data points — last ROLLING_WINDOW seconds */
  dataPoints:       SimulationDataPoint[];
  /** True while actively recording */
  isRecording:      boolean;
  /** The in-progress recording (not yet saved) */
  activeRecording:  SimulationRecording | null;
  /** Saved recordings for this session */
  recordings:       SimulationRecording[];
}

interface ObservabilityActions {
  /** Called once per second by the metrics collector */
  pushDataPoint:   (point: SimulationDataPoint) => void;
  startRecording:  (diagramId: string) => void;
  stopRecording:   () => void;
  clearHistory:    () => void;
  deleteRecording: (id: string) => void;
}

type ObservabilityStore = ObservabilityState & ObservabilityActions;

// ─────────────────────────────────────────────
// Store
// ─────────────────────────────────────────────

export const useObservabilityStore = create<ObservabilityStore>()(
  subscribeWithSelector(
    immer((set) => ({
      dataPoints:      [],
      isRecording:     false,
      activeRecording: null,
      recordings:      [],

      pushDataPoint: (point) =>
        set((s) => {
          // Rolling buffer — drop oldest if over limit
          s.dataPoints.push(point);
          if (s.dataPoints.length > ROLLING_WINDOW) {
            s.dataPoints.shift();
          }

          // If recording, append to active recording too
          if (s.isRecording && s.activeRecording) {
            s.activeRecording.dataPoints.push(point);

            // Update peaks
            const p = s.activeRecording.peaks;
            if (point.packetsPerSec > p.maxPacketsPerSec)
              p.maxPacketsPerSec = point.packetsPerSec;
            if (point.avgLatencyMs > p.maxLatencyMs)
              p.maxLatencyMs = point.avgLatencyMs;
            if (point.dropRatePct > p.maxDropRatePct)
              p.maxDropRatePct = point.dropRatePct;
          }
        }),

      startRecording: (diagramId) =>
        set((s) => {
          s.isRecording     = true;
          s.activeRecording = {
            id:         nanoid(),
            diagramId,
            startedAt:  Date.now(),
            endedAt:    null,
            dataPoints: [],
            peaks: {
              maxPacketsPerSec: 0,
              maxLatencyMs:     0,
              maxDropRatePct:   0,
            },
          };
        }),

      stopRecording: () =>
        set((s) => {
          if (!s.activeRecording) return;
          s.activeRecording.endedAt = Date.now();
          s.recordings.push(s.activeRecording);
          s.activeRecording = null;
          s.isRecording     = false;
        }),

      clearHistory: () =>
        set((s) => {
          s.dataPoints = [];
        }),

      deleteRecording: (id) =>
        set((s) => {
          s.recordings = s.recordings.filter((r) => r.id !== id);
        }),
    }))
  )
);

// ─────────────────────────────────────────────
// Selectors
// ─────────────────────────────────────────────

export const selectDataPoints    = (s: ObservabilityStore) => s.dataPoints;
export const selectIsRecording   = (s: ObservabilityStore) => s.isRecording;
export const selectRecordings    = (s: ObservabilityStore) => s.recordings;
export const selectActiveRecording = (s: ObservabilityStore) => s.activeRecording;
