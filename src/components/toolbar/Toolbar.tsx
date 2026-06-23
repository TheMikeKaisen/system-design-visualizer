"use client";

import { UserMenu } from "@/components/auth/UserMenu";
import { UndoRedoControls }   from "./UndoRedoControls";
import { SimulationControls } from "./SimulationControls";
import { DiagramControls }    from "./DiagramControls";
import { DiagramNameInput }   from "./DiagramNameInput";
import { ExportControls }     from "./ExportControls";
import { ThemeToggle } from "@/components/ThemeToggle";

interface ToolbarProps {
  user?: {
    id?: string;
    name?: string | null;
    email?: string | null;
    image?: string | null;
  };
}

export function Toolbar({ user }: ToolbarProps) {
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
      <ThemeToggle />
      <div className="w-px h-4 bg-border" />
      <ExportControls />
      <div id="collab-hud-portal" className="flex items-center gap-2" />
      {user ? (
        <>
          <div className="w-px h-4 bg-border" />
          <UserMenu user={user} />
        </>
      ) : (
        <>
          <div className="w-px h-4 bg-border" />
          <SignInButton />
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

function SignInButton() {
  return (
    <a
      href="/auth/sign-in"
      className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium
                 bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
      title="Sign in for collaboration and saving diagrams on cloud."
    >
      <SignInIcon />
      Sign in
    </a>
  );
}

function SignInIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 14 14" fill="none"
         stroke="currentColor" strokeWidth={1.5} strokeLinecap="round">
      <path d="M5 2H3a1 1 0 0 0-1 1v8a1 1 0 0 0 1 1h2M9 4l3 3-3 3M12 7H6"/>
    </svg>
  );
}