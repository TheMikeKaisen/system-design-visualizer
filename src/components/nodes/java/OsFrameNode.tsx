"use client";
import { NodeProps } from "@xyflow/react";
import { SystemNode } from "@/types";
import { useScenarioStore } from "@/lib/store/useScenarioStore";

const OS_ICONS: Record<string, React.ReactNode> = {
  windows: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M0 3.449L9.75 2.1v9.451H0m10.949-9.602L24 0v11.4H10.949M0 12.6h9.75v9.451L0 20.699M10.949 12.6H24V24l-12.9-1.801"/></svg>
  ),
  linux: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M12.504 0C7.47 0 6 5.35 6 7.5c0 1.9.507 3.273 1.23 4.243-.024.408-.044.824-.044 1.257C7.186 16.5 9 18 12 18s4.814-1.5 4.814-5c0-.433-.02-.849-.044-1.257C17.493 10.773 18 9.4 18 7.5 18 5.35 16.53 0 11.496 0zm0 2c2.5 0 4.504 3.35 4.504 5.5 0 1.5-.45 2.7-1.13 3.5.07.5.13 1 .13 1.5 0 2-1.1 3-3.504 3-2.403 0-3.504-1-3.504-3 0-.5.06-1 .13-1.5C7.95 10.2 7.5 9 7.5 7.5 7.5 5.35 9.504 2 12.504 2zm0 14c1.5 0 2.5.5 3 1.5h-6c.5-1 1.5-1.5 3-1.5zm-5 3h10c0 2-2.5 3-5 3s-5-1-5-3z"/></svg>
  ),
  macos: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/></svg>
  ),
};

const OS_COLORS: Record<string, { border: string; bg: string; badge: string }> = {
  windows: { border: "border-blue-500/30", bg: "bg-blue-500/5", badge: "bg-blue-500/20 text-blue-400" },
  linux:   { border: "border-orange-500/30", bg: "bg-orange-500/5", badge: "bg-orange-500/20 text-orange-400" },
  macos:   { border: "border-purple-500/30", bg: "bg-purple-500/5", badge: "bg-purple-500/20 text-purple-400" },
};

export function OsFrameNode({ id, data }: NodeProps<SystemNode>) {
  const status = useScenarioStore(s => s.nodeStatuses[id] || "idle");
  const isHighlighted = useScenarioStore(s => s.highlightedElementIds.has(id));

  const osKey = (data.metadata?.os as string || "linux").toLowerCase();
  const osLabel = data.label || "Linux OS";
  const colors = OS_COLORS[osKey] || OS_COLORS.linux;
  const icon = OS_ICONS[osKey] || OS_ICONS.linux;

  return (
    <div
      className={`rounded-2xl border-2 ${colors.border} ${colors.bg} transition-all duration-500 pointer-events-none ${isHighlighted ? "opacity-100" : "opacity-60"} ${status === "success" ? "border-green-500/40" : ""}`}
      style={{ width: data.metadata?.width as number || 260, height: data.metadata?.height as number || 220 }}
    >
      <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider m-3 ${colors.badge}`}>
        {icon}
        {osLabel}
      </div>
    </div>
  );
}
