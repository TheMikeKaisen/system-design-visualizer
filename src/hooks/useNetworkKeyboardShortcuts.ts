"use client";

import { useEffect, useCallback } from "react";

export interface UseNetworkKeyboardShortcutsOptions {
  onPlayPause?: () => void;
  onNext?: () => void;
  onPrev?: () => void;
  onReset?: () => void;
  canNext?: boolean;
  canPrev?: boolean;
  isEnabled?: boolean;
}

/**
 * Global keyboard shortcuts hook for Network simulators.
 * Supports:
 * - Space: Toggle Play / Pause
 * - ArrowRight: Step Forward (if canNext is true)
 * - ArrowLeft: Step Backward (if canPrev is true)
 * - KeyR / 'r' / 'R': Reset Simulation
 *
 * Automatically suppresses shortcuts when user focuses an editable element.
 */
export function useNetworkKeyboardShortcuts({
  onPlayPause,
  onNext,
  onPrev,
  onReset,
  canNext = true,
  canPrev = true,
  isEnabled = true,
}: UseNetworkKeyboardShortcutsOptions) {
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (!isEnabled) return;

      // Ignore when user is actively typing in form inputs, textareas, or contentEditable nodes
      const target = e.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.tagName === "SELECT" ||
          target.isContentEditable)
      ) {
        return;
      }

      if (e.code === "Space") {
        e.preventDefault();
        onPlayPause?.();
      } else if (e.code === "ArrowRight") {
        e.preventDefault();
        if (canNext) {
          onNext?.();
        }
      } else if (e.code === "ArrowLeft") {
        e.preventDefault();
        if (canPrev) {
          onPrev?.();
        }
      } else if (e.code === "KeyR" || e.key === "r" || e.key === "R") {
        e.preventDefault();
        onReset?.();
      }
    },
    [canNext, canPrev, isEnabled, onNext, onPlayPause, onPrev, onReset]
  );

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [handleKeyDown]);
}
