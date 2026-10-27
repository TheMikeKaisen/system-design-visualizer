import { describe, it, expect, beforeEach } from "vitest";
import { useNetworkSimulationStore } from "../useNetworkSimulationStore";
import { SCENARIO_MULTI_CLIENT } from "@/lib/network-simulator/scenarios";

describe("useNetworkSimulationStore", () => {
  beforeEach(() => {
    useNetworkSimulationStore.getState().resetEpisode();
  });

  it("initializes with SCENARIO_HANDSHAKE at step 0 and paused", () => {
    const state = useNetworkSimulationStore.getState();
    expect(state.scenario.id).toBe("tcp-handshake");
    expect(state.currentStepIndex).toBe(0);
    expect(state.isPlaying).toBe(false);
    expect(state.playbackSpeed).toBe(1.0);
  });

  it("advances steps with nextStep and bounds at the final step", () => {
    const store = useNetworkSimulationStore.getState();
    const totalSteps = store.scenario.steps.length;

    store.nextStep();
    expect(useNetworkSimulationStore.getState().currentStepIndex).toBe(1);

    // Jump to near end
    store.goToStep(totalSteps - 1);
    expect(useNetworkSimulationStore.getState().currentStepIndex).toBe(totalSteps - 1);

    // Calling nextStep at the end should stop play and remain bounded
    store.nextStep();
    expect(useNetworkSimulationStore.getState().currentStepIndex).toBe(totalSteps - 1);
    expect(useNetworkSimulationStore.getState().isPlaying).toBe(false);
  });

  it("steps backward with prevStep and clamps at step 0", () => {
    const store = useNetworkSimulationStore.getState();

    store.prevStep();
    expect(useNetworkSimulationStore.getState().currentStepIndex).toBe(0);

    store.goToStep(2);
    store.prevStep();
    expect(useNetworkSimulationStore.getState().currentStepIndex).toBe(1);
  });

  it("resets index to 0 with reset()", () => {
    const store = useNetworkSimulationStore.getState();
    store.goToStep(3);
    store.play();

    store.reset();
    const state = useNetworkSimulationStore.getState();
    expect(state.currentStepIndex).toBe(0);
    expect(state.isPlaying).toBe(false);
  });

  it("switches scenarios and resets state with setScenario()", () => {
    const store = useNetworkSimulationStore.getState();
    store.goToStep(2);

    store.setScenario(SCENARIO_MULTI_CLIENT);
    const state = useNetworkSimulationStore.getState();
    expect(state.scenario.id).toBe("multi-client-demux");
    expect(state.currentStepIndex).toBe(0);
    expect(state.isPlaying).toBe(false);
  });

  it("toggles play/pause and updates playbackSpeed", () => {
    const store = useNetworkSimulationStore.getState();
    expect(store.isPlaying).toBe(false);

    store.togglePlay();
    expect(useNetworkSimulationStore.getState().isPlaying).toBe(true);

    store.pause();
    expect(useNetworkSimulationStore.getState().isPlaying).toBe(false);

    store.setPlaybackSpeed(2.0);
    expect(useNetworkSimulationStore.getState().playbackSpeed).toBe(2.0);
  });

  it("preserves selected socket across navigation when it remains present", () => {
    const store = useNetworkSimulationStore.getState();
    store.goToStep(1); // Step 1 has server-1-listen-80 and client-1-syn-51524

    const step1Sockets = store.scenario.steps[1].activeSockets;
    const clientSocket = step1Sockets.find((s) => s.id === "client-1-syn-51524");
    expect(clientSocket).toBeDefined();

    // Select the client socket
    store.setSelectedSocket(clientSocket!);
    expect(useNetworkSimulationStore.getState().selectedSocket?.id).toBe("client-1-syn-51524");

    // Advance to Step 2 (which still has server-1-listen-80 and client-1-syn-51524)
    store.nextStep();
    expect(useNetworkSimulationStore.getState().currentStepIndex).toBe(2);
    expect(useNetworkSimulationStore.getState().selectedSocket?.id).toBe("client-1-syn-51524");

    // Step back to Step 1
    store.prevStep();
    expect(useNetworkSimulationStore.getState().currentStepIndex).toBe(1);
    expect(useNetworkSimulationStore.getState().selectedSocket?.id).toBe("client-1-syn-51524");
  });

  it("gracefully falls back to first socket when selected socket is no longer present", () => {
    const store = useNetworkSimulationStore.getState();
    store.goToStep(1);

    const clientSocket = store.scenario.steps[1].activeSockets.find((s) => s.id === "client-1-syn-51524");
    store.setSelectedSocket(clientSocket!);
    expect(useNetworkSimulationStore.getState().selectedSocket?.id).toBe("client-1-syn-51524");

    // Step 0 only has server-1-listen-80; client socket does not exist
    store.prevStep();
    expect(useNetworkSimulationStore.getState().currentStepIndex).toBe(0);
    expect(useNetworkSimulationStore.getState().selectedSocket?.id).toBe("server-1-listen-80");
  });
});
