import { describe, it, expect, beforeEach, vi } from "vitest";
import { getUserIdentity, setUserName } from "../userIdentity";

// In-memory localStorage mock
const store: Record<string, string> = {};
const localStorageMock = {
  getItem:    (k: string) => store[k] ?? null,
  setItem:    (k: string, v: string) => { store[k] = v; },
  removeItem: (k: string) => { delete store[k]; },
  clear:      () => { Object.keys(store).forEach((k) => delete store[k]); },
};

describe("userIdentity", () => {
  beforeEach(() => {
    localStorageMock.clear();
    vi.stubGlobal("localStorage", localStorageMock);
  });

  it("generates a new guest identity on first request", () => {
    const identity = getUserIdentity();
    expect(identity.name).toMatch(/^[a-zA-Z]+ [a-zA-Z]+$/);
    expect(identity.color).toMatch(/^#[0-9A-F]{6}$/i);
  });

  it("persists and restores guest identity from localStorage", () => {
    const first = getUserIdentity();
    const second = getUserIdentity();
    expect(first.name).toBe(second.name);
    expect(first.color).toBe(second.color);
  });

  it("allows updating the user's display name", () => {
    const original = getUserIdentity();
    setUserName("Alice Cooper");

    // Make sure it loads the new name next time
    const loaded = getUserIdentity();
    expect(loaded.name).toBe("Alice Cooper");
  });

  it("ignores whitespace-only display name updates", () => {
    const original = getUserIdentity();
    setUserName("   ");
    const loaded = getUserIdentity();
    expect(loaded.name).toBe(original.name);
  });
});
