import { create } from "zustand";
import type { OSSimulationScenario, SchedulingMode, ChapterMeta } from "@/lib/os-simulator/engine";
import {
  PROCESS_STATES_SCENARIO,
  createProcessStatesScenario,
} from "@/lib/os-simulator/process-states-scenario";

interface OSSimulationState {
  scenario: OSSimulationScenario;
  currentStepIndex: number;
  isPlaying: boolean;
  playbackSpeed: number;
  schedulingMode: SchedulingMode;

  // Actions
  nextStep: () => void;
  prevStep: () => void;
  reset: () => void;
  togglePlay: () => void;
  setStep: (index: number) => void;
  setScenario: (scenario: OSSimulationScenario) => void;
  jumpToChapter: (chapterIndex: number) => void;
  setSchedulingMode: (mode: SchedulingMode) => void;
  setPlaybackSpeed: (speed: number) => void;

  // Derived helpers
  getCurrentChapter: () => ChapterMeta | null;
}

export const useOSSimulationStore = create<OSSimulationState>((set, get) => ({
  scenario: PROCESS_STATES_SCENARIO,
  currentStepIndex: 0,
  isPlaying: false,
  playbackSpeed: 1,
  schedulingMode: "non_preemptive",

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
  },

  setScenario: (scenario: OSSimulationScenario) => {
    set({ scenario, currentStepIndex: 0, isPlaying: false });
  },

  jumpToChapter: (chapterIndex: number) => {
    const { scenario } = get();
    const chapter = scenario.chapters[chapterIndex];
    if (chapter) {
      set({ currentStepIndex: chapter.startStep, isPlaying: false });
    }
  },

  setSchedulingMode: (mode: SchedulingMode) => {
    const { scenario, currentStepIndex } = get();
    const newScenario = createProcessStatesScenario(mode);

    // If currently in Chapter 2, reset to start of Chapter 2
    const ch1End = scenario.chapters[0]?.endStep ?? 0;
    let newIndex = currentStepIndex;
    if (currentStepIndex > ch1End) {
      newIndex = newScenario.chapters[1]?.startStep ?? 0;
    }

    set({
      scenario: newScenario,
      schedulingMode: mode,
      currentStepIndex: newIndex,
      isPlaying: false,
    });
  },

  setPlaybackSpeed: (speed: number) => {
    set({ playbackSpeed: speed });
  },

  getCurrentChapter: () => {
    const { scenario, currentStepIndex } = get();
    return (
      scenario.chapters.find(
        (ch) => currentStepIndex >= ch.startStep && currentStepIndex <= ch.endStep
      ) ?? null
    );
  },
}));
