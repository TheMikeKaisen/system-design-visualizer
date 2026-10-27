import { create } from "zustand";
import type { NetworkSimulationScenario, WirePacket, SocketEntry } from "@/lib/network-simulator/engine";
import { SCENARIO_HANDSHAKE } from "@/lib/network-simulator/scenarios";

interface NetworkSimulationState {
  scenario: NetworkSimulationScenario;
  currentStepIndex: number;
  isPlaying: boolean;
  playbackSpeed: number; // multiplier (e.g. 1.0, 1.5, 2.0)
  selectedPacket: WirePacket | null;
  selectedSocket: SocketEntry | null;

  // Actions
  setScenario: (scenario: NetworkSimulationScenario) => void;
  nextStep: () => void;
  prevStep: () => void;
  goToStep: (index: number) => void;
  reset: () => void;
  play: () => void;
  pause: () => void;
  togglePlay: () => void;
  setPlaybackSpeed: (speed: number) => void;
  setSelectedPacket: (packet: WirePacket | null) => void;
  setSelectedSocket: (socket: SocketEntry | null) => void;
  resetEpisode: (defaultScenario?: NetworkSimulationScenario) => void;
}

function resolveSelectedSocket(
  targetSockets: SocketEntry[] = [],
  currentSelectedSocket: SocketEntry | null
): SocketEntry | null {
  if (!currentSelectedSocket) {
    return targetSockets[0] ?? null;
  }
  // 1. Check if identical socket id exists in target sockets
  const exactMatch = targetSockets.find((s) => s.id === currentSelectedSocket.id);
  if (exactMatch) return exactMatch;

  // 2. Fallback: match by protocol and endpoint 4-tuple
  const tupleMatch = targetSockets.find(
    (s) =>
      s.protocol === currentSelectedSocket.protocol &&
      s.localPort === currentSelectedSocket.localPort &&
      s.remotePort === currentSelectedSocket.remotePort &&
      s.localIp === currentSelectedSocket.localIp &&
      s.remoteIp === currentSelectedSocket.remoteIp
  );
  if (tupleMatch) return tupleMatch;

  // 3. Sensible fallback to first socket in the new step
  return targetSockets[0] ?? null;
}

export const useNetworkSimulationStore = create<NetworkSimulationState>((set, get) => ({
  scenario: SCENARIO_HANDSHAKE,
  currentStepIndex: 0,
  isPlaying: false,
  playbackSpeed: 1.0,
  selectedPacket: null,
  selectedSocket: null,

  setScenario: (scenario) =>
    set({
      scenario,
      currentStepIndex: 0,
      isPlaying: false,
      selectedPacket: scenario.steps[0]?.activePacket ?? null,
      selectedSocket: scenario.steps[0]?.activeSockets[0] ?? null,
    }),

  nextStep: () => {
    const { currentStepIndex, scenario, selectedSocket } = get();
    const steps = scenario.steps ?? [];
    if (currentStepIndex < steps.length - 1) {
      const nextIdx = currentStepIndex + 1;
      const targetStep = steps[nextIdx];
      set({
        currentStepIndex: nextIdx,
        selectedPacket: targetStep?.activePacket ?? null,
        selectedSocket: resolveSelectedSocket(targetStep?.activeSockets, selectedSocket),
      });
    } else {
      // Reached the end; pause playback
      set({ isPlaying: false });
    }
  },

  prevStep: () => {
    const { currentStepIndex, scenario, selectedSocket } = get();
    const steps = scenario.steps ?? [];
    if (currentStepIndex > 0) {
      const prevIdx = currentStepIndex - 1;
      const targetStep = steps[prevIdx];
      set({
        currentStepIndex: prevIdx,
        selectedPacket: targetStep?.activePacket ?? null,
        selectedSocket: resolveSelectedSocket(targetStep?.activeSockets, selectedSocket),
      });
    }
  },

  goToStep: (index) => {
    const { scenario, selectedSocket } = get();
    const steps = scenario.steps ?? [];
    const safeIdx = Math.max(0, Math.min(index, steps.length - 1));
    const targetStep = steps[safeIdx];
    set({
      currentStepIndex: safeIdx,
      selectedPacket: targetStep?.activePacket ?? null,
      selectedSocket: resolveSelectedSocket(targetStep?.activeSockets, selectedSocket),
    });
  },

  reset: () => {
    const { scenario } = get();
    set({
      currentStepIndex: 0,
      isPlaying: false,
      selectedPacket: scenario.steps[0]?.activePacket ?? null,
      selectedSocket: scenario.steps[0]?.activeSockets[0] ?? null,
    });
  },

  play: () => set({ isPlaying: true }),
  pause: () => set({ isPlaying: false }),
  togglePlay: () => set((state) => ({ isPlaying: !state.isPlaying })),

  setPlaybackSpeed: (speed) => set({ playbackSpeed: speed }),

  setSelectedPacket: (packet) => set({ selectedPacket: packet }),
  setSelectedSocket: (socket) => set({ selectedSocket: socket }),

  resetEpisode: (defaultScenario) =>
    set({
      scenario: defaultScenario ?? SCENARIO_HANDSHAKE,
      currentStepIndex: 0,
      isPlaying: false,
      selectedPacket: (defaultScenario ?? SCENARIO_HANDSHAKE).steps[0]?.activePacket ?? null,
      selectedSocket: (defaultScenario ?? SCENARIO_HANDSHAKE).steps[0]?.activeSockets[0] ?? null,
    }),
}));
