"use client";

import React, { useEffect, useState, ReactNode } from "react";
import Link from "next/link";
import {
  ChevronLeft,
  Network,
  FileCode,
  PanelRightClose,
  PanelRightOpen,
  X,
} from "lucide-react";
import { useNetworkSimulationStore } from "@/store/useNetworkSimulationStore";
import { useNetworkKeyboardShortcuts } from "@/hooks/useNetworkKeyboardShortcuts";
import { ALL_NETWORK_SCENARIOS } from "@/lib/network-simulator/scenarios";
import { NetworkTopologyCanvas } from "./NetworkTopologyCanvas";
import { SocketTablePanel } from "./SocketTablePanel";
import { PacketInspectorPanel } from "./PacketInspectorPanel";
import { InteractiveExplanationBar, type ConceptDefinition } from "./InteractiveExplanationBar";
import { ScenarioDropdown } from "@/components/ui/ScenarioDropdown";
import { NetworkPlaybackBar } from "./NetworkPlaybackBar";
import type { NetworkSimulationScenario, NetworkScenarioStep } from "@/lib/network-simulator/engine";

export interface TelemetryControls {
  isCollapsed: boolean;
  toggleCollapse: () => void;
  expandTelemetry: () => void;
  collapseTelemetry: () => void;
}

export interface NetworkEpisodeShellProps {
  episodeNumber: number | string;
  title: string;
  scenarios?: NetworkSimulationScenario[];
  accentColor?: "teal" | "amber" | "sky" | "emerald" | "violet" | "blue";
  canvasSpan?: "7" | "8";
  defaultTelemetryCollapsed?: boolean;
  customGlossary?: Record<string, ConceptDefinition>;
  customTermPatterns?: string[];
  canvasSlot?: (
    step: NetworkScenarioStep | null,
    safeIndex: number,
    telemetryControls: TelemetryControls
  ) => ReactNode;
  telemetrySlot?: (
    step: NetworkScenarioStep | null,
    safeIndex: number,
    telemetryControls: TelemetryControls
  ) => ReactNode;
}

export function NetworkEpisodeShell({
  episodeNumber,
  title,
  scenarios = ALL_NETWORK_SCENARIOS,
  accentColor = "teal",
  canvasSpan = "7",
  defaultTelemetryCollapsed = true,
  customGlossary,
  customTermPatterns,
  canvasSlot,
  telemetrySlot,
}: NetworkEpisodeShellProps) {
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
  const [isTelemetryCollapsed, setIsTelemetryCollapsed] = useState(defaultTelemetryCollapsed);

  const telemetryControls: TelemetryControls = {
    isCollapsed: isTelemetryCollapsed,
    toggleCollapse: () => setIsTelemetryCollapsed((prev) => !prev),
    expandTelemetry: () => setIsTelemetryCollapsed(false),
    collapseTelemetry: () => setIsTelemetryCollapsed(true),
  };

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
    onToggleTelemetry: telemetryControls.toggleCollapse,
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

        {/* Right side of Nav: Reusable Scenario Dropdown Component + Quick Telemetry Toggle */}
        <div className="flex items-center gap-2">
          <ScenarioDropdown
            scenarios={scenarios}
            activeScenarioId={scenario.id}
            onSelect={setScenario}
            accentColor={accentColor}
          />

          <button
            type="button"
            onClick={telemetryControls.toggleCollapse}
            aria-label="Toggle Telemetry Panel (T)"
            aria-pressed={!isTelemetryCollapsed}
            title={isTelemetryCollapsed ? "Expand Telemetry Panel (T)" : "Collapse Telemetry Panel (T)"}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-mono transition-all active:scale-95 touch-manipulation focus:outline-none focus-visible:ring-1 focus-visible:ring-teal-400 shrink-0 ${
              isTelemetryCollapsed
                ? "bg-teal-500/10 text-teal-300 border-teal-500/40 hover:bg-teal-500/20"
                : "bg-zinc-900 text-zinc-400 hover:text-zinc-200 border-border/70 hover:bg-zinc-800"
            }`}
          >
            {isTelemetryCollapsed ? (
              <PanelRightOpen className="w-4 h-4 text-teal-400 shrink-0" />
            ) : (
              <PanelRightClose className="w-4 h-4 shrink-0" />
            )}
            <span className="hidden sm:inline font-sans font-medium text-xs">
              {isTelemetryCollapsed ? "Expand Telemetry" : "Telemetry"}
            </span>
          </button>
        </div>
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
          customGlossary={customGlossary}
          customTermPatterns={customTermPatterns}
        />
      )}

      {/* ── 3. Main Stage: Topology Canvas & Tabbed Inspectors ── */}
      <main className="flex-1 min-h-0 p-3 sm:p-4 pb-24 sm:pb-4 flex flex-col lg:flex-row gap-3 sm:gap-4 overflow-visible lg:overflow-hidden relative">
        {/* Left/Center: Network Topology Canvas */}
        <section
          style={{
            flex: isTelemetryCollapsed
              ? "1 1 0%"
              : canvasSpan === "8"
              ? "8 1 0%"
              : "7 1 0%",
          }}
          className="w-full min-w-0 h-auto lg:h-full min-h-[380px] sm:min-h-[420px] transition-all duration-350 ease-[cubic-bezier(0.23,1,0.32,1)] flex flex-col"
          aria-label="Network Topology View"
        >
          {canvasSlot ? (
            canvasSlot(currentStep, safeIndex, telemetryControls)
          ) : (
            <NetworkTopologyCanvas
              hosts={currentStep?.hosts ?? []}
              activePacket={currentStep?.activePacket ?? null}
              activeSockets={currentStep?.activeSockets ?? []}
              onSelectPacket={(pkt) => {
                setSelectedPacket(pkt);
                setActiveInspectorTab("packet");
                setIsTelemetryCollapsed(false);
              }}
            />
          )}
        </section>

        {/* Mobile Backdrop for Slide-Up Bottom Sheet Drawer (< lg) */}
        {!isTelemetryCollapsed && (
          <div
            className="fixed inset-0 z-30 bg-black/60 backdrop-blur-xs lg:hidden transition-opacity"
            onClick={() => setIsTelemetryCollapsed(true)}
            aria-hidden="true"
          />
        )}

        {/* Right: Contextual Telemetry (Desktop Side Column vs Mobile Slide-Up Bottom Sheet Drawer) */}
        <section
          style={{
            flex: isTelemetryCollapsed
              ? "0 0 auto"
              : canvasSpan === "8"
              ? "4 1 0%"
              : "5 1 0%",
          }}
          className={`${
            isTelemetryCollapsed
              ? "hidden lg:flex lg:w-14 shrink-0 min-h-0"
              : "fixed inset-x-0 bottom-16 sm:bottom-0 z-40 max-h-[82vh] h-[75vh] lg:h-full lg:max-h-none lg:static lg:bottom-auto lg:z-auto flex flex-col rounded-t-2xl lg:rounded-xl bg-zinc-950/98 backdrop-blur-xl border-t border-border/80 lg:border-t-0 shadow-2xl lg:shadow-none overflow-hidden"
          } h-auto lg:h-full flex-col mt-0 transition-all duration-350 ease-[cubic-bezier(0.23,1,0.32,1)]`}
          aria-label="Network Context Panels"
        >
          {/* Mobile Bottom Sheet Grab Handle & Header Bar (< lg) */}
          {!isTelemetryCollapsed && (
            <div className="lg:hidden flex items-center justify-between px-3.5 py-2.5 bg-[#0c0f17] border-b border-border/50 shrink-0">
              <div className="flex items-center gap-2 text-xs font-mono text-zinc-300">
                <span className="w-2 h-2 rounded-full bg-teal-400 shadow-[0_0_8px_rgba(20,184,166,0.6)]" />
                <span className="font-semibold text-xs tracking-wide">Telemetry Inspector</span>
              </div>
              <div className="w-10 h-1 rounded-full bg-zinc-700/80 -ml-16" />
              <button
                type="button"
                onClick={() => setIsTelemetryCollapsed(true)}
                aria-label="Close Telemetry Drawer"
                className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/80 active:scale-95 touch-manipulation focus:outline-none focus-visible:ring-1 focus-visible:ring-teal-400"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {telemetrySlot ? (
            telemetrySlot(currentStep, safeIndex, telemetryControls)
          ) : isTelemetryCollapsed ? (
            /* Pattern A: Default Docked Rail for Episode 1 */
            <aside
              aria-label="Telemetry Docked Rail"
              className="hidden lg:flex h-full w-full rounded-xl bg-[#080a0f] border border-border/60 flex-col items-center justify-start p-1.5 sm:p-2 gap-2 select-none font-mono shadow-sm transition-all duration-350 ease-[cubic-bezier(0.23,1,0.32,1)]"
            >
              <button
                type="button"
                onClick={() => setIsTelemetryCollapsed(false)}
                aria-label="Expand Telemetry Panel"
                title="Expand Telemetry Panel (T)"
                className="p-2 rounded-lg bg-zinc-900/90 hover:bg-zinc-800 active:scale-95 text-teal-400 border border-teal-500/30 hover:border-teal-500/60 transition-all focus:outline-none focus-visible:ring-1 focus-visible:ring-teal-400 touch-manipulation shrink-0"
              >
                <PanelRightOpen className="w-4 h-4" />
              </button>

              <div className="w-px h-6 lg:w-8 lg:h-px bg-zinc-800 shrink-0" />

              <button
                type="button"
                onClick={() => {
                  setActiveInspectorTab("sockets");
                  setIsTelemetryCollapsed(false);
                }}
                aria-label="Expand Sockets Table"
                title={`Sockets Table (${currentStep?.activeSockets.length ?? 0}) — Click to expand`}
                className={`flex flex-col items-center justify-center p-1.5 rounded-lg transition-all active:scale-95 focus:outline-none focus-visible:ring-1 focus-visible:ring-teal-400 touch-manipulation group ${
                  activeInspectorTab === "sockets"
                    ? "bg-zinc-800/90 text-teal-300 border border-teal-500/40 shadow-xs"
                    : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/40"
                }`}
              >
                <Network className="w-4 h-4 text-teal-400 shrink-0 group-hover:scale-110 transition-transform" />
                <span className="text-[9px] font-bold mt-1 text-teal-300 leading-none">
                  {currentStep?.activeSockets.length ?? 0}
                </span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setActiveInspectorTab("packet");
                  setIsTelemetryCollapsed(false);
                }}
                aria-label="Expand Packet Inspector"
                title={`Wire Packet Inspector ${currentStep?.activePacket ? "(Active)" : "(Idle)"} — Click to expand`}
                className={`flex flex-col items-center justify-center p-1.5 rounded-lg transition-all active:scale-95 focus:outline-none focus-visible:ring-1 focus-visible:ring-teal-400 touch-manipulation group ${
                  activeInspectorTab === "packet"
                    ? "bg-zinc-800/90 text-teal-300 border border-teal-500/40 shadow-xs"
                    : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/40"
                }`}
              >
                <FileCode className="w-4 h-4 text-teal-400 shrink-0 group-hover:scale-110 transition-transform" />
                <span className="text-[9px] font-mono mt-1 text-teal-300 leading-none">
                  {currentStep?.activePacket ? "pkt" : "idle"}
                </span>
              </button>
            </aside>
          ) : (
              <>
                {/* Header Controls: Clean WAI-ARIA Tablist + Minimize Toggle */}
                <div className="flex items-center justify-between gap-1 mb-2 shrink-0">
                  <div
                    role="tablist"
                    aria-label="Inspector navigation tabs"
                    className="flex items-center gap-1 bg-zinc-900/60 p-1 rounded-lg border border-border/60 flex-1 font-mono text-xs"
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

                  <button
                    type="button"
                    onClick={() => setIsTelemetryCollapsed(true)}
                    aria-label="Collapse Telemetry Panel"
                    title="Collapse Telemetry Panel (T)"
                    className="p-1.5 rounded-lg bg-zinc-900/60 hover:bg-zinc-800 active:scale-95 text-zinc-400 hover:text-teal-300 border border-border/60 transition-colors focus:outline-none focus-visible:ring-1 focus-visible:ring-teal-400 touch-manipulation shrink-0"
                  >
                    <PanelRightClose className="w-4 h-4" />
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
              </>
            )}
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
