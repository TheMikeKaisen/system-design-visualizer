import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { SimulationEngine } from "../SimulationEngine";
import { computePathMetrics } from "../coordinateBridge";
import type { Packet } from "@/types";
import { createNode } from "@/components/nodes/NodeFactory";

function travelingPacket(id: string, progress = 0.5): Packet {
  return {
    id,
    sourceId: "src-1",
    targetId: "svc-1",
    progress,
    status: "traveling",
    protocol: "HTTP",
    sizeBytes: 512,
    createdAt: 1000,
    color: 0x378add,
  };
}

describe("SimulationEngine — pure tick", () => {
  let engine: SimulationEngine;
  const onPathReady = vi.fn();

  beforeEach(() => {
    engine = new SimulationEngine("roundRobin", onPathReady);
  });

  afterEach(() => {
    engine.destroy();
    onPathReady.mockClear();
  });

  it("returns empty diff when no packets exist", () => {
    const result = engine.tick(16, {}, new Map(), [], [], {
      packetsPerSecond: 0,
      routingStrategy: "roundRobin",
      sourceNodeIds: [],
    });
    expect(result.newPackets).toHaveLength(0);
    expect(result.progressUpdates.size).toBe(0);
    expect(result.arrivedIds).toHaveLength(0);
    expect(result.droppedIds).toHaveLength(0);
  });

  it("advances a traveling packet's progress", () => {
    const packet = travelingPacket("p1", 0);
    const metrics = computePathMetrics([{ x: 0, y: 0 }, { x: 1000, y: 0 }]);
    const metricsMap = new Map([["p1", metrics]]);

    const result = engine.tick(16, { p1: packet }, metricsMap, [], [], {
      packetsPerSecond: 0,
      routingStrategy: "roundRobin",
      sourceNodeIds: [],
    });

    expect(result.progressUpdates.has("p1")).toBe(true);
    expect(result.progressUpdates.get("p1")!).toBeGreaterThan(0);
  });

  it("marks packet as arrived when progress reaches 1", () => {
    const packet = travelingPacket("p1", 0.999);
    const metrics = computePathMetrics([{ x: 0, y: 0 }, { x: 1, y: 0 }]);
    const metricsMap = new Map([["p1", metrics]]);

    const result = engine.tick(1000, { p1: packet }, metricsMap, [], [], {
      packetsPerSecond: 0,
      routingStrategy: "roundRobin",
      sourceNodeIds: [],
    });

    expect(result.arrivedIds).toContain("p1");
    expect(result.progressUpdates.has("p1")).toBe(false);
  });

  it("skips non-traveling packets", () => {
    const arrived: Packet = { ...travelingPacket("p1"), status: "arrived" };
    const result = engine.tick(16, { p1: arrived }, new Map(), [], [], {
      packetsPerSecond: 0,
      routingStrategy: "roundRobin",
      sourceNodeIds: [],
    });
    expect(result.progressUpdates.size).toBe(0);
    expect(result.arrivedIds).toHaveLength(0);
  });

  it("skips packet with no path metrics (worker not yet responded)", () => {
    const packet = travelingPacket("p1");
    const result = engine.tick(16, { p1: packet }, new Map(), [], [], {
      packetsPerSecond: 0,
      routingStrategy: "roundRobin",
      sourceNodeIds: [],
    });
    expect(result.progressUpdates.size).toBe(0);
  });

  it("does not spawn packets when isRunning-equivalent config has empty sources", () => {
    const result = engine.tick(16, {}, new Map(), [], [], {
      packetsPerSecond: 10,
      routingStrategy: "roundRobin",
      sourceNodeIds: [], // no sources
    });
    expect(result.newPackets).toHaveLength(0);
  });
});