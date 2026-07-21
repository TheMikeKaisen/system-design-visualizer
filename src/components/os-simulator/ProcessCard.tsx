"use client";

import { motion } from "framer-motion";
import type { OSProcess } from "@/lib/os-simulator/engine";
import { cn } from "@/lib/utils";

interface ProcessCardProps {
  process: OSProcess;
  showDevice?: boolean;
  isInCPU?: boolean;
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
      initial={{ opacity: 0, scale: 0.85, x: -8 }}
      animate={{ opacity: isTerminated ? 0.45 : 1, scale: 1, x: 0 }}
      exit={{ opacity: 0, scale: 0.85, x: 8 }}
      transition={{
        layout: { type: "spring", stiffness: 280, damping: 28 },
        opacity: { duration: 0.2 },
        scale: { duration: 0.2 },
      }}
      className={cn(
        "relative flex items-center gap-3 rounded-lg border-l-4 pr-3 py-2.5 pl-3 overflow-hidden transition-shadow",
        isInCPU
          ? "bg-teal-500/10 border-t border-r border-b border-t-teal-500/30 border-r-teal-500/30 border-b-teal-500/30 ring-1 ring-teal-500/30 shadow-[0_0_16px_-4px_rgba(6,182,212,0.4)]"
          : isTerminated
          ? "bg-muted/20 border-t border-r border-b border-border/20"
          : "bg-card/80 border-t border-r border-b border-border/50 hover:border-border/80 hover:shadow-sm"
      )}
      style={{ borderLeftColor: isTerminated ? "rgba(148,163,184,0.2)" : process.color }}
    >
      {/* Name + PID stacked */}
      <div className="flex-1 min-w-0">
        <span
          className={cn(
            "block text-sm font-bold leading-tight truncate",
            isTerminated
              ? "text-muted-foreground/40 line-through"
              : isInCPU
              ? "text-teal-100"
              : "text-foreground"
          )}
        >
          {process.name}
        </span>
        <span className="block text-[10px] font-mono text-muted-foreground/50 mt-0.5">
          {process.pid} · {process.memoryMB} MB
        </span>
      </div>

      {/* Device icon when waiting */}
      {showDevice && process.ioDevice && (
        <span className="text-base shrink-0" title={process.ioDevice}>
          {DEVICE_ICONS[process.ioDevice] ?? "⏳"}
        </span>
      )}

      {/* CPU glow shimmer overlay */}
      {isInCPU && (
        <motion.div
          className="absolute inset-0 pointer-events-none"
          animate={{ opacity: [0, 0.06, 0] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          style={{
            background: `linear-gradient(90deg, transparent, ${process.color}40, transparent)`,
          }}
        />
      )}
    </motion.div>
  );
}
