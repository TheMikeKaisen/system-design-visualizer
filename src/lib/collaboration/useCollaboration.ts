"use client";

import { useEffect, useRef, useState } from "react";
import { connectToRoom, disconnectFromRoom, getClientId } from "./yjsDoc";
import type { WebrtcProvider } from "y-webrtc";

export interface CollaborationState {
  isConnected: boolean;
  peerCount: number;
  clientId: string;
}

/**
 * Hook to manage room lifecycle.
 * In the Collaboration Phase, this will also:
 * - Sync Zustand ↔ Yjs (bind observers)
 * - Broadcast CommandInvoker commands to peers
 * - Render remote cursors
 */
export function useCollaboration(roomId: string | null): CollaborationState {
  const providerRef = useRef<WebrtcProvider | null>(null);
  const [state, setState] = useState<CollaborationState>({
    isConnected: false,
    peerCount: 0,
    clientId: getClientId(),
  });

  useEffect(() => {
    if (!roomId) return;

    const provider = connectToRoom(roomId);
    providerRef.current = provider;

    const handleStatus = ({ connected }: { connected: boolean }) => {
      setState((s) => ({ ...s, isConnected: connected }));
    };

    const handlePeers = ({ webrtcPeers }: { webrtcPeers: unknown[] }) => {
      setState((s) => ({ ...s, peerCount: webrtcPeers.length }));
    };

    provider.on("status", handleStatus);
    provider.on("peers", handlePeers);

    return () => {
      provider.off("status", handleStatus);
      provider.off("peers", handlePeers);
      disconnectFromRoom();
    };
  }, [roomId]);

  return state;
}