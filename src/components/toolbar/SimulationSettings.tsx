"use client";

import { useSimulation } from "@/hooks/useSimulation";
import { useSimulationStore } from "@/lib/store/useSimulationStore";
import type { RoutingStrategyKind } from "@/types";
import type { TrafficProfile } from "@/lib/store/useSimulationStore";
import { Activity, RefreshCw, Clock, GitMerge, BarChart2, ChevronDown } from "lucide-react";

const STRATEGIES: { value: RoutingStrategyKind; label: string }[] = [
  { value: "roundRobin",       label: "Round robin" },
  { value: "leastConnections", label: "Least connections" },
  { value: "weighted",         label: "Weighted" },
];

const PROFILES: { value: TrafficProfile; label: string }[] = [
  { value: "constant", label: "Constant" },
  { value: "spiky",    label: "Spiky" },
  { value: "ddos",     label: "DDoS" },
];

export function SimulationSettings() {
  const { config, setConfig, setRoutingStrategy } = useSimulation();

  return (
    <div className="flex flex-col gap-6 p-5 text-foreground text-sm">
      
      {/* Load */}
      <div className="flex flex-col gap-2.5">
        <div className="flex items-center gap-1.5 text-muted-foreground">
          <Activity className="w-4 h-4 text-blue-500" />
          <label className="text-xs font-bold uppercase tracking-wider">Load (req/s)</label>
        </div>
        <div className="flex bg-muted/30 p-1 rounded-lg border border-border/50">
          {[1, 50, 100, 500, 1000].map((val) => (
            <button
              key={val}
              onClick={() => setConfig({ packetsPerSecond: val })}
              className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-all duration-200 ${
                config.packetsPerSecond === val
                  ? "bg-background text-foreground shadow-sm border border-border/60 scale-[1.02]"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/50 border border-transparent"
              }`}
            >
              {val === 1000 ? "1k" : val}
            </button>
          ))}
        </div>
      </div>

      {/* Retries */}
      <div className="flex flex-col gap-2.5">
        <div className="flex items-center gap-1.5 text-muted-foreground">
          <RefreshCw className="w-4 h-4 text-emerald-500" />
          <label className="text-xs font-bold uppercase tracking-wider">Max Retries</label>
        </div>
        <div className="flex bg-muted/30 p-1 rounded-lg border border-border/50">
          {[0, 1, 2, 3].map((val) => (
            <button
              key={val}
              onClick={() => setConfig({ maxRetries: val })}
              className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-all duration-200 ${
                config.maxRetries === val
                  ? "bg-background text-foreground shadow-sm border border-border/60 scale-[1.02]"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/50 border border-transparent"
              }`}
            >
              {val}
            </button>
          ))}
        </div>
      </div>

      {/* Timeout */}
      <div className="flex flex-col gap-2.5">
        <div className="flex items-center gap-1.5 text-muted-foreground">
          <Clock className="w-4 h-4 text-amber-500" />
          <label className="text-xs font-bold uppercase tracking-wider">Request Timeout</label>
        </div>
        <div className="flex bg-muted/30 p-1 rounded-lg border border-border/50">
          {[
            { v: 500, l: "0.5s" },
            { v: 1000, l: "1s" },
            { v: 3000, l: "3s" },
            { v: 5000, l: "5s" },
            { v: 10000, l: "10s" },
          ].map(({ v, l }) => (
            <button
              key={v}
              onClick={() => setConfig({ requestTimeoutMs: v })}
              className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-all duration-200 ${
                config.requestTimeoutMs === v
                  ? "bg-background text-foreground shadow-sm border border-border/60 scale-[1.02]"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/50 border border-transparent"
              }`}
            >
              {l}
            </button>
          ))}
        </div>
      </div>

      {/* Routing Strategy */}
      <div className="flex flex-col gap-2.5">
        <div className="flex items-center gap-1.5 text-muted-foreground">
          <GitMerge className="w-4 h-4 text-purple-500" />
          <label className="text-xs font-bold uppercase tracking-wider">Routing Strategy</label>
        </div>
        <div className="relative">
          <select
            value={config.routingStrategy}
            onChange={(e) => setRoutingStrategy(e.target.value as RoutingStrategyKind)}
            className="w-full appearance-none bg-background border border-border rounded-lg pl-3 pr-10 py-2.5 text-sm font-medium text-foreground cursor-pointer focus:outline-none focus:ring-2 focus:ring-purple-500/30 transition-shadow hover:border-border/80 shadow-sm"
          >
            {STRATEGIES.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
        </div>
      </div>

      {/* Traffic Profile */}
      <div className="flex flex-col gap-2.5">
        <div className="flex items-center gap-1.5 text-muted-foreground">
          <BarChart2 className="w-4 h-4 text-rose-500" />
          <label className="text-xs font-bold uppercase tracking-wider">Traffic Profile</label>
        </div>
        <div className="relative">
          <select
            value={config.trafficProfile}
            onChange={(e) => setConfig({ trafficProfile: e.target.value as TrafficProfile })}
            className="w-full appearance-none bg-background border border-border rounded-lg pl-3 pr-10 py-2.5 text-sm font-medium text-foreground cursor-pointer focus:outline-none focus:ring-2 focus:ring-rose-500/30 transition-shadow hover:border-border/80 shadow-sm"
          >
            {PROFILES.map((p) => (
              <option key={p.value} value={p.value}>
                {p.label}
              </option>
            ))}
          </select>
          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
        </div>
      </div>

    </div>
  );
}
