"use client";

import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import {
  Lock,
  Unlock,
  AlertTriangle,
  ArrowUpRight,
} from "lucide-react";
import { OSConcurrencyShell } from "@/components/os-simulator/OSConcurrencyShell";
import {
  LOCK_VARIABLE_SCENARIO_A,
  LOCK_VARIABLE_SCENARIO_B,
  LockScenario,
} from "@/lib/os-simulator/lock-variable-scenario";

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

export default function LockVariablesSimulator() {
  const [scenario, setScenario] = useState<LockScenario>(LOCK_VARIABLE_SCENARIO_A);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [activeAsmDialog, setActiveAsmDialog] = useState<{
    process: "processA" | "processB";
    type: AsmDialogType;
  } | null>(null);

  const safeIndex =
    scenario.steps.length > 0
      ? Math.max(0, Math.min(currentStepIndex, scenario.steps.length - 1))
      : 0;
  const step = scenario.steps[safeIndex];
  const isTSL = scenario.id === LOCK_VARIABLE_SCENARIO_B.id;
  const cCode = isTSL ? TSL_C_LINES : NAIVE_C_LINES;

  // Auto-play timer
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isPlaying) {
      if (safeIndex < scenario.steps.length - 1) {
        timer = setTimeout(() => setCurrentStepIndex((i) => i + 1), 2500);
      } else {
        const stopTimer = setTimeout(() => setIsPlaying(false), 0);
        return () => clearTimeout(stopTimer);
      }
    }
    return () => clearTimeout(timer);
  }, [isPlaying, safeIndex, scenario]);

  const togglePlay = () => setIsPlaying(!isPlaying);
  const nextStep = () => setCurrentStepIndex((i) => Math.min(i + 1, scenario.steps.length - 1));
  const prevStep = () => setCurrentStepIndex((i) => Math.max(i - 1, 0));
  const reset = () => {
    setCurrentStepIndex(0);
    setIsPlaying(false);
  };

  const switchScenario = (scenarioId: string) => {
    const target =
      scenarioId === LOCK_VARIABLE_SCENARIO_B.id
        ? LOCK_VARIABLE_SCENARIO_B
        : LOCK_VARIABLE_SCENARIO_A;
    setScenario(target);
    setCurrentStepIndex(0);
    setIsPlaying(false);
  };

  const lockRace = step.lockRaceDetected;
  const lockFree = step.sharedLock === 0;

  // Shared Lock Hardware Widget (Top Slot)
  const sharedResource = (
    <div className="flex flex-col items-center gap-2">
      <div className="flex items-center justify-between w-full max-w-xl px-2">
        <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
          Shared Memory Lock Variable (Address 0x1000)
        </span>
        {step.isAtomicTSL && (
          <span className="text-[10px] font-bold uppercase tracking-wider text-sky-500 bg-sky-500/10 px-2 py-0.5 rounded-full border border-sky-500/20 animate-pulse">
            ⚡ Atomic Hardware Bus Lock
          </span>
        )}
      </div>

      <div className="flex items-center gap-6 p-3 bg-background/60 rounded-2xl border border-border/50 shadow-inner">
        {/* Lock icon */}
        <div
          className={cn(
            "w-12 h-12 rounded-xl flex items-center justify-center transition-all",
            lockRace
              ? "bg-rose-500/20 text-rose-500 border border-rose-500/30"
              : lockFree
              ? "bg-emerald-500/20 text-emerald-500 border border-emerald-500/30"
              : "bg-sky-500/20 text-sky-500 border border-sky-500/30"
          )}
        >
          {lockRace ? (
            <AlertTriangle className="w-6 h-6 animate-pulse" />
          ) : lockFree ? (
            <Unlock className="w-6 h-6" />
          ) : (
            <Lock className="w-6 h-6" />
          )}
        </div>

        {/* Lock value */}
        <div className="flex items-baseline gap-2 font-mono">
          <span className="text-xs text-muted-foreground">LOCK =</span>
          <span
            className={cn(
              "text-3xl font-black tabular-nums",
              lockFree ? "text-emerald-500" : "text-sky-500 dark:text-sky-400"
            )}
          >
            {step.sharedLock}
          </span>
        </div>

        {/* Status label */}
        <div
          className={cn(
            "text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full",
            lockRace
              ? "text-rose-500 bg-rose-500/10 border border-rose-500/20"
              : lockFree
              ? "text-emerald-500 bg-emerald-500/10"
              : "text-sky-500 bg-sky-500/10"
          )}
        >
          {lockRace ? "⚠ RACE!" : lockFree ? "Lock Free" : `Held by ${step.lockHeldBy === "processA" ? "A" : "B"}`}
        </div>
      </div>
    </div>
  );

  // Helper for rendering a process column
  const renderProcessColumn = (
    processKey: "processA" | "processB",
    title: "Process A" | "Process B",
    accentColor: "sky" | "orange",
    state: string,
    codeLine: number | null,
    regValue: number | null,
    regName: string
  ) => {
    const isCritical = lockRace && (state === "running" || state === "busy-waiting");
    const isRunning = state === "running";
    const isSuspended = state === "suspended" || state === "idle";

    return (
      <div
        className={cn(
          "flex flex-col h-full transition-opacity duration-300",
          isSuspended ? "opacity-40" : "opacity-100"
        )}
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div
              className={cn(
                "w-9 h-9 rounded-xl flex items-center justify-center font-bold text-sm",
                accentColor === "sky"
                  ? "bg-sky-500/20 text-sky-500"
                  : "bg-orange-500/20 text-orange-500"
              )}
            >
              {processKey === "processA" ? "A" : "B"}
            </div>
            <div>
              <h2
                className={cn(
                  "text-base font-bold",
                  accentColor === "sky" ? "text-sky-500" : "text-orange-500"
                )}
              >
                {title}
              </h2>
              <div className="text-[10px] font-mono text-muted-foreground uppercase">
                {isTSL ? "TSL Hardware Spinlock" : "Software Variable"}
              </div>
            </div>
          </div>

          <div
            className={cn(
              "px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-widest border",
              isCritical
                ? "bg-rose-500/20 text-rose-500 border-rose-500/40 animate-pulse font-extrabold"
                : isRunning
                ? accentColor === "sky"
                  ? "bg-sky-500/20 text-sky-500 border-sky-500/30"
                  : "bg-orange-500/20 text-orange-500 border-orange-500/30"
                : "bg-muted text-muted-foreground border-transparent"
            )}
          >
            {state}
          </div>
        </div>

        {/* Code View with active line highlighting */}
        <div className="bg-[#1E1E1E] rounded-xl border border-[#333] overflow-hidden shadow-md font-mono text-xs mb-4">
          <div className="h-7 bg-[#2D2D2D] border-b border-[#333] flex items-center px-3 gap-1.5">
            <div className="w-2 h-2 rounded-full bg-[#FF5F56]" />
            <div className="w-2 h-2 rounded-full bg-[#FFBD2E]" />
            <div className="w-2 h-2 rounded-full bg-[#27C93F]" />
            <span className="ml-2 text-[10px] text-zinc-400">
              {processKey === "processA" ? "process_a.c" : "process_b.c"}
            </span>
          </div>

          <div className="p-3 min-h-[140px] space-y-0.5">
            {cCode.map((line, idx) => {
              const isLineActive = codeLine !== null && line.asmIdxs.includes(codeLine);
              return (
                <div
                  key={`code-line-${processKey}-${idx}-${line.text.slice(0, 10)}`}
                  className={cn(
                    "flex items-center justify-between py-0.5 px-2 rounded transition-colors text-[11px]",
                    isLineActive
                      ? accentColor === "sky"
                        ? "bg-sky-500/25 text-sky-200 font-bold"
                        : "bg-orange-500/25 text-orange-200 font-bold"
                      : line.isComment
                      ? "text-zinc-500 italic"
                      : "text-zinc-400"
                  )}
                >
                  <span className="truncate">{line.text || "\u00A0"}</span>
                  {line.btnType && (
                    <button
                      type="button"
                      onClick={() =>
                        setActiveAsmDialog({
                          process: processKey,
                          type: line.btnType!,
                        })
                      }
                      className="ml-2 px-1.5 py-0.2 rounded bg-white/5 hover:bg-white/10 text-[9px] text-zinc-400 hover:text-zinc-200 flex items-center gap-0.5 shrink-0"
                    >
                      {line.asmLabel}
                      <ArrowUpRight size={10} />
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Private Register */}
        <div
          className={cn(
            "mt-auto bg-card/60 rounded-xl border p-4 flex items-center justify-between",
            accentColor === "sky"
              ? "border-sky-500/20 text-sky-500"
              : "border-orange-500/20 text-orange-500"
          )}
        >
          <div>
            <div className="text-[10px] font-bold uppercase tracking-wider opacity-70 mb-0.5">
              Private Register
            </div>
            <div className="text-lg font-bold">{regName}</div>
          </div>
          <div className="text-3xl font-mono font-bold">
            {regValue !== null ? regValue : "—"}
          </div>
        </div>
      </div>
    );
  };

  // Assembly Dialog Content
  const codeModalContent = activeAsmDialog ? (
    <div className="space-y-3 font-mono text-sm leading-relaxed">
      <div className="text-xs text-zinc-400 border-b border-white/10 pb-2">
        Expanded assembly instructions executed by CPU:
      </div>
      <div className="space-y-1">
        {getAsmSnippet(isTSL, activeAsmDialog.type).map((line, i) => {
          const isTSLInstruction = line.includes("TSL");
          return (
            <div
              key={`asm-line-${i}`}
              className={cn(
                "p-2 rounded font-mono text-xs",
                isTSLInstruction
                  ? "bg-sky-500/15 border-l-2 border-sky-400 text-sky-300 font-bold"
                  : "bg-white/5 text-zinc-300"
              )}
            >
              {line}
            </div>
          );
        })}
      </div>
    </div>
  ) : null;

  return (
    <OSConcurrencyShell
      title="Episode 7: Lock Variables & Hardware TSL"
      subtitle={
        isTSL
          ? "Hardware Atomic Test-and-Set (TSL)"
          : "Software Flag Race Condition"
      }
      currentStepIndex={safeIndex}
      totalSteps={scenario.steps.length}
      isPlaying={isPlaying}
      onPlayPause={togglePlay}
      onNext={nextStep}
      onPrev={prevStep}
      onReset={reset}
      onStepSelect={setCurrentStepIndex}
      scenarios={[
        {
          id: LOCK_VARIABLE_SCENARIO_A.id,
          label: "Lock Fails",
          isActive: scenario.id === LOCK_VARIABLE_SCENARIO_A.id,
        },
        {
          id: LOCK_VARIABLE_SCENARIO_B.id,
          label: "TSL Fix",
          isActive: scenario.id === LOCK_VARIABLE_SCENARIO_B.id,
        },
      ]}
      onScenarioSelect={switchScenario}
      chapter={step.chapter}
      explanation={step.explanation}
      warningBadge={
        lockRace
          ? {
              text: "Mutual Exclusion Violated (Both in CS!)",
              icon: <AlertTriangle size={10} />,
            }
          : step.isAtomicTSL
          ? {
              text: "Atomic Hardware Execution",
              icon: <span>⚡</span>,
            }
          : null
      }
      sharedResourceSlot={sharedResource}
      processASlot={renderProcessColumn(
        "processA",
        "Process A",
        "sky",
        step.processAState,
        step.processACodeLine,
        step.registerRa,
        "Ra"
      )}
      processBSlot={renderProcessColumn(
        "processB",
        "Process B",
        "orange",
        step.processBState,
        step.processBCodeLine,
        step.registerRb,
        "Rb"
      )}
      noteTitle={step.noteTitle}
      noteContent={step.noteContent}
      fallbackNote={
        <div className="opacity-60 text-xs leading-relaxed space-y-3">
          <p>
            Software lock variables fail because checking (`LOCK == 1`) and claiming
            (`LOCK = 1`) are two distinct instructions.
          </p>
          <p>
            Hardware TSL (Test-and-Set) solves this by locking the memory bus, reading,
            and writing atomically in a single clock cycle.
          </p>
        </div>
      }
      isCodeModalOpen={activeAsmDialog !== null}
      onCloseCodeModal={() => setActiveAsmDialog(null)}
      codeModalTitle={
        activeAsmDialog?.process === "processA" ? "process_a.asm" : "process_b.asm"
      }
      codeModalContent={codeModalContent}
    />
  );
}
