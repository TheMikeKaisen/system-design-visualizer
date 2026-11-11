import { describe, it, expect, vi, beforeEach } from "vitest";

// ─── Mock Setup ─────────────────────────────────────────────────────────────

const { mockRequireAuth, mockPrisma, mockEnv } = vi.hoisted(() => {
  const mockRequireAuth = vi.fn();
  const mockEnv = {
    DATABASE_URL: "postgresql://mock:5432/test",
  };
  const mockPrisma = {
    diagram: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      upsert: vi.fn(),
      delete: vi.fn(),
    },
  };
  return { mockRequireAuth, mockPrisma, mockEnv };
});

vi.mock("@/lib/security/apiAuth", () => ({
  requireAuth: () => mockRequireAuth(),
}));

vi.mock("@/lib/db", () => ({
  prisma: mockPrisma,
}));

vi.mock("@/lib/env", () => ({
  env: mockEnv,
}));

vi.mock("@/lib/security/rateLimit", () => ({
  checkRateLimit: vi.fn().mockResolvedValue(null),
}));

import { POST as postDiagramHandler } from "@/app/api/diagrams/route";

describe("Diagram API Security Tests (POST /api/diagrams)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRequireAuth.mockResolvedValue({ userId: "user_legitimate" });
    mockEnv.DATABASE_URL = "postgresql://mock:5432/test";
  });

  const validDiagramPayload = {
    version: 1,
    meta: {
      id: "diag_123",
      name: "Architecture Diagram",
      ownerId: "user_legitimate",
      collaborators: [],
      createdAt: 1700000000000,
      updatedAt: 1700000000000,
    },
    nodes: [],
    edges: [],
    viewport: { x: 0, y: 0, zoom: 1 },
  };

  it("successfully creates or updates a diagram when caller is the owner", async () => {
    // Existing diagram owned by user_legitimate
    mockPrisma.diagram.findUnique.mockResolvedValue({
      id: "diag_123",
      ownerId: "user_legitimate",
    });

    mockPrisma.diagram.upsert.mockResolvedValue({
      id: "diag_123",
      name: "Architecture Diagram",
    });

    const req = new Request("http://localhost/api/diagrams", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(validDiagramPayload),
    });

    const res = await postDiagramHandler(req);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.id).toBe("diag_123");
    expect(mockPrisma.diagram.upsert).toHaveBeenCalledTimes(1);
  });

  it("successfully creates a new diagram when diagram ID does not exist yet", async () => {
    // No existing diagram
    mockPrisma.diagram.findUnique.mockResolvedValue(null);
    mockPrisma.diagram.upsert.mockResolvedValue({
      id: "diag_new_456",
      name: "New System",
    });

    const req = new Request("http://localhost/api/diagrams", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...validDiagramPayload,
        meta: { ...validDiagramPayload.meta, id: "diag_new_456" },
      }),
    });

    const res = await postDiagramHandler(req);
    expect(res.status).toBe(200);
    expect(mockPrisma.diagram.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "diag_new_456" },
        create: expect.objectContaining({
          id: "diag_new_456",
          ownerId: "user_legitimate",
        }),
      })
    );
  });

  it("SEC-05 IDOR: rejects overwrite when authenticated attacker attempts to overwrite victim diagram", async () => {
    // Attacker is logged in as user_attacker
    mockRequireAuth.mockResolvedValue({ userId: "user_attacker" });

    // Target diagram exists but is owned by victim_user_999
    mockPrisma.diagram.findUnique.mockResolvedValue({
      id: "diag_victim_architecture",
      ownerId: "victim_user_999",
    });

    const req = new Request("http://localhost/api/diagrams", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...validDiagramPayload,
        meta: {
          ...validDiagramPayload.meta,
          id: "diag_victim_architecture",
          name: "Defaced Diagram",
        },
      }),
    });

    const res = await postDiagramHandler(req);
    expect(res.status).toBe(404);
    const json = await res.json();
    expect(json.error).toBe("Diagram not found or unauthorized.");

    // Critical assertion: upsert must NEVER be invoked!
    expect(mockPrisma.diagram.upsert).not.toHaveBeenCalled();
  });
});
