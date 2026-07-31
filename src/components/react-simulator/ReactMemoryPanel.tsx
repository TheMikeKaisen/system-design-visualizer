import React from "react";
import { ReactStepState } from "@/lib/react-simulator/engine";
import { Package, ArrowLeft, Cpu, Library } from "lucide-react";

interface Props {
  step: ReactStepState;
}

export function ReactMemoryPanel({ step }: Props) {
  if (step.useRefMode !== "react-memory") return null;

  return (
    <div className="flex-1 flex items-center justify-center bg-zinc-950 p-6 rounded-xl border border-zinc-800 relative overflow-hidden h-full">
      
      {/* Divided Background (Optional visual flair) */}
      <div className="absolute inset-0 flex pointer-events-none">
        <div className="flex-1 bg-purple-950/10 border-r border-zinc-800/50"></div>
        <div className="w-[400px] bg-emerald-950/5"></div>
      </div>

      <div className="flex flex-row w-full max-w-5xl gap-4 relative z-10 items-stretch justify-between h-full">
        
        {/* LEFT: The Component */}
        <div className="flex-1 flex flex-col items-center justify-center relative">
          <div className="flex items-center gap-2 text-purple-400 mb-6 bg-purple-950/30 px-4 py-1.5 rounded-full border border-purple-900/50 relative z-20 shadow-sm shadow-purple-900/20">
            <Cpu className="w-4 h-4" />
            <span className="text-xs font-bold uppercase tracking-widest">Component Execution</span>
          </div>

          <div className="relative w-full max-w-sm z-10">
            {/* Shockwave for render */}
            {step.isRenderTriggered && (
              <>
                <div className="absolute inset-0 rounded-lg bg-purple-500/40 animate-ping opacity-75 scale-110 duration-700"></div>
                <div className="absolute inset-[-10px] rounded-xl bg-purple-500/20 animate-ping opacity-50 duration-1000 delay-150"></div>
              </>
            )}

            <div className={`relative w-full p-8 bg-zinc-900 border-2 rounded-xl text-center transition-colors duration-300 shadow-xl
              ${step.isRenderTriggered ? 'border-purple-500 shadow-[0_0_40px_rgba(168,85,247,0.3)] bg-purple-950/20' : 'border-zinc-700'}
            `}>
               {step.isRenderTriggered ? (
                 <div className="absolute top-2 right-2 text-[10px] font-bold text-purple-100 bg-purple-600 px-2 py-0.5 rounded shadow-lg animate-pulse uppercase tracking-wider">
                   Re-rendering
                 </div>
               ) : (
                 <div className="absolute top-2 right-2 text-[10px] font-bold text-zinc-500 uppercase tracking-widest">
                   Idle
                 </div>
               )}

               <div className="flex flex-col justify-center gap-6 mt-4 items-center min-h-[120px]">
                 
                 {/* Normal let Variable */}
                 {step.letValue !== undefined && step.letValue !== null && (
                   <div className={`flex flex-col items-center p-3 w-full rounded-lg border border-rose-900/50 bg-rose-950/20 transition-all duration-300 relative
                     ${step.isRenderTriggered ? 'opacity-30 scale-95 blur-[2px] grayscale' : 'shadow-inner'}
                   `}>
                     <span className="text-zinc-500 text-xs font-mono mb-1">let timerId =</span>
                     <span className={`font-mono font-bold text-lg transition-colors ${step.isRenderTriggered ? 'text-rose-500 line-through' : 'text-rose-300'}`}>
                       {step.letValue}
                     </span>
                     
                     {step.isRenderTriggered && (
                       <div className="absolute -inset-1 border-2 border-rose-500/50 rounded-lg scale-105 opacity-0 animate-[ping_1s_ease-out_1_forwards]"></div>
                     )}
                   </div>
                 )}

                 {/* State Variable */}
                 {step.stateValue !== undefined && step.stateValue !== null && (
                   <div className="flex flex-col items-center p-3 w-full rounded-lg border border-purple-900/50 bg-purple-950/20 shadow-inner">
                     <span className="text-zinc-500 text-xs font-mono mb-1">const [time] =</span>
                     <span className="font-mono font-bold text-lg text-purple-300">
                       {step.stateValue}
                     </span>
                   </div>
                 )}
                 
                 {step.letValue === undefined && step.stateValue === undefined && (
                    <div className="text-zinc-600 font-mono text-sm italic">
                      (Running...)
                    </div>
                 )}
               </div>
            </div>
          </div>
        </div>

        {/* MIDDLE: CONNECTION ANIMATION */}
        <div className="w-48 flex flex-col items-center justify-center relative px-2">
          {step.boxShelfStatus === 'handed-down' ? (
            <div className="flex flex-col items-center justify-center animate-in fade-in slide-in-from-right-8 duration-500 z-0">
               <div className="bg-emerald-500/10 text-emerald-400 text-[10px] font-bold uppercase px-3 py-1.5 rounded-full border border-emerald-500/30 text-center leading-tight mb-3 shadow-[0_0_15px_rgba(16,185,129,0.2)]">
                 Returns EXACT<br/>SAME Object
               </div>
               <div className="flex items-center w-full">
                  <ArrowLeft className="w-5 h-5 text-emerald-500 flex-shrink-0 animate-[pulse_1s_ease-in-out_infinite]" />
                  <div className="flex-1 h-0.5 bg-gradient-to-l from-emerald-500 to-purple-500/20"></div>
               </div>
            </div>
          ) : (
            <div className="w-full h-0.5 border-t-2 border-dashed border-zinc-800"></div>
          )}
        </div>

        {/* RIGHT: React Memory Shelf */}
        <div className="w-[300px] flex flex-col items-center justify-center relative h-full">
          
          <div className={`transition-all duration-700 w-full flex flex-col items-center ${step.activeBoxId ? 'opacity-100 translate-x-0' : 'opacity-40 translate-x-4 grayscale'}`}>
            <div className="flex items-center gap-2 text-emerald-400 mb-6 bg-emerald-950/30 px-4 py-1.5 rounded-full border border-emerald-900/50 shadow-sm shadow-emerald-900/20">
              <Library className="w-4 h-4" />
              <span className="text-xs font-bold uppercase tracking-widest text-center">React Memory</span>
            </div>
            
            {/* 3D-ish Bookcase Shelf */}
            <div className="w-full h-56 bg-zinc-900 border-x-[12px] border-b-[16px] border-zinc-800 rounded-b-md rounded-t-sm relative flex flex-col justify-end items-center px-4 pb-2 shadow-2xl">
               {/* Shelf depth backing */}
               <div className="absolute inset-0 bg-gradient-to-b from-zinc-950 to-zinc-900/50 pointer-events-none shadow-inner"></div>

               {/* The Box */}
               {step.activeBoxId ? (
                 <div className={`relative z-10 w-full max-w-[180px] bg-zinc-800 border-2 border-zinc-600 rounded-md p-5 text-center transition-all duration-500 shadow-xl
                   ${step.boxShelfStatus === 'mutating' ? 'ring-4 ring-blue-500/50 scale-105 -translate-y-4 shadow-[0_10px_30px_rgba(59,130,246,0.3)]' : ''}
                   ${step.boxShelfStatus === 'handed-down' ? 'border-emerald-500 shadow-[0_0_30px_rgba(16,185,129,0.2)] -translate-x-6' : ''}
                 `}>
                   <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-blue-600 text-white text-[10px] font-black uppercase px-3 py-0.5 rounded shadow-lg whitespace-nowrap tracking-widest border border-blue-400/50">
                     {step.activeBoxId}
                   </div>
                   <div className="flex flex-col items-center gap-3 mt-2">
                     <Package className={`w-10 h-10 transition-colors duration-300 ${step.boxShelfStatus === 'mutating' ? 'text-blue-400 drop-shadow-[0_0_8px_rgba(96,165,250,0.5)]' : 'text-zinc-500'}`} />
                     <div className="text-zinc-400 font-mono text-sm bg-zinc-950/50 px-3 py-1.5 rounded border border-zinc-700/50 w-full">
                       current: <span className="font-bold text-white text-lg ml-1">{step.refValue ?? '0'}</span>
                     </div>
                   </div>
                 </div>
               ) : (
                 <div className="text-zinc-700 font-mono text-sm mb-12 italic relative z-10 flex flex-col items-center gap-2">
                   <Package className="w-8 h-8 opacity-20" />
                   (Shelf is empty)
                 </div>
               )}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
