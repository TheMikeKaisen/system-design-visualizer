"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  ChevronLeft,
  Network,
  FileCode,
} from "lucide-react";
import { useNetworkSimulationStore } from "@/store/useNetworkSimulationStore";
import { useNetworkKeyboardShortcuts } from "@/hooks/useNetworkKeyboardShortcuts";
import { ALL_NETWORK_SCENARIOS } from "@/lib/network-simulator/scenarios";
import { NetworkTopologyCanvas } from "./NetworkTopologyCanvas";
import { SocketTablePanel } from "./SocketTablePanel";
import { PacketInspectorPanel } from "./PacketInspectorPanel";
import { InteractiveExplanationBar } from "./InteractiveExplanationBar";
import { ScenarioDropdown } from "@/components/ui/ScenarioDropdown";
import { NetworkPlaybackBar } from "./NetworkPlaybackBar";

interface NetworkEpisodeShellProps {
  episodeNumber: number | string;
  title: string;
}

export function NetworkEpisodeShell({ episodeNumber, title }: NetworkEpisodeShellProps) {
  const {
    scenario,
    currentStepIndex,
    isPlaying,
    playbackSpeed,
    selectedPacket,
    selectedSocket,
    nextStep,
    prevStep,
    reset,
    togglePlay,
    setScenario,
    setPlaybackSpeed,
    setSelectedPacket,
    setSelectedSocket,
  } = useNetworkSimulationStore();

  const [activeInspectorTab, setActiveInspectorTab] = useState<"sockets" | "packet">("sockets");

  const steps = scenario.steps ?? [];
  const safeIndex = Math.max(0, Math.min(currentStepIndex, steps.length - 1));
  const currentStep = steps[safeIndex] ?? null;
  const totalSteps = steps.length;

  // Auto-play interval effect
  useEffect(() => {
    if (!isPlaying) return;

    const baseDelayMs = 2400;
    const intervalMs = baseDelayMs / playbackSpeed;

    const timer = setInterval(() => {
      const state = useNetworkSimulationStore.getState();
      if (state.currentStepIndex < state.scenario.steps.length - 1) {
        state.nextStep();
      } else {
        state.pause();
      }
    }, intervalMs);

    return () => clearInterval(timer);
  }, [isPlaying, playbackSpeed]);

  // Fresh-start cleanup on route leave (Decision Record 002)
  useEffect(() => {
    return () => {
      useNetworkSimulationStore.getState().resetEpisode();
    };
  }, []);

  // Keyboard navigation shortcuts
  useNetworkKeyboardShortcuts({
    onPlayPause: togglePlay,
    onNext: nextStep,
    onPrev: prevStep,
    onReset: reset,
    canNext: currentStepIndex < totalSteps - 1,
    canPrev: currentStepIndex > 0,
    isEnabled: true,
  });

  return (
    <div className="flex flex-col min-h-screen lg:h-screen bg-[#050608] text-foreground font-sans overflow-y-auto lg:overflow-hidden select-none">
      {/* ── 1. Top Standard Navigation Bar ── */}
      <nav className="h-16 shrink-0 border-b border-border/60 bg-zinc-950 flex items-center justify-between px-3 sm:px-6 z-50 shadow-sm relative font-mono text-xs">
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          <Link
            href="/computer-networks"
            className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm font-sans font-medium text-zinc-400 hover:text-teal-400 transition-colors group touch-manipulation"
          >
            <div className="p-1 rounded-md bg-zinc-900 group-hover:bg-teal-500/10 transition-colors">
              <ChevronLeft className="w-4 h-4 text-zinc-400 group-hover:text-teal-400" />
            </div>
            <span>Back</span>
          </Link>

          <div className="w-px h-4 bg-zinc-800 mx-0.5 sm:mx-1" />

          <div className="flex items-center gap-1.5 sm:gap-2">
            <span className="text-teal-400 font-semibold uppercase tracking-wider text-[11px] whitespace-nowrap shrink-0">
              Episode {episodeNumber}
            </span>
            <span className="text-zinc-600 hidden md:inline">•</span>
            <span className="text-zinc-300 font-sans font-semibold text-sm truncate max-w-[160px] md:max-w-md hidden md:inline">
              {title}
            </span>
          </div>
        </div>

        {/* Reusable Scenario Dropdown Component */}
        <ScenarioDropdown
          scenarios={ALL_NETWORK_SCENARIOS}
          activeScenarioId={scenario.id}
          onSelect={setScenario}
          accentColor="teal"
        />
      </nav>

      {/* ── 2. Interactive Docked Explanation Bar with In-Situ Concept Highlighting ── */}
      {currentStep && (
        <InteractiveExplanationBar
          key={`${scenario.id}-step-${safeIndex}`}
          safeIndex={safeIndex}
          totalSteps={totalSteps}
          badge={currentStep.badge}
          title={currentStep.title}
          explanation={currentStep.explanation}
          detailedNotes={currentStep.detailedNotes}
        />
      )}

      {/* ── 3. Main Stage: Topology Canvas & Tabbed Inspectors ── */}
      <main className="flex-1 min-h-0 p-3 sm:p-4 pb-20 sm:pb-4 grid grid-cols-1 lg:grid-cols-12 gap-3 sm:gap-4 overflow-visible lg:overflow-hidden">
        {/* Left/Center: Network Topology Canvas */}
        <section className="lg:col-span-7 h-auto lg:h-full min-h-[380px] sm:min-h-[420px]" aria-label="Network Topology View">
          <NetworkTopologyCanvas
            hosts={currentStep?.hosts ?? []}
            activePacket={currentStep?.activePacket ?? null}
            activeSockets={currentStep?.activeSockets ?? []}
            onSelectPacket={(pkt) => {
              setSelectedPacket(pkt);
              setActiveInspectorTab("packet");
            }}
          />
        </section>

        {/* Right: Contextual Telemetry (Sockets vs Packet Inspector) */}
        <section className="lg:col-span-5 h-auto lg:h-full flex flex-col min-h-[400px] lg:min-h-0 mt-3 lg:mt-0" aria-label="Network Context Panels">
          {/* Header Controls: Clean WAI-ARIA Tablist */}
          <div
            role="tablist"
            aria-label="Inspector navigation tabs"
            className="flex items-center gap-1 mb-2 bg-zinc-900/60 p-1 rounded-lg border border-border/60 shrink-0 font-mono text-xs"
          >
            <button
              type="button"
              role="tab"
              id="tab-sockets"
              aria-selected={activeInspectorTab === "sockets"}
              aria-controls="panel-sockets"
              onClick={() => setActiveInspectorTab("sockets")}
              className={`flex-1 py-1.5 px-3 rounded-md font-medium text-xs flex items-center justify-center gap-1.5 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-400 ${
                activeInspectorTab === "sockets"
                  ? "bg-zinc-800 text-teal-300 shadow-sm border border-zinc-700/60"
                  : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/40"
              }`}
            >
              <Network className="w-3.5 h-3.5 text-teal-400 shrink-0" />
              <span className="truncate">Sockets ({currentStep?.activeSockets.length ?? 0})</span>
            </button>
            <button
              type="button"
              role="tab"
              id="tab-packet"
              aria-selected={activeInspectorTab === "packet"}
              aria-controls="panel-packet"
              onClick={() => setActiveInspectorTab("packet")}
              className={`flex-1 py-1.5 px-3 rounded-md font-medium text-xs flex items-center justify-center gap-1.5 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-400 ${
                activeInspectorTab === "packet"
                  ? "bg-zinc-800 text-teal-300 shadow-sm border border-zinc-700/60"
                  : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/40"
              }`}
            >
              <FileCode className="w-3.5 h-3.5 text-teal-400 shrink-0" />
              <span className="truncate">Packet {currentStep?.activePacket ? "•" : ""}</span>
            </button>
          </div>

          {/* Panels Area */}
          <div className="flex-1 min-h-0">
            {activeInspectorTab === "sockets" ? (
              <div
                id="panel-sockets"
                role="tabpanel"
                aria-labelledby="tab-sockets"
                tabIndex={0}
                className="h-full focus:outline-none"
              >
                <SocketTablePanel
                  sockets={currentStep?.activeSockets ?? []}
                  selectedSocket={selectedSocket}
                  onSelectSocket={setSelectedSocket}
                />
              </div>
            ) : (
              <div
                id="panel-packet"
                role="tabpanel"
                aria-labelledby="tab-packet"
                tabIndex={0}
                className="h-full focus:outline-none"
              >
                <PacketInspectorPanel
                  packet={selectedPacket ?? currentStep?.activePacket ?? null}
                  scenarioId={scenario.id}
                  stepBadge={currentStep?.badge}
                  stepIndex={safeIndex}
                  selectedSocket={selectedSocket}
                  highlightedElement={currentStep?.highlightedElement}
                />
              </div>
            )}
          </div>
        </section>
      </main>

      {/* ── 4. Reusable Common Playback Bar (Attached at bottom on mobile) ── */}
      <NetworkPlaybackBar
        currentStepIndex={safeIndex}
        totalSteps={totalSteps}
        isPlaying={isPlaying}
        playbackSpeed={playbackSpeed}
        onPlayPause={togglePlay}
        onNext={nextStep}
        onPrev={prevStep}
        onReset={reset}
        onSpeedChange={setPlaybackSpeed}
        canNext={safeIndex < totalSteps - 1}
        canPrev={safeIndex > 0}
      />
    </div>
  );
}
