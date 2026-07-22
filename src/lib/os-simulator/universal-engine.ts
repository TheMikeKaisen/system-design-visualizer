// ═══════════════════════════════════════════════════════
// UNIVERSAL CPU SCHEDULING ENGINE — Episode 5
// Supports: FCFS, SJF (more to be added)
// ═══════════════════════════════════════════════════════

export type SchedulingAlgorithm = "FCFS" | "SJF" | "SRTF";

export interface UniversalProcess {
  id: string;
  pid: string;
  name: string;
  color: string;
  arrivalTime: number;
  burstTime: number;
}

export interface ExecutionBlock {
  startTime: number;
  endTime: number;
}

export interface UniversalProcessResult extends UniversalProcess {
  executionBlocks: ExecutionBlock[];
  firstStartTime: number;
  completionTime: number;
  turnaroundTime: number;
  waitingTime: number;
  responseTime: number;
}

export interface GanttBlock {
  type: "process" | "idle";
  processId?: string;
  pid?: string;
  color?: string;
  startTime: number;
  endTime: number;
}

export interface UniversalEvent {
  time: number;
  type:
    | "arrive"
    | "cpu_select"
    | "complete"
    | "idle_start"
    | "warning"
    | "sim_end";
  processId?: string;
  pid?: string;
  message: string;
}

export interface SchedulingWarning {
  detected: boolean;
  type?: "convoy_effect" | "starvation";
  culpritPid?: string;
  affectedPids?: string[];
  message?: string;
}

export interface UniversalMetrics {
  avgWaitingTime: number;
  avgTurnaroundTime: number;
  avgResponseTime: number;
  cpuUtilization: number;
  throughput: number;
  totalIdleTime: number;
  totalTime: number;
}

export interface UniversalSimulation {
  algorithm: SchedulingAlgorithm;
  processResults: UniversalProcessResult[];
  ganttBlocks: GanttBlock[];
  events: UniversalEvent[];
  totalTime: number;
  metrics: UniversalMetrics;
  warning: SchedulingWarning;
}

export const PROCESS_COLORS = [
  "#4285F4",
  "#1DB954",
  "#FF6B6B",
  "#FFD93D",
  "#8B5CF6",
  "#EC4899",
];

// Whiteboard SRTF Preset
export const DEFAULT_UNIVERSAL_PROCESSES: UniversalProcess[] = [
  { id: "p1", pid: "P1", name: "P1", color: "#4285F4", arrivalTime: 0, burstTime: 5 },
  { id: "p2", pid: "P2", name: "P2", color: "#1DB954", arrivalTime: 1, burstTime: 3 },
  { id: "p3", pid: "P3", name: "P3", color: "#FF6B6B", arrivalTime: 2, burstTime: 4 },
  { id: "p4", pid: "P4", name: "P4", color: "#FFD93D", arrivalTime: 4, burstTime: 1 },
];

export const TERM_INFO: Record<
  string,
  { name: string; description: string; formula?: string }
> = {
  at: {
    name: "Arrival Time (AT)",
    description: "The time at which the process enters the system and becomes available for scheduling.",
  },
  bt: {
    name: "Burst Time (BT)",
    description: "The total CPU time required by the process to complete its execution.",
  },
  ct: {
    name: "Completion Time (CT)",
    description: "The time at which the process finishes its execution on the CPU.",
    formula: "CT = Last Execution End Time",
  },
  tat: {
    name: "Turnaround Time (TAT)",
    description: "The total time taken from process arrival to its completion.",
    formula: "TAT = CT − AT",
  },
  wt: {
    name: "Waiting Time (WT)",
    description: "The total time the process spends waiting in the Ready Queue.",
    formula: "WT = TAT − BT",
  },
  rt: {
    name: "Response Time (RT)",
    description: "The time from arrival to the very first time the process gets the CPU.",
    formula: "RT = First Start Time − AT",
  },
  preemption: {
    name: "Preemption",
    description: "When the CPU stops executing the current process and places it back in the Ready Queue because a higher-priority process arrived.",
  },
  cpuUtil: {
    name: "CPU Utilization",
    description: "Percentage of time the CPU was actively executing processes (not idle).",
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

export function computeUniversalScheduling(
  processes: UniversalProcess[],
  algorithm: SchedulingAlgorithm
): UniversalSimulation {
  if (processes.length === 0) {
    return {
      algorithm,
      processResults: [],
      ganttBlocks: [],
      events: [],
      totalTime: 0,
      metrics: {
        avgWaitingTime: 0,
        avgTurnaroundTime: 0,
        avgResponseTime: 0,
        cpuUtilization: 0,
        throughput: 0,
        totalIdleTime: 0,
        totalTime: 0,
      },
      warning: { detected: false },
    };
  }

  const results = processes.map((p) => ({
    ...p,
    executionBlocks: [],
    firstStartTime: -1,
    completionTime: 0,
    turnaroundTime: 0,
    waitingTime: 0,
    responseTime: 0,
    _remainingBurst: p.burstTime,
  })) as (UniversalProcessResult & { _remainingBurst: number })[];

  const ganttBlocks: GanttBlock[] = [];
  const events: UniversalEvent[] = [];
  
  let currentTime = 0;
  let completedCount = 0;
  let totalIdleTime = 0;
  const n = results.length;

  // Generate arrival events for log
  const sortedArrivals = [...results].sort((a, b) => {
    if (a.arrivalTime !== b.arrivalTime) return a.arrivalTime - b.arrivalTime;
    return a.pid.localeCompare(b.pid);
  });
  for (const proc of sortedArrivals) {
    events.push({
      time: proc.arrivalTime,
      type: "arrive",
      processId: proc.id,
      pid: proc.pid,
      message: `${proc.pid} arrived → Ready Queue  [AT = ${proc.arrivalTime}]`,
    });
  }

  // Simulation Loop
  let currentProcId: string | null = null;
  let currentBlockStart = -1;

  while (completedCount < n) {
    const available = results.filter((p) => p.arrivalTime <= currentTime && p.completionTime === 0);

    if (available.length === 0) {
      // CPU is IDLE, jump to next arrival
      if (currentProcId !== null) {
        currentProcId = null;
      }
      const nextArrivals = results
        .filter((p) => p.completionTime === 0)
        .map((p) => p.arrivalTime)
        .sort((a, b) => a - b);
      
      const nextArrival = nextArrivals[0];
      const idleStart = currentTime;
      const idleEnd = nextArrival;
      
      ganttBlocks.push({ type: "idle", startTime: idleStart, endTime: idleEnd });
      events.push({
        time: idleStart,
        type: "idle_start",
        message: `CPU IDLE — no process in Ready Queue  [${idleStart} → ${idleEnd}]`,
      });
      totalIdleTime += idleEnd - idleStart;
      currentTime = nextArrival;
      continue;
    }

    // Select process based on algorithm
    let selectedProc = available[0];
    if (algorithm === "FCFS") {
      if (currentProcId) {
        selectedProc = available.find(p => p.id === currentProcId)!;
      } else {
        available.sort((a, b) => {
          if (a.arrivalTime !== b.arrivalTime) return a.arrivalTime - b.arrivalTime;
          return a.pid.localeCompare(b.pid);
        });
        selectedProc = available[0];
      }
    } else if (algorithm === "SJF") {
      if (currentProcId) {
        selectedProc = available.find(p => p.id === currentProcId)!;
      } else {
        available.sort((a, b) => {
          if (a.burstTime !== b.burstTime) return a.burstTime - b.burstTime;
          if (a.arrivalTime !== b.arrivalTime) return a.arrivalTime - b.arrivalTime;
          return a.pid.localeCompare(b.pid);
        });
        selectedProc = available[0];
      }
    } else if (algorithm === "SRTF") {
      available.sort((a, b) => {
        if (a._remainingBurst !== b._remainingBurst) return a._remainingBurst - b._remainingBurst;
        if (a.arrivalTime !== b.arrivalTime) return a.arrivalTime - b.arrivalTime;
        return a.pid.localeCompare(b.pid);
      });
      selectedProc = available[0];
    }

    // Context switch detected
    if (currentProcId !== selectedProc.id) {
      if (currentProcId !== null) {
        // Close previous block
        const prevProc = results.find(p => p.id === currentProcId)!;
        prevProc.executionBlocks.push({ startTime: currentBlockStart, endTime: currentTime });
        ganttBlocks.push({
          type: "process",
          processId: prevProc.id,
          pid: prevProc.pid,
          color: prevProc.color,
          startTime: currentBlockStart,
          endTime: currentTime,
        });

        // Preemption log
        if (prevProc._remainingBurst > 0) {
          events.push({
            time: currentTime,
            type: "warning",
            processId: prevProc.id,
            pid: prevProc.pid,
            message: `⚡ Preemption: ${prevProc.pid} was preempted by ${selectedProc.pid}!`,
          });
        }
      }
      
      currentProcId = selectedProc.id;
      currentBlockStart = currentTime;
      
      if (selectedProc.firstStartTime === -1) {
        selectedProc.firstStartTime = currentTime;
      }
      
      events.push({
        time: currentTime,
        type: "cpu_select",
        processId: selectedProc.id,
        pid: selectedProc.pid,
        message: `CPU selected ${selectedProc.pid}  [Remaining BT = ${selectedProc._remainingBurst}ms]`,
      });
    }

    // Calculate step amount
    let stepAmount = 0;
    
    if (algorithm === "FCFS" || algorithm === "SJF") {
       stepAmount = selectedProc._remainingBurst;
    } else if (algorithm === "SRTF") {
       const futureArrivals = results
         .filter(p => p.arrivalTime > currentTime && p.completionTime === 0)
         .map(p => p.arrivalTime)
         .sort((a,b)=>a-b);
       const nextArrival = futureArrivals.length > 0 ? futureArrivals[0] : Infinity;
       stepAmount = Math.min(selectedProc._remainingBurst, nextArrival - currentTime);
    }
    
    currentTime += stepAmount;
    selectedProc._remainingBurst -= stepAmount;

    // Check completion
    if (selectedProc._remainingBurst === 0) {
      selectedProc.completionTime = currentTime;
      selectedProc.turnaroundTime = currentTime - selectedProc.arrivalTime;
      selectedProc.waitingTime = selectedProc.turnaroundTime - selectedProc.burstTime;
      selectedProc.responseTime = selectedProc.firstStartTime - selectedProc.arrivalTime;
      
      events.push({
        time: currentTime,
        type: "complete",
        processId: selectedProc.id,
        pid: selectedProc.pid,
        message: `${selectedProc.pid} completed  [CT = ${currentTime}, TAT = ${selectedProc.turnaroundTime}, WT = ${selectedProc.waitingTime}]`,
      });

      selectedProc.executionBlocks.push({ startTime: currentBlockStart, endTime: currentTime });
      ganttBlocks.push({
        type: "process",
        processId: selectedProc.id,
        pid: selectedProc.pid,
        color: selectedProc.color,
        startTime: currentBlockStart,
        endTime: currentTime,
      });

      currentProcId = null;
      completedCount++;
    }
  }

  const totalTime = currentTime;

  // Aggregate Metrics
  const avgWaitingTime = results.reduce((s, r) => s + r.waitingTime, 0) / n;
  const avgTurnaroundTime = results.reduce((s, r) => s + r.turnaroundTime, 0) / n;
  const avgResponseTime = results.reduce((s, r) => s + r.responseTime, 0) / n;
  const busyTime = totalTime - totalIdleTime;
  const cpuUtilization = totalTime > 0 ? (busyTime / totalTime) * 100 : 0;
  const throughput = totalTime > 0 ? n / totalTime : 0;

  // Warning Detection
  let warning: SchedulingWarning = { detected: false };
  const avgBurst = results.reduce((s, r) => s + r.burstTime, 0) / n;

  if (algorithm === "FCFS") {
    // Convoy Effect detection
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
          warning = {
            detected: true,
            type: "convoy_effect",
            culpritPid: result.pid,
            affectedPids,
            message: `${result.pid} (BT = ${result.burstTime}) is delaying ${affectedPids.join(", ")}. This is the Convoy Effect — a long process blocks shorter processes behind it.`,
          };
          events.push({
            time: result.firstStartTime,
            type: "warning",
            processId: result.id,
            pid: result.pid,
            message: `⚠ Convoy Effect: ${result.pid} (BT=${result.burstTime}) is blocking shorter processes (${affectedPids.join(", ")})`,
          });
          break;
        }
      }
    }
  } else if (algorithm === "SJF" || algorithm === "SRTF") {
    // Starvation detection: A process waits more than 3x its burst time due to shorter arrivals
    for (const result of results) {
      if (result.waitingTime > result.burstTime * 3 && result.waitingTime > 0) {
        warning = {
          detected: true,
          type: "starvation",
          culpritPid: result.pid,
          message: `${result.pid} suffered from Starvation. It waited ${result.waitingTime}ms because shorter jobs kept arriving and jumping the queue.`,
        };
        events.push({
          time: result.completionTime,
          type: "warning",
          processId: result.id,
          pid: result.pid,
          message: `⚠ Starvation Detected: ${result.pid} experienced extreme waiting time (${result.waitingTime}ms).`,
        });
        break;
      }
    }
  }

  // Simulation End Event
  events.push({
    time: totalTime,
    type: "sim_end",
    message: `Simulation complete — all ${n} processes terminated`,
  });

  // Sort events chronologically, with stable ordering within same time
  const eventOrder: Record<string, number> = {
    arrive: 0,
    idle_start: 1,
    cpu_select: 2,
    warning: 3,
    complete: 4,
    sim_end: 5,
  };
  events.sort((a, b) => {
    if (a.time !== b.time) return a.time - b.time;
    return (eventOrder[a.type] ?? 0) - (eventOrder[b.type] ?? 0);
  });

  // Sort results sequentially based on initial user input (PID)
  results.sort((a, b) => a.pid.localeCompare(b.pid));

  return {
    algorithm,
    processResults: results,
    ganttBlocks,
    events,
    totalTime,
    metrics: {
      avgWaitingTime: Math.round(avgWaitingTime * 100) / 100,
      avgTurnaroundTime: Math.round(avgTurnaroundTime * 100) / 100,
      avgResponseTime: Math.round(avgResponseTime * 100) / 100,
      cpuUtilization: Math.round(cpuUtilization * 100) / 100,
      throughput: Math.round(throughput * 1000) / 1000,
      totalIdleTime,
      totalTime,
    },
    warning,
  };
}

// ───────────────────────────────────────────────────────
// HELPERS (for deriving state at a given time t)
// ───────────────────────────────────────────────────────

export type ProcessStateAtTime = "not_arrived" | "ready" | "running" | "terminated";

export function getUniversalProcessStateAtTime(
  proc: UniversalProcessResult,
  time: number
): ProcessStateAtTime {
  if (time < proc.arrivalTime) return "not_arrived";
  if (time >= proc.completionTime) return "terminated";
  
  // Check if it is currently inside an execution block
  for (const block of proc.executionBlocks) {
    if (time >= block.startTime && time < block.endTime) {
      return "running";
    }
  }
  
  return "ready";
}
