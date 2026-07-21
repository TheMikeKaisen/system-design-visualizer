"use client";

import { motion, AnimatePresence } from "framer-motion";
import type { OSLogEntry, ChapterMeta } from "@/lib/os-simulator/engine";
import { cn } from "@/lib/utils";
import { useRef, useEffect } from "react";
import { OSToast } from "./OSToast";

interface OSExplanationPanelProps {
  explanation: string;
  chapter?: ChapterMeta;
  /** Global step index */
  stepIndex: number;
  /** Step within the current chapter, 1-indexed */
  chapterStep: number;
  chapterTotal: number;
  logEntries: OSLogEntry[];
  activeToast?: string | null;
}

export function OSExplanationPanel({
  explanation,
  chapter,
  stepIndex,
  chapterStep,
  chapterTotal,
  logEntries,
  activeToast,
}: OSExplanationPanelProps) {
  const logEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll log to bottom on new entries
  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [logEntries.length]);

  return (
    <div className="flex flex-col h-full overflow-hidden">

      {/* ── EXPLANATION ── */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Chapter badge + step counter */}
        {chapter && (
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-teal-500/15 text-teal-500 text-[10px] font-bold uppercase tracking-wider">
              {chapter.title}
            </span>
            <span className="text-[10px] font-mono text-muted-foreground/40 ml-auto">
              {chapterStep} of {chapterTotal}
            </span>
          </div>
        )}

        {/* Explanation text — larger, easier to read */}
        <AnimatePresence mode="wait">
          <motion.div
            key={stepIndex}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.22 }}
          >
            <p className="text-sm text-foreground/90 leading-[1.8] tracking-wide">
              {explanation}
            </p>
          </motion.div>
        </AnimatePresence>

        <OSToast message={activeToast ?? null} variant="inline" />
      </div>

      {/* ── DIVIDER ── */}
      <div className="border-t border-border/30 mx-4" />

      {/* ── OS LOG ── */}
      <div className="flex-shrink-0 h-[220px] flex flex-col">
        <div className="flex items-center gap-2 px-4 py-2.5">
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-muted-foreground/40">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14 2 14 8 20 8" />
            <line x1="16" y1="13" x2="8" y2="13" />
            <line x1="16" y1="17" x2="8" y2="17" />
          </svg>
          <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/40">
            OS Log
          </span>
          <span className="ml-auto text-[10px] font-mono text-muted-foreground/30">
            {logEntries.length} entries
          </span>
        </div>

        <div className="flex-1 overflow-y-auto px-4 pb-3 space-y-1">
          <AnimatePresence initial={false}>
            {logEntries.map((entry, i) => (
              <motion.div
                key={`${entry.timeMs}-${i}`}
                initial={{ opacity: 0, x: 8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.2, delay: i === logEntries.length - 1 ? 0.1 : 0 }}
                className={cn(
                  "flex items-start gap-2 py-1 border-l-2 pl-2 text-[11px]",
                  i === logEntries.length - 1
                    ? "border-teal-500/50 text-foreground/80"
                    : "border-border/20 text-muted-foreground/40"
                )}
              >
                <span className="font-mono text-[10px] shrink-0 mt-px text-muted-foreground/30 w-12 text-right">
                  {entry.timeMs}ms
                </span>
                <span className="leading-relaxed">{entry.message}</span>
              </motion.div>
            ))}
          </AnimatePresence>
          <div ref={logEndRef} />
        </div>
      </div>
    </div>
  );
}
