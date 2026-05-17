import type { WorldPoint } from "@/types";

/** The state each peer broadcasts via Yjs Awareness */
export interface AwarenessState {
  user: {
    name: string;
    color: string;
    /** Yjs numeric clientID — stable for the lifetime of the Y.Doc */
    clientId: number;
  };
  /** World-space cursor position, null when cursor is off-canvas */
  cursor: WorldPoint | null;
  selectedNodeIds: string[];
}

/** A remote peer's full awareness state keyed by their Yjs clientID */
export type RemotePeers = Map<number, AwarenessState>;

export interface CollaborationStatus {
  isConnected: boolean;
  isSynced: boolean;
  peerCount: number;
  peers: RemotePeers;
  /** Our own clientId */
  localClientId: number;
  localUser: AwarenessState["user"];
}
