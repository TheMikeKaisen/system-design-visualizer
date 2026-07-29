import React from "react";
import { PriorityQueueItem } from "@/lib/backend-simulator/engine";
import { Zap } from "lucide-react";

interface Props {
  nextTickQueue?: PriorityQueueItem[];
  microtaskQueue?: PriorityQueueItem[];
  activePhase?: string;
}

export function PriorityQueuesPanel({ nextTickQueue = [], microtaskQueue = [], activePhase }: Props) {
  return (
    <div className="flex flex-col gap-2 relative">
      
      {/* Visual connection to Event Loop */}
      <div className="absolute -bottom-4 right-8 w-px h-8 bg-zinc-800 hidden md:block"></div>
      
      {/* Label */}
      <div className="flex items-center justify-between mb-1 px-1">
        <span className="text-[10px] font-bold tracking-widest text-zinc-500 uppercase">Priority Queues</span>
        <span className="text-[9px] font-mono text-zinc-600">Drains BEFORE Event Loop</span>
      </div>

      {/* nextTick Queue (Highest Priority) */}
      <div className={`rounded-lg border p-3 flex flex-col gap-2 transition-all duration-300
        ${activePhase === 'nextTick' ? 'bg-indigo-900/30 border-indigo-500 shadow-[0_0_15px_-3px_rgba(99,102,241,0.3)]' : 'bg-zinc-900/50 border-zinc-800'}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <Zap className={`w-3 h-3 ${activePhase === 'nextTick' ? 'text-indigo-400' : 'text-zinc-600'}`} />
            <span className={`text-xs font-bold uppercase tracking-wider ${activePhase === 'nextTick' ? 'text-indigo-300' : 'text-zinc-400'}`}>
              nextTick Queue
            </span>
          </div>
          <span className="text-[9px] font-bold bg-indigo-500/20 text-indigo-400 px-1.5 py-0.5 rounded">Priority 1</span>
        </div>
        
        <div className="flex gap-2 min-h-[28px] overflow-x-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          {nextTickQueue.map((item) => (
            <div 
              key={item.id}
              className={`px-2 py-1 rounded border text-[10px] font-mono whitespace-nowrap transition-all duration-500
                ${item.isProcessed 
                  ? 'bg-zinc-800 border-zinc-700 text-zinc-500 line-through opacity-50'
                  : 'bg-indigo-950 border-indigo-700 text-indigo-300'}`}
            >
              {item.label}
            </div>
          ))}
          {nextTickQueue.length === 0 && <div className="text-[10px] italic text-zinc-700 flex items-center">Empty</div>}
        </div>
      </div>

      {/* Microtask Queue (Promises) */}
      <div className={`rounded-lg border p-3 flex flex-col gap-2 transition-all duration-300
        ${activePhase === 'microtasks' ? 'bg-fuchsia-900/30 border-fuchsia-500 shadow-[0_0_15px_-3px_rgba(217,70,239,0.3)]' : 'bg-zinc-900/50 border-zinc-800'}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <Zap className={`w-3 h-3 ${activePhase === 'microtasks' ? 'text-fuchsia-400' : 'text-zinc-600'}`} />
            <span className={`text-xs font-bold uppercase tracking-wider ${activePhase === 'microtasks' ? 'text-fuchsia-300' : 'text-zinc-400'}`}>
              Microtask Queue (Promises)
            </span>
          </div>
          <span className="text-[9px] font-bold bg-fuchsia-500/20 text-fuchsia-400 px-1.5 py-0.5 rounded">Priority 2</span>
        </div>
        
        <div className="flex gap-2 min-h-[28px] overflow-x-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          {microtaskQueue.map((item) => (
            <div 
              key={item.id}
              className={`px-2 py-1 rounded border text-[10px] font-mono whitespace-nowrap transition-all duration-500
                ${item.isProcessed 
                  ? 'bg-zinc-800 border-zinc-700 text-zinc-500 line-through opacity-50'
                  : 'bg-fuchsia-950 border-fuchsia-700 text-fuchsia-300'}`}
            >
              {item.label}
            </div>
          ))}
          {microtaskQueue.length === 0 && <div className="text-[10px] italic text-zinc-700 flex items-center">Empty</div>}
        </div>
      </div>

    </div>
  );
}
