import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ id: string }> };

// GET /api/diagrams/[id]
export async function GET(_req: Request, { params }: Params) {
  const { id } = await params;
  try {
    const diagram = await prisma.diagram.findUnique({ where: { id } });
    if (!diagram) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json(diagram.data);
  } catch (error) {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

// DELETE /api/diagrams/[id]
export async function DELETE(_req: Request, { params }: Params) {
  const { id } = await params;
  try {
    await prisma.diagram.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Not found or already deleted" }, { status: 404 });
  }
}
