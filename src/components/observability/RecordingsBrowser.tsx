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
      className="absolute bottom-16 left-1/2 -translate-x-1/2 z-40 w-[520px]
                 rounded-2xl border border-border bg-background shadow-lg overflow-hidden"
      role="dialog"
      aria-label="Simulation recordings"
    >
      <div className="flex items-center justify-between px-5 py-3.5 border-b border-border">
        <h2 className="text-sm font-medium text-foreground">Saved recordings</h2>
        <button
          onClick={onClose}
          className="text-muted-foreground hover:text-foreground transition-colors"
        >
          <CloseIcon />
        </button>
      </div>

      {recordings.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 gap-2">
          <p className="text-sm text-muted-foreground">No recordings yet.</p>
          <p className="text-xs text-muted-foreground/60">
            Click "Record" in the metrics dashboard while simulation is running.
          </p>
        </div>
      ) : (
        <ul className="divide-y divide-border max-h-[400px] overflow-y-auto">
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
                className="w-full flex items-start gap-4 px-5 py-4 text-left
                           hover:bg-accent transition-colors group cursor-pointer"
              >
                <div className="shrink-0 mt-0.5">
                  <RecordingIcon />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-foreground">
                    Recording — {formatDuration(r)}
                  </p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">
                    {r.dataPoints.length} data points ·{" "}
                    {new Date(r.startedAt).toLocaleTimeString()}
                  </p>
                  <div className="flex gap-3 mt-1.5">
                    <PeakStat label="Peak pkt/s" value={r.peaks.maxPacketsPerSec} />
                    <PeakStat label="Peak latency" value={`${r.peaks.maxLatencyMs}ms`} />
                    <PeakStat label="Peak drops" value={`${r.peaks.maxDropRatePct}%`} />
                  </div>
                </div>
                <button
                  onClick={(e) => { e.stopPropagation(); deleteRecording(r.id); }}
                  className="shrink-0 opacity-0 group-hover:opacity-100 p-1.5
                             text-muted-foreground hover:text-destructive
                             transition-all rounded hover:bg-destructive/10"
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
