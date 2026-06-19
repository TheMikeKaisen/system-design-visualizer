"use client";

import {
  useEffect, useRef, useState, useCallback,
} from "react";
import type { WebrtcProvider } from "y-webrtc";
import {
  getYjsDoc, connectToRoom, disconnectFromRoom,
  getClientId, getYjsSharedTypes,
} from "./yjsDoc";
import {
  pushStoreToYjs, loadStoreFromYjs, setupYjsBinding,
} from "./yjsBinding";
import {
  setLocalAwareness, clearLocalAwareness, subscribeToAwareness,
} from "./awarenessManager";
import { getUserIdentity } from "./userIdentity";
import { useCanvasStore } from "@/lib/store/useCanvasStore";
import type { CollaborationStatus, RemotePeers } from "./types";
import type { WorldPoint } from "@/types";

interface UseCollaborationOptions {
  roomId: string | null;
  enabled?: boolean;
}

const INITIAL_STATUS: CollaborationStatus = {
  isConnected:   false,
  isSynced:      false,
  peerCount:     0,
  peers:         new Map(),
  localClientId: 0,
  localUser:     { name: "", color: "", clientId: 0 },
};

export function useCollaboration({
  roomId,
  enabled = true,
}: UseCollaborationOptions): {
  status: CollaborationStatus;
  updateCursor: (worldPos: WorldPoint | null) => void;
  updateSelection: (nodeIds: string[]) => void;
} {
  const [status, setStatus] = useState<CollaborationStatus>(INITIAL_STATUS);
  const providerRef  = useRef<WebrtcProvider | null>(null);
  const cleanupRef   = useRef<(() => void) | null>(null);
  const userIdentity = useRef(getUserIdentity());

  // ── Cursor / selection broadcast ─────────────────────────────────

  const cursorRef    = useRef<WorldPoint | null>(null);
  const selectionRef = useRef<string[]>([]);

  const broadcastPresence = useCallback(() => {
    const provider = providerRef.current;
    if (!provider) return;
    setLocalAwareness(
      provider.awareness,
      { ...userIdentity.current, clientId: getClientId() },
      cursorRef.current,
      selectionRef.current
    );
  }, []);

  const updateCursor = useCallback(
    (worldPos: WorldPoint | null) => {
      cursorRef.current = worldPos;
      broadcastPresence();
    },
    [broadcastPresence]
  );

  const updateSelection = useCallback(
    (nodeIds: string[]) => {
      selectionRef.current = nodeIds;
      broadcastPresence();
    },
    [broadcastPresence]
  );

  // ── Room lifecycle ────────────────────────────────────────────────

  useEffect(() => {
    if (!roomId || !enabled) return;

    const doc = getYjsDoc();
    const localClientId = getClientId();
    const user = userIdentity.current;

    const provider = connectToRoom({ roomId });
    providerRef.current = provider;

    setStatus((s) => ({
      ...s,
      localClientId,
      localUser: { ...user, clientId: localClientId },
    }));

    // ── Initial sync ──────────────────────────────────────────────

    const handleSynced = () => {
      const { nodes } = getYjsSharedTypes(doc);
      const store = useCanvasStore.getState();

      if (nodes.size === 0 && store.nodes.length > 0) {
        // We are the first peer (or offline) AND we have local data.
        // Push our local Zustand state to Yjs.
        pushStoreToYjs(doc);
      } else if (nodes.size > 0) {
        // We received data from the signaling server or peers.
        // Load their state into Zustand.
        loadStoreFromYjs(doc);
      }

      // Wire the live bidirectional binding.
      // If WebRTC connects to a peer AFTER this, the Yjs observers
      // will naturally catch the incoming data and render it.
      if (!cleanupRef.current) {
        cleanupRef.current = setupYjsBinding(doc);
      }

      // Broadcast our presence
      broadcastPresence();

      setStatus((s) => ({ ...s, isSynced: true }));
    };

    // y-webrtc fires 'synced' after WebRTC exchange completes
    provider.on("synced", handleSynced);

    // ── Connection status ─────────────────────────────────────────

    const handleStatus = ({ connected }: { connected: boolean }) => {
      setStatus((s) => ({ ...s, isConnected: connected }));
    };

    provider.on("status", handleStatus);

    // ── Awareness (remote peers) ──────────────────────────────────

    const unsubAwareness = subscribeToAwareness(
      provider.awareness,
      localClientId,
      (peers: RemotePeers) => {
        setStatus((s) => ({
          ...s,
          peers,
          peerCount: peers.size,
        }));
      }
    );

    // ── Cleanup ───────────────────────────────────────────────────

    return () => {
      provider.off("synced", handleSynced);
      provider.off("status", handleStatus);
      unsubAwareness();
      clearLocalAwareness(provider.awareness);
      cleanupRef.current?.();
      cleanupRef.current = null;
      disconnectFromRoom();
      providerRef.current = null;
      setStatus(INITIAL_STATUS);
    };
  }, [roomId, enabled, broadcastPresence]);

  return { status, updateCursor, updateSelection };
}