import React from "react";
import { Layers } from "lucide-react";

interface Props {
  stack?: { id: string; label: string }[];
}

export function BackendCallStackPanel({ stack = [] }: Props) {
  return (
    <div className="flex-1 flex flex-col h-full bg-zinc-950 rounded-xl border border-zinc-800 overflow-hidden shadow-2xl">
      {/* Header */}
      <div className="h-10 border-b border-zinc-800 bg-zinc-900/50 flex items-center px-4 shrink-0">
        <Layers className="w-4 h-4 text-blue-400 mr-2" />
        <span className="text-xs font-semibold tracking-wider text-zinc-300 uppercase">Call Stack</span>
        <span className="ml-auto text-[10px] font-mono text-zinc-500">{stack.length} frames</span>
      </div>

      {/* Body */}
      <div className="flex-1 p-4 flex flex-col-reverse justify-start overflow-auto gap-2 bg-[#0a0a0a] [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
        {stack.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-zinc-600">
            <span className="text-xs font-medium uppercase tracking-widest">Stack Empty</span>
          </div>
        ) : (
          stack.map((frame, idx) => (
            <div 
              key={frame.id + "-" + idx}
              className="bg-blue-950/30 border border-blue-900/50 rounded-lg p-3 shadow-sm animate-in slide-in-from-bottom-2"
            >
              <div className="text-sm font-mono text-blue-300 font-bold">{frame.label}</div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
