"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { Box, Cpu, Code, AlertTriangle } from "lucide-react";
import { OSConcurrencyShell } from "@/components/os-simulator/OSConcurrencyShell";
import {
  PRODUCER_CONSUMER_SCENARIO_A,
  PRODUCER_CONSUMER_SCENARIO_B,
  PCScenario,
} from "@/lib/os-simulator/producer-consumer-scenario";

const PRODUCER_CODE = ["LOAD Rp, count", "INC Rp", "STORE Rp, count"];
const CONSUMER_CODE = ["LOAD Rc, count", "DEC Rc", "STORE Rc, count"];

export default function ProducerConsumerSimulator() {
  const [scenario, setScenario] = useState<PCScenario>(PRODUCER_CONSUMER_SCENARIO_A);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [activeCodeDialog, setActiveCodeDialog] = useState<"producer" | "consumer" | null>(null);

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
      scenarioId === PRODUCER_CONSUMER_SCENARIO_B.id
        ? PRODUCER_CONSUMER_SCENARIO_B
        : PRODUCER_CONSUMER_SCENARIO_A;
    setScenario(target);
    setCurrentStepIndex(0);
    setIsPlaying(false);
  };

  const isCorrupted =
    step.sharedMemoryCount !== 3 &&
    step.activeThread === "none" &&
    step.producerState === "terminated" &&
    step.consumerState === "terminated";

  // Top Shared Buffer + Central Shared Memory Count
  const sharedResource = (
    <div className="flex flex-col items-center gap-3">
      <div className="flex items-center justify-between w-full max-w-2xl px-2">
        <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
          Shared Bounded Buffer (Size = 5)
        </span>
        <span className="text-xs font-mono font-bold text-sky-500 dark:text-sky-400">
          shared_count = {step.sharedMemoryCount}
        </span>
      </div>

      <div className="flex gap-2.5 p-3 bg-background/60 rounded-2xl border border-border/50 shadow-inner">
        {step.buffer.map((slot, i) => (
          <div
            key={`buffer-slot-${i}`}
            className={cn(
              "w-12 h-12 rounded-xl flex items-center justify-center border transition-all duration-300",
              slot
                ? "bg-sky-500/20 border-sky-500/40 shadow-[0_0_15px_-3px_rgba(14,165,233,0.35)]"
                : "bg-muted/30 border-transparent border-dashed"
            )}
          >
            <AnimatePresence mode="popLayout">
              {slot && (
                <motion.div
                  initial={{ scale: 0, opacity: 0, y: -16 }}
                  animate={{ scale: 1, opacity: 1, y: 0 }}
                  exit={{ scale: 0, opacity: 0, y: 16 }}
                  transition={{ type: "spring", bounce: 0.4 }}
                >
                  <Box className="w-6 h-6 text-sky-500 dark:text-sky-400" />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ))}
      </div>
    </div>
  );

  // Producer Column (Thread A)
  const producerSlot = (
    <div
      className={cn(
        "flex flex-col h-full transition-opacity duration-300",
        step.producerState === "suspended" || step.producerState === "idle"
          ? "opacity-40"
          : "opacity-100"
      )}
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-500 flex items-center justify-center">
            <Cpu className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-amber-500">Producer Thread</h2>
              <button
                type="button"
                onClick={() => setActiveCodeDialog("producer")}
                className="p-1 rounded hover:bg-amber-500/20 text-amber-500/70 hover:text-amber-500 transition-colors"
                title="View C Code"
              >
                <Code size={15} />
              </button>
            </div>
            <div className="text-[10px] font-mono text-amber-500/70 uppercase">
              count = count + 1
            </div>
          </div>
        </div>
        <div
          className={cn(
            "px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-widest border",
            step.producerState === "running"
              ? "bg-amber-500/20 text-amber-500 border-amber-500/30 animate-pulse"
              : "bg-muted text-muted-foreground border-transparent"
          )}
        >
          {step.producerState}
        </div>
      </div>

      {/* Assembly code box */}
      <div className="bg-[#1E1E1E] rounded-xl border border-[#333] overflow-hidden shadow-md font-mono text-xs mb-4">
        <div className="h-7 bg-[#2D2D2D] border-b border-[#333] flex items-center px-3 gap-1.5">
          <div className="w-2 h-2 rounded-full bg-[#FF5F56]" />
          <div className="w-2 h-2 rounded-full bg-[#FFBD2E]" />
          <div className="w-2 h-2 rounded-full bg-[#27C93F]" />
          <span className="ml-2 text-[10px] text-zinc-400">producer.asm</span>
        </div>
        <div className="p-3 min-h-[90px]">
          {PRODUCER_CODE.map((line, i) => (
            <div
              key={`producer-line-${i}`}
              className={cn(
                "flex items-center gap-3 py-1 px-2 rounded transition-colors",
                step.producerCodeLine === i
                  ? "bg-amber-500/20 text-amber-300 font-bold"
                  : "text-zinc-400"
              )}
            >
              <span className="opacity-30 select-none w-3 text-[10px]">{i + 1}</span>
              <span className="flex-1">{line}</span>
              {step.producerCodeLine === i && (
                <div className="w-1.5 h-3.5 bg-amber-500 rounded-sm animate-pulse" />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Register Rp */}
      <div className="mt-auto bg-card/60 rounded-xl border border-amber-500/20 p-4 flex items-center justify-between">
        <div>
          <div className="text-[10px] font-bold uppercase tracking-wider text-amber-500/70 mb-0.5">
            Private Register
          </div>
          <div className="text-lg font-bold text-amber-500">Rp</div>
        </div>
        <div className="text-3xl font-mono text-amber-500 font-bold">
          {step.registerRp !== null ? step.registerRp : "—"}
        </div>
      </div>
    </div>
  );

  // Consumer Column (Thread B)
  const consumerSlot = (
    <div
      className={cn(
        "flex flex-col h-full transition-opacity duration-300",
        step.consumerState === "suspended" || step.consumerState === "idle"
          ? "opacity-40"
          : "opacity-100"
      )}
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-violet-500/20 text-violet-500 flex items-center justify-center">
            <Cpu className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-violet-500">Consumer Thread</h2>
              <button
                type="button"
                onClick={() => setActiveCodeDialog("consumer")}
                className="p-1 rounded hover:bg-violet-500/20 text-violet-500/70 hover:text-violet-500 transition-colors"
                title="View C Code"
              >
                <Code size={15} />
              </button>
            </div>
            <div className="text-[10px] font-mono text-violet-500/70 uppercase">
              count = count - 1
            </div>
          </div>
        </div>
        <div
          className={cn(
            "px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-widest border",
            step.consumerState === "running"
              ? "bg-violet-500/20 text-violet-500 border-violet-500/30 animate-pulse"
              : "bg-muted text-muted-foreground border-transparent"
          )}
        >
          {step.consumerState}
        </div>
      </div>

      {/* Assembly code box */}
      <div className="bg-[#1E1E1E] rounded-xl border border-[#333] overflow-hidden shadow-md font-mono text-xs mb-4">
        <div className="h-7 bg-[#2D2D2D] border-b border-[#333] flex items-center px-3 gap-1.5">
          <div className="w-2 h-2 rounded-full bg-[#FF5F56]" />
          <div className="w-2 h-2 rounded-full bg-[#FFBD2E]" />
          <div className="w-2 h-2 rounded-full bg-[#27C93F]" />
          <span className="ml-2 text-[10px] text-zinc-400">consumer.asm</span>
        </div>
        <div className="p-3 min-h-[90px]">
          {CONSUMER_CODE.map((line, i) => (
            <div
              key={`consumer-line-${i}`}
              className={cn(
                "flex items-center gap-3 py-1 px-2 rounded transition-colors",
                step.consumerCodeLine === i
                  ? "bg-violet-500/20 text-violet-300 font-bold"
                  : "text-zinc-400"
              )}
            >
              <span className="opacity-30 select-none w-3 text-[10px]">{i + 1}</span>
              <span className="flex-1">{line}</span>
              {step.consumerCodeLine === i && (
                <div className="w-1.5 h-3.5 bg-violet-500 rounded-sm animate-pulse" />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Register Rc */}
      <div className="mt-auto bg-card/60 rounded-xl border border-violet-500/20 p-4 flex items-center justify-between">
        <div>
          <div className="text-[10px] font-bold uppercase tracking-wider text-violet-500/70 mb-0.5">
            Private Register
          </div>
          <div className="text-lg font-bold text-violet-500">Rc</div>
        </div>
        <div className="text-3xl font-mono text-violet-500 font-bold">
          {step.registerRc !== null ? step.registerRc : "—"}
        </div>
      </div>
    </div>
  );

  // Modal code dialog
  const codeModalContent = (
    <div className="space-y-4">
      <div className="whitespace-pre text-xs sm:text-sm">
        <span className="text-[#569CD6]">while</span> (true) {"{\n"}
        {activeCodeDialog === "producer" ? (
          <>
            {"    "}
            <span className="text-[#6A9955]">{"/* produce an item */"}</span>
            {"\n    "}
            <span className="text-[#569CD6]">while</span> (count == BUFFER_SIZE) {"{\n"}
            {"        "}
            <span className="text-[#6A9955]">{"/* buffer is full */"}</span>
            {"\n    }\n\n"}
            {"    "}buffer[in] = item;{"\n"}
            {"    "}in = (in + 1) % BUFFER_SIZE;{"\n\n"}
            <div className="bg-amber-500/10 border-l-4 border-amber-500 -mx-6 px-6 py-2 my-2">
              <span className="text-[#6A9955] block -mt-1 mb-1">
                {"// CRITICAL SECTION (The 3 Assembly Instructions)"}
              </span>
              count++;
            </div>
          </>
        ) : (
          <>
            {"    "}
            <span className="text-[#569CD6]">while</span> (count == 0) {"{\n"}
            {"        "}
            <span className="text-[#6A9955]">{"/* buffer is empty */"}</span>
            {"\n    }\n\n"}
            {"    "}item = buffer[out];{"\n"}
            {"    "}out = (out + 1) % BUFFER_SIZE;{"\n\n"}
            <div className="bg-violet-500/10 border-l-4 border-violet-500 -mx-6 px-6 py-2 my-2">
              <span className="text-[#6A9955] block -mt-1 mb-1">
                {"// CRITICAL SECTION (The 3 Assembly Instructions)"}
              </span>
              count--;
            </div>
          </>
        )}
        {"}"}
      </div>
    </div>
  );

  return (
    <OSConcurrencyShell
      title="Episode 5: Producer-Consumer Problem"
      subtitle={
        scenario.id === PRODUCER_CONSUMER_SCENARIO_A.id
          ? "Preemptive Race Condition"
          : "Synchronized Execution"
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
          id: PRODUCER_CONSUMER_SCENARIO_A.id,
          label: "Scenario A",
          isActive: scenario.id === PRODUCER_CONSUMER_SCENARIO_A.id,
        },
        {
          id: PRODUCER_CONSUMER_SCENARIO_B.id,
          label: "Scenario B",
          isActive: scenario.id === PRODUCER_CONSUMER_SCENARIO_B.id,
        },
      ]}
      onScenarioSelect={switchScenario}
      chapter={step.chapter}
      explanation={step.explanation}
      warningBadge={
        isCorrupted
          ? {
              text: "Data Corruption (count != 3)",
              icon: <AlertTriangle size={10} />,
            }
          : null
      }
      sharedResourceSlot={sharedResource}
      processASlot={producerSlot}
      processBSlot={consumerSlot}
      noteTitle={step.noteTitle}
      noteContent={step.noteContent}
      fallbackNote={
        <div className="opacity-60 text-xs leading-relaxed space-y-3">
          <p>
            The Producer-Consumer problem models processes sharing a fixed-size
            buffer as a circular queue.
          </p>
          <p>
            Notice how updating the shared count variable requires 3 assembly
            instructions (LOAD, INC/DEC, STORE). If preemption occurs mid-update,
            values are lost!
          </p>
        </div>
      }
      isCodeModalOpen={activeCodeDialog !== null}
      onCloseCodeModal={() => setActiveCodeDialog(null)}
      codeModalTitle={activeCodeDialog === "producer" ? "producer.c" : "consumer.c"}
      codeModalContent={codeModalContent}
    />
  );
}
