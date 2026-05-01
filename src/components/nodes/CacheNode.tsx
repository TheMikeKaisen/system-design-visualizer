import { Handle, NodeProps, Position } from "@xyflow/react";
import { CacheIcon, LoadBar } from "./SharedPrimitives";
import { SystemNode } from "@/types";
import { memo } from "react";
import { cn } from "@/lib/utils";

export const CacheNode = memo(function CacheNode({
  data, selected,
}: NodeProps<SystemNode>) {
  return (
    <div className={cn(
      "relative flex flex-col gap-1 rounded-xl border bg-background px-4 py-3 min-w-[160px]",
      selected ? "border-amber-400 ring-1 ring-amber-400/20" : "border-border hover:border-amber-300"
    )}>
      <LoadBar load={data.load} color="bg-amber-400" />
      <div className="flex items-center gap-2">
        <CacheIcon className="size-4 text-amber-500 shrink-0" />
        <span className="text-sm font-medium truncate">{data.label}</span>
      </div>
      <span className="text-[10px] text-muted-foreground">
        {data.metadata.engine as string} · {data.activeConnections} conn
      </span>
      <Handle type="target" position={Position.Left}  className="!bg-amber-400" />
      <Handle type="source" position={Position.Right} className="!bg-amber-400" />
    </div>
  );
});

