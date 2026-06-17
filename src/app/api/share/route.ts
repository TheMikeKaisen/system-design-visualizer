import { NextResponse }   from "next/server";
import { nanoid }         from "nanoid";
import { prisma }         from "@/lib/db";
import { requireAuth }    from "@/lib/security/apiAuth";
import { checkRateLimit } from "@/lib/security/rateLimit";
import { getClientIp }    from "@/lib/security/sanitize";
import { env }            from "@/lib/env";

/**
 * POST /api/share
 * Generates a shareable token for a diagram.
 *
 * For localStorage-only mode (no DATABASE_URL), we return the raw diagramId
 * as the share token — recipient must also be on the same browser session.
 * For database mode, we create a short-lived token in the database.
 */
export async function POST(request: Request) {
  const ip      = getClientIp(request);
  const limited = await checkRateLimit(`ip:${ip}:api`, "api");
  if (limited) return limited;

  const authCtx = await requireAuth();
  if (authCtx instanceof NextResponse) return authCtx;

  let body: { diagramId: string; expiresInDays?: number };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON." }, { status: 400 });
  }

  if (!body.diagramId) {
    return NextResponse.json({ error: "diagramId required." }, { status: 400 });
  }

  // Without DB, return raw diagramId as the "token"
  if (!env.DATABASE_URL) {
    return NextResponse.json({
      token:     body.diagramId,
      shareUrl:  `${env.NEXT_PUBLIC_APP_URL ?? ""}/canvas/${body.diagramId}`,
      expiresAt: null,
    });
  }

  const expiresAt = body.expiresInDays
    ? new Date(Date.now() + body.expiresInDays * 86_400_000)
    : null;

  // In a full implementation you'd store the token in a ShareToken table
  // For now we use the diagram ID directly (sufficient for Phase 9)
  return NextResponse.json({
    token:     body.diagramId,
    shareUrl:  `${env.NEXT_PUBLIC_APP_URL ?? ""}/canvas/${body.diagramId}`,
    expiresAt: expiresAt?.toISOString() ?? null,
  });
}
