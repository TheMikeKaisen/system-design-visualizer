import * as Y from "yjs";
import type { SystemNode, SystemEdge } from "@/types";
import { useCanvasStore } from "@/lib/store/useCanvasStore";
import { getYjsSharedTypes, type YjsSharedTypes } from "./yjsDoc";

// ─────────────────────────────────────────────
// Anti-loop guard
//
// When a remote Y.Map change arrives:
//   1. We update Zustand
//   2. Zustand's subscribe() fires
//   3. WITHOUT a guard, we'd push back to Yjs — creating an echo loop
//
// We use Yjs's built-in `transaction.local` to distinguish remote changes,
// PLUS a manual `isApplyingRemote` flag for the Zustand→Yjs path.
// Both are needed: transaction.local guards the observer direction,
// isApplyingRemote guards the subscribe() direction.
// ─────────────────────────────────────────────

let isApplyingRemote = false;

// ─────────────────────────────────────────────
// Initial state push (we're the first peer)
// ─────────────────────────────────────────────

export function pushStoreToYjs(doc: Y.Doc): void {
  const { nodes, edges } = getYjsSharedTypes(doc);
  const store = useCanvasStore.getState();

  doc.transact(() => {
    nodes.clear();
    store.nodes.forEach((n) =>
      nodes.set(n.id, n as unknown as Record<string, unknown>)
    );
    edges.clear();
    store.edges.forEach((e) =>
      edges.set(e.id, e as unknown as Record<string, unknown>)
    );
  });
}

// ─────────────────────────────────────────────
// Initial state load (others are in the room)
// ─────────────────────────────────────────────

export function loadStoreFromYjs(doc: Y.Doc): void {
  const { nodes, edges } = getYjsSharedTypes(doc);
  const store = useCanvasStore.getState();

  isApplyingRemote = true;
  try {
    // Replace all nodes
    const remoteNodes = Array.from(nodes.values()) as SystemNode[];
    const remoteEdges = Array.from(edges.values()) as SystemEdge[];

    // Clear current canvas
    store.nodes.forEach((n) =>
      store.onNodesChange([{ type: "remove", id: n.id }])
    );
    store.edges.forEach((e) =>
      store.onEdgesChange([{ type: "remove", id: e.id }])
    );

    remoteNodes.forEach((n) => store.addNode(n));
    remoteEdges.forEach((e) => store.restoreEdge(e));
  } finally {
    isApplyingRemote = false;
  }
}

// ─────────────────────────────────────────────
// Live binding — call ONCE after initial sync
// Returns a cleanup function — call on disconnect
// ─────────────────────────────────────────────

export function setupYjsBinding(doc: Y.Doc): () => void {
  const shared = getYjsSharedTypes(doc);
  const cleanupFns: Array<() => void> = [];

  // ── DIRECTION 1: Zustand → Yjs ───────────────────────────────────
  // When nodes change in Zustand (from local commands), diff and push to Yjs.
  // Skips if the change was triggered BY Yjs (isApplyingRemote guard).

  const unsubNodes = useCanvasStore.subscribe(
    (s) => s.nodes,
    (nodes, prevNodes) => {
      if (isApplyingRemote) return;

      doc.transact(() => {
        // Removed nodes
        const currentIds = new Set(nodes.map((n) => n.id));
        prevNodes.forEach((n) => {
          if (!currentIds.has(n.id)) shared.nodes.delete(n.id);
        });
        // Added or updated nodes
        nodes.forEach((n) => {
          shared.nodes.set(n.id, n as unknown as Record<string, unknown>);
        });
      });
    }
  );

  const unsubEdges = useCanvasStore.subscribe(
    (s) => s.edges,
    (edges, prevEdges) => {
      if (isApplyingRemote) return;

      doc.transact(() => {
        const currentIds = new Set(edges.map((e) => e.id));
        prevEdges.forEach((e) => {
          if (!currentIds.has(e.id)) shared.edges.delete(e.id);
        });
        edges.forEach((e) => {
          shared.edges.set(e.id, e as unknown as Record<string, unknown>);
        });
      });
    }
  );

  cleanupFns.push(unsubNodes, unsubEdges);

  // ── DIRECTION 2: Yjs → Zustand ───────────────────────────────────
  // When remote peers mutate Y.Map, apply deltas to Zustand.
  // Skip local transactions (transaction.local === true).

  const nodesObserver = (
    event: Y.YMapEvent<unknown>,
    transaction: Y.Transaction
  ) => {
    if (transaction.local) return; // This was our own change — already in Zustand

    isApplyingRemote = true;
    try {
      const store = useCanvasStore.getState();
      event.changes.keys.forEach((change, id) => {
        if (change.action === "add" || change.action === "update") {
          const node = shared.nodes.get(id) as SystemNode | undefined;
          if (!node) return;
          const exists = store.nodes.some((n) => n.id === id);
          if (exists) {
            // Update position and data
            store.setNodePosition(id, node.position.x, node.position.y);
            store.updateNodeData(id, node.data);
          } else {
            store.addNode(node);
          }
        } else if (change.action === "delete") {
          store.removeNode(id);
        }
      });
    } finally {
      isApplyingRemote = false;
    }
  };

  const edgesObserver = (
    event: Y.YMapEvent<unknown>,
    transaction: Y.Transaction
  ) => {
    if (transaction.local) return;

    isApplyingRemote = true;
    try {
      const store = useCanvasStore.getState();
      event.changes.keys.forEach((change, id) => {
        if (change.action === "add" || change.action === "update") {
          const edge = shared.edges.get(id) as SystemEdge | undefined;
          if (!edge) return;
          const exists = store.edges.some((e) => e.id === id);
          if (!exists) store.restoreEdge(edge);
          // Edge data updates (protocol, latency, etc.)
          else store.updateEdgeData(id, edge.data ?? {});
        } else if (change.action === "delete") {
          store.removeEdge(id);
        }
      });
    } finally {
      isApplyingRemote = false;
    }
  };

  shared.nodes.observe(nodesObserver);
  shared.edges.observe(edgesObserver);

  cleanupFns.push(
    () => shared.nodes.unobserve(nodesObserver),
    () => shared.edges.unobserve(edgesObserver)
  );

  return () => cleanupFns.forEach((fn) => fn());
}
