import { create } from "zustand";
import { BackendSimulationScenario } from "@/lib/backend-simulator/engine";

interface BackendSimulationState {
  scenario: BackendSimulationScenario;
  currentStepIndex: number;
  
  setScenario: (scenario: BackendSimulationScenario) => void;
  nextStep: () => void;
  prevStep: () => void;
  reset: () => void;
  goToStep: (index: number) => void;
}

export const useBackendSimulationStore = create<BackendSimulationState>((set, get) => ({
  scenario: {
    id: "default",
    title: "",
    description: "",
    layoutMode: "process-architecture",
    steps: []
  },
  currentStepIndex: 0,

  setScenario: (scenario) => set({ scenario, currentStepIndex: 0 }),
  
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
  
  reset: () => set({ currentStepIndex: 0 }),

  goToStep: (index) => {
    const { scenario } = get();
    if (index >= 0 && index < scenario.steps.length) {
      set({ currentStepIndex: index });
    }
  }
}));
