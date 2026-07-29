export type BackendLayoutMode = 
  | "process-architecture" 
  | "io-timeline" 
  | "node-runtime-dashboard";

export interface ProcessArchitectureState {
  showProcess: boolean;
  showMainThread: boolean;
  showThreadPool: boolean;
  howManyThreads?: number;
  showV8: boolean;
  showLibuv: boolean;
  activeComponentId?: "process" | "main-thread" | "thread-pool" | "v8" | "libuv";
}

export interface TimelineRequest {
  id: string;
  label: string;
  startPct: number;
  widthPct: number;
  status: "waiting" | "processing" | "frozen" | "complete";
  isBlocking?: boolean;
}

export interface ThreadPoolThread {
  id: number;
  status: "idle" | "working" | "complete";
  task?: string;
}

export interface PhaseQueueItem {
  id: string;
  label: string;
  isProcessed: boolean;
}

export interface EventLoopPhase {
  name: "timers" | "pending" | "poll" | "check" | "close";
  isActive: boolean;
  queue: PhaseQueueItem[];
}

export interface PriorityQueueItem {
  id: string;
  label: string;
  type: "nextTick" | "microtask";
  isProcessed: boolean;
}

export interface BackendStepState {
  id: string;
  explanation: string;
  toastMessage?: string;
  notes?: { title: string; content: string }[];

  code?: string;
  activeLine?: number | null;

  // Episode 1
  processArchitecture?: ProcessArchitectureState;
  glossaryTerm?: string;

  // Episode 2
  timelineMode?: "blocking" | "nonblocking";
  timelineRequests?: TimelineRequest[];
  threadStatus?: "free" | "frozen" | "working";
  consoleOutput?: string[];

  // Episode 3
  callStack?: { id: string; label: string }[];
  threadPool?: ThreadPoolThread[];
  eventLoopPhases?: EventLoopPhase[];
  nextTickQueue?: PriorityQueueItem[];
  microtaskQueue?: PriorityQueueItem[];
  activePhase?: "idle" | "timers" | "pending" | "poll" | "check" | "close" | "nextTick" | "microtasks";
}

export interface BackendSimulationScenario {
  id: string;
  title: string;
  description: string;
  layoutMode: BackendLayoutMode;
  steps: BackendStepState[];
}
