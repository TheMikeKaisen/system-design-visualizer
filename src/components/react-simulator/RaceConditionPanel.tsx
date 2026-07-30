"use client";
import React from "react";
import { RaceConditionRequest, ReactStepState } from "@/lib/react-simulator/engine";

interface RaceConditionPanelProps {
  step: ReactStepState;
}

const statusConfig = {
  "in-flight": { label: "In-flight", color: "text-blue-400", bg: "bg-blue-500/10 border-blue-500/30", dot: "bg-blue-400 animate-pulse", icon: "🛫" },
  "resolved": { label: "Resolved", color: "text-emerald-400", bg: "bg-emerald-500/10 border-emerald-500/30", dot: "bg-emerald-400", icon: "✅" },
  "blocked": { label: "Blocked", color: "text-red-400", bg: "bg-red-500/10 border-red-500/30", dot: "bg-red-400", icon: "❌" },
  "applied": { label: "Applied to State", color: "text-emerald-300", bg: "bg-emerald-500/15 border-emerald-400/40", dot: "bg-emerald-300", icon: "🎯" },
};

function RequestPacket({ req, isCancelled }: { req: RaceConditionRequest; isCancelled: boolean }) {
  const config = statusConfig[req.status];

  return (
    <div className={`relative rounded-xl border px-4 py-3 transition-all duration-500 ${config.bg} ${
      isCancelled ? "opacity-60" : ""
    }`}>
      {/* Stale badge */}
      {req.isSlow && (
        <span className="absolute -top-2 left-3 text-xs font-bold bg-zinc-900 px-2 py-0.5 rounded-full border border-amber-500/30 text-amber-400">
          SLOW / STALE
        </span>
      )}

      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full shrink-0 ${config.dot}`} />
          <span className={`text-sm font-semibold ${config.color}`}>{req.label}</span>
        </div>
        <div className={`flex items-center gap-1.5 text-xs font-bold px-2 py-1 rounded-full ${config.bg} border ${config.color}`}>
          <span>{config.icon}</span>
          <span>{config.label}</span>
        </div>
      </div>

      {/* Progress bar for in-flight */}
      {req.status === "in-flight" && (
        <div className="mt-2 h-1 bg-zinc-800 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full ${req.isSlow ? "bg-amber-400/60 w-3/5" : "bg-blue-400 w-4/5"} transition-all duration-1000`}
          />
        </div>
      )}

      {/* Blocked explanation */}
      {req.status === "blocked" && (
        <p className="text-xs text-red-300/60 mt-1.5">
          Cleanup set <code className="bg-zinc-800 px-1 rounded text-red-300">cancelled = true</code>. Response discarded.
        </p>
      )}

      {/* Applied explanation */}
      {req.status === "applied" && (
        <p className="text-xs text-emerald-300/60 mt-1.5">
          ✓ <code className="bg-zinc-800 px-1 rounded text-emerald-300">setUser(data)</code> called — UI updated
        </p>
      )}
    </div>
  );
}

export function RaceConditionPanel({ step }: RaceConditionPanelProps) {
  const requests = step.raceConditionRequests ?? [];
  const cancelledId = step.cancelledRequestId ?? null;

  return (
    <div className="flex flex-col h-full bg-zinc-900/50 rounded-xl border border-zinc-800 overflow-hidden">
      {/* Header */}
      <div className="h-10 shrink-0 border-b border-zinc-800 bg-zinc-900/60 flex items-center px-4 gap-2">
        <span className="text-sm">🏁</span>
        <span className="text-xs font-bold tracking-wider uppercase text-zinc-400">Network Requests</span>
      </div>

      <div className="flex-1 flex flex-col px-4 py-4 gap-3 overflow-auto">

        {requests.length === 0 ? (
          <div className="flex-1 flex items-center justify-center">
            <p className="text-xs text-zinc-600 text-center">
              No requests in flight yet.<br />Step through to see race conditions.
            </p>
          </div>
        ) : (
          <>
            {/* State slot */}
            <div className="rounded-xl border border-zinc-700/50 bg-zinc-800/40 px-4 py-3">
              <div className="text-xs font-bold uppercase tracking-wider text-zinc-500 mb-1">React State Slot</div>
              <div className="flex items-center gap-2">
                <code className="text-sm font-mono text-zinc-300">user</code>
                <span className="text-zinc-600">=</span>
                <code className={`text-sm font-mono font-bold ${
                  requests.some(r => r.status === "applied") ? "text-emerald-400" : "text-zinc-500"
                }`}>
                  {requests.find(r => r.status === "applied")
                    ? `data from: ${requests.find(r => r.status === "applied")!.label}`
                    : "null (loading...)"}
                </code>
              </div>
            </div>

            {/* Requests */}
            <div className="flex flex-col gap-2.5 mt-1">
              {requests.map((req) => (
                <RequestPacket
                  key={`request-${req.id}`}
                  req={req}
                  isCancelled={req.id === cancelledId}
                />
              ))}
            </div>

            {/* Legend */}
            <div className="mt-auto pt-2 border-t border-zinc-800 flex flex-wrap gap-3">
              {Object.entries(statusConfig).map(([key, conf]) => (
                <div key={key} className="flex items-center gap-1">
                  <div className={`w-1.5 h-1.5 rounded-full ${conf.dot.split(" ")[0]}`} />
                  <span className="text-xs text-zinc-500">{conf.label}</span>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
