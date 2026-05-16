"use client";

import { UndoRedoControls } from "./UndoRedoControls";
import { SimulationControls } from "./SimulationControls";

export function Toolbar() {
  return (
    <header className="flex items-center gap-3 px-4 h-13 border-b border-border bg-background shrink-0 z-20">
      {/* Logo / Brand */}
      <div className="flex items-center gap-2 mr-2">
        <LogoIcon />
        <span className="text-sm font-medium text-foreground tracking-tight">
          sysvis
        </span>
      </div>

      <div className="w-px h-4 bg-border" />

      <UndoRedoControls />

      <div className="w-px h-4 bg-border" />

      <SimulationControls />

      {/* Spacer */}
      <div className="flex-1" />

      {/* Collab stub — Phase 5 will render peer avatars here */}
      <div
        id="collab-hud-portal"
        className="flex items-center gap-2"
        aria-label="Collaboration status"
      />
    </header>
  );
}

function LogoIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
      <rect x="1" y="1" width="8" height="8" rx="2" fill="currentColor" opacity={0.8} />
      <rect x="11" y="1" width="8" height="8" rx="2" fill="currentColor" opacity={0.4} />
      <rect x="1" y="11" width="8" height="8" rx="2" fill="currentColor" opacity={0.4} />
      <rect x="11" y="11" width="8" height="8" rx="2" fill="currentColor" opacity={0.8} />
    </svg>
  );
}