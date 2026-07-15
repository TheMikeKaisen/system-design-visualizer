"use client";

import { useJSSimulationStore } from "@/store/useJSSimulationStore";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

export function TaskQueuePanel() {
  const { scenario, currentStepIndex } = useJSSimulationStore();
  const currentState = scenario.steps[currentStepIndex];
  const taskQueue = currentState.taskQueue || [];

  return (
    <div className="flex flex-col h-full bg-card rounded-xl border border-border/50 shadow-sm overflow-hidden">
      <div className="px-4 py-3 border-b border-border/50 bg-muted/20">
        <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
          Web APIs / Task Queue
        </h2>
      </div>
      
      <div className="flex-1 p-4 overflow-y-auto flex flex-col gap-3">
        {taskQueue.length === 0 ? (
          <div className="flex items-center justify-center h-full text-sm text-muted-foreground italic">
            Queue is empty
          </div>
        ) : (
          <AnimatePresence mode="popLayout">
            {taskQueue.map((task) => (
              <motion.div
                key={task.id}
                layout
                initial={{ opacity: 0, x: -20, scale: 0.9 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                exit={{ opacity: 0, x: 20, scale: 0.9 }}
                className="bg-muted/10 border border-primary/20 rounded-lg p-3 shadow-sm ring-1 ring-primary/10"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-primary flex items-center gap-1.5">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>
                    {task.name}
                  </span>
                  <span className="text-[10px] font-mono text-muted-foreground bg-black/20 px-1.5 py-0.5 rounded">
                    {task.timeout}
                  </span>
                </div>
                <div className="font-mono text-xs text-muted-foreground bg-black/30 p-2 rounded whitespace-pre line-clamp-3">
                  {task.callback}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        )}
      </div>
    </div>
  );
}
