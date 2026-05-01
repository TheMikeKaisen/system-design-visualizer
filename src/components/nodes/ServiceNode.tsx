"use client";

import { memo } from "react";
import { Handle, Position, type NodeProps } from "@xyflow/react";
import type { SystemNode } from "@/types";
import { cn } from "@/lib/utils";

export const ServiceNode = memo(function ServiceNode({
  data,
  selected,
}: NodeProps<SystemNode>) {
  const loadColor = getLoadColor(data.load);

  return (
    <div
      className={cn(
        "relative flex flex-col gap-1 rounded-xl border bg-background px-4 py-3",
        "min-w-[160px] shadow-sm transition-shadow",
        selected
          ? "border-blue-500 shadow-blue-200/50 shadow-lg"
          : "border-border hover:border-blue-300"
      )}
    >
      {/* Load indicator bar */}
      <div className="absolute top-0 left-0 right-0 h-0.5 rounded-t-xl overflow-hidden bg-muted">
        <div
          className="h-full transition-all duration-500"
          style={{ width: `${data.load * 100}%`, backgroundColor: loadColor }}
        />
      </div>

      {/* Icon + label */}
      <div className="flex items-center gap-2">
        <ServiceIcon className="size-4 text-blue-500 shrink-0" />
        <span className="text-sm font-medium truncate">{data.label}</span>
      </div>

      {/* Metadata */}
      <span className="text-xs text-muted-foreground">
        {data.activeConnections} conn
      </span>

      {/* React Flow Handles */}
      <Handle type="target" position={Position.Left} className="!bg-blue-400" />
      <Handle type="source" position={Position.Right} className="!bg-blue-400" />
    </div>
  );
});

function getLoadColor(load: number): string {
  if (load < 0.5) return "#22c55e";
  if (load < 0.8) return "#f59e0b";
  return "#ef4444";
}

function ServiceIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 16 16" className={className} fill="none" stroke="currentColor" strokeWidth={1.5}>
      <rect x="2" y="2" width="12" height="12" rx="2" />
      <path d="M5 8h6M8 5v6" strokeLinecap="round" />
    </svg>
  );
}