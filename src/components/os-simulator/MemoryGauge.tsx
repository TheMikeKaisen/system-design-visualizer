"use client";

import { motion } from "framer-motion";
import type { MemoryState } from "@/lib/os-simulator/engine";
import { cn } from "@/lib/utils";

interface MemoryGaugeProps {
  memory: MemoryState;
}

export function MemoryGauge({ memory }: MemoryGaugeProps) {
  const pct = memory.usedPct;
  const barColor =
    pct > 80 ? "bg-red-500" : pct > 50 ? "bg-amber-500" : "bg-teal-500";

  return (
    <div className="rounded-lg border border-border/40 bg-card/50 p-3">
      <div className="mb-2 flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <svg
            width="12"
            height="12"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            className="text-muted-foreground/60"
          >
            <rect x="2" y="6" width="20" height="12" rx="2" />
            <path d="M6 6V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v2" />
            <line x1="2" y1="12" x2="22" y2="12" />
          </svg>
          <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">
            Memory
          </span>
        </div>
        <span className="text-[10px] font-mono text-muted-foreground">
          {memory.usedMB} / {memory.totalMB} MB
        </span>
      </div>

      {/* Bar */}
      <div className="h-2 rounded-full bg-muted/50 overflow-hidden">
        <motion.div
          className={cn("h-full rounded-full", barColor)}
          initial={false}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.5 }}
        />
      </div>

      <div className="mt-1 text-right">
        <span
          className={cn(
            "text-[10px] font-bold font-mono",
            pct > 80
              ? "text-red-500"
              : pct > 50
              ? "text-amber-500"
              : "text-teal-500"
          )}
        >
          {pct}%
        </span>
      </div>
    </div>
  );
}
