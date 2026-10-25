"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CallStackPanel } from "./CallStackPanel";
import { ExecutionContextPanel } from "./ExecutionContextPanel";
import { ConsolePanel } from "./ConsolePanel";
import { TaskQueuePanel } from "./TaskQueuePanel";
import { cn } from "@/lib/utils";
import { useActiveSimulation } from "@/context/JSSimulationContext";

type Tab = "callstack" | "context" | "console" | "queue";

export function MobileTabbedPanels() {
  const [activeTab, setActiveTab] = useState<Tab>("callstack");
  const { scenario, currentStepIndex } = useActiveSimulation();
  const steps = scenario?.steps ?? [];
  const safeIndex = Math.max(0, Math.min(currentStepIndex, steps.length - 1));
  const currentState = steps[safeIndex] ?? null;

  if (!currentState) return null;

  const hasTaskQueue = (currentState.taskQueue !== undefined && currentState.taskQueue.length > 0) ||
                       (currentState.callbackQueue !== undefined && currentState.callbackQueue.length > 0);
  const effectiveTab = activeTab === "queue" && !hasTaskQueue ? "callstack" : activeTab;

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Tabs Header */}
      <div className="flex items-center p-1 mb-2 bg-muted/30 rounded-xl border border-border/50 shrink-0 gap-1 overflow-x-auto">
        <button
          onClick={() => setActiveTab("callstack")}
          className={cn(
            "flex-1 relative py-2 px-2 min-w-[80px] text-[10px] sm:text-xs font-bold uppercase tracking-wider rounded-lg transition-colors z-10",
            effectiveTab === "callstack" ? "text-foreground" : "text-muted-foreground hover:text-foreground"
          )}
        >
          {effectiveTab === "callstack" && (
            <motion.div
              layoutId="mobile-tab-indicator"
              className="absolute inset-0 bg-background shadow-sm border border-border/50 rounded-lg -z-10"
              transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
            />
          )}
          Call Stack
        </button>
        <button
          onClick={() => setActiveTab("context")}
          className={cn(
            "flex-1 relative py-2 px-2 min-w-[80px] text-[10px] sm:text-xs font-bold uppercase tracking-wider rounded-lg transition-colors z-10",
            effectiveTab === "context" ? "text-foreground" : "text-muted-foreground hover:text-foreground"
          )}
        >
          {effectiveTab === "context" && (
            <motion.div
              layoutId="mobile-tab-indicator"
              className="absolute inset-0 bg-background shadow-sm border border-border/50 rounded-lg -z-10"
              transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
            />
          )}
          Memory
        </button>
        {hasTaskQueue && (
          <button
            onClick={() => setActiveTab("queue")}
            className={cn(
              "flex-1 relative py-2 px-2 min-w-[80px] text-[10px] sm:text-xs font-bold uppercase tracking-wider rounded-lg transition-colors z-10",
              effectiveTab === "queue" ? "text-foreground" : "text-muted-foreground hover:text-foreground"
            )}
          >
            {effectiveTab === "queue" && (
              <motion.div
                layoutId="mobile-tab-indicator"
                className="absolute inset-0 bg-background shadow-sm border border-border/50 rounded-lg -z-10"
                transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
              />
            )}
            Queue
          </button>
        )}
        <button
          onClick={() => setActiveTab("console")}
          className={cn(
            "flex-1 relative py-2 px-2 min-w-[80px] text-[10px] sm:text-xs font-bold uppercase tracking-wider rounded-lg transition-colors z-10",
            effectiveTab === "console" ? "text-foreground" : "text-muted-foreground hover:text-foreground"
          )}
        >
          {effectiveTab === "console" && (
            <motion.div
              layoutId="mobile-tab-indicator"
              className="absolute inset-0 bg-background shadow-sm border border-border/50 rounded-lg -z-10"
              transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
            />
          )}
          Console
        </button>
      </div>

      {/* Tab Content */}
      <div className="flex-1 relative min-h-0">
        <AnimatePresence mode="wait">
          {effectiveTab === "callstack" ? (
            <motion.div
              key="callstack"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              transition={{ duration: 0.2 }}
              className="absolute inset-0 h-full"
            >
              <CallStackPanel />
            </motion.div>
          ) : effectiveTab === "context" ? (
            <motion.div
              key="context"
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.2 }}
              className="absolute inset-0 h-full"
            >
              <ExecutionContextPanel />
            </motion.div>
          ) : effectiveTab === "queue" ? (
            <motion.div
              key="queue"
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.2 }}
              className="absolute inset-0 h-full"
            >
              <TaskQueuePanel />
            </motion.div>
          ) : (
            <motion.div
              key="console"
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.2 }}
              className="absolute inset-0 h-full"
            >
              <ConsolePanel />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
