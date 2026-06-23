"use client";

import { useCallback } from "react";
import { useSimulationStore } from "@/lib/store/useSimulationStore";
import { useCanvasStore } from "@/lib/store/useCanvasStore";

/**
 * Provides a clean public API for UI controls (toolbar buttons, sliders)
 * to interact with the simulation without importing store internals.
 */
export function useSimulation() {
  const { isRunning, config, stats, start, stop, reset, setConfig, setRoutingStrategy } =
    useSimulationStore();

  const nodes = useCanvasStore((s) => s.nodes);
  const edges = useCanvasStore((s) => s.edges);

  /** Auto-set all nodes as traffic sources and start */
  const startAll = useCallback(() => {
    if (edges.length === 0) {
      return { success: false, error: "Connect nodes with edges to simulate traffic." };
    }
    
    const clients = nodes.filter((n) => n.data.kind === "client");
    let sources = clients;
    if (sources.length === 0) {
      sources = nodes.filter((n) => !edges.some((e) => e.target === n.id));
    }
    const sourceNodeIds = sources.map((n) => n.id);
    setConfig({ sourceNodeIds });
    start();
    return { success: true };
  }, [nodes, edges, setConfig, start]);

  /** Start traffic from specific source nodes */
  const startFrom = useCallback(
    (sourceNodeIds: string[]) => {
      setConfig({ sourceNodeIds });
      start();
    },
    [setConfig, start]
  );

  return {
    isRunning,
    config,
    stats,
    start,
    stop,
    reset,
    startAll,
    startFrom,
    setConfig,
    setRoutingStrategy,
  } as const;
}