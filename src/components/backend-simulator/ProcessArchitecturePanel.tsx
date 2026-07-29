import React from "react";
import { ProcessArchitectureState } from "@/lib/backend-simulator/engine";
import { Layers, Zap, Cpu, Settings, Box } from "lucide-react";

interface Props {
  state?: ProcessArchitectureState;
}

export function ProcessArchitecturePanel({ state }: Props) {
  if (!state) return null;

  const {
    showProcess,
    showMainThread,
    showThreadPool,
    howManyThreads = 0,
    showV8,
    showLibuv,
    activeComponentId,
  } = state;

  return (
    <div className="flex-1 flex flex-col h-full bg-zinc-950 rounded-xl border border-zinc-800 overflow-hidden shadow-2xl relative">
      {/* Header */}
      <div className="h-10 border-b border-zinc-800 bg-zinc-900/50 flex items-center px-4 shrink-0">
        <Box className="w-4 h-4 text-emerald-400 mr-2" />
        <span className="text-xs font-semibold tracking-wider text-zinc-300 uppercase">Process Architecture</span>
      </div>

      {/* Body */}
      <div className="flex-1 p-8 flex items-center justify-center bg-zinc-950 overflow-auto">
        {!showProcess ? (
          <div className="text-center">
            <div className="w-24 h-24 rounded-2xl bg-zinc-900 border-2 border-dashed border-zinc-700 flex items-center justify-center mx-auto mb-4 animate-pulse">
              <span className="text-zinc-500 font-mono text-sm">server.js</span>
            </div>
            <p className="text-zinc-400 text-sm font-medium">Program on disk (inert)</p>
          </div>
        ) : (
          <div className={`relative w-full max-w-2xl bg-zinc-900/40 border-2 rounded-2xl p-6 transition-all duration-500 ${activeComponentId === 'process' ? 'border-emerald-500 shadow-[0_0_30px_-5px_rgba(16,185,129,0.3)]' : 'border-zinc-700'}`}>
            
            {/* Process Label */}
            <div className="absolute -top-3 left-6 bg-zinc-950 px-2 flex items-center gap-2">
              <span className={`text-xs font-bold uppercase tracking-widest ${activeComponentId === 'process' ? 'text-emerald-400' : 'text-zinc-500'}`}>
                Node Process
              </span>
            </div>

            <div className="grid grid-cols-2 gap-6 mt-4">
              
              {/* Left Column: V8 & Main Thread */}
              <div className="flex flex-col gap-6">
                
                {showMainThread && (
                  <div className={`rounded-xl border p-4 transition-all duration-500 bg-zinc-950 ${activeComponentId === 'main-thread' ? 'border-blue-500 shadow-[0_0_20px_-5px_rgba(59,130,246,0.3)]' : 'border-zinc-800'}`}>
                    <div className="flex items-center gap-2 mb-3">
                      <Zap className={`w-4 h-4 ${activeComponentId === 'main-thread' ? 'text-blue-400' : 'text-zinc-500'}`} />
                      <span className={`text-sm font-bold ${activeComponentId === 'main-thread' ? 'text-blue-100' : 'text-zinc-400'}`}>Main Thread</span>
                    </div>
                    <div className="h-24 bg-zinc-900 rounded border border-zinc-800 flex flex-col-reverse p-2 gap-1 relative overflow-hidden">
                      <div className="absolute inset-0 bg-blue-500/5"></div>
                      <div className="h-6 bg-blue-600/30 border border-blue-500/50 rounded w-full flex items-center justify-center text-[10px] text-blue-200">Execution</div>
                    </div>
                  </div>
                )}

                {showV8 && (
                  <div className={`rounded-xl border p-4 transition-all duration-500 bg-zinc-950 ${activeComponentId === 'v8' ? 'border-yellow-500 shadow-[0_0_20px_-5px_rgba(234,179,8,0.3)]' : 'border-zinc-800'}`}>
                    <div className="flex items-center gap-2 mb-2">
                      <Cpu className={`w-4 h-4 ${activeComponentId === 'v8' ? 'text-yellow-400' : 'text-zinc-500'}`} />
                      <span className={`text-sm font-bold ${activeComponentId === 'v8' ? 'text-yellow-100' : 'text-zinc-400'}`}>V8 Engine</span>
                    </div>
                    <p className="text-[10px] text-zinc-500">Executes JS code</p>
                  </div>
                )}

              </div>

              {/* Right Column: libuv & Thread Pool */}
              <div className="flex flex-col gap-6">
                
                {showThreadPool && (
                  <div className={`rounded-xl border p-4 transition-all duration-500 bg-zinc-950 ${activeComponentId === 'thread-pool' ? 'border-purple-500 shadow-[0_0_20px_-5px_rgba(168,85,247,0.3)]' : 'border-zinc-800'}`}>
                    <div className="flex items-center gap-2 mb-3">
                      <Layers className={`w-4 h-4 ${activeComponentId === 'thread-pool' ? 'text-purple-400' : 'text-zinc-500'}`} />
                      <span className={`text-sm font-bold ${activeComponentId === 'thread-pool' ? 'text-purple-100' : 'text-zinc-400'}`}>Thread Pool</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      {[1, 2, 3, 4].map((id) => (
                        <div 
                          key={id} 
                          className={`h-12 rounded border flex flex-col items-center justify-center transition-all duration-700
                            ${id <= howManyThreads 
                              ? 'bg-purple-900/20 border-purple-500/30 opacity-100' 
                              : 'bg-zinc-900/50 border-zinc-800 opacity-30 scale-95'}`}
                        >
                          <span className={`text-[10px] font-mono ${id <= howManyThreads ? 'text-purple-300' : 'text-zinc-600'}`}>Thread {id}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {showLibuv && (
                  <div className={`rounded-xl border p-4 transition-all duration-500 bg-zinc-950 ${activeComponentId === 'libuv' ? 'border-rose-500 shadow-[0_0_20px_-5px_rgba(244,63,94,0.3)]' : 'border-zinc-800'}`}>
                    <div className="flex items-center gap-2 mb-2">
                      <Settings className={`w-4 h-4 ${activeComponentId === 'libuv' ? 'text-rose-400' : 'text-zinc-500'}`} />
                      <span className={`text-sm font-bold ${activeComponentId === 'libuv' ? 'text-rose-100' : 'text-zinc-400'}`}>libuv</span>
                    </div>
                    <p className="text-[10px] text-zinc-500">Async I/O & Event Loop</p>
                  </div>
                )}

              </div>

            </div>
          </div>
        )}
      </div>
    </div>
  );
}
