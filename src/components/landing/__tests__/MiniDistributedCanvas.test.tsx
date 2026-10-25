import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, act } from "@testing-library/react";
import { MiniDistributedCanvas } from "../MiniDistributedCanvas";

describe("MiniDistributedCanvas", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("renders the canvas telemetry HUD and initial topology nodes", () => {
    render(<MiniDistributedCanvas />);

    expect(screen.getByRole("region", { name: /Miniature Distributed Architecture Canvas Preview/i })).toBeDefined();
    expect(screen.getByText("Cluster Status:")).toBeDefined();
    expect(screen.getByText("Healthy")).toBeDefined();

    expect(screen.getAllByText("Web Client").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("Load Balancer").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("Order Service").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("Redis Cache").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("Kafka Event Stream").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("PostgreSQL Primary").length).toBeGreaterThanOrEqual(1);
  });

  it("allows selecting nodes to inspect their telemetry and role", () => {
    render(<MiniDistributedCanvas />);

    const redisBtn = screen.getByRole("button", { name: /Redis Cache/i });
    fireEvent.click(redisBtn);

    expect(screen.getByText("Sub-millisecond read layer absorbing high-frequency queries")).toBeDefined();
    expect(screen.getByText("94.2%")).toBeDefined();
  });

  it("triggers a simulated request packet flow through the topology", () => {
    render(<MiniDistributedCanvas />);

    const sendBtn = screen.getByRole("button", { name: /Send Request/i });
    fireEvent.click(sendBtn);

    // Initial phase client -> lb
    expect(screen.getByText(/DISPATCH: GET \/orders/i)).toBeDefined();

    // Advance timer to next phase: lb -> service
    act(() => {
      vi.advanceTimersByTime(650);
    });

    expect(screen.getByText(/ROUTING: Round-Robin/i)).toBeDefined();
  });

  it("toggles continuous traffic simulation", () => {
    render(<MiniDistributedCanvas />);

    const toggleBtn = screen.getByRole("button", { name: /Simulate Stream/i });
    fireEvent.click(toggleBtn);

    expect(screen.getByText("Simulating Traffic")).toBeDefined();

    // Toggle off
    fireEvent.click(toggleBtn);
    expect(screen.getByText("Simulate Stream")).toBeDefined();
  });

  it("contains a direct link to open the Canvas Studio", () => {
    render(<MiniDistributedCanvas />);

    const studioLink = screen.getByRole("link", { name: /Build a System in Canvas Studio/i });
    expect(studioLink.getAttribute("href")).toBe("/canvas");
  });
});
