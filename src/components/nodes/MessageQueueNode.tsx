"use client";
import { memo } from "react";
import { Handle, Position, type NodeProps } from "@xyflow/react";
import type { SystemNode } from "@/types";
import { cn } from "@/lib/utils";
import { NodeMetricsAlerts, NodeQueueMetrics, NodeQueuePipe , NodeHoverCard } from "./SharedPrimitives";
import { LoadGlow, MqIcon } from "./SharedPrimitives";
import { useSimulationStore } from "@/lib/store/useSimulationStore";

export const MessageQueueNode = memo(function MessageQueueNode({
  id,
  data,
  selected,
}: NodeProps<SystemNode>) {
  const isRunning = useSimulationStore((s) => s.isRunning);
  return (
    <div      className={cn(
        "group relative flex flex-col justify-center gap-1 rounded-xl border bg-background px-4 h-[60px] min-w-[165px]",
      selected ? "border-pink-400 ring-1 ring-pink-400/20" : "border-border hover:border-pink-300"
    )}>
      <NodeMetricsAlerts nodeId={id} />
      <NodeHoverCard data={data} isRunning={isRunning} selected={selected} />
      <NodeQueuePipe nodeId={id} />
      <LoadGlow load={data.load} colorHex="#f472b6" />
      <div className="flex items-center gap-2">
        <MqIcon className="size-4 text-pink-500 shrink-0" />
        <span className="text-sm font-medium truncate">{data.label}</span>
      </div>
      <span className="text-[10px] text-muted-foreground flex items-center">
        {data.metadata.engine as string}
        <NodeQueueMetrics nodeId={id} />
      </span>
      <Handle type="target" position={Position.Left}  className="!bg-pink-400" />
      <Handle type="source" position={Position.Right} className="!bg-pink-400" />
    </div>
  );
});