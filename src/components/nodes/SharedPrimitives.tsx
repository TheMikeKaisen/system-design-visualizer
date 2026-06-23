
import { useSimulationStore } from "@/lib/store/useSimulationStore";

export function LoadGlow({ load, colorHex }: { load: number; colorHex: string }) {
  return (
    <div 
      className="absolute inset-0 rounded-xl pointer-events-none transition-all duration-500 border-2"
      style={{
        borderColor: colorHex,
        boxShadow: load > 0 ? `0 0 ${load * 15}px ${colorHex}` : 'none',
        opacity: load > 0 ? 0.2 + (load * 0.8) : 0,
      }}
    />
  );
}

// Icon components (inline SVG, same style as NodePalette)
export function LBIcon({ className }: { className?: string }) {
  return <svg viewBox="0 0 16 16" className={className} fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round"><circle cx="8" cy="4" r="2"/><circle cx="3" cy="12" r="2"/><circle cx="13" cy="12" r="2"/><path d="M8 6v2M8 8L3 10M8 8l5 2"/></svg>;
}
export function DbIcon({ className }: { className?: string }) {
  return <svg viewBox="0 0 16 16" className={className} fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round"><ellipse cx="8" cy="4.5" rx="5" ry="2"/><path d="M3 4.5v7c0 1.1 2.24 2 5 2s5-.9 5-2v-7"/><path d="M3 8c0 1.1 2.24 2 5 2s5-.9 5-2"/></svg>;
}
export function S3Icon({ className }: { className?: string }) {
  return <svg viewBox="0 0 16 16" className={className} fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round"><path d="M8 2L14 5v6L8 14 2 11V5L8 2z"/><path d="M8 2v12M2 5l6 3 6-3"/></svg>;
}
export function CacheIcon({ className }: { className?: string }) {
  return <svg viewBox="0 0 16 16" className={className} fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round"><rect x="2" y="3" width="12" height="4" rx="1"/><rect x="2" y="9" width="12" height="4" rx="1"/><path d="M5 5h.01M5 11h.01"/></svg>;
}
export function MqIcon({ className }: { className?: string }) {
  return <svg viewBox="0 0 16 16" className={className} fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round"><path d="M2 4h12M2 8h8M2 12h10"/></svg>;
}

import { useCanvasStore } from "@/lib/store/useCanvasStore";
import { cn } from "@/lib/utils";

export function NodeMetricsAlerts({ nodeId }: { nodeId: string }) {
  const metrics = useSimulationStore((s) => s.nodeMetrics[nodeId]);
  const nodeData = useCanvasStore((s) => s.nodes.find((n) => n.id === nodeId));
  
  if (!metrics) return null;

  const queueLimit = nodeData?.data?.capacity?.queueLimit ?? 0;
  const isOverloaded = queueLimit > 0 && metrics.queueLength >= queueLimit;
  const hasDrops = metrics.dropCount > 0;
  const isCrashed = metrics.isCrashed;
  
  // Only show alerts if there's a problem
  if (!isOverloaded && !hasDrops && !isCrashed) return null;

  return (
    <div className="absolute -top-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1 z-50 pointer-events-none">
      {isCrashed && (
        <div className="bg-red-600/90 text-white text-[10px] font-bold px-2 py-0.5 rounded shadow-sm whitespace-nowrap animate-in fade-in slide-in-from-bottom-2">
          CRASHED (Out of Memory)
        </div>
      )}
      {!isCrashed && hasDrops && (
        <div className="bg-red-500/90 text-white text-[10px] font-bold px-2 py-0.5 rounded shadow-sm whitespace-nowrap animate-in fade-in slide-in-from-bottom-2">
          {metrics.dropCount} Dropped
        </div>
      )}
      {!isCrashed && isOverloaded && !hasDrops && (
        <div className="bg-yellow-500/90 text-white text-[10px] font-bold px-2 py-0.5 rounded shadow-sm whitespace-nowrap animate-in fade-in slide-in-from-bottom-2">
          Queue Full
        </div>
      )}
    </div>
  );
}

export function NodeQueueMetrics({ nodeId }: { nodeId: string }) {
  const metrics = useSimulationStore((s) => s.nodeMetrics[nodeId]);
  const nodeData = useCanvasStore((s) => s.nodes.find((n) => n.id === nodeId));
  
  if (!metrics || !nodeData?.data?.capacity?.queueLimit) return null;
  const queueLimit = nodeData.data.capacity.queueLimit;
  if (queueLimit <= 0) return null;
  
  return (
    <>
      <span className={cn(
        "text-[10px] text-muted-foreground ml-1 transition-opacity duration-300",
        metrics.queueLength > 0 ? "opacity-100" : "opacity-0"
      )}>
        · {metrics.queueLength} queued
      </span>
    </>
  );
}

export function NodeQueuePipe({ nodeId }: { nodeId: string }) {
  const metrics = useSimulationStore((s) => s.nodeMetrics[nodeId]);
  const nodeData = useCanvasStore((s) => s.nodes.find((n) => n.id === nodeId));
  
  if (!metrics || !nodeData?.data?.capacity?.queueLimit) return null;
  const queueLimit = nodeData.data.capacity.queueLimit;
  if (queueLimit <= 0) return null;
  
  return <QueuePipe length={metrics.queueLength} limit={queueLimit} />;
}

function QueuePipe({ length, limit }: { length: number; limit: number }) {
  const pct = Math.min((length / limit) * 100, 100);
  
  let color = "bg-green-500";
  if (pct >= 90) color = "bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.8)]";
  else if (pct >= 75) color = "bg-orange-500";
  else if (pct >= 50) color = "bg-yellow-500";
  else if (pct === 0) color = "bg-transparent";
  
  return (
    <div className="absolute -bottom-2 left-4 right-4 h-1.5 rounded-full overflow-hidden bg-muted/30 border border-border/50 flex pointer-events-none">
      <div
        className={`h-full transition-all duration-300 ${color}`}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}