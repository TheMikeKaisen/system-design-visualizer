// components/canvas/SimulationOverlay.tsx
// Owns the Pixi Application lifecycle and composes the bridge.

"use client";

import React, { useEffect, useRef, useState } from "react";
import { Application, Container } from "pixi.js";
import { PixiBridge } from "./PixiBridge";
import { PacketManager } from "@/components/packets/PacketManager";

export function SimulationOverlay() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const appRef = useRef<Application | null>(null);
  const [packetStage, setPacketStage] = useState<Container | null>(null);

  useEffect(() => {
    if (!canvasRef.current || appRef.current) return;

    const app = new Application();

    app
      .init({
        canvas: canvasRef.current,
        backgroundAlpha: 0,       // Transparent — React Flow SVG is visible beneath
        antialias: true,
        autoDensity: true,
        resolution: window.devicePixelRatio || 1,
        resizeTo: canvasRef.current.parentElement ?? window,
      })
      .then(() => {
        appRef.current = app;

        // Container hierarchy:
        // app.stage
        //   └── syncedStage   ← transform synced with RF viewport
        //         └── packetsContainer  ← all packet sprites live here
        //   └── hudStage      ← fixed-position UI (tooltips, counters)
        const syncedStage = new Container();
        const packetsContainer = new Container();
        syncedStage.addChild(packetsContainer);
        app.stage.addChild(syncedStage);

        setPacketStage(syncedStage);
      });

    return () => {
      appRef.current?.destroy(false);
      appRef.current = null;
    };
  }, []);

  return (
    <>
      {/* Canvas sits in absolute position over React Flow, pointer-events none
          so React Flow still receives drag/click events */}
      <canvas
        ref={canvasRef}
        style={{
          position: "absolute",
          inset: 0,
          pointerEvents: "none",
          zIndex: 10,
        }}
      />

      {/* Bridge only mounts once Pixi is ready */}
      {packetStage && appRef.current && (
        <>
          <PixiBridge app={appRef.current} packetStage={packetStage} />
          <PacketManager app={appRef.current} packetStage={packetStage} />
        </>
      )}
    </>
  );
}