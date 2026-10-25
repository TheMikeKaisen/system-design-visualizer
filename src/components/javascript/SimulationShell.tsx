"use client";

import React, { useEffect, useState, useRef, useCallback } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Logo } from "@/components/ui/Logo";
import { StepExplanationBar } from "@/components/javascript/StepExplanationBar";
import { useJSSimulationStore } from "@/store/useJSSimulationStore";
import { JSSimulationProvider } from "@/context/JSSimulationContext";
import { SimulationScenario, SimulationState } from "@/lib/js-simulator/engine";
import { cn } from "@/lib/utils";

export interface SimulationShellProps {
  scenarios: SimulationScenario[];
  defaultScenario?: SimulationScenario;
  backHref?: string;
  backLabel?: string;
  children: React.ReactNode;
  /** Optional custom overlays to render in addition to standard visualEffect and scopeLookup */
  customOverlays?: React.ReactNode;
}

export function SimulationShell({
  scenarios,
  defaultScenario,
  backHref = "/javascript",
  backLabel = "Back to JS",
  children,
  customOverlays,
}: SimulationShellProps) {
  const {
    scenario: storeScenario,
    currentStepIndex: storeStepIndex,
    isPlaying,
    nextStep,
    prevStep,
    reset,
    togglePlay,
    setStep,
    setScenario,
  } = useJSSimulationStore();

  const fallbackScenario = defaultScenario ?? scenarios[0];
  const isCurrentEpisode = scenarios.some((s) => s.id === storeScenario.id);
  const activeScenario = isCurrentEpisode ? storeScenario : fallbackScenario;
  const currentStepIndex = isCurrentEpisode ? storeStepIndex : 0;

  // Initialize store scenario if not matching this episode
  useEffect(() => {
    if (!scenarios.some((s) => s.id === storeScenario.id)) {
      setScenario(fallbackScenario);
    }
  }, [storeScenario.id, scenarios, fallbackScenario, setScenario]);

  // Clean up store on unmount
  useEffect(() => {
    return () => {
      useJSSimulationStore.getState().reset();
    };
  }, []);

  // Auto-play loop
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isPlaying) {
      timer = setTimeout(() => {
        nextStep();
      }, 2000);
    }
    return () => clearTimeout(timer);
  }, [isPlaying, currentStepIndex, nextStep]);

  // Step and progress calculations
  const steps: SimulationState[] = activeScenario.steps ?? [];
  const safeIndex = Math.max(0, Math.min(currentStepIndex, Math.max(0, steps.length - 1)));
  const currentState = steps[safeIndex] ?? null;
  const visualEffect = currentState?.visualEffect;
  const scopeLookup = currentState?.scopeLookup;
  const progress = steps.length > 0 ? ((safeIndex + 1) / steps.length) * 100 : 0;

  // Scenario dropdown state
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

  // Global Keyboard Shortcuts (WCAG 2.1.1)
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      // Ignore keystrokes when typing in inputs or textareas
      const target = e.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.tagName === "SELECT" ||
          target.isContentEditable)
      ) {
        return;
      }

      if (e.code === "Space") {
        e.preventDefault();
        togglePlay();
      } else if (e.code === "ArrowRight") {
        e.preventDefault();
        if (safeIndex < steps.length - 1) {
          nextStep();
        }
      } else if (e.code === "ArrowLeft") {
        e.preventDefault();
        if (safeIndex > 0) {
          prevStep();
        }
      } else if (e.code === "KeyR" || e.key === "r" || e.key === "R") {
        e.preventDefault();
        reset();
      }
    },
    [togglePlay, nextStep, prevStep, reset, safeIndex, steps.length]
  );

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  return (
    <JSSimulationProvider scenario={activeScenario} currentStepIndex={currentStepIndex}>
      <div className="h-[100dvh] bg-background flex flex-col overflow-hidden">
        {/* Navigation Bar */}
        <nav
          className="relative z-40 h-16 border-b border-border/50 bg-background/80 backdrop-blur-md flex-shrink-0"
          aria-label="Simulator Controls Navigation"
        >
          <div className="h-full px-4 sm:px-6 flex items-center justify-between">
            {/* Left: Back Link & Title/Dropdown */}
            <div className="flex items-center gap-3 sm:gap-4">
              <Link href={backHref} className="flex items-center gap-2 group" aria-label={backLabel}>
                <Logo size={24} />
                <span className="hidden sm:inline text-sm font-semibold tracking-tight text-foreground group-hover:text-primary transition-colors">
                  {backLabel}
                </span>
              </Link>

              <div className="h-4 w-px bg-border/50 hidden sm:block" />

              {scenarios.length > 1 ? (
                <div className="relative" ref={dropdownRef}>
                  <button
                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                    aria-haspopup="listbox"
                    aria-expanded={isDropdownOpen}
                    aria-label={`Select scenario, current: ${activeScenario.title}`}
                    className="flex items-center gap-2 text-sm font-medium text-foreground bg-card border border-border/50 hover:border-primary/50 hover:bg-muted/30 rounded-lg px-2 sm:px-3 py-1.5 outline-none transition-all shadow-sm"
                  >
                    <span className="truncate max-w-[130px] sm:max-w-none text-xs sm:text-sm">
                      {activeScenario.title}
                    </span>
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className={cn(
                        "text-muted-foreground transition-transform duration-200",
                        isDropdownOpen ? "rotate-180" : ""
                      )}
                    >
                      <polyline points="6 9 12 15 18 9" />
                    </svg>
                  </button>

                  <AnimatePresence>
                    {isDropdownOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: -10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -10, scale: 0.95 }}
                        transition={{ duration: 0.15, ease: "easeOut" }}
                        role="listbox"
                        className="absolute top-full mt-2 left-0 w-64 sm:w-72 bg-card border border-border/50 rounded-xl shadow-lg shadow-black/40 overflow-hidden z-50 p-1 backdrop-blur-xl"
                      >
                        {scenarios.map((s) => (
                          <button
                            key={s.id}
                            role="option"
                            aria-selected={activeScenario.id === s.id}
                            onClick={() => {
                              setScenario(s);
                              setIsDropdownOpen(false);
                            }}
                            className={cn(
                              "w-full text-left px-3 py-2.5 text-sm rounded-lg transition-all flex items-center gap-2",
                              activeScenario.id === s.id
                                ? "bg-primary/10 text-primary font-semibold"
                                : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                            )}
                          >
                            {activeScenario.id === s.id ? (
                              <svg
                                width="14"
                                height="14"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                className="text-primary shrink-0"
                              >
                                <polyline points="20 6 9 17 4 12" />
                              </svg>
                            ) : (
                              <div className="w-[14px] shrink-0" />
                            )}
                            <span className="truncate">{s.title}</span>
                          </button>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ) : (
                <h1 className="text-sm font-medium text-muted-foreground hidden sm:block truncate max-w-[200px] md:max-w-none">
                  {activeScenario.title}
                </h1>
              )}
            </div>

            {/* Center / Right: Integrated Playback Controls */}
            <div className="flex-1 max-w-2xl mx-2 sm:mx-6 flex justify-end lg:justify-center items-center gap-2 lg:gap-5">
              <div className="flex items-center gap-1 bg-muted/30 border border-border/40 rounded-xl p-1">
                <button
                  onClick={reset}
                  className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors"
                  title="Restart (R)"
                  aria-label="Restart simulation"
                >
                  <svg
                    width="15"
                    height="15"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
                    <polyline points="3 3 3 8 8 8" />
                  </svg>
                </button>
                <button
                  onClick={prevStep}
                  disabled={safeIndex === 0}
                  className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors disabled:opacity-40 disabled:hover:bg-transparent"
                  title="Previous Step (Left Arrow)"
                  aria-label="Previous Step"
                >
                  <svg
                    width="15"
                    height="15"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <polygon points="19 20 9 12 19 4 19 20" />
                    <line x1="5" y1="19" x2="5" y2="5" />
                  </svg>
                </button>
                <button
                  onClick={togglePlay}
                  className="w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center rounded-full bg-foreground text-background hover:scale-105 transition-all shadow-sm mx-1 focus-visible:outline-2 focus-visible:outline-primary"
                  title={isPlaying ? "Pause (Space)" : "Play (Space)"}
                  aria-label={isPlaying ? "Pause simulation" : "Play simulation"}
                >
                  {isPlaying ? (
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
                      <rect x="6" y="4" width="4" height="16" />
                      <rect x="14" y="4" width="4" height="16" />
                    </svg>
                  ) : (
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor" className="ml-0.5">
                      <polygon points="5 3 19 12 5 21 5 3" />
                    </svg>
                  )}
                </button>
                <button
                  onClick={nextStep}
                  disabled={safeIndex >= steps.length - 1}
                  className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors disabled:opacity-40 disabled:hover:bg-transparent"
                  title="Next Step (Right Arrow)"
                  aria-label="Next Step"
                >
                  <svg
                    width="15"
                    height="15"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <polygon points="5 4 15 12 5 20 5 4" />
                    <line x1="19" y1="5" x2="19" y2="19" />
                  </svg>
                </button>
              </div>

              {/* Progress Scrubber */}
              <div className="hidden md:flex flex-1 items-center gap-3">
                <span className="text-[11px] font-mono text-muted-foreground font-medium whitespace-nowrap min-w-[42px]">
                  {safeIndex + 1} / {steps.length}
                </span>
                <div
                  className="flex-1 h-2 bg-muted rounded-full overflow-hidden flex relative group cursor-pointer"
                  role="progressbar"
                  aria-valuenow={safeIndex + 1}
                  aria-valuemin={1}
                  aria-valuemax={steps.length}
                  aria-label="Simulation step progress"
                >
                  <div className="absolute inset-0 z-10 flex">
                    {steps.map((_, idx) => (
                      <div
                        key={idx}
                        className="flex-1 h-full hover:bg-white/10 transition-colors"
                        onClick={() => setStep(idx)}
                        title={`Go to step ${idx + 1}`}
                      />
                    ))}
                  </div>
                  <div
                    className="h-full bg-foreground transition-all duration-300 ease-out"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Right: Theme Toggle */}
            <div className="flex items-center gap-2">
              <ThemeToggle />
            </div>
          </div>
        </nav>

        {/* Step Explanation Bar (0% occlusion) */}
        <StepExplanationBar />

        {/* Main Content Area */}
        <div className="flex-1 min-h-0 relative flex flex-col overflow-hidden">
          {children}

          {/* Integrated Visual Effect Overlay: Variable Search & Resolution / Error */}
          <AnimatePresence>
            {visualEffect && visualEffect.action !== "syntax_error" && (
              <motion.div
                initial={{ opacity: 0, y: 20, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className={cn(
                  "absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50 bg-black/90 backdrop-blur-md p-6 rounded-2xl border shadow-[0_0_40px_-10px_rgba(var(--primary),0.5)] flex flex-col gap-3 min-w-[300px]",
                  visualEffect.action === "error" ? "border-red-500 shadow-red-500/50" : "border-primary/50"
                )}
              >
                <div className="flex items-center gap-3 text-gray-300">
                  {visualEffect.action === "error" ? (
                    <div className="text-red-500">
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="10" />
                        <line x1="12" y1="8" x2="12" y2="12" />
                        <line x1="12" y1="16" x2="12.01" y2="16" />
                      </svg>
                    </div>
                  ) : (
                    <div className="h-4 w-4 rounded-full border-2 border-primary border-t-transparent animate-spin" />
                  )}
                  <span className={visualEffect.action === "error" ? "text-red-400 font-bold" : ""}>
                    {visualEffect.action === "error" ? "Error accessing " : "Looking for "}
                    <span
                      className={cn(
                        "font-mono px-1 rounded",
                        visualEffect.action === "error" ? "text-red-300 bg-red-900/30" : "text-primary bg-primary/10"
                      )}
                    >
                      {visualEffect.target}
                    </span>
                    {visualEffect.action !== "error" && "..."}
                  </span>
                </div>
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.8 }}
                  className={cn(
                    "flex items-center gap-3 font-semibold mt-2 pt-3 border-t border-border/50",
                    visualEffect.action === "error" ? "text-red-500" : "text-green-400"
                  )}
                >
                  {visualEffect.action === "error" ? (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="18" y1="6" x2="6" y2="18" />
                      <line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                  ) : (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  )}
                  {visualEffect.reason ? (
                    visualEffect.reason
                  ) : (
                    <>
                      {visualEffect.action === "error" ? "Failed in " : "Found in "}
                      {visualEffect.context}
                    </>
                  )}
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Integrated Visual Effect Overlay: Syntax Error Modal */}
          <AnimatePresence>
            {visualEffect && visualEffect.action === "syntax_error" && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
              >
                <motion.div
                  initial={{ scale: 0.9, y: 20 }}
                  animate={{ scale: 1, y: 0 }}
                  className="bg-red-500/10 border border-red-500/30 p-8 rounded-2xl max-w-lg text-center"
                >
                  <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4 text-red-500">
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                      <line x1="12" y1="9" x2="12" y2="13" />
                      <line x1="12" y1="17" x2="12.01" y2="17" />
                    </svg>
                  </div>
                  <h2 className="text-xl font-bold text-red-500 mb-2">SyntaxError</h2>
                  <p className="text-red-400/80 mb-4">{visualEffect.target}</p>
                  <div className="text-sm text-muted-foreground bg-black/40 p-4 rounded-xl border border-white/5">
                    {visualEffect.reason || "Execution stopped due to a fatal error in the parsing phase."}
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Integrated Scope Lookup Resolution Trace Overlay */}
          <AnimatePresence>
            {scopeLookup && (
              <motion.div
                initial={{ opacity: 0, x: -20, y: 20 }}
                animate={{ opacity: 1, x: 0, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className={cn(
                  "absolute top-6 right-6 lg:right-1/3 z-50 bg-black/90 backdrop-blur-md p-4 rounded-xl border shadow-[0_0_40px_-10px_rgba(var(--primary),0.5)] flex flex-col gap-2 min-w-[300px] max-w-[400px]",
                  scopeLookup.status === "reference_error"
                    ? "border-red-500 shadow-red-500/30"
                    : scopeLookup.status === "found"
                    ? "border-green-500 shadow-green-500/30"
                    : "border-purple-500/50"
                )}
              >
                <div className="flex items-center justify-between mb-1 pb-2 border-b border-white/10">
                  <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <circle cx="11" cy="11" r="8" />
                      <line x1="21" y1="21" x2="16.65" y2="16.65" />
                    </svg>
                    Resolution Trace
                  </span>
                  {scopeLookup.status === "searching" && (
                    <div className="h-3 w-3 rounded-full border-2 border-purple-500 border-t-transparent animate-spin" />
                  )}
                </div>
                <div className="flex flex-col gap-1.5 font-mono text-[11px] leading-relaxed">
                  {(scopeLookup.traceLog ?? []).map((log: string, i: number) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.1 }}
                      className={cn(
                        "opacity-90",
                        log.includes("✅")
                          ? "text-green-400 font-bold"
                          : log.includes("❌")
                          ? "text-red-400"
                          : log.includes("💥")
                          ? "text-red-500 font-bold text-[12px]"
                          : log.includes("⚡")
                          ? "text-amber-400 font-bold"
                          : "text-gray-300"
                      )}
                    >
                      {log}
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {customOverlays}
        </div>
      </div>
    </JSSimulationProvider>
  );
}
