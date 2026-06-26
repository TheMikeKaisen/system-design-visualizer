"use client";

import { useCallback } from "react";
import { useCanvasStore } from "@/lib/store/useCanvasStore";
import { commandInvoker } from "@/lib/store/useHistoryStore";
import { UpdateEdgeDataCommand } from "@/lib/patterns/commands/UpdateEdgeDataCommand";
import type { SystemEdge, Protocol } from "@/types";
import { Select } from "@/components/ui/Select";
import { Input } from "@/components/ui/Input";
import { RangeSlider } from "@/components/ui/RangeSlider";
import { Waypoints } from "lucide-react";

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
    <div className="flex flex-col gap-4 p-5">
      <div className="bg-black/5 dark:bg-white/5 p-4 rounded-xl border border-black/5 dark:border-white/5 shadow-sm">
        <div className="flex items-center gap-2 mb-1.5">
          <Waypoints className="w-3.5 h-3.5 text-muted-foreground" />
          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
            Edge Connection
          </p>
        </div>
        <p className="text-xs text-zinc-600 dark:text-zinc-300 font-mono truncate">
          {edge.source} → {edge.target}
        </p>
      </div>

      {/* Protocol */}
      <Field label="Protocol">
        <Select
          value={data.protocol}
          onChange={(e) => update({ protocol: e.target.value as Protocol })}
        >
          {PROTOCOLS.map((p) => (
            <option key={p} value={p} className="bg-white dark:bg-zinc-900 text-foreground">{p}</option>
          ))}
        </Select>
      </Field>

      {/* Latency */}
      <Field label={`Latency — ${data.latencyMs}ms`}>
        <RangeSlider
          min={0} max={2000} step={10}
          value={data.latencyMs}
          onChange={(e) => update({ latencyMs: parseInt(e.target.value) })}
          thumbColor="blue"
        />
      </Field>

      {/* Error rate */}
      <Field label={`Error rate — ${Math.round(data.errorRate * 100)}%`}>
        <RangeSlider
          min={0} max={1} step={0.01}
          value={data.errorRate}
          onChange={(e) => update({ errorRate: parseFloat(e.target.value) })}
          thumbColor="destructive"
        />
      </Field>

      {/* Throughput limit */}
      <Field label="Throughput limit (pkt/s)">
        <Input
          type="number"
          min={0}
          placeholder="Unlimited"
          value={data.throughputLimit ?? ""}
          onChange={(e) =>
            update({
              throughputLimit: e.target.value ? parseInt(e.target.value) : null,
            })
          }
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