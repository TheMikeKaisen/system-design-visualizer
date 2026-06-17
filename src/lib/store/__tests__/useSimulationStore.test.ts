import { describe, it, expect, beforeEach } from "vitest";
import { useSimulationStore } from "../useSimulationStore";
import type { Packet } from "@/types";

describe("useSimulationStore", () => {
  beforeEach(() => {
    useSimulationStore.getState().reset();
  });

  it("should have initial state", () => {
    const state = useSimulationStore.getState();
    expect(state.isRunning).toBe(false);
    expect(state.stats.totalSent).toBe(0);
    expect(Object.keys(state.packets).length).toBe(0);
  });

  it("can start and stop", () => {
    useSimulationStore.getState().start();
    expect(useSimulationStore.getState().isRunning).toBe(true);
    useSimulationStore.getState().stop();
    expect(useSimulationStore.getState().isRunning).toBe(false);
  });

  it("can add a packet", () => {
    const packet: Packet = {
      id: "p1",
      sourceId: "s1",
      targetId: "t1",
      progress: 0,
      status: "traveling",
      createdAt: performance.now(),
    };
    useSimulationStore.getState().addPacket(packet);
    const state = useSimulationStore.getState();
    expect(state.packets["p1"]).toBeDefined();
    expect(state.stats.totalSent).toBe(1);
  });

  it("can update packet progress", () => {
    const packet: Packet = {
      id: "p1",
      sourceId: "s1",
      targetId: "t1",
      progress: 0,
      status: "traveling",
      createdAt: performance.now(),
    };
    useSimulationStore.getState().addPacket(packet);
    useSimulationStore.getState().updatePacketProgress("p1", 0.5);
    expect(useSimulationStore.getState().packets["p1"].progress).toBe(0.5);
  });

  it("can mark a packet as arrived", () => {
    const packet: Packet = {
      id: "p1",
      sourceId: "s1",
      targetId: "t1",
      progress: 0,
      status: "traveling",
      createdAt: performance.now(),
    };
    useSimulationStore.getState().addPacket(packet);
    useSimulationStore.getState().markPacketArrived("p1");
    const state = useSimulationStore.getState();
    expect(state.packets["p1"].status).toBe("arrived");
    expect(state.packets["p1"].progress).toBe(1);
    expect(state.stats.totalArrived).toBe(1);
    expect(state.stats._latencyBuffer.length).toBe(1);
  });

  it("can mark a packet as dropped", () => {
    const packet: Packet = {
      id: "p1",
      sourceId: "s1",
      targetId: "t1",
      progress: 0,
      status: "traveling",
      createdAt: performance.now(),
    };
    useSimulationStore.getState().addPacket(packet);
    useSimulationStore.getState().markPacketDropped("p1");
    const state = useSimulationStore.getState();
    expect(state.packets["p1"].status).toBe("dropped");
    expect(state.stats.totalDropped).toBe(1);
  });

  it("can prune finished packets", () => {
    const p1: Packet = {
      id: "p1",
      sourceId: "s1",
      targetId: "t1",
      progress: 0,
      status: "traveling",
      createdAt: performance.now(),
    };
    const p2: Packet = {
      id: "p2",
      sourceId: "s1",
      targetId: "t1",
      progress: 0,
      status: "traveling",
      createdAt: performance.now(),
    };
    useSimulationStore.getState().addPacket(p1);
    useSimulationStore.getState().addPacket(p2);
    
    useSimulationStore.getState().markPacketArrived("p1");
    useSimulationStore.getState().pruneFinishedPackets();
    
    const state = useSimulationStore.getState();
    expect(state.packets["p1"]).toBeUndefined();
    expect(state.packets["p2"]).toBeDefined(); // Still traveling
  });

  it("can set config", () => {
    useSimulationStore.getState().setConfig({ packetsPerSecond: 10 });
    expect(useSimulationStore.getState().config.packetsPerSecond).toBe(10);
    
    useSimulationStore.getState().setRoutingStrategy("leastConnections");
    expect(useSimulationStore.getState().config.routingStrategy).toBe("leastConnections");
  });

  it("can manage gateway state", () => {
    useSimulationStore.getState().setGatewayState({
      gatewayId: "g1",
      cbState: "CLOSED",
      cbFailures: 0,
      cbShedCount: 0,
      rateLimiterFillPct: 50,
      recentAudit: []
    });
    
    expect(useSimulationStore.getState().gatewayStates["g1"]).toBeDefined();
    
    useSimulationStore.getState().clearGatewayState("g1");
    expect(useSimulationStore.getState().gatewayStates["g1"]).toBeUndefined();
  });
});
