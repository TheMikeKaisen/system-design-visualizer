"use client";

import { useOSSimulationStore } from "@/store/useOSSimulationStore";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Logo } from "@/components/ui/Logo";
import Link from "next/link";
import { useEffect, useState, useMemo, useRef } from "react";
import { motion, AnimatePresence, LayoutGroup } from "framer-motion";
import { cn } from "@/lib/utils";
import { CPU_SCHEDULING_SCENARIO, createCpuSchedulingScenario } from "@/lib/os-simulator/cpu-scheduling-scenario";

import { ZoneContainer } from "@/components/os-simulator/ZoneContainer";
import { CPUBlock } from "@/components/os-simulator/CPUBlock";
import { SchedulerBadge } from "@/components/os-simulator/SchedulerBadge";
import { OSStatsSidebar } from "@/components/os-simulator/OSStatsSidebar";
import { OSExplanationPanel } from "@/components/os-simulator/OSExplanationPanel";
import { OSToast } from "@/components/os-simulator/OSToast";
import { InterruptOverlay } from "@/components/os-simulator/InterruptOverlay";

export default function OSCpuSchedulingSimulator() {
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
    setScenario,
    jumpToChapter,
    setSchedulingMode,
    setPlaybackSpeed,
    getCurrentChapter,
  } = useOSSimulationStore();

  // Initialize with CPU scheduling scenario on mount
  useEffect(() => {
    if (scenario.id !== CPU_SCHEDULING_SCENARIO.id) {
      setScenario(CPU_SCHEDULING_SCENARIO);
    }
  }, [scenario.id, setScenario]);

  // Auto-play
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isPlaying) {
      timer = setTimeout(nextStep, 2000 / playbackSpeed);
    }
    return () => clearTimeout(timer);
  }, [isPlaying, currentStepIndex, nextStep, playbackSpeed]);

  // Toast
  const [activeToast, setActiveToast] = useState<string | null>(null);
  useEffect(() => {
    const step = scenario.steps[currentStepIndex];
    if (step?.toastMessage) {
      setActiveToast(step.toastMessage);
      const t = setTimeout(() => setActiveToast(null), 2500);
      return () => clearTimeout(t);
    }
  }, [currentStepIndex, scenario.steps]);

  // Context switch counter — derived deterministically up to current step
  const contextSwitchCount = useMemo(() => {
    let count = 0;
    let prevProcess: string | null = null;
    for (let i = 0; i <= currentStepIndex; i++) {
      const current = scenario.steps[i]?.cpu.currentProcess;
      if (prevProcess !== null && current !== prevProcess) {
        count++;
      }
      prevProcess = current ?? null;
    }
    return count;
  }, [currentStepIndex, scenario.steps]);

  // Rebuild scenario when scheduling mode toggles
  const handleSchedulingModeToggle = (mode: "non_preemptive" | "preemptive") => {
    setSchedulingMode(mode);
  };

  const step = scenario.steps[currentStepIndex] || CPU_SCHEDULING_SCENARIO.steps[0];
  const progress = ((currentStepIndex + 1) / scenario.steps.length) * 100;
  const currentChapter = getCurrentChapter();

  const chapterStep = currentChapter
    ? currentStepIndex - currentChapter.startStep + 1
    : currentStepIndex + 1;
  const chapterTotal = currentChapter
    ? currentChapter.endStep - currentChapter.startStep + 1
    : scenario.steps.length;

  // Resolve processes
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

  return (
    <div className="h-[100dvh] bg-background flex flex-col overflow-hidden">

      {/* ──────────── NAVBAR ──────────── */}
      <nav className="h-14 border-b border-border/50 bg-background/80 backdrop-blur-md flex-shrink-0 z-30">
        <div className="h-full px-4 flex items-center gap-3">
          <Link href="/operating-systems" className="flex items-center gap-2 group shrink-0">
            <Logo size={22} />
            <span className="hidden sm:inline text-sm font-semibold tracking-tight text-foreground group-hover:text-teal-500 transition-colors">
              Back to OS
            </span>
          </Link>

          <div className="h-4 w-px bg-border/50 hidden sm:block" />

          <h1 className="text-sm font-medium text-muted-foreground hidden sm:block truncate">
            {scenario.title}
          </h1>

          {/* Center: Playback + chapter */}
          <div className="flex-1 flex justify-center items-center gap-1 sm:gap-2">
            <div className="hidden lg:flex items-center gap-1 mr-3">
              {scenario.chapters.map((ch, i) => (
                <button
                  key={ch.title}
                  onClick={() => jumpToChapter(i)}
                  className={cn(
                    "px-2.5 py-1 rounded-lg text-[11px] font-medium transition-colors",
                    currentChapter?.title === ch.title
                      ? "bg-teal-500/15 text-teal-500"
                      : "text-muted-foreground/50 hover:text-foreground hover:bg-muted"
                  )}
                >
                  {ch.title}
                </button>
              ))}
            </div>

            <button onClick={reset} className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors" title="Restart">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
                <polyline points="3 3 3 8 8 8" />
              </svg>
            </button>
            <button onClick={prevStep} disabled={currentStepIndex === 0} className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors disabled:opacity-40">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="19 20 9 12 19 4 19 20" />
                <line x1="5" y1="19" x2="5" y2="5" />
              </svg>
            </button>
            <button onClick={togglePlay} className="w-8 h-8 flex items-center justify-center rounded-full bg-teal-500 text-white hover:bg-teal-600 hover:scale-105 transition-all shadow-sm">
              {isPlaying ? (
                <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16" /><rect x="14" y="4" width="4" height="16" /></svg>
              ) : (
                <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" className="ml-0.5"><polygon points="5 3 19 12 5 21 5 3" /></svg>
              )}
            </button>
            <button onClick={nextStep} disabled={currentStepIndex === scenario.steps.length - 1} className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors disabled:opacity-40">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="5 4 15 12 5 20 5 4" />
                <line x1="19" y1="5" x2="19" y2="19" />
              </svg>
            </button>

            <span className="hidden sm:block text-[10px] font-mono text-muted-foreground/50 ml-2 whitespace-nowrap">
              {currentStepIndex + 1}/{scenario.steps.length}
            </span>

            <div className="hidden md:flex items-center gap-1 ml-2">
              {[0.5, 1, 2].map((speed) => (
                <button key={speed} onClick={() => setPlaybackSpeed(speed)}
                  className={cn("px-1.5 py-0.5 rounded text-[10px] font-mono transition-colors",
                    playbackSpeed === speed ? "bg-teal-500/15 text-teal-500 font-bold" : "text-muted-foreground/40 hover:text-foreground"
                  )}>
                  {speed}x
                </button>
              ))}
            </div>
          </div>

          {/* Right: Scheduling toggle + theme */}
          <div className="flex items-center gap-2 shrink-0">
            <div className="hidden sm:flex items-center gap-1 rounded-lg border border-border/50 p-0.5">
              <button
                onClick={() => handleSchedulingModeToggle("non_preemptive")}
                className={cn(
                  "px-2.5 py-1 rounded text-[10px] font-medium transition-all",
                  schedulingMode === "non_preemptive"
                    ? "bg-teal-500/15 text-teal-500 shadow-sm"
                    : "text-muted-foreground/50 hover:text-foreground"
                )}
              >
                FCFS
              </button>
              <button
                onClick={() => handleSchedulingModeToggle("preemptive")}
                className={cn(
                  "px-2.5 py-1 rounded text-[10px] font-medium transition-all",
                  schedulingMode === "preemptive"
                    ? "bg-teal-500/15 text-teal-500 shadow-sm"
                    : "text-muted-foreground/50 hover:text-foreground"
                )}
              >
                Round Robin
              </button>
            </div>
            <ThemeToggle />
          </div>
        </div>

        {/* Progress bar */}
        <div className="h-[2px] bg-muted/30 -mt-[2px]">
          <motion.div className="h-full bg-teal-500/70" initial={false} animate={{ width: `${progress}%` }} transition={{ duration: 0.3 }} />
        </div>
      </nav>

      {/* ──────────── 3-PANEL BODY ──────────── */}
      <div className="flex-1 flex overflow-hidden">

        {/* LEFT SIDEBAR */}
        <aside className="hidden lg:flex w-64 flex-col border-r border-border/40 bg-background/40 p-3 overflow-y-auto flex-shrink-0">
          <OSStatsSidebar
            cpu={step.cpu}
            memory={step.memory}
            processes={step.processes}
            contextSwitchCount={contextSwitchCount}
          />
        </aside>

        {/* CENTER STAGE */}
        <main className="flex-1 relative overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          <InterruptOverlay interrupt={step.activeInterrupt} />

          <div className="px-6 py-5 max-w-2xl mx-auto">
            <LayoutGroup>
              <ZoneContainer title="New" accentClass="text-slate-400" processes={newProcesses} icon="📥" />
              <SchedulerBadge label="Long-Term Scheduler" event={step.activeScheduler?.type === "long_term" ? step.activeScheduler : undefined} />
              <ZoneContainer title="Ready Queue" accentClass="text-blue-400" processes={readyProcesses} icon="📋" />
              <SchedulerBadge label="Short-Term Scheduler (Dispatcher)" event={step.activeScheduler?.type === "short_term" ? step.activeScheduler : undefined} />
              <CPUBlock cpu={step.cpu} process={cpuProcess} />
              <div className="mt-4 grid grid-cols-2 gap-4">
                <div className="flex flex-col">
                  <SchedulerBadge label="I/O Request" event={undefined} direction="down" />
                  <ZoneContainer title="Waiting" accentClass="text-amber-400" processes={waitProcesses} showDevices icon="⏳" />
                </div>
                <div className="flex flex-col">
                  <SchedulerBadge label="Exit" event={undefined} direction="down" />
                  <ZoneContainer title="Terminated" accentClass="text-rose-400" processes={terminatedProcesses} isTerminated icon="🏁" />
                </div>
              </div>
            </LayoutGroup>
          </div>
        </main>

        {/* RIGHT SIDEBAR */}
        <aside className="hidden xl:flex w-80 flex-col border-l border-border/40 bg-background/40 overflow-hidden flex-shrink-0">
          <OSExplanationPanel
            explanation={step.explanation}
            chapter={currentChapter ?? undefined}
            stepIndex={currentStepIndex}
            chapterStep={chapterStep}
            chapterTotal={chapterTotal}
            logEntries={step.logEntries}
            activeToast={activeToast}
          />
        </aside>
      </div>

      {/* MOBILE: explanation fallback */}
      <div className="xl:hidden border-t border-border/40 bg-card/30 px-4 py-3 flex-shrink-0">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStepIndex}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.2 }}
          >
            {currentChapter && (
              <span className="block text-[10px] font-bold uppercase tracking-widest text-teal-500/70 mb-1">
                {currentChapter.title}
              </span>
            )}
            <p className="text-sm text-muted-foreground leading-relaxed max-w-3xl">
              {step.explanation}
            </p>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* MOBILE TOAST (Floating fallback) */}
      <div className="xl:hidden">
        <OSToast message={activeToast} />
      </div>
    </div>
  );
}
