"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Logo } from "@/components/ui/Logo";
import {
  Play, Pause, SkipBack, SkipForward, RotateCcw, X,
  Lock, Unlock, Cpu, AlertTriangle, ArrowUpRight,
} from "lucide-react";
import {
  LOCK_VARIABLE_SCENARIO_A,
  LOCK_VARIABLE_SCENARIO_B,
  LockScenario,
} from "@/lib/os-simulator/lock-variable-scenario";

// ─────────────────────────────────────────────────────────────────────────────
// Code Definitions
// ─────────────────────────────────────────────────────────────────────────────

type AsmDialogType = "while" | "set" | "release";

interface CCodeLine {
  text: string;
  asmIdxs: number[];
  btnType: AsmDialogType | null;
  asmLabel?: string;
  isComment?: boolean;
}

const NAIVE_C_LINES: CCodeLine[] = [
  { text: "void use_shared_resource() {", asmIdxs: [], btnType: null },
  { text: "    // ── 1. ACQUIRE LOCK ──", asmIdxs: [], btnType: null, isComment: true },
  { text: "    while (LOCK == 1) { /* spin */ }", asmIdxs: [0, 1, 2], btnType: "while", asmLabel: "3 instructions" },
  { text: "    LOCK = 1;           // claim", asmIdxs: [3], btnType: "set", asmLabel: "1 instruction" },
  { text: "", asmIdxs: [], btnType: null },
  { text: "    // ── 2. CRITICAL SECTION ──", asmIdxs: [4], btnType: null, isComment: true },
  { text: "    // (Safe to use resource here)", asmIdxs: [4], btnType: null, isComment: true },
  { text: "", asmIdxs: [], btnType: null },
  { text: "    // ── 3. RELEASE LOCK ──", asmIdxs: [], btnType: null, isComment: true },
  { text: "    LOCK = 0;", asmIdxs: [5], btnType: "release", asmLabel: "1 instruction" },
  { text: "}", asmIdxs: [], btnType: null },
];

const TSL_C_LINES: CCodeLine[] = [
  { text: "void use_shared_resource() {", asmIdxs: [], btnType: null },
  { text: "    // ── 1. ACQUIRE LOCK ──", asmIdxs: [], btnType: null, isComment: true },
  { text: "    int old;", asmIdxs: [], btnType: null },
  { text: "    do {", asmIdxs: [], btnType: null },
  { text: "        old = test_and_set(&LOCK);", asmIdxs: [0], btnType: "set", asmLabel: "1 atomic instr" },
  { text: "    } while (old != 0);  // spin", asmIdxs: [1, 2], btnType: "while", asmLabel: "2 instructions" },
  { text: "", asmIdxs: [], btnType: null },
  { text: "    // ── 2. CRITICAL SECTION ──", asmIdxs: [4], btnType: null, isComment: true },
  { text: "    // (Safe to use resource here)", asmIdxs: [4], btnType: null, isComment: true },
  { text: "", asmIdxs: [], btnType: null },
  { text: "    // ── 3. RELEASE LOCK ──", asmIdxs: [], btnType: null, isComment: true },
  { text: "    LOCK = 0;", asmIdxs: [5], btnType: "release", asmLabel: "1 instruction" },
  { text: "}", asmIdxs: [], btnType: null },
];

function getAsmSnippet(isTSL: boolean, type: AsmDialogType): string[] {
  if (type === "release") return ["STORE LOCK, 0"];
  if (!isTSL) {
    if (type === "while") return ["LOAD  Ra, LOCK", "CMP   Ra, 0", "JNE   (loop back)"];
    if (type === "set") return ["STORE LOCK, 1"];
  } else {
    if (type === "set") return ["TSL   Ra, LOCK    // atomic read+set"];
    if (type === "while") return ["CMP   Ra, 0", "JNE   (loop back)"];
  }
  return [];
}

// ─────────────────────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────────────────────
export default function LockVariablesSimulator() {
  const [scenario, setScenario] = useState<LockScenario>(LOCK_VARIABLE_SCENARIO_A);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [activeAsmDialog, setActiveAsmDialog] = useState<{ process: "processA" | "processB", type: AsmDialogType } | null>(null);

  const step = scenario.steps[currentStepIndex];
  const isTSL = scenario.id === LOCK_VARIABLE_SCENARIO_B.id;
  const cCode = isTSL ? TSL_C_LINES : NAIVE_C_LINES;

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
  const reset = () => { setCurrentStepIndex(0); setIsPlaying(false); };
  const switchScenario = (s: LockScenario) => { setScenario(s); setCurrentStepIndex(0); setIsPlaying(false); };

  // ── lock widget state ────────────────────────────────────────────────────
  const lockFree = step.sharedLock === 0;
  const lockRace = step.lockRaceDetected;

  return (
    <div className="h-screen bg-background text-foreground overflow-hidden flex flex-col font-sans selection:bg-violet-500/30">
      {/* Navigation ─────────────────────────────────────────────────────── */}
      <nav className="shrink-0 h-14 border-b border-border/40 bg-background/80 backdrop-blur-md flex items-center justify-between px-4 z-50">
        <div className="flex items-center gap-4">
          <Link href="/operating-systems" className="flex items-center justify-center w-8 h-8 rounded-full hover:bg-muted/80 transition-colors">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M15 18l-6-6 6-6" /></svg>
          </Link>
          <div className="flex items-center gap-2">
            <Logo size={20} />
            <span className="text-sm font-semibold tracking-tight text-foreground/80">Episode 7: Lock Variables</span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <ThemeToggle />
        </div>
      </nav>

      <main className="flex-1 flex overflow-hidden">
        {/* ── Left/Centre Visualiser ──────────────────────────────────── */}
        <div className="flex-1 flex flex-col relative">

          {/* Main Stage (split-screen) ─────────────────────────────────── */}
          <div className="flex-1 relative flex overflow-hidden">

            {/* PROCESS A ─────────────────────────────────────────────── */}
            <ProcessPanel
              name="Process A"
              color="cyan"
              process="processA"
              state={step.processAState}
              codeLine={step.processACodeLine}
              registerValue={step.registerRa}
              registerName="Ra"
              cCode={cCode}
              isTSL={isTSL}
              isRace={lockRace}
              onViewAsm={(type) => setActiveAsmDialog({ process: "processA", type })}
              side="left"
            />

            {/* LOCK WIDGET (centre-bottom, matching Ep5 style) ───────────────── */}
            <div className="absolute top-[76%] left-1/2 -translate-x-1/2 -translate-y-1/2 z-20 flex flex-col items-center gap-2 pointer-events-none select-none">
              <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1">Shared Memory</div>
              <motion.div
                className={cn(
                  "relative flex flex-col items-center justify-center rounded-3xl border-2 w-36 h-44 shadow-2xl transition-colors duration-500",
                  lockRace
                    ? "border-rose-500 bg-rose-500/10 shadow-rose-500/30"
                    : lockFree
                    ? "border-emerald-500/50 bg-emerald-500/5 shadow-emerald-500/10"
                    : "border-violet-500/60 bg-violet-500/10 shadow-violet-500/20"
                )}
                animate={lockRace ? { scale: [1, 1.04, 1], transition: { repeat: Infinity, duration: 0.6 } } : { scale: 1 }}
              >
                {/* glow ring */}
                <div className={cn(
                  "absolute inset-0 rounded-3xl opacity-30 blur-lg transition-colors duration-500",
                  lockRace ? "bg-rose-500" : lockFree ? "bg-emerald-500" : "bg-violet-500"
                )} />

                {/* lock icon */}
                <AnimatePresence mode="wait">
                  <motion.div
                    key={lockFree ? "unlocked" : lockRace ? "race" : "locked"}
                    initial={{ scale: 0.7, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.7, opacity: 0 }}
                    transition={{ type: "spring", stiffness: 400, damping: 20 }}
                    className={cn(
                      "relative z-10 flex items-center justify-center w-14 h-14 rounded-2xl mb-2",
                      lockRace ? "bg-rose-500/20 text-rose-500" :
                      lockFree ? "bg-emerald-500/20 text-emerald-500" :
                      "bg-violet-500/20 text-violet-500"
                    )}
                  >
                    {lockRace
                      ? <AlertTriangle className="w-7 h-7 animate-pulse" />
                      : lockFree
                      ? <Unlock className="w-7 h-7" />
                      : <Lock className="w-7 h-7" />}
                  </motion.div>
                </AnimatePresence>

                {/* LOCK = value */}
                <div className="relative z-10 flex items-center gap-1 font-mono text-xs text-muted-foreground">
                  <span>LOCK =</span>
                  <AnimatePresence mode="popLayout">
                    <motion.span
                      key={step.sharedLock}
                      initial={{ y: -10, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      exit={{ y: 10, opacity: 0 }}
                      className={cn(
                        "text-2xl font-bold tabular-nums",
                        lockFree ? "text-emerald-500" : "text-violet-500"
                      )}
                    >
                      {step.sharedLock}
                    </motion.span>
                  </AnimatePresence>
                </div>

                {/* status label */}
                <div className={cn(
                  "relative z-10 mt-2 text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full",
                  lockRace ? "text-rose-500 bg-rose-500/10" :
                  lockFree ? "text-emerald-500 bg-emerald-500/10" :
                  "text-violet-500 bg-violet-500/10"
                )}>
                  {lockRace ? "⚠ RACE!" : lockFree ? "Free" : `Held by ${step.lockHeldBy === "processA" ? "A" : "B"}`}
                </div>

                {/* TSL atomic glow */}
                {step.isAtomicTSL && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.85 }}
                    animate={{ opacity: [0, 1, 0], scale: [0.85, 1.05, 0.85] }}
                    transition={{ duration: 1.2, repeat: Infinity }}
                    className="absolute inset-0 rounded-3xl border-2 border-violet-400 pointer-events-none"
                  />
                )}
              </motion.div>

              {/* TSL label */}
              {step.isAtomicTSL && (
                <motion.div
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-[10px] font-bold uppercase tracking-widest text-violet-500 bg-violet-500/10 px-3 py-1 rounded-full border border-violet-500/20"
                >
                  ⚡ Atomic TSL
                </motion.div>
              )}
            </div>

            {/* PROCESS B ─────────────────────────────────────────────── */}
            <ProcessPanel
              name="Process B"
              color="orange"
              process="processB"
              state={step.processBState}
              codeLine={step.processBCodeLine}
              registerValue={step.registerRb}
              registerName="Rb"
              cCode={cCode}
              isTSL={isTSL}
              isRace={lockRace}
              onViewAsm={(type) => setActiveAsmDialog({ process: "processB", type })}
              side="right"
            />

            {/* Context Switch Overlay ──────────────────────────────────── */}
            <AnimatePresence>
              {step.isContextSwitch && (
                <motion.div
                  key="context-switch-overlay"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 z-30 flex items-center justify-center pointer-events-none"
                  style={{ backdropFilter: "blur(4px)" }}
                >
                  <div className="bg-background/90 border border-border/50 shadow-2xl rounded-3xl px-10 py-8 flex flex-col items-center gap-4">
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

          {/* Explanation Footer ──────────────────────────────────────────── */}
          <div className="shrink-0 h-40 border-t border-border/40 bg-card flex flex-col">
            <div className="flex-1 p-6 max-w-4xl mx-auto w-full flex flex-col justify-center">
              <div className="text-xs font-bold uppercase tracking-widest text-violet-500 mb-2 flex items-center gap-2 flex-wrap">
                <span>{step.chapter}</span>
                <span className="w-1 h-1 rounded-full bg-border" />
                <span className="text-muted-foreground">Step {currentStepIndex + 1} of {scenario.steps.length}</span>
                {lockRace && (
                  <>
                    <span className="w-1 h-1 rounded-full bg-border" />
                    <div className="text-[10px] font-bold uppercase tracking-wider bg-rose-500/20 text-rose-500 px-2 py-0.5 rounded-full border border-rose-500/20 animate-pulse flex items-center gap-1.5">
                      <AlertTriangle size={10} />
                      Mutual Exclusion Violated
                    </div>
                  </>
                )}
                {step.isAtomicTSL && (
                  <>
                    <span className="w-1 h-1 rounded-full bg-border" />
                    <div className="text-[10px] font-bold uppercase tracking-wider bg-violet-500/20 text-violet-500 px-2 py-0.5 rounded-full border border-violet-500/20 animate-pulse flex items-center gap-1.5">
                      ⚡ Atomic Operation
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
            <div className="h-1.5 w-full bg-muted flex relative cursor-pointer">
              {scenario.steps.map((_, i) => (
                <div
                  key={i}
                  className={cn(
                    "h-full flex-1 transition-all duration-300 border-r border-background/20 last:border-0",
                    i <= currentStepIndex ? "bg-violet-500" : "bg-transparent",
                    i === currentStepIndex && "bg-violet-400 shadow-[0_0_10px_rgba(139,92,246,1)]"
                  )}
                  onClick={() => setCurrentStepIndex(i)}
                />
              ))}
            </div>
          </div>
        </div>

        {/* ── Right Sidebar ────────────────────────────────────────────── */}
        <div className="w-80 shrink-0 border-l border-border/40 bg-card/30 flex flex-col z-10">

          {/* Controls ────────────────────────────────────────────────── */}
          <div className="p-6 border-b border-border/40">
            <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-4">Simulation Controls</h3>
            <div className="flex flex-col gap-3">
              <div className="flex justify-center gap-2 mb-2">
                <button onClick={prevStep} disabled={currentStepIndex === 0} className="w-10 h-10 rounded-full flex items-center justify-center bg-muted/50 hover:bg-muted text-foreground disabled:opacity-30 transition-colors">
                  <SkipBack className="w-4 h-4" />
                </button>
                <button onClick={togglePlay} className="w-12 h-12 rounded-full flex items-center justify-center bg-violet-500 hover:bg-violet-400 text-white shadow-lg shadow-violet-500/20 transition-all hover:scale-105 active:scale-95">
                  {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-1" />}
                </button>
                <button onClick={nextStep} disabled={currentStepIndex === scenario.steps.length - 1} className="w-10 h-10 rounded-full flex items-center justify-center bg-muted/50 hover:bg-muted text-foreground disabled:opacity-30 transition-colors">
                  <SkipForward className="w-4 h-4" />
                </button>
                <button onClick={reset} className="w-10 h-10 rounded-full flex items-center justify-center bg-muted/50 hover:bg-muted text-foreground transition-colors ml-2">
                  <RotateCcw className="w-4 h-4" />
                </button>
              </div>

              {/* Scenario Toggles */}
              <div className="bg-background rounded-xl p-1 flex border border-border">
                <button
                  onClick={() => switchScenario(LOCK_VARIABLE_SCENARIO_A)}
                  className={cn(
                    "flex-1 py-1.5 text-[10px] font-bold uppercase tracking-widest rounded-lg transition-colors",
                    scenario.id === LOCK_VARIABLE_SCENARIO_A.id ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  Lock Fails
                </button>
                <button
                  onClick={() => switchScenario(LOCK_VARIABLE_SCENARIO_B)}
                  className={cn(
                    "flex-1 py-1.5 text-[10px] font-bold uppercase tracking-widest rounded-lg transition-colors",
                    scenario.id === LOCK_VARIABLE_SCENARIO_B.id ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  TSL Fix
                </button>
              </div>
            </div>
          </div>

          {/* Instructor Notes ─────────────────────────────────────────── */}
          <div className="flex-1 p-6 overflow-y-auto">
            <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-6">Notes</h3>
            <AnimatePresence mode="popLayout">
              {step.noteTitle && (
                <motion.div
                  key={step.noteTitle}
                  initial={{ opacity: 0, y: 20, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="bg-violet-500/10 border border-violet-500/20 rounded-2xl p-5 relative overflow-hidden"
                >
                  <div className="absolute top-0 right-0 p-3 opacity-10">
                    <Lock className="w-16 h-16" />
                  </div>
                  <h4 className="text-sm font-bold text-violet-500 mb-2">{step.noteTitle}</h4>
                  <p className="text-sm text-muted-foreground leading-relaxed">{step.noteContent}</p>
                </motion.div>
              )}
            </AnimatePresence>
            {!step.noteTitle && (
              <div className="opacity-50 text-xs leading-relaxed space-y-4">
                <p>Lock variables are the simplest software attempt at mutual exclusion.</p>
                <p>The flaw: checking and setting the lock are two separate instructions — creating a gap the OS scheduler can exploit.</p>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Code Dialog Modal ───────────────────────────────────────────────── */}
      <AnimatePresence>
        {activeAsmDialog && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6"
          >
            <div className="absolute inset-0 bg-background/80 backdrop-blur-sm cursor-pointer" onClick={() => setActiveAsmDialog(null)} />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-sm bg-[#1E1E1E] rounded-xl overflow-hidden shadow-2xl border border-[#333]"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between px-4 h-12 border-b border-[#333] bg-[#2D2D2D]">
                <div className="flex items-center gap-2">
                  <div className="flex gap-1.5 mr-4">
                    <div className="w-3 h-3 rounded-full bg-[#FF5F56]" />
                    <div className="w-3 h-3 rounded-full bg-[#FFBD2E]" />
                    <div className="w-3 h-3 rounded-full bg-[#27C93F]" />
                  </div>
                  <span className="text-xs font-mono text-zinc-400">
                    {activeAsmDialog.process === "processA" ? "process_a.asm" : "process_b.asm"}
                  </span>
                </div>
                <button onClick={() => setActiveAsmDialog(null)} className="p-1 rounded hover:bg-white/10 text-zinc-400 hover:text-white transition-colors">
                  <X size={16} />
                </button>
              </div>
              <div className="p-4 font-mono text-sm leading-loose text-[#D4D4D4] overflow-x-auto">
                <pre className="whitespace-pre-wrap text-sm leading-7">
                  {getAsmSnippet(isTSL, activeAsmDialog.type).map((line, i) => {
                    const isTSLInstruction = line.includes("TSL");
                    return (
                      <div
                        key={i}
                        className={cn(
                          "transition-colors",
                          isTSLInstruction ? "bg-violet-500/15 border-l-2 border-violet-500 -ml-1 pl-1" : ""
                        )}
                      >
                        <span className={isTSLInstruction ? "text-violet-300 font-bold" : "text-[#D4D4D4]"}>
                          {line}
                        </span>
                      </div>
                    );
                  })}
                </pre>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// ProcessPanel sub-component
// ─────────────────────────────────────────────────────────────────────────────
interface ProcessPanelProps {
  name: string;
  color: "cyan" | "orange";
  process: "processA" | "processB";
  state: string;
  codeLine: number | null; // index into assembly code
  registerValue: number | null;
  registerName: string;
  cCode: CCodeLine[];
  isTSL: boolean;
  isRace: boolean;
  onViewAsm: (type: AsmDialogType) => void;
  side: "left" | "right";
}

function ProcessPanel({
  name, color, process, state, codeLine, registerValue, registerName,
  cCode, isTSL, isRace, onViewAsm, side,
}: ProcessPanelProps) {
  const isActive = state === "running" || state === "busy-waiting";
  const isBusyWaiting = state === "busy-waiting";

  const accent = color === "cyan" ? {
    text: "text-cyan-500", bg: "bg-cyan-500/20", border: "border-cyan-500/20",
    stateBg: "bg-cyan-500/20", stateBorder: "border-cyan-500/30",
    stateShadow: "shadow-[0_0_15px_-3px_rgba(6,182,212,0.3)]",
    codeBg: "bg-cyan-500/20", codeText: "text-cyan-400", sideBorder: "bg-cyan-500",
    regBorder: "border-cyan-500/20", regText: "text-cyan-500",
    regHover: "from-cyan-500/5",
  } : {
    text: "text-orange-500", bg: "bg-orange-500/20", border: "border-orange-500/20",
    stateBg: "bg-orange-500/20", stateBorder: "border-orange-500/30",
    stateShadow: "shadow-[0_0_15px_-3px_rgba(249,115,22,0.3)]",
    codeBg: "bg-orange-500/20", codeText: "text-orange-400", sideBorder: "bg-orange-500",
    regBorder: "border-orange-500/20", regText: "text-orange-500",
    regHover: "from-orange-500/5",
  };

  return (
    <div className={cn(
      "flex-1 p-8 flex flex-col transition-opacity duration-500 relative",
      side === "left" ? "border-r border-border/40" : "",
      !isActive && state !== "suspended" ? "opacity-40" : state === "suspended" ? "opacity-50" : "opacity-100"
    )}>
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center", accent.bg, accent.text)}>
            <Cpu className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className={cn("text-xl font-bold", accent.text)}>{name}</h2>
            </div>
            <div className={cn("text-xs font-mono uppercase", `${accent.text}/70`)}>
              {isTSL ? "TSL Protocol" : "Naive Lock Protocol"}
            </div>
          </div>
        </div>
        <div className={cn(
          "px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest border transition-all",
          isActive && !isBusyWaiting
            ? cn(accent.stateBg, accent.text, accent.stateBorder, accent.stateShadow, "animate-pulse")
            : isBusyWaiting
            ? "bg-amber-500/20 text-amber-500 border-amber-500/30 animate-pulse"
            : "bg-muted text-muted-foreground border-transparent"
        )}>
          {isBusyWaiting ? "Busy Waiting…" : state}
        </div>
      </div>

      {/* Race highlight border */}
      {isRace && (
        <div className="absolute inset-0 border-2 border-rose-500/40 rounded-none pointer-events-none animate-pulse" />
      )}

      {/* C Code Block */}
      <div className="bg-[#1E1E1E] rounded-xl border border-[#333] overflow-hidden shadow-2xl font-mono text-sm mb-8 flex-1 min-h-0 flex flex-col">
        <div className="h-8 shrink-0 bg-[#2D2D2D] border-b border-[#333] flex items-center px-4 gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-[#FF5F56]" />
          <div className="w-2.5 h-2.5 rounded-full bg-[#FFBD2E]" />
          <div className="w-2.5 h-2.5 rounded-full bg-[#27C93F]" />
          <span className="ml-2 text-xs text-zinc-400">{process === "processA" ? "process_a.c" : "process_b.c"}</span>
        </div>
        <div className="p-4 relative flex-1 overflow-y-auto min-h-[140px]">
          {cCode.map((line, i) => {
            const isLineActive = codeLine !== null && line.asmIdxs.includes(codeLine);
            const isBusyLine = isLineActive && codeLine === 2; // JNE line
            const isKeyword = /\b(void|int|do|while|return)\b/.test(line.text);
            
            return (
              <div
                key={i}
                className={cn(
                  "flex items-center gap-2 py-1 px-2 rounded-md transition-colors relative",
                  isLineActive
                    ? color === "cyan" ? "bg-cyan-500/10 text-cyan-400" : "bg-orange-500/10 text-orange-400"
                    : "text-[#D4D4D4]"
                )}
              >
                {/* Active line bar */}
                {isLineActive && (
                  <motion.div
                    layoutId={`highlight-${process}`}
                    className={cn("absolute left-0 w-1 h-6 rounded-r-full", color === "cyan" ? "bg-cyan-500" : "bg-orange-500")}
                  />
                )}
                
                {/* Code Text */}
                <span className={cn(
                  "flex-1 whitespace-pre", 
                  line.isComment ? "text-[#6A9955]" : isLineActive ? "" : isKeyword ? "text-[#569CD6]" : ""
                )}>
                  {line.text}
                </span>

                {/* ASM ↗ Button */}
                {line.btnType && (
                  <button
                    onClick={() => onViewAsm(line.btnType!)}
                    className={cn(
                      "flex items-center gap-1 text-[10px] uppercase font-bold tracking-widest px-2 py-1 rounded transition-colors border",
                      isLineActive 
                        ? cn(accent.stateBg, accent.text, accent.stateBorder, "hover:brightness-125")
                        : "bg-muted/50 text-muted-foreground border-transparent hover:bg-muted hover:text-foreground"
                    )}
                  >
                    <span>{line.asmLabel}</span>
                    <ArrowUpRight className="w-3 h-3" />
                  </button>
                )}

                {/* busy-wait spinner */}
                {isBusyLine && (
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    className="ml-2"
                  >
                    <RotateCcw className="w-3 h-3 text-amber-500" />
                  </motion.div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Private Register */}
      <div className={cn("mt-auto", side === "left" ? "mr-auto w-1/2 pr-2" : "ml-auto w-1/2 pl-2")}>
        <div className={cn("bg-card rounded-2xl border p-6 flex flex-col shadow-sm relative overflow-hidden group", accent.regBorder)}>
          <div className={cn("absolute inset-0 bg-gradient-to-br to-transparent opacity-0 group-hover:opacity-100 transition-opacity", accent.regHover)} />
          <div className="flex items-center justify-between mb-2">
            <span className={cn("text-xs font-bold uppercase tracking-widest", `${accent.regText}/70`)}>Private Reg</span>
            <span className="text-[10px] font-mono text-muted-foreground bg-muted px-2 py-0.5 rounded-full">{registerName}</span>
          </div>
          <div className={cn("text-4xl font-light tabular-nums tracking-tight mt-auto", accent.regText)}>
            <AnimatePresence mode="popLayout">
              <motion.span
                key={registerValue ?? "empty"}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="inline-block"
              >
                {registerValue ?? "—"}
              </motion.span>
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}
