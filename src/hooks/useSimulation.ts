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

  /** Auto-set all nodes as traffic sources and start */
  const startAll = useCallback(() => {
    const allNodeIds = nodes.map((n) => n.id);
    setConfig({ sourceNodeIds: allNodeIds });
    start();
  }, [nodes, setConfig, start]);

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