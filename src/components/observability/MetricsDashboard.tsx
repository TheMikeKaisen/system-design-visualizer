"use client";

import { memo, useState } from "react";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
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
  const [isMinimized,  setIsMinimized]  = useState(true);
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
        className="absolute bottom-8 right-15 z-30 flex items-center gap-2
                   px-4 py-2.5 rounded-full border border-border bg-background/95
                   backdrop-blur-md text-sm font-medium text-foreground
                   hover:bg-accent transition-all shadow-lg"
      >
        <ChartIcon />
        Metrics
      </button>
    );
  }

  return (
    <div
      className="absolute bottom-8 right-15 z-30 w-[500px]
                 rounded-2xl border border-border bg-background/95
                 backdrop-blur-xl shadow-2xl overflow-hidden flex flex-col"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-border/50 bg-muted/20">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 rounded-md bg-primary/10 text-primary">
            <ChartIcon />
          </div>
          <span className="text-sm font-semibold text-foreground">
            Simulation Metrics
          </span>
          {isRecording && (
            <span className="flex items-center gap-1.5 text-[10px] font-medium tracking-wide text-red-500 bg-red-500/10 px-2 py-0.5 rounded-full">
              <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
              REC
            </span>
          )}
        </div>

        <div className="flex items-center gap-1.5">
          {selectedRecording ? (
            <button
              onClick={() => setSelectedRecording(null)}
              className="text-xs px-2.5 py-1.5 rounded-md border border-border
                         text-muted-foreground hover:text-foreground hover:bg-accent transition-colors font-medium"
            >
              Exit playback
            </button>
          ) : (
            <>
              <button
                onClick={() => isRecording ? stopRecording() : startRecording(diagramId)}
                className={`text-xs px-3 py-1.5 rounded-md border transition-all font-medium flex items-center gap-1.5
                            ${isRecording
                              ? "border-red-400/50 text-red-500 bg-red-500/5 hover:bg-red-500/10"
                              : "border-border text-foreground bg-background hover:bg-accent"
                            }`}
              >
                {isRecording ? "Stop recording" : "Record"}
              </button>
              <button
                onClick={() => { clearHistory(); setSelectedRecording(null); }}
                className="text-xs px-2.5 py-1.5 rounded-md border border-border bg-background
                           text-muted-foreground hover:text-foreground hover:bg-accent transition-colors font-medium"
              >
                Clear
              </button>
            </>
          )}
          <button
            onClick={() => setIsBrowserOpen(!isBrowserOpen)}
            className={`text-xs px-3 py-1.5 rounded-md border transition-colors font-medium
                       ${isBrowserOpen 
                         ? "border-primary text-primary bg-primary/5" 
                         : "border-border bg-background text-muted-foreground hover:text-foreground hover:bg-accent"}`}
          >
            Saved
          </button>
          <div className="w-px h-4 bg-border mx-1" />
          <button
            onClick={() => setIsMinimized(true)}
            className="text-muted-foreground hover:text-foreground transition-colors p-1.5 rounded-md hover:bg-accent"
            aria-label="Minimize"
          >
            <MinimizeIcon />
          </button>
        </div>
      </div>

      {isBrowserOpen ? (
        <RecordingsBrowser
          onSelect={(r) => { setSelectedRecording(r); setIsBrowserOpen(false); }}
          onClose={() => setIsBrowserOpen(false)}
        />
      ) : (
        <div className="flex flex-col">
          {/* Summary row */}
          <div className="grid grid-cols-3 divide-x divide-border border-b border-border/50 bg-muted/10">
            <SummaryCell
              label="Throughput"
              current={`${latest?.packetsPerSec ?? 0}`}
              unit="pkt/s"
              peak={`${peak.packetsPerSec}`}
              color="text-emerald-500"
            />
            <SummaryCell
              label="Latency"
              current={`${latest?.avgLatencyMs ?? 0}`}
              unit="ms"
              peak={`${peak.avgLatencyMs}`}
              color="text-blue-500"
              highlight={(latest?.avgLatencyMs ?? 0) > 500}
            />
            <SummaryCell
              label="Drop rate"
              current={`${latest?.dropRatePct ?? 0}`}
              unit="%"
              peak={`${peak.dropRatePct}`}
              color="text-rose-500"
              highlight={(latest?.dropRatePct ?? 0) > 5}
            />
          </div>

          {/* Tab bar */}
          <div className="flex px-2 pt-2 bg-muted/10">
            <div className="flex p-1 bg-muted/30 rounded-lg w-full gap-1">
              {TABS.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex-1 px-3 py-1.5 text-xs font-medium transition-all rounded-md
                              ${activeTab === tab.id
                                ? "bg-background text-foreground shadow-sm"
                                : "text-muted-foreground hover:text-foreground hover:bg-background/50"
                              }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Chart */}
          <div className="p-5 pt-4 bg-muted/10">
            {dataPoints.length < 2 ? (
              <div className="h-[160px] flex flex-col items-center justify-center border border-dashed border-border rounded-xl bg-background/50">
                <ChartIcon className="w-6 h-6 text-muted-foreground/50 mb-2" />
                <p className="text-sm font-medium text-muted-foreground">Waiting for data</p>
                <p className="text-xs text-muted-foreground/70 mt-1">Start the simulation to see metrics</p>
              </div>
            ) : (
              <div className="h-[180px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                    <defs>
                      <linearGradient id={`gradient-${activeTab}`} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={cfg.color} stopOpacity={0.3} />
                        <stop offset="95%" stopColor={cfg.color} stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="4 4" vertical={false} stroke="var(--color-border)" strokeOpacity={0.5} />
                    <XAxis
                      dataKey="relativeTime"
                      tick={{ fontSize: 10, fill: "var(--color-muted-foreground)" }}
                      interval="preserveStartEnd"
                      tickMargin={10}
                      axisLine={false}
                      tickLine={false}
                      minTickGap={30}
                      reversed
                    />
                    <YAxis
                      tick={{ fontSize: 10, fill: "var(--color-muted-foreground)" }}
                      axisLine={false}
                      tickLine={false}
                      tickFormatter={(val) => `${val}${cfg.unit.trim() === '%' ? '' : ''}`}
                      width={55}
                    />
                    <Tooltip
                      contentStyle={{
                        background:   "var(--color-background)",
                        border:       "1px solid var(--color-border)",
                        borderRadius: "8px",
                        fontSize:     "12px",
                        boxShadow:    "0 4px 12px rgba(0,0,0,0.1)",
                        padding:      "8px 12px"
                      }}
                      itemStyle={{ color: "var(--color-foreground)", fontWeight: 500 }}
                      formatter={(val: any) => [`${val}${cfg.unit}`, cfg.label]}
                      labelStyle={{ color: "var(--color-muted-foreground)", marginBottom: "4px" }}
                    />
                    <Area
                      type="monotone"
                      dataKey={cfg.dataKey as string}
                      stroke={cfg.color}
                      strokeWidth={2}
                      fillOpacity={1}
                      fill={`url(#gradient-${activeTab})`}
                      isAnimationActive={false}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
});

// ─────────────────────────────────────────────
// Sub-components
// ─────────────────────────────────────────────

function SummaryCell({
  label, current, peak, color, unit, highlight = false,
}: {
  label: string; current: string; peak: string;
  color: string; unit: string; highlight?: boolean;
}) {
  return (
    <div className="px-4 py-2.5">
      <p className="text-[10px] text-muted-foreground mb-0.5">{label}</p>
      <div className="flex items-baseline gap-1">
        <p className={`text-sm font-medium tabular-nums ${highlight ? "text-destructive" : color}`}>
          {current}
        </p>
        <span className="text-[10px] text-muted-foreground font-medium">{unit}</span>
      </div>
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
