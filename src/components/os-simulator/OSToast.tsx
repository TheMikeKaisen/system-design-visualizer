"use client";

import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

interface OSToastProps {
  message: string | null;
  durationMs?: number;
  variant?: "floating" | "inline";
}

export function getToastStyle(message: string) {
  const lower = message.toLowerCase();
  if (lower.includes("interrupt") || lower.includes("timer")) {
    return {
      border: "border-amber-500/40",
      bg: "bg-amber-500/10",
      bar: "bg-amber-500",
      text: "text-amber-400",
      borderHex: "#f59e0b",
      icon: "⏰",
    };
  }
  if (lower.includes("waiting") || lower.includes("disk") || lower.includes("i/o")) {
    return {
      border: "border-emerald-500/40",
      bg: "bg-emerald-500/10",
      bar: "bg-emerald-500",
      text: "text-emerald-400",
      borderHex: "#10b981",
      icon: "💾",
    };
  }
  if (lower.includes("terminated") || lower.includes("done") || lower.includes("complete")) {
    return {
      border: "border-rose-500/40",
      bg: "bg-rose-500/10",
      bar: "bg-rose-500",
      text: "text-rose-400",
      borderHex: "#f43f5e",
      icon: "🏁",
    };
  }
  // default: teal (scheduler / dispatch events)
  return {
    border: "border-teal-500/40",
    bg: "bg-teal-500/10",
    bar: "bg-teal-500",
    text: "text-teal-400",
    borderHex: "#14b8a6",
    icon: "⚡",
  };
}

export function OSToast({ message, durationMs = 2500, variant = "floating" }: OSToastProps) {
  const style = message ? getToastStyle(message) : null;

  return (
    <AnimatePresence>
      {message && style && (
        <motion.div
          key={message}
          initial={{ opacity: 0, x: 80, scale: 0.95 }}
          animate={{ opacity: 1, x: 0, scale: 1 }}
          exit={{ opacity: 0, x: 80, scale: 0.95 }}
          transition={{ type: "spring", stiffness: 300, damping: 28 }}
          className={cn(
            "rounded-xl overflow-hidden backdrop-blur-sm border-l-4",
            variant === "floating" ? "fixed top-20 right-4 z-50 w-64 shadow-xl" : "relative w-full shadow-sm mb-4",
            style.border,
            style.bg,
            "border border-l-4"
          )}
          style={{ borderLeftWidth: "4px", borderLeftColor: style.borderHex }}
        >
          <div className="px-4 py-3 flex items-start gap-3">
            <span className="text-lg shrink-0 mt-0.5">{style.icon}</span>
            <div className="flex-1 min-w-0">
              <p className={cn("text-sm font-semibold leading-tight", style.text)}>
                {message}
              </p>
            </div>
          </div>

          {/* Progress bar (Declarative animation: 0 re-renders) */}
          <div className="h-0.5 bg-border/20">
            <motion.div
              key={message}
              initial={{ width: "100%" }}
              animate={{ width: "0%" }}
              transition={{ duration: durationMs / 1000, ease: "linear" }}
              className={cn("h-full", style.bar)}
            />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
