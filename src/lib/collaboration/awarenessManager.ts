import type { Awareness } from "y-protocols/awareness";
import type { AwarenessState, RemotePeers } from "./types";
import type { WorldPoint } from "@/types";
import type { UserIdentity } from "./userIdentity";

// ─────────────────────────────────────────────
// Broadcast our state to peers
// ─────────────────────────────────────────────

export function setLocalAwareness(
  awareness: Awareness,
  user: UserIdentity & { clientId: number },
  cursor: WorldPoint | null,
  selectedNodeIds: string[]
): void {
  awareness.setLocalState({
    user: {
      name:     user.name,
      color:    user.color,
      clientId: user.clientId,
    },
    cursor,
    selectedNodeIds,
  } satisfies AwarenessState);
}

export function clearLocalAwareness(awareness: Awareness): void {
  awareness.setLocalState(null);
}

// ─────────────────────────────────────────────
// Read remote peers
// ─────────────────────────────────────────────

export function getRemotePeers(
  awareness: Awareness,
  localClientId: number
): RemotePeers {
  const peers: RemotePeers = new Map();

  awareness.getStates().forEach((state, clientId) => {
    if (clientId === localClientId) return; // Skip ourselves
    if (!state?.user) return;              // Ignore incomplete states
    peers.set(clientId, state as AwarenessState);
  });

  return peers;
}

// ─────────────────────────────────────────────
// Subscribe to awareness changes
// Returns unsubscribe function
// ─────────────────────────────────────────────

export function subscribeToAwareness(
  awareness: Awareness,
  localClientId: number,
  onChange: (peers: RemotePeers) => void
): () => void {
  const handler = () => {
    onChange(getRemotePeers(awareness, localClientId));
  };

  awareness.on("change", handler);
  return () => awareness.off("change", handler);
}
