"use client";

import { useOSSimulationStore } from "@/store/useOSSimulationStore";
import { OSKernelShell } from "@/components/os-simulator/OSKernelShell";
import { useEffect, useState, useMemo } from "react";
import { LayoutGroup } from "framer-motion";
import { cn } from "@/lib/utils";
import { createCpuSchedulingScenario } from "@/lib/os-simulator/cpu-scheduling-scenario";
import type { OSStepState, SchedulingMode } from "@/lib/os-simulator/engine";

import { ZoneContainer } from "@/components/os-simulator/ZoneContainer";
import { CPUBlock } from "@/components/os-simulator/CPUBlock";
import { SchedulerBadge } from "@/components/os-simulator/SchedulerBadge";
import { OSStatsSidebar } from "@/components/os-simulator/OSStatsSidebar";
import { OSExplanationPanel } from "@/components/os-simulator/OSExplanationPanel";
import { OSToast } from "@/components/os-simulator/OSToast";
import { InterruptOverlay } from "@/components/os-simulator/InterruptOverlay";

const FALLBACK_STEP: OSStepState = {
  processes: {},
  newQueue: [],
  readyQueue: [],
  waitQueue: [],
  suspendedQueue: [],
  terminatedList: [],
  cpu: { currentProcess: null, mode: "idle", utilizationPct: 0 },
  memory: { totalMB: 8192, usedMB: 0, usedPct: 0 },
  explanation: "Initializing CPU scheduling simulation...",
  chapter: "Initialization",
  logEntries: [],
};

export default function CPUSchedulingDeepDiveSimulator() {
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
    setSchedulingMode,
    setPlaybackSpeed,
    getCurrentChapter,
  } = useOSSimulationStore();

  // Fresh-start navigation & unmount pause (Decision Record 002)
  useEffect(() => {
    return () => {
      useOSSimulationStore.getState().pause();
    };
  }, []);

  // Initialize with Episode 2 scenario on mount if needed
  useEffect(() => {
    if (scenario.id !== "cpu-scheduling") {
      setScenario(createCpuSchedulingScenario("non_preemptive"));
    }
  }, [scenario.id, setScenario]);

  // Auto-play timer
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isPlaying) {
      timer = setTimeout(nextStep, 2000 / playbackSpeed);
    }
    return () => clearTimeout(timer);
  }, [isPlaying, currentStepIndex, nextStep, playbackSpeed]);

  // Defensive step bounds clamp (Decision Record 001)
  const safeIndex =
    scenario.steps.length > 0
      ? Math.max(0, Math.min(currentStepIndex, scenario.steps.length - 1))
      : 0;
  const step = scenario.steps[safeIndex] ?? FALLBACK_STEP;

  // Toast (Pure derived state without synchronous setState in effect body)
  const [dismissedStep, setDismissedStep] = useState<number | null>(null);
  const activeToast =
    dismissedStep !== safeIndex && step.toastMessage ? step.toastMessage : null;

  useEffect(() => {
    if (step.toastMessage) {
      const t = setTimeout(() => setDismissedStep(safeIndex), 2500);
      return () => clearTimeout(t);
    }
  }, [safeIndex, step.toastMessage]);

  // Context switch counter — derived deterministically up to current step
  const contextSwitchCount = useMemo(() => {
    let count = 0;
    let prevProcess: string | null = null;
    for (let i = 0; i <= safeIndex; i++) {
      const current = scenario.steps[i]?.cpu.currentProcess;
      if (prevProcess !== null && current !== prevProcess) {
        count++;
      }
      prevProcess = current ?? null;
    }
    return count;
  }, [safeIndex, scenario.steps]);

  const currentChapter = getCurrentChapter();

  // Chapter-relative step index
  const chapterStep = currentChapter
    ? safeIndex - currentChapter.startStep + 1
    : safeIndex + 1;
  const chapterTotal = currentChapter
    ? currentChapter.endStep - currentChapter.startStep + 1
    : scenario.steps.length;

  // Resolve processes defensively
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

  const handleModeChange = (mode: SchedulingMode) => {
    setSchedulingMode(mode);
  };

  const modeSwitcher = (
    <div className="flex items-center p-0.5 rounded-lg bg-muted/60 border border-border/50">
      <button
        type="button"
        onClick={() => handleModeChange("non_preemptive")}
        className={cn(
          "px-2 sm:px-2.5 py-1 rounded-md text-[11px] font-semibold transition-all",
          schedulingMode === "non_preemptive"
            ? "bg-sky-500 text-white shadow-sm"
            : "text-muted-foreground hover:text-foreground"
        )}
      >
        Non-Preemptive (FCFS)
      </button>
      <button
        type="button"
        onClick={() => handleModeChange("preemptive")}
        className={cn(
          "px-2 sm:px-2.5 py-1 rounded-md text-[11px] font-semibold transition-all",
          schedulingMode === "preemptive"
            ? "bg-sky-500 text-white shadow-sm"
            : "text-muted-foreground hover:text-foreground"
        )}
      >
        Preemptive (RR)
      </button>
    </div>
  );

  return (
    <OSKernelShell
      title="CPU Scheduling Deep-Dive"
      currentStepIndex={safeIndex}
      totalSteps={scenario.steps.length}
      isPlaying={isPlaying}
      playbackSpeed={playbackSpeed}
      onPlayPause={togglePlay}
      onNext={nextStep}
      onPrev={prevStep}
      onReset={reset}
      onSpeedChange={setPlaybackSpeed}
      headerExtra={modeSwitcher}
    >

      {/* ──────────── 3-PANEL BODY ──────────── */}
      <div className="flex-1 flex overflow-hidden">
        {/* ── LEFT SIDEBAR: Stats ── */}
        <aside className="hidden lg:flex w-64 flex-col border-r border-border/40 bg-background/40 p-3 overflow-y-auto flex-shrink-0">
          <OSStatsSidebar
            cpu={step.cpu}
            memory={step.memory}
            processes={step.processes}
            contextSwitchCount={contextSwitchCount}
          />
        </aside>

        {/* ── CENTER STAGE ── */}
        <main className="flex-1 relative overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          {/* Interrupt overlay */}
          <InterruptOverlay interrupt={step.activeInterrupt} />

          <div className="px-6 py-5 max-w-2xl mx-auto">
            <LayoutGroup>
              {/* READY QUEUE */}
              <ZoneContainer
                title="Ready Queue"
                accentClass="text-sky-400"
                processes={readyProcesses}
                icon="📋"
              />

              {/* Short-Term Scheduler (Dispatcher) */}
              <SchedulerBadge
                label="Short-Term Scheduler (Dispatcher)"
                event={
                  step.activeScheduler?.type === "short_term"
                    ? step.activeScheduler
                    : undefined
                }
              />

              {/* CPU */}
              <CPUBlock cpu={step.cpu} process={cpuProcess} />

              {/* Waiting + Terminated */}
              <div className="mt-4 grid grid-cols-2 gap-4">
                <div className="flex flex-col">
                  <SchedulerBadge
                    label="I/O Request / Preemption"
                    event={undefined}
                    direction="down"
                  />
                  <ZoneContainer
                    title="Waiting / Suspended"
                    accentClass="text-amber-400"
                    processes={waitProcesses}
                    showDevices
                    icon="⏳"
                  />
                </div>
                <div className="flex flex-col">
                  <SchedulerBadge label="Exit / Done" event={undefined} direction="down" />
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
        </main>

        {/* ── RIGHT SIDEBAR: Explanation + Log ── */}
        <aside className="hidden xl:flex w-80 flex-col border-l border-border/40 bg-background/40 overflow-hidden flex-shrink-0">
          <OSExplanationPanel
            explanation={step.explanation}
            chapter={currentChapter ?? undefined}
            stepIndex={safeIndex}
            chapterStep={chapterStep}
            chapterTotal={chapterTotal}
            logEntries={step.logEntries}
            activeToast={activeToast}
          />
        </aside>
      </div>

      {/* ── MOBILE: Explanation below stage ── */}
      <div className="xl:hidden flex-shrink-0 border-t border-border/40 bg-card/60 backdrop-blur-sm p-3 max-h-36 overflow-y-auto">
        <p className="text-xs text-foreground/90 leading-relaxed font-sans">
          {step.explanation}
        </p>
      </div>

      {/* ── FLOATING TOAST ── */}
      <OSToast message={activeToast} />
    </OSKernelShell>
  );
}
