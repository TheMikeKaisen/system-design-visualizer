"use client";

import { useEffect, useRef, useCallback } from "react";
import { useCanvasStore } from "@/lib/store/useCanvasStore";
import { useDiagramStore } from "@/lib/store/useDiagramStore";

const DEBOUNCE_MS = 2000;

/**
 * Mounts once in the canvas page. Watches nodes and edges in Zustand
 * (via subscribeWithSelector — no re-render) and triggers a debounced
 * auto-save to localStorage whenever the diagram changes.
 *
 * Design rule: auto-save is a side-effect, never a render trigger.
 */
export function useAutoSave() {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const scheduleSave = useCallback(() => {
    useDiagramStore.getState().markDirty();

    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      const success = useDiagramStore.getState().save();
      if (!success) {
        window.alert("Failed to auto-save diagram. Local storage might be full. Please free some space to avoid losing your work.");
      }
    }, DEBOUNCE_MS);
  }, []);

  useEffect(() => {
    const handleBeforeUnload = () => {
      if (useDiagramStore.getState().isDirty) {
        const success = useDiagramStore.getState().save();
        if (!success) {
          window.alert("Failed to save diagram before leaving. Local storage might be full.");
        }
      }
    };
    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, []);

  useEffect(() => {
    // Subscribe imperatively — avoids triggering React re-renders
    const unsubNodes = useCanvasStore.subscribe(
      (s) => s.nodes,
      scheduleSave
    );
    const unsubEdges = useCanvasStore.subscribe(
      (s) => s.edges,
      scheduleSave
    );

    return () => {
      unsubNodes();
      unsubEdges();
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [scheduleSave]);
}
