"use client";

import React from "react";
import { StackPanel } from "./StackPanel";
import { HeapPanel } from "./HeapPanel";
import { ReferenceArrows } from "./ReferenceArrows";

export const MemoryCanvas: React.FC = () => {
  return (
    <div className="h-full w-full flex bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-zinc-900 via-zinc-950 to-black rounded-2xl overflow-hidden border border-border/50 relative shadow-2xl">
      {/* Background grid pattern */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]"></div>
      
      {/* Foreground content layer */}
      <div className="absolute inset-0 flex flex-row z-10">
        <StackPanel />
        <HeapPanel />
      </div>
      
      {/* SVG Arrows layer (highest z-index) */}
      <ReferenceArrows />
    </div>
  );
};
