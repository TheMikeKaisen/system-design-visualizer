"use client";

import { useState, useRef, useEffect } from "react";
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
  
  const [error, setError] = useState<string | null>(null);
  const errorTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleStart = () => {
    const res = startAll();
    if (res && !res.success) {
      setError(res.error || "Failed to start simulation.");
      if (errorTimeoutRef.current) clearTimeout(errorTimeoutRef.current);
      errorTimeoutRef.current = setTimeout(() => setError(null), 3000);
    } else {
      setError(null);
    }
  };

  useEffect(() => {
    return () => {
      if (errorTimeoutRef.current) clearTimeout(errorTimeoutRef.current);
    };
  }, []);

  return (
    <div className="flex items-center gap-2 relative">
      {/* Error Message Tooltip */}
      {error && (
        <div className="absolute top-full mt-2 left-0 z-50 px-2.5 py-1.5 rounded-md text-xs font-medium bg-destructive text-destructive-foreground shadow-sm animate-in fade-in slide-in-from-top-1">
          {error}
        </div>
      )}

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
          onClick={handleStart}
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
        <span className="text-[10px] text-muted-foreground whitespace-nowrap">
          {config.packetsPerSecond} req/s
        </span>
        <input
          type="range"
          min={0.5}
          max={50}
          step={0.5}
          value={config.packetsPerSecond}
          onChange={(e) => setConfig({ packetsPerSecond: parseFloat(e.target.value) })}
          className="w-16 h-1.5 accent-primary cursor-pointer"
          title="Requests per second"
        />
      </div>

      <div className="w-px h-4 bg-border" />

      {/* Max Retries */}
      <div className="flex items-center gap-1.5">
        <label className="text-[10px] text-muted-foreground whitespace-nowrap">Retries</label>
        <select
          value={config.maxRetries}
          onChange={(e) => setConfig({ maxRetries: parseInt(e.target.value, 10) })}
          className="text-xs bg-transparent border border-border rounded px-1.5 py-1 text-foreground cursor-pointer focus:outline-none focus:ring-1 focus:ring-primary"
        >
          <option value={0}>0</option>
          <option value={1}>1</option>
          <option value={2}>2</option>
          <option value={3}>3</option>
        </select>
      </div>

      <div className="w-px h-4 bg-border" />

      {/* Request Timeout */}
      <div className="flex items-center gap-1.5">
        <label className="text-[10px] text-muted-foreground whitespace-nowrap">Timeout</label>
        <select
          value={config.requestTimeoutMs}
          onChange={(e) => setConfig({ requestTimeoutMs: parseInt(e.target.value, 10) })}
          className="text-xs bg-transparent border border-border rounded px-1.5 py-1 text-foreground cursor-pointer focus:outline-none focus:ring-1 focus:ring-primary"
        >
          <option value={500}>0.5s</option>
          <option value={1000}>1s</option>
          <option value={3000}>3s</option>
          <option value={5000}>5s</option>
          <option value={10000}>10s</option>
        </select>
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