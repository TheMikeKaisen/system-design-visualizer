import { describe, it, expect, beforeEach } from "vitest";
import { useJSSimulationStore } from "../useJSSimulationStore";
import { GREET_SCENARIO, SimulationScenario } from "@/lib/js-simulator/engine";

describe("useJSSimulationStore", () => {
  beforeEach(() => {
    useJSSimulationStore.setState({
      scenario: GREET_SCENARIO,
      currentStepIndex: 0,
      isPlaying: false,
    });
  });

  it("pauses playback when pause is called", () => {
    useJSSimulationStore.setState({ isPlaying: true });
    expect(useJSSimulationStore.getState().isPlaying).toBe(true);

    useJSSimulationStore.getState().pause();
    expect(useJSSimulationStore.getState().isPlaying).toBe(false);
  });

  it("resets episode state to step 0 and pauses with resetEpisode()", () => {
    useJSSimulationStore.setState({ isPlaying: true, currentStepIndex: 3 });

    useJSSimulationStore.getState().resetEpisode();
    const state = useJSSimulationStore.getState();
    expect(state.isPlaying).toBe(false);
    expect(state.currentStepIndex).toBe(0);
    expect(state.scenario.id).toBe(GREET_SCENARIO.id);
  });

  it("resets episode and applies defaultScenario if provided", () => {
    const dummyScenario: SimulationScenario = {
      id: "dummy-test-scenario",
      title: "Dummy Test Scenario",
      code: "let a = 10;",
      steps: [
        {
          currentLine: 1,
          explanation: "Step 1",
          callStack: [],
        },
      ],
    };

    useJSSimulationStore.setState({ isPlaying: true, currentStepIndex: 2 });

    useJSSimulationStore.getState().resetEpisode(dummyScenario);
    const state = useJSSimulationStore.getState();
    expect(state.isPlaying).toBe(false);
    expect(state.currentStepIndex).toBe(0);
    expect(state.scenario.id).toBe("dummy-test-scenario");
  });

  it("resets currentStepIndex and pauses on reset()", () => {
    useJSSimulationStore.setState({ isPlaying: true, currentStepIndex: 4 });
    useJSSimulationStore.getState().reset();

    const state = useJSSimulationStore.getState();
    expect(state.isPlaying).toBe(false);
    expect(state.currentStepIndex).toBe(0);
  });
});
