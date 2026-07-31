import React from "react";
import { ReactStepState } from "@/lib/react-simulator/engine";
import { Anchor, Cpu, Globe2, Link2Off } from "lucide-react";

interface Props {
  step: ReactStepState;
}

export function DomRefPanel({ step }: Props) {
  if (step.useRefMode !== "dom-ref") return null;

  return (
    <div className="flex-1 flex flex-col items-center justify-center bg-zinc-950 rounded-xl overflow-hidden relative">
      
      {/* Divided Background */}
      <div className="absolute inset-0 flex">
        <div className="flex-1 bg-purple-950/20 border-r border-zinc-800"></div>
        <div className="flex-1 bg-emerald-950/10"></div>
      </div>

      <h3 className="text-xl font-bold text-zinc-100 mb-8 tracking-wide z-10 mt-6">The Escape Hatch</h3>
      
      <div className="flex w-full max-w-4xl px-8 pb-12 gap-8 relative z-10 items-center justify-between">
        
        {/* React Component World */}
        <div className="flex-1 flex flex-col items-center p-6 bg-zinc-900 rounded-xl border-2 border-purple-500/30 shadow-lg relative z-20">
          <div className="flex items-center gap-2 mb-6 text-purple-400">
            <Cpu className="w-5 h-5" />
            <div className="text-sm font-bold uppercase tracking-widest">React World</div>
          </div>
          
          <div className="font-mono text-lg text-zinc-300 flex flex-col items-center gap-3 bg-zinc-950 p-4 rounded-lg border border-purple-900/50 w-full overflow-hidden">
            <span className="text-zinc-500 text-sm">Vault Contents</span>
            <div className="flex flex-wrap items-center justify-center gap-x-2 gap-y-1 w-full text-center">
              <span className="whitespace-nowrap">inputRef.current =</span>
              <span className={`font-bold whitespace-nowrap transition-all duration-500 ${step.refCurrentStatus === 'dom-node' ? 'text-emerald-400 bg-emerald-950/50 px-2 py-0.5 rounded' : 'text-rose-400'}`}>
                {step.refCurrentStatus === 'dom-node' ? 'RefTo(<input>)' : 'null'}
              </span>
            </div>
          </div>
        </div>

        {/* The Grappling Hook */}
        <div className="w-32 flex items-center justify-center relative h-10">
          <div className={`absolute w-full h-[2px] transition-all duration-700 ${step.refCurrentStatus === 'dom-node' ? 'bg-gradient-to-r from-purple-500 to-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.5)]' : 'bg-zinc-800 border-dashed border-t-2 border-zinc-700 bg-transparent'}`}></div>
          <div className={`absolute z-10 p-2 rounded-full border-2 transition-all duration-700 transform ${step.refCurrentStatus === 'dom-node' ? 'border-emerald-500 bg-zinc-950 translate-x-12 shadow-[0_0_15px_rgba(16,185,129,0.4)]' : 'border-zinc-800 bg-zinc-900 translate-x-0'}`}>
            {step.refCurrentStatus === 'dom-node' ? (
              <Anchor className="w-5 h-5 text-emerald-500" />
            ) : (
              <Link2Off className="w-5 h-5 text-zinc-600" />
            )}
          </div>
        </div>

        {/* Browser DOM World */}
        <div className={`flex-1 flex flex-col items-center p-6 rounded-xl border-2 transition-all duration-500 relative z-20 ${step.domNodeExists ? 'border-emerald-500/50 bg-emerald-950/20 shadow-lg' : 'border-zinc-800 bg-zinc-900/50'}`}>
          <div className={`flex items-center gap-2 mb-6 ${step.domNodeExists ? 'text-emerald-400' : 'text-zinc-600'}`}>
            <Globe2 className="w-5 h-5" />
            <div className="text-sm font-bold uppercase tracking-widest">Browser DOM</div>
          </div>

          {step.domNodeExists ? (
            <div className="relative inline-block w-full">
              <input 
                type="text" 
                placeholder="Search..." 
                className={`w-full bg-zinc-950 border-2 rounded-md px-4 py-3 text-zinc-100 outline-none transition-all duration-300 ${step.activeLine === 5 ? 'border-emerald-500 shadow-[0_0_30px_rgba(16,185,129,0.3)] ring-2 ring-emerald-500/20' : 'border-emerald-900/50'}`}
                readOnly
              />
              {/* Fake cursor if focused */}
              {step.activeLine === 5 && (
                <div className="absolute left-4 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-emerald-400 animate-pulse"></div>
              )}
            </div>
          ) : (
            <div className="text-zinc-500 font-mono text-sm italic py-4 bg-zinc-950/50 rounded-md border border-zinc-800/50 w-full text-center">
              (DOM node does not exist yet)
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
