// ═══════════════════════════════════════════════════════
// PROCESS STATES SCENARIO — Episode 1
// Chapters 1-2: The Basics + Scheduling Algorithms
// ═══════════════════════════════════════════════════════

import type {
  OSProcess,
  OSStepState,
  OSSimulationScenario,
  OSLogEntry,
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

  // ── Step 20: VS Code finishes, Discord dispatched ──
  {
    processes: {
      chrome: p(CHROME, "ready"),
      spotify: p(SPOTIFY, "terminated"),
      vscode: p(VSCODE, "terminated"),
      discord: p(DISCORD, "running"),
    },
    newQueue: [],
    readyQueue: ["chrome"],
    waitQueue: [],
    suspendedQueue: [],
    terminatedList: ["spotify", "vscode"],
    cpu: { currentProcess: "discord", mode: "user", utilizationPct: 100 },
    memory: mem(
      p(CHROME, "ready"),
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
      "VS Code completes its task and terminates. The Short-Term Scheduler dispatches Discord from the Ready Queue. Chrome is now at the front of the line, patiently waiting.",
    toastMessage: "VS Code done — Discord dispatched",
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
      { timeMs: 7200, message: "VS Code (P3) → TERMINATED" },
      { timeMs: 7201, message: "STS: Discord (P4) dispatched → RUNNING" },
    ],
  },

  // ── Step 21: Discord finishes, Chrome dispatched ──
  {
    processes: {
      chrome: p(CHROME, "running"),
      spotify: p(SPOTIFY, "terminated"),
      vscode: p(VSCODE, "terminated"),
      discord: p(DISCORD, "terminated"),
    },
    newQueue: [],
    readyQueue: [],
    waitQueue: [],
    suspendedQueue: [],
    terminatedList: ["spotify", "vscode", "discord"],
    cpu: { currentProcess: "chrome", mode: "user", utilizationPct: 100 },
    memory: mem(
      p(CHROME, "running"),
      p(SPOTIFY, "terminated"),
      p(VSCODE, "terminated"),
      p(DISCORD, "terminated")
    ),
    activeScheduler: {
      type: "short_term",
      isActive: true,
      action: "Dispatching Chrome",
    },
    explanation:
      "Discord finishes and terminates. Finally, Chrome gets its turn on the CPU again! It can now process the disk data it waited for earlier. The Ready Queue is empty.",
    toastMessage: "Discord done — Chrome dispatched",
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
      { timeMs: 7200, message: "VS Code (P3) → TERMINATED" },
      { timeMs: 7201, message: "STS: Discord (P4) dispatched → RUNNING" },
      { timeMs: 7800, message: "Discord (P4) → TERMINATED" },
      { timeMs: 7801, message: "STS: Chrome (P1) dispatched → RUNNING" },
    ],
  },

  // ── Step 22: Chrome finishes, system idle ──
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
    terminatedList: ["spotify", "vscode", "discord", "chrome"],
    cpu: { currentProcess: null, mode: "idle", utilizationPct: 0 },
    memory: mem(
      p(CHROME, "terminated"),
      p(SPOTIFY, "terminated"),
      p(VSCODE, "terminated"),
      p(DISCORD, "terminated")
    ),
    explanation:
      "Chrome completes its final processing and terminates. All processes have successfully run their course. The CPU is idle again, waiting for the next user action.",
    toastMessage: "All processes terminated",
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
      { timeMs: 7200, message: "VS Code (P3) → TERMINATED" },
      { timeMs: 7201, message: "STS: Discord (P4) dispatched → RUNNING" },
      { timeMs: 7800, message: "Discord (P4) → TERMINATED" },
      { timeMs: 7801, message: "STS: Chrome (P1) dispatched → RUNNING" },
      { timeMs: 8300, message: "Chrome (P1) exit() → TERMINATED" },
    ],
  }
];

// ───────────────────────────────────────────────────────
// SCENARIO EXPORT
// ───────────────────────────────────────────────────────

export const PROCESS_STATES_SCENARIO: OSSimulationScenario = {
  id: "process-states",
  title: "Process Lifecycle & I/O",
  description:
    "Watch how operating systems manage process states, queues, and CPU scheduling. See Chrome, Spotify, VS Code, and Discord compete for the CPU.",
  chapters: [
    {
      title: "The Basics",
      startStep: 0,
      endStep: CHAPTER_1.length - 1,
    }
  ],
  steps: CHAPTER_1,
};
