"use client";

import { useSimulation } from "@/hooks/useSimulation";
import { useSimulationStore } from "@/lib/store/useSimulationStore";
import type { RoutingStrategyKind } from "@/types";

const STRATEGIES: { value: RoutingStrategyKind; label: string }[] = [
  { value: "roundRobin",       label: "Round robin" },
  { value: "leastConnections", label: "Least connections" },
  { value: "weighted",         label: "Weighted" },
];

export function SimulationControls() {
  const { isRunning, config, startAll, stop, reset, setConfig, setRoutingStrategy } =
    useSimulation();

  return (
    <div className="flex items-center gap-2">
      {/* Start / Stop */}
      {isRunning ? (
        <button
          onClick={stop}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium
                     bg-destructive/10 text-destructive hover:bg-destructive/20 transition-colors"
        >
          <StopIcon />
          Stop
        </button>
      ) : (
        <button
          onClick={startAll}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium
                     bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          <PlayIcon />
          Start
        </button>
      )}

      {/* Reset */}
      <button
        onClick={reset}
        disabled={isRunning}
        title="Reset simulation"
        className="px-2.5 py-1.5 rounded-md text-xs text-muted-foreground
                   hover:text-foreground hover:bg-accent
                   disabled:opacity-35 disabled:cursor-not-allowed transition-colors"
      >
        <ResetIcon />
      </button>

      <div className="w-px h-4 bg-border" />

      {/* Packets per second */}
      <div className="flex items-center gap-1.5">
        <span className="text-xs text-muted-foreground whitespace-nowrap">
          {config.packetsPerSecond} pkt/s
        </span>
        <input
          type="range"
          min={0.5}
          max={20}
          step={0.5}
          value={config.packetsPerSecond}
          onChange={(e) => setConfig({ packetsPerSecond: parseFloat(e.target.value) })}
          className="w-20 h-1.5 accent-primary cursor-pointer"
          title="Packets per second"
        />
      </div>

      <div className="w-px h-4 bg-border" />

      {/* Routing strategy */}
      <select
        value={config.routingStrategy}
        onChange={(e) => setRoutingStrategy(e.target.value as RoutingStrategyKind)}
        className="text-xs bg-transparent border border-border rounded px-2 py-1
                   text-foreground cursor-pointer focus:outline-none focus:ring-1 focus:ring-primary"
      >
        {STRATEGIES.map((s) => (
          <option key={s.value} value={s.value}>
            {s.label}
          </option>
        ))}
      </select>
    </div>
  );
}

function PlayIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor">
      <polygon points="2,1 10,6 2,11" />
    </svg>
  );
}

function StopIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor">
      <rect x="1" y="1" width="10" height="10" rx="1" />
    </svg>
  );
}

function ResetIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round">
      <path d="M1 7a6 6 0 1 0 1.2-3.6" />
      <path d="M1 2v3h3" />
    </svg>
  );
}