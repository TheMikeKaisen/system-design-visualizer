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
      "relative flex flex-col justify-center gap-1 rounded-xl border bg-background px-4 h-[60px] min-w-[160px]",
      selected ? "border-amber-400 ring-1 ring-amber-400/20" : "border-border hover:border-amber-300"
    )}>
      <LoadBar load={data.load} color="bg-amber-400" />
      <div className="flex items-center gap-2">
        <CacheIcon className="size-4 text-amber-500 shrink-0" />
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
      </span>
      <Handle type="target" position={Position.Left}  className="!bg-amber-400" />
      <Handle type="source" position={Position.Right} className="!bg-amber-400" />
    </div>
  );
});
