// ═══════════════════════════════════════════════════════
// UNIVERSAL CPU SCHEDULING ENGINE — Episode 5
// Supports: FCFS, SJF (more to be added)
// ═══════════════════════════════════════════════════════

export type SchedulingAlgorithm = "FCFS" | "SJF" | "SRTF" | "RR";

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
  timeQuantum?: number;
  readyQueueSnapshots: { time: number; queue: string[] }[];
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
  algorithm: SchedulingAlgorithm,
  timeQuantum: number = 2
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
      timeQuantum: algorithm === "RR" ? timeQuantum : undefined,
      readyQueueSnapshots: [],
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
  const readyQueueSnapshots: { time: number; queue: string[] }[] = [];
  
  let currentTime = 0;
  let completedCount = 0;
  let totalIdleTime = 0;
  const n = results.length;

  // Tick-by-Tick Simulation State
  const readyQueue: (UniversalProcessResult & { _remainingBurst: number })[] = [];
  let currentProc: (UniversalProcessResult & { _remainingBurst: number }) | null = null;
  let currentBlockStart = -1;
  let currentQuantumUsed = 0;
  const hasArrived = new Set<string>();

  // Helper to coalesce idle blocks
  const addIdleTick = (t: number) => {
    if (ganttBlocks.length === 0 || ganttBlocks[ganttBlocks.length - 1].type !== "idle") {
      ganttBlocks.push({ type: "idle", startTime: t, endTime: t + 1 });
    } else {
      ganttBlocks[ganttBlocks.length - 1].endTime = t + 1;
    }
  };

  while (completedCount < n) {
    // 1. Handle New Arrivals at this exact tick
    const newArrivals = results
      .filter((p) => p.arrivalTime === currentTime && !hasArrived.has(p.id))
      .sort((a, b) => a.pid.localeCompare(b.pid)); // Sort alphabetically for deterministic tie-breaking
    
    for (const p of newArrivals) {
      hasArrived.add(p.id);
      readyQueue.push(p);
      events.push({
        time: currentTime,
        type: "arrive",
        processId: p.id,
        pid: p.pid,
        message: `${p.pid} arrived → Ready Queue  [AT = ${p.arrivalTime}]`,
      });
    }

    // 2. Handle Preemptions & Completions (from the PREVIOUS tick)
    if (currentProc) {
      if (currentProc._remainingBurst === 0) {
        // Completion
        currentProc.completionTime = currentTime;
        currentProc.turnaroundTime = currentTime - currentProc.arrivalTime;
        currentProc.waitingTime = currentProc.turnaroundTime - currentProc.burstTime;
        currentProc.responseTime = currentProc.firstStartTime - currentProc.arrivalTime;
        
        events.push({
          time: currentTime,
          type: "complete",
          processId: currentProc.id,
          pid: currentProc.pid,
          message: `${currentProc.pid} completed  [CT = ${currentTime}, TAT = ${currentProc.turnaroundTime}, WT = ${currentProc.waitingTime}]`,
        });

        currentProc.executionBlocks.push({ startTime: currentBlockStart, endTime: currentTime });
        ganttBlocks.push({
          type: "process",
          processId: currentProc.id,
          pid: currentProc.pid,
          color: currentProc.color,
          startTime: currentBlockStart,
          endTime: currentTime,
        });

        currentProc = null;
        completedCount++;
      } else if (algorithm === "RR" && currentQuantumUsed === timeQuantum) {
        // RR Quantum Expiration (Preemption)
        events.push({
          time: currentTime,
          type: "warning",
          processId: currentProc.id,
          pid: currentProc.pid,
          message: `⏱ Quantum Expired: ${currentProc.pid} preempted after ${timeQuantum}ms.`,
        });

        currentProc.executionBlocks.push({ startTime: currentBlockStart, endTime: currentTime });
        ganttBlocks.push({
          type: "process",
          processId: currentProc.id,
          pid: currentProc.pid,
          color: currentProc.color,
          startTime: currentBlockStart,
          endTime: currentTime,
        });

        // Add BACK to ready queue (happens AFTER new arrivals per standard convention)
        readyQueue.push(currentProc);
        currentProc = null;
      } else if (algorithm === "SRTF") {
        // SRTF Preemption Check: Is there a strictly shorter job in the ready queue?
        let shortestInQueue = readyQueue.length > 0 ? readyQueue[0] : null;
        for (const p of readyQueue) {
          if (p._remainingBurst < (shortestInQueue?._remainingBurst ?? Infinity)) {
            shortestInQueue = p;
          }
        }
        
        if (shortestInQueue && shortestInQueue._remainingBurst < currentProc._remainingBurst) {
           events.push({
             time: currentTime,
             type: "warning",
             processId: currentProc.id,
             pid: currentProc.pid,
             message: `⚡ Preemption: ${currentProc.pid} preempted by shorter job ${shortestInQueue.pid}!`,
           });
           
           currentProc.executionBlocks.push({ startTime: currentBlockStart, endTime: currentTime });
           ganttBlocks.push({
             type: "process",
             processId: currentProc.id,
             pid: currentProc.pid,
             color: currentProc.color,
             startTime: currentBlockStart,
             endTime: currentTime,
           });

           readyQueue.push(currentProc);
           currentProc = null;
        }
      }
    }

    // 3. Select Next Process if CPU is idle
    if (!currentProc && readyQueue.length > 0) {
      if (algorithm === "SJF") {
        readyQueue.sort((a, b) => {
          if (a.burstTime !== b.burstTime) return a.burstTime - b.burstTime;
          if (a.arrivalTime !== b.arrivalTime) return a.arrivalTime - b.arrivalTime;
          return a.pid.localeCompare(b.pid);
        });
      } else if (algorithm === "SRTF") {
        readyQueue.sort((a, b) => {
          if (a._remainingBurst !== b._remainingBurst) return a._remainingBurst - b._remainingBurst;
          if (a.arrivalTime !== b.arrivalTime) return a.arrivalTime - b.arrivalTime;
          return a.pid.localeCompare(b.pid);
        });
      }
      // FCFS and RR use natural FIFO order of the queue, no sorting needed!
      
      currentProc = readyQueue.shift()!;
      currentBlockStart = currentTime;
      currentQuantumUsed = 0;
      
      if (currentProc.firstStartTime === -1) {
        currentProc.firstStartTime = currentTime;
      }
      
      events.push({
        time: currentTime,
        type: "cpu_select",
        processId: currentProc.id,
        pid: currentProc.pid,
        message: `CPU selected ${currentProc.pid}  [Rem BT = ${currentProc._remainingBurst}ms]`,
      });
    }

    // 4. Capture Ready Queue Snapshot (Exclude currently running process)
    readyQueueSnapshots.push({
      time: currentTime,
      queue: readyQueue.map(p => p.id),
    });

    // 5. Execute for 1 tick or idle
    if (!currentProc) {
      addIdleTick(currentTime);
      totalIdleTime++;
    } else {
      currentProc._remainingBurst--;
      currentQuantumUsed++;
    }

    currentTime++;
  }

  // Handle final completion state at the exact moment the last process finishes
  readyQueueSnapshots.push({
    time: currentTime,
    queue: [],
  });

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
    timeQuantum: algorithm === "RR" ? timeQuantum : undefined,
    readyQueueSnapshots,
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
