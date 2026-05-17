"use client";

import { memo } from "react";
import { useStore, type ReactFlowState } from "@xyflow/react";
import { useCollabContext } from "./CollabProvider";

/**
 * Renders a colored cursor + name label for every remote peer.
 *
 * Positioned using React Flow's viewport transform — cursors are in world-space
 * so they stay locked to canvas content through pan and zoom, identical to nodes.
 *
 * This component sits INSIDE the canvas container (below the Pixi overlay)
 * so it participates in the same coordinate space.
 */
export const RemoteCursors = memo(function RemoteCursors() {
  const { status } = useCollabContext();

  // Read the viewport transform directly from RF's internal store
  // (same approach as PixiBridge — imperative, no re-render on viewport change)
  const transform = useStore((s: ReactFlowState) => s.transform);
  const [tx, ty, zoom] = transform;

  if (!status.isSynced || status.peers.size === 0) return null;

  return (
    <div
      className="absolute inset-0 pointer-events-none z-20 overflow-hidden"
      aria-hidden="true"
    >
      {Array.from(status.peers.values()).map((peer) => {
        if (!peer.cursor) return null;

        // World → screen: same formula as PixiBridge.worldToPixi
        const screenX = peer.cursor.x * zoom + tx;
        const screenY = peer.cursor.y * zoom + ty;

        // Hide cursor if it's outside a generous bounding box
        if (screenX < -40 || screenY < -40) return null;

        return (
          <div
            key={peer.user.clientId}
            className="absolute flex flex-col items-start gap-0.5"
            style={{
              transform:    `translate(${screenX}px, ${screenY}px)`,
              willChange:   "transform",
              transition:   "transform 60ms linear",
            }}
          >
            <CursorSVG color={peer.user.color} />
            <span
              className="text-[10px] font-medium px-1.5 py-0.5 rounded-full
                         whitespace-nowrap select-none ml-3"
              style={{
                background: peer.user.color,
                color:      "#fff",
              }}
            >
              {peer.user.name}
            </span>
          </div>
        );
      })}
    </div>
  );
});

function CursorSVG({ color }: { color: string }) {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 20 20"
      fill="none"
      style={{ filter: "drop-shadow(0 1px 2px rgba(0,0,0,0.3))" }}
    >
      <path
        d="M4 2L16 10L10 11L8 18L4 2Z"
        fill={color}
        stroke="#fff"
        strokeWidth="1"
        strokeLinejoin="round"
      />
    </svg>
  );
}
