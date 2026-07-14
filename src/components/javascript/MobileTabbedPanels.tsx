"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CallStackPanel } from "./CallStackPanel";
import { ExecutionContextPanel } from "./ExecutionContextPanel";
import { ConsolePanel } from "./ConsolePanel";
import { cn } from "@/lib/utils";

type Tab = "callstack" | "context" | "console";

export function MobileTabbedPanels() {
  const [activeTab, setActiveTab] = useState<Tab>("callstack");

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Tabs Header */}
      <div className="flex items-center p-1 mb-2 bg-muted/30 rounded-xl border border-border/50 shrink-0 gap-1">
        <button
          onClick={() => setActiveTab("callstack")}
          className={cn(
            "flex-1 relative py-2 text-xs font-bold uppercase tracking-wider rounded-lg transition-colors z-10",
            activeTab === "callstack" ? "text-foreground" : "text-muted-foreground hover:text-foreground"
          )}
        >
          {activeTab === "callstack" && (
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
            "flex-1 relative py-2 text-xs font-bold uppercase tracking-wider rounded-lg transition-colors z-10",
            activeTab === "context" ? "text-foreground" : "text-muted-foreground hover:text-foreground"
          )}
        >
          {activeTab === "context" && (
            <motion.div
              layoutId="mobile-tab-indicator"
              className="absolute inset-0 bg-background shadow-sm border border-border/50 rounded-lg -z-10"
              transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
            />
          )}
          Memory
        </button>
        <button
          onClick={() => setActiveTab("console")}
          className={cn(
            "flex-1 relative py-2 text-xs font-bold uppercase tracking-wider rounded-lg transition-colors z-10",
            activeTab === "console" ? "text-foreground" : "text-muted-foreground hover:text-foreground"
          )}
        >
          {activeTab === "console" && (
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
          {activeTab === "callstack" ? (
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
          ) : activeTab === "context" ? (
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
