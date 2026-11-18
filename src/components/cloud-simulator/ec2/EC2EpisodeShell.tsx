"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Play,
  Pause,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  Globe,
  Key,
  Terminal,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ScenarioDropdown } from "@/components/ui/ScenarioDropdown";
import { InteractiveExplanationBar } from "@/components/network-simulator/InteractiveExplanationBar";
import { DualWorldNetworkCanvas } from "./DualWorldNetworkCanvas";
import { LockAndVaultInspector } from "./LockAndVaultInspector";
import { HandshakeCorridor } from "./HandshakeCorridor";
import { LiveTerminalMirror } from "./LiveTerminalMirror";
import { useEC2SimulationStore } from "@/store/useEC2SimulationStore";
import {
  EC2_SCENARIOS,
  AWS_EC2_GLOSSARY,
  EC2_TERM_PATTERNS,
} from "@/lib/ec2-simulator/scenarios";
import type { EC2ScenarioId } from "@/lib/ec2-simulator/types";

export type MobileTab = "network" | "crypto" | "terminal";

export interface EC2EpisodeShellProps {
  episodeNumber?: number | string;
  episodeTitle?: string;
  backHref?: string;
  backLabel?: string;
  className?: string;
}

export function EC2EpisodeShell({
  episodeNumber = 2,
  episodeTitle = "Amazon EC2: The Invisible Handshake",
  backHref = "/cloud",
  backLabel = "Back to Cloud Engineering",
  className,
}: EC2EpisodeShellProps) {
  // Mobile active tab: derived from active step layer, overridable by user click
  const [manualTab, setManualTab] = useState<MobileTab | null>(null);

  // Zustand Store Selectors
  const activeScenarioId = useEC2SimulationStore((s) => s.activeScenarioId);
  const currentStepIndex = useEC2SimulationStore((s) => s.currentStepIndex);
  const isPlaying = useEC2SimulationStore((s) => s.isPlaying);
  const playbackSpeed = useEC2SimulationStore((s) => s.playbackSpeed);
  const isPemModalOpen = useEC2SimulationStore((s) => s.isPemModalOpen);

  // Auto-follow step narrative on step transition (React state adjustment during render)
  const [prevStepIndex, setPrevStepIndex] = useState(currentStepIndex);
  if (currentStepIndex !== prevStepIndex) {
    setPrevStepIndex(currentStepIndex);
    setManualTab(null);
  }

  // Store Actions
  const selectScenario = useEC2SimulationStore((s) => s.selectScenario);
  const nextStep = useEC2SimulationStore((s) => s.nextStep);
  const prevStep = useEC2SimulationStore((s) => s.prevStep);
  const resetStep = useEC2SimulationStore((s) => s.resetStep);
  const togglePlay = useEC2SimulationStore((s) => s.togglePlay);
  const setPlaybackSpeed = useEC2SimulationStore((s) => s.setPlaybackSpeed);
  const resetEpisode = useEC2SimulationStore((s) => s.resetEpisode);

  // Unmount lifecycle cleanup
  useEffect(() => {
    return () => {
      resetEpisode();
    };
  }, [resetEpisode]);

  // Active scenario & safe step resolution
  const activeScenario = useMemo(() => {
    return EC2_SCENARIOS.find((s) => s.id === activeScenarioId) ?? EC2_SCENARIOS[0];
  }, [activeScenarioId]);

  const totalSteps = activeScenario.steps.length;
  const safeIndex = Math.max(0, Math.min(currentStepIndex, totalSteps - 1));
  const currentStep = activeScenario.steps[safeIndex] ?? activeScenario.steps[0];

  // Derive mobile tab from activeLayer when not manually overridden
  const derivedStepTab = useMemo<MobileTab>(() => {
    const layer = currentStep.activeLayer;
    if (
      layer === "client" ||
      layer === "network" ||
      layer === "gateway" ||
      layer === "security_group"
    ) {
      return "network";
    }
    if (
      layer === "instance" ||
      layer === "crypto" ||
      layer === "handshake"
    ) {
      return "crypto";
    }
    return "terminal";
  }, [currentStep.activeLayer]);

  const activeMobileTab = manualTab ?? derivedStepTab;

  const handleMobileTabClick = (tab: MobileTab) => {
    setManualTab(tab);
  };

  // Keyboard navigation
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      // Suppress simulation shortcuts when modal is open or when inside inputs
      if (
        isPemModalOpen ||
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement ||
        (e.target as HTMLElement)?.isContentEditable
      ) {
        return;
      }

      if (e.code === "Space") {
        e.preventDefault();
        togglePlay();
      } else if (e.code === "ArrowRight") {
        e.preventDefault();
        nextStep();
      } else if (e.code === "ArrowLeft") {
        e.preventDefault();
        prevStep();
      } else if (e.code === "KeyR" && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        resetStep();
      }
    },
    [isPemModalOpen, togglePlay, nextStep, prevStep, resetStep]
  );

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  const scenarioOptions = useMemo(
    () =>
      EC2_SCENARIOS.map((s) => ({
        id: s.id,
        title: s.name,
        description: s.description,
        badge: s.tag,
      })),
    []
  );

  return (
    <div
      className={cn(
        "min-h-screen lg:h-screen flex flex-col bg-[#050608] text-zinc-100 overflow-x-hidden font-sans selection:bg-amber-500/25 selection:text-amber-200",
        className
      )}
    >
      {/* ── Top Header / Navigation Bar ── */}
      <header className="relative z-50 shrink-0 h-14 border-b border-white/[0.08] bg-[#090b10]/95 backdrop-blur-md px-3 sm:px-6 flex items-center justify-between gap-2 sm:gap-3">
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <Link
            href={backHref}
            className="flex items-center gap-1.5 text-xs font-mono text-zinc-400 hover:text-zinc-100 transition-colors shrink-0 group focus:outline-none focus-visible:ring-1 focus-visible:ring-amber-400 rounded px-1.5 py-1 min-h-[44px]"
          >
            <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-0.5" />
            <span className="hidden sm:inline">{backLabel}</span>
            <span className="sm:hidden">Back</span>
          </Link>

          <div className="h-4 w-px bg-zinc-800 shrink-0 hidden sm:block" aria-hidden="true" />

          <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
            <span className="text-[10px] uppercase font-mono font-bold tracking-wider px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-400 border border-amber-500/30 shrink-0">
              Ep {episodeNumber}
            </span>
            <h1 className="text-xs sm:text-sm font-bold text-zinc-100 truncate">
              {episodeTitle}
            </h1>
          </div>
        </div>

        {/* Right Header Area: Scenario Selector */}
        <div className="flex items-center gap-2 shrink-0">
          <ScenarioDropdown
            scenarios={scenarioOptions}
            activeScenarioId={activeScenarioId}
            onSelect={(s) => {
              setManualTab(null);
              selectScenario(s.id as EC2ScenarioId);
            }}
            accentColor="amber"
            ariaLabel="Select EC2 Simulation Scenario"
          />
        </div>
      </header>

      {/* ── Interactive Explanation Bar ── */}
      <div className="shrink-0">
        <InteractiveExplanationBar
          safeIndex={safeIndex}
          totalSteps={totalSteps}
          badge={currentStep.conceptBadge ?? "EC2 Lifecycle"}
          title={currentStep.title}
          explanation={currentStep.explanation}
          customGlossary={AWS_EC2_GLOSSARY}
          customTermPatterns={EC2_TERM_PATTERNS}
          accentColor="amber"
        />
      </div>

      {/* ── Mobile Segmented Horizon Tabs (< 768px) ── */}
      <nav
        aria-label="Mobile Horizon Switcher"
        className="md:hidden sticky top-0 z-30 px-3 py-2 bg-[#090b10]/95 backdrop-blur-md border-b border-white/[0.08] flex items-center gap-1.5 shrink-0"
      >
        <button
          type="button"
          onClick={() => handleMobileTabClick("network")}
          className={cn(
            "flex-1 py-2 px-2.5 rounded text-xs font-mono font-medium flex items-center justify-center gap-1.5 transition-all min-h-[44px] touch-manipulation active:scale-95",
            activeMobileTab === "network"
              ? "bg-amber-500/20 text-amber-300 border border-amber-500/40 font-bold"
              : "text-zinc-400 hover:text-zinc-200 bg-zinc-900/40 border border-transparent"
          )}
        >
          <Globe className="w-3.5 h-3.5" />
          <span className="truncate">1. Network</span>
        </button>

        <button
          type="button"
          onClick={() => handleMobileTabClick("crypto")}
          className={cn(
            "flex-1 py-2 px-2.5 rounded text-xs font-mono font-medium flex items-center justify-center gap-1.5 transition-all min-h-[44px] touch-manipulation active:scale-95",
            activeMobileTab === "crypto"
              ? "bg-amber-500/20 text-amber-300 border border-amber-500/40 font-bold"
              : "text-zinc-400 hover:text-zinc-200 bg-zinc-900/40 border border-transparent"
          )}
        >
          <Key className="w-3.5 h-3.5" />
          <span className="truncate">2. Keys</span>
        </button>

        <button
          type="button"
          onClick={() => handleMobileTabClick("terminal")}
          className={cn(
            "flex-1 py-2 px-2.5 rounded text-xs font-mono font-medium flex items-center justify-center gap-1.5 transition-all min-h-[44px] touch-manipulation active:scale-95",
            activeMobileTab === "terminal"
              ? "bg-amber-500/20 text-amber-300 border border-amber-500/40 font-bold"
              : "text-zinc-400 hover:text-zinc-200 bg-zinc-900/40 border border-transparent"
          )}
        >
          <Terminal className="w-3.5 h-3.5" />
          <span className="truncate">3. Terminal</span>
        </button>
      </nav>

      {/* ── Main Unified Workspace Body (Zero Duplication) ── */}
      <main className="flex-1 p-3 sm:p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-3 sm:gap-4 overflow-y-auto lg:overflow-hidden pb-28 sm:pb-4 min-h-0">
        {/* Left Section: Network Topology */}
        <div
          className={cn(
            "h-auto sm:h-full min-h-0 md:col-span-1 lg:col-span-5",
            activeMobileTab === "network" ? "block" : "hidden md:block"
          )}
        >
          <DualWorldNetworkCanvas />
        </div>

        {/* Right Section: Cryptography, Handshake & Terminal */}
        <div
          className={cn(
            "flex flex-col gap-3 sm:gap-4 h-full min-h-0 md:col-span-1 lg:col-span-7",
            activeMobileTab !== "network" ? "flex" : "hidden md:flex"
          )}
        >
          {/* Top Half: Key Vault & Handshake */}
          <div
            className={cn(
              "flex flex-col gap-3 sm:gap-4 shrink-0",
              activeMobileTab === "terminal" ? "hidden md:flex" : "flex"
            )}
          >
            <LockAndVaultInspector />
            <HandshakeCorridor />
          </div>

          {/* Bottom Half: Live Terminal */}
          <div
            className={cn(
              "flex-1 min-h-[240px] lg:min-h-0",
              activeMobileTab === "crypto" ? "hidden md:block" : "block"
            )}
          >
            <LiveTerminalMirror />
          </div>
        </div>
      </main>

      {/* ── Bottom Playback Control Bar ── */}
      <footer className="fixed bottom-0 left-0 right-0 z-40 bg-[#090b10]/95 backdrop-blur-md border-t border-white/[0.08] px-4 py-2 sm:static sm:z-auto sm:px-6 flex items-center justify-between gap-3 shrink-0 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:pb-2.5 shadow-2xl">
        {/* Left: Step indicator */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono font-semibold text-zinc-300">
            Step {safeIndex + 1}/{totalSteps}
          </span>
          <span className="text-[10px] font-mono text-zinc-400 hidden md:inline">
            ({activeScenario.name})
          </span>
        </div>

        {/* Center: Playback Controls (Optimized for thumb reachability) */}
        <div className="flex items-center gap-2 sm:gap-2">
          {/* Prev Step */}
          <button
            type="button"
            onClick={prevStep}
            disabled={safeIndex === 0}
            className="p-2 sm:px-3 sm:py-1.5 rounded text-xs font-mono border border-zinc-700 bg-zinc-800/80 hover:bg-zinc-700 text-zinc-200 disabled:opacity-30 disabled:pointer-events-none transition-all active:scale-95 flex items-center gap-1 focus:outline-none focus-visible:ring-1 focus-visible:ring-amber-400 min-h-[44px] min-w-[44px] sm:min-w-0 justify-center touch-manipulation"
            title="Previous step (Left Arrow)"
            aria-label="Previous step"
          >
            <ChevronLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Prev</span>
          </button>

          {/* Play / Pause */}
          <button
            type="button"
            onClick={togglePlay}
            className={cn(
              "px-4 py-2 sm:px-3.5 sm:py-1.5 rounded text-xs font-mono font-bold transition-all active:scale-95 flex items-center gap-1.5 focus:outline-none focus-visible:ring-1 focus-visible:ring-amber-400 shadow-sm min-h-[44px] touch-manipulation",
              isPlaying
                ? "bg-amber-500 text-zinc-950 hover:bg-amber-400"
                : "bg-amber-500/20 text-amber-300 border border-amber-500/40 hover:bg-amber-500/30"
            )}
            title="Play / Pause simulation (Space)"
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

          {/* Next Step */}
          <button
            type="button"
            onClick={nextStep}
            disabled={safeIndex >= totalSteps - 1}
            className="p-2 sm:px-3 sm:py-1.5 rounded text-xs font-mono border border-zinc-700 bg-zinc-800/80 hover:bg-zinc-700 text-zinc-200 disabled:opacity-30 disabled:pointer-events-none transition-all active:scale-95 flex items-center gap-1 focus:outline-none focus-visible:ring-1 focus-visible:ring-amber-400 min-h-[44px] min-w-[44px] sm:min-w-0 justify-center touch-manipulation"
            title="Next step (Right Arrow)"
            aria-label="Next step"
          >
            <span className="hidden sm:inline">Next</span>
            <ChevronRight className="w-4 h-4" />
          </button>

          {/* Reset */}
          <button
            type="button"
            onClick={resetStep}
            className="p-2 sm:px-2.5 rounded text-xs font-mono text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/80 transition-colors focus:outline-none focus-visible:ring-1 focus-visible:ring-amber-400 min-h-[44px] min-w-[44px] sm:min-w-0 flex items-center justify-center touch-manipulation"
            title="Restart current scenario (R)"
            aria-label="Restart scenario"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>

        {/* Right: Speed & Keyboard info (Hidden on phones) */}
        <div className="hidden sm:flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-xs font-mono text-zinc-400">
            <span>Speed:</span>
            {[1, 1.5, 2].map((spd) => (
              <button
                key={spd}
                type="button"
                onClick={() => setPlaybackSpeed(spd)}
                className={cn(
                  "px-2 py-1 rounded text-[10px] font-mono border transition-colors min-h-[32px] min-w-[32px] flex items-center justify-center",
                  playbackSpeed === spd
                    ? "bg-amber-500/20 border-amber-500/40 text-amber-300 font-bold"
                    : "border-transparent text-zinc-500 hover:text-zinc-300"
                )}
              >
                {spd}x
              </button>
            ))}
          </div>

          <div className="h-3 w-px bg-zinc-800" aria-hidden="true" />

          <div className="text-[10px] font-mono text-zinc-400 hidden lg:inline">
            <kbd className="bg-zinc-800 px-1 py-0.5 rounded text-zinc-300">Space</kbd> Play,{" "}
            <kbd className="bg-zinc-800 px-1 py-0.5 rounded text-zinc-300">←</kbd>
            <kbd className="bg-zinc-800 px-1 py-0.5 rounded text-zinc-300">→</kbd> Steps
          </div>
        </div>
      </footer>
    </div>
  );
}
