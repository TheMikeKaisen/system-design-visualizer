"use client";

import {
  createContext, useContext, useCallback, useEffect,
  type ReactNode,
} from "react";
import { useReactFlow } from "@xyflow/react";
import { useCollaboration } from "@/lib/collaboration/useCollaboration";
import { useCanvasStore } from "@/lib/store/useCanvasStore";
import { commandInvoker } from "@/lib/store/useHistoryStore";
import { getClientId, getYjsSharedTypes, getYjsDoc } from "@/lib/collaboration/yjsDoc";
import type { CollaborationStatus } from "@/lib/collaboration/types";
import type { WorldPoint, SerializedCommand } from "@/types";

// ─────────────────────────────────────────────
// Context
// ─────────────────────────────────────────────

interface CollabContextValue {
  status: CollaborationStatus;
  broadcastCursorScreen: (screenX: number, screenY: number) => void;
}

const CollabContext = createContext<CollabContextValue | null>(null);

export function useCollabContext(): CollabContextValue {
  const ctx = useContext(CollabContext);
  if (!ctx) throw new Error("useCollabContext must be used inside CollabProvider");
  return ctx;
}

// ─────────────────────────────────────────────
// Provider
// ─────────────────────────────────────────────

interface CollabProviderProps {
  diagramId: string;
  enabled: boolean;
  children: ReactNode;
}

export function CollabProvider({
  diagramId,
  enabled,
  children,
}: CollabProviderProps) {
  const { screenToFlowPosition } = useReactFlow();

  const { status, updateCursor, updateSelection } = useCollaboration({
    roomId: enabled ? diagramId : null,
    enabled,
  });

  // Keep awareness selection in sync with local canvas selection
  const selectedNodeIds = useCanvasStore((s) => s.selectedNodeIds);
  useCallback(() => {
    updateSelection(selectedNodeIds);
  }, [selectedNodeIds, updateSelection])();

  // Hook into CommandInvoker to append every local command to the audit log
  // We do this here (not in CommandInvoker) to keep the invoker free of Yjs imports
  useEffect(() => {
    if (!enabled || !status.isSynced) return;

    const doc = getYjsDoc();
    const { commandLog } = getYjsSharedTypes(doc);

    const originalCallback = commandInvoker["onCommandExecuted"];

    (commandInvoker as unknown as {
      onCommandExecuted: ((s: SerializedCommand) => void) | undefined;
    }).onCommandExecuted = (serialized) => {
      originalCallback?.(serialized);
      commandLog.push([{ ...serialized, clientId: String(getClientId()) }]);
    };

    return () => {
      (commandInvoker as unknown as {
        onCommandExecuted: ((s: SerializedCommand) => void) | undefined;
      }).onCommandExecuted = originalCallback;
    };
  }, [enabled, status.isSynced]);

  // Convert screen coords → world coords before broadcasting
  const broadcastCursorScreen = useCallback(
    (screenX: number, screenY: number) => {
      if (!enabled) return;
      const worldPos: WorldPoint = screenToFlowPosition({
        x: screenX,
        y: screenY,
      });
      updateCursor(worldPos);
    },
    [enabled, screenToFlowPosition, updateCursor]
  );

  return (
    <CollabContext.Provider value={{ status, broadcastCursorScreen }}>
      {children}
    </CollabContext.Provider>
  );
}
