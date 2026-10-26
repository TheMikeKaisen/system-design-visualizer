"use client";

import { useMemo, useState, useEffect } from "react";
import { PCB_SCENARIO } from "@/lib/os-simulator/pcb-scenario";
import type { OSStepState } from "@/lib/os-simulator/engine";
import { OSKernelShell } from "@/components/os-simulator/OSKernelShell";
import { OSExplanationPanel } from "@/components/os-simulator/OSExplanationPanel";
import { OSStatsSidebar } from "@/components/os-simulator/OSStatsSidebar";
import { ZoneContainer } from "@/components/os-simulator/ZoneContainer";
import { CPUBlock } from "@/components/os-simulator/CPUBlock";
import { InterruptOverlay } from "@/components/os-simulator/InterruptOverlay";
import { PCBViewer } from "@/components/os-simulator/PCBViewer";
import { AnimatePresence, motion } from "framer-motion";

const FALLBACK_PCB_STEP: OSStepState = {
  processes: {},
  newQueue: [],
  readyQueue: [],
  waitQueue: [],
  suspendedQueue: [],
  terminatedList: [],
  cpu: { currentProcess: null, mode: "idle", utilizationPct: 0 },
  memory: { totalMB: 8192, usedMB: 0, usedPct: 0 },
  explanation: "Initializing PCB simulation...",
  chapter: "Initialization",
  logEntries: [],
};

export default function ProcessControlBlockSimulator() {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);

  // Defensive step bounds clamp (Decision Record 001)
  const safeIndex =
    PCB_SCENARIO.steps.length > 0
      ? Math.max(0, Math.min(currentStepIndex, PCB_SCENARIO.steps.length - 1))
      : 0;
  const step = PCB_SCENARIO.steps[safeIndex] ?? FALLBACK_PCB_STEP;

  // Auto-play timer with React 19 state-in-effect protection
  useEffect(() => {
    if (!isPlaying) return;

    if (safeIndex >= PCB_SCENARIO.steps.length - 1) {
      const timeout = setTimeout(() => setIsPlaying(false), 0);
      return () => clearTimeout(timeout);
    }

    const interval = setInterval(() => {
      setCurrentStepIndex((prev) => {
        if (prev >= PCB_SCENARIO.steps.length - 1) {
          setIsPlaying(false);
          return prev;
        }
        return prev + 1;
      });
    }, 1500 / playbackSpeed);

    return () => clearInterval(interval);
  }, [isPlaying, safeIndex, playbackSpeed]);

  // Derive chapter metadata
  const currentChapter = useMemo(() => {
    return PCB_SCENARIO.chapters.find(
      (ch) => safeIndex >= ch.startStep && safeIndex <= ch.endStep
    );
  }, [safeIndex]);

  const currentChapterIndex = currentChapter
    ? PCB_SCENARIO.chapters.findIndex((c) => c.title === currentChapter.title)
    : 0;

  const chapterStep = currentChapter
    ? safeIndex - currentChapter.startStep + 1
    : safeIndex + 1;
  const chapterTotal = currentChapter
    ? currentChapter.endStep - currentChapter.startStep + 1
    : PCB_SCENARIO.steps.length;

  // Context Switch Count
  const contextSwitches = useMemo(() => {
    let switches = 0;
    for (let i = 1; i <= safeIndex; i++) {
      const prevStep = PCB_SCENARIO.steps[i - 1];
      const currStep = PCB_SCENARIO.steps[i];
      if (
        currStep?.cpu.currentProcess &&
        currStep.cpu.currentProcess !== prevStep?.cpu.currentProcess
      ) {
        switches++;
      }
    }
    return switches;
  }, [safeIndex]);

  const activeProcess = step.cpu.currentProcess
    ? step.processes[step.cpu.currentProcess] ?? null
    : null;

  return (
    <OSKernelShell
      title={PCB_SCENARIO.title}
      currentStepIndex={safeIndex}
      totalSteps={PCB_SCENARIO.steps.length}
      isPlaying={isPlaying}
      playbackSpeed={playbackSpeed}
      onPlayPause={() => setIsPlaying((p) => !p)}
      onNext={() => setCurrentStepIndex((prev) => Math.min(PCB_SCENARIO.steps.length - 1, prev + 1))}
      onPrev={() => setCurrentStepIndex((prev) => Math.max(0, prev - 1))}
      onReset={() => {
        setIsPlaying(false);
        setCurrentStepIndex(0);
      }}
      onSpeedChange={setPlaybackSpeed}
      chapters={PCB_SCENARIO.chapters}
      currentChapterIndex={currentChapterIndex}
      onChapterSelect={(idx) => {
        const targetChapter = PCB_SCENARIO.chapters[idx];
        if (targetChapter) {
          setIsPlaying(false);
          setCurrentStepIndex(targetChapter.startStep);
        }
      }}
    >
      {/* ──────────── BODY ──────────── */}
      <div className="flex flex-1 overflow-hidden">
        {/* ── LEFT SIDEBAR (Stats) ── */}
        <aside className="hidden lg:flex w-64 flex-col border-r border-border/40 bg-background/40 p-3 overflow-y-auto flex-shrink-0">
          <OSStatsSidebar
            cpu={step.cpu}
            memory={step.memory}
            processes={step.processes}
            contextSwitchCount={contextSwitches}
          />
        </aside>

        {/* ── CENTER STAGE ── */}
        <main className="flex-1 relative overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          <InterruptOverlay interrupt={step.activeInterrupt} />

          <div className="px-6 py-5 max-w-4xl mx-auto flex gap-6">
            {/* Queues & CPU Column */}
            <div className="flex-1 flex flex-col gap-6">
              {/* Ready Queue */}
              <ZoneContainer
                title="Ready Queue"
                processes={step.readyQueue.map((id) => step.processes[id]).filter(Boolean)}
                accentClass="text-sky-500 dark:text-sky-400"
                icon="🏃"
              />

              {/* CPU Block */}
              <div className="relative">
                <div className="absolute left-1/2 -top-6 h-6 w-px bg-border/50 border-l border-dashed -translate-x-1/2" />
                <CPUBlock cpu={step.cpu} process={activeProcess} />

                {/* CPU Internal State Overlay (for this specific episode) */}
                {step.cpu.programCounter && (
                  <motion.div
                    layoutId="cpu-internals"
                    className="absolute -right-4 -bottom-4 bg-sky-950/80 border border-sky-500/50 p-3 rounded-xl backdrop-blur-md shadow-lg z-10"
                  >
                    <h4 className="text-[10px] uppercase text-sky-400 font-bold mb-1">
                      CPU Hardware Regs
                    </h4>
                    <div className="text-xs font-mono text-sky-100">
                      <div>PC: {step.cpu.programCounter}</div>
                      {step.cpu.registers && (
                        <div>
                          EAX: {step.cpu.registers.eax} <br />
                          EBX: {step.cpu.registers.ebx} <br />
                          ECX: {step.cpu.registers.ecx}
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </div>
            </div>

            {/* PCBs Column (Kernel Memory) */}
            <div className="w-[300px] flex flex-col gap-4 relative">
              <h3 className="text-xs font-bold uppercase tracking-widest text-sky-500 dark:text-sky-400 mb-2 flex items-center gap-2">
                <span>🧠</span> Kernel Memory (PCBs)
              </h3>
              <AnimatePresence mode="popLayout">
                {Object.values(step.processes).map((proc) => (
                  <motion.div
                    key={`pcb-${proc.id}`}
                    layout
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                  >
                    <PCBViewer process={proc} />
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </div>
        </main>

        {/* ── RIGHT SIDEBAR (Explanation & Logs) ── */}
        <aside className="w-[340px] shrink-0 border-l bg-card/30 flex flex-col relative z-20">
          <OSExplanationPanel
            explanation={step.explanation}
            chapter={currentChapter ?? undefined}
            stepIndex={currentStepIndex}
            chapterStep={chapterStep}
            chapterTotal={chapterTotal}
            logEntries={step.logEntries ?? []}
            activeToast={step.toastMessage}
          />
        </aside>
      </div>
    </OSKernelShell>
  );
}
