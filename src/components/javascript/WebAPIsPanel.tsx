"use client";

import { useJSSimulationStore } from "@/store/useJSSimulationStore";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

export function WebAPIsPanel() {
  const { scenario, currentStepIndex } = useJSSimulationStore();
  const currentState = scenario.steps[currentStepIndex];
  const webAPIs = currentState.webAPIs || [];

  return (
    <div className="flex flex-col h-full bg-card rounded-xl border border-border/50 shadow-sm overflow-hidden">
      <div className="px-4 py-3 border-b border-border/50 bg-muted/20">
        <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="2" y1="12" x2="22" y2="12"></line><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path></svg>
          Web APIs (Browser)
        </h2>
      </div>
      
      <div className="flex-1 p-4 overflow-y-auto flex flex-col gap-3">
        {webAPIs.length === 0 ? (
          <div className="flex items-center justify-center h-full text-sm text-muted-foreground italic">
            No active Web APIs
          </div>
        ) : (
          <AnimatePresence mode="popLayout">
            {webAPIs.map((api) => (
              <motion.div
                key={api.id}
                layout
                layoutId={api.id}
                initial={{ opacity: 0, scale: 0.9, y: 10 }}
                animate={{ 
                  opacity: 1, 
                  scale: 1, 
                  y: 0,
                  boxShadow: api.status === "complete" ? "0 0 15px rgba(34, 197, 94, 0.4)" : "none",
                  borderColor: api.status === "complete" ? "rgba(34, 197, 94, 0.5)" : "rgba(var(--primary), 0.2)"
                }}
                exit={{ opacity: 0, scale: 0.8, y: 20 }}
                className={cn(
                  "bg-muted/10 border rounded-lg p-3 shadow-sm transition-colors duration-300",
                  api.status === "complete" ? "bg-green-500/5 ring-1 ring-green-500/30" : "ring-1 ring-primary/10"
                )}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className={cn(
                    "text-xs font-bold flex items-center gap-1.5",
                    api.status === "complete" ? "text-green-500" : "text-primary"
                  )}>
                    {api.type === "fetch" ? (
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="17 8 12 3 7 8"></polyline><line x1="12" y1="3" x2="12" y2="15"></line></svg>
                    ) : (
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
                    )}
                    {api.label}
                  </span>
                  
                  {api.delay && (
                    <span className={cn(
                      "text-[10px] font-mono px-1.5 py-0.5 rounded flex items-center gap-1 transition-colors",
                      api.status === "complete" ? "bg-green-500/20 text-green-400" : "bg-black/20 text-muted-foreground"
                    )}>
                      {api.status === "running" && (
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span>
                      )}
                      {api.status === "complete" ? "Ready" : api.delay}
                    </span>
                  )}
                  
                  {api.type === "fetch" && (
                    <span className={cn(
                      "text-[10px] font-mono px-1.5 py-0.5 rounded flex items-center gap-1 transition-colors",
                      api.status === "complete" ? "bg-green-500/20 text-green-400" : "bg-black/20 text-muted-foreground"
                    )}>
                      {api.status === "running" && (
                        <svg className="animate-spin -ml-1 mr-1 h-2 w-2 text-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                      )}
                      {api.status === "complete" ? "Resolved" : "Pending"}
                    </span>
                  )}
                </div>
                <div className="font-mono text-xs text-muted-foreground bg-black/30 p-2 rounded whitespace-pre line-clamp-3">
                  {api.callback}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        )}
      </div>
    </div>
  );
}
