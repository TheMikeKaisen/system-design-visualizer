"use client";

import React from "react";
import Link from "next/link";
import { Logo } from "@/components/ui/Logo";
import { ThemeToggle } from "@/components/ThemeToggle";
import { cn } from "@/lib/utils";
import { useOSKeyboardShortcuts } from "@/hooks/useOSKeyboardShortcuts";
import { RotateCcw, ChevronLeft, ChevronRight, Play, Pause } from "lucide-react";

export interface OSKernelChapter {
  title: string;
  startStep: number;
  endStep: number;
}

export interface OSKernelShellProps {
  title: string;
  currentStepIndex: number;
  totalSteps: number;
  isPlaying?: boolean;
  playbackSpeed?: number;
  onPlayPause?: () => void;
  onNext?: () => void;
  onPrev?: () => void;
  onReset?: () => void;
  onSpeedChange?: (speed: number) => void;
  chapters?: OSKernelChapter[];
  currentChapterIndex?: number;
  onChapterSelect?: (index: number) => void;
  headerExtra?: React.ReactNode;
  showProgress?: boolean;
  isKeyboardEnabled?: boolean;
  children: React.ReactNode;
}

/**
 * Standardized simulation shell for Kernel & Scheduling visualizers (Episodes 1 - 4).
 * Provides top navbar controls, WCAG 2.1.1 keyboard navigation, chapter scrubbers,
 * and canonical Sky (#0ea5e9) styling.
 */
export function OSKernelShell({
  title,
  currentStepIndex,
  totalSteps,
  isPlaying = false,
  playbackSpeed = 1,
  onPlayPause,
  onNext,
  onPrev,
  onReset,
  onSpeedChange,
  chapters,
  currentChapterIndex,
  onChapterSelect,
  headerExtra,
  showProgress = true,
  isKeyboardEnabled = true,
  children,
}: OSKernelShellProps) {
  const canPrev = currentStepIndex > 0;
  const canNext = currentStepIndex < totalSteps - 1;

  // Global WCAG 2.1.1 keyboard navigation
  useOSKeyboardShortcuts({
    onPlayPause,
    onNext,
    onPrev,
    onReset,
    canNext,
    canPrev,
    isEnabled: isKeyboardEnabled,
  });

  const progress = totalSteps > 0 ? ((currentStepIndex + 1) / totalSteps) * 100 : 0;

  return (
    <div className="h-[100dvh] bg-background flex flex-col overflow-hidden">
      {/* ──────────── TOP NAVBAR ──────────── */}
      <nav
        className="h-14 border-b border-border/50 bg-background/80 backdrop-blur-md flex-shrink-0 z-30"
        aria-label="Kernel Simulation Navigation"
      >
        <div className="h-full px-4 flex items-center gap-3">
          {/* Left: Back link + Title */}
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

          <h1 className="text-sm font-medium text-muted-foreground hidden md:block truncate max-w-[200px] lg:max-w-xs">
            {title}
          </h1>

          {/* Optional custom header actions (e.g. Mode Switcher pills) */}
          {headerExtra && <div className="shrink-0">{headerExtra}</div>}

          {/* Center: Playback Controls */}
          <div className="flex-1 flex justify-center items-center gap-1 sm:gap-2">
            {/* Chapter selection pills */}
            {chapters && chapters.length > 0 && (
              <div className="hidden lg:flex items-center gap-1 mr-3">
                {chapters.map((ch, i) => (
                  <button
                    key={`chapter-${ch.title}-${ch.startStep}`}
                    onClick={() => onChapterSelect?.(i)}
                    className={cn(
                      "px-2.5 py-1 rounded-lg text-[11px] font-medium transition-colors",
                      currentChapterIndex === i
                        ? "bg-sky-500/15 text-sky-600 dark:text-sky-400"
                        : "text-muted-foreground/60 hover:text-foreground hover:bg-muted"
                    )}
                  >
                    {ch.title}
                  </button>
                ))}
              </div>
            )}

            {/* Restart */}
            <button
              onClick={onReset}
              className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors"
              title="Restart"
              aria-label="Restart simulation (R)"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>

            {/* Step Back */}
            <button
              onClick={onPrev}
              disabled={!canPrev}
              className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors disabled:opacity-30 disabled:pointer-events-none"
              title="Previous Step"
              aria-label="Previous step (Left Arrow)"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            {/* Play / Pause Primary Button */}
            {onPlayPause && (
              <button
                onClick={onPlayPause}
                className="w-8 h-8 flex items-center justify-center rounded-full bg-sky-500 text-white hover:bg-sky-400 hover:scale-105 active:scale-95 transition-all shadow-sm shadow-sky-500/30"
                title={isPlaying ? "Pause" : "Play"}
                aria-label={isPlaying ? "Pause simulation (Space)" : "Play simulation (Space)"}
              >
                {isPlaying ? (
                  <Pause className="w-3.5 h-3.5 fill-current" />
                ) : (
                  <Play className="w-3.5 h-3.5 ml-0.5 fill-current" />
                )}
              </button>
            )}

            {/* Step Forward */}
            <button
              onClick={onNext}
              disabled={!canNext}
              className={cn(
                "rounded-lg transition-colors disabled:opacity-30 disabled:pointer-events-none",
                onPlayPause
                  ? "p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted"
                  : "w-8 h-8 flex items-center justify-center rounded-full bg-sky-500 text-white hover:bg-sky-400 hover:scale-105 active:scale-95 shadow-sm shadow-sky-500/30"
              )}
              title="Next Step"
              aria-label="Next step (Right Arrow)"
            >
              <ChevronRight className={onPlayPause ? "w-4 h-4" : "w-4 h-4 ml-0.5"} />
            </button>

            {/* Step Counter Badge */}
            <span className="hidden sm:block text-[10px] font-mono text-muted-foreground/60 ml-2 whitespace-nowrap">
              {totalSteps > 0 ? `${currentStepIndex + 1}/${totalSteps}` : "0/0"}
            </span>

            {/* Speed Selector Pills */}
            {onSpeedChange && (
              <div className="hidden md:flex items-center gap-1 ml-2">
                {[0.5, 1, 2].map((speed) => (
                  <button
                    key={`speed-pill-${speed}`}
                    onClick={() => onSpeedChange(speed)}
                    className={cn(
                      "px-1.5 py-0.5 rounded text-[10px] font-mono transition-colors",
                      playbackSpeed === speed
                        ? "bg-sky-500/15 text-sky-600 dark:text-sky-400 font-bold"
                        : "text-muted-foreground/50 hover:text-foreground"
                    )}
                  >
                    {speed}x
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Right: Theme Toggle */}
          <div className="flex items-center gap-2 shrink-0">
            <ThemeToggle />
          </div>
        </div>

        {/* ──────────── PROGRESS BAR ──────────── */}
        {showProgress && (
          <div className="h-[2px] bg-muted/40 w-full overflow-hidden">
            <div
              className="h-full bg-sky-500 transition-all duration-300 ease-out shadow-[0_0_8px_rgba(14,165,233,0.6)]"
              style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
            />
          </div>
        )}
      </nav>

      {/* ──────────── STAGE CONTENT ──────────── */}
      <div className="flex-1 flex flex-col min-h-0 overflow-hidden relative">
        {children}
      </div>
    </div>
  );
}
