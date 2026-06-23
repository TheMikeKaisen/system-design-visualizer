"use client";
import { memo } from "react";
import { Handle, Position, type NodeProps } from "@xyflow/react";
import type { SystemNode } from "@/types";
import { cn } from "@/lib/utils";
import { NodeMetricsAlerts } from "./SharedPrimitives";
import { LoadGlow } from "./SharedPrimitives";

export const CdnNode = memo(function CdnNode({
  id,
  data,
  selected,
}: NodeProps<SystemNode>) {
  return (
    <div className={cn(
      "relative flex flex-col gap-1 rounded-xl border bg-background px-4 py-3 min-w-[160px]",
      selected ? "border-teal-400 ring-1 ring-teal-400/20 shadow-lg shadow-teal-200/50" : "border-border hover:border-teal-300"
    )}>
      <NodeMetricsAlerts nodeId={id} />
      <LoadGlow load={data.load} colorHex="#2dd4bf" />
      <div className="flex items-center gap-2">
        <CdnIcon className="size-4 text-teal-500 shrink-0" />
        <span className="text-sm font-medium truncate">{data.label}</span>
      </div>
      <span className="text-[10px] text-muted-foreground">
        {data.metadata.provider as string}
      </span>
      <Handle type="target" position={Position.Left}  className="!bg-teal-400" />
      <Handle type="source" position={Position.Right} className="!bg-teal-400" />
    </div>
  );
});

function CdnIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 16 16" className={className} fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round">
      <circle cx="8" cy="8" r="6"/>
      <path d="M8 2c-2 1.5-3 3.5-3 6s1 4.5 3 6"/>
      <path d="M8 2c2 1.5 3 3.5 3 6s-1 4.5-3 6"/>
      <path d="M2 8h12"/>
    </svg>
  );
}
