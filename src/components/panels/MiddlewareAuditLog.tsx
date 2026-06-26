"use client";

import { useCallback } from "react";
import { useSimulationStore } from "@/lib/store/useSimulationStore";
import type { AuditEntry } from "@/lib/simulation/middleware/types";
import { Activity } from "lucide-react";

interface MiddlewareAuditLogProps {
  gatewayId: string;
}

const VERDICT_STYLES: Record<AuditEntry["verdict"], string> = {
  pass:      "text-green-600 dark:text-green-400",
  drop:      "text-red-600   dark:text-red-400",
  queue:     "text-amber-600 dark:text-amber-400",
  transform: "text-blue-600  dark:text-blue-400",
};

const VERDICT_ICON: Record<AuditEntry["verdict"], string> = {
  pass: "✓", drop: "✕", queue: "⏸", transform: "⟳",
};

export function MiddlewareAuditLog({ gatewayId }: MiddlewareAuditLogProps) {
  const gwState = useSimulationStore((s) => s.gatewayStates[gatewayId]);
  const entries = gwState?.recentAudit ?? [];

  if (!gwState) {
    return (
      <div className="px-4 py-3 border-t border-border">
        <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium mb-2">
          Audit log
        </p>
        <p className="text-xs text-muted-foreground italic">
          Start the simulation to see middleware activity.
        </p>
      </div>
    );
  }

  return (
    <div className="px-5 py-4 border-t border-white/10 flex flex-col gap-3">
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-2">
          <Activity className="w-3.5 h-3.5 text-muted-foreground" />
          <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">
            Audit log
          </p>
        </div>
        <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
          <CircuitBreakerBadge state={gwState.cbState} />
        </div>
      </div>

      {entries.length === 0 ? (
        <p className="text-xs text-muted-foreground italic">No packets evaluated yet.</p>
      ) : (
        <div className="flex flex-col gap-1.5 max-h-48 overflow-y-auto pr-1">
          {entries.map((entry, i) => (
            <AuditRow key={`${entry.packetId}-${i}`} entry={entry} />
          ))}
        </div>
      )}
    </div>
  );
}

function AuditRow({ entry }: { entry: AuditEntry }) {
  const verdictStyle = VERDICT_STYLES[entry.verdict];
  const icon         = VERDICT_ICON[entry.verdict];
  const age          = Math.round((performance.now() - entry.ts) / 1000);

  return (
    <div className="flex items-start gap-2 p-2 bg-black/20 border border-white/5 rounded-md group hover:bg-black/40 transition-colors">
      <span className={`text-[11px] font-mono font-bold shrink-0 mt-0.5 ${verdictStyle}`}>
        {icon}
      </span>
      <div className="flex-1 min-w-0 flex flex-col">
        <div className="flex items-center gap-1">
          <span className="text-[10px] font-mono text-zinc-200">{entry.protocol}</span>
          <span className="text-[10px] text-zinc-500">·</span>
          <span className="text-[10px] text-zinc-400">{entry.stepType}</span>
        </div>
        {entry.reason && (
          <p className="text-[9px] text-zinc-500 truncate mt-0.5">{entry.reason}</p>
        )}
      </div>
      <span className="text-[9px] text-zinc-500 shrink-0 mt-0.5">{age}s</span>
    </div>
  );
}

function CircuitBreakerBadge({ state }: { state: string }) {
  const styles: Record<string, string> = {
    CLOSED:    "text-green-400 bg-green-400/10 border-green-400/20 shadow-[0_0_10px_rgba(74,222,128,0.1)]",
    OPEN:      "text-red-400 bg-red-400/10 border-red-400/20 shadow-[0_0_10px_rgba(248,113,113,0.2)] animate-pulse",
    HALF_OPEN: "text-amber-400 bg-amber-400/10 border-amber-400/20 shadow-[0_0_10px_rgba(251,191,36,0.1)]",
  };
  return (
    <span className={`font-semibold px-2 py-0.5 rounded-full border text-[9px] ${styles[state] ?? ""}`}>
      CB: {state}
    </span>
  );
}
