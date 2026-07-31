import { create } from 'zustand';
import { OOP_SCENARIOS } from '@/lib/java-simulator/oop-scenarios';
import { OOPSimulationScenario } from '@/lib/java-simulator/oop-engine';

interface JavaOOPStore {
  scenario: OOPSimulationScenario;
  currentStepIndex: number;
  isPlaying: boolean;
  
  // Actions
  setScenario: (scenarioId: string) => void;
  nextStep: () => void;
  prevStep: () => void;
  setStep: (index: number) => void;
  togglePlay: () => void;
  reset: () => void;
}

export const useJavaOOPStore = create<JavaOOPStore>((set) => ({
  scenario: OOP_SCENARIOS[0],
  currentStepIndex: 0,
  isPlaying: false,

  setScenario: (scenarioId: string) => set((state) => {
    const newScenario = OOP_SCENARIOS.find(s => s.id === scenarioId) || OOP_SCENARIOS[0];
    return {
      scenario: newScenario,
      currentStepIndex: 0,
      isPlaying: false,
    };
  }),

  nextStep: () => set((state) => {
    if (state.currentStepIndex < state.scenario.steps.length - 1) {
      return { currentStepIndex: state.currentStepIndex + 1 };
    }
    return { isPlaying: false };
  }),

  prevStep: () => set((state) => {
    if (state.currentStepIndex > 0) {
      return { currentStepIndex: state.currentStepIndex - 1 };
    }
    return state;
  }),

  setStep: (index: number) => set((state) => {
    if (index >= 0 && index < state.scenario.steps.length) {
      return { currentStepIndex: index };
    }
    return state;
  }),

  togglePlay: () => set((state) => ({
    isPlaying: !state.isPlaying
  })),

  reset: () => set((state) => ({
    currentStepIndex: 0,
    isPlaying: false
  }))
}));
