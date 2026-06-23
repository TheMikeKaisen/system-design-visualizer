"use client";
import { memo } from "react";
import { Handle, Position, type NodeProps } from "@xyflow/react";
import type { SystemNode } from "@/types";
import { cn } from "@/lib/utils";
import { NodeMetricsAlerts, NodeQueuePipe } from "./SharedPrimitives";
import { LoadGlow, S3Icon } from "./SharedPrimitives";

export const S3BucketNode = memo(function S3BucketNode({
  id,
  data,
  selected,
}: NodeProps<SystemNode>) {
  return (
    <div className={cn(
      "relative flex flex-col gap-1 rounded-xl border bg-background px-4 py-3 min-w-[160px]",
      selected ? "border-orange-400 ring-1 ring-orange-400/20" : "border-border hover:border-orange-300"
    )}>
      <NodeMetricsAlerts nodeId={id} />
      <NodeQueuePipe nodeId={id} />
      <LoadGlow load={data.load} colorHex="#fb923c" />
      <div className="flex items-center gap-2">
        <S3Icon className="size-4 text-orange-500 shrink-0" />
        <span className="text-sm font-medium truncate">{data.label}</span>
      </div>
      <span className="text-[10px] text-muted-foreground">
        {data.metadata.region as string}
      </span>
      <Handle type="target" position={Position.Left}  className="!bg-orange-400" />
      <Handle type="source" position={Position.Right} className="!bg-orange-400" />
    </div>
  );
});