import { create } from "zustand";
import { GREET_SCENARIO, SimulationScenario } from "@/lib/js-simulator/engine";

interface JSSimulationState {
  scenario: SimulationScenario;
  currentStepIndex: number;
  isPlaying: boolean;
  
  // Actions
  nextStep: () => void;
  prevStep: () => void;
  reset: () => void;
  togglePlay: () => void;
  setStep: (index: number) => void;
}

export const useJSSimulationStore = create<JSSimulationState>((set, get) => ({
  scenario: GREET_SCENARIO,
  currentStepIndex: 0,
  isPlaying: false,

  nextStep: () => {
    const { currentStepIndex, scenario } = get();
    if (currentStepIndex < scenario.steps.length - 1) {
      set({ currentStepIndex: currentStepIndex + 1 });
    } else {
      set({ isPlaying: false });
    }
  },

  prevStep: () => {
    const { currentStepIndex } = get();
    if (currentStepIndex > 0) {
      set({ currentStepIndex: currentStepIndex - 1, isPlaying: false });
    }
  },

  reset: () => {
    set({ currentStepIndex: 0, isPlaying: false });
  },

  togglePlay: () => {
    const { isPlaying, currentStepIndex, scenario } = get();
    if (!isPlaying && currentStepIndex === scenario.steps.length - 1) {
      // Replay from start if at the end
      set({ currentStepIndex: 0, isPlaying: true });
    } else {
      set({ isPlaying: !isPlaying });
    }
  },

  setStep: (index: number) => {
    const { scenario } = get();
    if (index >= 0 && index < scenario.steps.length) {
      set({ currentStepIndex: index, isPlaying: false });
    }
  }
}));
