"use client";

import { motion, AnimatePresence } from "framer-motion";
import type { SchedulerEvent } from "@/lib/os-simulator/engine";
import { cn } from "@/lib/utils";

interface SchedulerBadgeProps {
  /** Scheduler type label */
  label: string;
  /** Active scheduler event (if the scheduler is active this step) */
  event?: SchedulerEvent;
  /** Direction of the arrow */
  direction?: "down" | "split";
}

const SCHEDULER_COLORS: Record<string, string> = {
  long_term: "text-indigo-400",
  short_term: "text-teal-400",
  medium_term: "text-violet-400",
};

export function SchedulerBadge({ label, event, direction = "down" }: SchedulerBadgeProps) {
  const isActive = event?.isActive ?? false;
  const colorClass = event ? SCHEDULER_COLORS[event.type] ?? "text-muted-foreground" : "text-muted-foreground/40";

  return (
    <div className="flex flex-col items-center gap-1 py-1.5">
      {/* Arrow */}
      <svg
        width="12"
        height="12"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={cn("transition-colors duration-300", colorClass)}
      >
        {direction === "down" ? (
          <>
            <line x1="12" y1="5" x2="12" y2="19" />
            <polyline points="19 12 12 19 5 12" />
          </>
        ) : (
          <>
            <line x1="12" y1="5" x2="12" y2="14" />
            <polyline points="5 14 12 19 19 14" />
          </>
        )}
      </svg>

      {/* Label */}
      <div className="relative flex items-center gap-1.5">
        <AnimatePresence>
          {isActive && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
              className="absolute -left-2 h-1.5 w-1.5 rounded-full bg-teal-400"
            >
              <motion.div
                className="absolute inset-0 rounded-full bg-teal-400"
                animate={{ scale: [1, 2], opacity: [1, 0] }}
                transition={{ duration: 1, repeat: Infinity }}
              />
            </motion.div>
          )}
        </AnimatePresence>
        <span
          className={cn(
            "text-[10px] font-medium tracking-wide transition-colors duration-300",
            isActive ? colorClass : "text-muted-foreground/40"
          )}
        >
          {label}
        </span>
      </div>

      {/* Action text */}
      <AnimatePresence>
        {isActive && event?.action && (
          <motion.span
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            className={cn("text-[10px] font-semibold", colorClass)}
          >
            {event.action}
          </motion.span>
        )}
      </AnimatePresence>
    </div>
  );
}
