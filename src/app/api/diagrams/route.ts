import { NextResponse }         from "next/server";
import { prisma }               from "@/lib/db";
import { requireAuth }          from "@/lib/security/apiAuth";
import { checkRateLimit }       from "@/lib/security/rateLimit";
import { deserializeDiagram }   from "@/lib/persistence/diagramSerializer";
import { sanitizeDiagramName }  from "@/lib/security/sanitize";
import { getClientIp }          from "@/lib/security/sanitize";
import { env }                  from "@/lib/env";

// GET /api/diagrams
export async function GET(request: Request) {
  // Rate limit: 60 list requests per minute per IP
  const ip       = getClientIp(request);
  const rateLimitHit = await checkRateLimit(`ip:${ip}:list`, "diagram-list");
  if (rateLimitHit) return rateLimitHit;

  const auth = await requireAuth();
  if (auth instanceof NextResponse) return auth;

  if (!env.DATABASE_URL) {
    return NextResponse.json({ error: "Database not configured." }, { status: 503 });
  }

  try {
    const diagrams = await prisma.diagram.findMany({
      where:   { ownerId: auth.userId },
      select:  { id: true, name: true, nodeCount: true, edgeCount: true, updatedAt: true },
      orderBy: { updatedAt: "desc" },
    });
    return NextResponse.json(diagrams);
  } catch {
    return NextResponse.json({ error: "Failed to fetch diagrams." }, { status: 500 });
  }
}

// POST /api/diagrams
export async function POST(request: Request) {
  const ip           = getClientIp(request);
  const rateLimitHit = await checkRateLimit(`ip:${ip}:save`, "diagram-save");
  if (rateLimitHit) return rateLimitHit;

  const auth = await requireAuth();
  if (auth instanceof NextResponse) return auth;

  // Validate Content-Type before parsing body
  const contentType = request.headers.get("content-type") ?? "";
  if (!contentType.includes("application/json")) {
    return NextResponse.json(
      { error: "Content-Type must be application/json." },
      { status: 415 }
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  // Validate shape with Zod-backed deserializer
  const result = deserializeDiagram(body);
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  const { diagram } = result;

  // Sanitize the name before storing
  const safeName = sanitizeDiagramName(diagram.meta.name);

  if (!env.DATABASE_URL) {
    return NextResponse.json({ error: "Database not configured." }, { status: 503 });
  }

  try {
    const saved = await prisma.diagram.upsert({
      where:  { id: diagram.meta.id },
      update: {
        name:      safeName,
        data:      body as object,
        nodeCount: diagram.nodes.length,
        edgeCount: diagram.edges.length,
        // SECURITY: Never allow updating ownerId via API
      },
      create: {
        id:        diagram.meta.id,
        name:      safeName,
        ownerId:   auth.userId,
        data:      body as object,
        nodeCount: diagram.nodes.length,
        edgeCount: diagram.edges.length,
      },
    });
    return NextResponse.json({ id: saved.id }, { status: 200 });
  } catch {
    return NextResponse.json({ error: "Failed to save diagram." }, { status: 500 });
  }
}
