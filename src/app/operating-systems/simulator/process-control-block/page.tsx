"use client";

import { useMemo, useState } from "react";
import { PCB_SCENARIO } from "@/lib/os-simulator/pcb-scenario";
import { OSExplanationPanel } from "@/components/os-simulator/OSExplanationPanel";
import { OSStatsSidebar } from "@/components/os-simulator/OSStatsSidebar";
import { ZoneContainer } from "@/components/os-simulator/ZoneContainer";
import { CPUBlock } from "@/components/os-simulator/CPUBlock";
import { InterruptOverlay } from "@/components/os-simulator/InterruptOverlay";
import { PCBViewer } from "@/components/os-simulator/PCBViewer";
import { AnimatePresence, motion } from "framer-motion";

export default function ProcessControlBlockSimulator() {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const step = PCB_SCENARIO.steps[currentStepIndex];

  // Derive chapter metadata
  const currentChapter = useMemo(() => {
    return PCB_SCENARIO.chapters.find(
      (ch) => currentStepIndex >= ch.startStep && currentStepIndex <= ch.endStep
    );
  }, [currentStepIndex]);

  const chapterStep = currentChapter
    ? currentStepIndex - currentChapter.startStep + 1
    : currentStepIndex + 1;
  const chapterTotal = currentChapter
    ? currentChapter.endStep - currentChapter.startStep + 1
    : PCB_SCENARIO.steps.length;

  // Context Switch Count
  const contextSwitches = useMemo(() => {
    let switches = 0;
    for (let i = 1; i <= currentStepIndex; i++) {
      const prevStep = PCB_SCENARIO.steps[i - 1];
      const currStep = PCB_SCENARIO.steps[i];
      if (
        currStep.cpu.currentProcess &&
        currStep.cpu.currentProcess !== prevStep.cpu.currentProcess
      ) {
        switches++;
      }
    }
    return switches;
  }, [currentStepIndex]);

  const activeProcess = step.cpu.currentProcess ? step.processes[step.cpu.currentProcess] : null;

  return (
    <div className="flex flex-col h-[100dvh] bg-background overflow-hidden selection:bg-teal-500/30">
      
      {/* ──────────── NAVBAR ──────────── */}
      <nav className="h-14 border-b border-border/50 bg-background/80 backdrop-blur-md flex-shrink-0 z-30">
        <div className="h-full px-4 flex items-center gap-3">
          <a href="/operating-systems" className="flex items-center gap-2 group shrink-0 text-sm font-semibold text-foreground hover:text-amber-500 transition-colors">
            Back to OS
          </a>

          <div className="h-4 w-px bg-border/50 hidden sm:block" />

          <h1 className="text-sm font-medium text-muted-foreground hidden sm:block truncate">
            {PCB_SCENARIO.title}
          </h1>

          <div className="flex-1 flex justify-center items-center gap-1 sm:gap-2">
            <button onClick={() => setCurrentStepIndex(0)} className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors" title="Restart">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
                <polyline points="3 3 3 8 8 8" />
              </svg>
            </button>
            <button onClick={() => setCurrentStepIndex(Math.max(0, currentStepIndex - 1))} disabled={currentStepIndex === 0} className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors disabled:opacity-40">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="19 20 9 12 19 4 19 20" />
                <line x1="5" y1="19" x2="5" y2="5" />
              </svg>
            </button>
            <button onClick={() => setCurrentStepIndex(Math.min(PCB_SCENARIO.steps.length - 1, currentStepIndex + 1))} disabled={currentStepIndex === PCB_SCENARIO.steps.length - 1} className="w-8 h-8 flex items-center justify-center rounded-full bg-amber-500 text-white hover:bg-amber-600 hover:scale-105 transition-all shadow-sm">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="5 4 15 12 5 20 5 4" />
                <line x1="19" y1="5" x2="19" y2="19" />
              </svg>
            </button>
            <span className="text-[10px] font-mono text-muted-foreground/50 ml-2 whitespace-nowrap">
              {currentStepIndex + 1}/{PCB_SCENARIO.steps.length}
            </span>
          </div>
        </div>
      </nav>

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
                processes={step.readyQueue.map((id) => step.processes[id])}
                accentClass="text-amber-500"
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
                    className="absolute -right-4 -bottom-4 bg-amber-950/80 border border-amber-500/50 p-3 rounded-xl backdrop-blur-md shadow-lg z-10"
                  >
                    <h4 className="text-[10px] uppercase text-amber-400 font-bold mb-1">CPU Hardware Regs</h4>
                    <div className="text-xs font-mono text-amber-100">
                      <div>PC: {step.cpu.programCounter}</div>
                      {step.cpu.registers && (
                        <div>
                          EAX: {step.cpu.registers.eax} <br/>
                          EBX: {step.cpu.registers.ebx} <br/>
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
              <h3 className="text-xs font-bold uppercase tracking-widest text-amber-500 mb-2 flex items-center gap-2">
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
    </div>
  );
}
