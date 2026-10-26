"use client";

import { useOSSimulationStore } from "@/store/useOSSimulationStore";
import { OSKernelShell } from "@/components/os-simulator/OSKernelShell";
import { useEffect, useState, useMemo } from "react";
import { motion, AnimatePresence, LayoutGroup } from "framer-motion";
import { PROCESS_STATES_SCENARIO } from "@/lib/os-simulator/process-states-scenario";
import type { OSStepState } from "@/lib/os-simulator/engine";

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
  explanation: "Initializing simulation...",
  chapter: "Initialization",
  logEntries: [],
};

export default function OSProcessStatesSimulator() {
  const {
    scenario,
    currentStepIndex,
    isPlaying,
    playbackSpeed,
    nextStep,
    prevStep,
    reset,
    togglePlay,
    setScenario,
    jumpToChapter,
    setPlaybackSpeed,
    getCurrentChapter,
  } = useOSSimulationStore();

  // Fresh-start navigation & unmount pause (Decision Record 002)
  useEffect(() => {
    return () => {
      useOSSimulationStore.getState().pause();
    };
  }, []);

  // Initialize with process states scenario on mount
  useEffect(() => {
    if (scenario.id !== PROCESS_STATES_SCENARIO.id) {
      setScenario(PROCESS_STATES_SCENARIO);
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
    ? currentStepIndex - currentChapter.startStep + 1
    : currentStepIndex + 1;
  const chapterTotal = currentChapter
    ? currentChapter.endStep - currentChapter.startStep + 1
    : scenario.steps.length;

  const currentChapterIndex = currentChapter
    ? scenario.chapters.findIndex((c) => c.title === currentChapter.title)
    : 0;

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
    <OSKernelShell
      title={scenario.title}
      currentStepIndex={currentStepIndex}
      totalSteps={scenario.steps.length}
      isPlaying={isPlaying}
      playbackSpeed={playbackSpeed}
      onPlayPause={togglePlay}
      onNext={nextStep}
      onPrev={prevStep}
      onReset={reset}
      onSpeedChange={setPlaybackSpeed}
      chapters={scenario.chapters}
      currentChapterIndex={currentChapterIndex}
      onChapterSelect={jumpToChapter}
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
          {/* Interrupt overlay — full width of center stage */}
          <InterruptOverlay interrupt={step.activeInterrupt} />

          <div className="px-6 py-5 max-w-2xl mx-auto">
            <LayoutGroup>
              {/* NEW QUEUE */}
              <ZoneContainer
                title="New"
                accentClass="text-slate-400"
                processes={newProcesses}
                icon="📥"
              />

              {/* Long-Term Scheduler */}
              <SchedulerBadge
                label="Long-Term Scheduler"
                event={step.activeScheduler?.type === "long_term" ? step.activeScheduler : undefined}
              />

              {/* READY QUEUE */}
              <ZoneContainer
                title="Ready Queue"
                accentClass="text-blue-400"
                processes={readyProcesses}
                icon="📋"
              />

              {/* Short-Term Scheduler */}
              <SchedulerBadge
                label="Short-Term Scheduler (Dispatcher)"
                event={step.activeScheduler?.type === "short_term" ? step.activeScheduler : undefined}
              />

              {/* CPU */}
              <CPUBlock cpu={step.cpu} process={cpuProcess} />

              {/* Waiting + Terminated */}
              <div className="mt-4 grid grid-cols-2 gap-4">
                <div className="flex flex-col">
                  <SchedulerBadge label="I/O Request" event={undefined} direction="down" />
                  <ZoneContainer
                    title="Waiting"
                    accentClass="text-amber-400"
                    processes={waitProcesses}
                    showDevices
                    icon="⏳"
                  />
                </div>
                <div className="flex flex-col">
                  <SchedulerBadge label="Exit" event={undefined} direction="down" />
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
            stepIndex={currentStepIndex}
            chapterStep={chapterStep}
            chapterTotal={chapterTotal}
            logEntries={step.logEntries}
            activeToast={activeToast}
          />
        </aside>
      </div>

      {/* ── MOBILE: Explanation below stage ── */}
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
              <span className="block text-[10px] font-bold uppercase tracking-widest text-sky-500/80 mb-1">
                {currentChapter.title}
              </span>
            )}
            <p className="text-sm text-muted-foreground leading-relaxed max-w-3xl">
              {step.explanation}
            </p>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* ── TOAST (Floating fallback for mobile) ── */}
      <div className="xl:hidden">
        <OSToast message={activeToast} />
      </div>
    </OSKernelShell>
  );
}
