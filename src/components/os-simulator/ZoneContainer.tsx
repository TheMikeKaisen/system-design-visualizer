"use client";

import { AnimatePresence } from "framer-motion";
import type { OSProcess } from "@/lib/os-simulator/engine";
import { ProcessCard } from "./ProcessCard";
import { cn } from "@/lib/utils";

interface ZoneContainerProps {
  /** Zone title (e.g., "NEW", "READY QUEUE") */
  title: string;
  /** Accent color class for the title */
  accentClass?: string;
  /** Processes to render in this zone */
  processes: OSProcess[];
  /** Show device icons (for WAITING zone) */
  showDevices?: boolean;
  /** Show terminated styling */
  isTerminated?: boolean;
  /** Custom icon for the zone header */
  icon?: React.ReactNode;
  /** Additional className */
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
        "rounded-xl border p-3 transition-all duration-300",
        isEmpty
          ? "border-dashed border-border/40 bg-card/30"
          : "border-border/60 bg-card/60 backdrop-blur-sm",
        className
      )}
    >
      {/* Header */}
      <div className="mb-2 flex items-center gap-2">
        {icon && <span className="text-sm">{icon}</span>}
        <h3
          className={cn(
            "text-[10px] font-bold uppercase tracking-widest",
            accentClass
          )}
        >
          {title}
        </h3>
        {!isEmpty && (
          <span className="ml-auto rounded-full bg-muted px-1.5 py-0.5 text-[10px] font-mono text-muted-foreground">
            {processes.length}
          </span>
        )}
      </div>

      {/* Process cards */}
      <div className="flex flex-col gap-1.5 min-h-[36px]">
        <AnimatePresence mode="popLayout">
          {isEmpty ? (
            <p className="py-1 text-center text-[11px] italic text-muted-foreground/40">
              Empty
            </p>
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
