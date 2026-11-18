import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { useEC2SimulationStore } from "../useEC2SimulationStore";
import { EC2_SCENARIOS } from "@/lib/ec2-simulator/scenarios";

describe("useEC2SimulationStore", () => {
  beforeEach(() => {
    useEC2SimulationStore.getState().resetEpisode();
  });

  afterEach(() => {
    useEC2SimulationStore.getState().pause();
  });

  it("initializes with happy_path scenario and step 0", () => {
    const state = useEC2SimulationStore.getState();
    expect(state.activeScenarioId).toBe("happy_path");
    expect(state.currentStepIndex).toBe(0);
    expect(state.isPlaying).toBe(false);
    expect(state.playbackSpeed).toBe(1);
    expect(state.isPemModalOpen).toBe(false);
    expect(state.hasElasticIp).toBe(false);

    const scenario = state.getCurrentScenario();
    expect(scenario.id).toBe("happy_path");
    expect(scenario.steps.length).toBeGreaterThan(0);

    const step = state.getCurrentStep();
    expect(step.stepNumber).toBe(1);
    expect(step.network.targetPublicIp).toBe("13.234.45.10");
  });

  it("advances and steps backward within safe boundary constraints", () => {
    const store = useEC2SimulationStore.getState();
    const scenario = store.getCurrentScenario();
    const totalSteps = scenario.steps.length;

    // Step forward
    store.nextStep();
    expect(useEC2SimulationStore.getState().currentStepIndex).toBe(1);

    // Step forward past max step clamps to totalSteps - 1
    for (let i = 0; i < totalSteps + 5; i++) {
      useEC2SimulationStore.getState().nextStep();
    }
    expect(useEC2SimulationStore.getState().currentStepIndex).toBe(totalSteps - 1);

    // Step backward
    useEC2SimulationStore.getState().prevStep();
    expect(useEC2SimulationStore.getState().currentStepIndex).toBe(totalSteps - 2);

    // Step backward past 0 clamps to 0
    for (let i = 0; i < totalSteps + 5; i++) {
      useEC2SimulationStore.getState().prevStep();
    }
    expect(useEC2SimulationStore.getState().currentStepIndex).toBe(0);
  });

  it("switches scenarios, resets step counter to 0, and closes open modals", () => {
    const store = useEC2SimulationStore.getState();
    store.nextStep();
    store.nextStep();
    store.setPemModalOpen(true);
    expect(useEC2SimulationStore.getState().currentStepIndex).toBe(2);
    expect(useEC2SimulationStore.getState().isPemModalOpen).toBe(true);

    store.selectScenario("sg_blocked");
    const state = useEC2SimulationStore.getState();
    expect(state.activeScenarioId).toBe("sg_blocked");
    expect(state.currentStepIndex).toBe(0);
    expect(state.isPemModalOpen).toBe(false);
    expect(state.getCurrentScenario().name).toContain("Security Group");
  });

  it("resets step index and manualPublicIp on resetStep call", () => {
    const store = useEC2SimulationStore.getState();
    store.nextStep();
    store.nextStep();
    useEC2SimulationStore.setState({ manualPublicIp: "54.100.200.112" });
    expect(useEC2SimulationStore.getState().currentStepIndex).toBe(2);
    expect(useEC2SimulationStore.getState().manualPublicIp).toBe("54.100.200.112");

    store.resetStep();
    expect(useEC2SimulationStore.getState().currentStepIndex).toBe(0);
    expect(useEC2SimulationStore.getState().isPlaying).toBe(false);
    expect(useEC2SimulationStore.getState().manualPublicIp).toBeNull();
  });

  it("toggles .pem inspection modal", () => {
    const store = useEC2SimulationStore.getState();
    expect(store.isPemModalOpen).toBe(false);

    store.setPemModalOpen(true);
    expect(useEC2SimulationStore.getState().isPemModalOpen).toBe(true);

    store.setPemModalOpen(false);
    expect(useEC2SimulationStore.getState().isPemModalOpen).toBe(false);
  });

  it("toggles Elastic IP association", () => {
    const store = useEC2SimulationStore.getState();
    expect(store.hasElasticIp).toBe(false);

    store.toggleElasticIp();
    expect(useEC2SimulationStore.getState().hasElasticIp).toBe(true);

    store.toggleElasticIp();
    expect(useEC2SimulationStore.getState().hasElasticIp).toBe(false);
  });

  it("handles simulated reboot with timer", async () => {
    vi.useFakeTimers();
    const store = useEC2SimulationStore.getState();

    store.simulateReboot();
    expect(useEC2SimulationStore.getState().isRebooting).toBe(true);

    vi.advanceTimersByTime(800);
    expect(useEC2SimulationStore.getState().isRebooting).toBe(false);
    expect(useEC2SimulationStore.getState().manualPublicIp).toMatch(/54\.\d+\.\d+\.112/);

    vi.useRealTimers();
  });

  it("resets episode state completely on unmount", () => {
    const store = useEC2SimulationStore.getState();
    store.selectScenario("mismatched_key");
    store.nextStep();
    store.setPemModalOpen(true);
    store.toggleElasticIp();

    store.resetEpisode();
    const state = useEC2SimulationStore.getState();
    expect(state.activeScenarioId).toBe("happy_path");
    expect(state.currentStepIndex).toBe(0);
    expect(state.isPemModalOpen).toBe(false);
    expect(state.hasElasticIp).toBe(false);
    expect(state.isPlaying).toBe(false);
  });
});
