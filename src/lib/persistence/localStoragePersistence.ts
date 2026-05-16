import type { SerializedDiagram, DiagramListItem } from "@/types";
import { diagramToJSON, jsonToDiagram } from "./diagramSerializer";

// ─────────────────────────────────────────────
// Storage keys
// ─────────────────────────────────────────────

const KEY_DIAGRAM = (id: string) => `sysvis:diagram:${id}`;
const KEY_INDEX   = "sysvis:diagrams";
const KEY_LAST    = "sysvis:lastDiagramId";

// ─────────────────────────────────────────────
// Safety wrapper — localStorage is unavailable in SSR
// and can throw in private browsing when quota is exceeded
// ─────────────────────────────────────────────

function safeGet(key: string): string | null {
  if (typeof window === "undefined") return null;
  try { return window.localStorage.getItem(key); }
  catch { return null; }
}

function safeSet(key: string, value: string): boolean {
  if (typeof window === "undefined") return false;
  try { window.localStorage.setItem(key, value); return true; }
  catch { return false; }
}

function safeRemove(key: string): void {
  if (typeof window === "undefined") return;
  try { window.localStorage.removeItem(key); } catch { /* silent */ }
}

// ─────────────────────────────────────────────
// Index management (the list of saved diagrams)
// ─────────────────────────────────────────────

function readIndex(): DiagramListItem[] {
  const raw = safeGet(KEY_INDEX);
  if (!raw) return [];
  try { return JSON.parse(raw) as DiagramListItem[]; }
  catch { return []; }
}

function writeIndex(items: DiagramListItem[]): void {
  safeSet(KEY_INDEX, JSON.stringify(items));
}

function upsertIndexEntry(diagram: SerializedDiagram): void {
  const items = readIndex();
  const entry: DiagramListItem = {
    id:        diagram.meta.id,
    name:      diagram.meta.name,
    updatedAt: diagram.meta.updatedAt,
    nodeCount: diagram.nodes.length,
    edgeCount: diagram.edges.length,
  };
  const idx = items.findIndex((i) => i.id === diagram.meta.id);
  if (idx >= 0) items[idx] = entry;
  else items.unshift(entry);
  writeIndex(items);
}

function removeIndexEntry(id: string): void {
  const items = readIndex().filter((i) => i.id !== id);
  writeIndex(items);
}

// ─────────────────────────────────────────────
// Public API
// ─────────────────────────────────────────────

export const localStoragePersistence = {
  /**
   * Saves a diagram. Upserts the index entry.
   * Returns true if the write succeeded.
   */
  save(diagram: SerializedDiagram): boolean {
    const json = diagramToJSON(diagram);
    const ok = safeSet(KEY_DIAGRAM(diagram.meta.id), json);
    if (ok) {
      upsertIndexEntry(diagram);
      safeSet(KEY_LAST, diagram.meta.id);
    }
    return ok;
  },

  /** Loads a diagram by ID. Returns null if not found or invalid. */
  load(id: string): SerializedDiagram | null {
    const raw = safeGet(KEY_DIAGRAM(id));
    if (!raw) return null;
    const result = jsonToDiagram(raw);
    if (!result.ok) {
      console.warn(`[localStorage] Failed to load diagram ${id}:`, result.error);
      return null;
    }
    return result.diagram;
  },

  /** Returns the lightweight index list (no node/edge data). */
  list(): DiagramListItem[] {
    return readIndex().sort((a, b) => b.updatedAt - a.updatedAt);
  },

  /** Permanently deletes a diagram and removes it from the index. */
  delete(id: string): void {
    safeRemove(KEY_DIAGRAM(id));
    removeIndexEntry(id);
    if (safeGet(KEY_LAST) === id) safeRemove(KEY_LAST);
  },

  /** Returns the ID of the last opened diagram, or null. */
  getLastOpenedId(): string | null {
    return safeGet(KEY_LAST);
  },

  /** Checks whether a diagram exists in storage. */
  exists(id: string): boolean {
    return safeGet(KEY_DIAGRAM(id)) !== null;
  },
};
