import { Handle, Position } from "@xyflow/react";
import { SystemNodeData } from "@/types";
import { useScenarioStore } from "@/lib/store/useScenarioStore";

interface EducationalNodeBaseProps {
  id: string;
  data: SystemNodeData;
  icon: React.ReactNode;
  colorClass: string;
  selected?: boolean;
  children?: React.ReactNode;
  hideDefaultHandles?: boolean;
}

export function EducationalNodeBase({ id, data, icon, colorClass, selected, children, hideDefaultHandles }: EducationalNodeBaseProps) {
  const store = useScenarioStore();
  
  const isSelectedNode = store.selectedNodeId === id;
  const isHighlighted = store.highlightedElementIds.has(id);
  const isAnyHighlighted = store.highlightedElementIds.size > 0;
  const status = store.nodeStatuses[id] || "idle";

  const opacity = isAnyHighlighted && !isHighlighted && !isSelectedNode ? "opacity-15 grayscale-[60%] blur-[1px]" : "opacity-100";
  
  // Base glow from being highlighted or selected
  let glow = (isHighlighted || isSelectedNode) ? "ring-2 ring-primary ring-offset-2 ring-offset-background shadow-[0_0_20px_rgba(var(--primary),0.4)]" : "";
  
  // Hero styling
  const isHero = data.hero === true;
  if (isHero && (isHighlighted || !isAnyHighlighted)) {
    glow = "ring-2 ring-amber-500 ring-offset-2 ring-offset-background shadow-[0_0_30px_rgba(245,158,11,0.6)] animate-pulse-slow";
  }

  // Status-specific styles
  let statusClasses = "";
  if (status === "processing") {
    statusClasses = "ring-2 ring-yellow-500 shadow-[0_0_20px_rgba(234,179,8,0.5)]";
    glow = "";
  } else if (status === "success") {
    statusClasses = "ring-2 ring-green-500 shadow-[0_0_20px_rgba(34,197,94,0.5)]";
    glow = "";
  } else if (status === "error") {
    statusClasses = "ring-2 ring-red-500 shadow-[0_0_20px_rgba(239,68,68,0.5)]";
    glow = "";
  }


  return (
    <>
      <div 
        onClick={() => {
          if (!store.isPlaying) {
            store.setSelectedNodeId(id);
          }
        }}
        className={`relative flex flex-col p-3 rounded-xl border border-border/60 bg-background/95 backdrop-blur-sm shadow-sm transition-all duration-700 ${!store.isPlaying ? 'cursor-pointer hover:border-primary/50' : 'cursor-default'}
          ${opacity} ${glow} ${statusClasses} ${isSelectedNode || selected ? 'border-primary ring-1 ring-primary' : ''} ${isHero ? 'scale-110 z-10' : ''}`}
        style={{ minWidth: isHero ? 200 : 180 }}
      >
        <div className="flex items-center gap-3 w-full">
          <div className={`relative p-2.5 rounded-lg text-white ${colorClass} shrink-0`}>
          {icon}
          
          {/* Status Overlay Indicators */}
          {status === "processing" && (
            <div className="absolute inset-0 rounded-lg bg-yellow-500/20 flex items-center justify-center animate-pulse">
              <svg className="w-5 h-5 animate-spin text-yellow-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>
            </div>
          )}
          {status === "success" && (
            <div className="absolute -top-1.5 -right-1.5 bg-green-500 text-white rounded-full p-0.5 shadow-sm">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
            </div>
          )}
          {status === "error" && (
            <div className="absolute -top-1.5 -right-1.5 bg-red-500 text-white rounded-full p-0.5 shadow-sm z-10">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </div>
          )}
        </div>
        
        <div className="flex-1 min-w-0 pr-6 pointer-events-none flex flex-col justify-center">
          <p className="text-xs font-bold text-foreground truncate">{data.label}</p>
          <p className="text-[10px] text-muted-foreground truncate uppercase tracking-wider">{data.kind}</p>
        </div>
        </div>
        
        {data.educational?.miniMonitor && (
          <div className="mt-3 bg-black/80 rounded border border-white/10 p-2 font-mono text-[10px] text-green-400 overflow-x-auto shadow-inner">
            <code>{data.educational.miniMonitor}</code>
          </div>
        )}

        {children}

        {!hideDefaultHandles && (
          data.metadata?.layout === "vertical" ? (
            <>
              <Handle type="target" position={Position.Top} id="top" className="w-2 h-2 rounded-full border-2 border-background bg-muted-foreground" />
              <Handle type="source" position={Position.Bottom} id="bottom" className="w-2 h-2 rounded-full border-2 border-background bg-muted-foreground" />
            </>
          ) : (
            <>
              <Handle type="target" position={Position.Left} id="left" className="w-2 h-2 rounded-full border-2 border-background bg-muted-foreground" style={{ top: 28 }} />
              <Handle type="source" position={Position.Right} id="right" className="w-2 h-2 rounded-full border-2 border-background bg-muted-foreground" style={{ top: 28 }} />
            </>
          )
        )}
        
        {/* Tooltip Overlay */}
        {store.activeTooltip?.nodeId === id && (
          (() => {
            const type = store.activeTooltip.type || "error"; // fallback for existing scripts without type
            const bgColor = 
              type === "success" ? "bg-green-500" :
              type === "warning" ? "bg-yellow-500" :
              type === "info" ? "bg-blue-500" :
              "bg-red-500";

            return (
              <div className={`absolute left-1/2 -translate-x-1/2 -top-14 text-white text-xs px-3 py-2 rounded shadow-lg whitespace-nowrap z-50 pointer-events-none ${bgColor}`}>
                {store.activeTooltip.message}
                <div className={`absolute left-1/2 -translate-x-1/2 -bottom-1 w-2 h-2 rotate-45 ${bgColor}`}></div>
              </div>
            );
          })()
        )}
      </div>
    </>
  );
}
