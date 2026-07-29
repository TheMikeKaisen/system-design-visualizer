import React from "react";
import { EventLoopPhase } from "@/lib/backend-simulator/engine";
import { RotateCw } from "lucide-react";

interface Props {
  phases?: EventLoopPhase[];
}

export function EventLoopPhasesPanel({ phases = [] }: Props) {
  
  const phaseDisplayNames = {
    "timers": "Timers",
    "pending": "Pending Callbacks",
    "poll": "Poll",
    "check": "Check",
    "close": "Close Callbacks"
  };

  const phaseColors = {
    "timers": "text-yellow-400 border-yellow-500 bg-yellow-900/20",
    "pending": "text-orange-400 border-orange-500 bg-orange-900/20",
    "poll": "text-emerald-400 border-emerald-500 bg-emerald-900/20",
    "check": "text-cyan-400 border-cyan-500 bg-cyan-900/20",
    "close": "text-rose-400 border-rose-500 bg-rose-900/20"
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-zinc-950 rounded-xl border border-zinc-800 shadow-2xl relative">
      {/* Label */}
      <div className="absolute -top-3 left-6 bg-zinc-950 px-2 z-10 flex items-center gap-2">
        <RotateCw className="w-3 h-3 text-zinc-500" />
        <span className="text-[10px] font-bold tracking-widest text-zinc-500 uppercase">Event Loop Phases</span>
      </div>

      {/* Body */}
      <div className="flex-1 p-4 pt-6 bg-[#0a0f0d] flex flex-col gap-2 overflow-auto rounded-b-xl [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
        {phases.map((phase) => (
          <div 
            key={phase.name}
            className={`rounded-lg border p-3 flex flex-col gap-2 transition-all duration-300
              ${phase.isActive 
                ? `shadow-[0_0_15px_-3px_currentColor] ${phaseColors[phase.name]}`
                : 'bg-zinc-900/30 border-zinc-800 text-zinc-500'}`}
          >
            <div className="flex items-center justify-between">
              <span className={`text-xs font-bold uppercase tracking-wider ${phase.isActive ? '' : 'text-zinc-600'}`}>
                {phaseDisplayNames[phase.name]}
              </span>
              <span className={`text-[10px] font-mono ${phase.isActive ? 'opacity-80' : 'opacity-0'}`}>
                Active
              </span>
            </div>

            {/* Phase Queue */}
            <div className="flex gap-2 min-h-[28px] overflow-x-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
              {phase.queue.map((item) => (
                <div 
                  key={item.id}
                  className={`px-2 py-1 rounded border text-[10px] font-mono whitespace-nowrap transition-all duration-500
                    ${item.isProcessed 
                      ? 'bg-zinc-800 border-zinc-700 text-zinc-500 line-through opacity-50'
                      : 'bg-zinc-950 border-zinc-700 text-zinc-300'}`}
                >
                  {item.label}
                </div>
              ))}
              {phase.queue.length === 0 && (
                <div className="text-[10px] italic text-zinc-700 flex items-center">Queue empty</div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
