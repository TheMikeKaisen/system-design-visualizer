import { describe, it, expect, beforeEach, vi } from "vitest";
import { localStoragePersistence } from "../localStoragePersistence";
import { serializeDiagram } from "../diagramSerializer";
import type { ViewportTransform, DiagramMeta } from "@/types";

vi.mock("../diagramSerializer", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../diagramSerializer")>();
  return { ...actual };
});

// In-memory localStorage mock
const store: Record<string, string> = {};
const localStorageMock = {
  getItem:    (k: string) => store[k] ?? null,
  setItem:    (k: string, v: string) => { store[k] = v; },
  removeItem: (k: string) => { delete store[k]; },
  clear:      () => { Object.keys(store).forEach((k) => delete store[k]); },
};

beforeEach(() => {
  localStorageMock.clear();
  vi.stubGlobal("localStorage", localStorageMock);
});

const vp: ViewportTransform = { x: 0, y: 0, zoom: 1 };
const meta: DiagramMeta = {
  id: "diag-1", name: "My Diagram", ownerId: "local",
  collaborators: [], createdAt: 1000, updatedAt: 1000,
};

function makeDiagram(id = "diag-1") {
  return serializeDiagram([], [], vp, { ...meta, id });
}

describe("localStoragePersistence.save", () => {
  it("saves diagram and returns true", () => {
    const ok = localStoragePersistence.save(makeDiagram());
    expect(ok).toBe(true);
  });

  it("saves diagram to correct key", () => {
    localStoragePersistence.save(makeDiagram("test-id"));
    expect(store["sysvis:diagram:test-id"]).toBeDefined();
  });

  it("updates the index", () => {
    localStoragePersistence.save(makeDiagram());
    const list = localStoragePersistence.list();
    expect(list).toHaveLength(1);
    expect(list[0].id).toBe("diag-1");
  });

  it("updates lastOpened key", () => {
    localStoragePersistence.save(makeDiagram());
    expect(localStoragePersistence.getLastOpenedId()).toBe("diag-1");
  });
});

describe("localStoragePersistence.load", () => {
  it("returns diagram when it exists", () => {
    localStoragePersistence.save(makeDiagram());
    const loaded = localStoragePersistence.load("diag-1");
    expect(loaded).not.toBeNull();
    expect(loaded?.meta.id).toBe("diag-1");
  });

  it("returns null for non-existent id", () => {
    expect(localStoragePersistence.load("not-found")).toBeNull();
  });
});

describe("localStoragePersistence.list", () => {
  it("returns items sorted by updatedAt descending", () => {
    localStoragePersistence.save(makeDiagram("a"));
    localStoragePersistence.save(makeDiagram("b"));
    const list = localStoragePersistence.list();
    expect(list.length).toBeGreaterThanOrEqual(2);
    // Most recent first
    expect(list[0].updatedAt).toBeGreaterThanOrEqual(list[1].updatedAt);
  });
});

describe("localStoragePersistence.delete", () => {
  it("removes diagram from storage and index", () => {
    localStoragePersistence.save(makeDiagram());
    localStoragePersistence.delete("diag-1");
    expect(localStoragePersistence.load("diag-1")).toBeNull();
    expect(localStoragePersistence.list()).toHaveLength(0);
  });
});

describe("localStoragePersistence.exists", () => {
  it("returns true for saved diagrams", () => {
    localStoragePersistence.save(makeDiagram());
    expect(localStoragePersistence.exists("diag-1")).toBe(true);
  });

  it("returns false for unsaved diagrams", () => {
    expect(localStoragePersistence.exists("ghost")).toBe(false);
  });
});
