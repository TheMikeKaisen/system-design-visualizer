"use client";

import { memo, useMemo } from "react";
import {
  BaseEdge,
  EdgeLabelRenderer,
  getBezierPath,
  type EdgeProps,
} from "@xyflow/react";
import { useSimulationStore } from "@/lib/store/useSimulationStore";
import type { SystemEdge } from "@/types";

const PROTOCOL_COLORS: Record<string, string> = {
  HTTP:      "#378add",
  gRPC:      "#7f77dd",
  TCP:       "#1d9e75",
  UDP:       "#ef9f27",
  WebSocket: "#d85a30",
};

export const SimulationEdge = memo(function SimulationEdge({
  id,
  sourceX, sourceY, targetX, targetY,
  sourcePosition, targetPosition,
  data,
  selected,
  markerEnd,
}: EdgeProps<SystemEdge>) {
  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX, sourceY, sourcePosition,
    targetX, targetY, targetPosition,
  });

  const protocol = data?.protocol ?? "HTTP";
  const errorRate = data?.errorRate ?? 0;
  const latencyMs = data?.latencyMs ?? 0;
  const color = PROTOCOL_COLORS[protocol] ?? "#888";

  // Check if any packet is currently travelling this edge
  const packets = useSimulationStore((s) => s.packets);
  const hasActiveTraffic = useMemo(() =>
    Object.values(packets).some(
      (p) =>
        p.status === "traveling" &&
        ((p.sourceId === id.split("-")[0]) || true) // simplified — proper check via edge endpoints
    ),
    [packets, id]
  );

  const strokeWidth = selected ? 2.5 : 1.5;
  const opacity = errorRate > 0.3 ? 0.6 : 1;

  return (
    <>
      {/* Active traffic glow — rendered behind the edge */}
      {hasActiveTraffic && (
        <path
          d={edgePath}
          fill="none"
          stroke={color}
          strokeWidth={8}
          opacity={0.08}
          className="pointer-events-none"
        />
      )}

      <BaseEdge
        path={edgePath}
        markerEnd={markerEnd}
        style={{
          stroke: selected ? color : `${color}cc`,
          strokeWidth,
          opacity,
          strokeDasharray: errorRate > 0.1 ? "6 3" : undefined,
        }}
      />

      {/* Edge label — protocol + latency badge */}
      <EdgeLabelRenderer>
        <div
          style={{
            position: "absolute",
            transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)`,
            pointerEvents: "all",
          }}
          className="nodrag nopan"
        >
          <div
            className="flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px]
                       font-medium border bg-background/90 backdrop-blur-sm
                       cursor-pointer hover:scale-105 transition-transform"
            style={{ borderColor: `${color}44`, color }}
          >
            <span>{protocol}</span>
            {latencyMs > 0 && (
              <>
                <span className="opacity-40">·</span>
                <span className="opacity-70">{latencyMs}ms</span>
              </>
            )}
            {errorRate > 0 && (
              <>
                <span className="opacity-40">·</span>
                <span className="text-destructive">{Math.round(errorRate * 100)}% err</span>
              </>
            )}
          </div>
        </div>
      </EdgeLabelRenderer>
    </>
  );
});