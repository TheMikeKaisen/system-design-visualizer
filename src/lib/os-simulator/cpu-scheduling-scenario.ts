// ═══════════════════════════════════════════════════════
// CPU SCHEDULING SCENARIO — Episode 2
// Deep-dive into FCFS and Round Robin Scheduling
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
  state: "ready",
  memoryMB: 512,
};

const SPOTIFY: OSProcess = {
  id: "spotify",
  pid: "P2",
  name: "Spotify",
  color: "#1DB954",
  state: "ready",
  memoryMB: 256,
};

const VSCODE: OSProcess = {
  id: "vscode",
  pid: "P3",
  name: "VS Code",
  color: "#007ACC",
  state: "ready",
  memoryMB: 768,
};

const DISCORD: OSProcess = {
  id: "discord",
  pid: "P4",
  name: "Discord",
  color: "#5865F2",
  state: "ready",
  memoryMB: 384,
};

// ───────────────────────────────────────────────────────
// HELPERS
// ───────────────────────────────────────────────────────

function p(
  base: OSProcess,
  state: OSProcess["state"],
  extras?: Partial<OSProcess>
): OSProcess {
  return { ...base, state, ...extras };
}

function mem(...processes: OSProcess[]): { totalMB: number; usedMB: number; usedPct: number } {
  const used = processes
    .filter((proc) => proc.state !== "terminated")
    .reduce((sum, proc) => sum + proc.memoryMB, 0);
  return { totalMB: 8192, usedMB: used, usedPct: Math.round((used / 8192) * 100 * 10) / 10 };
}

// ───────────────────────────────────────────────────────
// SCENARIO: NON-PREEMPTIVE (FCFS)
// ───────────────────────────────────────────────────────

const FCFS_LOG_BASE: OSLogEntry[] = [
  { timeMs: 0, message: "System Initialized" },
  { timeMs: 100, message: "Chrome (P1), Spotify (P2), VS Code (P3), Discord (P4) → READY" },
];

const FCFS_STEPS: OSStepState[] = [
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
      "Welcome to Episode 2! We'll start with Non-Preemptive Scheduling (FCFS): Four processes are ready. In this mode, once a process gets the CPU, it runs until it finishes or voluntarily gives up the CPU. No timer interrupts. No forced context switches.",
    toastMessage: "Mode: Non-Preemptive (FCFS)",
    chapter: "First-Come-First-Served",
    logEntries: [...FCFS_LOG_BASE],
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
    chapter: "First-Come-First-Served",
    logEntries: [
      ...FCFS_LOG_BASE,
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
    chapter: "First-Come-First-Served",
    logEntries: [
      ...FCFS_LOG_BASE,
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
    chapter: "First-Come-First-Served",
    logEntries: [
      ...FCFS_LOG_BASE,
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
    chapter: "First-Come-First-Served",
    logEntries: [
      ...FCFS_LOG_BASE,
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
    chapter: "First-Come-First-Served",
    logEntries: [
      ...FCFS_LOG_BASE,
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
      "All processes are done. Non-Preemptive (FCFS) is simple — but it suffers from the Convoy Effect: short processes stuck behind long ones. There are no context switches (good for overhead) but terrible for response time. Toggle to 'Preemptive (RR)' to see how Round Robin solves this!",
    toastMessage: "FCFS Demo Complete",
    chapter: "First-Come-First-Served",
    logEntries: [
      ...FCFS_LOG_BASE,
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
// SCENARIO: PREEMPTIVE (ROUND ROBIN)
// ───────────────────────────────────────────────────────

const RR_STEPS: OSStepState[] = [
  // ── Step 0: Setup ──
  {
    processes: {
      chrome: p(CHROME, "ready", { cpuBurstMs: 10 }),
      spotify: p(SPOTIFY, "ready", { cpuBurstMs: 6 }),
      vscode: p(VSCODE, "ready", { cpuBurstMs: 8 }),
      discord: p(DISCORD, "ready", { cpuBurstMs: 4 }),
    },
    newQueue: [],
    readyQueue: ["chrome", "spotify", "vscode", "discord"],
    waitQueue: [],
    suspendedQueue: [],
    terminatedList: [],
    cpu: { currentProcess: null, mode: "idle", utilizationPct: 0 },
    memory: mem(p(CHROME, "ready"), p(SPOTIFY, "ready"), p(VSCODE, "ready"), p(DISCORD, "ready")),
    explanation:
      "Preemptive Scheduling (Round Robin): Same four processes, same Ready Queue. But now there is a timer! Each process gets a fixed time quantum (4ms). Watch the remaining burst time on each process.",
    toastMessage: "Mode: Preemptive (Round Robin, q=4ms)",
    chapter: "Round Robin (RR)",
    logEntries: [...FCFS_LOG_BASE],
  },

  // ── Step 1: Chrome dispatched (Round 1) ──
  {
    processes: {
      chrome: p(CHROME, "running", { cpuBurstMs: 10 }),
      spotify: p(SPOTIFY, "ready", { cpuBurstMs: 6 }),
      vscode: p(VSCODE, "ready", { cpuBurstMs: 8 }),
      discord: p(DISCORD, "ready", { cpuBurstMs: 4 }),
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
      "Chrome needs 10ms of CPU time. It gets dispatched with a 4ms quantum. The timer starts.",
    toastMessage: "Chrome dispatched — timer: 4ms",
    chapter: "Round Robin (RR)",
    logEntries: [
      ...FCFS_LOG_BASE,
      { timeMs: 200, message: "STS: Chrome (P1) dispatched → RUNNING (quantum=4ms)" },
    ],
  },

  // ── Step 2: Chrome timer expires (Burst 10 -> 6) ──
  {
    processes: {
      chrome: p(CHROME, "ready", { cpuBurstMs: 6 }),
      spotify: p(SPOTIFY, "running", { cpuBurstMs: 6 }),
      vscode: p(VSCODE, "ready", { cpuBurstMs: 8 }),
      discord: p(DISCORD, "ready", { cpuBurstMs: 4 }),
    },
    newQueue: [],
    readyQueue: ["vscode", "discord", "chrome"],
    waitQueue: [],
    suspendedQueue: [],
    terminatedList: [],
    cpu: { currentProcess: "spotify", mode: "user", utilizationPct: 100, timerMs: 4 },
    memory: mem(p(CHROME, "ready"), p(SPOTIFY, "running"), p(VSCODE, "ready"), p(DISCORD, "ready")),
    activeInterrupt: {
      type: "timer",
      source: "cpu_timer",
      message: "Timer Interrupt! Quantum Expired!",
    },
    explanation:
      "TIME'S UP! Chrome runs for 4ms. Its remaining burst is now 6ms. It is sent to the BACK of the Ready Queue. Spotify (needs 6ms) is dispatched with a fresh 4ms quantum.",
    toastMessage: "⏰ Chrome preempted! Spotify dispatched",
    chapter: "Round Robin (RR)",
    logEntries: [
      ...FCFS_LOG_BASE,
      { timeMs: 4200, message: "IRQ: Timer interrupt — quantum expired for Chrome" },
    ],
  },

  // ── Step 3: Spotify requests I/O early (Burst 6 -> 4) ──
  {
    processes: {
      chrome: p(CHROME, "ready", { cpuBurstMs: 6 }),
      spotify: p(SPOTIFY, "waiting", { ioDevice: "disk", cpuBurstMs: 4 }),
      vscode: p(VSCODE, "running", { cpuBurstMs: 8 }),
      discord: p(DISCORD, "ready", { cpuBurstMs: 4 }),
    },
    newQueue: [],
    readyQueue: ["discord", "chrome"],
    waitQueue: [{ processId: "spotify", device: "disk" }],
    suspendedQueue: [],
    terminatedList: [],
    cpu: { currentProcess: "vscode", mode: "user", utilizationPct: 100, timerMs: 4 },
    memory: mem(p(CHROME, "ready"), p(SPOTIFY, "waiting"), p(VSCODE, "running"), p(DISCORD, "ready")),
    explanation:
      "Spotify runs for 2ms and then requests disk I/O! It gives up the CPU early. Its remaining burst is 4ms. VS Code (needs 8ms) is immediately dispatched.",
    toastMessage: "Spotify → Waiting (Disk), VS Code dispatched",
    chapter: "Round Robin (RR)",
    logEntries: [
      ...FCFS_LOG_BASE,
      { timeMs: 7000, message: "Spotify (P2) syscall: read(disk) → WAITING" },
    ],
  },

  // ── Step 4: VS Code timer expires (Burst 8 -> 4), Spotify IO finishes ──
  {
    processes: {
      chrome: p(CHROME, "ready", { cpuBurstMs: 6 }),
      spotify: p(SPOTIFY, "ready", { cpuBurstMs: 4 }),
      vscode: p(VSCODE, "ready", { cpuBurstMs: 4 }),
      discord: p(DISCORD, "running", { cpuBurstMs: 4 }),
    },
    newQueue: [],
    readyQueue: ["chrome", "spotify", "vscode"],
    waitQueue: [],
    suspendedQueue: [],
    terminatedList: [],
    cpu: { currentProcess: "discord", mode: "user", utilizationPct: 100, timerMs: 4 },
    memory: mem(p(CHROME, "ready"), p(SPOTIFY, "ready"), p(VSCODE, "ready"), p(DISCORD, "running")),
    explanation:
      "VS Code runs for 4ms (burst 8→4) and is preempted. Meanwhile, Spotify's disk I/O finishes and it joins the back of the queue! Discord (needs 4ms) gets the CPU.",
    toastMessage: "VS Code preempted, Spotify IO done",
    chapter: "Round Robin (RR)",
    logEntries: [
      ...FCFS_LOG_BASE,
      { timeMs: 11000, message: "IRQ: Timer interrupt — VS Code" },
    ],
  },

  // ── Step 5: Discord FINISHES! (Burst 4 -> 0) (Round 2 begins) ──
  {
    processes: {
      chrome: p(CHROME, "running", { cpuBurstMs: 6 }),
      spotify: p(SPOTIFY, "ready", { cpuBurstMs: 4 }),
      vscode: p(VSCODE, "ready", { cpuBurstMs: 4 }),
      discord: p(DISCORD, "terminated", { cpuBurstMs: 0 }),
    },
    newQueue: [],
    readyQueue: ["spotify", "vscode"],
    waitQueue: [],
    suspendedQueue: [],
    terminatedList: ["discord"],
    cpu: { currentProcess: "chrome", mode: "user", utilizationPct: 100, timerMs: 4 },
    memory: mem(p(CHROME, "running"), p(SPOTIFY, "ready"), p(VSCODE, "ready"), p(DISCORD, "terminated")),
    explanation:
      "Discord only needed 4ms, so it finishes perfectly within its quantum! Discord TERMINATES. Round 1 is complete! Chrome (burst 6) is dispatched for Round 2.",
    toastMessage: "Discord Terminated! Chrome gets CPU",
    chapter: "Round Robin (RR)",
    logEntries: [
      ...FCFS_LOG_BASE,
      { timeMs: 15000, message: "Discord (P4) → TERMINATED" },
    ],
  },

  // ── Step 6: Chrome timer expires (Burst 6 -> 2) ──
  {
    processes: {
      chrome: p(CHROME, "ready", { cpuBurstMs: 2 }),
      spotify: p(SPOTIFY, "running", { cpuBurstMs: 4 }),
      vscode: p(VSCODE, "ready", { cpuBurstMs: 4 }),
      discord: p(DISCORD, "terminated", { cpuBurstMs: 0 }),
    },
    newQueue: [],
    readyQueue: ["vscode", "chrome"],
    waitQueue: [],
    suspendedQueue: [],
    terminatedList: ["discord"],
    cpu: { currentProcess: "spotify", mode: "user", utilizationPct: 100, timerMs: 4 },
    memory: mem(p(CHROME, "ready"), p(SPOTIFY, "running"), p(VSCODE, "ready"), p(DISCORD, "terminated")),
    explanation:
      "Chrome runs for 4ms. Its remaining burst goes from 6ms → 2ms. It is preempted. Spotify (burst 4) is dispatched.",
    toastMessage: "Chrome preempted, Spotify gets CPU",
    chapter: "Round Robin (RR)",
    logEntries: [
      ...FCFS_LOG_BASE,
      { timeMs: 19000, message: "IRQ: Timer interrupt — Chrome" },
    ],
  },

  // ── Step 7: Spotify FINISHES! (Burst 4 -> 0) ──
  {
    processes: {
      chrome: p(CHROME, "ready", { cpuBurstMs: 2 }),
      spotify: p(SPOTIFY, "terminated", { cpuBurstMs: 0 }),
      vscode: p(VSCODE, "running", { cpuBurstMs: 4 }),
      discord: p(DISCORD, "terminated", { cpuBurstMs: 0 }),
    },
    newQueue: [],
    readyQueue: ["chrome"],
    waitQueue: [],
    suspendedQueue: [],
    terminatedList: ["discord", "spotify"],
    cpu: { currentProcess: "vscode", mode: "user", utilizationPct: 100, timerMs: 4 },
    memory: mem(p(CHROME, "ready"), p(SPOTIFY, "terminated"), p(VSCODE, "running"), p(DISCORD, "terminated")),
    explanation:
      "Spotify uses its 4ms and its burst drops from 4 → 0. Spotify TERMINATES! VS Code (burst 4) is dispatched.",
    toastMessage: "Spotify Terminated! VS Code gets CPU",
    chapter: "Round Robin (RR)",
    logEntries: [
      ...FCFS_LOG_BASE,
      { timeMs: 23000, message: "Spotify (P2) → TERMINATED" },
    ],
  },

  // ── Step 8: VS Code FINISHES! (Burst 4 -> 0) (Round 3 begins) ──
  {
    processes: {
      chrome: p(CHROME, "running", { cpuBurstMs: 2 }),
      spotify: p(SPOTIFY, "terminated", { cpuBurstMs: 0 }),
      vscode: p(VSCODE, "terminated", { cpuBurstMs: 0 }),
      discord: p(DISCORD, "terminated", { cpuBurstMs: 0 }),
    },
    newQueue: [],
    readyQueue: [],
    waitQueue: [],
    suspendedQueue: [],
    terminatedList: ["discord", "spotify", "vscode"],
    cpu: { currentProcess: "chrome", mode: "user", utilizationPct: 100, timerMs: 4 },
    memory: mem(p(CHROME, "running"), p(SPOTIFY, "terminated"), p(VSCODE, "terminated"), p(DISCORD, "terminated")),
    explanation:
      "VS Code uses its 4ms and drops from 4 → 0. VS Code TERMINATES! Chrome is the only process left. It gets the CPU for Round 3. It only needs 2ms.",
    toastMessage: "VS Code Terminated! Chrome gets CPU",
    chapter: "Round Robin (RR)",
    logEntries: [
      ...FCFS_LOG_BASE,
      { timeMs: 27000, message: "VS Code (P3) → TERMINATED" },
    ],
  },

  // ── Step 9: Chrome FINISHES! (Burst 2 -> 0) ──
  {
    processes: {
      chrome: p(CHROME, "terminated", { cpuBurstMs: 0 }),
      spotify: p(SPOTIFY, "terminated", { cpuBurstMs: 0 }),
      vscode: p(VSCODE, "terminated", { cpuBurstMs: 0 }),
      discord: p(DISCORD, "terminated", { cpuBurstMs: 0 }),
    },
    newQueue: [],
    readyQueue: [],
    waitQueue: [],
    suspendedQueue: [],
    terminatedList: ["discord", "spotify", "vscode", "chrome"],
    cpu: { currentProcess: null, mode: "idle", utilizationPct: 0 },
    memory: mem(p(CHROME, "terminated"), p(SPOTIFY, "terminated"), p(VSCODE, "terminated"), p(DISCORD, "terminated")),
    explanation:
      "Chrome only needs 2ms, so it finishes early before its quantum expires. Chrome TERMINATES! All processes have completed successfully.",
    toastMessage: "Chrome Terminated! All done!",
    chapter: "Round Robin (RR)",
    logEntries: [
      ...FCFS_LOG_BASE,
      { timeMs: 29000, message: "Chrome (P1) → TERMINATED" },
    ],
  },
];

// ───────────────────────────────────────────────────────
// SCENARIO FACTORY
// ───────────────────────────────────────────────────────

export function createCpuSchedulingScenario(
  schedulingMode: SchedulingMode = "non_preemptive"
): OSSimulationScenario {
  const steps = schedulingMode === "preemptive" ? RR_STEPS : FCFS_STEPS;
  const title = schedulingMode === "preemptive" ? "Round Robin (RR)" : "First-Come-First-Served";

  return {
    id: "cpu-scheduling",
    title: "CPU Scheduling Algorithms",
    description:
      "Compare FCFS and Round Robin scheduling. Use the toggle to switch between non-preemptive and preemptive algorithms.",
    chapters: [
      {
        title: title,
        startStep: 0,
        endStep: steps.length - 1,
      },
    ],
    steps: steps,
  };
}

export const CPU_SCHEDULING_SCENARIO = createCpuSchedulingScenario("non_preemptive");
