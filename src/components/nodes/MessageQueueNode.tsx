"use client";
import { memo } from "react";
import { Handle, Position, type NodeProps } from "@xyflow/react";
import type { SystemNode } from "@/types";
import { cn } from "@/lib/utils";
import { LoadBar, MqIcon } from "./SharedPrimitives";

export const MessageQueueNode = memo(function MessageQueueNode({
  data, selected,
}: NodeProps<SystemNode>) {
  return (
    <div className={cn(
      "relative flex flex-col gap-1 rounded-xl border bg-background px-4 py-3 min-w-[165px]",
      selected ? "border-pink-400 ring-1 ring-pink-400/20" : "border-border hover:border-pink-300"
    )}>
      <LoadBar load={data.load} color="bg-pink-400" />
      <div className="flex items-center gap-2">
        <MqIcon className="size-4 text-pink-500 shrink-0" />
        <span className="text-sm font-medium truncate">{data.label}</span>
      </div>
      <span className="text-[10px] text-muted-foreground">
        {data.metadata.engine as string}
      </span>
      <Handle type="target" position={Position.Left}  className="!bg-pink-400" />
      <Handle type="source" position={Position.Right} className="!bg-pink-400" />
    </div>
  );
});