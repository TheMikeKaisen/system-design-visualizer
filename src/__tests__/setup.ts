import "@testing-library/jest-dom";
import { cleanup } from "@testing-library/react";
import { afterEach, vi } from "vitest";

// Clean up mounted components after each test
afterEach(() => {
  cleanup();
});

// Mock Web Worker globally — happy-dom doesn't ship a real Worker
vi.stubGlobal(
  "Worker",
  class MockWorker {
    onmessage: ((e: MessageEvent) => void) | null = null;
    onerror: ((e: ErrorEvent) => void) | null = null;
    postMessage = vi.fn();
    terminate = vi.fn();
  }
);

// Mock performance.now() for deterministic timing in tests
vi.stubGlobal("performance", {
  now: vi.fn(() => 1000),
});

// Mock ResizeObserver (used by React Flow internally)
vi.stubGlobal(
  "ResizeObserver",
  class {
    observe = vi.fn();
    unobserve = vi.fn();
    disconnect = vi.fn();
  }
);