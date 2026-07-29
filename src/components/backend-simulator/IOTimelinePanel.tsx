import React from "react";
import { TimelineRequest } from "@/lib/backend-simulator/engine";
import { Clock } from "lucide-react";

interface Props {
  mode: "blocking" | "nonblocking";
  requests: TimelineRequest[];
}

export function IOTimelinePanel({ mode, requests }: Props) {
  return (
    <div className={`flex-1 flex flex-col h-full rounded-xl border overflow-hidden shadow-2xl transition-colors duration-500
      ${mode === 'blocking' ? 'bg-rose-950/20 border-rose-900/50' : 'bg-emerald-950/20 border-emerald-900/50'}`}>
      
      {/* Header */}
      <div className={`h-10 border-b flex items-center px-4 shrink-0
        ${mode === 'blocking' ? 'border-rose-900/50 bg-rose-950/40' : 'border-emerald-900/50 bg-emerald-950/40'}`}>
        <Clock className={`w-4 h-4 mr-2 ${mode === 'blocking' ? 'text-rose-400' : 'text-emerald-400'}`} />
        <span className={`text-xs font-semibold tracking-wider uppercase ${mode === 'blocking' ? 'text-rose-400' : 'text-emerald-400'}`}>
          {mode === 'blocking' ? 'Blocking Server Timeline' : 'Non-Blocking Server Timeline'}
        </span>
      </div>

      {/* Body */}
      <div className="flex-1 p-6 flex flex-col gap-8 relative overflow-hidden bg-zinc-950">
        
        {/* Time axis */}
        <div className="absolute top-0 bottom-0 left-[100px] right-6 border-l border-zinc-800">
          {[20, 40, 60, 80, 100].map(pct => (
            <div key={pct} className="absolute top-0 bottom-0 border-l border-dashed border-zinc-800" style={{ left: `${pct}%` }} />
          ))}
        </div>

        {/* Requests */}
        <div className="z-10 flex flex-col gap-6 mt-4">
          
          {/* Row A */}
          <div className="flex items-center h-8 relative pr-6">
            <div className="w-[85px] shrink-0 text-xs font-bold text-zinc-400 uppercase tracking-wider">Req A</div>
            <div className="flex-1 relative h-full">
              {requests.filter(r => r.id.startsWith("A")).map(req => (
                <div 
                  key={req.id}
                  className={`absolute top-0 bottom-0 rounded-md border flex items-center justify-center overflow-hidden transition-all duration-700
                    ${req.status === 'frozen' ? 'bg-rose-900/40 border-rose-500/50' : 
                      req.status === 'processing' ? 'bg-blue-900/40 border-blue-500/50' :
                      req.status === 'complete' ? 'bg-emerald-900/40 border-emerald-500/50' : 'bg-zinc-800 border-zinc-700'}`}
                  style={{ left: `${req.startPct}%`, width: `${req.widthPct}%` }}
                >
                  <span className={`text-[10px] font-bold uppercase truncate px-2
                    ${req.status === 'frozen' ? 'text-rose-300' : 
                      req.status === 'processing' ? 'text-blue-300' :
                      req.status === 'complete' ? 'text-emerald-300' : 'text-zinc-500'}`}>
                    {req.status === 'frozen' ? 'FROZEN / WAITING ON DISK' : req.status === 'complete' ? 'DONE' : 'CPU'}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Row B */}
          <div className="flex items-center h-8 relative pr-6">
            <div className="w-[85px] shrink-0 text-xs font-bold text-zinc-400 uppercase tracking-wider">Req B</div>
            <div className="flex-1 relative h-full">
              {requests.filter(r => r.id.startsWith("B")).map(req => (
                <div 
                  key={req.id}
                  className={`absolute top-0 bottom-0 rounded-md border flex items-center justify-center overflow-hidden transition-all duration-700
                    ${req.status === 'frozen' || req.status === 'waiting' ? 'bg-rose-900/40 border-rose-500/50' : 
                      req.status === 'processing' ? 'bg-blue-900/40 border-blue-500/50' :
                      req.status === 'complete' ? 'bg-emerald-900/40 border-emerald-500/50' : 'bg-zinc-800 border-zinc-700'}`}
                  style={{ left: `${req.startPct}%`, width: `${req.widthPct}%` }}
                >
                  <span className={`text-[10px] font-bold uppercase truncate px-2
                    ${req.status === 'frozen' || req.status === 'waiting' ? 'text-rose-300' : 
                      req.status === 'processing' ? 'text-blue-300' :
                      req.status === 'complete' ? 'text-emerald-300' : 'text-zinc-500'}`}>
                    {req.status === 'waiting' ? 'BLOCKED IN QUEUE' : req.status === 'complete' ? 'DONE' : 'CPU'}
                  </span>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
