"use client";

import { memo } from "react";
import { useObservabilityStore } from "@/lib/store/useObservabilityStore";
import type { SimulationRecording } from "@/types";

export const RecordingsBrowser = memo(function RecordingsBrowser({
  onSelect,
  onClose,
}: {
  onSelect: (r: SimulationRecording) => void;
  onClose:  () => void;
}) {
  const { recordings, deleteRecording } = useObservabilityStore();

  function formatDuration(r: SimulationRecording): string {
    const ms = (r.endedAt ?? Date.now()) - r.startedAt;
    const s  = Math.floor(ms / 1000);
    return s < 60 ? `${s}s` : `${Math.floor(s / 60)}m ${s % 60}s`;
  }

  return (
    <div
      className="flex flex-col bg-muted/10 h-[300px] overflow-hidden"
      role="region"
      aria-label="Simulation recordings"
    >
      <div className="flex items-center justify-between px-5 py-2.5 bg-muted/30 border-b border-border/50">
        <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Saved recordings</h2>
      </div>

      {recordings.length === 0 ? (
        <div className="flex flex-col items-center justify-center flex-1 gap-3">
          <div className="w-12 h-12 rounded-full bg-muted/50 border border-border flex items-center justify-center mb-1">
            <RecordingIcon />
          </div>
          <p className="text-sm font-medium text-foreground">No recordings yet</p>
          <p className="text-xs text-muted-foreground/80 max-w-[240px] text-center leading-relaxed">
            Click <span className="font-medium text-foreground">"Record"</span> in the metrics dashboard to start saving data for playback.
          </p>
        </div>
      ) : (
        <ul className="divide-y divide-border/50 overflow-y-auto custom-scrollbar flex-1">
          {recordings.map((r) => (
            <li key={r.id}>
              <div
                onClick={() => onSelect(r)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    onSelect(r);
                  }
                }}
                className="w-full flex items-start gap-4 px-5 py-3 text-left
                           hover:bg-accent/50 transition-all group cursor-pointer"
              >
                <div className="shrink-0 mt-1">
                  <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center group-hover:scale-105 transition-transform">
                    <ChartIconSmall />
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-0.5">
                    <p className="text-xs font-semibold text-foreground truncate">
                      Recording — {formatDuration(r)}
                    </p>
                    <span className="text-[10px] text-muted-foreground font-medium">
                      {new Date(r.startedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <p className="text-[10px] text-muted-foreground mb-2">
                    {r.dataPoints.length} data points
                  </p>
                  <div className="flex gap-4">
                    <PeakStat label="Throughput" value={`${r.peaks.maxPacketsPerSec} pkt/s`} />
                    <PeakStat label="Latency" value={`${r.peaks.maxLatencyMs}ms`} />
                    <PeakStat label="Drop rate" value={`${r.peaks.maxDropRatePct}%`} />
                  </div>
                </div>
                <button
                  onClick={(e) => { e.stopPropagation(); deleteRecording(r.id); }}
                  className="shrink-0 opacity-0 group-hover:opacity-100 p-2 mt-1
                             text-muted-foreground hover:text-destructive
                             transition-all rounded-md hover:bg-destructive/10"
                  aria-label="Delete recording"
                >
                  <TrashIcon />
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
});

function ChartIconSmall() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none"
         stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <polyline points="1,10 4,6 7,8 10,3 13,5" />
    </svg>
  );
}

function PeakStat({ label, value }: { label: string; value: string | number }) {
  return (
    <span className="text-[9px] text-muted-foreground">
      {label}:{" "}
      <span className="font-medium text-foreground">{value}</span>
    </span>
  );
}

function CloseIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none"
         stroke="currentColor" strokeWidth={1.5} strokeLinecap="round">
      <path d="M4 4l8 8M12 4l-8 8" />
    </svg>
  );
}

function RecordingIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none"
         stroke="currentColor" strokeWidth={1.5}>
      <circle cx="8" cy="8" r="6" />
      <circle cx="8" cy="8" r="2.5" fill="currentColor" className="text-red-500" stroke="none" />
    </svg>
  );
}

function TrashIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none"
         stroke="currentColor" strokeWidth={1.5} strokeLinecap="round">
      <path d="M2 4h10M5 4V2h4v2M5 7v4M9 7v4" />
      <path d="M3 4l1 8h6l1-8" />
    </svg>
  );
}
