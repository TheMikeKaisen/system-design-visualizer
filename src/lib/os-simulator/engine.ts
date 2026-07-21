// ═══════════════════════════════════════════════════════
// OS SIMULATOR ENGINE — TYPE DEFINITIONS
// ═══════════════════════════════════════════════════════
// This is the data model for the Operating Systems simulator.
// Following the same data-driven pattern as the JS simulator engine.

// ───────────────────────────────────────────────────────
// PROCESS
// ───────────────────────────────────────────────────────

export type ProcessState =
  | "new"
  | "ready"
  | "running"
  | "waiting"
  | "terminated"
  | "suspend_ready"
  | "suspend_waiting";

export interface ProcessControlBlock {
  programCounter: string;
  registers: { eax: string; ebx: string; ecx: string };
  openFiles: string[];
  memoryLimits: { base: string; limit: string };
  /** Force the PCB viewer to expand */
  forceExpand?: boolean;
  /** Array of field IDs to highlight (e.g. "programCounter", "registers") */
  highlightFields?: string[];
}

export interface OSProcess {
  /** Unique identifier (e.g., "chrome", "spotify") */
  id: string;
  /** Display PID (e.g., "P1", "P2") */
  pid: string;
  /** Human-readable name (e.g., "Chrome", "Spotify") */
  name: string;
  /** Hex color for visual identification */
  color: string;
  /** Current process state */
  state: ProcessState;
  /** Memory footprint in MB */
  memoryMB: number;
  /** I/O device this process is waiting on (when in WAITING state) */
  ioDevice?: string;
  /** Remaining CPU burst time in ms */
  cpuBurstMs?: number;
  /** Process priority (lower = higher priority) */
  priority?: number;
  /** Process Control Block data (for visualizing context switches) */
  pcb?: ProcessControlBlock;
}

// ───────────────────────────────────────────────────────
// CPU
// ───────────────────────────────────────────────────────

export interface CPUState {
  /** ID of the process currently on the CPU (null if idle) */
  currentProcess: string | null;
  /** CPU mode */
  mode: "user" | "kernel" | "idle";
  /** Timer countdown for preemptive scheduling (ms remaining) */
  timerMs?: number;
  /** CPU utilization percentage (0-100) */
  utilizationPct: number;
  /** Current CPU Program Counter */
  programCounter?: string;
  /** Current CPU Registers */
  registers?: { eax: string; ebx: string; ecx: string };
}

// ───────────────────────────────────────────────────────
// SCHEDULER
// ───────────────────────────────────────────────────────

export type SchedulerType = "long_term" | "short_term" | "medium_term";

export interface SchedulerEvent {
  type: SchedulerType;
  /** Whether this scheduler is actively making a decision this step */
  isActive: boolean;
  /** Human-readable action description */
  action?: string;
}

// ───────────────────────────────────────────────────────
// MEMORY
// ───────────────────────────────────────────────────────

export interface MemoryState {
  totalMB: number;
  usedMB: number;
  /** 0-100 percentage */
  usedPct: number;
}

// ───────────────────────────────────────────────────────
// WAIT QUEUE & INTERRUPTS
// ───────────────────────────────────────────────────────

export interface WaitQueueEntry {
  processId: string;
  device: string;
}

export interface InterruptEvent {
  type: "timer" | "io_complete" | "syscall" | "page_fault";
  source: string;
  message: string;
}

// ───────────────────────────────────────────────────────
// OS LOG
// ───────────────────────────────────────────────────────

export interface OSLogEntry {
  timeMs: number;
  message: string;
}

// ───────────────────────────────────────────────────────
// SIMULATION STATE (single step snapshot)
// ───────────────────────────────────────────────────────

export interface OSStepState {
  /** All processes — source of truth for process data */
  processes: Record<string, OSProcess>;

  /** Queue contents (process IDs) */
  newQueue: string[];
  readyQueue: string[];
  waitQueue: WaitQueueEntry[];
  suspendedQueue: string[];
  terminatedList: string[];

  /** CPU state */
  cpu: CPUState;

  /** Memory state */
  memory: MemoryState;

  /** Active scheduler this step (if any) */
  activeScheduler?: SchedulerEvent;

  /** Step explanation text */
  explanation: string;

  /** Optional toast notification */
  toastMessage?: string;

  /** Chapter this step belongs to */
  chapter: string;

  /** Cumulative OS log entries */
  logEntries: OSLogEntry[];

  /** Active interrupt/event overlay */
  activeInterrupt?: InterruptEvent;
}

// ───────────────────────────────────────────────────────
// SCENARIO
// ───────────────────────────────────────────────────────

export interface ChapterMeta {
  title: string;
  /** Inclusive start step index */
  startStep: number;
  /** Inclusive end step index */
  endStep: number;
}

export type SchedulingMode = "non_preemptive" | "preemptive";

export interface OSSimulationScenario {
  id: string;
  title: string;
  description: string;
  chapters: ChapterMeta[];
  steps: OSStepState[];
}
