import React from "react";
import { ThreadPoolThread } from "@/lib/backend-simulator/engine";
import { Settings } from "lucide-react";

interface Props {
  threads?: ThreadPoolThread[];
}

export function ThreadPoolPanel({ threads = [] }: Props) {
  return (
    <div className="flex-1 flex flex-col h-full bg-zinc-950 rounded-xl border border-zinc-800 shadow-2xl relative">
      {/* Label */}
      <div className="absolute -top-3 left-6 bg-zinc-950 px-2 z-10">
        <span className="text-[10px] font-bold tracking-widest text-zinc-500 uppercase">libuv Thread Pool</span>
      </div>

      {/* Body */}
      <div className="flex-1 p-6 bg-[#0f0a14] grid grid-cols-1 sm:grid-cols-2 gap-4 rounded-b-xl overflow-hidden">
        {threads.map((thread) => {
          const isWorking = thread.status === "working";
          return (
            <div 
              key={thread.id}
              className={`rounded-xl border p-4 flex flex-col justify-center transition-all duration-500
                ${isWorking 
                  ? 'bg-purple-900/40 border-purple-500 shadow-[0_0_15px_-3px_rgba(168,85,247,0.4)]' 
                  : 'bg-zinc-900/30 border-zinc-800'}`}
            >
              <div className="flex items-center gap-2 mb-2">
                <Settings className={`w-4 h-4 ${isWorking ? 'text-purple-400 animate-spin-slow' : 'text-zinc-600'}`} />
                <span className={`text-xs font-bold uppercase tracking-wider ${isWorking ? 'text-purple-300' : 'text-zinc-500'}`}>
                  Thread {thread.id}
                </span>
              </div>
              
              <div className={`text-sm font-medium h-6 flex items-center truncate ${isWorking ? 'text-purple-100' : 'text-zinc-600'}`}>
                {isWorking ? thread.task : "Idle"}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
