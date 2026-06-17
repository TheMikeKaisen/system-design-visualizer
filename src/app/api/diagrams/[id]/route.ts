import { NextResponse }             from "next/server";
import { prisma }                   from "@/lib/db";
import { requireAuth, requireDiagramOwnership } from "@/lib/security/apiAuth";
import { checkRateLimit }           from "@/lib/security/rateLimit";
import { getClientIp }              from "@/lib/security/sanitize";
import { env }                      from "@/lib/env";

type Params = { params: Promise<{ id: string }> };

// GET /api/diagrams/[id]
export async function GET(request: Request, { params }: Params) {
  const { id }       = await params;
  const ip           = getClientIp(request);
  const rateLimitHit = await checkRateLimit(`ip:${ip}:api`, "api");
  if (rateLimitHit) return rateLimitHit;

  const authCtx = await requireAuth();
  if (authCtx instanceof NextResponse) return authCtx;

  const ownership = await requireDiagramOwnership(id, authCtx.userId);
  if (ownership instanceof NextResponse) return ownership;

  if (!env.DATABASE_URL) {
    return NextResponse.json({ error: "Database not configured." }, { status: 503 });
  }

  try {
    const diagram = await prisma.diagram.findUnique({ where: { id } });
    if (!diagram) return NextResponse.json({ error: "Not found." }, { status: 404 });
    return NextResponse.json(diagram.data);
  } catch {
    return NextResponse.json({ error: "Server error." }, { status: 500 });
  }
}

// DELETE /api/diagrams/[id]
export async function DELETE(request: Request, { params }: Params) {
  const { id }       = await params;
  const ip           = getClientIp(request);
  const rateLimitHit = await checkRateLimit(`ip:${ip}:api`, "api");
  if (rateLimitHit) return rateLimitHit;

  const authCtx = await requireAuth();
  if (authCtx instanceof NextResponse) return authCtx;

  const ownership = await requireDiagramOwnership(id, authCtx.userId);
  if (ownership instanceof NextResponse) return ownership;

  if (!env.DATABASE_URL) {
    return NextResponse.json({ error: "Database not configured." }, { status: 503 });
  }

  try {
    await prisma.diagram.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Not found." }, { status: 404 });
  }
}
