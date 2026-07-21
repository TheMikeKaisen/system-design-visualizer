"use client";

import { motion } from "framer-motion";
import type { MemoryState } from "@/lib/os-simulator/engine";
import { cn } from "@/lib/utils";

interface MemoryGaugeProps {
  memory: MemoryState;
  /** Optional per-process breakdown for display */
  processes?: Array<{ name: string; color: string; memoryMB: number; state: string }>;
}

export function MemoryGauge({ memory, processes }: MemoryGaugeProps) {
  const pct = memory.usedPct;
  const barColor =
    pct > 80 ? "from-red-500 to-rose-400" : pct > 50 ? "from-amber-500 to-orange-400" : "from-teal-500 to-emerald-400";
  const textColor = pct > 80 ? "text-red-500" : pct > 50 ? "text-amber-500" : "text-teal-500";

  const activeProcesses = processes?.filter((p) => p.state !== "terminated") ?? [];

  return (
    <div className="rounded-xl border border-border/40 bg-card/50 p-4 space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-md bg-muted/50 flex items-center justify-center">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-muted-foreground/60">
              <rect x="2" y="6" width="20" height="12" rx="2" />
              <path d="M6 6V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v2" />
              <line x1="2" y1="12" x2="22" y2="12" />
            </svg>
          </div>
          <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">
            Memory
          </span>
        </div>
        <span className={cn("text-xs font-mono font-bold", textColor)}>
          {pct}%
        </span>
      </div>

      {/* Bar */}
      <div className="space-y-1">
        <div className="h-3 rounded-full bg-muted/40 overflow-hidden">
          <motion.div
            className={cn("h-full rounded-full bg-gradient-to-r", barColor)}
            initial={false}
            animate={{ width: `${pct}%` }}
            transition={{ duration: 0.6, ease: "easeOut" }}
          />
        </div>
        <div className="flex justify-between text-[10px] font-mono text-muted-foreground/40">
          <span>0</span>
          <span>{memory.usedMB} / {memory.totalMB} MB</span>
        </div>
      </div>

      {/* Per-process breakdown */}
      {activeProcesses.length > 0 && (
        <div className="space-y-1.5 pt-1 border-t border-border/20">
          {activeProcesses.map((p) => (
            <div key={p.name} className="flex items-center gap-2">
              <div
                className="w-2 h-2 rounded-full shrink-0"
                style={{ backgroundColor: p.color }}
              />
              <span className="text-[10px] text-muted-foreground/60 flex-1 truncate">{p.name}</span>
              <span className="text-[10px] font-mono text-muted-foreground/50 shrink-0">{p.memoryMB} MB</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
