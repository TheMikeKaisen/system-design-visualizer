import React from "react";
import { ReactStepState } from "@/lib/react-simulator/engine";
import { Zap, Lock, Unlock, KeyRound } from "lucide-react";

interface Props {
  step: ReactStepState;
}

export function StateVsRefPanel({ step }: Props) {
  if (step.useRefMode !== "state-vs-ref") return null;

  return (
    <div className="flex-1 flex flex-col items-center justify-center bg-zinc-950 p-6 rounded-xl border border-zinc-800 relative overflow-hidden">
      <h3 className="text-xl font-bold text-zinc-100 mb-12 tracking-wide z-10">Memory Across Renders</h3>
      
      <div className="flex w-full max-w-3xl gap-12 z-10">
        {/* useState Side */}
        <div className="flex-1 flex flex-col items-center relative">
          <div className="flex items-center gap-2 mb-4 text-purple-400">
            <Zap className="w-4 h-4" />
            <div className="text-sm font-bold tracking-widest uppercase">useState</div>
          </div>
          
          <div className="relative w-full">
            {/* Shockwave Animations */}
            {step.isRenderTriggered && (
              <>
                <div className="absolute inset-0 rounded-lg bg-purple-500/30 animate-ping opacity-75 scale-125 duration-1000"></div>
                <div className="absolute inset-[-10px] rounded-xl bg-purple-500/20 animate-ping opacity-50 duration-[1500ms]"></div>
              </>
            )}

            <div className={`relative w-full p-8 rounded-lg border-2 transition-all duration-300 z-10 backdrop-blur-md ${step.isRenderTriggered ? "border-purple-500 bg-purple-900/40 shadow-[0_0_30px_rgba(168,85,247,0.4)]" : "border-zinc-700 bg-zinc-900"}`}>
              <div className="text-center">
                <span className="text-zinc-400 text-sm font-mono">state = </span>
                <span className="text-3xl font-black text-zinc-100 drop-shadow-md">{step.stateValue ?? "null"}</span>
              </div>
              
              <div className={`mt-6 text-center text-xs font-bold py-2 px-4 rounded-md transition-all duration-300 ${step.isRenderTriggered ? 'text-purple-100 bg-purple-500 animate-pulse shadow-lg' : 'text-zinc-500 bg-zinc-800/50'}`}>
                {step.isRenderTriggered ? 'RE-RENDER TRIGGERED!' : 'Sleeping...'}
              </div>
            </div>
          </div>
        </div>

        {/* useRef Side (The Vault) */}
        <div className="flex-1 flex flex-col items-center">
          <div className="flex items-center gap-2 mb-4 text-blue-400">
            <KeyRound className="w-4 h-4" />
            <div className="text-sm font-bold tracking-widest uppercase">useRef</div>
          </div>
          
          <div className="w-full relative group">
            {/* Vault Body */}
            <div className="relative w-full p-8 rounded-lg border-[3px] border-zinc-600 bg-gradient-to-br from-zinc-800 to-zinc-900 shadow-inner overflow-hidden transition-all duration-500">
              
              {/* Vault Door Detail */}
              <div className="absolute left-0 top-0 bottom-0 w-4 border-r-2 border-zinc-700 bg-zinc-800/50 flex flex-col justify-evenly items-center">
                 <div className="w-2 h-2 rounded-full bg-zinc-600"></div>
                 <div className="w-2 h-2 rounded-full bg-zinc-600"></div>
                 <div className="w-2 h-2 rounded-full bg-zinc-600"></div>
              </div>

              <div className="pl-6 text-center flex flex-col items-center justify-center gap-3">
                <div className="flex items-center gap-3 text-zinc-300 font-mono bg-zinc-950 p-4 rounded-md border border-zinc-800 shadow-inner w-full justify-center">
                  <span>current:</span>
                  <span className="text-2xl font-black text-blue-400 drop-shadow-sm">{step.refValue ?? "null"}</span>
                </div>

                {!step.isRenderTriggered && step.refValue !== 0 && step.refValue !== null && step.refValue !== "null" && step.refValue !== "undefined" ? (
                  <div className="flex items-center gap-1.5 text-xs font-bold text-blue-400 mt-2">
                    <Unlock className="w-3.5 h-3.5" />
                    <span>Silently Updated</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-1.5 text-xs font-bold text-zinc-500 mt-2">
                    <Lock className="w-3.5 h-3.5" />
                    <span>Locked</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Background divider */}
      <div className="absolute left-1/2 top-0 bottom-0 w-px bg-zinc-800 -translate-x-1/2 z-0"></div>
    </div>
  );
}
