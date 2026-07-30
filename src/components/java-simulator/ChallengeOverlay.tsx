import React from "react";
import { motion } from "framer-motion";
import { useJavaSimulationStore } from "@/store/useJavaSimulationStore";
import { cn } from "@/lib/utils";

export const ChallengeOverlay: React.FC = () => {
  const { scenario, currentStepIndex, challengeSelectedAnswer, submitChallengeAnswer } = useJavaSimulationStore();
  const currentStep = scenario.steps[currentStepIndex];

  if (!scenario.isChallengeMode || !currentStep.challenge) return null;
  if (challengeSelectedAnswer !== null) return null; // Hide once answered

  const { question, options } = currentStep.challenge;

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-6">
      <motion.div 
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="max-w-md w-full bg-zinc-900 border border-primary/30 rounded-2xl p-8 shadow-[0_0_50px_-12px_rgba(var(--primary),0.3)] flex flex-col items-center text-center gap-6"
      >
        <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center text-primary mb-2">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>
        </div>
        
        <h2 className="text-xl font-bold text-foreground">Interview Challenge</h2>
        <p className="text-gray-300 mb-2">{question}</p>
        
        <div className="w-full flex flex-col gap-3">
          {options.map((option: string, idx: number) => (
            <button
              key={idx}
              onClick={() => submitChallengeAnswer(idx)}
              className="w-full py-3 px-4 rounded-xl border border-zinc-700 bg-zinc-800 hover:bg-zinc-700 hover:border-primary/50 transition-all text-left font-mono text-sm"
            >
              <span className="text-muted-foreground mr-3">{String.fromCharCode(65 + idx)}.</span>
              {option}
            </button>
          ))}
        </div>
      </motion.div>
    </div>
  );
};
