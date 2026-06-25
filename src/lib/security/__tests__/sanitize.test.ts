import { describe, it, expect } from "vitest";
import {
  sanitizeLabel,
  sanitizeDiagramName,
  sanitizeMetadata,
  sanitizeMetadataValue,
  getClientIp,
} from "../sanitize";

describe("sanitizeLabel", () => {
  it("strips HTML tags", () => {
    expect(sanitizeLabel("<script>alert(1)</script>Hello")).toBe("Hello");
  });

  it("strips inline event handlers", () => {
    expect(sanitizeLabel('<img onerror="alert(1)" src="x">Label')).not.toContain("onerror");
  });

  it("trims whitespace", () => {
    expect(sanitizeLabel("  My Service  ")).toBe("My Service");
  });

  it("enforces max length of 100 chars", () => {
    const long = "A".repeat(200);
    expect(sanitizeLabel(long)).toHaveLength(100);
  });

  it("returns empty string for non-string input", () => {
    expect(sanitizeLabel(null)).toBe("");
    expect(sanitizeLabel(42)).toBe("");
    expect(sanitizeLabel(undefined)).toBe("");
  });

  it("preserves normal labels unchanged", () => {
    expect(sanitizeLabel("Auth Service")).toBe("Auth Service");
  });
});

describe("sanitizeDiagramName", () => {
  it("removes filename-unsafe characters", () => {
    const result = sanitizeDiagramName('My "diagram" <test>');
    expect(result).not.toContain('"');
    expect(result).not.toContain("<");
    expect(result).not.toContain(">");
  });

  it("returns default when empty", () => {
    expect(sanitizeDiagramName("")).toBe("Untitled diagram");
    expect(sanitizeDiagramName("   ")).toBe("Untitled diagram");
  });

  it("strips script tags", () => {
    expect(sanitizeDiagramName('<script>evil()</script>My Diagram'))
      .not.toContain("script");
  });

  it("enforces max length", () => {
    expect(sanitizeDiagramName("A".repeat(300))).toHaveLength(200);
  });
});

describe("sanitizeMetadata", () => {
  it("strips completely untyped or internal fields", () => {
    const result = sanitizeMetadata({ engine: "postgres", enabled: true });
    expect(result.engine).toBe("postgres");
    expect(result.enabled).toBe(true);
  });

  it("sanitizes string values with XSS", () => {
    const result = sanitizeMetadata({ engine: "<script>alert(1)</script>redis" });
    expect(result.engine).not.toContain("<script>");
  });

  it("converts Infinity/NaN numbers to 0", () => {
    const result = sanitizeMetadata({ value: Infinity });
    expect(result.value).toBe(0);
  });
});

describe("getClientIp", () => {
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

  it("returns unknown when no IP headers present", () => {
    const r = makeRequest({});
    expect(getClientIp(r)).toBe("unknown");
  });
});
