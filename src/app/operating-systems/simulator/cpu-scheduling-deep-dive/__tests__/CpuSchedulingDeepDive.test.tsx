import { describe, it, expect, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import CPUSchedulingDeepDiveSimulator from "../page";
import { useOSSimulationStore } from "@/store/useOSSimulationStore";

describe("Episode 2: CPU Scheduling Deep-Dive Simulator", () => {
  beforeEach(() => {
    useOSSimulationStore.getState().resetEpisode();
  });

  it("renders the navigation bar, episode heading, and back link", () => {
    render(<CPUSchedulingDeepDiveSimulator />);

    expect(screen.getByText("Back to OS")).toBeDefined();
    expect(screen.getAllByText(/CPU Scheduling Deep-Dive/i).length).toBeGreaterThan(0);
    expect(screen.getByText("Non-Preemptive (FCFS)")).toBeDefined();
    expect(screen.getByText("Preemptive (RR)")).toBeDefined();
  });

  it("renders core visualizer components: Ready Queue, CPU, and queues", () => {
    render(<CPUSchedulingDeepDiveSimulator />);

    expect(screen.getByText("Ready Queue")).toBeDefined();
    expect(screen.getByText(/Short-Term Scheduler/i)).toBeDefined();
    expect(screen.getByText(/Waiting \/ Suspended/i)).toBeDefined();
    expect(screen.getAllByText("Terminated").length).toBeGreaterThan(0);
  });

  it("switches algorithm mode between Non-Preemptive and Preemptive", () => {
    render(<CPUSchedulingDeepDiveSimulator />);

    const rrButton = screen.getByText("Preemptive (RR)");
    fireEvent.click(rrButton);

    const storeState = useOSSimulationStore.getState();
    expect(storeState.schedulingMode).toBe("preemptive");
    expect(storeState.currentStepIndex).toBe(0);

    const fcfsButton = screen.getByText("Non-Preemptive (FCFS)");
    fireEvent.click(fcfsButton);

    const updatedState = useOSSimulationStore.getState();
    expect(updatedState.schedulingMode).toBe("non_preemptive");
    expect(updatedState.currentStepIndex).toBe(0);
  });

  it("advances steps and resets safely without bounds crash", () => {
    render(<CPUSchedulingDeepDiveSimulator />);

    const nextButton = screen.getByTitle("Next Step");
    fireEvent.click(nextButton);

    expect(useOSSimulationStore.getState().currentStepIndex).toBe(1);

    const restartButton = screen.getByTitle("Restart");
    fireEvent.click(restartButton);

    expect(useOSSimulationStore.getState().currentStepIndex).toBe(0);
  });
});
