"use client";

import { motion, AnimatePresence } from "framer-motion";
import type { CPUState, MemoryState, OSProcess } from "@/lib/os-simulator/engine";
import { MemoryGauge } from "./MemoryGauge";
import { cn } from "@/lib/utils";

interface OSStatsSidebarProps {
  cpu: CPUState;
  memory: MemoryState;
  processes: Record<string, OSProcess>;
  contextSwitchCount: number;
}

const STATE_LEGEND = [
  { label: "New", color: "#94a3b8", dot: "bg-slate-400" },
  { label: "Ready", color: "#60a5fa", dot: "bg-blue-400" },
  { label: "Running", color: "#2dd4bf", dot: "bg-teal-400" },
  { label: "Waiting", color: "#fbbf24", dot: "bg-amber-400" },
  { label: "Terminated", color: "#f87171", dot: "bg-rose-400" },
];

export function OSStatsSidebar({
  cpu,
  memory,
  processes,
  contextSwitchCount,
}: OSStatsSidebarProps) {
  const isIdle = cpu.mode === "idle";
  const isKernel = cpu.mode === "kernel";
  const pct = cpu.utilizationPct;

  // SVG ring config
  const radius = 36;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (pct / 100) * circumference;
  const ringColor = isIdle ? "#374151" : isKernel ? "#f59e0b" : "#14b8a6";

  // Active processes list
  const allProcesses = Object.values(processes);
  const activeProcs = allProcesses.filter((p) => p.state !== "terminated");

  return (
    <div className="flex flex-col gap-4 h-full overflow-y-auto">

      {/* ── CPU RING GAUGE ── */}
      <div className="rounded-xl border border-border/40 bg-card/50 p-4">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-6 h-6 rounded-md bg-muted/50 flex items-center justify-center">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-muted-foreground/60">
              <rect x="4" y="4" width="16" height="16" rx="2" />
              <rect x="9" y="9" width="6" height="6" />
              <path d="M15 2v2" /><path d="M15 20v2" /><path d="M2 15h2" /><path d="M2 9h2" />
              <path d="M20 15h2" /><path d="M20 9h2" /><path d="M9 2v2" /><path d="M9 20v2" />
            </svg>
          </div>
          <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">
            CPU
          </span>
          <span className={cn(
            "ml-auto text-[10px] font-bold uppercase px-2 py-0.5 rounded-full",
            isIdle ? "bg-muted/50 text-muted-foreground/50" : isKernel ? "bg-amber-500/20 text-amber-500" : "bg-teal-500/20 text-teal-500"
          )}>
            {cpu.mode}
          </span>
        </div>

        {/* Ring */}
        <div className="flex flex-col items-center gap-2">
          <div className="relative">
            <svg width="96" height="96" viewBox="0 0 96 96" className="-rotate-90">
              {/* Background track */}
              <circle
                cx="48" cy="48" r={radius}
                fill="none"
                stroke="#1f2937"
                strokeWidth="8"
              />
              {/* Animated ring */}
              <motion.circle
                cx="48" cy="48" r={radius}
                fill="none"
                stroke={ringColor}
                strokeWidth="8"
                strokeLinecap="round"
                strokeDasharray={circumference}
                animate={{ strokeDashoffset: offset, stroke: ringColor }}
                transition={{ duration: 0.6, ease: "easeOut" }}
              />
            </svg>
            {/* Center label */}
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <AnimatePresence mode="wait">
                <motion.span
                  key={pct}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  className={cn(
                    "text-xl font-bold font-mono",
                    isIdle ? "text-muted-foreground/40" : isKernel ? "text-amber-500" : "text-teal-500"
                  )}
                >
                  {isIdle ? "—" : `${pct}%`}
                </motion.span>
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>

      {/* ── CONTEXT SWITCH COUNTER ── */}
      <div className="rounded-xl border border-border/40 bg-card/50 p-4">
        <div className="flex items-center gap-2 mb-3">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-muted-foreground/50">
            <path d="M17 1l4 4-4 4" /><path d="M3 11V9a4 4 0 0 1 4-4h14" />
            <path d="M7 23l-4-4 4-4" /><path d="M21 13v2a4 4 0 0 1-4 4H3" />
          </svg>
          <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">
            Context Switches
          </span>
        </div>
        <div className="flex items-end gap-1">
          <AnimatePresence mode="wait">
            <motion.span
              key={contextSwitchCount}
              initial={{ opacity: 0, y: -8, scale: 1.2 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0 }}
              className="text-3xl font-bold font-mono text-foreground"
            >
              {contextSwitchCount}
            </motion.span>
          </AnimatePresence>
          <span className="text-[10px] text-muted-foreground/40 mb-1 ml-1">switches</span>
        </div>
        <p className="text-[10px] text-muted-foreground/30 mt-1">
          Each switch saves/restores process state
        </p>
      </div>

      {/* ── MEMORY GAUGE ── */}
      <MemoryGauge
        memory={memory}
        processes={allProcesses.map((p) => ({
          name: p.name,
          color: p.color,
          memoryMB: p.memoryMB,
          state: p.state,
        }))}
      />

      {/* ── STATE LEGEND ── */}
      <div className="rounded-xl border border-border/40 bg-card/50 p-4">
        <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60 block mb-3">
          State Legend
        </span>
        <div className="space-y-2">
          {STATE_LEGEND.map(({ label, color, dot }) => (
            <div key={label} className="flex items-center gap-2.5">
              <div className={cn("w-2.5 h-2.5 rounded-full shrink-0", dot)} />
              <span className="text-xs text-muted-foreground/70">{label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
