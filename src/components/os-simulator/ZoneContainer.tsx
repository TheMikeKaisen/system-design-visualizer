"use client";

import { AnimatePresence, motion } from "framer-motion";
import type { OSProcess } from "@/lib/os-simulator/engine";
import { ProcessCard } from "./ProcessCard";
import { cn } from "@/lib/utils";

interface ZoneContainerProps {
  title: string;
  accentClass?: string;
  processes: OSProcess[];
  showDevices?: boolean;
  isTerminated?: boolean;
  icon?: React.ReactNode;
  className?: string;
}

export function ZoneContainer({
  title,
  accentClass = "text-muted-foreground",
  processes,
  showDevices = false,
  isTerminated = false,
  icon,
  className,
}: ZoneContainerProps) {
  const isEmpty = processes.length === 0;

  return (
    <div
      className={cn(
        "rounded-xl border p-4 transition-all duration-300",
        isEmpty
          ? "border-dashed border-border/60 dark:border-slate-700/80 bg-card/20"
          : "border-border/80 dark:border-slate-700 bg-card/50 backdrop-blur-sm shadow-sm",
        className
      )}
    >
      {/* Header */}
      <div className="mb-3 flex items-center gap-2">
        {icon && <span className="text-sm">{icon}</span>}
        <h3 className={cn("text-[10px] font-bold uppercase tracking-widest", accentClass)}>
          {title}
        </h3>
        <AnimatePresence>
          {!isEmpty && (
            <motion.span
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.5, opacity: 0 }}
              className="ml-auto rounded-full bg-muted px-2 py-0.5 text-[10px] font-mono font-bold text-muted-foreground"
            >
              {processes.length}
            </motion.span>
          )}
        </AnimatePresence>
      </div>

      {/* Process cards */}
      <div className="flex flex-col gap-2 min-h-[52px]">
        <AnimatePresence mode="popLayout">
          {isEmpty ? (
            <motion.div
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex items-center justify-center h-[52px]"
            >
              <div className="flex flex-col items-center gap-1">
                <div className="w-6 h-6 rounded-full border border-dashed border-border/30 flex items-center justify-center">
                  <div className="w-1.5 h-1.5 rounded-full bg-border/30" />
                </div>
                <span className="text-[10px] text-muted-foreground/30 italic">
                  No processes
                </span>
              </div>
            </motion.div>
          ) : (
            processes.map((proc) => (
              <ProcessCard
                key={proc.id}
                process={proc}
                showDevice={showDevices}
                isTerminated={isTerminated}
              />
            ))
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
