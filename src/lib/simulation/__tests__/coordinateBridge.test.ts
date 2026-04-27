import { describe, it, expect } from "vitest";
import {
  computePathMetrics,
  interpolatePath,
  deltaProgress,
} from "../coordinateBridge";

describe("computePathMetrics", () => {
  it("handles empty waypoints array", () => {
    const m = computePathMetrics([]);
    expect(m.totalLength).toBe(0);
    expect(m.segmentLengths).toHaveLength(0);
  });

  it("handles single waypoint", () => {
    const m = computePathMetrics([{ x: 10, y: 10 }]);
    expect(m.totalLength).toBe(0);
  });

  it("computes correct length for horizontal segment", () => {
    const m = computePathMetrics([{ x: 0, y: 0 }, { x: 100, y: 0 }]);
    expect(m.totalLength).toBeCloseTo(100);
    expect(m.segmentLengths).toHaveLength(1);
  });

  it("computes correct total for multi-segment path", () => {
    const m = computePathMetrics([
      { x: 0, y: 0 },
      { x: 100, y: 0 },
      { x: 100, y: 100 },
    ]);
    expect(m.totalLength).toBeCloseTo(200);
    expect(m.segmentLengths).toHaveLength(2);
  });

  it("handles zero-length segments (overlapping waypoints)", () => {
    const m = computePathMetrics([{ x: 5, y: 5 }, { x: 5, y: 5 }]);
    expect(m.totalLength).toBe(0);
  });
});

describe("interpolatePath", () => {
  it("returns start point at progress=0", () => {
    const m = computePathMetrics([{ x: 0, y: 0 }, { x: 100, y: 0 }]);
    const p = interpolatePath(m, 0);
    expect(p.x).toBeCloseTo(0);
    expect(p.y).toBeCloseTo(0);
  });

  it("returns end point at progress=1", () => {
    const m = computePathMetrics([{ x: 0, y: 0 }, { x: 100, y: 0 }]);
    const p = interpolatePath(m, 1);
    expect(p.x).toBeCloseTo(100);
    expect(p.y).toBeCloseTo(0);
  });

  it("returns midpoint at progress=0.5", () => {
    const m = computePathMetrics([{ x: 0, y: 0 }, { x: 100, y: 0 }]);
    const p = interpolatePath(m, 0.5);
    expect(p.x).toBeCloseTo(50);
  });

  it("clamps progress below 0", () => {
    const m = computePathMetrics([{ x: 0, y: 0 }, { x: 100, y: 0 }]);
    const p = interpolatePath(m, -0.5);
    expect(p.x).toBeCloseTo(0);
  });

  it("clamps progress above 1", () => {
    const m = computePathMetrics([{ x: 0, y: 0 }, { x: 100, y: 0 }]);
    const p = interpolatePath(m, 1.5);
    expect(p.x).toBeCloseTo(100);
  });

  it("handles empty waypoints gracefully", () => {
    const m = computePathMetrics([]);
    const p = interpolatePath(m, 0.5);
    expect(p).toEqual({ x: 0, y: 0 });
  });

  it("crosses segment boundary correctly at multi-segment path", () => {
    const m = computePathMetrics([
      { x: 0, y: 0 },
      { x: 100, y: 0 },
      { x: 100, y: 100 },
    ]);
    // progress=0.5 should be at the midpoint of total length=200 → dist=100 → end of first segment
    const p = interpolatePath(m, 0.5);
    expect(p.x).toBeCloseTo(100);
    expect(p.y).toBeCloseTo(0);
  });

  it("handles zero-length path without dividing by zero", () => {
    const m = computePathMetrics([{ x: 5, y: 5 }, { x: 5, y: 5 }]);
    const p = interpolatePath(m, 0.5);
    expect(p).toEqual({ x: 5, y: 5 });
  });
});

describe("deltaProgress", () => {
  it("returns 1 for zero-length path (packet teleports)", () => {
    expect(deltaProgress(16, 180, 0)).toBe(1);
  });

  it("computes correct fractional progress", () => {
    // 180px/s, 1000ms delta, 180px path → should complete in exactly 1 tick
    expect(deltaProgress(1000, 180, 180)).toBeCloseTo(1);
  });

  it("returns small delta for large path", () => {
    // 180px/s, 16ms (60fps), 1800px path → 0.16% per frame
    expect(deltaProgress(16, 180, 1800)).toBeCloseTo(0.0016);
  });
});