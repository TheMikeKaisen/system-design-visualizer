"use client";

import { useCallback } from "react";
import { useSimulationStore } from "@/lib/store/useSimulationStore";
import type { AuditEntry } from "@/lib/simulation/middleware/types";

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
    <div className="px-4 py-3 border-t border-border flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">
          Audit log
        </p>
        <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
          <CircuitBreakerBadge state={gwState.cbState} />
        </div>
      </div>

      {entries.length === 0 ? (
        <p className="text-xs text-muted-foreground italic">No packets evaluated yet.</p>
      ) : (
        <div className="flex flex-col gap-0.5 max-h-48 overflow-y-auto">
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
    <div className="flex items-start gap-2 py-0.5 group">
      <span className={`text-[10px] font-mono font-bold shrink-0 mt-0.5 ${verdictStyle}`}>
        {icon}
      </span>
      <div className="flex-1 min-w-0">
        <span className="text-[10px] font-mono text-foreground">{entry.protocol}</span>
        <span className="text-[10px] text-muted-foreground"> · {entry.stepType}</span>
        {entry.reason && (
          <p className="text-[9px] text-muted-foreground truncate">{entry.reason}</p>
        )}
      </div>
      <span className="text-[9px] text-muted-foreground/50 shrink-0">{age}s</span>
    </div>
  );
}

function CircuitBreakerBadge({ state }: { state: string }) {
  const styles: Record<string, string> = {
    CLOSED:    "text-green-600 dark:text-green-400",
    OPEN:      "text-red-600   dark:text-red-400 animate-pulse",
    HALF_OPEN: "text-amber-600 dark:text-amber-400",
  };
  return (
    <span className={`font-medium ${styles[state] ?? ""}`}>
      CB: {state}
    </span>
  );
}
