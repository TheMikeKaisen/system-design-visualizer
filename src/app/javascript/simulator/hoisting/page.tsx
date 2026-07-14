"use client";

import { useJSSimulationStore } from "@/store/useJSSimulationStore";
import { CodePanel } from "@/components/javascript/CodePanel";
import { CallStackPanel } from "@/components/javascript/CallStackPanel";
import { ExecutionContextPanel } from "@/components/javascript/ExecutionContextPanel";
import { MobileTabbedPanels } from "@/components/javascript/MobileTabbedPanels";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Logo } from "@/components/ui/Logo";
import Link from "next/link";
import { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { ALL_HOISTING_SCENARIOS } from "@/lib/js-simulator/hoisting-scenarios";

export default function JSHoistingSimulator() {
  const { 
    scenario, 
    currentStepIndex, 
    isPlaying,
    nextStep,
    prevStep,
    reset,
    togglePlay,
    setStep,
    setScenario
  } = useJSSimulationStore();

  // Initialize with the first hoisting scenario on mount
  useEffect(() => {
    // Only set if we aren't already on a hoisting scenario
    if (!ALL_HOISTING_SCENARIOS.find(s => s.id === scenario.id)) {
      setScenario(ALL_HOISTING_SCENARIOS[0]);
    }
  }, [scenario.id, setScenario]);

  // Auto-play effect
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isPlaying) {
      timer = setTimeout(() => {
        nextStep();
      }, 2000); // 2 second delay between steps
    }
    return () => clearTimeout(timer);
  }, [isPlaying, currentStepIndex, nextStep]);

  // Toast effect
  const [activeToast, setActiveToast] = useState<string | null>(null);
  useEffect(() => {
    if (scenario.steps[currentStepIndex]?.toastMessage) {
      setActiveToast(scenario.steps[currentStepIndex].toastMessage!);
      const t = setTimeout(() => setActiveToast(null), 2500);
      return () => clearTimeout(t);
    }
  }, [currentStepIndex, scenario.steps]);

  const progress = ((currentStepIndex + 1) / scenario.steps.length) * 100;

  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="h-[100dvh] bg-background flex flex-col overflow-hidden">
      {/* Navigation */}
      <nav className="relative z-40 h-16 border-b border-border/50 bg-background/80 backdrop-blur-md flex-shrink-0">
        <div className="h-full px-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/javascript" className="flex items-center gap-2 group">
              <Logo size={24} />
              <span className="hidden sm:inline text-sm font-semibold tracking-tight text-foreground group-hover:text-primary transition-colors">
                Back to JS
              </span>
            </Link>
            <div className="h-4 w-px bg-border/50 hidden sm:block"></div>
            
            {/* Custom Scenario Dropdown */}
            <div className="relative" ref={dropdownRef}>
              <button 
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="flex items-center gap-2 text-sm font-medium text-foreground bg-card border border-border/50 hover:border-primary/50 hover:bg-muted/30 rounded-lg px-2 sm:px-3 py-1.5 outline-none transition-all shadow-sm"
              >
                <span className="truncate max-w-[130px] sm:max-w-none text-xs sm:text-sm">{scenario.title}</span>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={cn("text-muted-foreground transition-transform duration-200", isDropdownOpen ? "rotate-180" : "")}><polyline points="6 9 12 15 18 9"></polyline></svg>
              </button>

              <AnimatePresence>
                {isDropdownOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -10, scale: 0.95 }}
                    transition={{ duration: 0.15, ease: "easeOut" }}
                    className="absolute top-full mt-2 left-0 w-64 bg-card border border-border/50 rounded-xl shadow-lg shadow-black/40 overflow-hidden z-50 p-1 backdrop-blur-xl"
                  >
                    {ALL_HOISTING_SCENARIOS.map((s) => (
                      <button
                        key={s.id}
                        onClick={() => {
                          setScenario(s);
                          setIsDropdownOpen(false);
                        }}
                        className={cn(
                          "w-full text-left px-3 py-2.5 text-sm rounded-lg transition-all flex items-center gap-2",
                          scenario.id === s.id 
                            ? "bg-primary/10 text-primary font-semibold" 
                            : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                        )}
                      >
                        {scenario.id === s.id ? (
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary shrink-0"><polyline points="20 6 9 17 4 12"></polyline></svg>
                        ) : (
                          <div className="w-[14px] shrink-0"></div>
                        )}
                        <span className="truncate">{s.title}</span>
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Integrated Playback Controls */}
          <div className="flex-1 max-w-3xl mx-4 sm:mx-8 flex justify-end lg:justify-center items-center gap-2 lg:gap-6">
            <div className="flex items-center gap-1">
              <button onClick={reset} className="p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors" title="Restart">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"></path><polyline points="3 3 3 8 8 8"></polyline></svg>
              </button>
              <button onClick={prevStep} disabled={currentStepIndex === 0} className="p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors disabled:opacity-50 disabled:hover:bg-transparent" title="Previous Step">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="19 20 9 12 19 4 19 20"></polygon><line x1="5" y1="19" x2="5" y2="5"></line></svg>
              </button>
              <button onClick={togglePlay} className="w-8 h-8 flex items-center justify-center rounded-full bg-foreground text-background hover:scale-105 transition-all shadow-sm mx-1" title={isPlaying ? "Pause" : "Play"}>
                {isPlaying ? (
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16"></rect><rect x="14" y="4" width="4" height="16"></rect></svg>
                ) : (
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" className="ml-0.5"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>
                )}
              </button>
              <button onClick={nextStep} disabled={currentStepIndex === scenario.steps.length - 1} className="p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors disabled:opacity-50 disabled:hover:bg-transparent" title="Next Step">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="5 4 15 12 5 20 5 4"></polygon><line x1="19" y1="5" x2="19" y2="19"></line></svg>
              </button>
            </div>

            <div className="hidden md:flex flex-1 items-center gap-3">
              <span className="text-[10px] font-mono text-muted-foreground font-medium whitespace-nowrap">
                {currentStepIndex + 1} / {scenario.steps.length}
              </span>
              <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden flex relative group cursor-pointer">
                {/* Invisible clickable track */}
                <div className="absolute inset-0 z-10 flex">
                  {scenario.steps.map((_, idx) => (
                    <div key={idx} className="flex-1 h-full hover:bg-white/10 transition-colors" onClick={() => setStep(idx)} title={`Go to step ${idx + 1}`}></div>
                  ))}
                </div>
                <div className="h-full bg-foreground transition-all duration-300 ease-out" style={{ width: `${progress}%` }}></div>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <ThemeToggle />
          </div>
        </div>
      </nav>

      {/* Toast Narration */}
      <AnimatePresence>
        {activeToast && (
          <motion.div
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-24 left-1/2 transform -translate-x-1/2 z-50 bg-primary text-primary-foreground px-6 py-3 rounded-full shadow-lg font-medium text-sm flex items-center gap-3"
          >
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-white"></span>
            </span>
            {activeToast}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Simulator Area */}
      <main className="flex-1 overflow-hidden flex flex-col p-4 md:p-6 gap-6 relative">

        {/* Variable Resolution / Error Overlay */}
        <AnimatePresence>
          {scenario.steps[currentStepIndex]?.visualEffect && (
            <motion.div 
              initial={{ opacity: 0, y: 20, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className={cn(
                "absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50 bg-black/90 backdrop-blur-md p-6 rounded-2xl border shadow-[0_0_40px_-10px_rgba(var(--primary),0.5)] flex flex-col gap-3 min-w-[300px]",
                scenario.steps[currentStepIndex].visualEffect!.action === "error" ? "border-red-500 shadow-red-500/50" : "border-primary/50"
              )}
            >
              <div className="flex items-center gap-3 text-gray-300">
                {scenario.steps[currentStepIndex].visualEffect!.action === "error" ? (
                  <div className="text-red-500">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
                  </div>
                ) : (
                  <div className="h-4 w-4 rounded-full border-2 border-primary border-t-transparent animate-spin"></div>
                )}
                <span className={scenario.steps[currentStepIndex].visualEffect!.action === "error" ? "text-red-400 font-bold" : ""}>
                  {scenario.steps[currentStepIndex].visualEffect!.action === "error" ? "Error accessing " : "Looking for "}
                  <span className={cn(
                    "font-mono px-1 rounded",
                    scenario.steps[currentStepIndex].visualEffect!.action === "error" ? "text-red-300 bg-red-900/30" : "text-primary bg-primary/10"
                  )}>
                    {scenario.steps[currentStepIndex].visualEffect!.target}
                  </span>
                </span>
              </div>
              <motion.div 
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.8 }}
                className={cn(
                  "flex items-center gap-3 font-semibold mt-2 pt-3 border-t border-border/50",
                  scenario.steps[currentStepIndex].visualEffect!.action === "error" ? "text-red-500" : "text-green-400"
                )}
              >
                {scenario.steps[currentStepIndex].visualEffect!.action === "error" ? (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                ) : (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                )}
                {scenario.steps[currentStepIndex].visualEffect!.action === "error" ? "Failed in " : "Found in "}
                {scenario.steps[currentStepIndex].visualEffect!.context}
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Responsive Layout */}
        <div className="flex-1 flex flex-col lg:grid lg:grid-cols-3 gap-4 lg:gap-6 min-h-0 relative overflow-hidden">
          {/* Top/Left: Code Panel */}
          <div className="flex-[0_0_45%] min-h-0 lg:flex-none lg:h-full lg:col-span-1 shrink-0">
            <CodePanel />
          </div>

          {/* Desktop: Grid for Stack & Context */}
          <div className="hidden lg:contents">
            <div className="h-full min-h-0">
              <CallStackPanel />
            </div>
            <div className="h-full min-h-0">
              <ExecutionContextPanel />
            </div>
          </div>

          {/* Mobile: Tabs for Stack & Context */}
          <div className="flex-1 flex flex-col lg:hidden min-h-0 relative">
            <MobileTabbedPanels />
          </div>
        </div>
      </main>
    </div>
  );
}
