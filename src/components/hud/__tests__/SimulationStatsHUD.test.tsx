import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { SimulationStatsHUD } from "../SimulationStatsHUD";
import { useSimulationStore } from "@/lib/store/useSimulationStore";

vi.mock("@/lib/store/useSimulationStore");

describe("SimulationStatsHUD", () => {
  beforeEach(() => {
    vi.mocked(useSimulationStore).mockReturnValue({
      isRunning: false,
      packets: {},
      stats: {
        totalSent: 0,
        totalArrived: 0,
        totalDropped: 0,
        avgLatencyMs: 0,
        _latencyBuffer: [],
      },
    } as any);
  });

  it("renders stopped state correctly", () => {
    render(<SimulationStatsHUD />);
    expect(screen.getByText("stopped")).toBeInTheDocument();
  });

  it("renders running state correctly", () => {
    vi.mocked(useSimulationStore).mockReturnValue({
      isRunning: true,
      packets: {},
      stats: { totalSent: 42, totalArrived: 40, totalDropped: 2, avgLatencyMs: 123, _latencyBuffer: [] },
    } as any);
    render(<SimulationStatsHUD />);
    expect(screen.getByText("running")).toBeInTheDocument();
    expect(screen.getByText("42")).toBeInTheDocument();   // sent
    expect(screen.getByText("123ms")).toBeInTheDocument(); // avg latency
    expect(screen.getByText("4.8%")).toBeInTheDocument(); // drop rate (2/42)
  });

  it("shows 0 active packets when no traveling packets", () => {
    vi.mocked(useSimulationStore).mockReturnValue({
      isRunning: true,
      packets: {
        p1: { id: "p1", status: "arrived", progress: 1 },
        p2: { id: "p2", status: "dropped", progress: 0.5 },
      },
      stats: { totalSent: 2, totalArrived: 1, totalDropped: 1, avgLatencyMs: 0, _latencyBuffer: [] },
    } as any);
    render(<SimulationStatsHUD />);
    expect(screen.getByText("0")).toBeInTheDocument(); // active count
  });

  it("highlights latency above 500ms", () => {
    vi.mocked(useSimulationStore).mockReturnValue({
      isRunning: true,
      packets: {},
      stats: { totalSent: 1, totalArrived: 1, totalDropped: 0, avgLatencyMs: 650, _latencyBuffer: [] },
    } as any);
    render(<SimulationStatsHUD />);
    const latencyEl = screen.getByText("650ms");
    expect(latencyEl.className).toContain("destructive");
  });
});