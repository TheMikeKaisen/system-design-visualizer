import { describe, it, expect, beforeEach } from "vitest";
import { useObservabilityStore } from "../useObservabilityStore";
import type { SimulationDataPoint } from "@/types";

function makePoint(overrides: Partial<SimulationDataPoint> = {}): SimulationDataPoint {
  return {
    ts: Date.now(), packetsPerSec: 10, activePackets: 5,
    avgLatencyMs: 50, dropRatePct: 0, gatewayStates: {},
    ...overrides,
  };
}

describe("useObservabilityStore", () => {
  beforeEach(() => {
    useObservabilityStore.setState({
      dataPoints: [], isRecording: false,
      activeRecording: null, recordings: [],
    });
  });

  describe("pushDataPoint", () => {
    it("adds data points to rolling buffer", () => {
      useObservabilityStore.getState().pushDataPoint(makePoint());
      expect(useObservabilityStore.getState().dataPoints).toHaveLength(1);
    });

    it("caps buffer at 120 points", () => {
      const { pushDataPoint } = useObservabilityStore.getState();
      for (let i = 0; i < 130; i++) pushDataPoint(makePoint({ ts: Date.now() + i }));
      expect(useObservabilityStore.getState().dataPoints).toHaveLength(120);
    });

    it("drops oldest point when over limit", () => {
      const { pushDataPoint } = useObservabilityStore.getState();
      pushDataPoint(makePoint({ packetsPerSec: 999 })); // oldest
      for (let i = 0; i < 120; i++) pushDataPoint(makePoint());
      const points = useObservabilityStore.getState().dataPoints;
      expect(points[0].packetsPerSec).not.toBe(999); // oldest dropped
    });
  });

  describe("recording", () => {
    it("startRecording sets isRecording=true", () => {
      useObservabilityStore.getState().startRecording("diag-1");
      expect(useObservabilityStore.getState().isRecording).toBe(true);
      expect(useObservabilityStore.getState().activeRecording).not.toBeNull();
    });

    it("stopRecording saves to recordings array", () => {
      useObservabilityStore.getState().startRecording("diag-1");
      useObservabilityStore.getState().pushDataPoint(makePoint());
      useObservabilityStore.getState().stopRecording();

      const state = useObservabilityStore.getState();
      expect(state.isRecording).toBe(false);
      expect(state.activeRecording).toBeNull();
      expect(state.recordings).toHaveLength(1);
      expect(state.recordings[0].endedAt).not.toBeNull();
    });

    it("updates peak values during recording", () => {
      useObservabilityStore.getState().startRecording("diag-1");
      useObservabilityStore.getState().pushDataPoint(makePoint({ packetsPerSec: 50 }));
      useObservabilityStore.getState().pushDataPoint(makePoint({ packetsPerSec: 100 }));
      useObservabilityStore.getState().pushDataPoint(makePoint({ packetsPerSec: 75 }));

      const rec = useObservabilityStore.getState().activeRecording;
      expect(rec?.peaks.maxPacketsPerSec).toBe(100);
    });

    it("deleteRecording removes the recording", () => {
      useObservabilityStore.getState().startRecording("diag-1");
      useObservabilityStore.getState().stopRecording();
      const id = useObservabilityStore.getState().recordings[0].id;

      useObservabilityStore.getState().deleteRecording(id);
      expect(useObservabilityStore.getState().recordings).toHaveLength(0);
    });
  });

  describe("clearHistory", () => {
    it("empties data points", () => {
      useObservabilityStore.getState().pushDataPoint(makePoint());
      useObservabilityStore.getState().clearHistory();
      expect(useObservabilityStore.getState().dataPoints).toHaveLength(0);
    });
  });
});
