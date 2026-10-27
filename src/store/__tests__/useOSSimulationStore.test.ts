import { describe, it, expect, beforeEach } from "vitest";
import { useOSSimulationStore } from "../useOSSimulationStore";
import { PROCESS_STATES_SCENARIO } from "@/lib/os-simulator/process-states-scenario";
import { PCB_SCENARIO } from "@/lib/os-simulator/pcb-scenario";

describe("useOSSimulationStore", () => {
  beforeEach(() => {
    useOSSimulationStore.getState().resetEpisode();
  });

  it("initializes with default process states scenario and zero step index", () => {
    const state = useOSSimulationStore.getState();
    expect(state.scenario.id).toBe(PROCESS_STATES_SCENARIO.id);
    expect(state.currentStepIndex).toBe(0);
    expect(state.isPlaying).toBe(false);
    expect(state.playbackSpeed).toBe(1);
    expect(state.schedulingMode).toBe("non_preemptive");
  });

  it("advances step with nextStep() and clamps at the boundary", () => {
    const totalSteps = useOSSimulationStore.getState().scenario.steps.length;

    useOSSimulationStore.getState().nextStep();
    expect(useOSSimulationStore.getState().currentStepIndex).toBe(1);

    // Jump near end
    useOSSimulationStore.getState().setStep(totalSteps - 1);
    expect(useOSSimulationStore.getState().currentStepIndex).toBe(totalSteps - 1);

    // Advancing past end should pause and stay clamped
    useOSSimulationStore.setState({ isPlaying: true });
    useOSSimulationStore.getState().nextStep();
    expect(useOSSimulationStore.getState().currentStepIndex).toBe(totalSteps - 1);
    expect(useOSSimulationStore.getState().isPlaying).toBe(false);
  });

  it("decrements step with prevStep() and clamps at 0", () => {
    useOSSimulationStore.getState().setStep(2);
    useOSSimulationStore.setState({ isPlaying: true });

    useOSSimulationStore.getState().prevStep();
    expect(useOSSimulationStore.getState().currentStepIndex).toBe(1);
    expect(useOSSimulationStore.getState().isPlaying).toBe(false);

    useOSSimulationStore.getState().prevStep();
    expect(useOSSimulationStore.getState().currentStepIndex).toBe(0);

    // Clamping at zero
    useOSSimulationStore.getState().prevStep();
    expect(useOSSimulationStore.getState().currentStepIndex).toBe(0);
  });

  it("handles playback toggling, pause, and replay from end", () => {
    const totalSteps = useOSSimulationStore.getState().scenario.steps.length;

    useOSSimulationStore.getState().togglePlay();
    expect(useOSSimulationStore.getState().isPlaying).toBe(true);

    useOSSimulationStore.getState().pause();
    expect(useOSSimulationStore.getState().isPlaying).toBe(false);

    // At the end, togglePlay replays from index 0
    useOSSimulationStore.getState().setStep(totalSteps - 1);
    useOSSimulationStore.getState().togglePlay();
    expect(useOSSimulationStore.getState().currentStepIndex).toBe(0);
    expect(useOSSimulationStore.getState().isPlaying).toBe(true);
  });

  it("navigates chapters with jumpToChapter() and returns current chapter", () => {
    // PCB Scenario has multiple chapters
    useOSSimulationStore.getState().setScenario(PCB_SCENARIO);
    const chapters = useOSSimulationStore.getState().scenario.chapters;
    expect(chapters.length).toBeGreaterThan(1);

    useOSSimulationStore.getState().jumpToChapter(1);
    expect(useOSSimulationStore.getState().currentStepIndex).toBe(chapters[1].startStep);

    const activeChapter = useOSSimulationStore.getState().getCurrentChapter();
    expect(activeChapter?.title).toBe(chapters[1].title);
  });

  it("updates playback speed", () => {
    useOSSimulationStore.getState().setPlaybackSpeed(2);
    expect(useOSSimulationStore.getState().playbackSpeed).toBe(2);

    useOSSimulationStore.getState().setPlaybackSpeed(0.5);
    expect(useOSSimulationStore.getState().playbackSpeed).toBe(0.5);
  });

  it("switches scheduling mode and regenerates scenario", () => {
    useOSSimulationStore.getState().setSchedulingMode("preemptive");
    const state = useOSSimulationStore.getState();
    expect(state.schedulingMode).toBe("preemptive");
    expect(state.currentStepIndex).toBe(0);
    expect(state.scenario.id).toContain("cpu-scheduling");
  });

  it("supports setting custom scenario and clean resetEpisode unmount lifecycle", () => {
    useOSSimulationStore.getState().setScenario(PCB_SCENARIO);
    expect(useOSSimulationStore.getState().scenario.id).toBe(PCB_SCENARIO.id);
    expect(useOSSimulationStore.getState().currentStepIndex).toBe(0);

    useOSSimulationStore.getState().nextStep();
    expect(useOSSimulationStore.getState().currentStepIndex).toBe(1);

    // Unmount reset cleanup
    useOSSimulationStore.getState().resetEpisode();
    expect(useOSSimulationStore.getState().scenario.id).toBe(PROCESS_STATES_SCENARIO.id);
    expect(useOSSimulationStore.getState().currentStepIndex).toBe(0);
    expect(useOSSimulationStore.getState().isPlaying).toBe(false);
  });
});
