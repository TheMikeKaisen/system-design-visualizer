"use client";
import { memo } from "react";
import { Handle, Position, type NodeProps } from "@xyflow/react";
import type { SystemNode } from "@/types";
import { cn } from "@/lib/utils";
import { NodeMetricsAlerts, NodeQueueMetrics, NodeQueuePipe } from "./SharedPrimitives";
import { LBIcon, LoadGlow } from "./SharedPrimitives";

const STRATEGY_LABELS: Record<string, string> = {
  "round-robin":       "Round robin",
  leastConnections:    "Least conn.",
  weighted:            "Weighted",
};

export const LoadBalancerNode = memo(function LoadBalancerNode({
  id,
  data,
  selected,
}: NodeProps<SystemNode>) {
  return (
    <div className={cn(
      "relative flex flex-col justify-center gap-1 rounded-xl border bg-background px-4 h-[60px] min-w-[170px]",
      selected ? "border-purple-500 ring-1 ring-purple-500/20" : "border-border hover:border-purple-300"
    )}>
      <NodeMetricsAlerts nodeId={id} />
      <NodeQueuePipe nodeId={id} />
      <LoadGlow load={data.load} colorHex="#a855f7" />
      <div className="flex items-center gap-2">
        <LBIcon className="size-4 text-purple-500 shrink-0" />
        <span className="text-sm font-medium truncate">{data.label}</span>
      </div>
      <div className="flex items-center justify-between">
        <span className="text-[10px] text-muted-foreground">
          {STRATEGY_LABELS[data.metadata.algorithm as string] ?? "Round robin"}
        </span>
        {/* Metadata */}
        <span className={cn(
          "text-xs text-muted-foreground transition-opacity duration-300 flex items-center",
          data.activeConnections > 0 ? "opacity-100" : "opacity-0"
        )}>
          {data.activeConnections || 0} conn
          <NodeQueueMetrics nodeId={id} />
        </span>
      </div>
      <Handle type="target" position={Position.Left}  className="!bg-purple-400" />
      <Handle type="source" position={Position.Right} className="!bg-purple-400" />
      <Handle type="source" position={Position.Bottom} id="bottom" className="!bg-purple-400" />
    </div>
  );
});