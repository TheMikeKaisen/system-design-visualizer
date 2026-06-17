import { describe, it, expect, vi, beforeEach } from "vitest";
import { requireAuth, requireDiagramOwnership } from "../apiAuth";

vi.mock("@/lib/auth/auth", () => ({
  auth: vi.fn(),
}));
vi.mock("@/lib/db", () => ({
  prisma: { diagram: { findUnique: vi.fn() } },
}));
vi.mock("@/lib/env", () => ({
  env: { DATABASE_URL: "postgresql://localhost/test" },
}));

import { auth }   from "@/lib/auth/auth";
import { prisma } from "@/lib/db";

describe("requireAuth", () => {
  it("returns userId when session is valid", async () => {
    vi.mocked(auth).mockResolvedValue({
      user: { id: "user-123", name: "Alice" },
    } as any);

    const result = await requireAuth();
    expect(result).toEqual({ userId: "user-123" });
  });

  it("returns 401 when no session", async () => {
    vi.mocked(auth).mockResolvedValue(null);
    const result = await requireAuth();
    expect(result).toBeInstanceOf(Response);
    const res = result as Response;
    expect(res.status).toBe(401);
  });

  it("returns 401 when session has no user id", async () => {
    vi.mocked(auth).mockResolvedValue({ user: {} } as any);
    const result = await requireAuth();
    expect(result).toBeInstanceOf(Response);
  });
});

describe("requireDiagramOwnership", () => {
  it("returns diagram when user owns it", async () => {
    vi.mocked(prisma.diagram.findUnique).mockResolvedValue({
      id: "diag-1", ownerId: "user-123",
    } as any);

    const result = await requireDiagramOwnership("diag-1", "user-123");
    expect(result).toEqual({ id: "diag-1", ownerId: "user-123" });
  });

  it("returns 404 when diagram not found", async () => {
    vi.mocked(prisma.diagram.findUnique).mockResolvedValue(null);
    const result = await requireDiagramOwnership("no-such-id", "user-123");
    expect(result).toBeInstanceOf(Response);
    const res = result as Response;
    expect(res.status).toBe(404);
  });

  it("returns 404 (not 403) when another user's diagram — prevents IDOR", async () => {
    vi.mocked(prisma.diagram.findUnique).mockResolvedValue({
      id: "diag-1", ownerId: "other-user",
    } as any);

    const result = await requireDiagramOwnership("diag-1", "user-123");
    expect(result).toBeInstanceOf(Response);
    const res = result as Response;
    // SECURITY: Must be 404, not 403 — 403 reveals the diagram exists
    expect(res.status).toBe(404);
    const body = await res.json();
    // Must not reveal ownership information
    expect(body.error).not.toContain("permission");
    expect(body.error).not.toContain("owner");
  });
});
