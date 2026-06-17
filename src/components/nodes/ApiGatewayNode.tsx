"use client";

import { memo, useCallback } from "react";
import { Handle, Position, type NodeProps } from "@xyflow/react";
import { useCanvasStore } from "@/lib/store/useCanvasStore";
import { commandInvoker } from "@/lib/store/useHistoryStore";
import { UpdateNodeDataCommand } from "@/lib/patterns/commands/UpdateNodeDataCommand";
import type { SystemNode, SystemNodeData, MiddlewareStep } from "@/types";
import { cn } from "@/lib/utils";
import { ApiGatewayIcon } from "./icons/CloudIcons";

// ─── Middleware type metadata ─────────────────────────────────────────

const STEP_CONFIG: Record<
  MiddlewareStep["type"],
  { label: string; color: string; bgColor: string }
> = {
  rateLimit:      { label: "Rate limit",      color: "#ED7100", bgColor: "#ED710015" },
  auth:           { label: "Auth",            color: "#7F77DD", bgColor: "#7F77DD15" },
  transform:      { label: "Transform",       color: "#1D9E75", bgColor: "#1D9E7515" },
  logging:        { label: "Logging",         color: "#888780", bgColor: "#88878015" },
  circuitBreaker: { label: "Circuit breaker", color: "#D85A30", bgColor: "#D85A3015" },
  cors:           { label: "CORS",            color: "#378ADD", bgColor: "#378ADD15" },
};

// ─── Helpers ──────────────────────────────────────────────────────────

function parseChain(metadata: SystemNodeData["metadata"]): MiddlewareStep[] {
  const raw = metadata.middlewareChain;
  if (!raw || typeof raw !== "string") return [];
  try { return JSON.parse(raw) as MiddlewareStep[]; }
  catch { return []; }
}

function serializeChain(steps: MiddlewareStep[]): string {
  return JSON.stringify(steps);
}

// ─── Main component ───────────────────────────────────────────────────

export const ApiGatewayNode = memo(function ApiGatewayNode({
  data, selected, id,
}: NodeProps<SystemNode>) {
  const chain = parseChain(data.metadata);

  const toggleStep = useCallback(
    (stepId: string) => {
      const updated = chain.map((s) =>
        s.id === stepId ? { ...s, enabled: !s.enabled } : s
      );
      commandInvoker.execute(
        new UpdateNodeDataCommand(id, { metadata: { ...data.metadata } }, {
          metadata: {
            ...data.metadata,
            middlewareChain: serializeChain(updated),
          },
        })
      );
    },
    [id, chain, data.metadata]
  );

  const addStep = useCallback(
    (type: MiddlewareStep["type"]) => {
      const cfg = STEP_CONFIG[type];
      const newStep: MiddlewareStep = {
        id:      `step-${Date.now()}`,
        type,
        enabled: true,
        label:   cfg.label,
        config:  {},
      };
      commandInvoker.execute(
        new UpdateNodeDataCommand(id, { metadata: { ...data.metadata } }, {
          metadata: {
            ...data.metadata,
            middlewareChain: serializeChain([...chain, newStep]),
          },
        })
      );
    },
    [id, chain, data.metadata]
  );

  const removeStep = useCallback(
    (stepId: string) => {
      const updated = chain.filter((s) => s.id !== stepId);
      commandInvoker.execute(
        new UpdateNodeDataCommand(id, { metadata: { ...data.metadata } }, {
          metadata: {
            ...data.metadata,
            middlewareChain: serializeChain(updated),
          },
        })
      );
    },
    [id, chain, data.metadata]
  );

  return (
    <div
      className={cn(
        "relative flex flex-col gap-2 rounded-xl border bg-background px-4 py-3",
        "min-w-[280px] max-w-[400px]",
        selected
          ? "border-violet-500 ring-1 ring-violet-500/20"
          : "border-violet-300/50 hover:border-violet-400"
      )}
    >
      {/* Load bar */}
      <div className="absolute top-0 left-0 right-0 h-0.5 rounded-t-xl overflow-hidden bg-muted">
        <div
          className="h-full transition-all duration-500 bg-violet-500"
          style={{ width: `${Math.min(data.load * 100, 100)}%` }}
        />
      </div>

      {/* Header */}
      <div className="flex items-center gap-2">
        <ApiGatewayIcon size={16} />
        <span className="text-sm font-medium text-foreground flex-1 truncate">
          {data.label}
        </span>
        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-violet-500/15 text-violet-700 dark:text-violet-300">
          {(data.metadata.type as string) ?? "REST"}
        </span>
      </div>

      {/* Middleware chain */}
      {chain.length > 0 ? (
        <div className="flex flex-col gap-1">
          <p className="text-[9px] font-medium text-muted-foreground uppercase tracking-wider px-0.5">
            Middleware chain
          </p>
          <div className="flex flex-wrap gap-1.5">
            {chain.map((step, i) => {
              const cfg = STEP_CONFIG[step.type];
              return (
                <div key={step.id} className="flex items-center gap-0.5">
                  {/* Connector dot (not on first) */}
                  {i > 0 && (
                    <svg width="12" height="8" viewBox="0 0 12 8" className="text-muted-foreground/40 shrink-0">
                      <path d="M0 4h8M6 1l3 3-3 3" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  )}
                  {/* Step pill */}
                  <button
                    onClick={() => toggleStep(step.id)}
                    title={step.enabled ? "Click to disable" : "Click to enable"}
                    className={cn(
                      "group/step relative flex items-center gap-1 px-2 py-1 rounded-lg",
                      "text-[10px] font-medium transition-all border",
                      step.enabled ? "opacity-100" : "opacity-40"
                    )}
                    style={{
                      background:   cfg.bgColor,
                      borderColor:  cfg.color + "40",
                      color:        cfg.color,
                    }}
                  >
                    <span>{step.label}</span>
                    {/* Remove button — appears on hover */}
                    <span
                      role="button"
                      onClick={(e) => { e.stopPropagation(); removeStep(step.id); }}
                      className="hidden group-hover/step:inline-block ml-0.5 opacity-60 hover:opacity-100 cursor-pointer"
                    >
                      ×
                    </span>
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <p className="text-[10px] text-muted-foreground italic">
          No middleware — add steps below
        </p>
      )}

      {/* Add step buttons */}
      <div className="flex flex-wrap gap-1 border-t border-border pt-2">
        {(Object.keys(STEP_CONFIG) as MiddlewareStep["type"][]).map((type) => {
          const alreadyAdded = chain.some((s) => s.type === type);
          if (alreadyAdded) return null;
          const cfg = STEP_CONFIG[type];
          return (
            <button
              key={type}
              onClick={() => addStep(type)}
              className="text-[9px] px-1.5 py-0.5 rounded border border-dashed
                         text-muted-foreground hover:text-foreground
                         hover:border-solid transition-colors"
              style={{ borderColor: cfg.color + "50" }}
              title={`Add ${cfg.label}`}
            >
              + {cfg.label}
            </button>
          );
        })}
      </div>

      <Handle type="target" position={Position.Left}  className="!w-2.5 !h-2.5 !border-violet-400 !bg-background" />
      <Handle type="source" position={Position.Right} className="!w-2.5 !h-2.5 !border-violet-400 !bg-background" />
      <Handle type="source" position={Position.Bottom} id="downstream" className="!w-2.5 !h-2.5 !border-violet-400 !bg-background" />
    </div>
  );
});
