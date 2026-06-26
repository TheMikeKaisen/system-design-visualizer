"use client";

import { useEffect, useRef } from "react";
import type { Application, Container } from "pixi.js";
import { Ticker } from "pixi.js";
import { PacketSprite } from "./PacketSprite";
import { SimulationEngine } from "@/lib/simulation/SimulationEngine";
import { useSimulationStore } from "@/lib/store/useSimulationStore";
import { useCanvasStore } from "@/lib/store/useCanvasStore";
import { interpolatePath } from "@/lib/simulation/coordinateBridge";
import type { PathMetrics } from "@/lib/simulation/coordinateBridge";
import type { Packet } from "@/types";

interface PacketManagerProps {
  app: Application;
  packetStage: Container;
}

export function PacketManager({ app, packetStage }: PacketManagerProps) {
  const engineRef = useRef<SimulationEngine | null>(null);
  const spritesRef = useRef<Map<string, PacketSprite>>(new Map());

  /**
   * PathMetrics live HERE — not in Zustand, not in the engine.
   * Keyed by packetId. Populated via onPathReady, cleaned up with prune.
   */
  const pathMetricsRef = useRef<Map<string, PathMetrics>>(new Map());
  const lastSyncTimeRef = useRef<number>(0);

  // ── Bootstrap ─────────────────────────────────────────

  useEffect(() => {
    const config = useSimulationStore.getState().config;

    const worker = new Worker(
      new URL("../../lib/workers/pathCalculator.worker.ts", import.meta.url)
    );

    engineRef.current = new SimulationEngine(
      config.routingStrategy,
      // onPathReady: engine calls this when a worker response arrives
      (packetId, metrics) => {
        pathMetricsRef.current.set(packetId, metrics);
      },
      worker
    );

    return () => {
      engineRef.current?.destroy();
      engineRef.current = null;
      pathMetricsRef.current.clear();
    };
  }, []);

  // ── Hot-swap strategy ──────────────────────────────────

  useEffect(() => {
    return useSimulationStore.subscribe(
      (s) => s.config.routingStrategy,
      (strategy) => engineRef.current?.setStrategy(strategy)
    );
  }, []);

  // ── Cache Invalidations ─────────────────────────────────

  useEffect(() => {
    return useSimulationStore.subscribe(
      (s) => s.isRunning,
      (isRunning) => {
        if (isRunning) {
          engineRef.current?.clearCaches();
        }
      }
    );
  }, []);

  // ── Prune metrics in sync with store prune ─────────────

  useEffect(() => {
    const interval = setInterval(() => {
      const liveIds = new Set(
        Object.keys(useSimulationStore.getState().packets)
      );
      for (const id of pathMetricsRef.current.keys()) {
        if (!liveIds.has(id)) pathMetricsRef.current.delete(id);
      }
      useSimulationStore.getState().pruneFinishedPackets();
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // ── Pixi Ticker ────────────────────────────────────────

  useEffect(() => {
    const ticker = new Ticker();
    ticker.maxFPS = 60;

    ticker.add(() => {
      const engine = engineRef.current;
      if (!engine) return;

      const simState = useSimulationStore.getState();
      const canvasState = useCanvasStore.getState();
      let config = simState.config;
      if (!simState.isRunning) {
        if (Object.keys(simState.packets).length === 0) {
          // Fully drained. Sync sprites to clear deleted packets, then sleep.
          syncSprites(
            simState.packets,
            pathMetricsRef.current,
            packetStage,
            spritesRef.current
          );
          // Ensure all nodes have 0 active connections and load
          for (const node of canvasState.nodes) {
            if (node.data.activeConnections !== 0 || node.data.load !== 0) {
              canvasState.updateNodeData(node.id, { activeConnections: 0, load: 0 });
            }
          }
          // Reset node processing states
          engine.resetNodeStates();
          // Clear nodeMetrics
          if (Object.keys(simState.nodeMetrics).length > 0) {
            simState.setNodeMetrics({});
          }
          return;
        }
        // Draining mode: continue ticking existing packets but spawn no new ones
        config = { ...config, packetsPerSecond: 0 };
      }

      // 1. Drain any packets that arrived since the last tick
      const newPackets = engine.drainNewPackets();

      // 2. Run the pure tick — receive a diff
      const diff = engine.tick(
        ticker.deltaMS,
        simState.packets,
        pathMetricsRef.current,
        canvasState.nodes,
        canvasState.edges,
        config
      );

      // 3. Apply the diff to the store in a single batch
      simState.applySimulationDiff({
        newPackets,
        progressUpdates: diff.progressUpdates,
        arrivedIds: diff.arrivedIds,
        droppedIds: diff.droppedIds,
        queuedIds: diff.queuedIds,
        processingIds: diff.processingIds,
      });

      // 4 & 5. Throttle UI metric pushes to 1 time a second (1000ms)
      const now = performance.now();
      if (now - lastSyncTimeRef.current > 1000) {
        lastSyncTimeRef.current = now;

        if (diff.nodeMetrics.size > 0) {
          const metricsObj: Record<string, import("@/types").NodeMetrics> = {};
          for (const [nodeId, m] of diff.nodeMetrics) {
            metricsObj[nodeId] = m;
          }
          simState.setNodeMetrics(metricsObj);
        }

        if (diff.edgeMetrics.size > 0) {
          const edgeMetricsObj: Record<string, { throughputPerSec: number }> = {};
          for (const [edgeId, m] of diff.edgeMetrics) {
            edgeMetricsObj[edgeId] = m;
          }
          simState.setEdgeMetrics(edgeMetricsObj);
        }

        // Sync node active connections + load from CPU utilization
        const targetCounts = new Map<string, number>();
        for (const p in simState.packets) {
          const packet = simState.packets[p];
          if (packet.status === "traveling" || packet.status === "queued" || packet.status === "processing") {
            targetCounts.set(packet.targetId, (targetCounts.get(packet.targetId) || 0) + 1);
          }
        }
        for (const node of canvasState.nodes) {
          const count = targetCounts.get(node.id) || 0;
          const metrics = diff.nodeMetrics.get(node.id);
          const newLoad = metrics ? metrics.cpuUtilization : 0;
          if (node.data.activeConnections !== count || Math.abs(node.data.load - newLoad) > 0.01) {
            canvasState.updateNodeData(node.id, { activeConnections: count, load: newLoad });
          }
        }
      }

      // 6. Sync Pixi sprites
      syncSprites(
        simState.packets,
        pathMetricsRef.current,
        packetStage,
        spritesRef.current
      );
    });

    ticker.start();
    return () => { ticker.stop(); ticker.destroy(); };
  }, [packetStage]);

  return null;
}

// ─────────────────────────────────────────────
// Sprite reconciliation
// ─────────────────────────────────────────────

function syncSprites(
  packets: Record<string, Packet>,
  metrics: Map<string, PathMetrics>,
  stage: Container,
  sprites: Map<string, PacketSprite>
): void {
  const liveIds = new Set(
    Object.entries(packets)
      .filter(([, p]) => p.status === "traveling")
      .map(([id]) => id)
  );

  // Create sprites for new packets
  for (const id of liveIds) {
    if (!sprites.has(id)) {
      const sprite = new PacketSprite(packets[id]);
      stage.addChild(sprite.container);
      sprites.set(id, sprite);
    }
  }

  // Update or destroy
  for (const [id, sprite] of sprites) {
    if (!liveIds.has(id)) {
      sprite.destroy();
      sprites.delete(id);
      continue;
    }

    const packet = packets[id];
    const m = metrics.get(id);
    if (!m) continue;

    const prevProgress = Math.max(0, packet.progress - 0.015);
    const curr = interpolatePath(m, packet.progress);
    const prev = interpolatePath(m, prevProgress);

    sprite.update(curr.x, curr.y, prev.x, prev.y, 1, packet.isHidden);
  }
}