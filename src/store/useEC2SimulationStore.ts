import { create } from "zustand";
import type { EC2ScenarioId, EC2Scenario, EC2Step } from "@/lib/ec2-simulator/types";
import { EC2_SCENARIOS } from "@/lib/ec2-simulator/scenarios";

export interface EC2SimulationState {
  activeScenarioId: EC2ScenarioId;
  currentStepIndex: number;
  isPlaying: boolean;
  playbackSpeed: number;
  isPemModalOpen: boolean;
  isRebooting: boolean;
  hasElasticIp: boolean;
  manualPublicIp: string | null;

  // Actions
  selectScenario: (scenarioId: EC2ScenarioId) => void;
  setStepIndex: (index: number) => void;
  nextStep: () => void;
  prevStep: () => void;
  resetStep: () => void;
  play: () => void;
  pause: () => void;
  togglePlay: () => void;
  setPlaybackSpeed: (speed: number) => void;
  setPemModalOpen: (open: boolean) => void;
  toggleElasticIp: () => void;
  simulateReboot: () => void;
  resetEpisode: (defaultScenarioId?: EC2ScenarioId) => void;

  // Getters
  getCurrentScenario: () => EC2Scenario;
  getCurrentStep: () => EC2Step;
}

let playbackTimer: NodeJS.Timeout | null = null;
let rebootTimer: NodeJS.Timeout | null = null;

const clearTimers = () => {
  if (playbackTimer) {
    clearInterval(playbackTimer);
    playbackTimer = null;
  }
  if (rebootTimer) {
    clearTimeout(rebootTimer);
    rebootTimer = null;
  }
};

export const useEC2SimulationStore = create<EC2SimulationState>((set, get) => ({
  activeScenarioId: "happy_path",
  currentStepIndex: 0,
  isPlaying: false,
  playbackSpeed: 1,
  isPemModalOpen: false,
  isRebooting: false,
  hasElasticIp: false,
  manualPublicIp: null,

  selectScenario: (scenarioId) => {
    clearTimers();
    set({
      activeScenarioId: scenarioId,
      currentStepIndex: 0,
      isPlaying: false,
      isRebooting: false,
      isPemModalOpen: false,
      manualPublicIp: null,
    });
  },

  setStepIndex: (index) => {
    const scenario = get().getCurrentScenario();
    const safeIndex = Math.max(0, Math.min(index, scenario.steps.length - 1));
    set({ currentStepIndex: safeIndex });
  },

  nextStep: () => {
    const { currentStepIndex, getCurrentScenario } = get();
    const scenario = getCurrentScenario();
    if (currentStepIndex < scenario.steps.length - 1) {
      set({ currentStepIndex: currentStepIndex + 1 });
    } else {
      clearTimers();
      set({ isPlaying: false });
    }
  },

  prevStep: () => {
    const { currentStepIndex } = get();
    if (currentStepIndex > 0) {
      set({ currentStepIndex: currentStepIndex - 1 });
    }
  },

  resetStep: () => {
    clearTimers();
    set({
      currentStepIndex: 0,
      isPlaying: false,
      manualPublicIp: null,
    });
  },

  play: () => {
    clearTimers();
    const { currentStepIndex, getCurrentScenario, playbackSpeed, nextStep } = get();
    const scenario = getCurrentScenario();

    // If at the end, restart from beginning
    if (currentStepIndex >= scenario.steps.length - 1) {
      set({ currentStepIndex: 0 });
    }

    set({ isPlaying: true });
    const intervalMs = Math.max(1200, 2500 / playbackSpeed);

    playbackTimer = setInterval(() => {
      const state = get();
      const scen = state.getCurrentScenario();
      if (state.currentStepIndex < scen.steps.length - 1) {
        nextStep();
      } else {
        clearTimers();
        set({ isPlaying: false });
      }
    }, intervalMs);
  },

  pause: () => {
    clearTimers();
    set({ isPlaying: false });
  },

  togglePlay: () => {
    const { isPlaying, play, pause } = get();
    if (isPlaying) {
      pause();
    } else {
      play();
    }
  },

  setPlaybackSpeed: (speed) => {
    const { isPlaying, play } = get();
    set({ playbackSpeed: speed });
    if (isPlaying) {
      play();
    }
  },

  setPemModalOpen: (open) => {
    set({ isPemModalOpen: open });
  },

  toggleElasticIp: () => {
    set((state) => ({ hasElasticIp: !state.hasElasticIp }));
  },

  simulateReboot: () => {
    if (get().isRebooting) return;
    if (rebootTimer) {
      clearTimeout(rebootTimer);
      rebootTimer = null;
    }

    set({ isRebooting: true });
    rebootTimer = setTimeout(() => {
      const { hasElasticIp } = get();
      if (hasElasticIp) {
        set({
          isRebooting: false,
          manualPublicIp: "3.109.80.200 (Elastic IP)",
        });
      } else {
        // Generate random new IP
        const octet2 = Math.floor(Math.random() * 200) + 20;
        const octet3 = Math.floor(Math.random() * 250) + 1;
        set({
          isRebooting: false,
          manualPublicIp: `54.${octet2}.${octet3}.112`,
        });
      }
      rebootTimer = null;
    }, 700);
  },

  resetEpisode: (defaultScenarioId = "happy_path") => {
    clearTimers();
    set({
      activeScenarioId: defaultScenarioId,
      currentStepIndex: 0,
      isPlaying: false,
      playbackSpeed: 1,
      isPemModalOpen: false,
      isRebooting: false,
      hasElasticIp: false,
      manualPublicIp: null,
    });
  },

  getCurrentScenario: () => {
    const { activeScenarioId } = get();
    return EC2_SCENARIOS.find((s) => s.id === activeScenarioId) ?? EC2_SCENARIOS[0];
  },

  getCurrentStep: () => {
    const { currentStepIndex, getCurrentScenario } = get();
    const scenario = getCurrentScenario();
    const safeIndex = Math.max(0, Math.min(currentStepIndex, scenario.steps.length - 1));
    return scenario.steps[safeIndex] ?? scenario.steps[0];
  },
}));
