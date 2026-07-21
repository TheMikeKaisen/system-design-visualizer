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
    chapter: "Round Robin (RR)",
    logEntries: [...FCFS_LOG_BASE],
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
    chapter: "Round Robin (RR)",
    logEntries: [
      ...FCFS_LOG_BASE,
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
    chapter: "Round Robin (RR)",
    logEntries: [
      ...FCFS_LOG_BASE,
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
    chapter: "Round Robin (RR)",
    logEntries: [
      ...FCFS_LOG_BASE,
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
    chapter: "Round Robin (RR)",
    logEntries: [
      ...FCFS_LOG_BASE,
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
    chapter: "Round Robin (RR)",
    logEntries: [
      ...FCFS_LOG_BASE,
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
    chapter: "Round Robin (RR)",
    logEntries: [
      ...FCFS_LOG_BASE,
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
    chapter: "Round Robin (RR)",
    logEntries: [
      ...FCFS_LOG_BASE,
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
    chapter: "Round Robin (RR)",
    logEntries: [
      ...FCFS_LOG_BASE,
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
    chapter: "Round Robin (RR)",
    logEntries: [
      ...FCFS_LOG_BASE,
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
    chapter: "Round Robin (RR)",
    logEntries: [
      ...FCFS_LOG_BASE,
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
