"use client";

import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, Check } from "lucide-react";
import { useJavaSimulationStore } from "@/store/useJavaSimulationStore";
import { ALL_TYPECASTING_SCENARIOS } from "@/lib/java-simulator/typecasting-scenarios";
import { cn } from "@/lib/utils";

export const ScenarioSelector = () => {
  const { scenario, setScenario } = useJavaSimulationStore();
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  return (
    <div className="relative z-50 w-[300px]" ref={containerRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "w-full flex items-center justify-between gap-3 px-4 py-2 text-sm text-left bg-black/20 hover:bg-black/40 border transition-colors rounded-xl shadow-sm outline-none focus:ring-2 focus:ring-primary/50",
          isOpen ? "border-primary/50 text-primary" : "border-border/50 text-foreground"
        )}
      >
        <span className="truncate font-medium">{scenario.title}</span>
        <ChevronDown className={cn("w-4 h-4 shrink-0 transition-transform duration-200", isOpen && "rotate-180")} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            className="absolute top-[calc(100%+8px)] left-0 w-[320px] bg-zinc-900/95 backdrop-blur-xl border border-border/50 rounded-xl shadow-2xl overflow-hidden"
          >
            <div className="max-h-[300px] overflow-y-auto p-1 custom-scrollbar">
              {ALL_TYPECASTING_SCENARIOS.map((s) => {
                const isActive = s.id === scenario.id;
                return (
                  <button
                    key={s.id}
                    onClick={() => {
                      setScenario(s.id);
                      setIsOpen(false);
                    }}
                    className={cn(
                      "w-full flex items-center gap-3 px-3 py-2.5 text-sm text-left rounded-lg transition-colors group",
                      isActive 
                        ? "bg-primary/20 text-primary font-medium" 
                        : "text-gray-300 hover:bg-white/5 hover:text-foreground"
                    )}
                  >
                    <div className={cn("w-4 h-4 shrink-0 flex items-center justify-center rounded-full border", isActive ? "border-primary bg-primary/20" : "border-transparent group-hover:border-gray-500")}>
                      {isActive && <Check className="w-3 h-3 text-primary" strokeWidth={3} />}
                    </div>
                    <span className="truncate flex-1">{s.title}</span>
                    {s.isChallengeMode && (
                      <span className="text-[9px] font-bold uppercase tracking-wider bg-orange-500/20 text-orange-400 px-1.5 py-0.5 rounded">Challenge</span>
                    )}
                  </button>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
