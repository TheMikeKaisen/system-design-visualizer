"use client";

import { UserMenu } from "@/components/auth/UserMenu";
import { UndoRedoControls }   from "./UndoRedoControls";
import { SimulationControls } from "./SimulationControls";
import { DiagramControls }    from "./DiagramControls";
import { DiagramNameInput }   from "./DiagramNameInput";
import { ExportControls }     from "./ExportControls";
import { ThemeToggle } from "@/components/ThemeToggle";
import { ShortcutsModal } from "@/components/dialogs/ShortcutsModal";
import { Logo } from "@/components/ui/Logo";
import Link from "next/link";
import { useState, useEffect } from "react";

interface ToolbarProps {
  user?: {
    id?: string;
    name?: string | null;
    email?: string | null;
    image?: string | null;
  };
}

export function Toolbar({ user }: ToolbarProps) {
  const [isShortcutsOpen, setIsShortcutsOpen] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Cmd+/ or ?
      if ((e.metaKey && e.key === "/") || e.key === "?") {
        if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
          return; // don't trigger if typing in an input
        }
        e.preventDefault();
        setIsShortcutsOpen(true);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <header className="flex items-center gap-2 px-4 h-13 border-b border-border bg-background shrink-0 z-20">
      <Link href="/" title="Home" className="flex items-center hover:opacity-80 transition-opacity">
        <Logo size={20} />
      </Link>
      <div className="w-px h-4 bg-border" />
      <DiagramControls />
      <div className="w-px h-4 bg-border" />
      <DiagramNameInput />
      <div className="w-px h-4 bg-border" />
      <UndoRedoControls />
      <div className="w-px h-4 bg-border" />
      <SimulationControls />
      <div className="flex-1" />
      <button
        onClick={() => setIsShortcutsOpen(true)}
        className="shrink-0 w-8 h-8 flex items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
        title="Keyboard Shortcuts (Cmd+/)"
        aria-label="Keyboard Shortcuts"
      >
        <HelpIcon />
      </button>
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
      {isShortcutsOpen && (
        <ShortcutsModal onClose={() => setIsShortcutsOpen(false)} />
      )}
    </header>
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

function HelpIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round">
      <circle cx="8" cy="8" r="6"/>
      <path d="M6 6c0-1.5 4-1.5 4 0 0 1-2 1.5-2 2.5 M8 11.5v.5"/>
    </svg>
  );
}