import { create } from "zustand";
import { ReactSimulationScenario } from "@/lib/react-simulator/engine";

interface ReactSimulationState {
  scenario: ReactSimulationScenario;
  currentStepIndex: number;
  
  // Actions
  nextStep: () => void;
  prevStep: () => void;
  reset: () => void;
  setStep: (index: number) => void;
  setScenario: (scenario: ReactSimulationScenario) => void;
}

export const useReactSimulationStore = create<ReactSimulationState>((set, get) => ({
  scenario: {
    id: "default",
    title: "",
    description: "",
    layoutMode: "vdom",
    steps: []
  },
  currentStepIndex: 0,

  nextStep: () => {
    const { currentStepIndex, scenario } = get();
    if (currentStepIndex < scenario.steps.length - 1) {
      set({ currentStepIndex: currentStepIndex + 1 });
    }
  },

  prevStep: () => {
    const { currentStepIndex } = get();
    if (currentStepIndex > 0) {
      set({ currentStepIndex: currentStepIndex - 1 });
    }
  },

  reset: () => {
    set({ currentStepIndex: 0 });
  },

  setStep: (index: number) => {
    const { scenario } = get();
    if (index >= 0 && index < scenario.steps.length) {
      set({ currentStepIndex: index });
    }
  },

  setScenario: (scenario: ReactSimulationScenario) => {
    set({ scenario, currentStepIndex: 0 });
  }
}));
