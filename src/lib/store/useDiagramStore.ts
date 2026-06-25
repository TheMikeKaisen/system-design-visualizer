import { create } from "zustand";
import { nanoid } from "nanoid";
import type { DiagramMeta, DiagramListItem, SerializedDiagram } from "@/types";
import { localStoragePersistence } from "@/lib/persistence/localStoragePersistence";
import { serializeDiagram } from "@/lib/persistence/diagramSerializer";
import { useCanvasStore } from "./useCanvasStore";
import { useHistoryStore } from "./useHistoryStore";
import { syncCountersFromNodes } from "@/components/nodes/NodeFactory";

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────

function newMeta(name = "Untitled diagram"): DiagramMeta {
  return {
    id:            nanoid(),
    name,
    ownerId:       "local",
    collaborators: [],
    createdAt:     Date.now(),
    updatedAt:     Date.now(),
  };
}

// ─────────────────────────────────────────────
// Shape
// ─────────────────────────────────────────────

interface DiagramState {
  meta: DiagramMeta;
  /** True when the diagram has finished loading from persistence */
  isInitialized: boolean;
  /** True when canvas has changes not yet written to any storage layer */
  isDirty: boolean;
  /** Timestamp of last successful save (any layer). null = never saved. */
  lastSavedAt: number | null;
  /** List items from localStorage — populated on mount */
  savedList: DiagramListItem[];
  isSaving: boolean;
}

interface DiagramActions {
  /** Create a brand-new blank diagram and update canvas store */
  newDiagram: (name?: string) => DiagramMeta;
  /** Load a serialized diagram into the canvas and diagram stores */
  loadDiagram: (diagram: SerializedDiagram) => void;
  /** Manually save current state to localStorage */
  save: () => boolean;
  /** Rename current diagram */
  rename: (name: string) => void;
  /** Delete a diagram from localStorage by ID */
  deleteSaved: (id: string) => void;
  /** Refresh the saved list from localStorage */
  refreshList: () => void;
  /** Mark canvas as dirty (called when nodes/edges change) */
  markDirty: () => void;
}

type DiagramStore = DiagramState & DiagramActions;

// ─────────────────────────────────────────────
// Store
// ─────────────────────────────────────────────

export const useDiagramStore = create<DiagramStore>((set, get) => ({
  meta:        newMeta(),
  isInitialized: false,
  isDirty:     false,
  lastSavedAt: null,
  savedList:   [],
  isSaving:    false,

  newDiagram: (name = "Untitled diagram") => {
    const meta = newMeta(name);
    set({ meta, isInitialized: true, isDirty: false, lastSavedAt: null });
    // Clear canvas
    useCanvasStore.getState().onNodesChange(
      useCanvasStore.getState().nodes.map((n) => ({ type: "remove", id: n.id }))
    );
    useHistoryStore.getState().clear();
    return meta;
  },

  loadDiagram: (diagram) => {
    // CRITICAL: sync counters before the canvas processes nodes
    syncCountersFromNodes(diagram.nodes);

    const canvas = useCanvasStore.getState();

    // Replace nodes and edges atomically
    // We use a remove-all then add-all approach
    canvas.onNodesChange(
      canvas.nodes.map((n) => ({ type: "remove", id: n.id }))
    );
    canvas.onEdgesChange(
      canvas.edges.map((e) => ({ type: "remove", id: e.id }))
    );
    diagram.nodes.forEach((n) => canvas.addNode(n));
    diagram.edges.forEach((e) => canvas.restoreEdge(e));
    canvas.setViewport(diagram.viewport);

    set({
      isInitialized: true,
      meta:        diagram.meta,
      isDirty:     false,
      lastSavedAt: Date.now(),
    });
    
    useHistoryStore.getState().clear();
  },

  save: () => {
    set({ isSaving: true });
    const { meta } = get();
    const { nodes, edges, viewport } = useCanvasStore.getState();
    const diagram = serializeDiagram(nodes, edges, viewport, meta);
    const ok = localStoragePersistence.save(diagram);
    set({
      isSaving:    false,
      isDirty:     !ok,
      lastSavedAt: ok ? Date.now() : get().lastSavedAt,
      meta:        ok ? diagram.meta : meta,
      savedList:   localStoragePersistence.list(),
    });
    return ok;
  },

  rename: (name) => {
    set((s) => ({ meta: { ...s.meta, name }, isDirty: true }));
  },

  deleteSaved: (id) => {
    localStoragePersistence.delete(id);
    set({ savedList: localStoragePersistence.list() });
  },

  refreshList: () => {
    set({ savedList: localStoragePersistence.list() });
  },

  markDirty: () => {
    if (!get().isDirty) set({ isDirty: true });
  },
}));

// ─────────────────────────────────────────────
// Selectors
// ─────────────────────────────────────────────

export const selectMeta        = (s: DiagramStore) => s.meta;
export const selectIsDirty     = (s: DiagramStore) => s.isDirty;
export const selectLastSavedAt = (s: DiagramStore) => s.lastSavedAt;
export const selectSavedList   = (s: DiagramStore) => s.savedList;
