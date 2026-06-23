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
  source, target,
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

  // Check throughput for heatmap flow mode
  const metricKey = `${source}-${target}`;
  const edgeMetrics = useSimulationStore((s) => s.edgeMetrics[metricKey]);
  const throughput = edgeMetrics?.throughputPerSec ?? 0;
  const isHighTraffic = throughput > 100;

  // Check if any packet is currently travelling this edge (only relevant for low traffic)
  const packets = useSimulationStore((s) => s.packets);
  const hasActiveTraffic = useMemo(() =>
    !isHighTraffic && Object.values(packets).some(
      (p) =>
        p.status === "traveling" &&
        p.sourceId === source &&
        p.targetId === target
    ),
    [packets, source, target, isHighTraffic]
  );

  let edgeColor = PROTOCOL_COLORS[protocol] ?? "#888";
  let edgeGlowColor = edgeColor;
  let strokeWidth = selected ? 2.5 : 1.5;

  if (isHighTraffic) {
    edgeColor = throughput > 500 ? "#ef4444" : "#eab308"; // Red or Yellow
    edgeGlowColor = edgeColor;
    strokeWidth = selected ? 4 : 3;
  }

  const opacity = errorRate > 0.3 ? 0.6 : 1;

  return (
    <>
      {/* High traffic glow */}
      {isHighTraffic && (
        <>
          <path
            d={edgePath}
            fill="none"
            stroke={edgeGlowColor}
            strokeWidth={16}
            opacity={0.15}
            className="pointer-events-none animate-pulse"
          />
          <path
            d={edgePath}
            fill="none"
            stroke={edgeGlowColor}
            strokeWidth={8}
            opacity={0.3}
            className="pointer-events-none"
          />
        </>
      )}

      {/* Normal Active traffic glow — rendered behind the edge */}
      {hasActiveTraffic && !isHighTraffic && (
        <path
          d={edgePath}
          fill="none"
          stroke={edgeGlowColor}
          strokeWidth={8}
          opacity={0.08}
          className="pointer-events-none"
        />
      )}

      <BaseEdge
        path={edgePath}
        markerEnd={markerEnd}
        style={{
          stroke: selected ? edgeColor : (isHighTraffic ? edgeColor : `${edgeColor}cc`),
          strokeWidth,
          opacity,
          strokeDasharray: errorRate > 0.1 ? "6 3" : undefined,
          filter: isHighTraffic ? `drop-shadow(0 0 4px ${edgeColor})` : undefined,
        }}
      />

      {/* Edge label — protocol + latency + throughput badge */}
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
            className={`flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px]
                       font-medium border bg-background/90 backdrop-blur-sm
                       cursor-pointer hover:scale-105 transition-transform
                       ${isHighTraffic ? "shadow-sm" : ""}`}
            style={{ 
              borderColor: isHighTraffic ? edgeColor : `${edgeColor}44`, 
              color: isHighTraffic ? edgeColor : color,
              boxShadow: isHighTraffic ? `0 0 8px ${edgeColor}40` : "none"
            }}
          >
            {isHighTraffic ? (
              <span className="font-bold">🔥 {throughput} req/s</span>
            ) : (
              <span>{protocol}</span>
            )}
            
            {latencyMs > 0 && !isHighTraffic && (
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