import * as Y from "yjs";
import { WebrtcProvider } from "y-webrtc";
import type { SystemNode, SystemEdge } from "@/types";

// ─────────────────────────────────────────────
// Shared type map (strongly typed accessors)
// ─────────────────────────────────────────────

export interface YjsSharedTypes {
  /** nodeId → serialized SystemNode */
  nodes: Y.Map<unknown>;
  /** edgeId → serialized SystemEdge */
  edges: Y.Map<unknown>;
  /**
   * Append-only log of SerializedCommand objects.
   * Used for audit trail and future collaborative undo.
   * NOT used for state sync — Y.Map handles that.
   */
  commandLog: Y.Array<unknown>;
  /** clientId → CollaboratorCursor (ephemeral, cleared on disconnect) */
  cursors: Y.Map<unknown>;
  /** Diagram metadata */
  meta: Y.Map<unknown>;
}

// ─────────────────────────────────────────────
// Singleton
// ─────────────────────────────────────────────

let _doc: Y.Doc | null = null;

export function getYjsDoc(): Y.Doc {
  if (!_doc) _doc = new Y.Doc();
  return _doc;
}

export function getYjsSharedTypes(doc: Y.Doc): YjsSharedTypes {
  return {
    nodes: doc.getMap("nodes"),
    edges: doc.getMap("edges"),
    commandLog: doc.getArray("commandLog"),
    cursors: doc.getMap("cursors"),
    meta: doc.getMap("meta"),
  };
}

// ─────────────────────────────────────────────
// Provider lifecycle
// ─────────────────────────────────────────────

let _provider: WebrtcProvider | null = null;

interface ConnectOptions {
  roomId: string;
  /**
   * Signaling server URLs for y-webrtc.
   * Uses the public Yjs signaling server by default (dev/MVP only).
   * Replace with your own server for production.
   */
  signalingUrls?: string[];
}

export function connectToRoom({
  roomId,
  signalingUrls = process.env.NODE_ENV === "production" 
    ? undefined // Undefined tells y-webrtc to use public internet signaling servers automatically
    : ["ws://localhost:4444"], // Local server for dev
}: ConnectOptions): WebrtcProvider {
  if (_provider) {
    if ((_provider as unknown as { roomName: string }).roomName === roomId) {
      return _provider; // Already connected to this room
    }
    _provider.disconnect();
    _provider.destroy();
    _provider = null;
  }

  const doc = getYjsDoc();

  /**
   * TO SWITCH TO PRODUCTION WebSocket:
   * 1. npm install y-websocket
   * 2. Replace the import above with: import { WebsocketProvider } from "y-websocket";
   * 3. Replace `new WebrtcProvider(...)` with:
   *      new WebsocketProvider(env.YJS_WEBSOCKET_URL, roomId, doc)
   * 4. The rest of the code is identical — same provider API.
   */
  _provider = new WebrtcProvider(roomId, doc, { signaling: signalingUrls });

  return _provider;
}

export function disconnectFromRoom(): void {
  if (_provider) {
    _provider.disconnect();
    _provider.destroy();
    _provider = null;
  }
}

export function getProvider(): WebrtcProvider | null {
  return _provider;
}

export function getClientId(): number {
  return getYjsDoc().clientID;
}

/**
 * Completely resets the Yjs document and provider.
 * Call this when switching to a different diagram.
 */
export function resetYjsDoc(): void {
  disconnectFromRoom();
  _doc = null;
}