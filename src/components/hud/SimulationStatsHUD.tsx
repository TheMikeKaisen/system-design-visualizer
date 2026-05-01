"use client";

import { useSimulationStore } from "@/lib/store/useSimulationStore";

export function SimulationStatsHUD() {
  const { isRunning, stats, packets } = useSimulationStore();

  const activeCount = Object.values(packets).filter(
    (p) => p.status === "traveling"
  ).length;

  const dropRate =
    stats.totalSent > 0
      ? ((stats.totalDropped / stats.totalSent) * 100).toFixed(1)
      : "0.0";

  return (
    <div
      className="absolute bottom-4 left-1/2 -translate-x-1/2 z-30
                 flex items-center gap-4 px-4 py-2
                 bg-background/80 backdrop-blur-sm border border-border
                 rounded-full text-xs pointer-events-none"
      aria-live="polite"
      aria-label="Simulation statistics"
    >
      {/* Running indicator */}
      <div className="flex items-center gap-1.5">
        <span
          className={`w-1.5 h-1.5 rounded-full ${
            isRunning ? "bg-green-500 animate-pulse" : "bg-muted-foreground"
          }`}
        />
        <span className="text-muted-foreground">
          {isRunning ? "running" : "stopped"}
        </span>
      </div>

      <Divider />

      {/* Active packets */}
      <Stat label="active" value={activeCount.toString()} />

      <Divider />

      {/* Total sent */}
      <Stat label="sent" value={stats.totalSent.toLocaleString()} />

      <Divider />

      {/* Average latency */}
      <Stat
        label="avg latency"
        value={`${stats.avgLatencyMs.toFixed(0)}ms`}
        highlight={stats.avgLatencyMs > 500}
      />

      <Divider />

      {/* Drop rate */}
      <Stat
        label="drop rate"
        value={`${dropRate}%`}
        highlight={parseFloat(dropRate) > 5}
      />
    </div>
  );
}

function Stat({
  label,
  value,
  highlight = false,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div className="flex items-baseline gap-1">
      <span className={`font-medium tabular-nums ${highlight ? "text-destructive" : "text-foreground"}`}>
        {value}
      </span>
      <span className="text-muted-foreground">{label}</span>
    </div>
  );
}

function Divider() {
  return <span className="text-border">·</span>;
}