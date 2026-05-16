"use client";

import { useEffect, useRef } from "react";
import { useReactFlow } from "@xyflow/react";
import { localStoragePersistence } from "@/lib/persistence/localStoragePersistence";
import { useDiagramStore } from "@/lib/store/useDiagramStore";
import { useAutoSave } from "@/hooks/useAutoSave";

interface DiagramLoaderProps {
  diagramId: string;
}

export function DiagramLoader({ diagramId }: DiagramLoaderProps) {
  const { setViewport } = useReactFlow();
  const loadedIdRef = useRef<string | null>(null);
  const { loadDiagram, newDiagram } = useDiagramStore();

  // Wire auto-save — mounted here so it's always active on the canvas
  useAutoSave();

  useEffect(() => {
    // Don't reload if same diagram ID (HMR, StrictMode double-effect, etc.)
    if (loadedIdRef.current === diagramId) return;
    loadedIdRef.current = diagramId;

    const saved = localStoragePersistence.load(diagramId);

    if (saved) {
      loadDiagram(saved);
      // Restore React Flow viewport AFTER stores are populated
      requestAnimationFrame(() => {
        setViewport(saved.viewport, { duration: 0 });
      });
    } else {
      // Brand-new diagram — initialize with the given ID
      newDiagram();
      // Override the auto-generated ID to match the URL
      useDiagramStore.setState((s) => ({
        meta: { ...s.meta, id: diagramId },
      }));
    }
  }, [diagramId, loadDiagram, newDiagram, setViewport]);

  // This component renders nothing — pure side-effect
  return null;
}
