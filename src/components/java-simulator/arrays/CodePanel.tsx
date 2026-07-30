"use client";

import React, { useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { useJavaArraysStore } from "@/store/useJavaArraysStore";
import { cn } from "@/lib/utils";

// Lightweight Java Syntax Highlighter
const highlightJava = (line: string) => {
  // Very simplistic tokenization for this specific episode
  const keywords = ["public", "class", "static", "void", "new"];
  const types = ["int", "String", "Student", "int[]", "int[][]", "Student[]"];
  const values = ["null"];
  
  // Quick regex to match words or symbols
  const tokens = line.split(/(\s+|\b|[\[\]\{\}\(\)\;\.\=\,])/).filter(Boolean);
  
  return tokens.map((token, i) => {
    if (!token.trim()) return <span key={i}>{token}</span>; // whitespace
    if (keywords.includes(token)) return <span key={i} className="text-pink-400 font-medium">{token}</span>;
    if (types.includes(token)) return <span key={i} className="text-yellow-300">{token}</span>;
    if (values.includes(token) || !isNaN(Number(token))) return <span key={i} className="text-emerald-400">{token}</span>;
    if (["{", "}", "[", "]", "(", ")", ";", ".", "=", ","].includes(token)) return <span key={i} className="text-gray-400">{token}</span>;
    
    // Default variable/method name
    return <span key={i} className="text-zinc-300">{token}</span>;
  });
};

export const CodePanel: React.FC = () => {
  const { scenario, currentStepIndex } = useJavaArraysStore();
  const currentStep = scenario.steps[currentStepIndex];
  
  const containerRef = useRef<HTMLDivElement>(null);
  const activeLineRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (activeLineRef.current && containerRef.current) {
      // Smooth scroll to the active line
      activeLineRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      });
    }
  }, [currentStep?.activeLine]);

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
            Main.java
          </span>
        </div>
      </div>
      
      <div ref={containerRef} className="flex-1 overflow-auto p-4 md:p-6 font-mono text-sm leading-relaxed relative">
        <div className="absolute top-0 left-0 bottom-0 w-12 bg-zinc-900/30 border-r border-border/30"></div>
        {codeLines.map((line: string, idx: number) => {
          const isLineActive = currentStep.activeLine === idx + 1;
          const isComment = line.trim().startsWith('//');
          
          return (
            <div 
              key={idx} 
              ref={isLineActive ? activeLineRef : null}
              className={cn(
                "relative flex items-start px-2 py-0.5 rounded transition-colors group",
                isLineActive ? "bg-amber-500/20 text-amber-100" : "text-gray-400 hover:bg-white/5"
              )}
            >
              <div className="w-8 flex-shrink-0 text-right pr-4 text-xs select-none relative z-10 text-gray-500">
                {idx + 1}
              </div>
              <div className="flex-1 whitespace-pre pl-2 z-10">
                {isComment ? (
                   <span className="text-green-500/80 italic">{line}</span>
                ) : (
                  highlightJava(line)
                )}
              </div>
              {isLineActive && (
                <motion.div 
                  layoutId="activeLineHighlightArrays"
                  className="absolute inset-0 bg-amber-500/10 border-l-2 border-amber-500"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.2 }}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
