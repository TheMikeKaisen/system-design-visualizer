"use client";

import { useJavaSimulationStore } from "@/store/useJavaSimulationStore";
import { CodePanel } from "@/components/java-simulator/CodePanel";
import { BitContainer } from "@/components/java-simulator/BitContainer";
import { ChallengeOverlay } from "@/components/java-simulator/ChallengeOverlay";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Logo } from "@/components/ui/Logo";
import Link from "next/link";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ALL_TYPECASTING_SCENARIOS } from "@/lib/java-simulator/typecasting-scenarios";
import { ScenarioSelector } from "@/components/java-simulator/ScenarioSelector";

export default function JavaTypecastingSimulator() {
  const { 
    scenario, 
    currentStepIndex, 
    isPlaying,
    nextStep,
    prevStep,
    reset,
    togglePlay,
    setStep,
    setScenario,
    challengeSelectedAnswer
  } = useJavaSimulationStore();

  // Auto-play effect (only if not waiting for challenge)
  useEffect(() => {
    let timer: NodeJS.Timeout;
    const isWaitingForChallenge = scenario.isChallengeMode && challengeSelectedAnswer === null && currentStepIndex === 0;
    
    if (isPlaying && !isWaitingForChallenge) {
      timer = setTimeout(() => {
        nextStep();
      }, 2000); // 2 second delay between steps
    }
    return () => clearTimeout(timer);
  }, [isPlaying, currentStepIndex, nextStep, scenario.isChallengeMode, challengeSelectedAnswer]);

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

  return (
    <div className="h-[100dvh] bg-background flex flex-col overflow-hidden">
      {/* Navigation */}
      <nav className="h-16 border-b border-border/50 bg-background/80 backdrop-blur-md flex-shrink-0 z-40 relative">
        <div className="h-full px-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/java" className="flex items-center gap-2 group">
              <Logo size={24} />
              <span className="hidden sm:inline text-sm font-semibold tracking-tight text-foreground group-hover:text-primary transition-colors">
                Back to Java
              </span>
            </Link>
            <div className="h-4 w-px bg-border/50 hidden sm:block"></div>
            
            {/* Custom Scenario Selector */}
            <div className="hidden sm:block">
              <ScenarioSelector />
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
                <div className="absolute inset-0 z-10 flex">
                  {scenario.steps.map((_: any, idx: number) => (
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
        
        {/* Challenge Overlay if in Challenge Mode */}
        <ChallengeOverlay />

        {/* Responsive Layout */}
        <div className="flex-1 flex flex-col lg:grid lg:grid-cols-2 gap-4 lg:gap-6 min-h-0 relative overflow-hidden">
          
          {/* Top/Left: Code Panel */}
          <div className="flex-[0_0_45%] min-h-0 lg:flex-none lg:h-full lg:col-span-1 shrink-0 z-10">
            <CodePanel />
          </div>

          {/* Bottom/Right: Bit Container / Visualization */}
          <div className="flex-1 min-h-0 lg:flex-none lg:h-full lg:col-span-1 shrink-0 z-10">
            <BitContainer />
          </div>

        </div>

        {/* Interview Notes displayed after challenge answered */}
        <AnimatePresence>
          {scenario.isChallengeMode && challengeSelectedAnswer !== null && scenario.steps[currentStepIndex].challenge?.notes && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="absolute bottom-6 right-6 bg-zinc-900 border border-primary/50 p-4 rounded-xl max-w-md shadow-2xl z-40"
            >
              <h3 className="text-sm font-bold text-primary mb-1">Interview Note</h3>
              <p className="text-sm text-gray-300 leading-relaxed">
                {scenario.steps[currentStepIndex].challenge?.notes}
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
