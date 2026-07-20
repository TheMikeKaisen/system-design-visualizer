"use client";

import { AnimatePresence, motion } from "framer-motion";
import type { CPUState, OSProcess } from "@/lib/os-simulator/engine";
import { ProcessCard } from "./ProcessCard";
import { cn } from "@/lib/utils";

interface CPUBlockProps {
  cpu: CPUState;
  /** The process currently on the CPU (null if idle) */
  process: OSProcess | null;
}

export function CPUBlock({ cpu, process }: CPUBlockProps) {
  const isIdle = cpu.mode === "idle";
  const isKernel = cpu.mode === "kernel";
  const showTimer = cpu.timerMs !== undefined && cpu.timerMs > 0;

  return (
    <div
      className={cn(
        "relative rounded-2xl border-2 p-4 transition-all duration-500",
        isIdle
          ? "border-border/40 bg-card/30"
          : isKernel
          ? "border-amber-500/60 bg-amber-500/5 shadow-[0_0_24px_-4px_rgba(245,158,11,0.25)]"
          : "border-teal-500/60 bg-teal-500/5 shadow-[0_0_24px_-4px_rgba(6,182,212,0.3)]"
      )}
    >
      {/* Header */}
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div
            className={cn(
              "flex h-6 w-6 items-center justify-center rounded-md text-xs font-bold",
              isIdle
                ? "bg-muted text-muted-foreground"
                : isKernel
                ? "bg-amber-500/20 text-amber-500"
                : "bg-teal-500/20 text-teal-500"
            )}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <rect x="4" y="4" width="16" height="16" rx="2" />
              <rect x="9" y="9" width="6" height="6" />
              <path d="M15 2v2" /><path d="M15 20v2" /><path d="M2 15h2" /><path d="M2 9h2" />
              <path d="M20 15h2" /><path d="M20 9h2" /><path d="M9 2v2" /><path d="M9 20v2" />
            </svg>
          </div>
          <h3 className={cn(
            "text-xs font-bold uppercase tracking-widest",
            isIdle ? "text-muted-foreground/60" : isKernel ? "text-amber-500" : "text-teal-500"
          )}>
            CPU
          </h3>
        </div>

        {/* Mode badge */}
        <span
          className={cn(
            "rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider",
            isIdle
              ? "bg-muted text-muted-foreground/60"
              : isKernel
              ? "bg-amber-500/20 text-amber-500"
              : "bg-teal-500/20 text-teal-500"
          )}
        >
          {cpu.mode}
        </span>
      </div>

      {/* Process slot */}
      <div className="min-h-[44px] flex items-center justify-center">
        <AnimatePresence mode="wait">
          {process ? (
            <ProcessCard key={process.id} process={process} isInCPU />
          ) : (
            <motion.p
              key="idle"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-sm italic text-muted-foreground/40"
            >
              Idle — No process running
            </motion.p>
          )}
        </AnimatePresence>
      </div>

      {/* Timer countdown (preemptive mode) */}
      <AnimatePresence>
        {showTimer && (
          <motion.div
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 4 }}
            className="mt-3 flex items-center justify-center gap-2"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-teal-500/70">
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
            <span className="text-xs font-mono font-bold text-teal-500">
              {cpu.timerMs}ms
            </span>
            <span className="text-[10px] text-muted-foreground/50">remaining</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Utilization bar */}
      <div className="mt-3">
        <div className="flex items-center justify-between mb-1">
          <span className="text-[10px] text-muted-foreground/50">Utilization</span>
          <span className="text-[10px] font-mono text-muted-foreground/50">{cpu.utilizationPct}%</span>
        </div>
        <div className="h-1 rounded-full bg-muted/50 overflow-hidden">
          <motion.div
            className={cn(
              "h-full rounded-full",
              isIdle ? "bg-muted-foreground/20" : isKernel ? "bg-amber-500" : "bg-teal-500"
            )}
            initial={false}
            animate={{ width: `${cpu.utilizationPct}%` }}
            transition={{ duration: 0.5 }}
          />
        </div>
      </div>
    </div>
  );
}
