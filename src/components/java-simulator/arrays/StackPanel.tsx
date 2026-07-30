"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useJavaArraysStore } from "@/store/useJavaArraysStore";
import { cn } from "@/lib/utils";

export const StackPanel: React.FC = () => {
  const { scenario, currentStepIndex } = useJavaArraysStore();
  const currentStep = scenario.steps[currentStepIndex];

  return (
    <div className="flex-1 flex flex-col min-w-[280px] max-w-[320px] bg-zinc-950/80 backdrop-blur-md border-r border-border/50 relative overflow-hidden h-full">
      <div className="p-4 border-b border-border/50 bg-black/20 flex items-center justify-between">
        <h3 className="font-semibold text-primary flex items-center gap-2">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect><line x1="8" y1="21" x2="16" y2="21"></line><line x1="12" y1="17" x2="12" y2="21"></line></svg>
          Thread Stack
        </h3>
      </div>
      
      <div id="stack-panel-scroll" className="flex-1 overflow-y-auto p-4 flex flex-col gap-4">
        <AnimatePresence>
          {currentStep.stack.length === 0 && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-center text-muted-foreground text-sm py-10"
            >
              Stack is empty.
            </motion.div>
          )}

          {currentStep.stack.map((frame, frameIdx) => (
            <motion.div
              key={frame.name}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="bg-black/40 border border-border/50 rounded-xl overflow-hidden"
            >
              <div className="bg-zinc-900/80 px-4 py-2 border-b border-border/50 font-mono text-sm font-medium text-foreground">
                {frame.name}
              </div>
              <div className="p-3 flex flex-col gap-2">
                {frame.variables.length === 0 ? (
                  <div className="text-xs text-muted-foreground italic text-center py-2">
                    No local variables
                  </div>
                ) : (
                  frame.variables.map((v, vIdx) => (
                    <div 
                      key={v.name} 
                      className="flex items-center justify-between text-sm p-2 rounded-lg bg-white/5 border border-white/5 hover:border-white/10 transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-blue-400 font-mono">{v.type}</span>
                        <span className="text-foreground font-medium">{v.name}</span>
                      </div>
                      <div 
                        // The anchor ID for SVG lines to attach to
                        id={`stack-var-${v.name}`}
                        className={cn(
                          "px-2 py-1 rounded bg-black/40 font-mono text-xs border relative",
                          v.value === "null" ? "text-red-400 border-red-900/30" :
                          (typeof v.value === 'string' && v.value.startsWith('0x')) ? "text-emerald-400 border-emerald-900/30" : 
                          "text-orange-300 border-orange-900/30"
                        )}
                      >
                        {v.value !== null ? String(v.value) : "null"}
                        {/* Anchor dot for visual indication */}
                        {(typeof v.value === 'string' && v.value.startsWith('0x')) && (
                          <div className="absolute right-[-4px] top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]"></div>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
};
