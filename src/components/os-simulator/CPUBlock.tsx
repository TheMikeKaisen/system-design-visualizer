"use client";

import { AnimatePresence, motion } from "framer-motion";
import type { CPUState, OSProcess } from "@/lib/os-simulator/engine";
import { cn } from "@/lib/utils";

interface CPUBlockProps {
  cpu?: CPUState;
  process: OSProcess | null;
}

export function CPUBlock({ cpu, process }: CPUBlockProps) {
  const safeCpu: CPUState = cpu ?? { mode: "idle", utilizationPct: 0, currentProcess: null };
  const isIdle = safeCpu.mode === "idle";
  const isKernel = safeCpu.mode === "kernel";
  const showTimer = safeCpu.timerMs !== undefined && safeCpu.timerMs > 0;

  return (
    <motion.div
      layout
      animate={{
        boxShadow: isIdle
          ? "0 0 0 0 rgba(0,0,0,0)"
          : isKernel
          ? "0 0 32px -6px rgba(245,158,11,0.35)"
          : "0 0 32px -6px rgba(14,165,233,0.35)",
      }}
      transition={{ duration: 0.5 }}
      className={cn(
        "relative rounded-2xl border-2 p-5 transition-colors duration-500 min-h-[140px] flex flex-col",
        isIdle
          ? "border-border/60 dark:border-slate-700/80 bg-card/20"
          : isKernel
          ? "border-amber-500/60 bg-amber-500/5"
          : "border-sky-500/60 bg-sky-500/5"
      )}
    >
      {/* Pulsing ring when active */}
      {!isIdle && (
        <motion.div
          className={cn(
            "absolute inset-0 rounded-2xl border-2 pointer-events-none",
            isKernel ? "border-amber-500/20" : "border-sky-500/20"
          )}
          animate={{ opacity: [0.3, 0.8, 0.3], scale: [1, 1.01, 1] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        />
      )}

      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2.5">
          <div
            className={cn(
              "flex h-8 w-8 items-center justify-center rounded-lg text-xs font-bold",
              isIdle
                ? "bg-muted/50 text-muted-foreground"
                : isKernel
                ? "bg-amber-500/20 text-amber-500"
                : "bg-sky-500/20 text-sky-500"
            )}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <rect x="4" y="4" width="16" height="16" rx="2" />
              <rect x="9" y="9" width="6" height="6" />
              <path d="M15 2v2" /><path d="M15 20v2" /><path d="M2 15h2" /><path d="M2 9h2" />
              <path d="M20 15h2" /><path d="M20 9h2" /><path d="M9 2v2" /><path d="M9 20v2" />
            </svg>
          </div>
          <div>
            <h3 className={cn(
              "text-xs font-bold uppercase tracking-widest",
              isIdle ? "text-muted-foreground/50" : isKernel ? "text-amber-500" : "text-sky-500"
            )}>
              CPU
            </h3>
            <p className="text-[10px] text-muted-foreground/40 font-mono">
              {isIdle ? "IDLE" : isKernel ? "KERNEL MODE" : "USER MODE"}
            </p>
          </div>
        </div>

        {/* Mode badge */}
        <motion.span
          key={safeCpu.mode}
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className={cn(
            "rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-wider",
            isIdle
              ? "bg-muted/50 text-muted-foreground/50"
              : isKernel
              ? "bg-amber-500/20 text-amber-500"
              : "bg-sky-500/20 text-sky-500"
          )}
        >
          {safeCpu.mode}
        </motion.span>
      </div>

      {/* Process slot — the hero area */}
      <div className="flex-1 flex items-center justify-center">
        <AnimatePresence mode="wait">
          {process ? (
            /* Large in-CPU process card */
            <motion.div
              key={process.id}
              layoutId={`process-${process.id}`}
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              transition={{ type: "spring", stiffness: 260, damping: 24 }}
              className="w-full rounded-xl border-l-[6px] border border-t-sky-500/30 border-r-sky-500/30 border-b-sky-500/30 bg-sky-500/10 px-4 py-3 flex items-center gap-4"
              style={{ borderLeftColor: process.color }}
            >
              {/* Process color circle */}
              <div
                className="w-10 h-10 rounded-full flex-shrink-0 flex items-center justify-center text-white text-sm font-bold shadow-lg"
                style={{ backgroundColor: process.color }}
              >
                {process.name.charAt(0)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-base font-bold text-foreground truncate">{process.name}</p>
                <p className="text-xs font-mono text-muted-foreground/60">
                  {process.pid} · {process.memoryMB} MB
                  {process.cpuBurstMs !== undefined && ` · Burst: ${process.cpuBurstMs}ms`}
                </p>
              </div>
              {/* Running indicator dots */}
              <div className="flex gap-1 shrink-0">
                {[0, 1, 2].map((i) => (
                  <motion.div
                    key={`cpu-dot-${process.id}-${i}`}
                    className="w-1.5 h-1.5 rounded-full"
                    style={{ backgroundColor: process.color }}
                    animate={{ opacity: [0.3, 1, 0.3] }}
                    transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.2, ease: "easeInOut" }}
                  />
                ))}
              </div>
            </motion.div>
          ) : (
            /* Idle breathing state */
            <motion.div
              key="idle"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center py-6 gap-2"
            >
              <motion.div
                className="w-10 h-10 rounded-xl bg-muted/30 border border-dashed border-border/50 flex items-center justify-center"
                animate={{ scale: [1, 1.05, 1], opacity: [0.4, 0.7, 0.4] }}
                transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-muted-foreground/40">
                  <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
                </svg>
              </motion.div>
              <p className="text-xs italic text-muted-foreground/30">Waiting for process...</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Timer countdown (preemptive mode) */}
      <AnimatePresence>
        {showTimer && (
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 6 }}
            className="mt-4 flex items-center justify-center gap-2 rounded-lg bg-sky-500/10 py-1.5"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-sky-500">
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
            <span className="text-sm font-mono font-bold text-sky-500">{safeCpu.timerMs}ms</span>
            <span className="text-[10px] text-muted-foreground/50">remaining</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Utilization bar */}
      <div className="mt-4">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-[10px] text-muted-foreground/50 font-medium">Utilization</span>
          <span className="text-[10px] font-mono font-bold text-muted-foreground/60">{safeCpu.utilizationPct}%</span>
        </div>
        <div className="h-2 rounded-full bg-muted/40 overflow-hidden">
          <motion.div
            className={cn(
              "h-full rounded-full",
              isIdle
                ? "bg-muted-foreground/20"
                : isKernel
                ? "bg-gradient-to-r from-amber-500 to-orange-400"
                : "bg-gradient-to-r from-sky-500 to-emerald-400"
            )}
            initial={false}
            animate={{ width: `${safeCpu.utilizationPct}%` }}
            transition={{ duration: 0.5, ease: "easeOut" }}
          />
        </div>
      </div>
    </motion.div>
  );
}
