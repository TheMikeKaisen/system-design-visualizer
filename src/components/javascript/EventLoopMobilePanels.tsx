"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CallStackPanel } from "./CallStackPanel";
import { ExecutionContextPanel } from "./ExecutionContextPanel";
import { ConsolePanel } from "./ConsolePanel";
import { WebAPIsPanel } from "./WebAPIsPanel";
import { MicrotaskQueuePanel } from "./MicrotaskQueuePanel";
import { CallbackQueuePanel } from "./CallbackQueuePanel";
import { EventLoopIndicator } from "./EventLoopIndicator";
import { cn } from "@/lib/utils";

type Tab = "callstack" | "context" | "webapis" | "queues" | "console";

export function EventLoopMobilePanels() {
  const [activeTab, setActiveTab] = useState<Tab>("callstack");

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Tabs Header */}
      <div className="flex items-center p-1 mb-2 bg-muted/30 rounded-xl border border-border/50 shrink-0 gap-1 overflow-x-auto no-scrollbar">
        {(["callstack", "context", "webapis", "queues", "console"] as Tab[]).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={cn(
              "flex-1 relative py-2 px-2 min-w-[70px] text-[10px] sm:text-xs font-bold uppercase tracking-wider rounded-lg transition-colors z-10 whitespace-nowrap",
              activeTab === tab ? "text-foreground" : "text-muted-foreground hover:text-foreground"
            )}
          >
            {activeTab === tab && (
              <motion.div
                layoutId="el-mobile-tab-indicator"
                className="absolute inset-0 bg-background shadow-sm border border-border/50 rounded-lg -z-10"
                transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
              />
            )}
            {tab === "callstack" ? "Stack" :
             tab === "context" ? "Memory" :
             tab === "webapis" ? "Web APIs" :
             tab === "queues" ? "Queues" : "Console"}
          </button>
        ))}
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
          ) : activeTab === "webapis" ? (
            <motion.div
              key="webapis"
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.2 }}
              className="absolute inset-0 h-full"
            >
              <WebAPIsPanel />
            </motion.div>
          ) : activeTab === "queues" ? (
            <motion.div
              key="queues"
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.2 }}
              className="absolute inset-0 h-full flex flex-col gap-2 overflow-y-auto pb-4"
            >
              <div className="flex-shrink-0 h-[120px]">
                <MicrotaskQueuePanel />
              </div>
              <div className="flex-shrink-0 h-[80px]">
                <EventLoopIndicator />
              </div>
              <div className="flex-shrink-0 h-[120px]">
                <CallbackQueuePanel />
              </div>
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
