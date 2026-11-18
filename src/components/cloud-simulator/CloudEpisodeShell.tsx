"use client";

import React, { useEffect, useMemo } from "react";
import Link from "next/link";
import { ArrowLeft, SlidersHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";
import { ScenarioDropdown } from "@/components/ui/ScenarioDropdown";
import { InteractiveExplanationBar } from "@/components/network-simulator/InteractiveExplanationBar";
import { NetworkPlaybackBar } from "@/components/network-simulator/NetworkPlaybackBar";
import { CloudTopologyCanvas } from "./CloudTopologyCanvas";
import { PolicyInspectorPanel } from "./PolicyInspectorPanel";
import { useCloudSimulationStore } from "@/store/useCloudSimulationStore";
import {
  IAM_SCENARIOS,
  AWS_IAM_GLOSSARY,
  AWS_TERM_PATTERNS,
} from "@/lib/cloud-simulator/scenarios";
import { useCloudKeyboardShortcuts } from "@/hooks/useCloudKeyboardShortcuts";

export interface CloudEpisodeShellProps {
  episodeNumber?: number | string;
  episodeTitle?: string;
  backHref?: string;
  backLabel?: string;
  className?: string;
}

export function CloudEpisodeShell({
  episodeNumber = 1,
  episodeTitle = "AWS IAM: Who Gets Access to What?",
  backHref = "/cloud",
  backLabel = "Back to Cloud Engineering",
  className,
}: CloudEpisodeShellProps) {
  // Activate WCAG keyboard shortcuts
  useCloudKeyboardShortcuts(true);

  // Zustand Store Selectors
  const activeScenarioId = useCloudSimulationStore((s) => s.activeScenarioId);
  const currentStepIndex = useCloudSimulationStore((s) => s.currentStepIndex);
  const isPlaying = useCloudSimulationStore((s) => s.isPlaying);
  const playbackSpeed = useCloudSimulationStore((s) => s.playbackSpeed);
  const isTelemetryExpanded = useCloudSimulationStore((s) => s.isTelemetryExpanded);

  // Store Actions
  const selectScenario = useCloudSimulationStore((s) => s.selectScenario);
  const nextStep = useCloudSimulationStore((s) => s.nextStep);
  const prevStep = useCloudSimulationStore((s) => s.prevStep);
  const resetStep = useCloudSimulationStore((s) => s.resetStep);
  const togglePlay = useCloudSimulationStore((s) => s.togglePlay);
  const setPlaybackSpeed = useCloudSimulationStore((s) => s.setPlaybackSpeed);
  const toggleTelemetry = useCloudSimulationStore((s) => s.toggleTelemetry);
  const resetEpisode = useCloudSimulationStore((s) => s.resetEpisode);

  // Unmount lifecycle cleanup (Decision Record 002 & Rule #8.4)
  useEffect(() => {
    return () => {
      resetEpisode();
    };
  }, [resetEpisode]);

  // Active scenario & safe step resolution
  const activeScenario = useMemo(() => {
    return IAM_SCENARIOS.find((s) => s.id === activeScenarioId) ?? IAM_SCENARIOS[0];
  }, [activeScenarioId]);

  const totalSteps = activeScenario.steps.length;
  const safeIndex = Math.max(0, Math.min(currentStepIndex, totalSteps - 1));
  const currentStep = activeScenario.steps[safeIndex] ?? activeScenario.steps[0];

  return (
    <div
      className={cn(
        "min-h-screen lg:h-screen flex flex-col bg-[#050608] text-zinc-100 overflow-x-hidden font-sans selection:bg-orange-500/25 selection:text-orange-200",
        className
      )}
    >
      {/* ── Top Header / Navigation Bar ── */}
      <header className="relative z-50 shrink-0 h-14 border-b border-white/[0.08] bg-[#090b10]/90 backdrop-blur-md px-4 sm:px-6 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <Link
            href={backHref}
            className="flex items-center gap-1.5 text-xs font-mono text-zinc-400 hover:text-zinc-100 transition-colors shrink-0 group focus:outline-none focus-visible:ring-1 focus-visible:ring-orange-400 rounded px-1.5 py-1"
          >
            <ArrowLeft className="w-3.5 h-3.5 transition-transform group-hover:-translate-x-0.5" />
            <span className="hidden sm:inline">{backLabel}</span>
            <span className="sm:hidden">Back</span>
          </Link>

          <div className="h-4 w-px bg-zinc-800 shrink-0 hidden sm:block" aria-hidden="true" />

          <div className="flex items-center gap-2 min-w-0">
            <span className="text-[10px] uppercase font-mono font-bold tracking-wider px-2 py-0.5 rounded-full bg-orange-500/15 text-orange-400 border border-orange-500/30 shrink-0">
              Episode {episodeNumber}
            </span>
            <h1 className="text-xs sm:text-sm font-bold text-zinc-100 truncate">
              {episodeTitle}
            </h1>
          </div>
        </div>

        {/* Right Header: Scenario Selector & Telemetry Toggle */}
        <div className="flex items-center gap-2 shrink-0">
          <ScenarioDropdown
            scenarios={IAM_SCENARIOS}
            activeScenarioId={activeScenario.id}
            onSelect={(sc) => selectScenario(sc.id)}
            accentColor="orange"
          />

          <button
            type="button"
            onClick={toggleTelemetry}
            title="Toggle Policy Inspector (Key T)"
            aria-label="Toggle telemetry and policy inspector"
            aria-pressed={isTelemetryExpanded}
            className={cn(
              "lg:hidden p-2 rounded-lg border text-xs font-mono transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-400 touch-manipulation",
              isTelemetryExpanded
                ? "bg-orange-500/20 text-orange-300 border-orange-500/40"
                : "bg-zinc-900 text-zinc-400 border-zinc-800 hover:text-zinc-200"
            )}
          >
            <SlidersHorizontal className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* ── Interactive Docked Explanation Bar ── */}
      <InteractiveExplanationBar
        safeIndex={safeIndex}
        totalSteps={totalSteps}
        badge={currentStep.badge}
        title={currentStep.title}
        explanation={currentStep.explanation}
        detailedNotes={currentStep.detailedNotes}
        customGlossary={AWS_IAM_GLOSSARY}
        customTermPatterns={AWS_TERM_PATTERNS}
        accentColor="orange"
      />

      {/* ── Main Stage Area ── */}
      <main className="flex-1 min-h-0 px-3 sm:px-6 py-3 sm:py-4 pb-24 sm:pb-4 overflow-y-auto lg:overflow-hidden">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 h-full items-stretch">
          {/* Left Panel: 3-Zone Architecture Canvas (7 Cols) */}
          <div className="lg:col-span-7 flex flex-col h-full overflow-y-auto custom-scrollbar">
            <CloudTopologyCanvas />
          </div>

          {/* Right Panel: Policy Inspector & Telemetry (5 Cols) */}
          <div
            className={cn(
              "lg:col-span-5 flex flex-col h-full overflow-hidden",
              // On mobile, show when toggled or stacked
              !isTelemetryExpanded && "hidden lg:flex"
            )}
          >
            <PolicyInspectorPanel />
          </div>
        </div>
      </main>

      {/* ── Docked Playback Bar ── */}
      <NetworkPlaybackBar
        currentStepIndex={safeIndex}
        totalSteps={totalSteps}
        isPlaying={isPlaying}
        playbackSpeed={playbackSpeed}
        onPlayPause={togglePlay}
        onNext={nextStep}
        onPrev={prevStep}
        onReset={resetStep}
        onSpeedChange={setPlaybackSpeed}
        canNext={safeIndex < totalSteps - 1}
        canPrev={safeIndex > 0}
        accentColor="orange"
      />
    </div>
  );
}
