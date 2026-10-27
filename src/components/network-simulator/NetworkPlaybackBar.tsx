"use client";

import React from "react";
import {
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  Play,
  Pause,
} from "lucide-react";
import { cn } from "@/lib/utils";

export interface NetworkPlaybackBarProps {
  currentStepIndex: number;
  totalSteps: number;
  isPlaying: boolean;
  playbackSpeed: number;
  onPlayPause: () => void;
  onNext: () => void;
  onPrev: () => void;
  onReset: () => void;
  onSpeedChange: (speed: number) => void;
  canNext?: boolean;
  canPrev?: boolean;
  className?: string;
}

export function NetworkPlaybackBar({
  currentStepIndex,
  totalSteps,
  isPlaying,
  playbackSpeed,
  onPlayPause,
  onNext,
  onPrev,
  onReset,
  onSpeedChange,
  canNext,
  canPrev,
  className,
}: NetworkPlaybackBarProps) {
  const safeIndex = Math.max(0, Math.min(currentStepIndex, totalSteps - 1));
  const isNextDisabled = canNext !== undefined ? !canNext : safeIndex === totalSteps - 1;
  const isPrevDisabled = canPrev !== undefined ? !canPrev : safeIndex === 0;

  return (
    <footer
      aria-label="Simulation playback controls"
      className={cn(
        // Mobile (< sm): Attached at bottom of viewport so play buttons are always reachable
        "fixed bottom-0 left-0 right-0 z-40 bg-zinc-950/95 backdrop-blur-md border-t border-border/60 shadow-[0_-8px_24px_rgba(0,0,0,0.6)]",
        // Desktop (sm:): Static/shrink-0 standard footer bar within document flow (undisturbed desktop layout)
        "sm:static sm:z-40 sm:shadow-lg sm:shrink-0",
        // Heights & layout
        "h-16 px-4 sm:px-6 flex items-center justify-center sm:justify-between",
        "font-mono text-xs select-none",
        // Safe area support for iOS home indicators
        "pb-[max(0.5rem,env(safe-area-inset-bottom))] sm:pb-0",
        className
      )}
    >
      {/* ── Left: Step indicator (Hidden on smaller screens < sm, visible on desktop) ── */}
      <div className="hidden sm:flex items-center gap-2 text-zinc-400 shrink-0">
        <span className="uppercase text-[10px] tracking-wider text-zinc-500 font-sans hidden md:inline">
          Timeline
        </span>
        <span className="text-zinc-300 font-bold text-xs whitespace-nowrap">
          Step <span className="text-teal-400">{safeIndex + 1}</span> of {totalSteps}
        </span>
      </div>

      {/* ── Center: Core Playback Controls (Previous, Play, Next) ── */}
      <div className="flex items-center gap-2 sm:gap-2">
        {/* Reset Button (Hidden on smaller screens < sm, visible on desktop) */}
        <button
          type="button"
          onClick={onReset}
          className="hidden sm:inline-flex p-2 rounded-lg text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 border border-zinc-800 transition-all active:scale-95 touch-manipulation focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-400"
          title="Reset Simulation (R)"
          aria-label="Reset simulation"
        >
          <RotateCcw className="w-4 h-4" />
        </button>

        {/* Previous Button */}
        <button
          type="button"
          onClick={onPrev}
          disabled={isPrevDisabled}
          className="flex items-center gap-1 px-3 sm:px-3 py-2 sm:py-2 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-200 sm:text-zinc-300 border border-zinc-800 disabled:opacity-30 disabled:pointer-events-none transition-all active:scale-95 touch-manipulation font-medium text-xs focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-400"
          title="Previous Step (ArrowLeft)"
          aria-label="Previous step"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>Prev</span>
        </button>

        {/* Play / Pause Toggle Button */}
        <button
          type="button"
          onClick={onPlayPause}
          className={cn(
            "flex items-center gap-1.5 px-4 sm:px-4 py-2 sm:py-2 rounded-lg font-bold text-xs shadow-sm transition-all active:scale-95 touch-manipulation focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-400",
            isPlaying
              ? "bg-amber-500/20 text-amber-300 border border-amber-500/40 hover:bg-amber-500/30"
              : "bg-teal-600/20 text-teal-300 border border-teal-500/40 hover:bg-teal-600/30"
          )}
          title="Play / Pause (Space)"
          aria-label={isPlaying ? "Pause simulation" : "Play simulation"}
        >
          {isPlaying ? (
            <>
              <Pause className="w-4 h-4 fill-current" />
              <span>Pause</span>
            </>
          ) : (
            <>
              <Play className="w-4 h-4 fill-current" />
              <span>Play</span>
            </>
          )}
        </button>

        {/* Next Button */}
        <button
          type="button"
          onClick={onNext}
          disabled={isNextDisabled}
          className="flex items-center gap-1 px-3 sm:px-3 py-2 sm:py-2 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-200 sm:text-zinc-300 border border-zinc-800 disabled:opacity-30 disabled:pointer-events-none transition-all active:scale-95 touch-manipulation font-medium text-xs focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-400"
          title="Next Step (ArrowRight)"
          aria-label="Next step"
        >
          <span>Next</span>
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* ── Right: Speed Selector & Keyboard Hints (Hidden on smaller screens < sm, visible on desktop) ── */}
      <div className="hidden sm:flex items-center gap-3 shrink-0">
        <div className="flex items-center gap-1 text-[11px] text-zinc-500 font-sans">
          <span className="hidden md:inline">Speed:</span>
          {[0.5, 1.0, 2.0].map((spd) => (
            <button
              key={spd}
              type="button"
              onClick={() => onSpeedChange(spd)}
              aria-label={`Playback speed ${spd}x`}
              aria-pressed={playbackSpeed === spd}
              className={cn(
                "px-1.5 py-0.5 rounded text-[10px] font-mono transition-colors touch-manipulation focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-400",
                playbackSpeed === spd
                  ? "bg-teal-500/20 text-teal-300 border border-teal-500/40"
                  : "text-zinc-500 hover:text-zinc-300"
              )}
            >
              {spd}x
            </button>
          ))}
        </div>

        <div className="hidden lg:flex items-center gap-2 text-[10px] text-zinc-600 border-l border-zinc-800 pl-3">
          <span className="px-1 py-0.5 rounded bg-zinc-900 border border-zinc-800">Space</span>
          <span>Play</span>
          <span className="px-1 py-0.5 rounded bg-zinc-900 border border-zinc-800">← / →</span>
          <span>Step</span>
          <span className="px-1 py-0.5 rounded bg-zinc-900 border border-zinc-800">R</span>
          <span>Reset</span>
        </div>
      </div>
    </footer>
  );
}

// Alias export for flexibility
export const NetworkPlaybackControls = NetworkPlaybackBar;
