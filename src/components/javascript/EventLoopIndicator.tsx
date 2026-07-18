"use client";

import { useJSSimulationStore } from "@/store/useJSSimulationStore";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

export function EventLoopIndicator() {
  const { scenario, currentStepIndex } = useJSSimulationStore();
  const currentState = scenario.steps[currentStepIndex];
  const eventLoop = currentState.eventLoop || { phase: "idle", message: "Event Loop is idle" };

  // Determine styling based on phase
  let borderColor = "border-border/50";
  let iconColor = "text-muted-foreground";
  let isSpinning = false;
  let bgClass = "bg-card";

  switch (eventLoop.phase) {
    case "checking_microtasks":
    case "draining_microtask":
      borderColor = "border-fuchsia-500/50";
      iconColor = "text-fuchsia-500";
      isSpinning = true;
      bgClass = "bg-fuchsia-500/5";
      break;
    case "checking_callbacks":
      borderColor = "border-amber-500/50";
      iconColor = "text-amber-500";
      isSpinning = true;
      bgClass = "bg-amber-500/5";
      break;
    case "moving_callback":
      borderColor = "border-green-500/50";
      iconColor = "text-green-500";
      isSpinning = true;
      bgClass = "bg-green-500/5";
      break;
    case "stack_busy":
      borderColor = "border-red-500/30";
      iconColor = "text-red-400";
      isSpinning = false;
      bgClass = "bg-red-500/5";
      break;
    case "idle":
    default:
      borderColor = "border-border/50";
      iconColor = "text-muted-foreground";
      isSpinning = false;
      bgClass = "bg-card";
      break;
  }

  return (
    <div className={cn(
      "flex flex-col h-full rounded-xl border shadow-sm overflow-hidden transition-colors duration-300",
      bgClass,
      borderColor
    )}>
      <div className="px-4 py-3 border-b border-border/20 flex items-center justify-between">
        <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
          <motion.div
            animate={{ rotate: isSpinning ? 360 : 0 }}
            transition={{ duration: 2, ease: "linear", repeat: isSpinning ? Infinity : 0 }}
            className={cn("flex items-center justify-center", iconColor)}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.59-9.21l-5.33 3.65"/></svg>
          </motion.div>
          Event Loop
        </h2>
        <span className={cn(
          "text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded border transition-colors",
          eventLoop.phase === "idle" ? "bg-muted/50 text-muted-foreground border-transparent" :
          eventLoop.phase === "stack_busy" ? "bg-red-500/10 text-red-500 border-red-500/20" :
          "bg-primary/10 text-primary border-primary/20"
        )}>
          {eventLoop.phase.replace(/_/g, ' ')}
        </span>
      </div>
      
      <div className="flex-1 p-4 pb-6 overflow-y-auto flex flex-col justify-center items-center text-center gap-2">
        <p className="text-sm text-foreground font-medium">
          {eventLoop.message}
        </p>
        
        {/* Active Task Minimal Badge */}
        <AnimatePresence mode="wait">
          {eventLoop.activeTask && (
            <motion.div
              layout
              layoutId={eventLoop.activeTask.id}
              initial={{ opacity: 0, scale: 0.8, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
              className="mt-2 bg-background border border-border shadow-md shadow-black/10 px-3 py-1.5 rounded-md flex items-center gap-2 relative z-10"
            >
              <span className="flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
              </span>
              <span className="text-xs font-mono text-foreground font-bold">{eventLoop.activeTask.label}</span>
            </motion.div>
          )}
        </AnimatePresence>
        
        {/* Visual path hints based on phase */}
        {eventLoop.phase === "checking_microtasks" && (
          <div className="text-[10px] text-fuchsia-400 font-mono animate-pulse">
            ↑ Checking Microtask Queue...
          </div>
        )}
        {eventLoop.phase === "checking_callbacks" && (
          <div className="text-[10px] text-amber-500 font-mono animate-pulse">
            ↑ Checking Callback Queue...
          </div>
        )}
        {eventLoop.phase === "moving_callback" && (
          <div className="text-[10px] text-green-500 font-mono animate-pulse">
            → Moving to Call Stack...
          </div>
        )}
        {eventLoop.phase === "stack_busy" && (
          <div className="text-[10px] text-red-400 font-mono">
            ⏸ Paused: Call Stack not empty
          </div>
        )}
      </div>
    </div>
  );
}
