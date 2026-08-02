"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Logo } from "@/components/ui/Logo";
import { Play, Pause, SkipBack, SkipForward, RotateCcw, Box, Cpu } from "lucide-react";
import { 
  PRODUCER_CONSUMER_SCENARIO_A, 
  PRODUCER_CONSUMER_SCENARIO_B, 
  PCScenario 
} from "@/lib/os-simulator/producer-consumer-scenario";

const PRODUCER_CODE = ["LOAD Rp, count", "INC Rp", "STORE Rp, count"];
const CONSUMER_CODE = ["LOAD Rc, count", "DEC Rc", "STORE Rc, count"];

export default function ProducerConsumerSimulator() {
  const [scenario, setScenario] = useState<PCScenario>(PRODUCER_CONSUMER_SCENARIO_A);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);

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
  
  const switchScenario = (s: PCScenario) => {
    setScenario(s);
    setCurrentStepIndex(0);
    setIsPlaying(false);
  };

  const isCorrupted = step.sharedMemoryCount !== 3 && step.activeThread === "none" && step.producerState === "terminated" && step.consumerState === "terminated";

  return (
    <div className="min-h-screen bg-background text-foreground overflow-hidden flex flex-col font-sans selection:bg-teal-500/30">
      {/* Navigation */}
      <nav className="shrink-0 h-14 border-b border-border/40 bg-background/80 backdrop-blur-md flex items-center justify-between px-4 z-50">
        <div className="flex items-center gap-4">
          <Link href="/operating-systems" className="flex items-center justify-center w-8 h-8 rounded-full hover:bg-muted/80 transition-colors">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M15 18l-6-6 6-6"/></svg>
          </Link>
          <div className="flex items-center gap-2">
            <Logo size={20} />
            <span className="text-sm font-semibold tracking-tight text-foreground/80">Episode 5: Producer-Consumer Problem</span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <ThemeToggle />
        </div>
      </nav>

      <main className="flex-1 flex overflow-hidden">
        {/* Left/Center Visualizer Area */}
        <div className="flex-1 flex flex-col relative">
          
          {/* Buffer Visualization (Top) */}
          <div className="shrink-0 h-24 border-b border-border/40 bg-card/30 flex items-center justify-center relative">
            <div className="absolute top-2 left-4 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Shared Buffer</div>
            <div className="flex gap-2 p-3 bg-background/50 rounded-2xl border border-border/50 shadow-inner">
              {step.buffer.map((slot, i) => (
                <div key={i} className={cn(
                  "w-12 h-12 rounded-xl flex items-center justify-center border transition-all duration-500",
                  slot ? "bg-teal-500/20 border-teal-500/30 shadow-[0_0_15px_-3px_rgba(20,184,166,0.3)]" : "bg-muted/30 border-transparent border-dashed"
                )}>
                  <AnimatePresence mode="popLayout">
                    {slot && (
                      <motion.div
                        initial={{ scale: 0, opacity: 0, y: -20 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0, opacity: 0, y: 20 }}
                        transition={{ type: "spring", bounce: 0.5 }}
                      >
                        <Box className="w-6 h-6 text-teal-500" />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ))}
            </div>
          </div>

          {/* Main Stage (Split Screen) */}
          <div className="flex-1 relative flex overflow-hidden">
            
            {/* PRODUCER PANEL (Left) */}
            <div className={cn(
              "flex-1 border-r border-border/40 p-8 flex flex-col transition-opacity duration-500",
              step.producerState === "suspended" || step.producerState === "idle" ? "opacity-40" : "opacity-100"
            )}>
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-500 flex items-center justify-center">
                    <Cpu className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-amber-500">Producer Thread</h2>
                    <div className="text-xs font-mono text-amber-500/70 uppercase">Code: count = count + 1</div>
                  </div>
                </div>
                <div className={cn(
                  "px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest border",
                  step.producerState === "running" ? "bg-amber-500/20 text-amber-500 border-amber-500/30 shadow-[0_0_15px_-3px_rgba(245,158,11,0.3)] animate-pulse" : "bg-muted text-muted-foreground border-transparent"
                )}>
                  {step.producerState}
                </div>
              </div>

              {/* Code Block */}
              <div className="bg-[#1E1E1E] rounded-xl border border-[#333] overflow-hidden shadow-2xl relative font-mono text-sm mb-8">
                <div className="h-8 bg-[#2D2D2D] border-b border-[#333] flex items-center px-4 gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-[#FF5F56]" />
                  <div className="w-2.5 h-2.5 rounded-full bg-[#FFBD2E]" />
                  <div className="w-2.5 h-2.5 rounded-full bg-[#27C93F]" />
                  <span className="ml-2 text-xs text-zinc-400">producer.asm</span>
                </div>
                <div className="p-4 relative min-h-[120px]">
                  {PRODUCER_CODE.map((line, i) => (
                    <div key={i} className={cn(
                      "flex items-center gap-4 py-1.5 px-2 rounded-md transition-colors",
                      step.producerCodeLine === i ? "bg-amber-500/20 text-amber-400" : "text-zinc-300"
                    )}>
                      <span className="opacity-30 select-none w-4">{i + 1}</span>
                      <span className="flex-1">{line}</span>
                      {step.producerCodeLine === i && (
                        <motion.div layoutId="prod-cursor" className="w-2 h-4 bg-amber-500 rounded-sm animate-pulse" />
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Producer Register */}
              <div className="mt-auto grid grid-cols-2 gap-4">
                <div className="bg-card rounded-2xl border border-amber-500/20 p-6 flex items-center justify-between shadow-[0_0_30px_-5px_rgba(245,158,11,0.1)]">
                  <div>
                    <div className="text-xs font-bold uppercase tracking-widest text-amber-500/60 mb-1">Private Register</div>
                    <div className="text-2xl font-bold text-amber-500">Rp</div>
                  </div>
                  <div className="text-5xl font-mono text-amber-500">
                    {step.registerRp !== null ? step.registerRp : "—"}
                  </div>
                </div>
                <div>{/* Empty column */}</div>
              </div>
            </div>

            {/* CONSUMER PANEL (Right) */}
            <div className={cn(
              "flex-1 p-8 flex flex-col transition-opacity duration-500",
              step.consumerState === "suspended" || step.consumerState === "idle" ? "opacity-40" : "opacity-100"
            )}>
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-violet-500/20 text-violet-500 flex items-center justify-center">
                    <Cpu className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-violet-500">Consumer Thread</h2>
                    <div className="text-xs font-mono text-violet-500/70 uppercase">Code: count = count - 1</div>
                  </div>
                </div>
                <div className={cn(
                  "px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest border",
                  step.consumerState === "running" ? "bg-violet-500/20 text-violet-500 border-violet-500/30 shadow-[0_0_15px_-3px_rgba(139,92,246,0.3)] animate-pulse" : "bg-muted text-muted-foreground border-transparent"
                )}>
                  {step.consumerState}
                </div>
              </div>

              {/* Code Block */}
              <div className="bg-[#1E1E1E] rounded-xl border border-[#333] overflow-hidden shadow-2xl relative font-mono text-sm mb-8">
                <div className="h-8 bg-[#2D2D2D] border-b border-[#333] flex items-center px-4 gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-[#FF5F56]" />
                  <div className="w-2.5 h-2.5 rounded-full bg-[#FFBD2E]" />
                  <div className="w-2.5 h-2.5 rounded-full bg-[#27C93F]" />
                  <span className="ml-2 text-xs text-zinc-400">consumer.asm</span>
                </div>
                <div className="p-4 relative min-h-[120px]">
                  {CONSUMER_CODE.map((line, i) => (
                    <div key={i} className={cn(
                      "flex items-center gap-4 py-1.5 px-2 rounded-md transition-colors",
                      step.consumerCodeLine === i ? "bg-violet-500/20 text-violet-400" : "text-zinc-300"
                    )}>
                      <span className="opacity-30 select-none w-4">{i + 1}</span>
                      <span className="flex-1">{line}</span>
                      {step.consumerCodeLine === i && (
                        <motion.div layoutId="cons-cursor" className="w-2 h-4 bg-violet-500 rounded-sm animate-pulse" />
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Consumer Register */}
              <div className="mt-auto grid grid-cols-2 gap-4">
                <div>{/* Empty column */}</div>
                <div className="bg-card rounded-2xl border border-violet-500/20 p-6 flex items-center justify-between shadow-[0_0_30px_-5px_rgba(139,92,246,0.1)]">
                  <div>
                    <div className="text-xs font-bold uppercase tracking-widest text-violet-500/60 mb-1">Private Register</div>
                    <div className="text-2xl font-bold text-violet-500">Rc</div>
                  </div>
                  <div className="text-5xl font-mono text-violet-500">
                    {step.registerRc !== null ? step.registerRc : "—"}
                  </div>
                </div>
              </div>
            </div>

            {/* Context Switch Overlay (Flashes across the screen) */}
            <div
              className={cn(
                "absolute inset-0 z-20 flex items-center justify-center bg-background/40 backdrop-blur-[2px] transition-all duration-300 ease-in-out",
                step.isContextSwitch 
                  ? "opacity-100 translate-y-0 pointer-events-auto" 
                  : "opacity-0 -translate-y-4 pointer-events-none"
              )}
            >
              <div className="w-full bg-rose-500 text-white py-4 border-y-2 border-white/20 shadow-2xl flex flex-col items-center justify-center overflow-hidden relative group animate-pulse">
                <div className="text-2xl font-black uppercase tracking-[0.2em] relative z-10 flex items-center gap-4">
                  <span>⚡</span> Context Switch <span>⚡</span>
                </div>
                <div className="text-xs font-medium uppercase tracking-widest opacity-80 mt-1 relative z-10">
                  OS Preempts CPU
                </div>
              </div>
            </div>

            {/* SHARED MEMORY (Center overlapping widget) */}
            <div className="absolute top-[76%] left-1/2 -translate-x-1/2 -translate-y-1/2 z-10">
              <motion.div 
                key={step.sharedMemoryCount}
                initial={{ scale: 0.9, opacity: 0.8 }}
                animate={{ scale: 1, opacity: 1 }}
                className={cn(
                  "w-48 h-48 rounded-full border-4 flex flex-col items-center justify-center shadow-2xl backdrop-blur-md transition-colors duration-500",
                  isCorrupted ? "bg-rose-500/20 border-rose-500 text-rose-500 shadow-[0_0_50px_-10px_rgba(244,63,94,0.5)]" : "bg-teal-900/40 border-teal-500 text-teal-400 shadow-[0_0_40px_-10px_rgba(20,184,166,0.3)]"
                )}
              >
                <div className="text-xs font-bold uppercase tracking-widest opacity-60 mb-2">Shared Memory</div>
                <div className="text-xl font-mono mb-2">count =</div>
                <div className="text-6xl font-black font-mono">{step.sharedMemoryCount}</div>
                {isCorrupted && (
                  <div className="absolute -top-5 bg-rose-500 text-white px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest whitespace-nowrap shadow-xl border border-white/20">
                    Expected: 3
                  </div>
                )}
              </motion.div>
            </div>

          </div>
          
          {/* Explanation Footer Area */}
          <div className="shrink-0 h-40 border-t border-border/40 bg-card flex flex-col">
            <div className="flex-1 p-6 max-w-4xl mx-auto w-full flex flex-col justify-center">
              <div className="text-xs font-bold uppercase tracking-widest text-teal-500 mb-2 flex items-center gap-2">
                <span>{step.chapter}</span>
                <span className="w-1 h-1 rounded-full bg-border" />
                <span className="text-muted-foreground">Step {currentStepIndex + 1} of {scenario.steps.length}</span>
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
                    i <= currentStepIndex ? "bg-teal-500" : "bg-transparent",
                    i === currentStepIndex && "bg-teal-400 shadow-[0_0_10px_rgba(45,212,191,1)]"
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
                  className="w-12 h-12 rounded-full flex items-center justify-center bg-teal-500 hover:bg-teal-400 text-white shadow-lg shadow-teal-500/20 transition-all hover:scale-105 active:scale-95"
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
                  onClick={() => switchScenario(PRODUCER_CONSUMER_SCENARIO_A)}
                  className={cn(
                    "flex-1 py-1.5 text-[10px] font-bold uppercase tracking-widest rounded-lg transition-colors",
                    scenario.id === PRODUCER_CONSUMER_SCENARIO_A.id ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  Scenario A
                </button>
                <button
                  onClick={() => switchScenario(PRODUCER_CONSUMER_SCENARIO_B)}
                  className={cn(
                    "flex-1 py-1.5 text-[10px] font-bold uppercase tracking-widest rounded-lg transition-colors",
                    scenario.id === PRODUCER_CONSUMER_SCENARIO_B.id ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  Scenario B
                </button>
              </div>
            </div>
          </div>

          {/* Student Notes Panel */}
          <div className="flex-1 p-6 overflow-y-auto">
            <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-6">Instructor Notes</h3>
            
            <AnimatePresence mode="popLayout">
              {step.noteTitle && (
                <motion.div
                  initial={{ opacity: 0, y: 20, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="bg-teal-500/10 border border-teal-500/20 rounded-2xl p-5 relative overflow-hidden"
                >
                  <div className="absolute top-0 right-0 p-3 opacity-10">
                    <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
                  </div>
                  <h4 className="text-sm font-bold text-teal-500 mb-2">{step.noteTitle}</h4>
                  <p className="text-sm text-muted-foreground leading-relaxed">{step.noteContent}</p>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Static context info */}
            {!step.noteTitle && (
              <div className="opacity-50 text-xs leading-relaxed space-y-4">
                <p>The Producer-Consumer problem is a classic example of a multi-process synchronization problem.</p>
                <p>The problem describes two processes, the producer and the consumer, who share a common, fixed-size buffer used as a queue.</p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
