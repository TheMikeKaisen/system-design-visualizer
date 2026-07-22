"use client";

// ═══════════════════════════════════════════════════════
// EPISODE 4 — FCFS INTERACTIVE SCHEDULING SIMULATOR
// ═══════════════════════════════════════════════════════

import {
  useState,
  useEffect,
  useMemo,
  useCallback,
  useRef,
} from "react";
import { motion, AnimatePresence } from "framer-motion";
import * as Tooltip from "@radix-ui/react-tooltip";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Logo } from "@/components/ui/Logo";
import {
  computeFCFS,
  getProcessStateAtTime,
  DEFAULT_PROCESSES,
  PROCESS_COLORS,
  TERM_INFO,
  type FCFSProcess,
  type FCFSSimulation,
  type FCFSProcessResult,
  type ProcessStateAtTime,
} from "@/lib/os-simulator/fcfs-engine";

// ───────────────────────────────────────────────────────
// TYPES
// ───────────────────────────────────────────────────────

type ViewMode = "gantt" | "visualization";

// ───────────────────────────────────────────────────────
// SUB-COMPONENTS
// ───────────────────────────────────────────────────────

/** Small ? icon that shows explanation + formula on hover/click */
function InfoTooltip({ termKey }: { termKey: string }) {
  const info = TERM_INFO[termKey];
  if (!info) return null;

  return (
    <Tooltip.Provider delayDuration={100}>
      <Tooltip.Root>
        <Tooltip.Trigger asChild>
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
            }}
            className="w-3.5 h-3.5 rounded-full bg-muted/80 text-muted-foreground/60 text-[8px] font-bold inline-flex items-center justify-center hover:bg-teal-500/20 hover:text-teal-500 transition-colors cursor-help align-middle ml-1"
          >
            ?
          </button>
        </Tooltip.Trigger>
        <Tooltip.Portal>
          <Tooltip.Content
            side="bottom"
            sideOffset={8}
            collisionPadding={10}
            className="z-[100] w-56 p-3 rounded-xl bg-popover border border-border shadow-xl animate-in fade-in zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out data-[state=closed]:zoom-out-95"
          >
            <div className="text-[11px] font-bold text-foreground mb-1">
              {info.name}
            </div>
            <div className="text-[10px] text-muted-foreground leading-relaxed">
              {info.description}
            </div>
            {info.formula && (
              <div className="mt-2 px-2 py-1.5 rounded-lg bg-muted/50 font-mono text-[10px] text-teal-500">
                {info.formula}
              </div>
            )}
          </Tooltip.Content>
        </Tooltip.Portal>
      </Tooltip.Root>
    </Tooltip.Provider>
  );
}

/** Colored badge showing process state at current time */
function StateBadge({ state }: { state: ProcessStateAtTime }) {
  const config: Record<
    ProcessStateAtTime,
    { label: string; bg: string; text: string }
  > = {
    not_arrived: {
      label: "—",
      bg: "bg-muted/50",
      text: "text-muted-foreground/50",
    },
    ready: { label: "READY", bg: "bg-blue-500/15", text: "text-blue-500" },
    running: {
      label: "RUNNING",
      bg: "bg-teal-500/15",
      text: "text-teal-500",
    },
    terminated: {
      label: "DONE",
      bg: "bg-emerald-500/15",
      text: "text-emerald-500",
    },
  };
  const c = config[state];
  return (
    <motion.span
      key={state}
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className={cn(
        "inline-flex px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider",
        c.bg,
        c.text
      )}
    >
      {c.label}
    </motion.span>
  );
}

// ═══════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════

export default function FCFSSchedulingSimulator() {
  // ─── STATE ─────────────────────────────────────────
  const [inputProcesses, setInputProcesses] =
    useState<FCFSProcess[]>(DEFAULT_PROCESSES);
  const [simulation, setSimulation] = useState<FCFSSimulation | null>(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [viewMode, setViewMode] = useState<ViewMode>("gantt");
  const logRef = useRef<HTMLDivElement>(null);

  const isEditMode = simulation === null;
  const isComplete =
    simulation !== null && currentTime >= simulation.totalTime;

  // ─── DERIVED STATE ─────────────────────────────────

  /** Map of process ID → current state at `currentTime` */
  const processStates = useMemo(() => {
    if (!simulation) return new Map<string, ProcessStateAtTime>();
    return new Map(
      simulation.processResults.map((r) => [
        r.id,
        getProcessStateAtTime(r, currentTime),
      ])
    );
  }, [simulation, currentTime]);

  /** The process currently running on CPU */
  const runningProcess = useMemo<FCFSProcessResult | null>(() => {
    if (!simulation) return null;
    return (
      simulation.processResults.find(
        (r) => r.startTime <= currentTime && r.completionTime > currentTime
      ) ?? null
    );
  }, [simulation, currentTime]);

  /** CPU progress for running process */
  const cpuProgress = useMemo(() => {
    if (!runningProcess)
      return { elapsed: 0, remaining: 0, pct: 0 };
    const elapsed = currentTime - runningProcess.startTime;
    const remaining = runningProcess.burstTime - elapsed;
    const pct = (elapsed / runningProcess.burstTime) * 100;
    return { elapsed, remaining, pct };
  }, [runningProcess, currentTime]);

  /** Whether CPU is in an idle gap at currentTime */
  const isCurrentlyIdle = useMemo(() => {
    if (!simulation) return false;
    return simulation.ganttBlocks.some(
      (b) =>
        b.type === "idle" &&
        b.startTime <= currentTime &&
        b.endTime > currentTime
    );
  }, [simulation, currentTime]);

  /** Processes in each zone for Visualization view */
  const readyProcesses = useMemo(
    () =>
      simulation?.processResults.filter(
        (r) => getProcessStateAtTime(r, currentTime) === "ready"
      ) ?? [],
    [simulation, currentTime]
  );
  const terminatedProcesses = useMemo(
    () =>
      simulation?.processResults.filter(
        (r) => getProcessStateAtTime(r, currentTime) === "terminated"
      ) ?? [],
    [simulation, currentTime]
  );

  /** Events visible up to current time */
  const visibleEvents = useMemo(() => {
    if (!simulation) return [];
    return simulation.events.filter((e) => e.time <= currentTime);
  }, [simulation, currentTime]);

  /** Live metrics computed up to current time */
  const liveMetrics = useMemo(() => {
    if (!simulation) return null;
    const completed = simulation.processResults.filter(
      (r) => r.completionTime <= currentTime
    );
    const n = completed.length;
    const avgWT =
      n > 0
        ? completed.reduce((s, r) => s + r.waitingTime, 0) / n
        : 0;
    const avgTAT =
      n > 0
        ? completed.reduce((s, r) => s + r.turnaroundTime, 0) / n
        : 0;
    const busyTimeSoFar = simulation.ganttBlocks
      .filter((b) => b.type === "process" && b.startTime < currentTime)
      .reduce(
        (sum, b) =>
          sum + (Math.min(b.endTime, currentTime) - b.startTime),
        0
      );
    const cpuUtil =
      currentTime > 0 ? (busyTimeSoFar / currentTime) * 100 : 0;
    const tp = currentTime > 0 ? n / currentTime : 0;
    return {
      completed: n,
      total: simulation.processResults.length,
      avgWT: Math.round(avgWT * 100) / 100,
      avgTAT: Math.round(avgTAT * 100) / 100,
      cpuUtil: Math.round(cpuUtil * 100) / 100,
      throughput: Math.round(tp * 1000) / 1000,
    };
  }, [simulation, currentTime]);

  /** Gantt block time boundaries (for time labels) */
  const ganttTimeBoundaries = useMemo(() => {
    if (!simulation) return [];
    const times = new Set<number>();
    times.add(0);
    for (const block of simulation.ganttBlocks) {
      times.add(block.startTime);
      times.add(block.endTime);
    }
    return Array.from(times).sort((a, b) => a - b);
  }, [simulation]);

  // ─── HANDLERS ──────────────────────────────────────

  const handleRun = useCallback(() => {
    const sim = computeFCFS(inputProcesses);
    setSimulation(sim);
    setCurrentTime(0);
    setIsPlaying(true);
    setViewMode("gantt");
  }, [inputProcesses]);

  const handleReset = useCallback(() => {
    setSimulation(null);
    setCurrentTime(0);
    setIsPlaying(false);
  }, []);

  const handleStepForward = useCallback(() => {
    if (simulation && currentTime < simulation.totalTime) {
      setCurrentTime((p) => p + 1);
      setIsPlaying(false);
    }
  }, [simulation, currentTime]);

  const handleStepBack = useCallback(() => {
    if (currentTime > 0) {
      setCurrentTime((p) => p - 1);
      setIsPlaying(false);
    }
  }, [currentTime]);

  const handleInstant = useCallback(() => {
    if (simulation) {
      setCurrentTime(simulation.totalTime);
      setIsPlaying(false);
    }
  }, [simulation]);

  const togglePlay = useCallback(() => {
    if (isComplete && !isPlaying) {
      // restart from beginning
      setCurrentTime(0);
      setIsPlaying(true);
    } else {
      setIsPlaying((p) => !p);
    }
  }, [isComplete, isPlaying]);

  const updateProcess = useCallback(
    (id: string, updates: Partial<FCFSProcess>) => {
      setInputProcesses((prev) =>
        prev.map((p) => (p.id === id ? { ...p, ...updates } : p))
      );
    },
    []
  );

  const addProcess = useCallback(() => {
    if (inputProcesses.length >= 6) return;
    const nextNum = inputProcesses.length + 1;
    setInputProcesses((prev) => [
      ...prev,
      {
        id: `p${Date.now()}`,
        pid: `P${nextNum}`,
        name: `P${nextNum}`,
        color: PROCESS_COLORS[(nextNum - 1) % PROCESS_COLORS.length],
        arrivalTime: 0,
        burstTime: 1,
      },
    ]);
  }, [inputProcesses.length]);

  const removeProcess = useCallback((id: string) => {
    setInputProcesses((prev) => {
      const filtered = prev.filter((p) => p.id !== id);
      return filtered.map((p, i) => ({
        ...p,
        pid: `P${i + 1}`,
        name: `P${i + 1}`,
        color: PROCESS_COLORS[i % PROCESS_COLORS.length],
      }));
    });
  }, []);

  // ─── EFFECTS ───────────────────────────────────────

  // Auto-play timer
  useEffect(() => {
    if (!isPlaying || !simulation || currentTime >= simulation.totalTime) {
      if (isPlaying && simulation && currentTime >= simulation.totalTime) {
        setIsPlaying(false);
      }
      return;
    }
    const timer = setTimeout(() => {
      setCurrentTime((p) => Math.min(p + 1, simulation.totalTime));
    }, 1000 / playbackSpeed);
    return () => clearTimeout(timer);
  }, [isPlaying, currentTime, playbackSpeed, simulation]);

  // Auto-scroll decision log
  useEffect(() => {
    if (logRef.current) {
      logRef.current.scrollTop = logRef.current.scrollHeight;
    }
  }, [visibleEvents.length]);

  // ─── PROGRESS ──────────────────────────────────────
  const progress = simulation
    ? (currentTime / simulation.totalTime) * 100
    : 0;

  // ═════════════════════════════════════════════════════
  // RENDER
  // ═════════════════════════════════════════════════════
  return (
    <div className="h-[100dvh] bg-background flex flex-col overflow-hidden">
      {/* ──────────── NAVBAR ──────────── */}
      <nav className="h-14 border-b border-border/50 bg-background/80 backdrop-blur-md flex-shrink-0 z-30">
        <div className="h-full px-4 flex items-center gap-3">
          <Link
            href="/operating-systems"
            className="flex items-center gap-2 group shrink-0"
          >
            <Logo size={22} />
            <span className="hidden sm:inline text-sm font-semibold tracking-tight text-foreground group-hover:text-teal-500 transition-colors">
              Back to OS
            </span>
          </Link>

          <div className="h-4 w-px bg-border/50 hidden sm:block" />

          <h1 className="text-sm font-medium text-muted-foreground hidden sm:block truncate">
            Interactive Scheduler
          </h1>

          {/* Center: Playback controls (only in playback mode) */}
          <div className="flex-1 flex justify-center items-center gap-1 sm:gap-2">
            {!isEditMode && (
              <>
                {/* Restart */}
                <button
                  onClick={() => {
                    setCurrentTime(0);
                    setIsPlaying(false);
                  }}
                  className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors"
                  title="Restart"
                >
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
                    <polyline points="3 3 3 8 8 8" />
                  </svg>
                </button>

                {/* Step back */}
                <button
                  onClick={handleStepBack}
                  disabled={currentTime === 0}
                  className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors disabled:opacity-40"
                >
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <polygon points="19 20 9 12 19 4 19 20" />
                    <line x1="5" y1="19" x2="5" y2="5" />
                  </svg>
                </button>

                {/* Play/Pause */}
                <button
                  onClick={togglePlay}
                  className="w-8 h-8 flex items-center justify-center rounded-full bg-teal-500 text-white hover:bg-teal-600 hover:scale-105 transition-all shadow-sm"
                >
                  {isPlaying ? (
                    <svg
                      width="12"
                      height="12"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                    >
                      <rect x="6" y="4" width="4" height="16" />
                      <rect x="14" y="4" width="4" height="16" />
                    </svg>
                  ) : (
                    <svg
                      width="12"
                      height="12"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                      className="ml-0.5"
                    >
                      <polygon points="5 3 19 12 5 21 5 3" />
                    </svg>
                  )}
                </button>

                {/* Step forward */}
                <button
                  onClick={handleStepForward}
                  disabled={currentTime === simulation?.totalTime}
                  className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors disabled:opacity-40"
                >
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <polygon points="5 4 15 12 5 20 5 4" />
                    <line x1="19" y1="5" x2="19" y2="19" />
                  </svg>
                </button>

                {/* Time display */}
                <span className="hidden sm:block text-[10px] font-mono text-muted-foreground/50 ml-2 whitespace-nowrap">
                  t={currentTime} / {simulation?.totalTime}
                </span>

                {/* Speed controls */}
                <div className="hidden md:flex items-center gap-1 ml-2">
                  {[0.5, 1, 2, 5].map((speed) => (
                    <button
                      key={speed}
                      onClick={() => setPlaybackSpeed(speed)}
                      className={cn(
                        "px-1.5 py-0.5 rounded text-[10px] font-mono transition-colors",
                        playbackSpeed === speed
                          ? "bg-teal-500/15 text-teal-500 font-bold"
                          : "text-muted-foreground/40 hover:text-foreground"
                      )}
                    >
                      {speed}x
                    </button>
                  ))}
                  <button
                    onClick={handleInstant}
                    className="px-1.5 py-0.5 rounded text-[10px] font-mono text-muted-foreground/40 hover:text-foreground transition-colors"
                  >
                    ⏭
                  </button>
                </div>
              </>
            )}
          </div>

          {/* Right */}
          <div className="flex items-center gap-2 shrink-0">
            <ThemeToggle />
          </div>
        </div>

        {/* Progress bar */}
        {!isEditMode && (
          <div className="h-[2px] bg-muted/30 -mt-[2px]">
            <motion.div
              className="h-full bg-teal-500/70"
              initial={false}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
        )}
      </nav>

      {/* ──────────── 2-PANEL BODY ──────────── */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-[380px_1fr] overflow-hidden">
        {/* ──── LEFT PANEL ──── */}
        <aside className="border-r border-border/40 bg-background/40 overflow-y-auto p-4 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          {/* Section header */}
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground/70">
              Process Table
            </h2>
            {!isEditMode && (
              <button
                onClick={handleReset}
                className="text-[10px] font-medium text-teal-500 hover:text-teal-400 flex items-center gap-1 transition-colors"
              >
                <svg
                  width="12"
                  height="12"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
                  <polyline points="3 3 3 8 8 8" />
                </svg>
                Edit
              </button>
            )}
          </div>

          {/* ─── EDIT MODE TABLE ─── */}
          {isEditMode ? (
            <>
              <div className="rounded-xl border border-border/50 overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-muted/30">
                      <th className="text-left text-[10px] font-bold uppercase tracking-wider text-muted-foreground/60 px-3 py-2">
                        Process
                      </th>
                      <th className="text-center text-[10px] font-bold uppercase tracking-wider text-muted-foreground/60 px-3 py-2">
                        AT
                        <InfoTooltip termKey="at" />
                      </th>
                      <th className="text-center text-[10px] font-bold uppercase tracking-wider text-muted-foreground/60 px-3 py-2">
                        BT
                        <InfoTooltip termKey="bt" />
                      </th>
                      <th className="w-8" />
                    </tr>
                  </thead>
                  <tbody>
                    {inputProcesses.map((proc) => (
                      <tr
                        key={proc.id}
                        className="border-t border-border/30 hover:bg-muted/10 transition-colors"
                      >
                        <td className="px-3 py-2">
                          <div className="flex items-center gap-2">
                            <div
                              className="w-5 h-5 rounded-full flex items-center justify-center text-white text-[9px] font-bold shadow-sm"
                              style={{ backgroundColor: proc.color }}
                            >
                              {proc.pid.replace("P", "")}
                            </div>
                            <span className="text-xs font-medium">
                              {proc.pid}
                            </span>
                          </div>
                        </td>
                        <td className="px-2 py-2 text-center">
                          <input
                            type="number"
                            min={0}
                            max={999}
                            value={proc.arrivalTime}
                            onChange={(e) => {
                              const val = parseInt(e.target.value);
                              updateProcess(proc.id, {
                                arrivalTime: isNaN(val)
                                  ? 0
                                  : Math.max(0, val),
                              });
                            }}
                            className="w-14 px-2 py-1 text-center bg-muted/50 border border-border/50 rounded-lg text-xs font-mono focus:outline-none focus:ring-2 focus:ring-teal-500/50 transition-shadow"
                          />
                        </td>
                        <td className="px-2 py-2 text-center">
                          <input
                            type="number"
                            min={1}
                            max={99}
                            value={proc.burstTime}
                            onChange={(e) => {
                              const val = parseInt(e.target.value);
                              updateProcess(proc.id, {
                                burstTime: isNaN(val)
                                  ? 1
                                  : Math.max(1, val),
                              });
                            }}
                            className="w-14 px-2 py-1 text-center bg-muted/50 border border-border/50 rounded-lg text-xs font-mono focus:outline-none focus:ring-2 focus:ring-teal-500/50 transition-shadow"
                          />
                        </td>
                        <td className="px-1 py-2 text-center">
                          {inputProcesses.length > 1 && (
                            <button
                              onClick={() => removeProcess(proc.id)}
                              className="p-1 text-muted-foreground/30 hover:text-rose-500 transition-colors rounded"
                            >
                              <svg
                                width="12"
                                height="12"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                              >
                                <path d="M18 6L6 18M6 6l12 12" />
                              </svg>
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 mt-3">
                <button
                  onClick={addProcess}
                  disabled={inputProcesses.length >= 6}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-dashed border-border/60 text-[10px] font-medium text-muted-foreground hover:text-foreground hover:border-teal-500/50 transition-colors disabled:opacity-40"
                >
                  <svg
                    width="10"
                    height="10"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                  >
                    <path d="M12 5v14M5 12h14" />
                  </svg>
                  Add Process
                </button>
                <button
                  onClick={handleRun}
                  disabled={inputProcesses.length === 0}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-teal-500 text-white font-medium text-xs hover:bg-teal-600 transition-colors shadow-lg shadow-teal-500/20 disabled:opacity-40"
                >
                  <svg
                    width="12"
                    height="12"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                  >
                    <polygon points="5 3 19 12 5 21 5 3" />
                  </svg>
                  Run Simulation
                </button>
              </div>
            </>
          ) : (
            /* ─── PLAYBACK MODE TABLE ─── */
            <div className="rounded-xl border border-border/50 overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-muted/30">
                    <th className="text-left text-[10px] font-bold uppercase tracking-wider text-muted-foreground/60 px-2 py-2">
                      P
                    </th>
                    <th className="text-center text-[10px] font-bold uppercase tracking-wider text-muted-foreground/60 px-1 py-2">
                      AT
                      <InfoTooltip termKey="at" />
                    </th>
                    <th className="text-center text-[10px] font-bold uppercase tracking-wider text-muted-foreground/60 px-1 py-2">
                      BT
                      <InfoTooltip termKey="bt" />
                    </th>
                    <th className="text-center text-[10px] font-bold uppercase tracking-wider text-muted-foreground/60 px-1 py-2">
                      CT
                      <InfoTooltip termKey="ct" />
                    </th>
                    <th className="text-center text-[10px] font-bold uppercase tracking-wider text-muted-foreground/60 px-1 py-2">
                      TAT
                      <InfoTooltip termKey="tat" />
                    </th>
                    <th className="text-center text-[10px] font-bold uppercase tracking-wider text-muted-foreground/60 px-1 py-2">
                      WT
                      <InfoTooltip termKey="wt" />
                    </th>
                    <th className="text-center text-[10px] font-bold uppercase tracking-wider text-muted-foreground/60 px-1 py-2">
                      State
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {simulation.processResults.map((proc) => {
                    const state =
                      processStates.get(proc.id) ?? "not_arrived";
                    const revealed = proc.completionTime <= currentTime;
                    return (
                      <tr
                        key={proc.id}
                        className={cn(
                          "border-t border-border/30 transition-colors duration-300",
                          state === "running" && "bg-teal-500/5"
                        )}
                      >
                        <td className="px-2 py-2">
                          <div className="flex items-center gap-1.5">
                            <div
                              className="w-4 h-4 rounded-full flex items-center justify-center text-white text-[8px] font-bold"
                              style={{ backgroundColor: proc.color }}
                            >
                              {proc.pid.replace("P", "")}
                            </div>
                            <span className="text-[11px] font-medium">
                              {proc.pid}
                            </span>
                          </div>
                        </td>
                        <td className="text-center text-[11px] font-mono text-muted-foreground px-1 py-2">
                          {proc.arrivalTime}
                        </td>
                        <td className="text-center text-[11px] font-mono text-muted-foreground px-1 py-2">
                          {proc.burstTime}
                        </td>
                        <td className="text-center text-[11px] font-mono px-1 py-2">
                          <span
                            className={
                              revealed
                                ? "text-foreground font-semibold"
                                : "text-muted-foreground/30"
                            }
                          >
                            {revealed ? proc.completionTime : "—"}
                          </span>
                        </td>
                        <td className="text-center text-[11px] font-mono px-1 py-2">
                          <span
                            className={
                              revealed
                                ? "text-foreground font-semibold"
                                : "text-muted-foreground/30"
                            }
                          >
                            {revealed ? proc.turnaroundTime : "—"}
                          </span>
                        </td>
                        <td className="text-center text-[11px] font-mono px-1 py-2">
                          <span
                            className={
                              revealed
                                ? "text-foreground font-semibold"
                                : "text-muted-foreground/30"
                            }
                          >
                            {revealed ? proc.waitingTime : "—"}
                          </span>
                        </td>
                        <td className="text-center px-1 py-2">
                          <StateBadge state={state} />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* ─── LIVE METRICS ─── */}
          {liveMetrics && (
            <div className="mt-5">
              <h2 className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground/70 mb-3">
                Live Metrics
              </h2>
              <div className="grid grid-cols-2 gap-2">
                <div className="rounded-lg border border-border/40 bg-card/30 p-2.5">
                  <div className="text-[9px] text-muted-foreground/60 font-medium uppercase tracking-wider">
                    Completed
                  </div>
                  <div className="text-lg font-bold text-foreground">
                    {liveMetrics.completed}
                    <span className="text-xs text-muted-foreground/50 font-normal">
                      {" "}
                      / {liveMetrics.total}
                    </span>
                  </div>
                </div>
                <div className="rounded-lg border border-border/40 bg-card/30 p-2.5">
                  <div className="text-[9px] text-muted-foreground/60 font-medium uppercase tracking-wider flex items-center">
                    Avg WT
                    <InfoTooltip termKey="wt" />
                  </div>
                  <div className="text-lg font-bold text-foreground">
                    {liveMetrics.avgWT}
                    <span className="text-xs text-muted-foreground/50 font-normal">
                      {" "}
                      ms
                    </span>
                  </div>
                </div>
                <div className="rounded-lg border border-border/40 bg-card/30 p-2.5">
                  <div className="text-[9px] text-muted-foreground/60 font-medium uppercase tracking-wider flex items-center">
                    Avg TAT
                    <InfoTooltip termKey="tat" />
                  </div>
                  <div className="text-lg font-bold text-foreground">
                    {liveMetrics.avgTAT}
                    <span className="text-xs text-muted-foreground/50 font-normal">
                      {" "}
                      ms
                    </span>
                  </div>
                </div>
                <div className="rounded-lg border border-border/40 bg-card/30 p-2.5">
                  <div className="text-[9px] text-muted-foreground/60 font-medium uppercase tracking-wider flex items-center">
                    CPU Util
                    <InfoTooltip termKey="cpuUtil" />
                  </div>
                  <div className="text-lg font-bold text-foreground">
                    {liveMetrics.cpuUtil}
                    <span className="text-xs text-muted-foreground/50 font-normal">
                      %
                    </span>
                  </div>
                </div>
                <div className="col-span-2 rounded-lg border border-border/40 bg-card/30 p-2.5">
                  <div className="text-[9px] text-muted-foreground/60 font-medium uppercase tracking-wider flex items-center">
                    Throughput
                    <InfoTooltip termKey="throughput" />
                  </div>
                  <div className="text-lg font-bold text-foreground">
                    {liveMetrics.throughput}
                    <span className="text-xs text-muted-foreground/50 font-normal">
                      {" "}
                      proc/ms
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ─── CONVOY EFFECT WARNING ─── */}
          {simulation?.convoyEffect.detected && isComplete && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-4 p-3 rounded-xl border border-amber-500/30 bg-amber-500/5"
            >
              <p className="text-xs font-bold text-amber-500 flex items-center gap-1.5">
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                  <line x1="12" y1="9" x2="12" y2="13" />
                  <line x1="12" y1="17" x2="12.01" y2="17" />
                </svg>
                Convoy Effect Detected
              </p>
              <p className="text-[11px] text-muted-foreground mt-1.5 leading-relaxed">
                {simulation.convoyEffect.message}
              </p>
            </motion.div>
          )}
        </aside>

        {/* ──── RIGHT PANEL ──── */}
        <main className="overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          {isEditMode ? (
            /* ─── PRE-SIMULATION EXPLANATION ─── */
            <div className="flex flex-col items-center justify-center h-full max-w-md mx-auto text-center p-8">
              <div className="w-16 h-16 rounded-2xl bg-teal-500/10 flex items-center justify-center mb-6">
                <svg
                  width="32"
                  height="32"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#14B8A6"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <rect x="4" y="4" width="16" height="16" rx="2" />
                  <rect x="9" y="9" width="6" height="6" />
                  <path d="M15 2v2M15 20v2M2 15h2M2 9h2M20 15h2M20 9h2M9 2v2M9 20v2" />
                </svg>
              </div>

              <h2 className="text-xl font-bold text-foreground mb-2">
                FCFS — First Come, First Served
              </h2>
              <p className="text-sm text-muted-foreground mb-6">
                The simplest CPU scheduling algorithm.
              </p>

              <div className="text-left space-y-3 w-full">
                <div className="flex items-start gap-3">
                  <span className="text-teal-500 mt-0.5 shrink-0">•</span>
                  <p className="text-xs text-muted-foreground">
                    Processes are served in order of arrival time
                  </p>
                </div>
                <div className="flex items-start gap-3">
                  <span className="text-teal-500 mt-0.5 shrink-0">•</span>
                  <p className="text-xs text-muted-foreground">
                    Non-preemptive: once started, a process runs to completion
                  </p>
                </div>
                <div className="flex items-start gap-3">
                  <span className="text-teal-500 mt-0.5 shrink-0">•</span>
                  <p className="text-xs text-muted-foreground font-mono">
                    CT = StartTime + BT &nbsp;•&nbsp; TAT = CT − AT &nbsp;•&nbsp; WT
                    = TAT − BT
                  </p>
                </div>
                <div className="flex items-start gap-3">
                  <span className="text-amber-500 mt-0.5 shrink-0">⚠</span>
                  <p className="text-xs text-muted-foreground">
                    Drawback: <strong>Convoy Effect</strong> — long processes
                    delay all shorter processes behind them
                  </p>
                </div>
              </div>

              <div className="mt-10 text-xs text-muted-foreground/40">
                Configure processes in the table, then click{" "}
                <strong className="text-teal-500">Run Simulation</strong>
              </div>
            </div>
          ) : (
            /* ─── POST-SIMULATION CONTENT ─── */
            <div className="p-6 max-w-3xl mx-auto">
              {/* View toggle */}
              <div className="flex items-center gap-1 mb-5 p-0.5 rounded-lg border border-border/50 w-fit">
                <button
                  onClick={() => setViewMode("gantt")}
                  className={cn(
                    "px-3 py-1.5 rounded-md text-[11px] font-medium transition-all",
                    viewMode === "gantt"
                      ? "bg-teal-500/15 text-teal-500 shadow-sm"
                      : "text-muted-foreground/50 hover:text-foreground"
                  )}
                >
                  📊 Gantt Chart
                </button>
                <button
                  onClick={() => setViewMode("visualization")}
                  className={cn(
                    "px-3 py-1.5 rounded-md text-[11px] font-medium transition-all",
                    viewMode === "visualization"
                      ? "bg-teal-500/15 text-teal-500 shadow-sm"
                      : "text-muted-foreground/50 hover:text-foreground"
                  )}
                >
                  🔄 Visualization
                </button>
              </div>

              {/* ─── GANTT CHART VIEW ─── */}
              {viewMode === "gantt" && simulation && (
                <div className="mb-6">
                  <h3 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/50 mb-3">
                    Gantt Chart
                  </h3>

                  {/* The bar */}
                  <div className="relative flex h-14 rounded-xl overflow-hidden border border-border/50">
                    {simulation.ganttBlocks.map((block) => {
                      const widthPct =
                        ((block.endTime - block.startTime) /
                          simulation.totalTime) *
                        100;
                      const isActive =
                        block.startTime <= currentTime &&
                        block.endTime > currentTime;
                      const isPast = block.endTime <= currentTime;
                      const isFuture = block.startTime > currentTime;

                      return (
                        <div
                          key={`${block.startTime}-${block.endTime}`}
                          className={cn(
                            "flex items-center justify-center text-xs font-bold border-r border-white/10 last:border-r-0 transition-all duration-300 relative",
                            isFuture && "opacity-25"
                          )}
                          style={{
                            width: `${widthPct}%`,
                            ...(block.type === "process"
                              ? {
                                  backgroundColor: isActive
                                    ? block.color
                                    : isPast
                                      ? `${block.color}B0`
                                      : `${block.color}33`,
                                }
                              : {
                                  background: `repeating-linear-gradient(-45deg, transparent, transparent 3px, ${isActive || isPast ? "rgba(128,128,128,0.2)" : "rgba(128,128,128,0.08)"} 3px, ${isActive || isPast ? "rgba(128,128,128,0.2)" : "rgba(128,128,128,0.08)"} 6px)`,
                                }),
                          }}
                        >
                          {/* Active glow */}
                          {isActive && block.type === "process" && (
                            <motion.div
                              className="absolute inset-0 rounded-none"
                              animate={{ opacity: [0.3, 0.6, 0.3] }}
                              transition={{
                                duration: 1.5,
                                repeat: Infinity,
                                ease: "easeInOut",
                              }}
                              style={{
                                boxShadow: `inset 0 0 20px ${block.color}40`,
                              }}
                            />
                          )}
                          <span
                            className={cn(
                              "relative z-10 drop-shadow-sm",
                              block.type === "process"
                                ? "text-white"
                                : "text-muted-foreground/40 text-[10px]"
                            )}
                          >
                            {block.type === "process" ? block.pid : "IDLE"}
                          </span>
                        </div>
                      );
                    })}

                    {/* Current time vertical line */}
                    <motion.div
                      className="absolute top-0 bottom-0 w-0.5 bg-teal-400 z-20"
                      style={{
                        boxShadow: "0 0 8px rgba(20,184,166,0.6)",
                      }}
                      initial={false}
                      animate={{
                        left: `${(currentTime / simulation.totalTime) * 100}%`,
                      }}
                      transition={{
                        type: "spring",
                        stiffness: 300,
                        damping: 30,
                      }}
                    />
                  </div>

                  {/* Time labels at block boundaries */}
                  <div className="relative h-5 mt-1.5">
                    {ganttTimeBoundaries.map((t) => (
                      <button
                        key={t}
                        onClick={() => {
                          setCurrentTime(t);
                          setIsPlaying(false);
                        }}
                        className={cn(
                          "absolute text-[10px] font-mono -translate-x-1/2 transition-colors hover:text-teal-500 cursor-pointer",
                          t === currentTime
                            ? "text-teal-500 font-bold"
                            : "text-muted-foreground/40"
                        )}
                        style={{
                          left: `${(t / simulation.totalTime) * 100}%`,
                        }}
                      >
                        {t}
                      </button>
                    ))}
                  </div>

                  {/* ▲ Marker */}
                  <div className="relative h-4">
                    <motion.span
                      className="absolute text-teal-500 text-[10px] font-bold -translate-x-1/2"
                      initial={false}
                      animate={{
                        left: `${(currentTime / simulation.totalTime) * 100}%`,
                      }}
                      transition={{
                        type: "spring",
                        stiffness: 300,
                        damping: 30,
                      }}
                    >
                      ▲
                    </motion.span>
                  </div>

                  {/* Timeline scrubber slider */}
                  <div className="mt-2">
                    <input
                      type="range"
                      min={0}
                      max={simulation.totalTime}
                      value={currentTime}
                      onChange={(e) => {
                        setCurrentTime(parseInt(e.target.value));
                        setIsPlaying(false);
                      }}
                      className="w-full h-1.5 bg-muted/40 rounded-full appearance-none cursor-pointer accent-teal-500 [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-teal-500 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:shadow-lg"
                    />
                  </div>
                </div>
              )}

              {/* ─── VISUALIZATION VIEW ─── */}
              {viewMode === "visualization" && simulation && (
                <div className="space-y-3 mb-6">
                  {/* Ready Queue */}
                  <div className="rounded-xl border border-blue-500/30 bg-blue-500/5 p-4">
                    <h3 className="text-[10px] font-bold uppercase tracking-widest text-blue-400 mb-3">
                      📋 Ready Queue
                    </h3>
                    <div className="flex gap-2 min-h-[40px] items-center flex-wrap">
                      <AnimatePresence mode="popLayout">
                        {readyProcesses.length === 0 ? (
                          <motion.p
                            key="empty"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="text-xs text-muted-foreground/40 italic"
                          >
                            Empty
                          </motion.p>
                        ) : (
                          readyProcesses.map((proc) => (
                            <motion.div
                              key={`viz-ready-${proc.id}`}
                              layoutId={`viz-proc-${proc.id}`}
                              initial={{ opacity: 0, scale: 0.8 }}
                              animate={{ opacity: 1, scale: 1 }}
                              exit={{ opacity: 0, scale: 0.8 }}
                              className="flex items-center gap-2 px-3 py-1.5 rounded-lg border"
                              style={{
                                borderColor: `${proc.color}40`,
                                backgroundColor: `${proc.color}10`,
                              }}
                            >
                              <div
                                className="w-5 h-5 rounded-full flex items-center justify-center text-white text-[9px] font-bold"
                                style={{ backgroundColor: proc.color }}
                              >
                                {proc.pid.replace("P", "")}
                              </div>
                              <span className="text-xs font-medium">
                                {proc.pid}
                              </span>
                              <span className="text-[9px] px-1.5 py-0.5 rounded bg-blue-500/15 text-blue-500 font-bold">
                                READY
                              </span>
                            </motion.div>
                          ))
                        )}
                      </AnimatePresence>
                    </div>
                  </div>

                  {/* Arrow down */}
                  <div className="flex justify-center text-muted-foreground/20">
                    <svg
                      width="16"
                      height="28"
                      viewBox="0 0 16 28"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <path d="M8 0v22M3 18l5 6 5-6" />
                    </svg>
                  </div>

                  {/* CPU Block */}
                  <div
                    className={cn(
                      "rounded-xl border-2 p-5 transition-colors duration-500 min-h-[120px]",
                      runningProcess
                        ? "border-teal-500/60 bg-teal-500/5"
                        : isCurrentlyIdle
                          ? "border-amber-500/30 bg-amber-500/5"
                          : "border-border/60 bg-card/20"
                    )}
                  >
                    <div className="flex items-center gap-2 mb-3">
                      <div
                        className={cn(
                          "flex h-7 w-7 items-center justify-center rounded-lg text-xs font-bold",
                          runningProcess
                            ? "bg-teal-500/20 text-teal-500"
                            : "bg-muted/50 text-muted-foreground"
                        )}
                      >
                        <svg
                          width="14"
                          height="14"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <rect
                            x="4"
                            y="4"
                            width="16"
                            height="16"
                            rx="2"
                          />
                          <rect x="9" y="9" width="6" height="6" />
                          <path d="M15 2v2M15 20v2M2 15h2M2 9h2M20 15h2M20 9h2M9 2v2M9 20v2" />
                        </svg>
                      </div>
                      <span
                        className={cn(
                          "text-xs font-bold uppercase tracking-widest",
                          runningProcess
                            ? "text-teal-500"
                            : "text-muted-foreground/50"
                        )}
                      >
                        CPU
                      </span>
                      <span
                        className={cn(
                          "text-[9px] px-2 py-0.5 rounded-full font-mono font-bold",
                          runningProcess
                            ? "bg-teal-500/15 text-teal-500"
                            : isCurrentlyIdle
                              ? "bg-amber-500/15 text-amber-500"
                              : "bg-muted/50 text-muted-foreground/40"
                        )}
                      >
                        {runningProcess
                          ? "BUSY"
                          : isCurrentlyIdle
                            ? "IDLE"
                            : "—"}
                      </span>
                    </div>

                    <AnimatePresence mode="wait">
                      {runningProcess ? (
                        <motion.div
                          key={runningProcess.id}
                          initial={{ opacity: 0, y: 8 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -8 }}
                          transition={{ duration: 0.2 }}
                        >
                          <div className="flex items-center gap-3 mb-3">
                            <div
                              className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold shadow-lg"
                              style={{
                                backgroundColor: runningProcess.color,
                              }}
                            >
                              {runningProcess.pid.replace("P", "")}
                            </div>
                            <div>
                              <p className="text-sm font-bold text-foreground">
                                {runningProcess.pid}
                              </p>
                              <p className="text-[10px] text-muted-foreground">
                                Burst: {runningProcess.burstTime}ms
                              </p>
                            </div>
                          </div>

                          {/* Progress bar */}
                          <div className="space-y-1.5">
                            <div className="h-3 rounded-full bg-muted/40 overflow-hidden">
                              <motion.div
                                className="h-full rounded-full"
                                style={{
                                  backgroundColor: runningProcess.color,
                                }}
                                initial={false}
                                animate={{
                                  width: `${cpuProgress.pct}%`,
                                }}
                                transition={{ duration: 0.3 }}
                              />
                            </div>
                            <div className="flex justify-between text-[10px] font-mono text-muted-foreground/60">
                              <span>
                                Elapsed: {cpuProgress.elapsed}ms
                              </span>
                              <span>
                                Remaining: {cpuProgress.remaining}ms
                              </span>
                            </div>
                          </div>
                        </motion.div>
                      ) : isCurrentlyIdle ? (
                        <motion.div
                          key="idle"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          className="text-center py-2"
                        >
                          <p className="text-xs text-amber-500/70 italic">
                            No process in Ready Queue
                          </p>
                          <p className="text-[10px] text-muted-foreground/40 mt-1">
                            CPU waiting for next arrival...
                          </p>
                        </motion.div>
                      ) : (
                        <motion.p
                          key="none"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          className="text-xs text-muted-foreground/30 italic text-center py-2"
                        >
                          Waiting for process...
                        </motion.p>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* Arrow down */}
                  <div className="flex justify-center text-muted-foreground/20">
                    <svg
                      width="16"
                      height="28"
                      viewBox="0 0 16 28"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <path d="M8 0v22M3 18l5 6 5-6" />
                    </svg>
                  </div>

                  {/* Terminated */}
                  <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-4">
                    <h3 className="text-[10px] font-bold uppercase tracking-widest text-emerald-400 mb-3">
                      🏁 Terminated
                    </h3>
                    <div className="flex gap-2 flex-wrap min-h-[40px] items-center">
                      <AnimatePresence mode="popLayout">
                        {terminatedProcesses.length === 0 ? (
                          <motion.p
                            key="empty"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="text-xs text-muted-foreground/40 italic"
                          >
                            No completed processes
                          </motion.p>
                        ) : (
                          terminatedProcesses.map((proc) => (
                            <motion.div
                              key={`viz-term-${proc.id}`}
                              layoutId={`viz-proc-${proc.id}`}
                              initial={{ opacity: 0, scale: 0.8 }}
                              animate={{ opacity: 1, scale: 1 }}
                              className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-emerald-500/20 bg-emerald-500/5"
                            >
                              <div
                                className="w-5 h-5 rounded-full flex items-center justify-center text-white text-[9px] font-bold opacity-60"
                                style={{ backgroundColor: proc.color }}
                              >
                                {proc.pid.replace("P", "")}
                              </div>
                              <span className="text-xs font-medium text-muted-foreground">
                                {proc.pid}
                              </span>
                              <span className="text-[10px] text-emerald-500">
                                ✓
                              </span>
                            </motion.div>
                          ))
                        )}
                      </AnimatePresence>
                    </div>
                  </div>

                  {/* Timeline position (for visualization view too) */}
                  <div className="mt-4 flex items-center justify-center gap-3 text-xs">
                    <span className="text-muted-foreground/50 font-mono">
                      t = {currentTime}
                    </span>
                    <input
                      type="range"
                      min={0}
                      max={simulation.totalTime}
                      value={currentTime}
                      onChange={(e) => {
                        setCurrentTime(parseInt(e.target.value));
                        setIsPlaying(false);
                      }}
                      className="flex-1 max-w-xs h-1.5 bg-muted/40 rounded-full appearance-none cursor-pointer accent-teal-500 [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-teal-500 [&::-webkit-slider-thumb]:appearance-none"
                    />
                    <span className="text-muted-foreground/50 font-mono">
                      {simulation.totalTime}
                    </span>
                  </div>
                </div>
              )}

              {/* ─── DECISION LOG ─── */}
              <div className="mb-6">
                <h3 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/50 mb-3">
                  Decision Log
                </h3>
                <div
                  ref={logRef}
                  className="bg-slate-950 rounded-xl p-4 font-mono text-xs max-h-[250px] overflow-y-auto [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-thumb]:bg-slate-700 [&::-webkit-scrollbar-thumb]:rounded"
                >
                  {visibleEvents.length === 0 ? (
                    <p className="text-slate-600 italic">
                      Waiting for events...
                    </p>
                  ) : (
                    visibleEvents.map((event, i) => (
                      <div
                        key={`${event.time}-${event.type}-${event.processId ?? i}`}
                        className={cn(
                          "py-1 border-b border-slate-800/50 last:border-b-0 flex gap-2",
                          event.type === "convoy_warning"
                            ? "text-amber-400"
                            : event.type === "complete"
                              ? "text-emerald-400"
                              : event.type === "sim_end"
                                ? "text-teal-400"
                                : event.type === "idle_start"
                                  ? "text-slate-500"
                                  : "text-gray-300"
                        )}
                      >
                        <span className="text-slate-500 shrink-0 w-8 text-right">
                          t={event.time}
                        </span>
                        <span>{event.message}</span>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* ─── SUMMARY CARD (at simulation end) ─── */}
              {isComplete && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="rounded-xl border-2 border-teal-500/30 bg-teal-500/5 p-6"
                >
                  <h3 className="text-sm font-bold text-teal-500 mb-4 flex items-center gap-2">
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                      <polyline points="22 4 12 14.01 9 11.01" />
                    </svg>
                    Simulation Complete
                  </h3>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    <div>
                      <div className="text-[9px] text-muted-foreground/60 uppercase tracking-wider">
                        Avg Waiting Time
                      </div>
                      <div className="text-lg font-bold text-foreground">
                        {simulation.metrics.avgWaitingTime}
                        <span className="text-xs text-muted-foreground/50 font-normal">
                          ms
                        </span>
                      </div>
                    </div>
                    <div>
                      <div className="text-[9px] text-muted-foreground/60 uppercase tracking-wider">
                        Avg TAT
                      </div>
                      <div className="text-lg font-bold text-foreground">
                        {simulation.metrics.avgTurnaroundTime}
                        <span className="text-xs text-muted-foreground/50 font-normal">
                          ms
                        </span>
                      </div>
                    </div>
                    <div>
                      <div className="text-[9px] text-muted-foreground/60 uppercase tracking-wider">
                        CPU Utilization
                      </div>
                      <div className="text-lg font-bold text-foreground">
                        {simulation.metrics.cpuUtilization}
                        <span className="text-xs text-muted-foreground/50 font-normal">
                          %
                        </span>
                      </div>
                    </div>
                    <div>
                      <div className="text-[9px] text-muted-foreground/60 uppercase tracking-wider">
                        Throughput
                      </div>
                      <div className="text-lg font-bold text-foreground">
                        {simulation.metrics.throughput}
                        <span className="text-xs text-muted-foreground/50 font-normal">
                          /ms
                        </span>
                      </div>
                    </div>
                  </div>

                  {simulation.convoyEffect.detected && (
                    <div className="mt-4 p-3 rounded-lg bg-amber-500/10 border border-amber-500/30">
                      <p className="text-xs text-amber-500 font-bold">
                        ⚠ Convoy Effect Detected
                      </p>
                      <p className="text-[11px] text-muted-foreground mt-1">
                        {simulation.convoyEffect.message}
                      </p>
                    </div>
                  )}
                </motion.div>
              )}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
