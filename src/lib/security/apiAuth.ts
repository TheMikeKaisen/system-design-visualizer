/**
 * Re-usable authorization helpers for API route handlers.
 * Every API route that touches user data MUST call one of these.
 */
import { NextResponse } from "next/server";
import { auth }         from "@/lib/auth/auth";
import { prisma }       from "@/lib/db";
import { env }          from "@/lib/env";

export interface AuthContext {
  userId: string;
}

/**
 * Asserts the request is from an authenticated user.
 * Returns { userId } or a 401 NextResponse.
 *
 * Usage in a route handler:
 *   const result = await requireAuth();
 *   if (result instanceof NextResponse) return result;
 *   const { userId } = result;
 */
export async function requireAuth(): Promise<AuthContext | NextResponse> {
  // Skip auth if no DATABASE_URL (localStorage-only mode)
  if (!env.DATABASE_URL) {
    return { userId: "local" };
  }

  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json(
      { error: "Authentication required." },
      { status: 401 }
    );
  }

  return { userId: session.user.id };
}

/**
 * Asserts the authenticated user owns the specified diagram.
 * Returns the diagram or a 403/404 NextResponse.
 *
 * Prevents IDOR (Insecure Direct Object Reference) attacks where
 * user A reads/modifies user B's diagram by guessing IDs.
 */
export async function requireDiagramOwnership(
  diagramId: string,
  userId:    string,
): Promise<{ id: string; ownerId: string } | NextResponse> {
  if (!env.DATABASE_URL) return { id: diagramId, ownerId: "local" };

  const diagram = await prisma.diagram.findUnique({
    where:  { id: diagramId },
    select: { id: true, ownerId: true },
  });

  if (!diagram) {
    return NextResponse.json(
      { error: "Diagram not found." },
      { status: 404 }
    );
  }

  if (diagram.ownerId !== userId) {
    // Return 404 instead of 403 — don't reveal that the diagram exists
    return NextResponse.json(
      { error: "Diagram not found." },
      { status: 404 }
    );
  }

  return diagram;
}
