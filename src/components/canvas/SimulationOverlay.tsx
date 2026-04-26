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
        // default pixi canvas is black. We set backgroundAlpha to 0 to make it transparent
        backgroundAlpha: 0,  // Transparent — only React Flow SVG is visible beneath
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
        const syncedStage = new Container(); // when react flow moves, the pixi container should move as well.
        const packetsContainer = new Container(); // a dedicated layer for all the packets
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
          // pointer events none makes the pixi canvas transparent to mouse events
          pointerEvents: "none", // so that react flow events are not blocked
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