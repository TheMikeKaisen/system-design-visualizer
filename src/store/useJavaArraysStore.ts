import { create } from 'zustand';
import { javaArraysPhases } from '@/lib/java-simulator/arrays-scenarios';
import { JavaArrayScenario } from '@/lib/java-simulator/arrays-engine';

interface JavaArraysStore {
  scenario: JavaArrayScenario;
  currentPhaseIndex: number;
  currentStepIndex: number;
  isPlaying: boolean;
  
  nextStep: () => void;
  prevStep: () => void;
  setStep: (index: number) => void;
  setPhase: (index: number) => void;
  togglePlay: () => void;
  reset: () => void;
}

export const useJavaArraysStore = create<JavaArraysStore>((set) => ({
  scenario: javaArraysPhases[0],
  currentPhaseIndex: 0,
  currentStepIndex: 0,
  isPlaying: false,

  nextStep: () => set((state) => {
    if (state.currentStepIndex < state.scenario.steps.length - 1) {
      return { currentStepIndex: state.currentStepIndex + 1 };
    }
    return { isPlaying: false };
  }),

  prevStep: () => set((state) => {
    if (state.currentStepIndex > 0) {
      return { currentStepIndex: state.currentStepIndex - 1, isPlaying: false };
    }
    return state;
  }),

  setStep: (index: number) => set((state) => {
    if (index >= 0 && index < state.scenario.steps.length) {
      return { currentStepIndex: index, isPlaying: false };
    }
    return state;
  }),

  setPhase: (index: number) => set((state) => {
    if (index >= 0 && index < javaArraysPhases.length) {
      return { 
        currentPhaseIndex: index, 
        scenario: javaArraysPhases[index], 
        currentStepIndex: 0, 
        isPlaying: false 
      };
    }
    return state;
  }),

  togglePlay: () => set((state) => {
    if (!state.isPlaying && state.currentStepIndex === state.scenario.steps.length - 1) {
      return { isPlaying: true, currentStepIndex: 0 };
    }
    return { isPlaying: !state.isPlaying };
  }),

  reset: () => set({ currentStepIndex: 0, isPlaying: false }),
}));
