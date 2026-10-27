"use client";

import React from "react";
import Link from "next/link";
import { Logo } from "@/components/ui/Logo";
import { ThemeToggle } from "@/components/ThemeToggle";
import { cn } from "@/lib/utils";
import { useOSKeyboardShortcuts } from "@/hooks/useOSKeyboardShortcuts";
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  RotateCcw,
  AlertTriangle,
  X,
  FileCode2,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export interface ConcurrencyScenarioOption {
  id: string;
  label: string;
  isActive: boolean;
}

export interface OSConcurrencyShellProps {
  title: string;
  subtitle?: string;
  currentStepIndex: number;
  totalSteps: number;
  isPlaying?: boolean;
  onPlayPause?: () => void;
  onNext?: () => void;
  onPrev?: () => void;
  onReset?: () => void;
  onStepSelect?: (index: number) => void;
  scenarios?: ConcurrencyScenarioOption[];
  onScenarioSelect?: (id: string) => void;

  // Chapter & Explanation
  chapter?: string;
  explanation: string;
  warningBadge?: {
    text: string;
    icon?: React.ReactNode;
  } | null;

  // Shared Resource Slot
  sharedResourceSlot: React.ReactNode;

  // Process A & B Slots
  processASlot: React.ReactNode;
  processBSlot: React.ReactNode;

  // Notes Panel
  noteTitle?: string | null;
  noteContent?: string | null;
  fallbackNote?: React.ReactNode;
  notesIcon?: React.ReactNode;

  // Code Modal Dialog
  isCodeModalOpen?: boolean;
  onCloseCodeModal?: () => void;
  codeModalTitle?: string;
  codeModalContent?: React.ReactNode;
}

/**
 * Standardized split-stage simulation shell for Concurrency & Synchronization visualizers (Episodes 5, 6, 7).
 * Encapsulates the shared arena, timeline scrubber, large circular sidebar controls,
 * scenario toggle pills, educational notes, code inspector modal, and canonical Sky (#0ea5e9) theming.
 */
export function OSConcurrencyShell({
  title,
  subtitle,
  currentStepIndex,
  totalSteps,
  isPlaying = false,
  onPlayPause,
  onNext,
  onPrev,
  onReset,
  onStepSelect,
  scenarios,
  onScenarioSelect,
  chapter,
  explanation,
  warningBadge,
  sharedResourceSlot,
  processASlot,
  processBSlot,
  noteTitle,
  noteContent,
  fallbackNote,
  notesIcon,
  isCodeModalOpen = false,
  onCloseCodeModal,
  codeModalTitle,
  codeModalContent,
}: OSConcurrencyShellProps) {
  const canPrev = currentStepIndex > 0;
  const canNext = currentStepIndex < totalSteps - 1;

  // WCAG 2.1.1 Keyboard Shortcuts (Space, ArrowLeft, ArrowRight, R)
  useOSKeyboardShortcuts({
    onPlayPause,
    onNext,
    onPrev,
    onReset,
    canNext,
    canPrev,
    isEnabled: !isCodeModalOpen,
  });

  return (
    <div className="flex flex-col h-[100dvh] bg-background text-foreground overflow-hidden">
      {/* ──────────── TOP NAVBAR ──────────── */}
      <nav
        className="h-14 border-b border-border/50 bg-background/80 backdrop-blur-md flex-shrink-0 z-30"
        aria-label="Concurrency Simulation Navigation"
      >
        <div className="h-full px-4 sm:px-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              href="/operating-systems"
              className="flex items-center gap-2 group shrink-0"
              title="Back to Operating Systems Track"
            >
              <Logo size={22} />
              <span className="hidden sm:inline text-sm font-semibold tracking-tight text-foreground group-hover:text-sky-500 transition-colors">
                Back to OS
              </span>
            </Link>

            <div className="h-4 w-px bg-border/50 hidden sm:block" />

            <div className="flex flex-col">
              <h1 className="text-sm font-semibold text-foreground tracking-tight leading-none">
                {title}
              </h1>
              {subtitle && (
                <span className="text-[10px] text-muted-foreground/70 font-mono mt-0.5">
                  {subtitle}
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <ThemeToggle />
          </div>
        </div>
      </nav>

      {/* ──────────── MAIN SPLIT STAGE ──────────── */}
      <main className="flex-1 flex flex-col md:flex-row overflow-hidden relative">
        {/* Left / Center Area: Simulation Stage */}
        <div className="flex-1 flex flex-col h-full overflow-hidden border-b md:border-b-0">
          {/* Top Shared Resource Area */}
          <div className="shrink-0 p-4 sm:p-5 border-b border-border/40 bg-card/40 backdrop-blur-sm">
            {sharedResourceSlot}
          </div>

          {/* Process Columns Area (Split-screen) */}
          <div className="flex-1 grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-border/40 overflow-y-auto bg-background/50">
            {/* Process A */}
            <div className="p-4 sm:p-5 flex flex-col min-h-[220px]">
              {processASlot}
            </div>

            {/* Process B */}
            <div className="p-4 sm:p-5 flex flex-col min-h-[220px]">
              {processBSlot}
            </div>
          </div>

          {/* Explanation Footer & Segmented Scrubber */}
          <div className="shrink-0 border-t border-border/40 bg-card/60 flex flex-col">
            <div className="p-4 sm:p-5 max-w-4xl mx-auto w-full flex flex-col justify-center relative">
              <div className="text-xs font-bold uppercase tracking-widest text-sky-500 dark:text-sky-400 mb-1.5 flex items-center gap-2 flex-wrap">
                {chapter && <span>{chapter}</span>}
                {chapter && <span className="w-1 h-1 rounded-full bg-border" />}
                <span className="text-muted-foreground">
                  Step {totalSteps > 0 ? currentStepIndex + 1 : 0} of {totalSteps}
                </span>

                {warningBadge && (
                  <>
                    <span className="w-1 h-1 rounded-full bg-border" />
                    <div className="text-[10px] font-bold uppercase tracking-wider bg-rose-500/15 text-rose-500 px-2 py-0.5 rounded-full border border-rose-500/20 animate-pulse flex items-center gap-1.5">
                      {warningBadge.icon ?? <AlertTriangle size={10} />}
                      {warningBadge.text}
                    </div>
                  </>
                )}
              </div>

              <motion.div
                key={`explanation-step-${currentStepIndex}`}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.15 }}
                className="text-base sm:text-lg text-foreground leading-relaxed"
              >
                {explanation}
              </motion.div>
            </div>

            {/* Segmented Timeline Progress Scrubber */}
            <div
              className="h-2 w-full bg-muted/60 flex relative group cursor-pointer"
              role="slider"
              aria-label="Simulation timeline scrubber"
              aria-valuenow={currentStepIndex}
              aria-valuemin={0}
              aria-valuemax={Math.max(0, totalSteps - 1)}
            >
              {Array.from({ length: totalSteps }).map((_, i) => (
                <div
                  key={`timeline-segment-${i}`}
                  className={cn(
                    "h-full flex-1 transition-all duration-200 border-r border-background/25 last:border-0",
                    i <= currentStepIndex ? "bg-sky-500" : "bg-transparent",
                    i === currentStepIndex &&
                      "bg-sky-400 shadow-[0_0_10px_rgba(14,165,233,0.9)]"
                  )}
                  onClick={() => onStepSelect?.(i)}
                  title={`Jump to Step ${i + 1}`}
                />
              ))}
            </div>
          </div>
        </div>

        {/* ──────────── RIGHT SIDEBAR: CONTROLS & NOTES ──────────── */}
        <aside className="w-full md:w-80 shrink-0 border-l border-border/40 bg-card/30 flex flex-col z-10">
          {/* Controls Section */}
          <div className="p-5 sm:p-6 border-b border-border/40">
            <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-4">
              Simulation Controls
            </h3>

            <div className="flex flex-col gap-3">
              {/* Circular Buttons */}
              <div className="flex justify-center items-center gap-2 mb-2">
                <button
                  type="button"
                  onClick={onPrev}
                  disabled={!canPrev}
                  className="w-10 h-10 rounded-full flex items-center justify-center bg-muted/50 hover:bg-muted text-foreground disabled:opacity-30 disabled:pointer-events-none transition-colors"
                  title="Previous Step (Left Arrow)"
                  aria-label="Previous step"
                >
                  <SkipBack className="w-4 h-4" />
                </button>

                {onPlayPause && (
                  <button
                    type="button"
                    onClick={onPlayPause}
                    className="w-12 h-12 rounded-full flex items-center justify-center bg-sky-500 hover:bg-sky-400 text-white shadow-lg shadow-sky-500/25 transition-all hover:scale-105 active:scale-95"
                    title={isPlaying ? "Pause (Space)" : "Play (Space)"}
                    aria-label={isPlaying ? "Pause simulation" : "Play simulation"}
                  >
                    {isPlaying ? (
                      <Pause className="w-5 h-5 fill-current" />
                    ) : (
                      <Play className="w-5 h-5 ml-1 fill-current" />
                    )}
                  </button>
                )}

                <button
                  type="button"
                  onClick={onNext}
                  disabled={!canNext}
                  className="w-10 h-10 rounded-full flex items-center justify-center bg-muted/50 hover:bg-muted text-foreground disabled:opacity-30 disabled:pointer-events-none transition-colors"
                  title="Next Step (Right Arrow)"
                  aria-label="Next step"
                >
                  <SkipForward className="w-4 h-4" />
                </button>

                <button
                  type="button"
                  onClick={onReset}
                  className="w-10 h-10 rounded-full flex items-center justify-center bg-muted/50 hover:bg-muted text-foreground transition-colors ml-1"
                  title="Restart (R)"
                  aria-label="Restart simulation"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
              </div>

              {/* Scenario Toggles */}
              {scenarios && scenarios.length > 0 && (
                <div role="tablist" aria-label="Simulation Scenarios" className="bg-background rounded-xl p-1 flex border border-border/60">
                  {scenarios.map((sc) => (
                    <button
                      key={`scenario-tab-${sc.id}`}
                      type="button"
                      role="tab"
                      aria-selected={sc.isActive}
                      onClick={() => onScenarioSelect?.(sc.id)}
                      className={cn(
                        "flex-1 py-1.5 text-[10px] font-bold uppercase tracking-widest rounded-lg transition-all",
                        sc.isActive
                          ? "bg-card text-foreground shadow-sm"
                          : "text-muted-foreground hover:text-foreground"
                      )}
                    >
                      {sc.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Notes Section */}
          <div className="flex-1 p-5 sm:p-6 overflow-y-auto">
            <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-4">
              Notes
            </h3>

            <AnimatePresence mode="popLayout">
              {noteTitle ? (
                <motion.div
                  key={`note-${noteTitle}`}
                  initial={{ opacity: 0, y: 14, scale: 0.97 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.97 }}
                  className="bg-sky-500/10 border border-sky-500/20 rounded-2xl p-5 relative overflow-hidden"
                >
                  <div className="absolute top-0 right-0 p-3 opacity-15 text-sky-500">
                    {notesIcon ?? <FileCode2 size={48} />}
                  </div>
                  <h4 className="text-sm font-bold text-sky-600 dark:text-sky-400 mb-2">
                    {noteTitle}
                  </h4>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {noteContent}
                  </p>
                </motion.div>
              ) : (
                fallbackNote ?? (
                  <div className="opacity-60 text-xs leading-relaxed space-y-3">
                    <p>
                      Step through the instructions to witness how preemptive context
                      switches trigger concurrency hazards.
                    </p>
                  </div>
                )
              )}
            </AnimatePresence>
          </div>
        </aside>
      </main>

      {/* ──────────── SHARED CODE MODAL DIALOG ──────────── */}
      <AnimatePresence>
        {isCodeModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6"
          >
            <div
              className="absolute inset-0 bg-background/80 backdrop-blur-sm cursor-pointer"
              onClick={onCloseCodeModal}
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 16 }}
              className="relative w-full max-w-2xl bg-[#1E1E1E] rounded-xl overflow-hidden shadow-2xl border border-[#333]"
              onClick={(e) => e.stopPropagation()}
            >
              {/* macOS Window Header */}
              <div className="flex items-center justify-between px-4 h-12 border-b border-[#333] bg-[#2D2D2D]">
                <div className="flex items-center gap-2">
                  <div className="flex gap-1.5 mr-4">
                    <div className="w-3 h-3 rounded-full bg-[#FF5F56]" />
                    <div className="w-3 h-3 rounded-full bg-[#FFBD2E]" />
                    <div className="w-3 h-3 rounded-full bg-[#27C93F]" />
                  </div>
                  <span className="text-sm font-mono text-zinc-400">
                    {codeModalTitle ?? "source_code.c"}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={onCloseCodeModal}
                  className="p-1 rounded hover:bg-white/10 text-zinc-400 hover:text-white transition-colors"
                  aria-label="Close code dialog"
                >
                  <X size={16} />
                </button>
              </div>

              {/* Code Content Slot */}
              <div className="p-6 font-mono text-sm leading-loose text-[#D4D4D4] overflow-x-auto">
                {codeModalContent}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
