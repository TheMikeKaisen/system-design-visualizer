"use client";

import { useCallback } from "react";
import { useCanvasStore } from "@/lib/store/useCanvasStore";
import { commandInvoker } from "@/lib/store/useHistoryStore";
import { UpdateEdgeDataCommand } from "@/lib/patterns/commands/UpdateEdgeDataCommand";
import type { SystemEdge, Protocol } from "@/types";

const PROTOCOLS: Protocol[] = ["HTTP", "gRPC", "TCP", "UDP", "WebSocket"];

export function EdgeInspector({ edge }: { edge: SystemEdge }) {
  const data = edge.data;
  if (!data) return null;

  const update = useCallback(
    (partial: Partial<typeof data>) => {
      commandInvoker.execute(
        new UpdateEdgeDataCommand(edge.id, { ...data }, partial)
      );
    },
    [edge.id, data]
  );

  return (
    <div className="flex flex-col gap-4 p-4">
      <div>
        <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider mb-2">
          Edge
        </p>
        <p className="text-xs text-muted-foreground font-mono truncate">
          {edge.source} → {edge.target}
        </p>
      </div>

      {/* Protocol */}
      <Field label="Protocol">
        <select
          value={data.protocol}
          onChange={(e) => update({ protocol: e.target.value as Protocol })}
          className="w-full text-xs bg-transparent border border-border rounded px-2 py-1.5
                     text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
        >
          {PROTOCOLS.map((p) => (
            <option key={p} value={p}>{p}</option>
          ))}
        </select>
      </Field>

      {/* Latency */}
      <Field label={`Latency — ${data.latencyMs}ms`}>
        <input
          type="range"
          min={0} max={2000} step={10}
          value={data.latencyMs}
          onChange={(e) => update({ latencyMs: parseInt(e.target.value) })}
          className="w-full accent-primary"
        />
      </Field>

      {/* Error rate */}
      <Field label={`Error rate — ${Math.round(data.errorRate * 100)}%`}>
        <input
          type="range"
          min={0} max={1} step={0.01}
          value={data.errorRate}
          onChange={(e) => update({ errorRate: parseFloat(e.target.value) })}
          className="w-full accent-destructive"
        />
      </Field>

      {/* Throughput limit */}
      <Field label="Throughput limit (pkt/s)">
        <input
          type="number"
          min={0}
          placeholder="Unlimited"
          value={data.throughputLimit ?? ""}
          onChange={(e) =>
            update({
              throughputLimit: e.target.value ? parseInt(e.target.value) : null,
            })
          }
          className="w-full text-xs bg-transparent border border-border rounded px-2 py-1.5
                     text-foreground placeholder:text-muted-foreground
                     focus:outline-none focus:ring-1 focus:ring-primary"
        />
      </Field>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
        {label}
      </label>
      {children}
    </div>
  );
}