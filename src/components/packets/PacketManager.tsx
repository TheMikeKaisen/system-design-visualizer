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

  // ── Bootstrap ─────────────────────────────────────────

  useEffect(() => {
    const config = useSimulationStore.getState().config;

    engineRef.current = new SimulationEngine(
      config.routingStrategy,
      // onPathReady: engine calls this when a worker response arrives
      (packetId, metrics) => {
        pathMetricsRef.current.set(packetId, metrics);
      }
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
      if (!simState.isRunning) return;

      // 1. Drain any packets that arrived since the last tick
      const newPackets = engine.drainNewPackets();
      for (const p of newPackets) {
        simState.addPacket(p);
      }

      // 2. Run the pure tick — receive a diff
      const diff = engine.tick(
        ticker.deltaMS,
        simState.packets,
        pathMetricsRef.current,
        canvasState.nodes,
        canvasState.edges,
        simState.config
      );

      // 3. Apply the diff to the store in one batch
      for (const [id, progress] of diff.progressUpdates) {
        simState.updatePacketProgress(id, progress);
      }
      for (const id of diff.arrivedIds) simState.markPacketArrived(id);
      for (const id of diff.droppedIds) simState.markPacketDropped(id);

      // 4. Sync Pixi sprites
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

    sprite.update(curr.x, curr.y, prev.x, prev.y);
  }
}