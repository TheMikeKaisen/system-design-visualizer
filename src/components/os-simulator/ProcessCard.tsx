"use client";

import { motion } from "framer-motion";
import type { OSProcess } from "@/lib/os-simulator/engine";
import { cn } from "@/lib/utils";

interface ProcessCardProps {
  process: OSProcess;
  /** Show device icon when in WAITING state */
  showDevice?: boolean;
  /** Whether this card is inside the CPU (slightly different style) */
  isInCPU?: boolean;
  /** Whether this card is in TERMINATED zone */
  isTerminated?: boolean;
}

const DEVICE_ICONS: Record<string, string> = {
  keyboard: "⌨️",
  disk: "💾",
  printer: "🖨️",
  network: "🌐",
  mouse: "🖱️",
};

export function ProcessCard({
  process,
  showDevice = false,
  isInCPU = false,
  isTerminated = false,
}: ProcessCardProps) {
  return (
    <motion.div
      layoutId={`process-${process.id}`}
      layout
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: isTerminated ? 0.5 : 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.8 }}
      transition={{
        layout: { type: "spring", stiffness: 300, damping: 30 },
        opacity: { duration: 0.2 },
        scale: { duration: 0.2 },
      }}
      className={cn(
        "flex items-center gap-2.5 rounded-lg border px-3 py-2 transition-shadow",
        isInCPU
          ? "border-teal-500/50 bg-teal-500/10 shadow-[0_0_12px_-2px_rgba(6,182,212,0.3)]"
          : isTerminated
          ? "border-border/30 bg-muted/30"
          : "border-border/60 bg-card/80 hover:border-border"
      )}
    >
      {/* Color dot */}
      <div
        className={cn("h-3 w-3 shrink-0 rounded-full", isTerminated && "opacity-40")}
        style={{ backgroundColor: process.color }}
      />

      {/* Name */}
      <span
        className={cn(
          "text-sm font-semibold leading-tight",
          isTerminated ? "text-muted-foreground/50 line-through" : "text-foreground"
        )}
      >
        {process.name}
      </span>

      {/* PID badge */}
      <span className="ml-auto text-[10px] font-mono text-muted-foreground/60">
        {process.pid}
      </span>

      {/* Device icon when waiting */}
      {showDevice && process.ioDevice && (
        <span className="text-sm" title={process.ioDevice}>
          {DEVICE_ICONS[process.ioDevice] ?? "⏳"}
        </span>
      )}
    </motion.div>
  );
}
