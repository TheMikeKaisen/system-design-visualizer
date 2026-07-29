import React from "react";
import { Terminal } from "lucide-react";

interface Props {
  output?: string[];
}

export function ConsoleOutputPanel({ output = [] }: Props) {
  return (
    <div className="flex-1 flex flex-col h-full bg-black rounded-xl border border-zinc-800 overflow-hidden shadow-2xl">
      {/* Header */}
      <div className="h-8 border-b border-zinc-800 bg-zinc-900/80 flex items-center px-3 shrink-0">
        <Terminal className="w-3.5 h-3.5 text-zinc-400 mr-2" />
        <span className="text-[10px] font-semibold tracking-widest text-zinc-400 uppercase">Console</span>
      </div>

      {/* Body */}
      <div className="flex-1 p-3 font-mono text-xs overflow-auto flex flex-col justify-end [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
        {output.length === 0 ? (
          <div className="text-zinc-600 italic">No output yet...</div>
        ) : (
          <div className="flex flex-col gap-1">
            {output.map((line, idx) => (
              <div key={idx} className="text-zinc-300">
                <span className="text-zinc-600 mr-2">{">"}</span>
                <span dangerouslySetInnerHTML={{ __html: line }} />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
