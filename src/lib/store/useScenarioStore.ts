import { create } from "zustand";
import { ScenarioScript, NodeStatus } from "../scenario/types";

interface ScenarioState {
  script: ScenarioScript | null;
  currentStepIndex: number;
  
  // Media Player State
  isPlaying: boolean;
  playbackSpeed: number;
  
  // Interaction & Exploration State
  activeExperiments: string[];
  selectedNodeId: string | null;

  // Active step visuals
  activeAssetAnimation: {
    id: string;
    sourceId: string;
    targetId: string;
    assetType: "file" | "binary" | "gear";
    durationMs: number;
    startTime: number;
  } | null;
  activeCodeSnippet: {
    nodeId: string;
    code: string;
  } | null;
  activeTooltip: {
    nodeId: string;
    message: string;
  } | null;
  highlightedElementIds: Set<string>;
  nodeStatuses: Record<string, NodeStatus>;

  // Actions
  loadScript: (script: ScenarioScript) => void;
  nextStep: () => void;
  prevStep: () => void;
  setStepIndex: (index: number) => void;
  setPlaying: (playing: boolean) => void;
  setSpeed: (speed: number) => void;
  toggleExperiment: (experimentId: string) => void;
  setSelectedNodeId: (id: string | null) => void;
  reset: () => void;
  clearAnimation: (id: string) => void;
}

export const useScenarioStore = create<ScenarioState>((set, get) => ({
  script: null,
  currentStepIndex: 0,
  isPlaying: false,
  playbackSpeed: 1,
  activeExperiments: [],
  selectedNodeId: null,

  activeAssetAnimation: null,
  activeCodeSnippet: null,
  activeTooltip: null,
  highlightedElementIds: new Set(),
  nodeStatuses: {},

  loadScript: (script) => set({ 
    script, 
    currentStepIndex: 0,
    activeAssetAnimation: null,
    activeCodeSnippet: null,
    activeTooltip: null,
    highlightedElementIds: new Set(),
    nodeStatuses: {},
    isPlaying: false
  }),

  nextStep: () => {
    const { script, currentStepIndex, activeExperiments } = get();
    if (!script) return;
    
    let nextIdx = currentStepIndex + 1;
    while (nextIdx < script.steps.length) {
      const step = script.steps[nextIdx];
      const hasReq = !step.requiredExperiments || step.requiredExperiments.every(e => activeExperiments.includes(e));
      const hasExc = step.excludedExperiments && step.excludedExperiments.some(e => activeExperiments.includes(e));
      if (hasReq && !hasExc) break;
      nextIdx++;
    }

    if (nextIdx < script.steps.length) {
      set({ currentStepIndex: nextIdx });
      applyStepActions(get);
    } else {
      set({ isPlaying: false });
    }
  },

  prevStep: () => {
    const { script, currentStepIndex, activeExperiments } = get();
    if (!script) return;
    
    let prevIdx = currentStepIndex - 1;
    while (prevIdx >= 0) {
      const step = script.steps[prevIdx];
      const hasReq = !step.requiredExperiments || step.requiredExperiments.every(e => activeExperiments.includes(e));
      const hasExc = step.excludedExperiments && step.excludedExperiments.some(e => activeExperiments.includes(e));
      if (hasReq && !hasExc) break;
      prevIdx--;
    }

    if (prevIdx >= 0) {
      set({ currentStepIndex: prevIdx });
      applyStepActions(get);
    }
  },

  setStepIndex: (index: number) => {
    const { script } = get();
    if (!script || index < 0 || index >= script.steps.length) return;
    set({ currentStepIndex: index });
    applyStepActions(get);
  },

  setPlaying: (isPlaying: boolean) => {
    // If we play and we are at the end, restart
    const { script, currentStepIndex } = get();
    if (isPlaying && script && currentStepIndex >= script.steps.length - 1) {
      set({ currentStepIndex: 0, isPlaying: true });
      applyStepActions(get);
    } else {
      set({ isPlaying });
    }
  },

  setSpeed: (speed: number) => set({ playbackSpeed: speed }),

  toggleExperiment: (experimentId: string) => {
    const { activeExperiments } = get();
    const newExperiments = activeExperiments.includes(experimentId) 
      ? activeExperiments.filter(id => id !== experimentId)
      : [...activeExperiments, experimentId];
    
    set({ activeExperiments: newExperiments });
    // Reset to beginning when an experiment changes so the script branches correctly
    set({ currentStepIndex: 0, isPlaying: true, selectedNodeId: null });
    applyStepActions(get);
  },

  setSelectedNodeId: (id: string | null) => set({ selectedNodeId: id }),

  reset: () => {
    set({ 
      currentStepIndex: 0,
      activeAssetAnimation: null,
      activeCodeSnippet: null,
      activeTooltip: null,
      highlightedElementIds: new Set(),
      nodeStatuses: {},
      isPlaying: false
    });
    applyStepActions(get);
  },

  clearAnimation: (id) => {
    const { activeAssetAnimation } = get();
    if (activeAssetAnimation?.id === id) {
      set({ activeAssetAnimation: null });
    }
  }
}));

function applyStepActions(get: () => ScenarioState) {
  const { script, currentStepIndex } = get();
  if (!script) return;

  const step = script.steps[currentStepIndex];
  
  // Create new state objects to ensure reactivity
  const highlights = new Set<string>();
  const nodeStatuses: Record<string, NodeStatus> = {};
  let newAnimation = null;
  let newCode = null;
  let newTooltip = null;

  for (const action of step.actions) {
    if (action.action === "clear") {
      // Handled implicitly by replacing state
    } else if (action.action === "highlight") {
      action.elementIds.forEach(id => highlights.add(id));
    } else if (action.action === "animate-asset") {
      newAnimation = {
        id: Math.random().toString(36).substring(2, 11),
        sourceId: action.sourceId,
        targetId: action.targetId,
        assetType: action.assetType,
        durationMs: action.durationMs,
        startTime: Date.now()
      };
    } else if (action.action === "show-code") {
      newCode = { nodeId: action.nodeId, code: action.codeSnippet };
    } else if (action.action === "node-status") {
      nodeStatuses[action.nodeId] = action.status;
    } else if (action.action === "tooltip") {
      newTooltip = { nodeId: action.nodeId, message: action.message };
    }
  }

  useScenarioStore.setState({
    highlightedElementIds: highlights,
    activeAssetAnimation: newAnimation,
    activeCodeSnippet: newCode,
    activeTooltip: newTooltip,
    nodeStatuses
  });
}
