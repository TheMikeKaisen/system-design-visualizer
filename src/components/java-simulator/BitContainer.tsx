import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useJavaSimulationStore } from "@/store/useJavaSimulationStore";
import { cn } from "@/lib/utils";
import { Odometer } from "./Odometer";

// Helper to determine box sizes
const getBoxSize = (numBits: number) => {
  if (numBits <= 8) return "w-10 h-12 text-sm";
  if (numBits <= 16) return "w-6 h-8 text-xs";
  return "w-4 h-6 text-[10px]";
};

interface BitGridProps {
  bits: string;
  type: string;
  value?: string;
  isTarget?: boolean;
}

const BitGrid: React.FC<BitGridProps> = ({ bits, type, value, isTarget }) => {
  const isOmitted = bits.includes("x"); // e.g. xxxxxxxxxxxxxxxxxxxxxxxx00101100
  const isPadded = bits.includes("."); // e.g. ........................00011000
  
  const displayBits = bits.split("");
  const boxSize = getBoxSize(displayBits.length);

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="text-sm font-semibold text-primary bg-primary/10 px-3 py-1 rounded-full uppercase tracking-wider">
        {type}
      </div>
      <div className="flex gap-1 flex-wrap justify-center max-w-[800px]">
        {displayBits.map((bit, idx) => {
          let bgClass = "bg-zinc-800 border-zinc-700 text-gray-300";
          if (bit === "1") bgClass = "bg-primary/20 border-primary/50 text-primary";
          if (bit === ".") bgClass = "bg-transparent border-dashed border-zinc-600 text-transparent";
          if (bit === "x") bgClass = "bg-red-900/20 border-red-900/50 text-red-500/30 opacity-50";

          return (
            <motion.div
              key={idx}
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: idx * 0.01 }}
              className={cn(
                "flex items-center justify-center border font-mono rounded-sm transition-all duration-300",
                boxSize,
                bgClass
              )}
            >
              {bit === "." ? "" : bit === "x" ? "0" : bit}
            </motion.div>
          );
        })}
      </div>
      {value && (
        <div className="text-xs text-muted-foreground mt-2">
          Value: <span className="font-mono text-foreground">{value}</span>
        </div>
      )}
    </div>
  );
};

export const BitContainer: React.FC = () => {
  const { scenario, currentStepIndex, nextStep } = useJavaSimulationStore();
  const currentStep = scenario.steps[currentStepIndex];
  const [isDragged, setIsDragged] = useState(false);

  if (!currentStep) return null;

  const effect = currentStep.visualEffect;

  const handleDragComplete = () => {
    setIsDragged(true);
    setTimeout(() => {
      setIsDragged(false);
      nextStep();
    }, 1000);
  };

  return (
    <div className="h-full flex flex-col bg-zinc-950/80 backdrop-blur-xl border border-border/50 rounded-2xl overflow-hidden shadow-2xl p-6 relative">
      <div className="flex-1 flex flex-col items-center justify-center gap-12 relative">
        
        {effect?.type === "odometer" && effect.odometerValues ? (
          <Odometer values={effect.odometerValues} />
        ) : effect?.type === "red-wall" ? (
          <motion.div 
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="flex flex-col items-center gap-6"
          >
            <div className="text-xl font-mono text-red-500 bg-red-500/10 px-6 py-3 rounded-full border border-red-500/50 flex items-center gap-3">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>
              NOT ALLOWED
            </div>
            <div className="text-sm text-red-400/80 text-center max-w-sm">
              {effect.blockedReason}
            </div>
          </motion.div>
        ) : (
          <>
            {/* Source Display */}
            {currentStep.sourceBits ? (
              <motion.div layoutId="sourceGrid">
                <BitGrid 
                  bits={currentStep.sourceBits} 
                  type={currentStep.sourceType || "unknown"} 
                  value={currentStep.sourceValue} 
                />
              </motion.div>
            ) : currentStep.sourceValue && (
              <motion.div layoutId="sourceValue" className="flex flex-col items-center gap-3">
                <div className="text-sm font-semibold text-primary bg-primary/10 px-3 py-1 rounded-full uppercase tracking-wider">
                  {currentStep.sourceType}
                </div>
                <div className={cn("text-3xl sm:text-4xl font-mono border border-border/50 bg-black/20 px-6 py-4 rounded-xl", effect?.type === 'precision-loss' ? 'text-red-400 line-through opacity-80 text-2xl' : 'text-foreground')}>
                  {currentStep.sourceValue}
                </div>
              </motion.div>
            )}

            {/* Transition Arrows */}
            {(currentStep.targetBits || currentStep.targetValue) && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                className="flex flex-col items-center gap-2 text-muted-foreground"
              >
                <div className="w-px h-8 bg-gradient-to-b from-primary/50 to-transparent"></div>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary"><polyline points="7 10 12 15 17 10"></polyline></svg>
              </motion.div>
            )}

            {/* Target Display */}
            {currentStep.targetBits ? (
              <motion.div layoutId="targetGrid">
                <BitGrid 
                  bits={currentStep.targetBits} 
                  type={currentStep.targetType || "unknown"} 
                  value={currentStep.targetValue}
                  isTarget
                />
              </motion.div>
            ) : currentStep.targetValue && (
              <motion.div layoutId="targetValue" className="flex flex-col items-center gap-3">
                <div className="text-sm font-semibold text-primary bg-primary/10 px-3 py-1 rounded-full uppercase tracking-wider">
                  {currentStep.targetType}
                </div>
                <div className="text-3xl sm:text-4xl font-mono text-foreground border border-border/50 bg-black/20 px-6 py-4 rounded-xl overflow-hidden flex items-center">
                  {effect?.type === 'fractional-erasure' && effect.erasedFraction ? (
                    <>
                      <span>{currentStep.targetValue}</span>
                      <motion.span 
                        initial={{ opacity: 1, textDecoration: 'none' }}
                        animate={{ opacity: 0.3, textDecoration: 'line-through', color: '#ef4444' }}
                        className="text-red-500"
                      >
                        {effect.erasedFraction}
                      </motion.span>
                    </>
                  ) : effect?.type === 'precision-loss' ? (
                    <span className="text-orange-400 font-bold">{currentStep.targetValue}</span>
                  ) : (
                    currentStep.targetValue
                  )}
                </div>
              </motion.div>
            )}
          </>
        )}

        {/* Interactive Drag Hint */}
        {effect?.type === "bit-surgery" && effect.surgeryDraggable && !isDragged && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="absolute bottom-8 left-1/2 -translate-x-1/2 bg-primary/20 text-primary border border-primary/50 px-6 py-3 rounded-full cursor-pointer hover:bg-primary/30 transition-colors shadow-[0_0_20px_rgba(var(--primary),0.2)]"
            onClick={handleDragComplete}
          >
            Click to perform bit surgery
          </motion.div>
        )}
      </div>
    </div>
  );
};
