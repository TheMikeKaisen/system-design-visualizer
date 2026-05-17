import { describe, it, expect, vi, beforeEach } from "vitest";
import { setLocalAwareness, clearLocalAwareness, getRemotePeers } from "../awarenessManager";
import { getUserIdentity } from "../userIdentity";

describe("awarenessManager", () => {
  let awareness: any;
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

    // Simple mock of Yjs Awareness protocol
    awareness = {
      clientID: 12345,
      states: new Map(),
      setLocalState: vi.fn(function (state: any) {
        awareness.states.set(awareness.clientID, state);
      }),
      getLocalState: vi.fn(function () {
        return awareness.states.get(awareness.clientID) || null;
      }),
      getStates: vi.fn(function () {
        return awareness.states;
      }),
      on: vi.fn(),
      off: vi.fn(),
    };
  });

  it("registers presence on setLocalAwareness", () => {
    const identity = getUserIdentity();
    setLocalAwareness(awareness, { ...identity, clientId: 12345 }, null, []);

    expect(awareness.setLocalState).toHaveBeenCalledWith({
      user: {
        clientId: 12345,
        name:     identity.name,
        color:    identity.color,
      },
      cursor: null,
      selectedNodeIds: [],
    });
  });

  it("updates cursor coordinates locally", () => {
    const identity = getUserIdentity();
    setLocalAwareness(awareness, { ...identity, clientId: 12345 }, { x: 150, y: 250 }, []);

    const state = awareness.getLocalState();
    expect(state.cursor).toEqual({ x: 150, y: 250 });
  });

  it("nullifies cursor coordinates on clearLocalAwareness", () => {
    clearLocalAwareness(awareness);
    expect(awareness.setLocalState).toHaveBeenCalledWith(null);
  });
});
