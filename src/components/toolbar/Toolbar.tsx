"use client";

import { UserMenu } from "@/components/auth/UserMenu";
import { UndoRedoControls }   from "./UndoRedoControls";
import { SimulationControls } from "./SimulationControls";
import { DiagramControls }    from "./DiagramControls";
import { DiagramNameInput }   from "./DiagramNameInput";
import { ExportControls }     from "./ExportControls";

export function Toolbar({ user }: { user?: { name?: string | null; email?: string | null; image?: string | null } }) {
  return (
    <header className="flex items-center gap-2 px-4 h-13 border-b border-border bg-background shrink-0 z-20">
      <LogoIcon />
      <div className="w-px h-4 bg-border" />
      <DiagramControls />
      <div className="w-px h-4 bg-border" />
      <DiagramNameInput />
      <div className="w-px h-4 bg-border" />
      <UndoRedoControls />
      <div className="w-px h-4 bg-border" />
      <SimulationControls />
      <div className="flex-1" />
      <ExportControls />
      <div id="collab-hud-portal" className="flex items-center gap-2" />
      {user && (
        <>
          <div className="w-px h-4 bg-border" />
          <UserMenu user={user} />
        </>
      )}
    </header>
  );
}

function LogoIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" className="shrink-0">
      <rect x="1" y="1" width="8" height="8" rx="2" fill="currentColor" opacity={0.8}/>
      <rect x="11" y="1" width="8" height="8" rx="2" fill="currentColor" opacity={0.4}/>
      <rect x="1" y="11" width="8" height="8" rx="2" fill="currentColor" opacity={0.4}/>
      <rect x="11" y="11" width="8" height="8" rx="2" fill="currentColor" opacity={0.8}/>
    </svg>
  );
}