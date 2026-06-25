"use client";
import { memo } from "react";
import { Handle, Position, type NodeProps } from "@xyflow/react";
import type { SystemNode } from "@/types";
import { cn } from "@/lib/utils";
import { NodeMetricsAlerts, NodeQueueMetrics, NodeQueuePipe , NodeHoverCard } from "./SharedPrimitives";
import { DbIcon, LoadGlow } from "./SharedPrimitives";
import { useSimulationStore } from "@/lib/store/useSimulationStore";

export const DatabaseNode = memo(function DatabaseNode({
  id,
  data,
  selected,
}: NodeProps<SystemNode>) {
  const isRunning = useSimulationStore((s) => s.isRunning);
  return (
    <div      className={cn(
        "group relative flex flex-col justify-center gap-1 rounded-xl border bg-background px-4 h-[60px] min-w-[160px]",
      selected ? "border-teal-500 ring-1 ring-teal-500/20" : "border-border hover:border-teal-300"
    )}>
      <NodeMetricsAlerts nodeId={id} />
      <NodeHoverCard data={data} isRunning={isRunning} selected={selected} />
      <NodeQueuePipe nodeId={id} />
      <LoadGlow load={data.load} colorHex="#14b8a6" />
      <div className="flex items-center gap-2">
        <DbIcon className="size-4 text-teal-600 shrink-0" />
        <span className="text-sm font-medium truncate">{data.label}</span>
      </div>
      {/* Metadata */}
      <span className="text-xs text-muted-foreground">
        {data.metadata.engine as string}
        <span className={cn(
          "transition-opacity duration-300",
          data.activeConnections > 0 ? "opacity-100" : "opacity-0"
        )}>
          {` · ${data.activeConnections || 0} conn`}
        </span>
        <NodeQueueMetrics nodeId={id} />
      </span>
      <Handle type="target" position={Position.Left}  className="!bg-teal-400" />
      <Handle type="source" position={Position.Right} className="!bg-teal-400" />
    </div>
  );
});