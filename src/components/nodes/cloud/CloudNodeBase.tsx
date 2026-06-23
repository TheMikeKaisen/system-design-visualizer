"use client";

import { memo, type ReactNode } from "react";
import { Handle, Position } from "@xyflow/react";
import type { SystemNodeData, CloudProvider } from "@/types";
import { cn } from "@/lib/utils";

// ─── Provider badge colors (hardcoded — brand colors must not invert) ──

const PROVIDER_CONFIG: Record<
  CloudProvider,
  { badge: string; border: string; borderSelected: string; ring: string }
> = {
  aws:     { badge: "bg-[#FF9900] text-white",       border: "border-[#FF9900]/30", borderSelected: "border-[#FF9900]", ring: "ring-[#FF9900]/20" },
  gcp:     { badge: "bg-[#4285F4] text-white",       border: "border-[#4285F4]/30", borderSelected: "border-[#4285F4]", ring: "ring-[#4285F4]/20" },
  azure:   { badge: "bg-[#0078D4] text-white",       border: "border-[#0078D4]/30", borderSelected: "border-[#0078D4]", ring: "ring-[#0078D4]/20" },
  general: { badge: "bg-muted text-muted-foreground", border: "border-border",       borderSelected: "border-primary",  ring: "ring-primary/20" },
};

const PROVIDER_LABELS: Record<CloudProvider, string> = {
  aws:     "AWS",
  gcp:     "GCP",
  azure:   "Azure",
  general: "",
};

interface CloudNodeBaseProps {
  data:      SystemNodeData;
  selected:  boolean;
  provider:  CloudProvider;
  icon:      ReactNode;
  /** Second line — service family e.g. "t3.medium" or "aurora-postgres" */
  subtitle?: string;
  /** Load bar color — defaults to provider color */
  loadColor?: string;
  children?: ReactNode;
  /** Extra handles besides the standard left/right pair */
  extraHandles?: ReactNode;
}

export const CloudNodeBase = memo(function CloudNodeBase({
  data, selected, provider, icon, subtitle, loadColor, children, extraHandles,
}: CloudNodeBaseProps) {
  const cfg   = PROVIDER_CONFIG[provider];
  const label = PROVIDER_LABELS[provider];
  const load  = data.load ?? 0;

  const barColor =
    loadColor ??
    (provider === "aws"   ? "#FF9900"
    : provider === "gcp"  ? "#4285F4"
    : provider === "azure"? "#0078D4"
    : undefined);

  return (
    <div
      className={cn(
        "relative flex flex-col gap-1 rounded-xl border bg-background px-4 py-2.5 min-w-[180px]",
        "transition-shadow",
        selected
          ? `${cfg.borderSelected} ring-1 ${cfg.ring} shadow-sm`
          : `${cfg.border} hover:${cfg.borderSelected}`
      )}
    >
      {/* Load bar */}
      <div className="absolute top-0 left-0 right-0 h-0.5 rounded-t-xl overflow-hidden bg-muted">
        <div
          className="h-full transition-all duration-500"
          style={{ width: `${Math.min(load * 100, 100)}%`, background: barColor }}
        />
      </div>

      {/* Header row */}
      <div className="flex items-center gap-2 pt-0.5">
        <span className="shrink-0">{icon}</span>
        <span className="text-sm font-medium text-foreground truncate flex-1">
          {data.label}
        </span>
        {label && (
          <span className={cn("text-[9px] font-bold px-1.5 py-0.5 rounded-full shrink-0", cfg.badge)}>
            {label}
          </span>
        )}
      </div>

      {/* Subtitle */}
      {subtitle && (
        <span className="text-[10px] text-muted-foreground truncate pl-6">
          {subtitle}
        </span>
      )}

      {/* Metric (simulated) */}
      <span className={cn(
        "text-[10px] text-muted-foreground mt-0.5 transition-opacity duration-300",
        data.activeConnections > 0 ? "opacity-100" : "opacity-0"
      )}>
        {data.activeConnections || 0} connections
      </span>

      {/* Slot for custom content (e.g. API Gateway chain) */}
      {children}

      {/* Standard handles */}
      <Handle type="target" position={Position.Left}  className="!w-2.5 !h-2.5 !border !bg-background" style={{ borderColor: barColor ?? undefined }} />
      <Handle type="source" position={Position.Right} className="!w-2.5 !h-2.5 !border !bg-background" style={{ borderColor: barColor ?? undefined }} />
      {extraHandles}
    </div>
  );
});
