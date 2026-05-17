"use client";

import { useCallback } from "react";
import { useCollabContext } from "@/components/collaboration/CollabProvider";

/**
 * Returns a mouse-move handler that broadcasts the cursor to peers.
 * Attach to the canvas container's onMouseMove.
 * Safe to call even when collaboration is disabled — the context no-ops.
 */
export function useCanvasCursor() {
  const { broadcastCursorScreen } = useCollabContext();

  const onMouseMove = useCallback(
    (e: React.MouseEvent) => {
      broadcastCursorScreen(e.clientX, e.clientY);
    },
    [broadcastCursorScreen]
  );

  const onMouseLeave = useCallback(() => {
    broadcastCursorScreen(-99999, -99999); // Move cursor off-canvas
  }, [broadcastCursorScreen]);

  return { onMouseMove, onMouseLeave };
}
