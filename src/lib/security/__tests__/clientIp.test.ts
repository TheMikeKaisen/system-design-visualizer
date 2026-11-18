import { describe, it, expect } from "vitest";
import { getClientIp } from "../clientIp";

describe("getClientIp utility", () => {
  function makeRequest(headers: Record<string, string>) {
    return new Request("https://example.com", { headers });
  }

  it("prefers cf-connecting-ip", () => {
    const r = makeRequest({ "cf-connecting-ip": "1.2.3.4", "x-real-ip": "5.6.7.8" });
    expect(getClientIp(r)).toBe("1.2.3.4");
  });

  it("falls back to x-real-ip", () => {
    const r = makeRequest({ "x-real-ip": "5.6.7.8" });
    expect(getClientIp(r)).toBe("5.6.7.8");
  });

  it("takes first IP from x-forwarded-for", () => {
    const r = makeRequest({ "x-forwarded-for": "10.0.0.1, 10.0.0.2, 10.0.0.3" });
    expect(getClientIp(r)).toBe("10.0.0.1");
  });

  it("returns unknown when no IP headers are present", () => {
    const r = makeRequest({});
    expect(getClientIp(r)).toBe("unknown");
  });

  it("trims whitespace from resolved IP addresses", () => {
    const r = makeRequest({ "x-real-ip": "  192.168.1.1  " });
    expect(getClientIp(r)).toBe("192.168.1.1");
  });
});

