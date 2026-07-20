"use client";

import { motion, AnimatePresence } from "framer-motion";
import type { InterruptEvent } from "@/lib/os-simulator/engine";

interface InterruptOverlayProps {
  interrupt?: InterruptEvent;
}

const INTERRUPT_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  timer: {
    bg: "bg-amber-500/10",
    text: "text-amber-500",
    border: "border-amber-500/30",
  },
  io_complete: {
    bg: "bg-emerald-500/10",
    text: "text-emerald-500",
    border: "border-emerald-500/30",
  },
  syscall: {
    bg: "bg-indigo-500/10",
    text: "text-indigo-500",
    border: "border-indigo-500/30",
  },
  page_fault: {
    bg: "bg-red-500/10",
    text: "text-red-500",
    border: "border-red-500/30",
  },
};

const INTERRUPT_ICONS: Record<string, string> = {
  timer: "⏰",
  io_complete: "✅",
  syscall: "🔧",
  page_fault: "⚠️",
};

export function InterruptOverlay({ interrupt }: InterruptOverlayProps) {
  return (
    <AnimatePresence>
      {interrupt && (
        <motion.div
          key={interrupt.message}
          initial={{ opacity: 0, y: -10, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -10, scale: 0.95 }}
          transition={{ duration: 0.3 }}
          className="pointer-events-none absolute left-1/2 top-4 z-20 -translate-x-1/2"
        >
          <div
            className={`flex items-center gap-2 rounded-lg border px-4 py-2 backdrop-blur-sm ${
              INTERRUPT_COLORS[interrupt.type]?.bg ?? "bg-muted/50"
            } ${INTERRUPT_COLORS[interrupt.type]?.border ?? "border-border"}`}
          >
            <span className="text-base">
              {INTERRUPT_ICONS[interrupt.type] ?? "⚡"}
            </span>
            <span
              className={`text-xs font-bold ${
                INTERRUPT_COLORS[interrupt.type]?.text ?? "text-foreground"
              }`}
            >
              {interrupt.message}
            </span>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
