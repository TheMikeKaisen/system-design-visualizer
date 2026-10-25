"use client";

import React from "react";
import { useActiveSimulation } from "@/context/JSSimulationContext";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import type { QueueItem } from "@/lib/js-simulator/engine";

export type QueueVariant = "microtask" | "callback";

interface QueuePanelProps {
  variant: QueueVariant;
  className?: string;
}

interface VariantConfig {
  title: React.ReactNode;
  badge?: React.ReactNode;
  icon: React.ReactNode;
  isBeingChecked: (phase: string) => boolean;
  getItems: (state: { microtaskQueue?: QueueItem[]; callbackQueue?: QueueItem[] }) => QueueItem[];
  containerActiveClass: string;
  headerActiveClass: string;
  headerDefaultClass: string;
  itemActiveBorder: string;
  itemActiveLabel: string;
}

const VARIANT_CONFIGS: Record<QueueVariant, VariantConfig> = {
  microtask: {
    title: "Microtask Queue",
    badge: (
      <span className="text-[9px] font-bold uppercase tracking-widest text-fuchsia-400 bg-fuchsia-500/10 px-2 py-0.5 rounded border border-fuchsia-500/20">
        ⚡ Higher Priority
      </span>
    ),
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-fuchsia-500/70">
        <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
      </svg>
    ),
    isBeingChecked: (phase) => phase === "checking_microtasks" || phase === "draining_microtask",
    getItems: (state) => state.microtaskQueue || [],
    containerActiveClass: "border-fuchsia-500 shadow-[0_0_20px_-5px_rgba(217,70,239,0.5)] ring-1 ring-fuchsia-500/50",
    headerActiveClass: "bg-fuchsia-500/15 border-fuchsia-500/50",
    headerDefaultClass: "bg-fuchsia-500/5 border-border/50",
    itemActiveBorder: "border-fuchsia-500/40 ring-1 ring-fuchsia-500/20 bg-fuchsia-500/10 shadow-[0_0_15px_-3px_rgba(217,70,239,0.2)]",
    itemActiveLabel: "text-fuchsia-500",
  },
  callback: {
    title: (
      <>
        Callback Queue <span className="text-[10px] text-muted-foreground/60 normal-case tracking-normal">(Macrotasks)</span>
      </>
    ),
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-amber-500/70">
        <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
        <line x1="9" y1="3" x2="9" y2="21" />
      </svg>
    ),
    isBeingChecked: (phase) => phase === "checking_callbacks",
    getItems: (state) => state.callbackQueue || [],
    containerActiveClass: "border-amber-500 shadow-[0_0_20px_-5px_rgba(245,158,11,0.5)] ring-1 ring-amber-500/50",
    headerActiveClass: "bg-amber-500/15 border-amber-500/50",
    headerDefaultClass: "bg-amber-500/5 border-border/50",
    itemActiveBorder: "border-amber-500/40 ring-1 ring-amber-500/20 bg-amber-500/10 shadow-[0_0_15px_-3px_rgba(245,158,11,0.2)]",
    itemActiveLabel: "text-amber-500",
  },
};

export function QueuePanel({ variant, className }: QueuePanelProps) {
  const { scenario, currentStepIndex } = useActiveSimulation();
  const steps = scenario?.steps ?? [];
  const safeIndex = Math.max(0, Math.min(currentStepIndex, Math.max(0, steps.length - 1)));
  const currentState = steps[safeIndex] ?? null;

  if (!currentState) return null;

  const config = VARIANT_CONFIGS[variant];
  const items = config.getItems(currentState);
  const eventLoop = currentState.eventLoop || { phase: "idle" };
  const isBeingChecked = config.isBeingChecked(eventLoop.phase);

  return (
    <div
      className={cn(
        "flex flex-col h-full bg-card rounded-xl border shadow-sm overflow-hidden transition-all duration-300",
        isBeingChecked ? config.containerActiveClass : "border-border/50",
        className
      )}
    >
      <div
        className={cn(
          "px-4 py-3 border-b flex items-center justify-between transition-colors duration-300",
          isBeingChecked ? config.headerActiveClass : config.headerDefaultClass
        )}
      >
        <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
          {config.icon}
          {config.title}
        </h2>
        {config.badge}
      </div>

      <div className="flex-1 p-4 overflow-x-auto overflow-y-hidden flex items-center gap-3">
        {items.length === 0 ? (
          <div className="w-full text-center text-sm text-muted-foreground italic">
            Queue is empty
          </div>
        ) : (
          <AnimatePresence mode="popLayout">
            {items.map((item, idx) => (
              <motion.div
                key={item.id}
                layout
                layoutId={item.id}
                initial={{ opacity: 0, x: -30, scale: 0.9 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                exit={{ opacity: 0, y: -30, scale: 0.9, filter: "blur(4px)" }}
                transition={{ type: "spring", stiffness: 300, damping: 25 }}
                className={cn(
                  "flex-shrink-0 w-48 bg-muted/20 border rounded-lg p-3 shadow-sm",
                  idx === 0 ? config.itemActiveBorder : "border-border/40"
                )}
              >
                <div className="flex items-center justify-between mb-2 pb-2 border-b border-border/40">
                  <span
                    className={cn(
                      "text-xs font-bold truncate",
                      idx === 0 ? config.itemActiveLabel : "text-foreground"
                    )}
                  >
                    {item.label}
                  </span>
                </div>
                <div className="font-mono text-[10px] text-muted-foreground bg-black/40 p-1.5 rounded truncate">
                  {item.callback}
                </div>
                <div className="mt-2 text-[9px] font-medium uppercase tracking-widest text-muted-foreground/60 text-right">
                  from {item.source}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        )}
      </div>
    </div>
  );
}
