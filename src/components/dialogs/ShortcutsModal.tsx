"use client";

import { useEffect, useState } from "react";

const SHORTCUTS = [
  { label: "Undo", keys: ["Cmd", "Z"] },
  { label: "Redo", keys: ["Cmd", "Shift", "Z"] },
  { label: "Delete selection", keys: ["Backspace", "or", "Del"] },
  { label: "Cancel / Clear selection", keys: ["Esc"] },
  { label: "Show shortcuts", keys: ["Cmd", "/"] },
];

interface ShortcutsModalProps {
  onClose: () => void;
}

export function ShortcutsModal({ onClose }: ShortcutsModalProps) {
  // Prevent propagation to canvas when clicking inside
  return (
    <div
      className="absolute inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-[400px] flex flex-col rounded-xl border border-border bg-background shadow-lg overflow-hidden"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-label="Keyboard Shortcuts"
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <h2 className="text-sm font-medium text-foreground">Keyboard Shortcuts</h2>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Close"
          >
            <CloseIcon />
          </button>
        </div>

        <div className="p-5">
          <ul className="space-y-4">
            {SHORTCUTS.map((sc, i) => (
              <li key={i} className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">{sc.label}</span>
                <div className="flex items-center gap-1.5">
                  {sc.keys.map((k, j) => (
                    <span
                      key={j}
                      className={`text-xs font-medium px-1.5 py-0.5 rounded ${
                        k === "or"
                          ? "text-muted-foreground"
                          : "bg-muted border border-border text-foreground shadow-sm"
                      }`}
                    >
                      {k}
                    </span>
                  ))}
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

function CloseIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round">
      <path d="M4 4l8 8M12 4l-8 8" />
    </svg>
  );
}
