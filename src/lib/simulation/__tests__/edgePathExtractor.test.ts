import { describe, it, expect, vi, beforeEach } from "vitest";
import { extractEdgePath, extractMultiEdgePath } from "../edgePathExtractor";
import type { ViewportTransform } from "@/types";

describe("edgePathExtractor", () => {
  let mockPathEl: any;
  const viewport: ViewportTransform = { x: 0, y: 0, zoom: 1 };
  const fallback = { from: { x: 0, y: 0 }, to: { x: 100, y: 100 } };

  beforeEach(() => {
    mockPathEl = {
      getTotalLength: vi.fn().mockReturnValue(100),
      getPointAtLength: vi.fn().mockImplementation((dist: number) => ({ x: dist, y: dist })),
    };

    // Setup global document mock
    global.document = {
      querySelector: vi.fn().mockImplementation((selector: string) => {
        if (selector.includes("e1")) return mockPathEl;
        return null;
      }),
    } as any;
    
    // Mock SVGPathElement instance check
    global.SVGPathElement = function() {} as any;
    Object.setPrototypeOf(mockPathEl, SVGPathElement.prototype);
  });

  it("should use fallback when path element is not found", () => {
    const result = extractEdgePath("non-existent", viewport, fallback);
    expect(result.fromSvg).toBe(false);
    expect(result.waypoints).toEqual([fallback.from, fallback.to]);
  });

  it("should use fallback when path totalLength is 0", () => {
    mockPathEl.getTotalLength.mockReturnValue(0);
    const result = extractEdgePath("e1", viewport, fallback);
    expect(result.fromSvg).toBe(false);
    expect(result.waypoints).toEqual([fallback.from, fallback.to]);
  });

  it("should extract waypoints from SVG path", () => {
    const result = extractEdgePath("e1", viewport, fallback);
    expect(result.fromSvg).toBe(true);
    expect(result.waypoints.length).toBe(21); // SAMPLE_COUNT + 1
    expect(result.waypoints[0]).toEqual({ x: 0, y: 0 });
    expect(result.waypoints[20]).toEqual({ x: 100, y: 100 });
  });

  describe("extractMultiEdgePath", () => {
    it("should return empty array for no edges", () => {
      expect(extractMultiEdgePath([], viewport, [], [])).toEqual([]);
    });

    it("should extract paths for multiple edges and stitch them together", () => {
      const mockPathEl2 = {
        getTotalLength: vi.fn().mockReturnValue(100),
        getPointAtLength: vi.fn().mockImplementation((dist: number) => ({ x: dist + 100, y: dist + 100 })),
      };
      Object.setPrototypeOf(mockPathEl2, SVGPathElement.prototype);

      global.document.querySelector = vi.fn().mockImplementation((selector: string) => {
        if (selector.includes("e1")) return mockPathEl;
        if (selector.includes("e2")) return mockPathEl2;
        return null;
      });

      const nodes = [
        { id: "n1", position: { x: -90, y: -30 }, measured: { width: 180, height: 60 } },
        { id: "n2", position: { x: 10, y: 70 } }, // test without measured
        { id: "n3", position: { x: 110, y: 170 } }
      ];

      const edges = [
        { id: "e1", source: "n1", target: "n2" },
        { id: "e2", source: "n2", target: "n3" }
      ];

      const waypoints = extractMultiEdgePath(["e1", "e2"], viewport, nodes, edges);
      
      // 21 points for e1 + 20 points for e2 (first skipped)
      expect(waypoints.length).toBe(41);
      expect(waypoints[0]).toEqual({ x: 0, y: 0 }); // start of e1
      expect(waypoints[20]).toEqual({ x: 100, y: 100 }); // end of e1
      expect(waypoints[21]).toEqual({ x: 105, y: 105 }); // second point of e2
      expect(waypoints[40]).toEqual({ x: 200, y: 200 }); // end of e2
    });
    
    it("should handle missing edge definitions gracefully", () => {
      const nodes = [{ id: "n1", position: { x: 0, y: 0 } }, { id: "n2", position: { x: 100, y: 100 } }];
      const edges = [{ id: "e1", source: "n1", target: "n2" }];
      
      const waypoints = extractMultiEdgePath(["e1", "missing-edge"], viewport, nodes, edges);
      expect(waypoints.length).toBe(21); // Only extracted e1
    });
  });
});
