"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { FileText, Cpu, Code, AlertTriangle } from "lucide-react";
import { OSConcurrencyShell } from "@/components/os-simulator/OSConcurrencyShell";
import {
  PRINTER_SPOOLER_SCENARIO_A,
  PRINTER_SPOOLER_SCENARIO_B,
  SpoolerScenario,
} from "@/lib/os-simulator/printer-spooler-scenario";

const PROCESS_A_CODE = ["LOAD Ra, IN", "WRITE slot[Ra], A", "STORE IN, Ra+1"];
const PROCESS_B_CODE = ["LOAD Rb, IN", "WRITE slot[Rb], B", "STORE IN, Rb+1"];

export default function PrinterSpoolerSimulator() {
  const [scenario, setScenario] = useState<SpoolerScenario>(PRINTER_SPOOLER_SCENARIO_A);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [activeCodeDialog, setActiveCodeDialog] = useState<"processA" | "processB" | null>(null);

  const safeIndex =
    scenario.steps.length > 0
      ? Math.max(0, Math.min(currentStepIndex, scenario.steps.length - 1))
      : 0;
  const step = scenario.steps[safeIndex];

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
      scenarioId === PRINTER_SPOOLER_SCENARIO_B.id
        ? PRINTER_SPOOLER_SCENARIO_B
        : PRINTER_SPOOLER_SCENARIO_A;
    setScenario(target);
    setCurrentStepIndex(0);
    setIsPlaying(false);
  };

  const isCorrupted = step.corruptedSlot !== null;

  // Shared Spooler Directory Slot
  const sharedResource = (
    <div className="flex flex-col items-center gap-3">
      <div className="flex items-center justify-between w-full max-w-2xl px-2">
        <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
          Printer Spooler Directory (Shared Disk Slots)
        </span>
        <span className="text-xs font-mono font-bold text-sky-500 dark:text-sky-400">
          next_free_slot (IN) = {step.sharedIN}
        </span>
      </div>

      <div className="flex gap-2.5 p-3 bg-background/60 rounded-2xl border border-border/50 shadow-inner mt-2 relative">
        {/* Dynamic pointer */}
        <motion.div
          className="absolute -top-6 flex flex-col items-center justify-center text-[10px] font-bold text-rose-500"
          animate={{ x: step.sharedIN * 64 }}
          transition={{ type: "spring", stiffness: 300, damping: 22 }}
          style={{ left: "16px" }}
        >
          <div className="bg-rose-500 text-white px-2 py-0.5 rounded-full shadow-md text-[9px] font-mono">
            IN={step.sharedIN}
          </div>
          <div className="w-0 h-0 border-l-[4px] border-l-transparent border-r-[4px] border-r-transparent border-t-[5px] border-t-rose-500 mt-0.5" />
        </motion.div>

        {step.spoolerSlots.map((slot, i) => (
          <div
            key={`spooler-slot-${i}`}
            className={cn(
              "w-14 h-16 rounded-xl flex flex-col items-center justify-center border transition-all duration-300 relative",
              i === step.corruptedSlot
                ? "bg-rose-500/20 border-rose-500 text-rose-500 shadow-[0_0_18px_-3px_rgba(244,63,94,0.4)]"
                : slot
                ? "bg-sky-500/10 border-sky-500/30 text-sky-500"
                : "bg-muted/30 border-transparent border-dashed text-muted-foreground/30"
            )}
          >
            <AnimatePresence mode="popLayout">
              {slot && (
                <motion.div
                  key={`slot-item-${slot}-${i}`}
                  initial={{ scale: 0, opacity: 0, y: -16 }}
                  animate={{ scale: 1, opacity: 1, y: 0 }}
                  exit={{ scale: 0, opacity: 0, y: 16 }}
                  transition={{ type: "spring", bounce: 0.4 }}
                  className="flex flex-col items-center"
                >
                  <FileText className="w-5 h-5 mb-0.5" />
                  <span className="text-[8px] font-mono whitespace-nowrap overflow-hidden text-ellipsis max-w-[48px]">
                    {slot}
                  </span>
                </motion.div>
              )}
            </AnimatePresence>

            {i === step.corruptedSlot && (
              <div className="absolute -bottom-3 bg-rose-500 text-white text-[8px] font-bold px-1.5 py-0.2 rounded shadow whitespace-nowrap z-10 flex items-center gap-0.5">
                <AlertTriangle size={8} />
                OVERWRITTEN
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );

  // Process A Slot (Left)
  const processASlot = (
    <div
      className={cn(
        "flex flex-col h-full transition-opacity duration-300",
        step.processAState === "suspended" || step.processAState === "idle"
          ? "opacity-40"
          : "opacity-100"
      )}
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-cyan-500/20 text-cyan-500 flex items-center justify-center">
            <Cpu className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-cyan-500">Process A</h2>
              <button
                type="button"
                onClick={() => setActiveCodeDialog("processA")}
                className="p-1 rounded hover:bg-cyan-500/20 text-cyan-500/70 hover:text-cyan-500 transition-colors"
                title="View C Code"
              >
                <Code size={15} />
              </button>
            </div>
            <div className="text-[10px] font-mono text-cyan-500/70 uppercase">
              enqueue(&quot;photo.jpg&quot;)
            </div>
          </div>
        </div>
        <div
          className={cn(
            "px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-widest border",
            step.processAState === "running"
              ? "bg-cyan-500/20 text-cyan-500 border-cyan-500/30 animate-pulse"
              : "bg-muted text-muted-foreground border-transparent"
          )}
        >
          {step.processAState}
        </div>
      </div>

      {/* Assembly code box */}
      <div className="bg-[#1E1E1E] rounded-xl border border-[#333] overflow-hidden shadow-md font-mono text-xs mb-4">
        <div className="h-7 bg-[#2D2D2D] border-b border-[#333] flex items-center px-3 gap-1.5">
          <div className="w-2 h-2 rounded-full bg-[#FF5F56]" />
          <div className="w-2 h-2 rounded-full bg-[#FFBD2E]" />
          <div className="w-2 h-2 rounded-full bg-[#27C93F]" />
          <span className="ml-2 text-[10px] text-zinc-400">process_a.asm</span>
        </div>
        <div className="p-3 min-h-[90px]">
          {PROCESS_A_CODE.map((line, i) => (
            <div
              key={`process-a-line-${i}`}
              className={cn(
                "flex items-center gap-3 py-1 px-2 rounded transition-colors",
                step.processACodeLine === i
                  ? "bg-cyan-500/20 text-cyan-300 font-bold"
                  : "text-zinc-500"
              )}
            >
              <span className="opacity-40 select-none w-3 text-[10px]">{i + 1}</span>
              <span className="flex-1">{line}</span>
              {step.processACodeLine === i && (
                <div className="w-1.5 h-3.5 bg-cyan-500 rounded-sm animate-pulse" />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Register Ra */}
      <div className="mt-auto bg-card/60 rounded-xl border border-cyan-500/20 p-4 flex items-center justify-between">
        <div>
          <div className="text-[10px] font-bold uppercase tracking-wider text-cyan-500/70 mb-0.5">
            Private Register
          </div>
          <div className="text-lg font-bold text-cyan-500">Ra</div>
        </div>
        <div className="text-3xl font-mono text-cyan-500 font-bold">
          {step.registerRa !== null ? step.registerRa : "—"}
        </div>
      </div>
    </div>
  );

  // Process B Slot (Right)
  const processBSlot = (
    <div
      className={cn(
        "flex flex-col h-full transition-opacity duration-300",
        step.processBState === "suspended" || step.processBState === "idle"
          ? "opacity-40"
          : "opacity-100"
      )}
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-orange-500/20 text-orange-500 flex items-center justify-center">
            <Cpu className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-orange-500">Process B</h2>
              <button
                type="button"
                onClick={() => setActiveCodeDialog("processB")}
                className="p-1 rounded hover:bg-orange-500/20 text-orange-500/70 hover:text-orange-500 transition-colors"
                title="View C Code"
              >
                <Code size={15} />
              </button>
            </div>
            <div className="text-[10px] font-mono text-orange-500/70 uppercase">
              enqueue(&quot;report.pdf&quot;)
            </div>
          </div>
        </div>
        <div
          className={cn(
            "px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-widest border",
            step.processBState === "running"
              ? "bg-orange-500/20 text-orange-500 border-orange-500/30 animate-pulse"
              : "bg-muted text-muted-foreground border-transparent"
          )}
        >
          {step.processBState}
        </div>
      </div>

      {/* Assembly code box */}
      <div className="bg-[#1E1E1E] rounded-xl border border-[#333] overflow-hidden shadow-md font-mono text-xs mb-4">
        <div className="h-7 bg-[#2D2D2D] border-b border-[#333] flex items-center px-3 gap-1.5">
          <div className="w-2 h-2 rounded-full bg-[#FF5F56]" />
          <div className="w-2 h-2 rounded-full bg-[#FFBD2E]" />
          <div className="w-2 h-2 rounded-full bg-[#27C93F]" />
          <span className="ml-2 text-[10px] text-zinc-400">process_b.asm</span>
        </div>
        <div className="p-3 min-h-[90px]">
          {PROCESS_B_CODE.map((line, i) => (
            <div
              key={`process-b-line-${i}`}
              className={cn(
                "flex items-center gap-3 py-1 px-2 rounded transition-colors",
                step.processBCodeLine === i
                  ? "bg-orange-500/20 text-orange-300 font-bold"
                  : "text-zinc-500"
              )}
            >
              <span className="opacity-40 select-none w-3 text-[10px]">{i + 1}</span>
              <span className="flex-1">{line}</span>
              {step.processBCodeLine === i && (
                <div className="w-1.5 h-3.5 bg-orange-500 rounded-sm animate-pulse" />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Register Rb */}
      <div className="mt-auto bg-card/60 rounded-xl border border-orange-500/20 p-4 flex items-center justify-between">
        <div>
          <div className="text-[10px] font-bold uppercase tracking-wider text-orange-500/70 mb-0.5">
            Private Register
          </div>
          <div className="text-lg font-bold text-orange-500">Rb</div>
        </div>
        <div className="text-3xl font-mono text-orange-500 font-bold">
          {step.registerRb !== null ? step.registerRb : "—"}
        </div>
      </div>
    </div>
  );

  // Modal code dialog
  const codeModalContent = (
    <div className="space-y-4">
      <div className="whitespace-pre text-xs sm:text-sm">
        <span className="text-[#569CD6]">void</span>{" "}
        <span className="text-[#DCDCAA]">print_file</span>(char *filename) {"{\n"}
        {"    "}
        <span className="text-[#6A9955]">{"/* Read next available slot */"}</span>
        {"\n"}
        {"    "}
        <span className="text-[#9CDCFE]">int</span> next_free_slot = IN;{"\n\n"}
        <div className="bg-amber-500/10 border-l-4 border-amber-500 -mx-6 px-6 py-2 my-2">
          <span className="text-[#6A9955] block -mt-1 mb-1">
            {"// VULNERABLE WINDOW (Preemption Here Triggers Lost Update)"}
          </span>
          spooler_dir[next_free_slot] = filename;{"\n"}
          IN = next_free_slot + 1;
        </div>
        {"}"}
      </div>
    </div>
  );

  return (
    <OSConcurrencyShell
      title="Episode 6: Printer Spooler Problem"
      subtitle={
        scenario.id === PRINTER_SPOOLER_SCENARIO_A.id
          ? "Unsynchronized Spooler Directory"
          : "Synchronized Mutex Execution"
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
          id: PRINTER_SPOOLER_SCENARIO_A.id,
          label: "Scenario A",
          isActive: scenario.id === PRINTER_SPOOLER_SCENARIO_A.id,
        },
        {
          id: PRINTER_SPOOLER_SCENARIO_B.id,
          label: "Scenario B",
          isActive: scenario.id === PRINTER_SPOOLER_SCENARIO_B.id,
        },
      ]}
      onScenarioSelect={switchScenario}
      chapter={step.chapter}
      explanation={step.explanation}
      warningBadge={
        isCorrupted
          ? {
              text: "Silent Data Loss (Slot Overwritten)",
              icon: <AlertTriangle size={10} />,
            }
          : null
      }
      sharedResourceSlot={sharedResource}
      processASlot={processASlot}
      processBSlot={processBSlot}
      noteTitle={step.noteTitle}
      noteContent={step.noteContent}
      fallbackNote={
        <div className="opacity-60 text-xs leading-relaxed space-y-3">
          <p>
            When two independent processes read the shared pointer `IN` simultaneously
            before either increments it, both write to the exact same slot.
          </p>
          <p>
            One file is silently erased forever with zero OS warnings or error messages!
          </p>
        </div>
      }
      isCodeModalOpen={activeCodeDialog !== null}
      onCloseCodeModal={() => setActiveCodeDialog(null)}
      codeModalTitle={activeCodeDialog === "processA" ? "process_a.c" : "process_b.c"}
      codeModalContent={codeModalContent}
    />
  );
}
