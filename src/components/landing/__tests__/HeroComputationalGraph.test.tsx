import { describe, it, expect, vi, beforeEach } from "vitest";
import { render } from "@testing-library/react";
import { HeroComputationalGraph, CANONICAL_NODES } from "../HeroComputationalGraph";

beforeEach(() => {
  window.matchMedia = vi.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  }));
});

describe("HeroComputationalGraph", () => {
  it("exports canonical nodes configuration matching architecture specification", () => {
    expect(CANONICAL_NODES).toHaveLength(7);

    const ids = CANONICAL_NODES.map((n) => n.id);
    expect(ids).toEqual([
      "CLIENT",
      "INGRESS",
      "LOAD_BALANCER",
      "APP_SERVICE_A",
      "APP_SERVICE_B",
      "APP_CACHE",
      "DATABASE",
    ]);

    for (const node of CANONICAL_NODES) {
      expect(node.cx).toBeGreaterThan(0);
      expect(node.cy).toBeGreaterThan(0);
      expect(node.iconType).toBeTruthy();
      expect(node.colorClass).toMatch(/text-/);
    }

    const db = CANONICAL_NODES.find((n) => n.id === "DATABASE");
    expect(db?.colorClass).toMatch(/amber/);

    const serviceA = CANONICAL_NODES.find((n) => n.id === "APP_SERVICE_A");
    expect(serviceA?.iconType).toBe("server");
    const database = CANONICAL_NODES.find((n) => n.id === "DATABASE");
    expect(database?.iconType).toBe("database");
  });

  it("renders computational network SVG with all canonical nodes and connections", () => {
    const { container } = render(<HeroComputationalGraph />);

    const svg = container.querySelector("svg");
    expect(svg).not.toBeNull();

    expect(container.querySelector("#conn-c01")).not.toBeNull();
    expect(container.querySelector("#conn-c02")).not.toBeNull();
    expect(container.querySelector("#conn-c03")).not.toBeNull();
    expect(container.querySelector("#conn-c04")).not.toBeNull();
    expect(container.querySelector("#conn-c05")).not.toBeNull();
    expect(container.querySelector("#conn-c06")).not.toBeNull();
    expect(container.querySelector("#conn-c07")).not.toBeNull();
    expect(container.querySelector("#conn-c08")).not.toBeNull();

    expect(container.querySelector("#hcg-arrow-teal")).not.toBeNull();
    expect(container.querySelector("#hcg-arrow-cyan")).not.toBeNull();
    expect(container.querySelector("#hcg-arrow-amber")).not.toBeNull();

    const canonicalIds = [
      "CLIENT", "INGRESS", "LOAD_BALANCER",
      "APP_SERVICE_A", "APP_SERVICE_B", "APP_CACHE", "DATABASE",
    ];
    for (const nodeId of canonicalIds) {
      expect(container.querySelector(`[data-node-id="${nodeId}"]`)).not.toBeNull();
    }

    const textElements = container.querySelectorAll("text");
    expect(textElements.length).toBe(7);

    const packets = container.querySelectorAll("animateMotion");
    expect(packets.length).toBeGreaterThanOrEqual(16);
  });

  it("handles reduced-motion gracefully — omits animateMotion packets", () => {
    window.matchMedia = vi.fn().mockImplementation((query) => ({
      matches: query.includes("prefers-reduced-motion"),
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }));

    const { container } = render(<HeroComputationalGraph />);
    expect(container.querySelector("svg")).not.toBeNull();
    expect(container.querySelectorAll("animateMotion").length).toBe(0);
  });

  it("does not render any large framing ellipse around the headline", () => {
    const { container } = render(<HeroComputationalGraph />);
    const ellipses = Array.from(container.querySelectorAll("ellipse"));
    for (const el of ellipses) {
      const ry = parseFloat(el.getAttribute("ry") ?? "0");
      expect(ry).toBeLessThanOrEqual(10);
    }
  });

  it("ensures all canonical nodes strictly avoid the central hero text corridor", () => {
    // The central headline & CTA corridor spans x: 200–1080 and y: 120–480.
    for (const node of CANONICAL_NODES) {
      const inCorridorX = node.cx >= 200 && node.cx <= 1080;
      const inCorridorY = node.cy >= 120 && node.cy <= 480;
      const overlapsTextCorridor = inCorridorX && inCorridorY;
      expect(overlapsTextCorridor).toBe(false);
    }
  });
});

