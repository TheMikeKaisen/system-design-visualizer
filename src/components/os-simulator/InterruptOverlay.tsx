"use client";

import { motion, AnimatePresence } from "framer-motion";
import type { InterruptEvent } from "@/lib/os-simulator/engine";

interface InterruptOverlayProps {
  interrupt?: InterruptEvent;
}

const INTERRUPT_CONFIG: Record<string, {
  bg: string;
  border: string;
  text: string;
  icon: string;
  label: string;
}> = {
  timer: {
    bg: "bg-amber-500/15",
    border: "border-amber-500/40",
    text: "text-amber-400",
    icon: "⏰",
    label: "TIMER INTERRUPT",
  },
  io_complete: {
    bg: "bg-emerald-500/15",
    border: "border-emerald-500/40",
    text: "text-emerald-400",
    icon: "✅",
    label: "I/O COMPLETE",
  },
  syscall: {
    bg: "bg-indigo-500/15",
    border: "border-indigo-500/40",
    text: "text-indigo-400",
    icon: "🔧",
    label: "SYSTEM CALL",
  },
  page_fault: {
    bg: "bg-red-500/15",
    border: "border-red-500/40",
    text: "text-red-400",
    icon: "⚠️",
    label: "PAGE FAULT",
  },
};

export function InterruptOverlay({ interrupt }: InterruptOverlayProps) {
  const config = interrupt
    ? INTERRUPT_CONFIG[interrupt.type] ?? {
        bg: "bg-muted/50",
        border: "border-border",
        text: "text-foreground",
        icon: "⚡",
        label: "INTERRUPT",
      }
    : null;

  return (
    <AnimatePresence>
      {interrupt && config && (
        <motion.div
          key={interrupt.message}
          initial={{ opacity: 0, y: -56 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -56 }}
          transition={{ type: "spring", stiffness: 400, damping: 30 }}
          className={`absolute top-0 left-0 right-0 z-20 flex items-center gap-3 px-5 py-3 backdrop-blur-md border-b ${config.bg} ${config.border}`}
        >
          <span className="text-xl shrink-0">{config.icon}</span>
          <div className="flex-1 min-w-0">
            <p className={`text-[10px] font-bold uppercase tracking-widest mb-0.5 ${config.text}`}>
              {config.label}
            </p>
            <p className="text-sm font-medium text-foreground/80 truncate">
              {interrupt.message}
            </p>
          </div>
          {/* Pulsing indicator */}
          <motion.div
            animate={{ opacity: [1, 0.3, 1] }}
            transition={{ duration: 1, repeat: Infinity }}
            className={`w-2.5 h-2.5 rounded-full shrink-0 ${config.text.replace("text-", "bg-")}`}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
