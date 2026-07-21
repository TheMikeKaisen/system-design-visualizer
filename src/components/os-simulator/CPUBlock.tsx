"use client";

import { AnimatePresence, motion } from "framer-motion";
import type { CPUState, OSProcess } from "@/lib/os-simulator/engine";
import { cn } from "@/lib/utils";

interface CPUBlockProps {
  cpu: CPUState;
  process: OSProcess | null;
}

export function CPUBlock({ cpu, process }: CPUBlockProps) {
  const isIdle = cpu.mode === "idle";
  const isKernel = cpu.mode === "kernel";
  const showTimer = cpu.timerMs !== undefined && cpu.timerMs > 0;

  return (
    <motion.div
      layout
      animate={{
        boxShadow: isIdle
          ? "0 0 0 0 rgba(0,0,0,0)"
          : isKernel
          ? "0 0 32px -6px rgba(245,158,11,0.35)"
          : "0 0 32px -6px rgba(6,182,212,0.35)",
      }}
      transition={{ duration: 0.5 }}
      className={cn(
        "relative rounded-2xl border-2 p-5 transition-colors duration-500 min-h-[140px] flex flex-col",
        isIdle
          ? "border-border/60 dark:border-slate-700/80 bg-card/20"
          : isKernel
          ? "border-amber-500/60 bg-amber-500/5"
          : "border-teal-500/60 bg-teal-500/5"
      )}
    >
      {/* Pulsing ring when active */}
      {!isIdle && (
        <motion.div
          className={cn(
            "absolute inset-0 rounded-2xl border-2 pointer-events-none",
            isKernel ? "border-amber-500/20" : "border-teal-500/20"
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
                : "bg-teal-500/20 text-teal-500"
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
              isIdle ? "text-muted-foreground/50" : isKernel ? "text-amber-500" : "text-teal-500"
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
          key={cpu.mode}
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className={cn(
            "rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-wider",
            isIdle
              ? "bg-muted/50 text-muted-foreground/50"
              : isKernel
              ? "bg-amber-500/20 text-amber-500"
              : "bg-teal-500/20 text-teal-500"
          )}
        >
          {cpu.mode}
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
              className="w-full rounded-xl border-l-[6px] border border-t-teal-500/30 border-r-teal-500/30 border-b-teal-500/30 bg-teal-500/10 px-4 py-3 flex items-center gap-4"
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
                <p className="text-xs font-mono text-muted-foreground/60">{process.pid} · {process.memoryMB} MB</p>
              </div>
              {/* Running indicator dots */}
              <div className="flex gap-1 shrink-0">
                {[0, 1, 2].map((i) => (
                  <motion.div
                    key={i}
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
              className="flex flex-col items-center gap-2"
            >
              <motion.div
                animate={{ opacity: [0.25, 0.5, 0.25] }}
                transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
              >
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-muted-foreground/30">
                  <rect x="4" y="4" width="16" height="16" rx="2" />
                  <rect x="9" y="9" width="6" height="6" />
                  <path d="M15 2v2" /><path d="M15 20v2" /><path d="M2 15h2" /><path d="M2 9h2" />
                  <path d="M20 15h2" /><path d="M20 9h2" /><path d="M9 2v2" /><path d="M9 20v2" />
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
            className="mt-4 flex items-center justify-center gap-2 rounded-lg bg-teal-500/10 py-1.5"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-teal-500">
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
            <span className="text-sm font-mono font-bold text-teal-500">{cpu.timerMs}ms</span>
            <span className="text-[10px] text-muted-foreground/50">remaining</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Utilization bar */}
      <div className="mt-4">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-[10px] text-muted-foreground/50 font-medium">Utilization</span>
          <span className="text-[10px] font-mono font-bold text-muted-foreground/60">{cpu.utilizationPct}%</span>
        </div>
        <div className="h-2 rounded-full bg-muted/40 overflow-hidden">
          <motion.div
            className={cn(
              "h-full rounded-full",
              isIdle
                ? "bg-muted-foreground/20"
                : isKernel
                ? "bg-gradient-to-r from-amber-500 to-orange-400"
                : "bg-gradient-to-r from-teal-500 to-emerald-400"
            )}
            initial={false}
            animate={{ width: `${cpu.utilizationPct}%` }}
            transition={{ duration: 0.5, ease: "easeOut" }}
          />
        </div>
      </div>
    </motion.div>
  );
}
