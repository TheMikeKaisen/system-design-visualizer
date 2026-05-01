"use client";
import { memo } from "react";
import { Handle, Position, type NodeProps } from "@xyflow/react";
import type { SystemNode } from "@/types";
import { cn } from "@/lib/utils";
import { DbIcon, LoadBar } from "./SharedPrimitives";

export const DatabaseNode = memo(function DatabaseNode({
  data, selected,
}: NodeProps<SystemNode>) {
  return (
    <div className={cn(
      "relative flex flex-col gap-1 rounded-xl border bg-background px-4 py-3 min-w-[160px]",
      selected ? "border-teal-500 ring-1 ring-teal-500/20" : "border-border hover:border-teal-300"
    )}>
      <LoadBar load={data.load} color="bg-teal-500" />
      <div className="flex items-center gap-2">
        <DbIcon className="size-4 text-teal-600 shrink-0" />
        <span className="text-sm font-medium truncate">{data.label}</span>
      </div>
      <span className="text-[10px] text-muted-foreground">
        {data.metadata.engine as string} · {data.activeConnections} conn
      </span>
      <Handle type="target" position={Position.Left}  className="!bg-teal-400" />
      <Handle type="source" position={Position.Right} className="!bg-teal-400" />
    </div>
  );
});