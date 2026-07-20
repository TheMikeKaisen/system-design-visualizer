// ═══════════════════════════════════════════════════════
// PROCESS STATES SCENARIO — Episode 1
// Chapters 1-2: The Basics + Scheduling Algorithms
// ═══════════════════════════════════════════════════════

import type {
  OSProcess,
  OSStepState,
  OSSimulationScenario,
  OSLogEntry,
  SchedulingMode,
} from "./engine";

// ───────────────────────────────────────────────────────
// PROCESS TEMPLATES
// ───────────────────────────────────────────────────────

const CHROME: OSProcess = {
  id: "chrome",
  pid: "P1",
  name: "Chrome",
  color: "#4285F4",
  state: "new",
  memoryMB: 512,
};

const SPOTIFY: OSProcess = {
  id: "spotify",
  pid: "P2",
  name: "Spotify",
  color: "#1DB954",
  state: "new",
  memoryMB: 256,
};

const VSCODE: OSProcess = {
  id: "vscode",
  pid: "P3",
  name: "VS Code",
  color: "#007ACC",
  state: "new",
  memoryMB: 768,
};

const DISCORD: OSProcess = {
  id: "discord",
  pid: "P4",
  name: "Discord",
  color: "#5865F2",
  state: "new",
  memoryMB: 384,
};

// ───────────────────────────────────────────────────────
// HELPERS
// ───────────────────────────────────────────────────────

/** Create a process with an overridden state and optional extras */
function p(
  base: OSProcess,
  state: OSProcess["state"],
  extras?: Partial<OSProcess>
): OSProcess {
  return { ...base, state, ...extras };
}

/** Compute memory from active (non-terminated, non-removed) processes */
function mem(...processes: OSProcess[]): { totalMB: number; usedMB: number; usedPct: number } {
  const used = processes
    .filter((proc) => proc.state !== "terminated")
    .reduce((sum, proc) => sum + proc.memoryMB, 0);
  return { totalMB: 8192, usedMB: used, usedPct: Math.round((used / 8192) * 100 * 10) / 10 };
}

// ───────────────────────────────────────────────────────
// CHAPTER 1: THE BASICS
// 20 steps: Simple Lifecycle → I/O Wait → Multiple Processes
// ───────────────────────────────────────────────────────

const CHAPTER_1: OSStepState[] = [
  // ── Step 0: Empty system ──
  {
    processes: {},
    newQueue: [],
    readyQueue: [],
    waitQueue: [],
    suspendedQueue: [],
    terminatedList: [],
    cpu: { currentProcess: null, mode: "idle", utilizationPct: 0 },
    memory: { totalMB: 8192, usedMB: 0, usedPct: 0 },
    explanation:
      "The operating system has just booted. No user processes are running yet. The CPU is idle, waiting for work. All process queues are empty.",
    toastMessage: "System booted",
    chapter: "The Basics",
    logEntries: [{ timeMs: 0, message: "System initialized" }],
  },

  // ── Step 1: Chrome arrives → NEW ──
  {
    processes: { chrome: p(CHROME, "new") },
    newQueue: ["chrome"],
    readyQueue: [],
    waitQueue: [],
    suspendedQueue: [],
    terminatedList: [],
    cpu: { currentProcess: null, mode: "idle", utilizationPct: 0 },
    memory: mem(p(CHROME, "new")),
    explanation:
      "A user double-clicks Chrome.exe. The OS creates a new Process Control Block (PCB) — a data structure that stores the process ID, state, registers, and memory info. Chrome enters the NEW state.",
    toastMessage: "New process: Chrome (P1)",
    chapter: "The Basics",
    logEntries: [
      { timeMs: 0, message: "System initialized" },
      { timeMs: 100, message: "Chrome (P1) created → NEW" },
    ],
  },

  // ── Step 2: Long-Term Scheduler admits Chrome → READY ──
  {
    processes: { chrome: p(CHROME, "ready") },
    newQueue: [],
    readyQueue: ["chrome"],
    waitQueue: [],
    suspendedQueue: [],
    terminatedList: [],
    cpu: { currentProcess: null, mode: "idle", utilizationPct: 0 },
    memory: mem(p(CHROME, "ready")),
    activeScheduler: {
      type: "long_term",
      isActive: true,
      action: "Admitting Chrome",
    },
    explanation:
      "The Long-Term Scheduler (Job Scheduler) checks if there's enough memory to run Chrome. There is — so it admits Chrome into the Ready Queue. Chrome is now waiting for CPU time.",
    toastMessage: "Long-Term Scheduler: Admitted Chrome",
    chapter: "The Basics",
    logEntries: [
      { timeMs: 0, message: "System initialized" },
      { timeMs: 100, message: "Chrome (P1) created → NEW" },
      { timeMs: 200, message: "LTS: Chrome (P1) admitted → READY" },
    ],
  },

  // ── Step 3: Short-Term Scheduler dispatches Chrome → CPU ──
  {
    processes: { chrome: p(CHROME, "running") },
    newQueue: [],
    readyQueue: [],
    waitQueue: [],
    suspendedQueue: [],
    terminatedList: [],
    cpu: { currentProcess: "chrome", mode: "user", utilizationPct: 100 },
    memory: mem(p(CHROME, "running")),
    activeScheduler: {
      type: "short_term",
      isActive: true,
      action: "Dispatching Chrome",
    },
    explanation:
      "The Short-Term Scheduler (CPU Scheduler) selects Chrome from the Ready Queue and loads its context into the CPU. Chrome is now RUNNING — the CPU is executing its instructions.",
    toastMessage: "Chrome dispatched to CPU",
    chapter: "The Basics",
    logEntries: [
      { timeMs: 0, message: "System initialized" },
      { timeMs: 100, message: "Chrome (P1) created → NEW" },
      { timeMs: 200, message: "LTS: Chrome (P1) admitted → READY" },
      { timeMs: 300, message: "STS: Chrome (P1) dispatched → RUNNING" },
    ],
  },

  // ── Step 4: Chrome finishes → TERMINATED ──
  {
    processes: { chrome: p(CHROME, "terminated") },
    newQueue: [],
    readyQueue: [],
    waitQueue: [],
    suspendedQueue: [],
    terminatedList: ["chrome"],
    cpu: { currentProcess: null, mode: "idle", utilizationPct: 0 },
    memory: mem(p(CHROME, "terminated")),
    explanation:
      "Chrome completes its execution. The OS moves it to the TERMINATED state. The CPU becomes idle again. The process still exists in memory until its resources are fully cleaned up.",
    toastMessage: "Chrome terminated",
    chapter: "The Basics",
    logEntries: [
      { timeMs: 0, message: "System initialized" },
      { timeMs: 100, message: "Chrome (P1) created → NEW" },
      { timeMs: 200, message: "LTS: Chrome (P1) admitted → READY" },
      { timeMs: 300, message: "STS: Chrome (P1) dispatched → RUNNING" },
      { timeMs: 800, message: "Chrome (P1) exit() → TERMINATED" },
    ],
  },

  // ── Step 5: Resources freed ──
  {
    processes: {},
    newQueue: [],
    readyQueue: [],
    waitQueue: [],
    suspendedQueue: [],
    terminatedList: [],
    cpu: { currentProcess: null, mode: "idle", utilizationPct: 0 },
    memory: { totalMB: 8192, usedMB: 0, usedPct: 0 },
    explanation:
      "All resources allocated to Chrome are released: memory is freed, file handles are closed, the PCB is deleted. The system is back to its initial state — clean and idle.",
    toastMessage: "Resources freed",
    chapter: "The Basics",
    logEntries: [
      { timeMs: 0, message: "System initialized" },
      { timeMs: 100, message: "Chrome (P1) created → NEW" },
      { timeMs: 200, message: "LTS: Chrome (P1) admitted → READY" },
      { timeMs: 300, message: "STS: Chrome (P1) dispatched → RUNNING" },
      { timeMs: 800, message: "Chrome (P1) exit() → TERMINATED" },
      { timeMs: 900, message: "Chrome (P1) resources freed, PCB deleted" },
    ],
  },

  // ── Step 6: Transition to I/O Wait ──
  {
    processes: {},
    newQueue: [],
    readyQueue: [],
    waitQueue: [],
    suspendedQueue: [],
    terminatedList: [],
    cpu: { currentProcess: null, mode: "idle", utilizationPct: 0 },
    memory: { totalMB: 8192, usedMB: 0, usedPct: 0 },
    explanation:
      "That was the simplest lifecycle: NEW → READY → RUNNING → TERMINATED. But what happens when a process needs input from the keyboard, or data from the disk? Let's find out.",
    toastMessage: "Chapter: I/O and Waiting",
    chapter: "The Basics",
    logEntries: [
      { timeMs: 0, message: "System initialized" },
      { timeMs: 100, message: "Chrome (P1) created → NEW" },
      { timeMs: 200, message: "LTS: Chrome (P1) admitted → READY" },
      { timeMs: 300, message: "STS: Chrome (P1) dispatched → RUNNING" },
      { timeMs: 800, message: "Chrome (P1) exit() → TERMINATED" },
      { timeMs: 900, message: "Chrome (P1) resources freed, PCB deleted" },
    ],
  },

  // ── Step 7: Chrome created again, fast-tracked to RUNNING ──
  {
    processes: { chrome: p(CHROME, "running") },
    newQueue: [],
    readyQueue: [],
    waitQueue: [],
    suspendedQueue: [],
    terminatedList: [],
    cpu: { currentProcess: "chrome", mode: "user", utilizationPct: 100 },
    memory: mem(p(CHROME, "running")),
    explanation:
      "Chrome starts up again. It moves through NEW → READY → RUNNING quickly (the same lifecycle you just saw). Now it's running on the CPU, executing its code.",
    toastMessage: "Chrome running",
    chapter: "The Basics",
    logEntries: [
      { timeMs: 0, message: "System initialized" },
      { timeMs: 100, message: "Chrome (P1) created → NEW" },
      { timeMs: 200, message: "LTS: Chrome (P1) admitted → READY" },
      { timeMs: 300, message: "STS: Chrome (P1) dispatched → RUNNING" },
      { timeMs: 800, message: "Chrome (P1) exit() → TERMINATED" },
      { timeMs: 900, message: "Chrome (P1) resources freed, PCB deleted" },
      { timeMs: 1100, message: "Chrome (P1) created → NEW → READY → RUNNING" },
    ],
  },

  // ── Step 8: Chrome requests keyboard I/O ──
  {
    processes: { chrome: p(CHROME, "running") },
    newQueue: [],
    readyQueue: [],
    waitQueue: [],
    suspendedQueue: [],
    terminatedList: [],
    cpu: { currentProcess: "chrome", mode: "kernel", utilizationPct: 100 },
    memory: mem(p(CHROME, "running")),
    activeInterrupt: {
      type: "syscall",
      source: "chrome",
      message: "System Call: Read Keyboard Input",
    },
    explanation:
      "Chrome needs the user to type something. It makes a system call — a request to the OS kernel. The CPU switches from User Mode to Kernel Mode to handle this request.",
    toastMessage: "System call: keyboard read",
    chapter: "The Basics",
    logEntries: [
      { timeMs: 0, message: "System initialized" },
      { timeMs: 100, message: "Chrome (P1) created → NEW" },
      { timeMs: 200, message: "LTS: Chrome (P1) admitted → READY" },
      { timeMs: 300, message: "STS: Chrome (P1) dispatched → RUNNING" },
      { timeMs: 800, message: "Chrome (P1) exit() → TERMINATED" },
      { timeMs: 900, message: "Chrome (P1) resources freed, PCB deleted" },
      { timeMs: 1100, message: "Chrome (P1) created → NEW → READY → RUNNING" },
      { timeMs: 1500, message: "Chrome (P1) syscall: read(keyboard)" },
    ],
  },

  // ── Step 9: Chrome → WAITING, CPU idle ──
  {
    processes: {
      chrome: p(CHROME, "waiting", { ioDevice: "keyboard" }),
    },
    newQueue: [],
    readyQueue: [],
    waitQueue: [{ processId: "chrome", device: "keyboard" }],
    suspendedQueue: [],
    terminatedList: [],
    cpu: { currentProcess: null, mode: "idle", utilizationPct: 0 },
    memory: mem(p(CHROME, "waiting")),
    explanation:
      "Chrome can't continue until the user types something. The OS moves it to the Waiting Queue, tagged with 'Keyboard'. The CPU is now free — but there's nothing else to run, so it goes idle.",
    toastMessage: "Chrome → Waiting (Keyboard)",
    chapter: "The Basics",
    logEntries: [
      { timeMs: 0, message: "System initialized" },
      { timeMs: 100, message: "Chrome (P1) created → NEW" },
      { timeMs: 200, message: "LTS: Chrome (P1) admitted → READY" },
      { timeMs: 300, message: "STS: Chrome (P1) dispatched → RUNNING" },
      { timeMs: 800, message: "Chrome (P1) exit() → TERMINATED" },
      { timeMs: 900, message: "Chrome (P1) resources freed, PCB deleted" },
      { timeMs: 1100, message: "Chrome (P1) created → NEW → READY → RUNNING" },
      { timeMs: 1500, message: "Chrome (P1) syscall: read(keyboard)" },
      { timeMs: 1600, message: "Chrome (P1) → WAITING (keyboard)" },
    ],
  },

  // ── Step 10: Keyboard interrupt fires ──
  {
    processes: {
      chrome: p(CHROME, "waiting", { ioDevice: "keyboard" }),
    },
    newQueue: [],
    readyQueue: [],
    waitQueue: [{ processId: "chrome", device: "keyboard" }],
    suspendedQueue: [],
    terminatedList: [],
    cpu: { currentProcess: null, mode: "kernel", utilizationPct: 0 },
    memory: mem(p(CHROME, "waiting")),
    activeInterrupt: {
      type: "io_complete",
      source: "keyboard",
      message: "Keyboard Interrupt: User Input Received",
    },
    explanation:
      "The user types something! The keyboard controller sends a hardware interrupt to the CPU. The CPU enters Kernel Mode to handle this interrupt and check which process was waiting for keyboard input.",
    toastMessage: "⌨️ Keyboard interrupt!",
    chapter: "The Basics",
    logEntries: [
      { timeMs: 0, message: "System initialized" },
      { timeMs: 100, message: "Chrome (P1) created → NEW" },
      { timeMs: 200, message: "LTS: Chrome (P1) admitted → READY" },
      { timeMs: 300, message: "STS: Chrome (P1) dispatched → RUNNING" },
      { timeMs: 800, message: "Chrome (P1) exit() → TERMINATED" },
      { timeMs: 900, message: "Chrome (P1) resources freed, PCB deleted" },
      { timeMs: 1100, message: "Chrome (P1) created → NEW → READY → RUNNING" },
      { timeMs: 1500, message: "Chrome (P1) syscall: read(keyboard)" },
      { timeMs: 1600, message: "Chrome (P1) → WAITING (keyboard)" },
      { timeMs: 3000, message: "IRQ: Keyboard interrupt received" },
    ],
  },

  // ── Step 11: Chrome → READY ──
  {
    processes: { chrome: p(CHROME, "ready") },
    newQueue: [],
    readyQueue: ["chrome"],
    waitQueue: [],
    suspendedQueue: [],
    terminatedList: [],
    cpu: { currentProcess: null, mode: "idle", utilizationPct: 0 },
    memory: mem(p(CHROME, "ready")),
    explanation:
      "The OS identifies Chrome as the process waiting for keyboard input. It moves Chrome from the Waiting Queue back to the Ready Queue. Chrome can now be scheduled to run again.",
    toastMessage: "Chrome → Ready",
    chapter: "The Basics",
    logEntries: [
      { timeMs: 0, message: "System initialized" },
      { timeMs: 100, message: "Chrome (P1) created → NEW" },
      { timeMs: 200, message: "LTS: Chrome (P1) admitted → READY" },
      { timeMs: 300, message: "STS: Chrome (P1) dispatched → RUNNING" },
      { timeMs: 800, message: "Chrome (P1) exit() → TERMINATED" },
      { timeMs: 900, message: "Chrome (P1) resources freed, PCB deleted" },
      { timeMs: 1100, message: "Chrome (P1) created → NEW → READY → RUNNING" },
      { timeMs: 1500, message: "Chrome (P1) syscall: read(keyboard)" },
      { timeMs: 1600, message: "Chrome (P1) → WAITING (keyboard)" },
      { timeMs: 3000, message: "IRQ: Keyboard interrupt received" },
      { timeMs: 3100, message: "Chrome (P1) WAITING → READY" },
    ],
  },

  // ── Step 12: Chrome dispatched → RUNNING again ──
  {
    processes: { chrome: p(CHROME, "running") },
    newQueue: [],
    readyQueue: [],
    waitQueue: [],
    suspendedQueue: [],
    terminatedList: [],
    cpu: { currentProcess: "chrome", mode: "user", utilizationPct: 100 },
    memory: mem(p(CHROME, "running")),
    activeScheduler: {
      type: "short_term",
      isActive: true,
      action: "Dispatching Chrome",
    },
    explanation:
      "The Short-Term Scheduler dispatches Chrome back to the CPU. It resumes execution exactly where it left off — right after the keyboard read call. This is the power of context saving.",
    toastMessage: "Chrome dispatched to CPU",
    chapter: "The Basics",
    logEntries: [
      { timeMs: 0, message: "System initialized" },
      { timeMs: 100, message: "Chrome (P1) created → NEW" },
      { timeMs: 200, message: "LTS: Chrome (P1) admitted → READY" },
      { timeMs: 300, message: "STS: Chrome (P1) dispatched → RUNNING" },
      { timeMs: 800, message: "Chrome (P1) exit() → TERMINATED" },
      { timeMs: 900, message: "Chrome (P1) resources freed, PCB deleted" },
      { timeMs: 1100, message: "Chrome (P1) created → NEW → READY → RUNNING" },
      { timeMs: 1500, message: "Chrome (P1) syscall: read(keyboard)" },
      { timeMs: 1600, message: "Chrome (P1) → WAITING (keyboard)" },
      { timeMs: 3000, message: "IRQ: Keyboard interrupt received" },
      { timeMs: 3100, message: "Chrome (P1) WAITING → READY" },
      { timeMs: 3200, message: "STS: Chrome (P1) dispatched → RUNNING" },
    ],
  },

  // ── Step 13: Transition to Multiple Processes ──
  {
    processes: {},
    newQueue: [],
    readyQueue: [],
    waitQueue: [],
    suspendedQueue: [],
    terminatedList: [],
    cpu: { currentProcess: null, mode: "idle", utilizationPct: 0 },
    memory: { totalMB: 8192, usedMB: 0, usedPct: 0 },
    explanation:
      "Now you understand the complete I/O cycle: RUNNING → WAITING → READY → RUNNING. But real operating systems don't run just one process. Let's see what happens when multiple programs compete for the CPU.",
    toastMessage: "Chapter: Multiple Processes",
    chapter: "The Basics",
    logEntries: [
      { timeMs: 0, message: "System initialized" },
      { timeMs: 100, message: "Chrome (P1) created → NEW" },
      { timeMs: 200, message: "LTS: Chrome (P1) admitted → READY" },
      { timeMs: 300, message: "STS: Chrome (P1) dispatched → RUNNING" },
      { timeMs: 800, message: "Chrome (P1) exit() → TERMINATED" },
      { timeMs: 900, message: "Chrome (P1) resources freed, PCB deleted" },
      { timeMs: 1100, message: "Chrome (P1) created → NEW → READY → RUNNING" },
      { timeMs: 1500, message: "Chrome (P1) syscall: read(keyboard)" },
      { timeMs: 1600, message: "Chrome (P1) → WAITING (keyboard)" },
      { timeMs: 3000, message: "IRQ: Keyboard interrupt received" },
      { timeMs: 3100, message: "Chrome (P1) WAITING → READY" },
      { timeMs: 3200, message: "STS: Chrome (P1) dispatched → RUNNING" },
    ],
  },

  // ── Step 14: Four processes arrive → NEW ──
  {
    processes: {
      chrome: p(CHROME, "new"),
      spotify: p(SPOTIFY, "new"),
      vscode: p(VSCODE, "new"),
      discord: p(DISCORD, "new"),
    },
    newQueue: ["chrome", "spotify", "vscode", "discord"],
    readyQueue: [],
    waitQueue: [],
    suspendedQueue: [],
    terminatedList: [],
    cpu: { currentProcess: null, mode: "idle", utilizationPct: 0 },
    memory: mem(p(CHROME, "new"), p(SPOTIFY, "new"), p(VSCODE, "new"), p(DISCORD, "new")),
    explanation:
      "Four applications start simultaneously: Chrome, Spotify, VS Code, and Discord. The OS creates a PCB for each and places them all in the NEW state. Notice how memory usage jumps as each process claims its share.",
    toastMessage: "4 new processes created",
    chapter: "The Basics",
    logEntries: [
      { timeMs: 0, message: "System initialized" },
      { timeMs: 100, message: "Chrome (P1) created → NEW" },
      { timeMs: 200, message: "LTS: Chrome (P1) admitted → READY" },
      { timeMs: 300, message: "STS: Chrome (P1) dispatched → RUNNING" },
      { timeMs: 800, message: "Chrome (P1) exit() → TERMINATED" },
      { timeMs: 900, message: "Chrome (P1) resources freed, PCB deleted" },
      { timeMs: 1100, message: "Chrome (P1) created → NEW → READY → RUNNING" },
      { timeMs: 1500, message: "Chrome (P1) syscall: read(keyboard)" },
      { timeMs: 1600, message: "Chrome (P1) → WAITING (keyboard)" },
      { timeMs: 3000, message: "IRQ: Keyboard interrupt received" },
      { timeMs: 3100, message: "Chrome (P1) WAITING → READY" },
      { timeMs: 3200, message: "STS: Chrome (P1) dispatched → RUNNING" },
      { timeMs: 4100, message: "Chrome (P1), Spotify (P2), VS Code (P3), Discord (P4) → NEW" },
    ],
  },

  // ── Step 15: Long-Term Scheduler admits all → READY ──
  {
    processes: {
      chrome: p(CHROME, "ready"),
      spotify: p(SPOTIFY, "ready"),
      vscode: p(VSCODE, "ready"),
      discord: p(DISCORD, "ready"),
    },
    newQueue: [],
    readyQueue: ["chrome", "spotify", "vscode", "discord"],
    waitQueue: [],
    suspendedQueue: [],
    terminatedList: [],
    cpu: { currentProcess: null, mode: "idle", utilizationPct: 0 },
    memory: mem(p(CHROME, "ready"), p(SPOTIFY, "ready"), p(VSCODE, "ready"), p(DISCORD, "ready")),
    activeScheduler: {
      type: "long_term",
      isActive: true,
      action: "Admitting all 4 processes",
    },
    explanation:
      "The Long-Term Scheduler checks available memory. There's enough RAM for all four processes (total: 1,920 MB out of 8,192 MB). All four are admitted to the Ready Queue.",
    toastMessage: "All 4 processes admitted to Ready Queue",
    chapter: "The Basics",
    logEntries: [
      { timeMs: 0, message: "System initialized" },
      { timeMs: 100, message: "Chrome (P1) created → NEW" },
      { timeMs: 200, message: "LTS: Chrome (P1) admitted → READY" },
      { timeMs: 300, message: "STS: Chrome (P1) dispatched → RUNNING" },
      { timeMs: 800, message: "Chrome (P1) exit() → TERMINATED" },
      { timeMs: 900, message: "Chrome (P1) resources freed, PCB deleted" },
      { timeMs: 1100, message: "Chrome (P1) created → NEW → READY → RUNNING" },
      { timeMs: 1500, message: "Chrome (P1) syscall: read(keyboard)" },
      { timeMs: 1600, message: "Chrome (P1) → WAITING (keyboard)" },
      { timeMs: 3000, message: "IRQ: Keyboard interrupt received" },
      { timeMs: 3100, message: "Chrome (P1) WAITING → READY" },
      { timeMs: 3200, message: "STS: Chrome (P1) dispatched → RUNNING" },
      { timeMs: 4100, message: "Chrome (P1), Spotify (P2), VS Code (P3), Discord (P4) → NEW" },
      { timeMs: 4200, message: "LTS: All 4 processes admitted → READY" },
    ],
  },

  // ── Step 16: Short-Term Scheduler picks Chrome → CPU ──
  {
    processes: {
      chrome: p(CHROME, "running"),
      spotify: p(SPOTIFY, "ready"),
      vscode: p(VSCODE, "ready"),
      discord: p(DISCORD, "ready"),
    },
    newQueue: [],
    readyQueue: ["spotify", "vscode", "discord"],
    waitQueue: [],
    suspendedQueue: [],
    terminatedList: [],
    cpu: { currentProcess: "chrome", mode: "user", utilizationPct: 100 },
    memory: mem(p(CHROME, "running"), p(SPOTIFY, "ready"), p(VSCODE, "ready"), p(DISCORD, "ready")),
    activeScheduler: {
      type: "short_term",
      isActive: true,
      action: "Dispatching Chrome (FCFS)",
    },
    explanation:
      "The Short-Term Scheduler uses First-Come-First-Served (FCFS) and picks Chrome — it arrived first. Chrome enters the CPU. Spotify, VS Code, and Discord wait their turn in the Ready Queue.",
    toastMessage: "Chrome dispatched (FCFS)",
    chapter: "The Basics",
    logEntries: [
      { timeMs: 0, message: "System initialized" },
      { timeMs: 100, message: "Chrome (P1) created → NEW" },
      { timeMs: 200, message: "LTS: Chrome (P1) admitted → READY" },
      { timeMs: 300, message: "STS: Chrome (P1) dispatched → RUNNING" },
      { timeMs: 800, message: "Chrome (P1) exit() → TERMINATED" },
      { timeMs: 900, message: "Chrome (P1) resources freed, PCB deleted" },
      { timeMs: 1100, message: "Chrome (P1) created → NEW → READY → RUNNING" },
      { timeMs: 1500, message: "Chrome (P1) syscall: read(keyboard)" },
      { timeMs: 1600, message: "Chrome (P1) → WAITING (keyboard)" },
      { timeMs: 3000, message: "IRQ: Keyboard interrupt received" },
      { timeMs: 3100, message: "Chrome (P1) WAITING → READY" },
      { timeMs: 3200, message: "STS: Chrome (P1) dispatched → RUNNING" },
      { timeMs: 4100, message: "Chrome (P1), Spotify (P2), VS Code (P3), Discord (P4) → NEW" },
      { timeMs: 4200, message: "LTS: All 4 processes admitted → READY" },
      { timeMs: 4300, message: "STS: Chrome (P1) dispatched → RUNNING (FCFS)" },
    ],
  },

  // ── Step 17: Chrome requests disk I/O → WAITING, Spotify dispatched ──
  {
    processes: {
      chrome: p(CHROME, "waiting", { ioDevice: "disk" }),
      spotify: p(SPOTIFY, "running"),
      vscode: p(VSCODE, "ready"),
      discord: p(DISCORD, "ready"),
    },
    newQueue: [],
    readyQueue: ["vscode", "discord"],
    waitQueue: [{ processId: "chrome", device: "disk" }],
    suspendedQueue: [],
    terminatedList: [],
    cpu: { currentProcess: "spotify", mode: "user", utilizationPct: 100 },
    memory: mem(
      p(CHROME, "waiting"),
      p(SPOTIFY, "running"),
      p(VSCODE, "ready"),
      p(DISCORD, "ready")
    ),
    activeScheduler: {
      type: "short_term",
      isActive: true,
      action: "Dispatching Spotify",
    },
    explanation:
      "Chrome requests data from the disk — a slow I/O operation. The OS moves Chrome to the Waiting Queue (tagged: Disk). The CPU is immediately given to Spotify. No CPU time is wasted waiting for the disk!",
    toastMessage: "Chrome → Waiting (Disk), Spotify dispatched",
    chapter: "The Basics",
    logEntries: [
      { timeMs: 0, message: "System initialized" },
      { timeMs: 100, message: "Chrome (P1) created → NEW" },
      { timeMs: 200, message: "LTS: Chrome (P1) admitted → READY" },
      { timeMs: 300, message: "STS: Chrome (P1) dispatched → RUNNING" },
      { timeMs: 800, message: "Chrome (P1) exit() → TERMINATED" },
      { timeMs: 900, message: "Chrome (P1) resources freed, PCB deleted" },
      { timeMs: 1100, message: "Chrome (P1) created → NEW → READY → RUNNING" },
      { timeMs: 1500, message: "Chrome (P1) syscall: read(keyboard)" },
      { timeMs: 1600, message: "Chrome (P1) → WAITING (keyboard)" },
      { timeMs: 3000, message: "IRQ: Keyboard interrupt received" },
      { timeMs: 3100, message: "Chrome (P1) WAITING → READY" },
      { timeMs: 3200, message: "STS: Chrome (P1) dispatched → RUNNING" },
      { timeMs: 4100, message: "Chrome (P1), Spotify (P2), VS Code (P3), Discord (P4) → NEW" },
      { timeMs: 4200, message: "LTS: All 4 processes admitted → READY" },
      { timeMs: 4300, message: "STS: Chrome (P1) dispatched → RUNNING (FCFS)" },
      { timeMs: 5000, message: "Chrome (P1) syscall: read(disk) → WAITING" },
      { timeMs: 5001, message: "STS: Spotify (P2) dispatched → RUNNING" },
    ],
  },

  // ── Step 18: Disk completes → Chrome back to READY ──
  {
    processes: {
      chrome: p(CHROME, "ready"),
      spotify: p(SPOTIFY, "running"),
      vscode: p(VSCODE, "ready"),
      discord: p(DISCORD, "ready"),
    },
    newQueue: [],
    readyQueue: ["vscode", "discord", "chrome"],
    waitQueue: [],
    suspendedQueue: [],
    terminatedList: [],
    cpu: { currentProcess: "spotify", mode: "user", utilizationPct: 100 },
    memory: mem(
      p(CHROME, "ready"),
      p(SPOTIFY, "running"),
      p(VSCODE, "ready"),
      p(DISCORD, "ready")
    ),
    activeInterrupt: {
      type: "io_complete",
      source: "disk",
      message: "Disk I/O Complete",
    },
    explanation:
      "The disk controller signals completion via a hardware interrupt. Chrome's data is ready! The OS moves Chrome from the Waiting Queue back to the Ready Queue (at the end). Spotify keeps running — it's not interrupted.",
    toastMessage: "💾 Disk complete — Chrome → Ready",
    chapter: "The Basics",
    logEntries: [
      { timeMs: 0, message: "System initialized" },
      { timeMs: 100, message: "Chrome (P1) created → NEW" },
      { timeMs: 200, message: "LTS: Chrome (P1) admitted → READY" },
      { timeMs: 300, message: "STS: Chrome (P1) dispatched → RUNNING" },
      { timeMs: 800, message: "Chrome (P1) exit() → TERMINATED" },
      { timeMs: 900, message: "Chrome (P1) resources freed, PCB deleted" },
      { timeMs: 1100, message: "Chrome (P1) created → NEW → READY → RUNNING" },
      { timeMs: 1500, message: "Chrome (P1) syscall: read(keyboard)" },
      { timeMs: 1600, message: "Chrome (P1) → WAITING (keyboard)" },
      { timeMs: 3000, message: "IRQ: Keyboard interrupt received" },
      { timeMs: 3100, message: "Chrome (P1) WAITING → READY" },
      { timeMs: 3200, message: "STS: Chrome (P1) dispatched → RUNNING" },
      { timeMs: 4100, message: "Chrome (P1), Spotify (P2), VS Code (P3), Discord (P4) → NEW" },
      { timeMs: 4200, message: "LTS: All 4 processes admitted → READY" },
      { timeMs: 4300, message: "STS: Chrome (P1) dispatched → RUNNING (FCFS)" },
      { timeMs: 5000, message: "Chrome (P1) syscall: read(disk) → WAITING" },
      { timeMs: 5001, message: "STS: Spotify (P2) dispatched → RUNNING" },
      { timeMs: 6000, message: "IRQ: Disk I/O complete" },
      { timeMs: 6001, message: "Chrome (P1) WAITING → READY" },
    ],
  },

  // ── Step 19: Spotify finishes, VSCode dispatched ──
  {
    processes: {
      chrome: p(CHROME, "ready"),
      spotify: p(SPOTIFY, "terminated"),
      vscode: p(VSCODE, "running"),
      discord: p(DISCORD, "ready"),
    },
    newQueue: [],
    readyQueue: ["discord", "chrome"],
    waitQueue: [],
    suspendedQueue: [],
    terminatedList: ["spotify"],
    cpu: { currentProcess: "vscode", mode: "user", utilizationPct: 100 },
    memory: mem(
      p(CHROME, "ready"),
      p(SPOTIFY, "terminated"),
      p(VSCODE, "running"),
      p(DISCORD, "ready")
    ),
    activeScheduler: {
      type: "short_term",
      isActive: true,
      action: "Dispatching VS Code",
    },
    explanation:
      "Spotify finishes execution and moves to TERMINATED. The Short-Term Scheduler immediately dispatches VS Code from the Ready Queue. Discord and Chrome continue waiting for their turn.",
    toastMessage: "Spotify done — VS Code dispatched",
    chapter: "The Basics",
    logEntries: [
      { timeMs: 0, message: "System initialized" },
      { timeMs: 100, message: "Chrome (P1) created → NEW" },
      { timeMs: 200, message: "LTS: Chrome (P1) admitted → READY" },
      { timeMs: 300, message: "STS: Chrome (P1) dispatched → RUNNING" },
      { timeMs: 800, message: "Chrome (P1) exit() → TERMINATED" },
      { timeMs: 900, message: "Chrome (P1) resources freed, PCB deleted" },
      { timeMs: 1100, message: "Chrome (P1) created → NEW → READY → RUNNING" },
      { timeMs: 1500, message: "Chrome (P1) syscall: read(keyboard)" },
      { timeMs: 1600, message: "Chrome (P1) → WAITING (keyboard)" },
      { timeMs: 3000, message: "IRQ: Keyboard interrupt received" },
      { timeMs: 3100, message: "Chrome (P1) WAITING → READY" },
      { timeMs: 3200, message: "STS: Chrome (P1) dispatched → RUNNING" },
      { timeMs: 4100, message: "Chrome (P1), Spotify (P2), VS Code (P3), Discord (P4) → NEW" },
      { timeMs: 4200, message: "LTS: All 4 processes admitted → READY" },
      { timeMs: 4300, message: "STS: Chrome (P1) dispatched → RUNNING (FCFS)" },
      { timeMs: 5000, message: "Chrome (P1) syscall: read(disk) → WAITING" },
      { timeMs: 5001, message: "STS: Spotify (P2) dispatched → RUNNING" },
      { timeMs: 6000, message: "IRQ: Disk I/O complete" },
      { timeMs: 6001, message: "Chrome (P1) WAITING → READY" },
      { timeMs: 6500, message: "Spotify (P2) → TERMINATED" },
      { timeMs: 6501, message: "STS: VS Code (P3) dispatched → RUNNING" },
    ],
  },
];

// ───────────────────────────────────────────────────────
// CHAPTER 2A: NON-PREEMPTIVE SCHEDULING (FCFS)
// ───────────────────────────────────────────────────────

const CH2_LOG_BASE: OSLogEntry[] = [
  { timeMs: 0, message: "--- Scheduling Demo ---" },
  { timeMs: 100, message: "Chrome (P1), Spotify (P2), VS Code (P3), Discord (P4) → READY" },
];

const CHAPTER_2_NON_PREEMPTIVE: OSStepState[] = [
  // ── Step 0: Setup ──
  {
    processes: {
      chrome: p(CHROME, "ready"),
      spotify: p(SPOTIFY, "ready"),
      vscode: p(VSCODE, "ready"),
      discord: p(DISCORD, "ready"),
    },
    newQueue: [],
    readyQueue: ["chrome", "spotify", "vscode", "discord"],
    waitQueue: [],
    suspendedQueue: [],
    terminatedList: [],
    cpu: { currentProcess: null, mode: "idle", utilizationPct: 0 },
    memory: mem(p(CHROME, "ready"), p(SPOTIFY, "ready"), p(VSCODE, "ready"), p(DISCORD, "ready")),
    explanation:
      "Non-Preemptive Scheduling (FCFS): Four processes are ready. In this mode, once a process gets the CPU, it runs until it finishes or voluntarily gives up the CPU. No timer interrupts. No forced context switches.",
    toastMessage: "Mode: Non-Preemptive (FCFS)",
    chapter: "Scheduling Algorithms",
    logEntries: [...CH2_LOG_BASE],
  },

  // ── Step 1: Chrome dispatched ──
  {
    processes: {
      chrome: p(CHROME, "running"),
      spotify: p(SPOTIFY, "ready"),
      vscode: p(VSCODE, "ready"),
      discord: p(DISCORD, "ready"),
    },
    newQueue: [],
    readyQueue: ["spotify", "vscode", "discord"],
    waitQueue: [],
    suspendedQueue: [],
    terminatedList: [],
    cpu: { currentProcess: "chrome", mode: "user", utilizationPct: 100 },
    memory: mem(p(CHROME, "running"), p(SPOTIFY, "ready"), p(VSCODE, "ready"), p(DISCORD, "ready")),
    activeScheduler: {
      type: "short_term",
      isActive: true,
      action: "Dispatching Chrome (FCFS)",
    },
    explanation:
      "Chrome is first in the queue and gets dispatched to the CPU. There is no timer — Chrome will run for as long as it needs. The other three processes can only wait.",
    toastMessage: "Chrome dispatched — no timer",
    chapter: "Scheduling Algorithms",
    logEntries: [
      ...CH2_LOG_BASE,
      { timeMs: 200, message: "STS: Chrome (P1) dispatched → RUNNING (no preemption)" },
    ],
  },

  // ── Step 2: Chrome runs uninterrupted ──
  {
    processes: {
      chrome: p(CHROME, "running"),
      spotify: p(SPOTIFY, "ready"),
      vscode: p(VSCODE, "ready"),
      discord: p(DISCORD, "ready"),
    },
    newQueue: [],
    readyQueue: ["spotify", "vscode", "discord"],
    waitQueue: [],
    suspendedQueue: [],
    terminatedList: [],
    cpu: { currentProcess: "chrome", mode: "user", utilizationPct: 100 },
    memory: mem(p(CHROME, "running"), p(SPOTIFY, "ready"), p(VSCODE, "ready"), p(DISCORD, "ready")),
    explanation:
      "Chrome continues running. And running. And running. Spotify, VS Code, and Discord are stuck waiting. If Chrome takes 30 seconds, the others wait 30 seconds. This is the 'convoy effect' — one slow process blocks everyone.",
    chapter: "Scheduling Algorithms",
    logEntries: [
      ...CH2_LOG_BASE,
      { timeMs: 200, message: "STS: Chrome (P1) dispatched → RUNNING (no preemption)" },
      { timeMs: 5000, message: "Chrome (P1) still running... (4800ms elapsed)" },
    ],
  },

  // ── Step 3: Chrome finishes → Spotify dispatched ──
  {
    processes: {
      chrome: p(CHROME, "terminated"),
      spotify: p(SPOTIFY, "running"),
      vscode: p(VSCODE, "ready"),
      discord: p(DISCORD, "ready"),
    },
    newQueue: [],
    readyQueue: ["vscode", "discord"],
    waitQueue: [],
    suspendedQueue: [],
    terminatedList: ["chrome"],
    cpu: { currentProcess: "spotify", mode: "user", utilizationPct: 100 },
    memory: mem(
      p(CHROME, "terminated"),
      p(SPOTIFY, "running"),
      p(VSCODE, "ready"),
      p(DISCORD, "ready")
    ),
    activeScheduler: {
      type: "short_term",
      isActive: true,
      action: "Dispatching Spotify",
    },
    explanation:
      "Chrome finally finishes and moves to TERMINATED. Only NOW does Spotify get its turn. The scheduler dispatches Spotify to the CPU. VS Code and Discord continue waiting.",
    toastMessage: "Chrome done — Spotify dispatched",
    chapter: "Scheduling Algorithms",
    logEntries: [
      ...CH2_LOG_BASE,
      { timeMs: 200, message: "STS: Chrome (P1) dispatched → RUNNING (no preemption)" },
      { timeMs: 5000, message: "Chrome (P1) still running... (4800ms elapsed)" },
      { timeMs: 10000, message: "Chrome (P1) → TERMINATED" },
      { timeMs: 10001, message: "STS: Spotify (P2) dispatched → RUNNING" },
    ],
  },

  // ── Step 4: Spotify finishes → VSCode dispatched ──
  {
    processes: {
      chrome: p(CHROME, "terminated"),
      spotify: p(SPOTIFY, "terminated"),
      vscode: p(VSCODE, "running"),
      discord: p(DISCORD, "ready"),
    },
    newQueue: [],
    readyQueue: ["discord"],
    waitQueue: [],
    suspendedQueue: [],
    terminatedList: ["chrome", "spotify"],
    cpu: { currentProcess: "vscode", mode: "user", utilizationPct: 100 },
    memory: mem(
      p(CHROME, "terminated"),
      p(SPOTIFY, "terminated"),
      p(VSCODE, "running"),
      p(DISCORD, "ready")
    ),
    activeScheduler: {
      type: "short_term",
      isActive: true,
      action: "Dispatching VS Code",
    },
    explanation:
      "Spotify finishes. VS Code gets dispatched. Discord is still waiting — it's been in the Ready Queue this whole time. With non-preemptive scheduling, the last process in the queue suffers the most.",
    toastMessage: "Spotify done — VS Code dispatched",
    chapter: "Scheduling Algorithms",
    logEntries: [
      ...CH2_LOG_BASE,
      { timeMs: 200, message: "STS: Chrome (P1) dispatched → RUNNING (no preemption)" },
      { timeMs: 5000, message: "Chrome (P1) still running... (4800ms elapsed)" },
      { timeMs: 10000, message: "Chrome (P1) → TERMINATED" },
      { timeMs: 10001, message: "STS: Spotify (P2) dispatched → RUNNING" },
      { timeMs: 15000, message: "Spotify (P2) → TERMINATED" },
      { timeMs: 15001, message: "STS: VS Code (P3) dispatched → RUNNING" },
    ],
  },

  // ── Step 5: VSCode finishes → Discord dispatched ──
  {
    processes: {
      chrome: p(CHROME, "terminated"),
      spotify: p(SPOTIFY, "terminated"),
      vscode: p(VSCODE, "terminated"),
      discord: p(DISCORD, "running"),
    },
    newQueue: [],
    readyQueue: [],
    waitQueue: [],
    suspendedQueue: [],
    terminatedList: ["chrome", "spotify", "vscode"],
    cpu: { currentProcess: "discord", mode: "user", utilizationPct: 100 },
    memory: mem(
      p(CHROME, "terminated"),
      p(SPOTIFY, "terminated"),
      p(VSCODE, "terminated"),
      p(DISCORD, "running")
    ),
    activeScheduler: {
      type: "short_term",
      isActive: true,
      action: "Dispatching Discord",
    },
    explanation:
      "VS Code finishes. Discord — which has been waiting the entire time — finally gets the CPU. It had to wait for all three processes ahead of it to complete. This is why non-preemptive scheduling can feel 'unfair'.",
    toastMessage: "Discord finally gets CPU!",
    chapter: "Scheduling Algorithms",
    logEntries: [
      ...CH2_LOG_BASE,
      { timeMs: 200, message: "STS: Chrome (P1) dispatched → RUNNING (no preemption)" },
      { timeMs: 5000, message: "Chrome (P1) still running... (4800ms elapsed)" },
      { timeMs: 10000, message: "Chrome (P1) → TERMINATED" },
      { timeMs: 10001, message: "STS: Spotify (P2) dispatched → RUNNING" },
      { timeMs: 15000, message: "Spotify (P2) → TERMINATED" },
      { timeMs: 15001, message: "STS: VS Code (P3) dispatched → RUNNING" },
      { timeMs: 22000, message: "VS Code (P3) → TERMINATED" },
      { timeMs: 22001, message: "STS: Discord (P4) dispatched → RUNNING" },
    ],
  },

  // ── Step 6: Summary ──
  {
    processes: {
      chrome: p(CHROME, "terminated"),
      spotify: p(SPOTIFY, "terminated"),
      vscode: p(VSCODE, "terminated"),
      discord: p(DISCORD, "terminated"),
    },
    newQueue: [],
    readyQueue: [],
    waitQueue: [],
    suspendedQueue: [],
    terminatedList: ["chrome", "spotify", "vscode", "discord"],
    cpu: { currentProcess: null, mode: "idle", utilizationPct: 0 },
    memory: mem(
      p(CHROME, "terminated"),
      p(SPOTIFY, "terminated"),
      p(VSCODE, "terminated"),
      p(DISCORD, "terminated")
    ),
    explanation:
      "All processes are done. Non-Preemptive (FCFS) is simple — but it suffers from the Convoy Effect: short processes stuck behind long ones. There are no context switches (good for overhead) but terrible for response time. Toggle to 'Preemptive' to see how Round Robin solves this!",
    toastMessage: "Non-Preemptive Demo Complete",
    chapter: "Scheduling Algorithms",
    logEntries: [
      ...CH2_LOG_BASE,
      { timeMs: 200, message: "STS: Chrome (P1) dispatched → RUNNING (no preemption)" },
      { timeMs: 5000, message: "Chrome (P1) still running... (4800ms elapsed)" },
      { timeMs: 10000, message: "Chrome (P1) → TERMINATED" },
      { timeMs: 10001, message: "STS: Spotify (P2) dispatched → RUNNING" },
      { timeMs: 15000, message: "Spotify (P2) → TERMINATED" },
      { timeMs: 15001, message: "STS: VS Code (P3) dispatched → RUNNING" },
      { timeMs: 22000, message: "VS Code (P3) → TERMINATED" },
      { timeMs: 22001, message: "STS: Discord (P4) dispatched → RUNNING" },
      { timeMs: 27000, message: "Discord (P4) → TERMINATED" },
      { timeMs: 27001, message: "All processes complete. Context switches: 3" },
    ],
  },
];

// ───────────────────────────────────────────────────────
// CHAPTER 2B: PREEMPTIVE SCHEDULING (ROUND ROBIN, q=4ms)
// ───────────────────────────────────────────────────────

const CHAPTER_2_PREEMPTIVE: OSStepState[] = [
  // ── Step 0: Setup ──
  {
    processes: {
      chrome: p(CHROME, "ready"),
      spotify: p(SPOTIFY, "ready"),
      vscode: p(VSCODE, "ready"),
      discord: p(DISCORD, "ready"),
    },
    newQueue: [],
    readyQueue: ["chrome", "spotify", "vscode", "discord"],
    waitQueue: [],
    suspendedQueue: [],
    terminatedList: [],
    cpu: { currentProcess: null, mode: "idle", utilizationPct: 0 },
    memory: mem(p(CHROME, "ready"), p(SPOTIFY, "ready"), p(VSCODE, "ready"), p(DISCORD, "ready")),
    explanation:
      "Preemptive Scheduling (Round Robin): Same four processes, same Ready Queue. But now there's a timer! Each process gets a fixed time quantum (4ms). When the timer expires, the OS forcefully takes the CPU away — even if the process isn't finished.",
    toastMessage: "Mode: Preemptive (Round Robin, q=4ms)",
    chapter: "Scheduling Algorithms",
    logEntries: [...CH2_LOG_BASE],
  },

  // ── Step 1: Chrome dispatched, timer starts ──
  {
    processes: {
      chrome: p(CHROME, "running"),
      spotify: p(SPOTIFY, "ready"),
      vscode: p(VSCODE, "ready"),
      discord: p(DISCORD, "ready"),
    },
    newQueue: [],
    readyQueue: ["spotify", "vscode", "discord"],
    waitQueue: [],
    suspendedQueue: [],
    terminatedList: [],
    cpu: { currentProcess: "chrome", mode: "user", utilizationPct: 100, timerMs: 4 },
    memory: mem(p(CHROME, "running"), p(SPOTIFY, "ready"), p(VSCODE, "ready"), p(DISCORD, "ready")),
    activeScheduler: {
      type: "short_term",
      isActive: true,
      action: "Dispatching Chrome (RR)",
    },
    explanation:
      "Chrome is dispatched to the CPU. But notice something new: a timer starts counting down from 4ms. This is the time quantum. When it hits zero, Chrome will be forcefully removed — whether it's done or not.",
    toastMessage: "Chrome dispatched — timer: 4ms",
    chapter: "Scheduling Algorithms",
    logEntries: [
      ...CH2_LOG_BASE,
      { timeMs: 200, message: "STS: Chrome (P1) dispatched → RUNNING (quantum=4ms)" },
    ],
  },

  // ── Step 2: Timer counting down ──
  {
    processes: {
      chrome: p(CHROME, "running"),
      spotify: p(SPOTIFY, "ready"),
      vscode: p(VSCODE, "ready"),
      discord: p(DISCORD, "ready"),
    },
    newQueue: [],
    readyQueue: ["spotify", "vscode", "discord"],
    waitQueue: [],
    suspendedQueue: [],
    terminatedList: [],
    cpu: { currentProcess: "chrome", mode: "user", utilizationPct: 100, timerMs: 2 },
    memory: mem(p(CHROME, "running"), p(SPOTIFY, "ready"), p(VSCODE, "ready"), p(DISCORD, "ready")),
    explanation:
      "Chrome is running. The timer ticks down: 4ms → 2ms. Chrome is using its allocated time slice. Spotify, VS Code, and Discord wait — but they know their turn is coming soon.",
    chapter: "Scheduling Algorithms",
    logEntries: [
      ...CH2_LOG_BASE,
      { timeMs: 200, message: "STS: Chrome (P1) dispatched → RUNNING (quantum=4ms)" },
      { timeMs: 2200, message: "Chrome (P1) running... quantum remaining: 2ms" },
    ],
  },

  // ── Step 3: Timer expires! Interrupt! ──
  {
    processes: {
      chrome: p(CHROME, "running"),
      spotify: p(SPOTIFY, "ready"),
      vscode: p(VSCODE, "ready"),
      discord: p(DISCORD, "ready"),
    },
    newQueue: [],
    readyQueue: ["spotify", "vscode", "discord"],
    waitQueue: [],
    suspendedQueue: [],
    terminatedList: [],
    cpu: { currentProcess: "chrome", mode: "kernel", utilizationPct: 100, timerMs: 0 },
    memory: mem(p(CHROME, "running"), p(SPOTIFY, "ready"), p(VSCODE, "ready"), p(DISCORD, "ready")),
    activeInterrupt: {
      type: "timer",
      source: "cpu_timer",
      message: "Timer Interrupt! Quantum Expired!",
    },
    explanation:
      "TIME'S UP! The hardware timer fires an interrupt. The CPU switches to Kernel Mode. The OS saves Chrome's entire state (registers, program counter, stack pointer) so it can resume later. This is a context switch.",
    toastMessage: "⏰ Timer interrupt!",
    chapter: "Scheduling Algorithms",
    logEntries: [
      ...CH2_LOG_BASE,
      { timeMs: 200, message: "STS: Chrome (P1) dispatched → RUNNING (quantum=4ms)" },
      { timeMs: 2200, message: "Chrome (P1) running... quantum remaining: 2ms" },
      { timeMs: 4200, message: "IRQ: Timer interrupt — quantum expired for Chrome (P1)" },
    ],
  },

  // ── Step 4: Chrome → READY (back of queue), Spotify dispatched ──
  {
    processes: {
      chrome: p(CHROME, "ready"),
      spotify: p(SPOTIFY, "running"),
      vscode: p(VSCODE, "ready"),
      discord: p(DISCORD, "ready"),
    },
    newQueue: [],
    readyQueue: ["vscode", "discord", "chrome"],
    waitQueue: [],
    suspendedQueue: [],
    terminatedList: [],
    cpu: { currentProcess: "spotify", mode: "user", utilizationPct: 100, timerMs: 4 },
    memory: mem(p(CHROME, "ready"), p(SPOTIFY, "running"), p(VSCODE, "ready"), p(DISCORD, "ready")),
    activeScheduler: {
      type: "short_term",
      isActive: true,
      action: "Context switch: Chrome → Spotify",
    },
    explanation:
      "Chrome is preempted and sent to the BACK of the Ready Queue. Spotify gets dispatched with a fresh 4ms quantum. Notice Chrome isn't terminated — it's just waiting for its next turn. This is the key difference from non-preemptive scheduling!",
    toastMessage: "Context switch: Spotify dispatched",
    chapter: "Scheduling Algorithms",
    logEntries: [
      ...CH2_LOG_BASE,
      { timeMs: 200, message: "STS: Chrome (P1) dispatched → RUNNING (quantum=4ms)" },
      { timeMs: 2200, message: "Chrome (P1) running... quantum remaining: 2ms" },
      { timeMs: 4200, message: "IRQ: Timer interrupt — quantum expired for Chrome (P1)" },
      { timeMs: 4201, message: "Context switch: Chrome (P1) → READY (back of queue)" },
      { timeMs: 4202, message: "STS: Spotify (P2) dispatched → RUNNING (quantum=4ms)" },
    ],
  },

  // ── Step 5: Spotify timer counting ──
  {
    processes: {
      chrome: p(CHROME, "ready"),
      spotify: p(SPOTIFY, "running"),
      vscode: p(VSCODE, "ready"),
      discord: p(DISCORD, "ready"),
    },
    newQueue: [],
    readyQueue: ["vscode", "discord", "chrome"],
    waitQueue: [],
    suspendedQueue: [],
    terminatedList: [],
    cpu: { currentProcess: "spotify", mode: "user", utilizationPct: 100, timerMs: 2 },
    memory: mem(p(CHROME, "ready"), p(SPOTIFY, "running"), p(VSCODE, "ready"), p(DISCORD, "ready")),
    explanation:
      "Spotify is running with its own quantum. The pattern repeats — every process gets exactly 4ms of CPU time before being rotated. This ensures fairness: no process can hog the CPU.",
    chapter: "Scheduling Algorithms",
    logEntries: [
      ...CH2_LOG_BASE,
      { timeMs: 200, message: "STS: Chrome (P1) dispatched → RUNNING (quantum=4ms)" },
      { timeMs: 2200, message: "Chrome (P1) running... quantum remaining: 2ms" },
      { timeMs: 4200, message: "IRQ: Timer interrupt — quantum expired for Chrome (P1)" },
      { timeMs: 4201, message: "Context switch: Chrome (P1) → READY (back of queue)" },
      { timeMs: 4202, message: "STS: Spotify (P2) dispatched → RUNNING (quantum=4ms)" },
      { timeMs: 6202, message: "Spotify (P2) running... quantum remaining: 2ms" },
    ],
  },

  // ── Step 6: Spotify requests I/O before timer expires ──
  {
    processes: {
      chrome: p(CHROME, "ready"),
      spotify: p(SPOTIFY, "waiting", { ioDevice: "disk" }),
      vscode: p(VSCODE, "ready"),
      discord: p(DISCORD, "ready"),
    },
    newQueue: [],
    readyQueue: ["discord", "chrome"],
    waitQueue: [{ processId: "spotify", device: "disk" }],
    suspendedQueue: [],
    terminatedList: [],
    cpu: { currentProcess: "vscode", mode: "user", utilizationPct: 100, timerMs: 4 },
    memory: mem(p(CHROME, "ready"), p(SPOTIFY, "waiting"), p(VSCODE, "running"), p(DISCORD, "ready")),
    activeScheduler: {
      type: "short_term",
      isActive: true,
      action: "Dispatching VS Code",
    },
    explanation:
      "Interesting! Spotify requests disk I/O before its quantum expires. It voluntarily gives up the CPU and moves to WAITING. The remaining quantum time is wasted. VS Code is immediately dispatched with a fresh 4ms quantum.",
    toastMessage: "Spotify → Waiting (Disk), VS Code dispatched",
    chapter: "Scheduling Algorithms",
    logEntries: [
      ...CH2_LOG_BASE,
      { timeMs: 200, message: "STS: Chrome (P1) dispatched → RUNNING (quantum=4ms)" },
      { timeMs: 2200, message: "Chrome (P1) running... quantum remaining: 2ms" },
      { timeMs: 4200, message: "IRQ: Timer interrupt — quantum expired for Chrome (P1)" },
      { timeMs: 4201, message: "Context switch: Chrome (P1) → READY (back of queue)" },
      { timeMs: 4202, message: "STS: Spotify (P2) dispatched → RUNNING (quantum=4ms)" },
      { timeMs: 6202, message: "Spotify (P2) running... quantum remaining: 2ms" },
      { timeMs: 7000, message: "Spotify (P2) syscall: read(disk) → WAITING" },
      { timeMs: 7001, message: "STS: VS Code (P3) dispatched → RUNNING (quantum=4ms)" },
    ],
  },

  // ── Step 7: Disk completes → Spotify back to READY ──
  {
    processes: {
      chrome: p(CHROME, "ready"),
      spotify: p(SPOTIFY, "ready"),
      vscode: p(VSCODE, "running"),
      discord: p(DISCORD, "ready"),
    },
    newQueue: [],
    readyQueue: ["discord", "chrome", "spotify"],
    waitQueue: [],
    suspendedQueue: [],
    terminatedList: [],
    cpu: { currentProcess: "vscode", mode: "user", utilizationPct: 100, timerMs: 2 },
    memory: mem(
      p(CHROME, "ready"),
      p(SPOTIFY, "ready"),
      p(VSCODE, "running"),
      p(DISCORD, "ready")
    ),
    activeInterrupt: {
      type: "io_complete",
      source: "disk",
      message: "Disk I/O Complete",
    },
    explanation:
      "While VS Code is running, the disk finishes Spotify's request. A hardware interrupt signals the OS, and Spotify moves from WAITING back to READY — at the end of the queue. The Round Robin continues.",
    toastMessage: "💾 Disk done — Spotify → Ready",
    chapter: "Scheduling Algorithms",
    logEntries: [
      ...CH2_LOG_BASE,
      { timeMs: 200, message: "STS: Chrome (P1) dispatched → RUNNING (quantum=4ms)" },
      { timeMs: 2200, message: "Chrome (P1) running... quantum remaining: 2ms" },
      { timeMs: 4200, message: "IRQ: Timer interrupt — quantum expired for Chrome (P1)" },
      { timeMs: 4201, message: "Context switch: Chrome (P1) → READY (back of queue)" },
      { timeMs: 4202, message: "STS: Spotify (P2) dispatched → RUNNING (quantum=4ms)" },
      { timeMs: 6202, message: "Spotify (P2) running... quantum remaining: 2ms" },
      { timeMs: 7000, message: "Spotify (P2) syscall: read(disk) → WAITING" },
      { timeMs: 7001, message: "STS: VS Code (P3) dispatched → RUNNING (quantum=4ms)" },
      { timeMs: 9000, message: "IRQ: Disk I/O complete → Spotify (P2) WAITING → READY" },
    ],
  },

  // ── Step 8: VSCode timer expires → Discord dispatched ──
  {
    processes: {
      chrome: p(CHROME, "ready"),
      spotify: p(SPOTIFY, "ready"),
      vscode: p(VSCODE, "ready"),
      discord: p(DISCORD, "running"),
    },
    newQueue: [],
    readyQueue: ["chrome", "spotify", "vscode"],
    waitQueue: [],
    suspendedQueue: [],
    terminatedList: [],
    cpu: { currentProcess: "discord", mode: "user", utilizationPct: 100, timerMs: 4 },
    memory: mem(
      p(CHROME, "ready"),
      p(SPOTIFY, "ready"),
      p(VSCODE, "ready"),
      p(DISCORD, "running")
    ),
    activeScheduler: {
      type: "short_term",
      isActive: true,
      action: "Context switch: VS Code → Discord",
    },
    explanation:
      "VS Code's quantum expires. It goes to the back of the Ready Queue. Discord — which has been patiently waiting — finally gets its turn! In Round Robin, every process is guaranteed CPU time within a bounded period.",
    toastMessage: "VS Code preempted — Discord dispatched",
    chapter: "Scheduling Algorithms",
    logEntries: [
      ...CH2_LOG_BASE,
      { timeMs: 200, message: "STS: Chrome (P1) dispatched → RUNNING (quantum=4ms)" },
      { timeMs: 2200, message: "Chrome (P1) running... quantum remaining: 2ms" },
      { timeMs: 4200, message: "IRQ: Timer interrupt — quantum expired for Chrome (P1)" },
      { timeMs: 4201, message: "Context switch: Chrome (P1) → READY (back of queue)" },
      { timeMs: 4202, message: "STS: Spotify (P2) dispatched → RUNNING (quantum=4ms)" },
      { timeMs: 6202, message: "Spotify (P2) running... quantum remaining: 2ms" },
      { timeMs: 7000, message: "Spotify (P2) syscall: read(disk) → WAITING" },
      { timeMs: 7001, message: "STS: VS Code (P3) dispatched → RUNNING (quantum=4ms)" },
      { timeMs: 9000, message: "IRQ: Disk I/O complete → Spotify (P2) WAITING → READY" },
      { timeMs: 11001, message: "IRQ: Timer interrupt — quantum expired for VS Code (P3)" },
      { timeMs: 11002, message: "Context switch: VS Code (P3) → READY" },
      { timeMs: 11003, message: "STS: Discord (P4) dispatched → RUNNING (quantum=4ms)" },
    ],
  },

  // ── Step 9: Second round begins — Chrome dispatched again ──
  {
    processes: {
      chrome: p(CHROME, "running"),
      spotify: p(SPOTIFY, "ready"),
      vscode: p(VSCODE, "ready"),
      discord: p(DISCORD, "ready"),
    },
    newQueue: [],
    readyQueue: ["spotify", "vscode", "discord"],
    waitQueue: [],
    suspendedQueue: [],
    terminatedList: [],
    cpu: { currentProcess: "chrome", mode: "user", utilizationPct: 100, timerMs: 4 },
    memory: mem(
      p(CHROME, "running"),
      p(SPOTIFY, "ready"),
      p(VSCODE, "ready"),
      p(DISCORD, "ready")
    ),
    activeScheduler: {
      type: "short_term",
      isActive: true,
      action: "Round 2: Dispatching Chrome",
    },
    explanation:
      "Discord's quantum expires. And look — Chrome gets the CPU again! This is Round 2. Every process has now had exactly one 4ms time slice. The cycle repeats until all processes complete. This is why it's called Round Robin.",
    toastMessage: "Round 2: Chrome dispatched again",
    chapter: "Scheduling Algorithms",
    logEntries: [
      ...CH2_LOG_BASE,
      { timeMs: 200, message: "STS: Chrome (P1) dispatched → RUNNING (quantum=4ms)" },
      { timeMs: 2200, message: "Chrome (P1) running... quantum remaining: 2ms" },
      { timeMs: 4200, message: "IRQ: Timer interrupt — quantum expired for Chrome (P1)" },
      { timeMs: 4201, message: "Context switch: Chrome (P1) → READY (back of queue)" },
      { timeMs: 4202, message: "STS: Spotify (P2) dispatched → RUNNING (quantum=4ms)" },
      { timeMs: 6202, message: "Spotify (P2) running... quantum remaining: 2ms" },
      { timeMs: 7000, message: "Spotify (P2) syscall: read(disk) → WAITING" },
      { timeMs: 7001, message: "STS: VS Code (P3) dispatched → RUNNING (quantum=4ms)" },
      { timeMs: 9000, message: "IRQ: Disk I/O complete → Spotify (P2) WAITING → READY" },
      { timeMs: 11001, message: "IRQ: Timer interrupt — quantum expired for VS Code (P3)" },
      { timeMs: 11002, message: "Context switch: VS Code (P3) → READY" },
      { timeMs: 11003, message: "STS: Discord (P4) dispatched → RUNNING (quantum=4ms)" },
      { timeMs: 15003, message: "IRQ: Timer interrupt — quantum expired for Discord (P4)" },
      { timeMs: 15004, message: "--- ROUND 2 ---" },
      { timeMs: 15005, message: "STS: Chrome (P1) dispatched → RUNNING (quantum=4ms)" },
    ],
  },

  // ── Step 10: Summary ──
  {
    processes: {
      chrome: p(CHROME, "ready"),
      spotify: p(SPOTIFY, "ready"),
      vscode: p(VSCODE, "ready"),
      discord: p(DISCORD, "ready"),
    },
    newQueue: [],
    readyQueue: ["chrome", "spotify", "vscode", "discord"],
    waitQueue: [],
    suspendedQueue: [],
    terminatedList: [],
    cpu: { currentProcess: null, mode: "idle", utilizationPct: 0 },
    memory: mem(p(CHROME, "ready"), p(SPOTIFY, "ready"), p(VSCODE, "ready"), p(DISCORD, "ready")),
    explanation:
      "Round Robin ensures fairness: every process gets equal CPU time. The trade-off? More context switches (overhead). The quantum size matters: too large → behaves like FCFS. Too small → constant switching, no real work gets done. The sweet spot is usually 10-100ms in real operating systems.",
    toastMessage: "Preemptive Demo Complete",
    chapter: "Scheduling Algorithms",
    logEntries: [
      ...CH2_LOG_BASE,
      { timeMs: 200, message: "STS: Chrome (P1) dispatched → RUNNING (quantum=4ms)" },
      { timeMs: 4200, message: "IRQ: Timer interrupt — quantum expired for Chrome (P1)" },
      { timeMs: 4202, message: "STS: Spotify (P2) dispatched → RUNNING (quantum=4ms)" },
      { timeMs: 7000, message: "Spotify (P2) → WAITING (disk I/O)" },
      { timeMs: 7001, message: "STS: VS Code (P3) dispatched → RUNNING (quantum=4ms)" },
      { timeMs: 9000, message: "Spotify (P2) WAITING → READY (disk done)" },
      { timeMs: 11001, message: "STS: Discord (P4) dispatched → RUNNING (quantum=4ms)" },
      { timeMs: 15004, message: "--- ROUND 2 ---" },
      { timeMs: 15005, message: "STS: Chrome (P1) dispatched → RUNNING (quantum=4ms)" },
      { timeMs: 30000, message: "Round Robin complete. Context switches: 8+" },
    ],
  },
];

// ───────────────────────────────────────────────────────
// SCENARIO FACTORY
// ───────────────────────────────────────────────────────

export function createProcessStatesScenario(
  schedulingMode: SchedulingMode = "non_preemptive"
): OSSimulationScenario {
  const chapter2Steps =
    schedulingMode === "preemptive"
      ? CHAPTER_2_PREEMPTIVE
      : CHAPTER_2_NON_PREEMPTIVE;

  const allSteps = [...CHAPTER_1, ...chapter2Steps];

  return {
    id: "process-states",
    title: "Process Lifecycle & Scheduling",
    description:
      "Watch how operating systems manage process states, queues, and CPU scheduling. See Chrome, Spotify, VS Code, and Discord compete for the CPU.",
    chapters: [
      {
        title: "The Basics",
        startStep: 0,
        endStep: CHAPTER_1.length - 1,
      },
      {
        title: "Scheduling Algorithms",
        startStep: CHAPTER_1.length,
        endStep: allSteps.length - 1,
      },
    ],
    steps: allSteps,
  };
}

/** Default scenario export for initial store hydration */
export const PROCESS_STATES_SCENARIO = createProcessStatesScenario("non_preemptive");
