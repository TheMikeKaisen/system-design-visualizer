import * as Y from "yjs";
import { WebrtcProvider } from "y-webrtc";
// import { WebsocketProvider } from "y-websocket"; // Switch to this for production

/**
 * Singleton Yjs document. All collaborative state lives here.
 *
 * ARCHITECTURE NOTE:
 * Yjs is the source of truth for any data that must sync between peers.
 * Zustand reads FROM Yjs (via observers). Commands mutate Yjs.
 * This ensures conflict-free merging — Yjs CRDT handles concurrent edits.
 *
 * Current state: scaffolded. Zustand ↔ Yjs binding wired in Collaboration Phase.
 */

export interface YjsDocShape {
  /** node ID → serialized SystemNode */
  nodes: Y.Map<unknown>;
  /** edge ID → serialized SystemEdge */
  edges: Y.Map<unknown>;
  /**
   * Append-only log of SerializedCommands from all peers.
   * CommandInvoker will push here; peers observe and applyRemote().
   */
  commandLog: Y.Array<unknown>;
  /** clientId → CollaboratorCursor */
  cursors: Y.Map<unknown>;
  /** Diagram metadata */
  meta: Y.Map<unknown>;
}

let _doc: Y.Doc | null = null;
let _provider: WebrtcProvider | null = null;

export function getYjsDoc(): Y.Doc {
  if (!_doc) {
    _doc = new Y.Doc();
  }
  return _doc;
}

export function getYjsSharedTypes(doc: Y.Doc): YjsDocShape {
  return {
    nodes:      doc.getMap("nodes"),
    edges:      doc.getMap("edges"),
    commandLog: doc.getArray("commandLog"),
    cursors:    doc.getMap("cursors"),
    meta:       doc.getMap("meta"),
  };
}

/**
 * Connects to a collaboration room.
 * Uses y-webrtc for dev/MVP (P2P, no server).
 * Replace with WebsocketProvider for production.
 *
 * @param roomId  Unique diagram ID — peers with the same roomId connect
 */
export function connectToRoom(roomId: string): WebrtcProvider {
  if (_provider) {
    _provider.disconnect();
    _provider.destroy();
  }

  const doc = getYjsDoc();
  _provider = new WebrtcProvider(roomId, doc, {
    signaling: ["wss://signaling.yjs.dev"], // Public signaling server — replace in prod
  });

  return _provider;
}

export function disconnectFromRoom(): void {
  _provider?.disconnect();
  _provider?.destroy();
  _provider = null;
}

export function getClientId(): string {
  return getYjsDoc().clientID.toString();
}