"use client";
import { Handle, Position } from "@xyflow/react";
import { useScenarioStore } from "@/lib/store/useScenarioStore";
import { NodeProps } from "@xyflow/react";
import { SystemNode } from "@/types";

export function PlatformBoundaryNode({ id }: NodeProps<SystemNode>) {
  const status = useScenarioStore(s => s.nodeStatuses[id] || "idle");

  const isOpen = status === "processing";
  const isDone = status === "success";

  return (
    <div
      className="relative flex items-center justify-center pointer-events-none"
      style={{ width: 1200, height: 80 }}
    >
      {/* Background ambient glow when open */}
      {isOpen && (
        <div className="absolute inset-0 bg-yellow-400/5 blur-3xl rounded-full" />
      )}

      <div
        className={`absolute left-0 h-[2px] transition-all duration-1000 ${isDone ? "bg-green-500/60" : isOpen ? "bg-yellow-400/90" : "bg-border/30"} ${isOpen ? "w-[30%]" : "w-[40%]"}`}
        style={{ top: "50%", boxShadow: isOpen ? "0 0 20px 4px rgba(250,204,21,0.6)" : isDone ? "0 0 12px rgba(34,197,94,0.4)" : "none" }}
      />

      <div className="relative flex items-center justify-center z-10 px-4">
        <div className={`relative flex items-center gap-3 px-6 py-2.5 rounded-full border text-[11px] font-bold uppercase tracking-[0.25em] transition-all duration-1000 ${isDone ? "border-green-500/60 text-green-500 bg-green-500/5 shadow-[0_0_24px_rgba(34,197,94,0.2)]" : isOpen ? "border-yellow-400/90 text-yellow-400 bg-yellow-400/10 shadow-[0_0_36px_rgba(250,204,21,0.4)] scale-110" : "border-border/50 text-muted-foreground/50 bg-background/80 backdrop-blur"}`}>
          {isOpen && <span className="w-2.5 h-2.5 rounded-full bg-yellow-400 animate-ping absolute -left-1 opacity-90" />}
          {isDone && <span className="w-2.5 h-2.5 rounded-full bg-green-500 shrink-0 shadow-[0_0_8px_rgba(34,197,94,0.8)]" />}
          <span>Platform Boundary</span>
          {isOpen && <span className="w-2.5 h-2.5 rounded-full bg-yellow-400 animate-ping absolute -right-1 opacity-90" />}
        </div>
      </div>

      <div
        className={`absolute right-0 h-[2px] transition-all duration-1000 ${isDone ? "bg-green-500/60" : isOpen ? "bg-yellow-400/90" : "bg-border/30"} ${isOpen ? "w-[30%]" : "w-[40%]"}`}
        style={{ top: "50%", boxShadow: isOpen ? "0 0 20px 4px rgba(250,204,21,0.6)" : isDone ? "0 0 12px rgba(34,197,94,0.4)" : "none" }}
      />

      {isOpen && (
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="absolute w-1 h-1 rounded-full bg-yellow-400/80 animate-ping" style={{ left: `${15 + Math.random() * 70}%`, top: `${20 + Math.random() * 60}%`, animationDelay: `${Math.random() * 1.5}s`, animationDuration: "1s" }} />
          ))}
        </div>
      )}

      <Handle type="target" position={Position.Left} style={{ opacity: 0, pointerEvents: "none" }} />
      <Handle type="source" position={Position.Right} style={{ opacity: 0, pointerEvents: "none" }} />
    </div>
  );
}
