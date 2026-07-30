import { create } from 'zustand';
import { ALL_TYPECASTING_SCENARIOS } from '@/lib/java-simulator/typecasting-scenarios';
import { JavaSimulationScenario } from '@/lib/java-simulator/engine';

interface JavaSimulationStore {
  scenario: JavaSimulationScenario;
  currentStepIndex: number;
  isPlaying: boolean;
  challengeSelectedAnswer: number | null;
  
  // Actions
  setScenario: (scenarioId: string) => void;
  nextStep: () => void;
  prevStep: () => void;
  setStep: (index: number) => void;
  togglePlay: () => void;
  reset: () => void;
  
  // Challenge specific
  submitChallengeAnswer: (answerIndex: number) => void;
  resetChallenge: () => void;
}

export const useJavaSimulationStore = create<JavaSimulationStore>((set) => ({
  scenario: ALL_TYPECASTING_SCENARIOS[0],
  currentStepIndex: 0,
  isPlaying: false,
  challengeSelectedAnswer: null,

  setScenario: (scenarioId: string) => set((state) => {
    const newScenario = ALL_TYPECASTING_SCENARIOS.find(s => s.id === scenarioId) || ALL_TYPECASTING_SCENARIOS[0];
    return {
      scenario: newScenario,
      currentStepIndex: 0,
      isPlaying: false,
      challengeSelectedAnswer: null
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
    isPlaying: false,
    challengeSelectedAnswer: null
  })),

  submitChallengeAnswer: (answerIndex: number) => set(() => ({
    challengeSelectedAnswer: answerIndex,
    // Automatically go to next step to reveal answer
    currentStepIndex: 1 
  })),

  resetChallenge: () => set(() => ({
    challengeSelectedAnswer: null
  }))
}));
