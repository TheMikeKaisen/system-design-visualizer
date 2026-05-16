"use client";

import { useCallback, useState } from "react";
import { useCanvasStore } from "@/lib/store/useCanvasStore";
import type { SystemNode } from "@/types";

export function NodeInspector({ node }: { node: SystemNode }) {
  const { updateNodeData } = useCanvasStore();
  const [labelDraft, setLabelDraft] = useState(node.data.label);

  const commitLabel = useCallback(() => {
    if (labelDraft !== node.data.label) {
      updateNodeData(node.id, { label: labelDraft });
    }
  }, [labelDraft, node.data.label, node.id, updateNodeData]);

  const loadPct = Math.round(node.data.load * 100);
  const loadColor =
    loadPct < 50 ? "text-green-600" : loadPct < 80 ? "text-amber-600" : "text-red-600";

  return (
    <div className="flex flex-col gap-4 p-4">
      {/* Header */}
      <div>
        <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider mb-1">
          {node.data.kind}
        </p>
        <input
          value={labelDraft}
          onChange={(e) => setLabelDraft(e.target.value)}
          onBlur={commitLabel}
          onKeyDown={(e) => e.key === "Enter" && commitLabel()}
          className="w-full text-sm font-medium bg-transparent border-0 border-b border-border
                     pb-1 text-foreground focus:outline-none focus:border-primary transition-colors"
          placeholder="Node label"
        />
      </div>

      {/* Live stats */}
      <div className="grid grid-cols-2 gap-2">
        <StatCard label="Load" value={`${loadPct}%`} valueClass={loadColor} />
        <StatCard label="Connections" value={String(node.data.activeConnections)} />
      </div>

      {/* Metadata */}
      <div>
        <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider mb-2">
          Configuration
        </p>
        <div className="flex flex-col gap-1.5">
          {Object.entries(node.data.metadata).map(([k, v]) => (
            <div key={k} className="flex justify-between items-center">
              <span className="text-[10px] text-muted-foreground capitalize">{k}</span>
              <span className="text-[10px] font-mono text-foreground">{String(v)}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Node ID (debug info) */}
      <div className="pt-2 border-t border-border">
        <p className="text-[9px] font-mono text-muted-foreground/50 truncate">
          id: {node.id}
        </p>
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  valueClass = "text-foreground",
}: {
  label: string;
  value: string;
  valueClass?: string;
}) {
  return (
    <div className="rounded-lg border border-border bg-muted/30 px-3 py-2">
      <p className={`text-base font-medium tabular-nums ${valueClass}`}>{value}</p>
      <p className="text-[10px] text-muted-foreground">{label}</p>
    </div>
  );
}