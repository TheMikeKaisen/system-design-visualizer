// ═══════════════════════════════════════════════════════
// PCB SCENARIO — Episode 3
// Deep-dive into Process Control Blocks and Context Switching
// ═══════════════════════════════════════════════════════

import type {
  OSProcess,
  OSStepState,
  OSSimulationScenario,
  OSLogEntry,
  ProcessControlBlock
} from "./engine";

// ───────────────────────────────────────────────────────
// PROCESS TEMPLATES
// ───────────────────────────────────────────────────────

const CHROME_PCB: ProcessControlBlock = {
  programCounter: "Instruction #1",
  registers: { eax: "0", ebx: "0", ecx: "0" },
  memoryLimits: { base: "0x100000", limit: "0x1FFFFF" },
  openFiles: [],
};

const SPOTIFY_PCB: ProcessControlBlock = {
  programCounter: "Instruction #42",
  registers: { eax: "0", ebx: "0", ecx: "0" },
  memoryLimits: { base: "0x200000", limit: "0x2FFFFF" },
  openFiles: [],
};

const CHROME: OSProcess = {
  id: "chrome",
  pid: "P1",
  name: "Chrome",
  color: "#4285F4",
  state: "ready",
  memoryMB: 512,
  cpuBurstMs: 40,
  pcb: CHROME_PCB,
};

const SPOTIFY: OSProcess = {
  id: "spotify",
  pid: "P2",
  name: "Spotify",
  color: "#1DB954",
  state: "ready",
  memoryMB: 256,
  cpuBurstMs: 20,
  pcb: SPOTIFY_PCB,
};

// ───────────────────────────────────────────────────────
// HELPERS
// ───────────────────────────────────────────────────────

function p(
  base: OSProcess,
  state: OSProcess["state"],
  cpuBurstMs: number,
  pcbOverrides?: Partial<ProcessControlBlock> | null
): OSProcess {
  if (pcbOverrides === null) {
    return { ...base, state, cpuBurstMs, pcb: undefined };
  }
  return {
    ...base,
    state,
    cpuBurstMs,
    pcb: base.pcb ? { ...base.pcb, ...pcbOverrides } : undefined,
  };
}

function mem(...processes: OSProcess[]): { totalMB: number; usedMB: number; usedPct: number } {
  const used = processes
    .filter((proc) => proc.state !== "terminated")
    .reduce((sum, proc) => sum + proc.memoryMB, 0);
  return { totalMB: 8192, usedMB: used, usedPct: Math.round((used / 8192) * 100 * 10) / 10 };
}

// ───────────────────────────────────────────────────────
// SCENARIO: CONTEXT SWITCHING & TERMINATION
// ───────────────────────────────────────────────────────

const LOG_BASE: OSLogEntry[] = [
  { timeMs: 0, message: "System Initialized" },
];

const STEPS: OSStepState[] = [
  // ── Step 0: Setup & Introduction ──
  {
    processes: {
      chrome: p(CHROME, "ready", 40),
      spotify: p(SPOTIFY, "ready", 20),
    },
    newQueue: [],
    readyQueue: ["chrome", "spotify"],
    waitQueue: [],
    suspendedQueue: [],
    terminatedList: [],
    cpu: { currentProcess: null, mode: "idle", utilizationPct: 0, programCounter: "Idle", registers: { eax: "-", ebx: "-", ecx: "-" } },
    memory: mem(p(CHROME, "ready", 40), p(SPOTIFY, "ready", 20)),
    explanation:
      "Welcome to Episode 3! Let's demystify exactly how the OS keeps track of processes. Notice the new panel on the right: the Process Control Block (PCB). Every process has its own PCB stored securely in kernel memory.",
    toastMessage: "Episode 3: The PCB",
    chapter: "The Anatomy of a Context Switch",
    logEntries: [...LOG_BASE],
  },

  // ── Step 1: The Dispatcher Prepares ──
  {
    processes: {
      chrome: p(CHROME, "ready", 40),
      spotify: p(SPOTIFY, "ready", 20),
    },
    newQueue: [],
    readyQueue: ["chrome", "spotify"],
    waitQueue: [],
    suspendedQueue: [],
    terminatedList: [],
    cpu: { currentProcess: null, mode: "kernel", utilizationPct: 0, programCounter: "Idle", registers: { eax: "-", ebx: "-", ecx: "-" } },
    memory: mem(p(CHROME, "ready", 40), p(SPOTIFY, "ready", 20)),
    activeScheduler: {
      type: "short_term",
      isActive: true,
      action: "Reading Chrome's PCB",
    },
    explanation:
      "The CPU is currently idle. To run a process, the OS Dispatcher must first locate its PCB. Let's start with Chrome. The OS reads Chrome's PCB to find out exactly where to start executing its code.",
    toastMessage: "Locating Chrome's PCB",
    chapter: "The Anatomy of a Context Switch",
    logEntries: [
      ...LOG_BASE,
      { timeMs: 50, message: "Dispatcher: Preparing to run Chrome (P1)" },
    ],
  },

  // ── Step 2: Restoring Context ──
  {
    processes: {
      chrome: p(CHROME, "running", 40),
      spotify: p(SPOTIFY, "ready", 20),
    },
    newQueue: [],
    readyQueue: ["spotify"],
    waitQueue: [],
    suspendedQueue: [],
    terminatedList: [],
    cpu: { currentProcess: "chrome", mode: "user", utilizationPct: 100, timerMs: 25, programCounter: "Instruction #1", registers: { eax: "0", ebx: "0", ecx: "0" } },
    memory: mem(p(CHROME, "running", 40), p(SPOTIFY, "ready", 20)),
    activeScheduler: {
      type: "short_term",
      isActive: true,
      action: "Loading Chrome Context",
    },
    explanation:
      "The OS copies the Program Counter ('Instruction #1') and Registers directly from Chrome's PCB into the physical CPU hardware. The OS also sets a hardware Timer (Quantum = 25ms). The CPU now 'becomes' Chrome.",
    toastMessage: "Context restored into CPU",
    chapter: "The Anatomy of a Context Switch",
    logEntries: [
      ...LOG_BASE,
      { timeMs: 50, message: "Dispatcher: Preparing to run Chrome (P1)" },
      { timeMs: 100, message: "Dispatcher: Loading Chrome (P1) context into CPU" },
    ],
  },

  // ── Step 3: Chrome Executes (CPU State Changes) ──
  {
    processes: {
      chrome: p(CHROME, "running", 30),
      spotify: p(SPOTIFY, "ready", 20),
    },
    newQueue: [],
    readyQueue: ["spotify"],
    waitQueue: [],
    suspendedQueue: [],
    terminatedList: [],
    cpu: { currentProcess: "chrome", mode: "user", utilizationPct: 100, timerMs: 15, programCounter: "Instruction #5", registers: { eax: "Data A", ebx: "Data B", ecx: "5" } },
    memory: mem(p(CHROME, "running", 30), p(SPOTIFY, "ready", 20)),
    explanation:
      "Chrome is running! As it executes instructions, its Burst Time decreases, the Timer counts down, and the CPU Registers change. Crucially, notice that Chrome's PCB in memory HAS NOT UPDATED yet — only the active CPU changes.",
    chapter: "The Anatomy of a Context Switch",
    logEntries: [
      ...LOG_BASE,
      { timeMs: 100, message: "Dispatcher: Loading Chrome (P1) context into CPU" },
      { timeMs: 110, message: "Chrome (P1) executing..." },
    ],
  },

  // ── Step 4: System Call (Resource Allocation) ──
  {
    processes: {
      chrome: p(CHROME, "running", 25, { openFiles: ["cache.db"] }), // PCB open files updates immediately
      spotify: p(SPOTIFY, "ready", 20),
    },
    newQueue: [],
    readyQueue: ["spotify"],
    waitQueue: [],
    suspendedQueue: [],
    terminatedList: [],
    cpu: { currentProcess: "chrome", mode: "kernel", utilizationPct: 100, timerMs: 10, programCounter: "Instruction #6", registers: { eax: "Data A", ebx: "Data B", ecx: "5" } },
    memory: mem(p(CHROME, "running", 25), p(SPOTIFY, "ready", 20)),
    explanation:
      "Chrome makes a system call to open a file ('cache.db'). Because the OS manages files, it immediately records this resource allocation in Chrome's PCB. But the CPU registers in the PCB remain stale.",
    toastMessage: "File opened!",
    chapter: "The Anatomy of a Context Switch",
    logEntries: [
      ...LOG_BASE,
      { timeMs: 110, message: "Chrome (P1) executing..." },
      { timeMs: 115, message: "Syscall: Chrome (P1) opened 'cache.db'" },
    ],
  },

  // ── Step 5: Timer Interrupt (Preemption) ──
  {
    processes: {
      chrome: p(CHROME, "running", 15, { openFiles: ["cache.db"] }),
      spotify: p(SPOTIFY, "ready", 20),
    },
    newQueue: [],
    readyQueue: ["spotify"],
    waitQueue: [],
    suspendedQueue: [],
    terminatedList: [],
    cpu: { currentProcess: "chrome", mode: "kernel", utilizationPct: 100, timerMs: 0, programCounter: "Instruction #6", registers: { eax: "Data A", ebx: "Data B", ecx: "5" } },
    memory: mem(p(CHROME, "running", 15), p(SPOTIFY, "ready", 20)),
    activeInterrupt: {
      type: "timer",
      source: "cpu_timer",
      message: "Timer Interrupt! Quantum Expired",
    },
    explanation:
      "⏰ Timer Interrupt! The timer hit 0ms. The OS forcefully halts Chrome and switches the CPU to Kernel Mode. If we gave the CPU to Spotify right now, Chrome's progress in the physical CPU would be lost forever!",
    toastMessage: "⏰ Timer Interrupt!",
    chapter: "The Anatomy of a Context Switch",
    logEntries: [
      ...LOG_BASE,
      { timeMs: 115, message: "Syscall: Chrome (P1) opened 'cache.db'" },
      { timeMs: 125, message: "IRQ: Timer Interrupt! Halting Chrome (P1)" },
    ],
  },

  // ── Step 6: Saving Context ──
  {
    processes: {
      chrome: p(CHROME, "ready", 15, { 
        programCounter: "Instruction #6", 
        registers: { eax: "Data A", ebx: "Data B", ecx: "5" },
        openFiles: ["cache.db"],
        forceExpand: true,
        highlightFields: ["programCounter", "registers"]
      }),
      spotify: p(SPOTIFY, "ready", 20),
    },
    newQueue: [],
    readyQueue: ["spotify", "chrome"],
    waitQueue: [],
    suspendedQueue: [],
    terminatedList: [],
    cpu: { currentProcess: null, mode: "kernel", utilizationPct: 100, programCounter: "Idle", registers: { eax: "-", ebx: "-", ecx: "-" } },
    memory: mem(p(CHROME, "ready", 15), p(SPOTIFY, "ready", 20)),
    activeScheduler: {
      type: "short_term",
      isActive: true,
      action: "Saving Context to PCB",
    },
    explanation:
      "To prevent data loss, the OS reads the current hardware CPU values and saves them back into Chrome's PCB. Chrome is moved to the back of the Ready Queue. This 'Save State' operation is the first half of a Context Switch.",
    toastMessage: "Context saved to PCB",
    chapter: "The Anatomy of a Context Switch",
    logEntries: [
      ...LOG_BASE,
      { timeMs: 125, message: "IRQ: Timer Interrupt! Halting Chrome (P1)" },
      { timeMs: 126, message: "OS: Saving Chrome (P1) CPU state to PCB" },
      { timeMs: 127, message: "Chrome (P1) RUNNING → READY" },
    ],
  },

  // ── Step 7: Restoring Spotify ──
  {
    processes: {
      chrome: p(CHROME, "ready", 15, { 
        programCounter: "Instruction #6", 
        registers: { eax: "Data A", ebx: "Data B", ecx: "5" },
        openFiles: ["cache.db"] 
      }),
      spotify: p(SPOTIFY, "running", 20),
    },
    newQueue: [],
    readyQueue: ["chrome"],
    waitQueue: [],
    suspendedQueue: [],
    terminatedList: [],
    cpu: { currentProcess: "spotify", mode: "user", utilizationPct: 100, timerMs: 25, programCounter: "Instruction #42", registers: { eax: "0", ebx: "0", ecx: "0" } },
    memory: mem(p(CHROME, "ready", 15), p(SPOTIFY, "running", 20)),
    activeScheduler: {
      type: "short_term",
      isActive: true,
      action: "Loading Spotify Context",
    },
    explanation:
      "For the second half, the OS reads Spotify's PCB and overwrites the hardware CPU with Spotify's state. The timer resets to 25ms, and Spotify resumes execution exactly where it left off. The Context Switch is complete!",
    toastMessage: "Context restored into CPU",
    chapter: "The Anatomy of a Context Switch",
    logEntries: [
      ...LOG_BASE,
      { timeMs: 126, message: "OS: Saving Chrome (P1) CPU state to PCB" },
      { timeMs: 127, message: "Chrome (P1) RUNNING → READY" },
      { timeMs: 128, message: "Dispatcher: Loading Spotify (P2) context into CPU" },
      { timeMs: 129, message: "Spotify (P2) READY → RUNNING" },
    ],
  },

  // ── Step 8: The Cost of Switching ──
  {
    processes: {
      chrome: p(CHROME, "ready", 15, { 
        programCounter: "Instruction #6", 
        registers: { eax: "Data A", ebx: "Data B", ecx: "5" },
        openFiles: ["cache.db"] 
      }),
      spotify: p(SPOTIFY, "running", 10),
    },
    newQueue: [],
    readyQueue: ["chrome"],
    waitQueue: [],
    suspendedQueue: [],
    terminatedList: [],
    cpu: { currentProcess: "spotify", mode: "user", utilizationPct: 100, timerMs: 15, programCounter: "Instruction #45", registers: { eax: "Audio Data", ebx: "Buffer", ecx: "100" } },
    memory: mem(p(CHROME, "ready", 15), p(SPOTIFY, "running", 10)),
    explanation:
      "Why is this important? Because Context Switching takes time. The OS must pause execution, copy data from CPU to memory, and switch modes. If a system has too many processes, it might spend more time context-switching than doing actual work (thrashing)!",
    chapter: "The Anatomy of a Context Switch",
    logEntries: [
      ...LOG_BASE,
      { timeMs: 128, message: "Dispatcher: Loading Spotify (P2) context into CPU" },
      { timeMs: 129, message: "Spotify (P2) READY → RUNNING" },
      { timeMs: 140, message: "Spotify (P2) executing..." },
    ],
  },

  // ── Step 9: Spotify Finishes ──
  {
    processes: {
      chrome: p(CHROME, "ready", 15, { 
        programCounter: "Instruction #6", 
        registers: { eax: "Data A", ebx: "Data B", ecx: "5" },
        openFiles: ["cache.db"] 
      }),
      spotify: p(SPOTIFY, "running", 0),
    },
    newQueue: [],
    readyQueue: ["chrome"],
    waitQueue: [],
    suspendedQueue: [],
    terminatedList: [],
    cpu: { currentProcess: "spotify", mode: "kernel", utilizationPct: 100, timerMs: 5, programCounter: "sys_exit", registers: { eax: "0", ebx: "0", ecx: "0" } },
    memory: mem(p(CHROME, "ready", 15), p(SPOTIFY, "running", 0)),
    activeInterrupt: {
      type: "syscall",
      source: "cpu",
      message: "Syscall: exit()",
    },
    explanation:
      "Spotify has finished its audio processing task! Before its timer expires, it voluntarily makes an `exit()` system call to tell the OS it is completely done.",
    chapter: "Process Termination",
    logEntries: [
      ...LOG_BASE,
      { timeMs: 140, message: "Spotify (P2) executing..." },
      { timeMs: 149, message: "Syscall: Spotify (P2) called exit()" },
    ],
  },

  // ── Step 10: Spotify Terminates (PCB Deallocated) ──
  {
    processes: {
      chrome: p(CHROME, "ready", 15, { 
        programCounter: "Instruction #6", 
        registers: { eax: "Data A", ebx: "Data B", ecx: "5" },
        openFiles: ["cache.db"] 
      }),
      spotify: p(SPOTIFY, "terminated", 0, null),
    },
    newQueue: [],
    readyQueue: ["chrome"],
    waitQueue: [],
    suspendedQueue: [],
    terminatedList: ["spotify"],
    cpu: { currentProcess: null, mode: "kernel", utilizationPct: 0, programCounter: "Idle", registers: { eax: "-", ebx: "-", ecx: "-" } },
    memory: mem(p(CHROME, "ready", 15), p(SPOTIFY, "terminated", 0, null)),
    explanation:
      "The OS moves Spotify to the Terminated state. Crucially, the OS reclaims its memory and completely DESTROYS its PCB! A Process Control Block only exists as long as its process is alive.",
    toastMessage: "Spotify's PCB Destroyed",
    chapter: "Process Termination",
    logEntries: [
      ...LOG_BASE,
      { timeMs: 149, message: "Syscall: Spotify (P2) called exit()" },
      { timeMs: 150, message: "OS: Deallocating Spotify (P2) memory and PCB" },
      { timeMs: 151, message: "Spotify (P2) RUNNING → TERMINATED" },
    ],
  },

  // ── Step 11: Restoring Chrome ──
  {
    processes: {
      chrome: p(CHROME, "running", 15, { 
        programCounter: "Instruction #6", 
        registers: { eax: "Data A", ebx: "Data B", ecx: "5" },
        openFiles: ["cache.db"] 
      }),
      spotify: p(SPOTIFY, "terminated", 0, null),
    },
    newQueue: [],
    readyQueue: [],
    waitQueue: [],
    suspendedQueue: [],
    terminatedList: ["spotify"],
    cpu: { currentProcess: "chrome", mode: "user", utilizationPct: 100, timerMs: 25, programCounter: "Instruction #6", registers: { eax: "Data A", ebx: "Data B", ecx: "5" } },
    memory: mem(p(CHROME, "running", 15), p(SPOTIFY, "terminated", 0, null)),
    explanation:
      "The Dispatcher loads Chrome's PCB back into the CPU for its final time slice. Notice that Chrome's registers and open files are restored exactly as we left them earlier.",
    chapter: "Process Termination",
    logEntries: [
      ...LOG_BASE,
      { timeMs: 150, message: "OS: Deallocating Spotify (P2) memory and PCB" },
      { timeMs: 151, message: "Spotify (P2) RUNNING → TERMINATED" },
      { timeMs: 152, message: "Dispatcher: Loading Chrome (P1) context into CPU" },
    ],
  },

  // ── Step 12: Chrome Finishes ──
  {
    processes: {
      chrome: p(CHROME, "running", 0, { 
        programCounter: "Instruction #6", 
        registers: { eax: "Data A", ebx: "Data B", ecx: "5" },
        openFiles: ["cache.db"] 
      }),
      spotify: p(SPOTIFY, "terminated", 0, null),
    },
    newQueue: [],
    readyQueue: [],
    waitQueue: [],
    suspendedQueue: [],
    terminatedList: ["spotify"],
    cpu: { currentProcess: "chrome", mode: "kernel", utilizationPct: 100, timerMs: 10, programCounter: "sys_exit", registers: { eax: "0", ebx: "0", ecx: "0" } },
    memory: mem(p(CHROME, "running", 0), p(SPOTIFY, "terminated", 0, null)),
    activeInterrupt: {
      type: "syscall",
      source: "cpu",
      message: "Syscall: exit()",
    },
    explanation:
      "Chrome finishes its remaining work and makes its own `exit()` system call.",
    chapter: "Process Termination",
    logEntries: [
      ...LOG_BASE,
      { timeMs: 152, message: "Dispatcher: Loading Chrome (P1) context into CPU" },
      { timeMs: 160, message: "Chrome (P1) executing..." },
      { timeMs: 167, message: "Syscall: Chrome (P1) called exit()" },
    ],
  },

  // ── Step 13: System Idle ──
  {
    processes: {
      chrome: p(CHROME, "terminated", 0, null),
      spotify: p(SPOTIFY, "terminated", 0, null),
    },
    newQueue: [],
    readyQueue: [],
    waitQueue: [],
    suspendedQueue: [],
    terminatedList: ["spotify", "chrome"],
    cpu: { currentProcess: null, mode: "idle", utilizationPct: 0, programCounter: "Idle", registers: { eax: "-", ebx: "-", ecx: "-" } },
    memory: mem(p(CHROME, "terminated", 0, null), p(SPOTIFY, "terminated", 0, null)),
    explanation:
      "Chrome's PCB is also destroyed. The system is now completely idle, and Kernel Memory is empty. You've successfully navigated the entire lifecycle of a Process Control Block!",
    toastMessage: "All Processes Terminated",
    chapter: "Process Termination",
    logEntries: [
      ...LOG_BASE,
      { timeMs: 167, message: "Syscall: Chrome (P1) called exit()" },
      { timeMs: 168, message: "OS: Deallocating Chrome (P1) memory and PCB" },
      { timeMs: 169, message: "Chrome (P1) RUNNING → TERMINATED" },
    ],
  }
];

export const PCB_SCENARIO: OSSimulationScenario = {
  id: "process-control-block",
  title: "Process Control Blocks (PCB)",
  description:
    "Explore the anatomy of a PCB and see how the OS performs Context Switches.",
  chapters: [
    {
      title: "The Anatomy of a Context Switch",
      startStep: 0,
      endStep: 8,
    },
    {
      title: "Process Termination",
      startStep: 9,
      endStep: 13,
    }
  ],
  steps: STEPS,
};
