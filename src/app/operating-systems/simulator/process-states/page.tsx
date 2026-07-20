"use client";

import { useOSSimulationStore } from "@/store/useOSSimulationStore";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Logo } from "@/components/ui/Logo";
import Link from "next/link";
import { useEffect, useState, useMemo } from "react";
import { motion, AnimatePresence, LayoutGroup } from "framer-motion";
import { cn } from "@/lib/utils";
import { PROCESS_STATES_SCENARIO } from "@/lib/os-simulator/process-states-scenario";

import { ProcessCard } from "@/components/os-simulator/ProcessCard";
import { ZoneContainer } from "@/components/os-simulator/ZoneContainer";
import { CPUBlock } from "@/components/os-simulator/CPUBlock";
import { SchedulerBadge } from "@/components/os-simulator/SchedulerBadge";
import { MemoryGauge } from "@/components/os-simulator/MemoryGauge";
import { OSLogPanel } from "@/components/os-simulator/OSLogPanel";
import { InterruptOverlay } from "@/components/os-simulator/InterruptOverlay";

export default function OSProcessStatesSimulator() {
  const {
    scenario,
    currentStepIndex,
    isPlaying,
    playbackSpeed,
    schedulingMode,
    nextStep,
    prevStep,
    reset,
    togglePlay,
    setStep,
    setScenario,
    jumpToChapter,
    setSchedulingMode,
    setPlaybackSpeed,
    getCurrentChapter,
  } = useOSSimulationStore();

  // Initialize with process states scenario on mount
  useEffect(() => {
    if (scenario.id !== PROCESS_STATES_SCENARIO.id) {
      setScenario(PROCESS_STATES_SCENARIO);
    }
  }, [scenario.id, setScenario]);

  // Auto-play effect
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isPlaying) {
      const delay = 2000 / playbackSpeed;
      timer = setTimeout(() => {
        nextStep();
      }, delay);
    }
    return () => clearTimeout(timer);
  }, [isPlaying, currentStepIndex, nextStep, playbackSpeed]);

  // Toast effect
  const [activeToast, setActiveToast] = useState<string | null>(null);
  useEffect(() => {
    const step = scenario.steps[currentStepIndex];
    if (step?.toastMessage) {
      setActiveToast(step.toastMessage);
      const t = setTimeout(() => setActiveToast(null), 2500);
      return () => clearTimeout(t);
    }
  }, [currentStepIndex, scenario.steps]);

  const step = scenario.steps[currentStepIndex];
  const progress = ((currentStepIndex + 1) / scenario.steps.length) * 100;
  const currentChapter = getCurrentChapter();

  // Resolve processes from IDs for each zone
  const newProcesses = useMemo(
    () => step.newQueue.map((id) => step.processes[id]).filter(Boolean),
    [step.newQueue, step.processes]
  );
  const readyProcesses = useMemo(
    () => step.readyQueue.map((id) => step.processes[id]).filter(Boolean),
    [step.readyQueue, step.processes]
  );
  const waitProcesses = useMemo(
    () => step.waitQueue.map((e) => step.processes[e.processId]).filter(Boolean),
    [step.waitQueue, step.processes]
  );
  const terminatedProcesses = useMemo(
    () => step.terminatedList.map((id) => step.processes[id]).filter(Boolean),
    [step.terminatedList, step.processes]
  );
  const cpuProcess = step.cpu.currentProcess
    ? step.processes[step.cpu.currentProcess] ?? null
    : null;

  // Check if we're in Chapter 2 (for scheduling toggle)
  const isInChapter2 = currentChapter?.title === "Scheduling Algorithms";

  return (
    <div className="h-[100dvh] bg-background flex flex-col overflow-hidden">
      {/* ──────────── NAVIGATION ──────────── */}
      <nav className="h-14 border-b border-border/50 bg-background/80 backdrop-blur-md flex-shrink-0 z-30">
        <div className="h-full px-4 flex items-center gap-3">
          {/* Left: Back link */}
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
            {scenario.title}
          </h1>

          {/* Center: Playback controls */}
          <div className="flex-1 flex justify-center items-center gap-1 sm:gap-2">
            {/* Chapter buttons */}
            <div className="hidden lg:flex items-center gap-1 mr-3">
              {scenario.chapters.map((ch, i) => (
                <button
                  key={ch.title}
                  onClick={() => jumpToChapter(i)}
                  className={cn(
                    "px-2 py-1 rounded text-[10px] font-medium transition-colors",
                    currentChapter?.title === ch.title
                      ? "bg-teal-500/15 text-teal-500"
                      : "text-muted-foreground/50 hover:text-foreground hover:bg-muted"
                  )}
                >
                  {ch.title}
                </button>
              ))}
            </div>

            {/* Controls */}
            <button
              onClick={reset}
              className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors"
              title="Restart"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
                <polyline points="3 3 3 8 8 8" />
              </svg>
            </button>
            <button
              onClick={prevStep}
              disabled={currentStepIndex === 0}
              className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors disabled:opacity-40"
              title="Previous Step"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="19 20 9 12 19 4 19 20" />
                <line x1="5" y1="19" x2="5" y2="5" />
              </svg>
            </button>
            <button
              onClick={togglePlay}
              className="w-8 h-8 flex items-center justify-center rounded-full bg-teal-500 text-white hover:bg-teal-600 hover:scale-105 transition-all shadow-sm"
              title={isPlaying ? "Pause" : "Play"}
            >
              {isPlaying ? (
                <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                  <rect x="6" y="4" width="4" height="16" />
                  <rect x="14" y="4" width="4" height="16" />
                </svg>
              ) : (
                <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" className="ml-0.5">
                  <polygon points="5 3 19 12 5 21 5 3" />
                </svg>
              )}
            </button>
            <button
              onClick={nextStep}
              disabled={currentStepIndex === scenario.steps.length - 1}
              className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors disabled:opacity-40"
              title="Next Step"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="5 4 15 12 5 20 5 4" />
                <line x1="19" y1="5" x2="19" y2="19" />
              </svg>
            </button>

            {/* Step counter */}
            <span className="hidden sm:block text-[10px] font-mono text-muted-foreground/60 ml-2 whitespace-nowrap">
              {currentStepIndex + 1}/{scenario.steps.length}
            </span>

            {/* Speed control */}
            <div className="hidden md:flex items-center gap-1 ml-2">
              {[0.5, 1, 2].map((speed) => (
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
            </div>
          </div>

          {/* Right: Theme toggle + scheduling toggle */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Scheduling mode toggle — only in Chapter 2 */}
            <AnimatePresence>
              {isInChapter2 && (
                <motion.div
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10 }}
                  className="hidden sm:flex items-center gap-1 rounded-lg border border-border/50 p-0.5"
                >
                  <button
                    onClick={() => setSchedulingMode("non_preemptive")}
                    className={cn(
                      "px-2 py-1 rounded text-[10px] font-medium transition-all",
                      schedulingMode === "non_preemptive"
                        ? "bg-teal-500/15 text-teal-500 shadow-sm"
                        : "text-muted-foreground/50 hover:text-foreground"
                    )}
                  >
                    Non-Preemptive
                  </button>
                  <button
                    onClick={() => setSchedulingMode("preemptive")}
                    className={cn(
                      "px-2 py-1 rounded text-[10px] font-medium transition-all",
                      schedulingMode === "preemptive"
                        ? "bg-teal-500/15 text-teal-500 shadow-sm"
                        : "text-muted-foreground/50 hover:text-foreground"
                    )}
                  >
                    Preemptive (RR)
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
            <ThemeToggle />
          </div>
        </div>

        {/* Progress bar */}
        <div className="h-[2px] bg-muted/30 -mt-[2px]">
          <motion.div
            className="h-full bg-teal-500/70"
            initial={false}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>
      </nav>

      {/* ──────────── MAIN CONTENT ──────────── */}
      <div className="flex-1 flex overflow-hidden">
        {/* ── LEFT SIDEBAR (desktop only) ── */}
        <aside className="hidden lg:flex w-72 flex-col gap-3 border-r border-border/40 bg-background/50 p-3 overflow-y-auto">
          <MemoryGauge memory={step.memory} />
          <OSLogPanel entries={step.logEntries} />
        </aside>

        {/* ── MAIN STAGE ── */}
        <main className="flex-1 flex flex-col overflow-hidden">
          {/* Stage area */}
          <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-4">
            <div className="mx-auto max-w-md relative">
              {/* Interrupt overlay */}
              <InterruptOverlay interrupt={step.activeInterrupt} />

              <LayoutGroup>
                {/* ── NEW QUEUE ── */}
                <ZoneContainer
                  title="New"
                  accentClass="text-slate-400"
                  processes={newProcesses}
                  icon="📥"
                />

                {/* Long-Term Scheduler */}
                <SchedulerBadge
                  label="Long-Term Scheduler"
                  event={
                    step.activeScheduler?.type === "long_term"
                      ? step.activeScheduler
                      : undefined
                  }
                />

                {/* ── READY QUEUE ── */}
                <ZoneContainer
                  title="Ready Queue"
                  accentClass="text-blue-400"
                  processes={readyProcesses}
                  icon="📋"
                />

                {/* Short-Term Scheduler */}
                <SchedulerBadge
                  label="Short-Term Scheduler (Dispatcher)"
                  event={
                    step.activeScheduler?.type === "short_term"
                      ? step.activeScheduler
                      : undefined
                  }
                />

                {/* ── CPU ── */}
                <CPUBlock cpu={step.cpu} process={cpuProcess} />

                {/* Split: Waiting + Terminated */}
                <div className="mt-3 grid grid-cols-2 gap-3">
                  <div className="flex flex-col">
                    <SchedulerBadge
                      label="I/O Request"
                      event={undefined}
                      direction="down"
                    />
                    <ZoneContainer
                      title="Waiting"
                      accentClass="text-amber-400"
                      processes={waitProcesses}
                      showDevices
                      icon="⏳"
                    />
                  </div>
                  <div className="flex flex-col">
                    <SchedulerBadge
                      label="Exit"
                      event={undefined}
                      direction="down"
                    />
                    <ZoneContainer
                      title="Terminated"
                      accentClass="text-rose-400"
                      processes={terminatedProcesses}
                      isTerminated
                      icon="🏁"
                    />
                  </div>
                </div>
              </LayoutGroup>
            </div>
          </div>

          {/* ── EXPLANATION BANNER ── */}
          <div className="border-t border-border/40 bg-card/50 backdrop-blur-sm px-4 sm:px-6 py-3 flex-shrink-0">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentStepIndex}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.2 }}
              >
                {currentChapter && (
                  <div className="mb-1">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-teal-500/70">
                      {currentChapter.title}
                    </span>
                  </div>
                )}
                <p className="text-sm text-muted-foreground leading-relaxed max-w-3xl">
                  {step.explanation}
                </p>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* ── MOBILE SIDEBAR (below explanation on small screens) ── */}
          <div className="lg:hidden border-t border-border/40 bg-background/50 px-4 py-3 overflow-y-auto max-h-48">
            <div className="space-y-3">
              <MemoryGauge memory={step.memory} />
              <OSLogPanel entries={step.logEntries} />
            </div>
          </div>
        </main>
      </div>

      {/* ──────────── TOAST ──────────── */}
      <AnimatePresence>
        {activeToast && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-lg bg-foreground text-background text-sm font-medium shadow-lg"
          >
            {activeToast}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
