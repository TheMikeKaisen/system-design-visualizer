"use client";

import { memo, useState } from "react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend,
} from "recharts";
import { useObservabilityStore } from "@/lib/store/useObservabilityStore";
import { useDiagramStore }       from "@/lib/store/useDiagramStore";
import type { SimulationDataPoint, SimulationRecording } from "@/types";
import { RecordingsBrowser } from "./RecordingsBrowser";

// ─────────────────────────────────────────────
// Tab config
// ─────────────────────────────────────────────

type MetricTab = "throughput" | "latency" | "drops";

const TABS: { id: MetricTab; label: string }[] = [
  { id: "throughput", label: "Throughput" },
  { id: "latency",    label: "Latency"    },
  { id: "drops",      label: "Drop rate"  },
];

// ─────────────────────────────────────────────
// Chart config per metric
// ─────────────────────────────────────────────

const CHART_CONFIG: Record<MetricTab, {
  dataKey:   keyof SimulationDataPoint;
  color:     string;
  unit:      string;
  label:     string;
}> = {
  throughput: { dataKey: "packetsPerSec", color: "#1D9E75", unit: " pkt/s", label: "Packets/sec" },
  latency:    { dataKey: "avgLatencyMs",  color: "#378ADD", unit: "ms",     label: "Avg latency" },
  drops:      { dataKey: "dropRatePct",   color: "#D85A30", unit: "%",      label: "Drop rate"   },
};

// ─────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────

export const MetricsDashboard = memo(function MetricsDashboard() {
  const [activeTab,    setActiveTab]    = useState<MetricTab>("throughput");
  const [isMinimized,  setIsMinimized]  = useState(false);
  const [isBrowserOpen, setIsBrowserOpen] = useState(false);
  const [selectedRecording, setSelectedRecording] = useState<SimulationRecording | null>(null);

  const liveDataPoints = useObservabilityStore((s) => s.dataPoints);
  const isRecording    = useObservabilityStore((s) => s.isRecording);
  const { startRecording, stopRecording, clearHistory } = useObservabilityStore();
  const diagramId      = useDiagramStore((s) => s.meta.id);

  const cfg = CHART_CONFIG[activeTab];

  // Use recording data if selected, otherwise live
  const dataPoints = selectedRecording ? selectedRecording.dataPoints : liveDataPoints;

  // Format timestamps as relative "Ns ago"
  const chartData = dataPoints.map((p, i) => ({
    ...p,
    relativeTime: `${dataPoints.length - i - 1}s`,
  }));

  // Summary stats
  const latest = dataPoints.at(-1);
  const peak = selectedRecording
    ? {
        packetsPerSec: selectedRecording.peaks.maxPacketsPerSec,
        avgLatencyMs: selectedRecording.peaks.maxLatencyMs,
        dropRatePct: selectedRecording.peaks.maxDropRatePct,
      }
    : dataPoints.reduce(
        (acc, p) => ({
          packetsPerSec: Math.max(acc.packetsPerSec, p.packetsPerSec),
          avgLatencyMs: Math.max(acc.avgLatencyMs, p.avgLatencyMs),
          dropRatePct: Math.max(acc.dropRatePct, p.dropRatePct),
        }),
        { packetsPerSec: 0, avgLatencyMs: 0, dropRatePct: 0 }
      );

  if (isMinimized) {
    return (
      <button
        onClick={() => setIsMinimized(false)}
        className="absolute bottom-16 right-4 z-30 flex items-center gap-2
                   px-3 py-2 rounded-xl border border-border bg-background/90
                   backdrop-blur-sm text-xs text-muted-foreground
                   hover:text-foreground transition-colors shadow-sm"
      >
        <ChartIcon />
        Metrics
      </button>
    );
  }

  return (
    <div
      className="absolute bottom-16 right-4 z-30 w-[460px]
                 rounded-2xl border border-border bg-background/95
                 backdrop-blur-md shadow-lg overflow-hidden"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <div className="flex items-center gap-2">
          <ChartIcon />
          <span className="text-sm font-medium text-foreground">
            Simulation metrics
          </span>
          {isRecording && (
            <span className="flex items-center gap-1 text-[10px] text-red-500">
              <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
              REC
            </span>
          )}
        </div>

        <div className="flex items-center gap-1">
          {selectedRecording ? (
            <button
              onClick={() => setSelectedRecording(null)}
              className="text-[10px] px-2 py-1 rounded-md border border-border
                         text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
            >
              Back to Live
            </button>
          ) : (
            <>
              <button
                onClick={() => isRecording ? stopRecording() : startRecording(diagramId)}
                className={`text-[10px] px-2 py-1 rounded-md border transition-colors
                            ${isRecording
                              ? "border-red-400/50 text-red-500 hover:bg-red-500/10"
                              : "border-border text-muted-foreground hover:text-foreground hover:bg-accent"
                            }`}
              >
                {isRecording ? "Stop rec" : "Record"}
              </button>
              <button
                onClick={() => { clearHistory(); setSelectedRecording(null); }}
                className="text-[10px] px-2 py-1 rounded-md border border-border
                           text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
              >
                Clear
              </button>
            </>
          )}
          <button
            onClick={() => setIsBrowserOpen(true)}
            className="text-[10px] px-2 py-1 rounded-md border border-border
                       text-muted-foreground hover:text-foreground hover:bg-accent transition-colors ml-1"
          >
            Saved
          </button>
          <button
            onClick={() => setIsMinimized(true)}
            className="ml-1 text-muted-foreground hover:text-foreground transition-colors p-1"
            aria-label="Minimize"
          >
            <MinimizeIcon />
          </button>
        </div>
      </div>

      {isBrowserOpen && (
        <RecordingsBrowser
          onSelect={(r) => { setSelectedRecording(r); setIsBrowserOpen(false); }}
          onClose={() => setIsBrowserOpen(false)}
        />
      )}

      {/* Summary row */}
      <div className="grid grid-cols-3 divide-x divide-border border-b border-border">
        <SummaryCell
          label="Throughput"
          current={`${latest?.packetsPerSec ?? 0} pkt/s`}
          peak={`${peak.packetsPerSec} pkt/s`}
          color="text-teal-600 dark:text-teal-400"
        />
        <SummaryCell
          label="Avg latency"
          current={`${latest?.avgLatencyMs ?? 0}ms`}
          peak={`${peak.avgLatencyMs}ms`}
          color="text-blue-600 dark:text-blue-400"
          highlight={(latest?.avgLatencyMs ?? 0) > 500}
        />
        <SummaryCell
          label="Drop rate"
          current={`${latest?.dropRatePct ?? 0}%`}
          peak={`${peak.dropRatePct}%`}
          color="text-orange-600 dark:text-orange-400"
          highlight={(latest?.dropRatePct ?? 0) > 5}
        />
      </div>

      {/* Tab bar */}
      <div className="flex border-b border-border px-4">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-3 py-2 text-xs transition-colors border-b-2 -mb-px
                        ${activeTab === tab.id
                          ? "border-primary text-foreground font-medium"
                          : "border-transparent text-muted-foreground hover:text-foreground"
                        }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Chart */}
      <div className="p-4">
        {dataPoints.length < 2 ? (
          <div className="h-32 flex items-center justify-center">
            <p className="text-xs text-muted-foreground">
              Start the simulation to see metrics
            </p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={130}>
            <LineChart data={chartData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
              <XAxis
                dataKey="relativeTime"
                tick={{ fontSize: 9, fill: "var(--color-muted-foreground)" }}
                interval={Math.floor(chartData.length / 5)}
                reversed
              />
              <YAxis
                tick={{ fontSize: 9, fill: "var(--color-muted-foreground)" }}
                unit={cfg.unit}
                width={50}
              />
              <Tooltip
                contentStyle={{
                  background:   "var(--color-background)",
                  border:       "1px solid var(--color-border)",
                  borderRadius: "8px",
                  fontSize:     "11px",
                }}
                formatter={(val: any) => [`${val}${cfg.unit}`, cfg.label]}
              />
              <Line
                type="monotone"
                dataKey={cfg.dataKey as string}
                stroke={cfg.color}
                strokeWidth={1.5}
                dot={false}
                isAnimationActive={false}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
});

// ─────────────────────────────────────────────
// Sub-components
// ─────────────────────────────────────────────

function SummaryCell({
  label, current, peak, color, highlight = false,
}: {
  label: string; current: string; peak: string;
  color: string; highlight?: boolean;
}) {
  return (
    <div className="px-4 py-2.5">
      <p className="text-[10px] text-muted-foreground mb-0.5">{label}</p>
      <p className={`text-sm font-medium tabular-nums ${highlight ? "text-destructive" : color}`}>
        {current}
      </p>
      <p className="text-[9px] text-muted-foreground/60">peak {peak}</p>
    </div>
  );
}

// ─── Icons ────────────────────────────────────────────────────────────

function ChartIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none"
         stroke="currentColor" strokeWidth={1.5} strokeLinecap="round">
      <polyline points="1,10 4,6 7,8 10,3 13,5" />
    </svg>
  );
}

function MinimizeIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none"
         stroke="currentColor" strokeWidth={1.5} strokeLinecap="round">
      <path d="M3 7h8" />
    </svg>
  );
}
