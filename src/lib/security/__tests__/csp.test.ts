import { describe, it, expect } from "vitest";
import { buildCsp } from "../csp";

describe("buildCsp", () => {
  const nonce = "abc123";

  it("includes the nonce in script-src", () => {
    const csp = buildCsp(nonce, false);
    expect(csp).toContain(`'nonce-${nonce}'`);
  });

  it("includes unsafe-eval in development", () => {
    const csp = buildCsp(nonce, true);
    expect(csp).toContain("'unsafe-eval'");
  });

  it("excludes unsafe-eval in production", () => {
    const csp = buildCsp(nonce, false);
    expect(csp).not.toContain("'unsafe-eval'");
  });

  it("blocks framing with frame-ancestors none", () => {
    const csp = buildCsp(nonce, false);
    expect(csp).toContain("frame-ancestors 'none'");
  });

  it("includes upgrade-insecure-requests in production", () => {
    const csp = buildCsp(nonce, false);
    expect(csp).toContain("upgrade-insecure-requests");
  });

  it("allows WebSocket connections for collaboration", () => {
    const csp = buildCsp(nonce, false);
    expect(csp).toContain("wss:");
  });

  it("blocks object-src", () => {
    const csp = buildCsp(nonce, false);
    expect(csp).toContain("object-src 'none'");
  });

  it("includes worker-src for Web Worker", () => {
    const csp = buildCsp(nonce, false);
    expect(csp).toContain("worker-src");
    expect(csp).toContain("blob:");
  });
});
