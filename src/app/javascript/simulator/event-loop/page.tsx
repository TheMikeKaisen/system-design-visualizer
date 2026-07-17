"use client";

import { useJSSimulationStore } from "@/store/useJSSimulationStore";
import { CodePanel } from "@/components/javascript/CodePanel";
import { CallStackPanel } from "@/components/javascript/CallStackPanel";
import { ConsolePanel } from "@/components/javascript/ConsolePanel";
import { WebAPIsPanel } from "@/components/javascript/WebAPIsPanel";
import { MicrotaskQueuePanel } from "@/components/javascript/MicrotaskQueuePanel";
import { CallbackQueuePanel } from "@/components/javascript/CallbackQueuePanel";
import { EventLoopIndicator } from "@/components/javascript/EventLoopIndicator";
import { EventLoopMobilePanels } from "@/components/javascript/EventLoopMobilePanels";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Logo } from "@/components/ui/Logo";
import Link from "next/link";
import { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { ALL_EVENT_LOOP_SCENARIOS } from "@/lib/js-simulator/event-loop-scenarios";

export default function JSEventLoopSimulator() {
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

  // Initialize with the first event loop scenario on mount
  useEffect(() => {
    if (!ALL_EVENT_LOOP_SCENARIOS.find(s => s.id === scenario.id)) {
      setScenario(ALL_EVENT_LOOP_SCENARIOS[0]);
    }
  }, [scenario.id, setScenario]);

  // Auto-play effect
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isPlaying) {
      timer = setTimeout(() => {
        nextStep();
      }, 2000); 
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
    } else {
      setActiveToast(null);
    }
  }, [currentStepIndex, scenario.steps]);

  // Explanation popup effect (disappears after 2s, pauses on hover)
  const [activeExplanation, setActiveExplanation] = useState<string | null>(null);
  const [isHoveringExplanation, setIsHoveringExplanation] = useState(false);

  useEffect(() => {
    let t: NodeJS.Timeout;
    if (scenario.steps[currentStepIndex]?.explanation) {
      setActiveExplanation(scenario.steps[currentStepIndex].explanation!);
      if (!isHoveringExplanation) {
        t = setTimeout(() => setActiveExplanation(null), 2000);
      }
    } else {
      setActiveExplanation(null);
    }
    return () => {
      if (t) clearTimeout(t);
    };
  }, [currentStepIndex, scenario.steps, isHoveringExplanation]);

  const progress = ((currentStepIndex + 1) / scenario.steps.length) * 100;

  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const currentState = scenario.steps[currentStepIndex];

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
            
            <div className="relative" ref={dropdownRef}>
              <button 
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="flex items-center gap-2 text-sm font-medium text-foreground bg-card border border-border/50 hover:border-primary/50 hover:bg-muted/30 rounded-lg px-2 sm:px-3 py-1.5 outline-none transition-all shadow-sm"
              >
                <span className="truncate max-w-[150px] sm:max-w-none text-xs sm:text-sm">{scenario.title}</span>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={cn("text-muted-foreground transition-transform duration-200", isDropdownOpen ? "rotate-180" : "")}><polyline points="6 9 12 15 18 9"></polyline></svg>
              </button>

              <AnimatePresence>
                {isDropdownOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -10, scale: 0.95 }}
                    transition={{ duration: 0.15, ease: "easeOut" }}
                    className="absolute top-full mt-2 left-0 w-72 bg-card border border-border/50 rounded-xl shadow-lg shadow-black/40 overflow-hidden z-50 p-1 backdrop-blur-xl"
                  >
                    {ALL_EVENT_LOOP_SCENARIOS.map((s) => (
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
            className="fixed top-24 left-1/2 transform -translate-x-1/2 z-50 bg-card border border-border text-foreground px-6 py-3 rounded-full shadow-xl shadow-black/20 font-medium text-sm flex items-center gap-3"
          >
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
            </span>
            {activeToast}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Simulator Area */}
      <main className="flex-1 overflow-hidden flex flex-col p-4 md:p-6 gap-4 relative">
        
        {/* Step Explanation Banner (Floating Popup) */}
        <div className="absolute top-6 left-1/2 transform -translate-x-1/2 z-50 w-full max-w-3xl pointer-events-none px-4">
          <AnimatePresence mode="wait">
            {activeExplanation && (
              <motion.div
                key={currentStepIndex}
                initial={{ opacity: 0, y: -10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -10, scale: 0.95 }}
                transition={{ duration: 0.2 }}
                className="bg-primary/95 backdrop-blur-md border border-primary/50 rounded-xl p-4 text-primary-foreground text-sm font-medium shadow-2xl flex items-start gap-3 mx-auto pointer-events-auto"
                onMouseEnter={() => setIsHoveringExplanation(true)}
                onMouseLeave={() => setIsHoveringExplanation(false)}
              >
                <div className="mt-0.5 shrink-0">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>
                </div>
                <p className="leading-relaxed">{activeExplanation}</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Desktop Layout - "Runtime Landscape" */}
        <div className="hidden lg:flex flex-col h-full gap-4 min-h-0 pt-10">
          
          {/* Top Half: Code & Engine */}
          <div className="flex-[3] flex gap-4 min-h-0">
            <div className="flex-1 min-h-0 relative shadow-sm">
              <CodePanel />
            </div>
            <div className="flex-1 min-h-0 relative shadow-sm">
              <CallStackPanel />
            </div>
            <div className="flex-1 min-h-0 relative shadow-sm">
              <WebAPIsPanel />
            </div>
          </div>

          {/* Bottom Half: Event Loop & Queues */}
          <div className="flex-[2] flex gap-4 bg-muted/5 p-4 rounded-xl border border-border/50 shadow-inner min-h-[160px] max-h-[240px]">
            <div className="flex-[2] min-w-0">
              <MicrotaskQueuePanel />
            </div>
            <div className="flex-1 min-w-[160px] flex flex-col justify-center">
              <div className="h-32">
                <EventLoopIndicator />
              </div>
            </div>
            <div className="flex-[2] min-w-0">
              <CallbackQueuePanel />
            </div>
            <div className="flex-[2] min-w-0">
              <ConsolePanel />
            </div>
          </div>
          
        </div>

        {/* Mobile Layout */}
        <div className="lg:hidden flex flex-col h-full gap-4 min-h-0">
          <div className="flex-1 min-h-0 shadow-sm rounded-xl overflow-hidden">
            <CodePanel />
          </div>
          <div className="flex-1 min-h-0 bg-card rounded-xl border border-border/50 p-2 shadow-sm">
            <EventLoopMobilePanels />
          </div>
        </div>

      </main>
    </div>
  );
}
