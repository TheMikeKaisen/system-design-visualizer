"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Logo } from "@/components/ui/Logo";
import { Play, Pause, SkipBack, SkipForward, RotateCcw, FileText, Cpu, Code, X, AlertTriangle } from "lucide-react";
import { 
  PRINTER_SPOOLER_SCENARIO_A, 
  PRINTER_SPOOLER_SCENARIO_B, 
  SpoolerScenario 
} from "@/lib/os-simulator/printer-spooler-scenario";

const PROCESS_A_CODE = ["LOAD Ra, IN", "WRITE slot[Ra], A", "STORE IN, Ra+1"];
const PROCESS_B_CODE = ["LOAD Rb, IN", "WRITE slot[Rb], B", "STORE IN, Rb+1"];

export default function PrinterSpoolerSimulator() {
  const [scenario, setScenario] = useState<SpoolerScenario>(PRINTER_SPOOLER_SCENARIO_A);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [activeCodeDialog, setActiveCodeDialog] = useState<'processA' | 'processB' | null>(null);

  const step = scenario.steps[currentStepIndex];

  // Auto-play
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isPlaying) {
      if (currentStepIndex < scenario.steps.length - 1) {
        timer = setTimeout(() => setCurrentStepIndex((i) => i + 1), 2500);
      } else {
        setIsPlaying(false);
      }
    }
    return () => clearTimeout(timer);
  }, [isPlaying, currentStepIndex, scenario]);

  const togglePlay = () => setIsPlaying(!isPlaying);
  const nextStep = () => setCurrentStepIndex((i) => Math.min(i + 1, scenario.steps.length - 1));
  const prevStep = () => setCurrentStepIndex((i) => Math.max(i - 1, 0));
  const reset = () => {
    setCurrentStepIndex(0);
    setIsPlaying(false);
  };
  
  const switchScenario = (s: SpoolerScenario) => {
    setScenario(s);
    setCurrentStepIndex(0);
    setIsPlaying(false);
  };

  const isCorrupted = step.corruptedSlot !== null;

  return (
    <div className="min-h-screen bg-background text-foreground overflow-hidden flex flex-col font-sans selection:bg-cyan-500/30">
      {/* Navigation */}
      <nav className="shrink-0 h-14 border-b border-border/40 bg-background/80 backdrop-blur-md flex items-center justify-between px-4 z-50">
        <div className="flex items-center gap-4">
          <Link href="/operating-systems" className="flex items-center justify-center w-8 h-8 rounded-full hover:bg-muted/80 transition-colors">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M15 18l-6-6 6-6"/></svg>
          </Link>
          <div className="flex items-center gap-2">
            <Logo size={20} />
            <span className="text-sm font-semibold tracking-tight text-foreground/80">Episode 6: Printer Spooler Problem</span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <ThemeToggle />
        </div>
      </nav>

      <main className="flex-1 flex overflow-hidden">
        {/* Left/Center Visualizer Area */}
        <div className="flex-1 flex flex-col relative">
          
          {/* Spooler Directory (Top) */}
          <div className="shrink-0 h-28 border-b border-border/40 bg-card/30 flex flex-col items-center justify-center relative">
            <div className="absolute top-2 left-4 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Spooler Directory</div>
            <div className="flex gap-2 p-3 bg-background/50 rounded-2xl border border-border/50 shadow-inner mt-4 relative">
              
              {/* Pointer Indicator */}
              <motion.div 
                className="absolute -top-6 w-10 flex flex-col items-center justify-center text-[10px] font-bold text-rose-500"
                animate={{ x: step.sharedIN * 60 }} // 60px is slot width (48) + gap (8) roughly + padding. We will position based on flex layout
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
                style={{ left: "16px" }} // Initial offset to align with first slot
              >
                <div className="bg-rose-500 text-white px-2 rounded-full shadow-lg border border-rose-600">IN={step.sharedIN}</div>
                <div className="w-0 h-0 border-l-[4px] border-l-transparent border-r-[4px] border-r-transparent border-t-[6px] border-t-rose-500 mt-1" />
              </motion.div>

              {step.spoolerSlots.map((slot, i) => (
                <div key={i} className={cn(
                  "w-14 h-16 rounded-xl flex flex-col items-center justify-center border transition-all duration-500 relative",
                  i === step.corruptedSlot ? "bg-rose-500/20 border-rose-500 text-rose-500 shadow-[0_0_20px_-3px_rgba(244,63,94,0.4)]" :
                  slot ? "bg-cyan-500/10 border-cyan-500/30 text-cyan-500" : "bg-muted/30 border-transparent border-dashed text-muted-foreground/30"
                )}>
                  <AnimatePresence mode="popLayout">
                    {slot && (
                      <motion.div
                        key={slot + i}
                        initial={{ scale: 0, opacity: 0, y: -20 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0, opacity: 0, y: 20 }}
                        transition={{ type: "spring", bounce: 0.5 }}
                        className="flex flex-col items-center"
                      >
                        <FileText className="w-6 h-6 mb-1" />
                        <span className="text-[9px] font-mono whitespace-nowrap overflow-hidden text-ellipsis max-w-[48px]">{slot}</span>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Corrupted Badge */}
                  {i === step.corruptedSlot && (
                    <motion.div 
                      initial={{ opacity: 0, scale: 0, y: 10 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      className="absolute -bottom-4 bg-rose-500 text-white text-[9px] font-bold px-1.5 rounded-sm shadow-md whitespace-nowrap z-10 flex items-center gap-1"
                    >
                      <AlertTriangle size={10} />
                      OVERWRITTEN
                    </motion.div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Main Stage (Split Screen) */}
          <div className="flex-1 relative flex overflow-hidden">
            
            {/* PROCESS A PANEL (Left) */}
            <div className={cn(
              "flex-1 border-r border-border/40 p-8 flex flex-col transition-opacity duration-500",
              step.processAState === "suspended" || step.processAState === "idle" ? "opacity-40" : "opacity-100"
            )}>
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-cyan-500/20 text-cyan-500 flex items-center justify-center">
                    <Cpu className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-xl font-bold text-cyan-500">Process A</h2>
                      <button onClick={() => setActiveCodeDialog('processA')} className="p-1 rounded hover:bg-cyan-500/20 text-cyan-500/70 hover:text-cyan-500 transition-colors group relative">
                        <Code size={16} />
                        <span className="absolute -top-8 left-1/2 -translate-x-1/2 bg-foreground text-background text-[10px] py-1 px-2 rounded opacity-0 group-hover:opacity-100 whitespace-nowrap pointer-events-none transition-opacity shadow-lg z-50">View C Code</span>
                      </button>
                    </div>
                    <div className="text-xs font-mono text-cyan-500/70 uppercase">Code: enqueue("photo.jpg")</div>
                  </div>
                </div>
                <div className={cn(
                  "px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest border",
                  step.processAState === "running" ? "bg-cyan-500/20 text-cyan-500 border-cyan-500/30 shadow-[0_0_15px_-3px_rgba(6,182,212,0.3)] animate-pulse" : "bg-muted text-muted-foreground border-transparent"
                )}>
                  {step.processAState}
                </div>
              </div>

              {/* Code Block */}
              <div className="bg-[#1E1E1E] rounded-xl border border-[#333] overflow-hidden shadow-2xl relative font-mono text-sm mb-8">
                <div className="h-8 bg-[#2D2D2D] border-b border-[#333] flex items-center px-4 gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-[#FF5F56]" />
                  <div className="w-2.5 h-2.5 rounded-full bg-[#FFBD2E]" />
                  <div className="w-2.5 h-2.5 rounded-full bg-[#27C93F]" />
                  <span className="ml-2 text-xs text-zinc-400">process_a.asm</span>
                </div>
                <div className="p-4 relative min-h-[120px]">
                  {PROCESS_A_CODE.map((line, i) => (
                    <div key={i} className={cn(
                      "flex items-center gap-4 py-1.5 px-2 rounded-md transition-colors",
                      step.processACodeLine === i ? "bg-cyan-500/20 text-cyan-400" : "text-zinc-500"
                    )}>
                      <span className="opacity-50 text-xs w-4">{i + 1}</span>
                      <span>{line}</span>
                      {step.processACodeLine === i && (
                        <motion.div layoutId="highlight-a" className="absolute left-0 w-1 h-6 bg-cyan-500 rounded-r-full" />
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Process A Register */}
              <div className="mt-auto grid grid-cols-2 gap-4">
                <div className="bg-card rounded-2xl border border-cyan-500/20 p-6 flex flex-col shadow-sm relative overflow-hidden group">
                  <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold uppercase tracking-widest text-cyan-500/70">Private Register</span>
                    <span className="text-[10px] font-mono text-muted-foreground bg-muted px-2 py-0.5 rounded-full">Ra</span>
                  </div>
                  <div className="text-4xl font-light tabular-nums tracking-tight mt-auto text-cyan-500">
                    <AnimatePresence mode="popLayout">
                      <motion.span
                        key={step.registerRa ?? "empty"}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="inline-block"
                      >
                        {step.registerRa ?? "—"}
                      </motion.span>
                    </AnimatePresence>
                  </div>
                </div>
                <div></div>
              </div>
            </div>

            {/* PROCESS B PANEL (Right) */}
            <div className={cn(
              "flex-1 p-8 flex flex-col transition-opacity duration-500",
              step.processBState === "suspended" || step.processBState === "idle" ? "opacity-40" : "opacity-100"
            )}>
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-orange-500/20 text-orange-500 flex items-center justify-center">
                    <Cpu className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-xl font-bold text-orange-500">Process B</h2>
                      <button onClick={() => setActiveCodeDialog('processB')} className="p-1 rounded hover:bg-orange-500/20 text-orange-500/70 hover:text-orange-500 transition-colors group relative">
                        <Code size={16} />
                        <span className="absolute -top-8 left-1/2 -translate-x-1/2 bg-foreground text-background text-[10px] py-1 px-2 rounded opacity-0 group-hover:opacity-100 whitespace-nowrap pointer-events-none transition-opacity shadow-lg z-50">View C Code</span>
                      </button>
                    </div>
                    <div className="text-xs font-mono text-orange-500/70 uppercase">Code: enqueue("report.pdf")</div>
                  </div>
                </div>
                <div className={cn(
                  "px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest border",
                  step.processBState === "running" ? "bg-orange-500/20 text-orange-500 border-orange-500/30 shadow-[0_0_15px_-3px_rgba(249,115,22,0.3)] animate-pulse" : "bg-muted text-muted-foreground border-transparent"
                )}>
                  {step.processBState}
                </div>
              </div>

              {/* Code Block */}
              <div className="bg-[#1E1E1E] rounded-xl border border-[#333] overflow-hidden shadow-2xl relative font-mono text-sm mb-8">
                <div className="h-8 bg-[#2D2D2D] border-b border-[#333] flex items-center px-4 gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-[#FF5F56]" />
                  <div className="w-2.5 h-2.5 rounded-full bg-[#FFBD2E]" />
                  <div className="w-2.5 h-2.5 rounded-full bg-[#27C93F]" />
                  <span className="ml-2 text-xs text-zinc-400">process_b.asm</span>
                </div>
                <div className="p-4 relative min-h-[120px]">
                  {PROCESS_B_CODE.map((line, i) => (
                    <div key={i} className={cn(
                      "flex items-center gap-4 py-1.5 px-2 rounded-md transition-colors",
                      step.processBCodeLine === i ? "bg-orange-500/20 text-orange-400" : "text-zinc-500"
                    )}>
                      <span className="opacity-50 text-xs w-4">{i + 1}</span>
                      <span>{line}</span>
                      {step.processBCodeLine === i && (
                        <motion.div layoutId="highlight-b" className="absolute left-0 w-1 h-6 bg-orange-500 rounded-r-full" />
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Process B Register */}
              <div className="mt-auto grid grid-cols-2 gap-4">
                <div></div>
                <div className="bg-card rounded-2xl border border-orange-500/20 p-6 flex flex-col shadow-sm relative overflow-hidden group">
                  <div className="absolute inset-0 bg-gradient-to-br from-orange-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold uppercase tracking-widest text-orange-500/70">Private Register</span>
                    <span className="text-[10px] font-mono text-muted-foreground bg-muted px-2 py-0.5 rounded-full">Rb</span>
                  </div>
                  <div className="text-4xl font-light tabular-nums tracking-tight mt-auto text-orange-500">
                    <AnimatePresence mode="popLayout">
                      <motion.span
                        key={step.registerRb ?? "empty"}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="inline-block"
                      >
                        {step.registerRb ?? "—"}
                      </motion.span>
                    </AnimatePresence>
                  </div>
                </div>
              </div>
            </div>

            {/* Context Switch Overlay */}
            <AnimatePresence>
              {step.isContextSwitch && (
                <motion.div
                  key="context-switch-overlay"
                  initial={{ opacity: 0, scale: 0.9, backdropFilter: "blur(0px)" }}
                  animate={{ opacity: 1, scale: 1, backdropFilter: "blur(4px)" }}
                  exit={{ opacity: 0, scale: 1.1, backdropFilter: "blur(0px)" }}
                  className="absolute inset-0 z-10 flex items-center justify-center pointer-events-none"
                >
                  <div className="bg-background/90 border border-border/50 shadow-2xl rounded-3xl p-8 flex flex-col items-center gap-4">
                    <div className="w-16 h-16 bg-rose-500/20 rounded-2xl flex items-center justify-center text-rose-500 animate-pulse">
                      <RotateCcw className="w-8 h-8" />
                    </div>
                    <div className="text-center">
                      <h3 className="text-2xl font-bold text-foreground">CONTEXT SWITCH</h3>
                      <p className="text-sm text-muted-foreground mt-1">OS preempts the CPU</p>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

          </div>

          {/* Explanation Footer Area */}
          <div className="shrink-0 h-40 border-t border-border/40 bg-card flex flex-col">
            <div className="flex-1 p-6 max-w-4xl mx-auto w-full flex flex-col justify-center relative">
              <div className="text-xs font-bold uppercase tracking-widest text-cyan-500 mb-2 flex items-center gap-2">
                <span>{step.chapter}</span>
                <span className="w-1 h-1 rounded-full bg-border" />
                <span className="text-muted-foreground">Step {currentStepIndex + 1} of {scenario.steps.length}</span>
                {isCorrupted && (
                  <>
                    <span className="w-1 h-1 rounded-full bg-border" />
                    <div className="text-[10px] font-bold uppercase tracking-wider bg-rose-500/20 text-rose-500 px-2 py-0.5 rounded-full border border-rose-500/20 animate-pulse flex items-center gap-1.5">
                      <AlertTriangle size={10} />
                      Silent Data Loss
                    </div>
                  </>
                )}
              </div>
              <motion.div
                key={currentStepIndex}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-lg md:text-xl text-foreground leading-relaxed"
              >
                {step.explanation}
              </motion.div>
            </div>
            {/* Timeline Progress */}
            <div className="h-1.5 w-full bg-muted flex relative group cursor-pointer">
              {scenario.steps.map((_, i) => (
                <div 
                  key={i} 
                  className={cn(
                    "h-full flex-1 transition-all duration-300 border-r border-background/20 last:border-0",
                    i <= currentStepIndex ? "bg-cyan-500" : "bg-transparent",
                    i === currentStepIndex && "bg-cyan-400 shadow-[0_0_10px_rgba(6,182,212,1)]"
                  )}
                  onClick={() => setCurrentStepIndex(i)}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Right Sidebar: Controls & Notes */}
        <div className="w-80 shrink-0 border-l border-border/40 bg-card/30 flex flex-col z-10">
          
          {/* Controls */}
          <div className="p-6 border-b border-border/40">
            <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-4">Simulation Controls</h3>
            
            <div className="flex flex-col gap-3">
              <div className="flex justify-center gap-2 mb-2">
                <button
                  onClick={prevStep}
                  disabled={currentStepIndex === 0}
                  className="w-10 h-10 rounded-full flex items-center justify-center bg-muted/50 hover:bg-muted text-foreground disabled:opacity-30 transition-colors"
                >
                  <SkipBack className="w-4 h-4" />
                </button>
                <button
                  onClick={togglePlay}
                  className="w-12 h-12 rounded-full flex items-center justify-center bg-cyan-500 hover:bg-cyan-400 text-white shadow-lg shadow-cyan-500/20 transition-all hover:scale-105 active:scale-95"
                >
                  {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-1" />}
                </button>
                <button
                  onClick={nextStep}
                  disabled={currentStepIndex === scenario.steps.length - 1}
                  className="w-10 h-10 rounded-full flex items-center justify-center bg-muted/50 hover:bg-muted text-foreground disabled:opacity-30 transition-colors"
                >
                  <SkipForward className="w-4 h-4" />
                </button>
                <button
                  onClick={reset}
                  className="w-10 h-10 rounded-full flex items-center justify-center bg-muted/50 hover:bg-muted text-foreground transition-colors ml-2"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
              </div>

              {/* Scenario Toggles */}
              <div className="bg-background rounded-xl p-1 flex border border-border">
                <button
                  onClick={() => switchScenario(PRINTER_SPOOLER_SCENARIO_A)}
                  className={cn(
                    "flex-1 py-1.5 text-[10px] font-bold uppercase tracking-widest rounded-lg transition-colors",
                    scenario.id === PRINTER_SPOOLER_SCENARIO_A.id ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  Scenario A
                </button>
                <button
                  onClick={() => switchScenario(PRINTER_SPOOLER_SCENARIO_B)}
                  className={cn(
                    "flex-1 py-1.5 text-[10px] font-bold uppercase tracking-widest rounded-lg transition-colors",
                    scenario.id === PRINTER_SPOOLER_SCENARIO_B.id ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  Scenario B
                </button>
              </div>
            </div>
          </div>

          {/* Student Notes Panel */}
          <div className="flex-1 p-6 overflow-y-auto">
            <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-6">Notes</h3>
            
            <AnimatePresence mode="popLayout">
              {step.noteTitle && (
                <motion.div
                  initial={{ opacity: 0, y: 20, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="bg-cyan-500/10 border border-cyan-500/20 rounded-2xl p-5 relative overflow-hidden"
                >
                  <div className="absolute top-0 right-0 p-3 opacity-10">
                    <FileText className="w-16 h-16" />
                  </div>
                  <h4 className="text-sm font-bold text-cyan-500 mb-2">{step.noteTitle}</h4>
                  <p className="text-sm text-muted-foreground leading-relaxed">{step.noteContent}</p>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Static context info */}
            {!step.noteTitle && (
              <div className="opacity-50 text-xs leading-relaxed space-y-4">
                <p>The Printer Spooler problem demonstrates the catastrophic effects of race conditions.</p>
                <p>Unlike simple counter corruption, overwritten spooler slots result in silent, permanent data loss for users.</p>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Toast Notification */}
      <AnimatePresence>
        {step.toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            className="fixed bottom-6 right-6 z-50 bg-foreground text-background px-4 py-3 rounded-xl shadow-2xl flex items-center gap-3"
          >
            <div className="w-2 h-2 rounded-full bg-cyan-500 animate-pulse" />
            <p className="text-sm font-medium">{step.toastMessage}</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Code Dialog Modal */}
      <AnimatePresence>
        {activeCodeDialog && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6"
          >
            {/* Backdrop */}
            <div 
              className="absolute inset-0 bg-background/80 backdrop-blur-sm cursor-pointer" 
              onClick={() => setActiveCodeDialog(null)}
            />
            
            {/* Modal */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-2xl bg-[#1E1E1E] rounded-xl overflow-hidden shadow-2xl border border-[#333]"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between px-4 h-12 border-b border-[#333] bg-[#2D2D2D]">
                <div className="flex items-center gap-2">
                  <div className="flex gap-1.5 mr-4">
                    <div className="w-3 h-3 rounded-full bg-[#FF5F56]" />
                    <div className="w-3 h-3 rounded-full bg-[#FFBD2E]" />
                    <div className="w-3 h-3 rounded-full bg-[#27C93F]" />
                  </div>
                  <span className="text-sm font-mono text-zinc-400">
                    {activeCodeDialog === 'processA' ? 'process_a.c' : 'process_b.c'}
                  </span>
                </div>
                <button 
                  onClick={() => setActiveCodeDialog(null)}
                  className="p-1 rounded hover:bg-white/10 text-zinc-400 hover:text-white transition-colors"
                >
                  <X size={16} />
                </button>
              </div>

              {/* Code Content */}
              <div className="p-6 font-mono text-sm leading-loose text-[#D4D4D4] overflow-x-auto whitespace-pre">
                <span className="text-[#569CD6]">void</span> <span className="text-[#DCDCAA]">print_file</span>(char* filename) {"{\n"}
                {activeCodeDialog === 'processA' ? (
                  <>
                    {"    "}
                    <span className="text-[#6A9955]">/* read the shared pointer */</span>
                    {"\n    "}
                    <span className="text-[#569CD6]">int</span> next_free_slot = IN;{"\n\n"}
                    
                    <div className="bg-cyan-500/10 border-l-4 border-cyan-500 -mx-6 px-6 py-2 my-2 relative group">
                      <div className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-bold uppercase tracking-widest text-cyan-500/50 opacity-0 group-hover:opacity-100 transition-opacity">
                        Critical Section (Lost Update)
                      </div>
                      <span className="text-[#6A9955] block -mt-1 mb-1">// CRITICAL SECTION (The 3 Assembly Instructions)</span>
                      spooler_directory[next_free_slot] = filename;{"\n"}
                      IN = next_free_slot + 1;
                    </div>
                  </>
                ) : (
                  <>
                    {"    "}
                    <span className="text-[#6A9955]">/* read the shared pointer */</span>
                    {"\n    "}
                    <span className="text-[#569CD6]">int</span> next_free_slot = IN;{"\n\n"}
                    
                    <div className="bg-orange-500/10 border-l-4 border-orange-500 -mx-6 px-6 py-2 my-2 relative group">
                      <div className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-bold uppercase tracking-widest text-orange-500/50 opacity-0 group-hover:opacity-100 transition-opacity">
                        Critical Section (Lost Update)
                      </div>
                      <span className="text-[#6A9955] block -mt-1 mb-1">// CRITICAL SECTION (The 3 Assembly Instructions)</span>
                      spooler_directory[next_free_slot] = filename;{"\n"}
                      IN = next_free_slot + 1;
                    </div>
                  </>
                )}
                {"}"}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
