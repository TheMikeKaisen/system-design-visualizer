import React from "react";
import { motion } from "framer-motion";
import { useJavaSimulationStore } from "@/store/useJavaSimulationStore";
import { cn } from "@/lib/utils";

export const CodePanel: React.FC = () => {
  const { scenario, currentStepIndex } = useJavaSimulationStore();
  const currentStep = scenario.steps[currentStepIndex];
  
  if (!currentStep) return null;

  const codeLines = currentStep.code.split('\n');

  return (
    <div className="h-full flex flex-col bg-zinc-950/80 backdrop-blur-xl border border-border/50 rounded-2xl overflow-hidden shadow-2xl relative">
      <div className="flex items-center justify-between px-4 py-3 border-b border-border/50 bg-zinc-900/50">
        <div className="flex items-center gap-2">
          <div className="flex gap-1.5">
            <div className="w-3 h-3 rounded-full bg-red-500/80"></div>
            <div className="w-3 h-3 rounded-full bg-yellow-500/80"></div>
            <div className="w-3 h-3 rounded-full bg-green-500/80"></div>
          </div>
          <span className="ml-2 text-xs font-mono text-muted-foreground/80">
            typecasting.java
          </span>
        </div>
      </div>
      
      <div className="flex-1 overflow-auto p-4 md:p-6 font-mono text-sm leading-relaxed relative">
        <div className="absolute top-0 left-0 bottom-0 w-12 bg-zinc-900/30 border-r border-border/30"></div>
        {codeLines.map((line: string, idx: number) => {
          const isLineActive = currentStep.activeLine === idx + 1;
          return (
            <div 
              key={idx} 
              className={cn(
                "relative flex items-start px-2 py-0.5 rounded transition-colors group",
                isLineActive ? "bg-primary/20 text-primary-foreground" : "text-gray-400 hover:bg-white/5",
                line.includes('//') ? "text-green-500/80" : ""
              )}
            >
              <div className="w-8 flex-shrink-0 text-right pr-4 text-xs select-none relative z-10 text-gray-500">
                {idx + 1}
              </div>
              <div className="flex-1 whitespace-pre pl-2 z-10">
                {isLineActive ? (
                  <span className="font-semibold text-primary/90">{line}</span>
                ) : (
                  <span>{line}</span>
                )}
              </div>
              {isLineActive && (
                <motion.div 
                  layoutId="activeLineHighlight"
                  className="absolute inset-0 bg-primary/10 border-l-2 border-primary"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.2 }}
                />
              )}
            </div>
          );
        })}
      </div>
      
      <div className="p-4 bg-zinc-900/50 border-t border-border/50">
        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Explanation</h3>
        <p className="text-sm text-gray-300 leading-relaxed">
          {currentStep.explanation}
        </p>
      </div>
    </div>
  );
};
