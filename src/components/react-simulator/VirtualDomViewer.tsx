import React from "react";
import { VirtualDOMNode } from "@/lib/react-simulator/engine";
import { cn } from "@/lib/utils";

interface VirtualDomViewerProps {
  tree: VirtualDOMNode | null | undefined;
  title?: string;
  isOldTree?: boolean;
}

function renderNode(node: VirtualDOMNode | string): React.ReactNode {
  if (typeof node === "string") {
    return (
      <div className="text-zinc-400 font-mono text-sm py-1 px-2 my-0.5 bg-zinc-900/40 rounded border border-zinc-800/50 w-fit">
        <span className="text-zinc-500 mr-2">"</span>
        <span className="text-green-300">{node}</span>
        <span className="text-zinc-500 ml-2">"</span>
      </div>
    );
  }

  const statusColor = 
    node.diffStatus === "added" ? "text-emerald-400 bg-emerald-400/10 border-emerald-400/20 shadow-[0_0_10px_rgba(52,211,153,0.1)]" :
    node.diffStatus === "removed" ? "text-red-400 bg-red-400/10 border-red-400/20 line-through" :
    node.diffStatus === "changed" ? "text-amber-400 bg-amber-400/10 border-amber-400/20 shadow-[0_0_10px_rgba(251,191,36,0.1)]" :
    node.diffStatus === "unchanged" ? "text-zinc-500 bg-zinc-800/20 border-zinc-800/40" :
    "text-zinc-300 border-zinc-700 bg-zinc-900/50";

  return (
    <div key={node.id} className="flex flex-col">
      <div 
        className={cn(
          "font-mono text-sm py-1.5 px-3 rounded-md border inline-block my-0.5 transition-all w-fit",
          statusColor
        )}
      >
        <span className="text-blue-400">{"{"}</span>
        <span className="mx-2">
          type: <span className="text-orange-300">'{node.type}'</span>,
        </span>
        <span className="text-blue-400">{"}"}</span>
      </div>
      
      {node.children && node.children.length > 0 && (
        <div className="flex flex-col border-l-2 border-zinc-800/50 ml-4 pl-4 mt-1 mb-2 gap-1">
          {node.children.map((child, idx) => (
            <React.Fragment key={idx}>
              {renderNode(child)}
            </React.Fragment>
          ))}
        </div>
      )}
    </div>
  );
}

export function VirtualDomViewer({ tree, title = "Virtual DOM", isOldTree = false }: VirtualDomViewerProps) {
  if (!tree) {
    return (
      <div className="flex-1 bg-zinc-950/80 rounded-xl border border-zinc-800 flex flex-col items-center justify-center text-zinc-500 font-mono text-sm shadow-inner relative overflow-hidden">
        {/* Dot grid background */}
        <div className="absolute inset-0 bg-[radial-gradient(#27272a_1px,transparent_1px)] [background-size:16px_16px] opacity-30" />
        <span className="relative z-10">No Virtual DOM yet</span>
      </div>
    );
  }

  return (
    <div className={cn(
      "flex-1 bg-[#0a0a0c] rounded-xl border flex flex-col overflow-hidden relative shadow-[inset_0_2px_15px_rgba(0,0,0,0.5)] transition-all",
      isOldTree ? "border-red-900/50" : "border-blue-900/30"
    )}>
      {/* Blueprint background pattern */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(30,58,138,0.1)_1px,transparent_1px),linear-gradient(90deg,rgba(30,58,138,0.1)_1px,transparent_1px)] [background-size:20px_20px] pointer-events-none" />
      
      <div className={cn(
        "h-10 border-b flex items-center px-4 sticky top-0 z-10 backdrop-blur-sm",
        isOldTree ? "bg-red-950/40 border-red-900/50" : "bg-blue-950/20 border-blue-900/30"
      )}>
        <span className="text-xs font-semibold tracking-widest uppercase flex items-center gap-2 text-blue-400">
          <svg className="w-4 h-4 opacity-70" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 002-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
          </svg>
          {title}
        </span>
      </div>
      <div className="flex-1 overflow-auto p-5 relative z-10">
        {renderNode(tree)}
      </div>
    </div>
  );
}
