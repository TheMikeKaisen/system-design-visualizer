"use client";

import { useEffect, useRef } from "react";
import { useReactFlow } from "@xyflow/react";
import { localStoragePersistence } from "@/lib/persistence/localStoragePersistence";
import { useDiagramStore } from "@/lib/store/useDiagramStore";
import { useAutoSave } from "@/hooks/useAutoSave";
import { resetYjsDoc } from "@/lib/collaboration/yjsDoc";
import { syncCountersFromNodes } from "@/components/nodes/NodeFactory";

interface DiagramLoaderProps {
  diagramId: string;
  collabEnabled: boolean;
}

export function DiagramLoader({ diagramId, collabEnabled }: DiagramLoaderProps) {
  const { setViewport } = useReactFlow();
  const loadedIdRef = useRef<string | null>(null);
  const { loadDiagram, newDiagram } = useDiagramStore();

  useAutoSave();

  useEffect(() => {
    if (loadedIdRef.current === diagramId) return;
    loadedIdRef.current = diagramId;

    // Reset Yjs doc when switching diagrams so stale state doesn't bleed across
    resetYjsDoc();

    const saved = localStoragePersistence.load(diagramId);

    if (saved) {
      syncCountersFromNodes(saved.nodes);
      loadDiagram(saved);
      requestAnimationFrame(() => setViewport(saved.viewport, { duration: 0 }));
      // Collab mode: CollabProvider's useCollaboration hook will then push or pull
      // from Yjs once the WebRTC connection syncs.
    } else {
      newDiagram();
      useDiagramStore.setState((s) => ({
        meta: { ...s.meta, id: diagramId },
      }));
    }
  }, [diagramId, collabEnabled, loadDiagram, newDiagram, setViewport]);

  return null;
}
