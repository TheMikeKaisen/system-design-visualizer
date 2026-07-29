import React, { useEffect, useState } from "react";
import { RealDOMNode } from "@/lib/react-simulator/engine";
import { cn } from "@/lib/utils";

interface RealDomViewerProps {
  tree: RealDOMNode | null | undefined;
}

function RealNode({ node, isRoot = false }: { node: RealDOMNode; isRoot?: boolean }) {
  // We use a local state to handle the flash effect so it resets properly when the step changes
  const [flash, setFlash] = useState(false);

  useEffect(() => {
    if (node.highlight) {
      setFlash(true);
      const timer = setTimeout(() => setFlash(false), 1000);
      return () => clearTimeout(timer);
    }
  }, [node]);

  return (
    <div 
      className={cn(
        "flex flex-col p-3 border-2 rounded-lg transition-all duration-500",
        isRoot ? "border-zinc-700 bg-zinc-900" : "border-zinc-700/50 bg-zinc-800/50 mt-3",
        flash ? "border-emerald-500 bg-emerald-500/20 shadow-[0_0_15px_rgba(16,185,129,0.5)] scale-[1.02]" : "",
        !flash && !node.highlight && !isRoot ? "hover:border-zinc-600" : ""
      )}
    >
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-bold text-zinc-400 bg-zinc-950 px-2 py-0.5 rounded-full uppercase tracking-wider">
          {node.type}
        </span>
      </div>
      
      {node.text && (
        <div className={cn(
          "text-zinc-200 font-medium py-1 px-2 rounded",
          flash ? "bg-emerald-500/30 text-emerald-100" : ""
        )}>
          {node.text}
        </div>
      )}

      {node.children && node.children.length > 0 && (
        <div className="flex flex-col gap-2 pl-2 border-l border-zinc-700 ml-2 mt-1">
          {node.children.map(child => (
            <RealNode key={child.id} node={child} />
          ))}
        </div>
      )}
    </div>
  );
}

export function RealDomViewer({ tree }: RealDomViewerProps) {
  if (!tree) {
    return (
      <div className="flex-1 bg-zinc-950 border border-zinc-800 rounded-xl flex flex-col items-center justify-center text-zinc-500 font-sans shadow-inner">
        <div className="w-64 h-48 border-2 border-dashed border-zinc-800 rounded-xl flex items-center justify-center">
          Browser View Empty
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 bg-zinc-950 rounded-xl flex flex-col overflow-hidden relative shadow-[0_10px_40px_-10px_rgba(0,0,0,0.7)] border border-zinc-700/50">
      {/* macOS style browser chrome */}
      <div className="h-12 border-b border-zinc-800 bg-zinc-900 flex items-center px-4 sticky top-0 z-10 gap-4 shrink-0">
        <div className="flex gap-2">
          <div className="w-3 h-3 rounded-full bg-red-500/90 shadow-inner"></div>
          <div className="w-3 h-3 rounded-full bg-amber-500/90 shadow-inner"></div>
          <div className="w-3 h-3 rounded-full bg-emerald-500/90 shadow-inner"></div>
        </div>
        
        {/* Fake URL Bar */}
        <div className="flex-1 flex justify-center">
          <div className="bg-zinc-950 border border-zinc-800/80 rounded-md px-4 py-1.5 text-xs text-zinc-500 font-mono w-full max-w-xs flex items-center justify-center gap-2 shadow-inner">
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 11c0 3.517-1.009 6.799-2.753 9.571m-3.44-2.04l.054-.09A13.916 13.916 0 008 11a4 4 0 118 0c0 1.017-.07 2.019-.203 3m-2.118 6.844A21.88 21.88 0 0015.171 17m3.839 1.132c.645-2.266.99-4.659.99-7.132A8 8 0 008 4.07M3 15.364c.64-1.319 1-2.8 1-4.364 0-1.457.39-2.823 1.07-4" />
            </svg>
            localhost:3000
          </div>
        </div>
        
        <div className="w-[52px]"></div> {/* Spacer to balance dots */}
      </div>

      {/* Browser Viewport */}
      <div className="flex-1 overflow-auto p-6 bg-zinc-950 text-zinc-200 font-sans relative">
        {/* Very subtle grid for the viewport */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] [background-size:32px_32px] pointer-events-none" />
        <div className="relative z-10">
          <RealNode node={tree} isRoot={true} />
        </div>
      </div>
    </div>
  );
}
