// ═══════════════════════════════════════════════════════
// FCFS SCHEDULING ENGINE — Episode 4
// Pure computation: takes processes → returns full simulation
// ═══════════════════════════════════════════════════════

// ───────────────────────────────────────────────────────
// TYPES
// ───────────────────────────────────────────────────────

export interface FCFSProcess {
  id: string;
  pid: string;
  name: string;
  color: string;
  arrivalTime: number;
  burstTime: number;
}

export interface FCFSProcessResult extends FCFSProcess {
  startTime: number;
  completionTime: number;
  turnaroundTime: number;
  waitingTime: number;
}

export interface GanttBlock {
  type: "process" | "idle";
  processId?: string;
  pid?: string;
  color?: string;
  startTime: number;
  endTime: number;
}

export interface FCFSEvent {
  time: number;
  type:
    | "arrive"
    | "cpu_select"
    | "complete"
    | "idle_start"
    | "convoy_warning"
    | "sim_end";
  processId?: string;
  pid?: string;
  message: string;
}

export interface ConvoyEffect {
  detected: boolean;
  culpritPid?: string;
  affectedPids?: string[];
  message?: string;
}

export interface FCFSMetrics {
  avgWaitingTime: number;
  avgTurnaroundTime: number;
  cpuUtilization: number;
  throughput: number;
  totalIdleTime: number;
  totalTime: number;
}

export interface FCFSSimulation {
  processResults: FCFSProcessResult[];
  ganttBlocks: GanttBlock[];
  events: FCFSEvent[];
  totalTime: number;
  metrics: FCFSMetrics;
  convoyEffect: ConvoyEffect;
}

// ───────────────────────────────────────────────────────
// DEFAULT PRESET (matches whiteboard screenshot)
// ───────────────────────────────────────────────────────

export const PROCESS_COLORS = [
  "#4285F4",
  "#1DB954",
  "#FF6B6B",
  "#FFD93D",
  "#8B5CF6",
  "#EC4899",
];

export const DEFAULT_PROCESSES: FCFSProcess[] = [
  { id: "p1", pid: "P1", name: "P1", color: "#4285F4", arrivalTime: 0, burstTime: 2 },
  { id: "p2", pid: "P2", name: "P2", color: "#1DB954", arrivalTime: 1, burstTime: 2 },
  { id: "p3", pid: "P3", name: "P3", color: "#FF6B6B", arrivalTime: 5, burstTime: 3 },
  { id: "p4", pid: "P4", name: "P4", color: "#FFD93D", arrivalTime: 6, burstTime: 4 },
];

// ───────────────────────────────────────────────────────
// TERM INFO (for ? tooltips)
// ───────────────────────────────────────────────────────

export const TERM_INFO: Record<
  string,
  { name: string; description: string; formula?: string }
> = {
  at: {
    name: "Arrival Time (AT)",
    description:
      "The time at which the process enters the system and becomes available for scheduling.",
  },
  bt: {
    name: "Burst Time (BT)",
    description:
      "The total CPU time required by the process to complete its execution.",
  },
  ct: {
    name: "Completion Time (CT)",
    description:
      "The time at which the process finishes its execution on the CPU.",
    formula: "CT = Start Time + Burst Time",
  },
  tat: {
    name: "Turnaround Time (TAT)",
    description:
      "The total time taken from process arrival to its completion. Includes both waiting and execution time.",
    formula: "TAT = CT − AT",
  },
  wt: {
    name: "Waiting Time (WT)",
    description:
      "The total time the process spends waiting in the Ready Queue before getting the CPU.",
    formula: "WT = TAT − BT",
  },
  cpuUtil: {
    name: "CPU Utilization",
    description:
      "Percentage of time the CPU was actively executing processes (not idle).",
    formula: "CPU Util = (Busy Time ÷ Total Time) × 100%",
  },
  throughput: {
    name: "Throughput",
    description: "The number of processes completed per unit of time.",
    formula: "Throughput = Total Completed ÷ Total Time",
  },
};

// ───────────────────────────────────────────────────────
// CORE ALGORITHM
// ───────────────────────────────────────────────────────

export function computeFCFS(processes: FCFSProcess[]): FCFSSimulation {
  if (processes.length === 0) {
    return {
      processResults: [],
      ganttBlocks: [],
      events: [],
      totalTime: 0,
      metrics: {
        avgWaitingTime: 0,
        avgTurnaroundTime: 0,
        cpuUtilization: 0,
        throughput: 0,
        totalIdleTime: 0,
        totalTime: 0,
      },
      convoyEffect: { detected: false },
    };
  }

  // Sort by arrival time (FCFS), tiebreak by PID
  const sorted = [...processes].sort((a, b) => {
    if (a.arrivalTime !== b.arrivalTime) return a.arrivalTime - b.arrivalTime;
    return a.pid.localeCompare(b.pid);
  });

  const results: FCFSProcessResult[] = [];
  const ganttBlocks: GanttBlock[] = [];
  const events: FCFSEvent[] = [];
  let currentTime = 0;
  let totalIdleTime = 0;

  // Generate arrival events
  for (const proc of sorted) {
    events.push({
      time: proc.arrivalTime,
      type: "arrive",
      processId: proc.id,
      pid: proc.pid,
      message: `${proc.pid} arrived → Ready Queue  [AT = ${proc.arrivalTime}]`,
    });
  }

  // Schedule each process in FCFS order
  for (const proc of sorted) {
    // Idle gap: CPU free before this process arrives
    if (currentTime < proc.arrivalTime) {
      const idleStart = currentTime;
      const idleEnd = proc.arrivalTime;
      ganttBlocks.push({ type: "idle", startTime: idleStart, endTime: idleEnd });
      events.push({
        time: idleStart,
        type: "idle_start",
        message: `CPU IDLE — no process in Ready Queue  [${idleStart} → ${idleEnd}]`,
      });
      totalIdleTime += idleEnd - idleStart;
      currentTime = proc.arrivalTime;
    }

    const startTime = currentTime;
    const completionTime = startTime + proc.burstTime;
    const turnaroundTime = completionTime - proc.arrivalTime;
    const waitingTime = turnaroundTime - proc.burstTime;

    // CPU selects this process
    events.push({
      time: startTime,
      type: "cpu_select",
      processId: proc.id,
      pid: proc.pid,
      message: `CPU selected ${proc.pid}  [BT = ${proc.burstTime}ms, runs ${startTime} → ${completionTime}]`,
    });

    // Process completes
    events.push({
      time: completionTime,
      type: "complete",
      processId: proc.id,
      pid: proc.pid,
      message: `${proc.pid} completed  [CT = ${completionTime}, TAT = ${turnaroundTime}, WT = ${waitingTime}]`,
    });

    ganttBlocks.push({
      type: "process",
      processId: proc.id,
      pid: proc.pid,
      color: proc.color,
      startTime,
      endTime: completionTime,
    });

    results.push({
      ...proc,
      startTime,
      completionTime,
      turnaroundTime,
      waitingTime,
    });

    currentTime = completionTime;
  }

  const totalTime = currentTime;

  // Aggregate metrics
  const avgWaitingTime =
    results.reduce((s, r) => s + r.waitingTime, 0) / results.length;
  const avgTurnaroundTime =
    results.reduce((s, r) => s + r.turnaroundTime, 0) / results.length;
  const busyTime = totalTime - totalIdleTime;
  const cpuUtilization = totalTime > 0 ? (busyTime / totalTime) * 100 : 0;
  const throughput = totalTime > 0 ? results.length / totalTime : 0;

  // Convoy effect detection
  const avgBurst =
    results.reduce((s, r) => s + r.burstTime, 0) / results.length;
  let convoyEffect: ConvoyEffect = { detected: false };

  for (const result of results) {
    if (result.burstTime > avgBurst * 2) {
      const affectedPids = results
        .filter(
          (r) =>
            r.arrivalTime < result.completionTime &&
            r.arrivalTime > result.arrivalTime &&
            r.waitingTime > 0
        )
        .map((r) => r.pid);
      if (affectedPids.length >= 1) {
        convoyEffect = {
          detected: true,
          culpritPid: result.pid,
          affectedPids,
          message: `${result.pid} (BT = ${result.burstTime}) is delaying ${affectedPids.join(", ")}. This is the Convoy Effect — a long process blocks all shorter processes behind it.`,
        };
        events.push({
          time: result.startTime,
          type: "convoy_warning",
          processId: result.id,
          pid: result.pid,
          message: `⚠ Convoy Effect: ${result.pid} (BT=${result.burstTime}) is blocking shorter processes (${affectedPids.join(", ")})`,
        });
        break;
      }
    }
  }

  // Simulation end event
  events.push({
    time: totalTime,
    type: "sim_end",
    message: `Simulation complete — all ${results.length} processes terminated`,
  });

  // Sort events chronologically, with stable ordering within same time
  const eventOrder: Record<string, number> = {
    arrive: 0,
    idle_start: 1,
    cpu_select: 2,
    convoy_warning: 3,
    complete: 4,
    sim_end: 5,
  };
  events.sort((a, b) => {
    if (a.time !== b.time) return a.time - b.time;
    return (eventOrder[a.type] ?? 0) - (eventOrder[b.type] ?? 0);
  });

  return {
    processResults: results,
    ganttBlocks,
    events,
    totalTime,
    metrics: {
      avgWaitingTime: Math.round(avgWaitingTime * 100) / 100,
      avgTurnaroundTime: Math.round(avgTurnaroundTime * 100) / 100,
      cpuUtilization: Math.round(cpuUtilization * 100) / 100,
      throughput: Math.round(throughput * 1000) / 1000,
      totalIdleTime,
      totalTime,
    },
    convoyEffect,
  };
}

// ───────────────────────────────────────────────────────
// HELPERS (for deriving state at a given time t)
// ───────────────────────────────────────────────────────

export type ProcessStateAtTime =
  | "not_arrived"
  | "ready"
  | "running"
  | "terminated";

export function getProcessStateAtTime(
  proc: FCFSProcessResult,
  time: number
): ProcessStateAtTime {
  if (time < proc.arrivalTime) return "not_arrived";
  if (time < proc.startTime) return "ready";
  if (time < proc.completionTime) return "running";
  return "terminated";
}
