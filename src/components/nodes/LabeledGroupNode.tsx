"use client";
import { NodeProps } from "@xyflow/react";
import { SystemNode } from "@/types";

export function LabeledGroupNode({ data }: NodeProps<SystemNode>) {
  return (
    <div className="w-full h-full rounded-2xl border border-dashed border-white/10 bg-white/5 transition-all duration-300 pointer-events-none flex flex-col">
      {data.label && (
        <div className="px-4 py-3 text-[11px] font-bold uppercase tracking-[0.2em] text-muted-foreground/50 select-none">
          {data.label}
        </div>
      )}
    </div>
  );
}
