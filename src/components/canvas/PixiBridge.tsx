"use client";

import React, { useEffect, useRef } from "react";
import { useOnViewportChange } from "@xyflow/react";
import { Application, Container } from "pixi.js";
import { useCanvasStore, selectViewport } from "@/lib/store/useCanvasStore";
import type { ViewportTransform } from "@/types";

// ─────────────────────────────────────────────
// Pure Math — no React dependencies
// ─────────────────────────────────────────────

/**
 * Converts a React Flow world-space point to a Pixi screen-space point.
 *
 * React Flow applies: screenPoint = worldPoint * zoom + panOffset
 * We replicate this on the Pixi stage container transform.
 */
export function worldToPixi(
  worldX: number,
  worldY: number,
  vp: ViewportTransform
): { x: number; y: number } {
  return {
    x: worldX * vp.zoom + vp.x,
    y: worldY * vp.zoom + vp.y,
  };
}

// Inverse: convert a Pixi screen point back to React Flow world space 
export function pixiToWorld(
  screenX: number,
  screenY: number,
  vp: ViewportTransform
): { x: number; y: number } {
  return {
    x: (screenX - vp.x) / vp.zoom,
    y: (screenY - vp.y) / vp.zoom,
  };
}

// ─────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────

interface PixiBridgeProps {
  /**
   * The Pixi Application instance created by the parent SimulationOverlay.
   * We receive it as a prop so the bridge is a pure synchronization layer
   * with no ownership over the Pixi lifecycle.
   */
  app: Application;
  /**
   * The specific Pixi Container that hosts all packet sprites.
   * Only THIS container's transform is synced — UI elements like
   * HUD overlays live in a separate, non-synced container.
   */
  packetStage: Container;
}

export function PixiBridge({ app, packetStage }: PixiBridgeProps) {
  const setViewport = useCanvasStore((s) => s.setViewport);
  const viewportRef = useRef<ViewportTransform>({ x: 0, y: 0, zoom: 1 });

  /**
   * STRATEGY: We use React Flow's `useOnViewportChange` hook to receive
   * viewport updates. On each change, we do TWO things:
   *   1. Commit the new viewport to Zustand (for components that need it reactively)
   *   2. Apply the transform to Pixi's stage container SYNCHRONOUSLY
   *      (no re-render cycle — this keeps packets locked to edges at 60fps)
   */
  useOnViewportChange({
    onChange: (vp) => {
      const transform: ViewportTransform = {
        x: vp.x,
        y: vp.y,
        zoom: vp.zoom,
      };

      // Imperative Pixi update (synchronous, no React overhead)
      viewportRef.current = transform;
      applyTransformToStage(packetStage, transform);

      // Reactive Zustand update (for components that subscribe)
      setViewport(transform);
    },
  });

  /**
   * Subscribe to Zustand viewport changes that originate OUTSIDE React Flow
   * (e.g., "fit view" button, programmatic pan). This closes the loop.
   */
  useEffect(() => {
    const unsubscribe = useCanvasStore.subscribe(
      selectViewport,
      (vp) => {
        applyTransformToStage(packetStage, vp);
        viewportRef.current = vp;
      },
      { fireImmediately: false }
    );
    return unsubscribe;
  }, [packetStage]);

  // This component renders nothing — it is a pure synchronization side-effect.
  return null;
}

// ─────────────────────────────────────────────
// Internal helpers
// ─────────────────────────────────────────────

function applyTransformToStage(
  stage: Container,
  vp: ViewportTransform
): void {
  stage.x = vp.x;
  stage.y = vp.y;
  stage.scale.set(vp.zoom);
}