import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { deserializeDiagram } from "@/lib/persistence/diagramSerializer";

export const dynamic = "force-dynamic";

// GET /api/diagrams — list all diagrams for the current user
export async function GET() {
  try {
    const diagrams = await prisma.diagram.findMany({
      where: { ownerId: "local" }, // Phase 8: replace with auth session userId
      select: { id: true, name: true, nodeCount: true, edgeCount: true, updatedAt: true },
      orderBy: { updatedAt: "desc" },
    });
    return NextResponse.json(diagrams);
  } catch (error) {
    console.error("[API] GET /diagrams:", error);
    return NextResponse.json({ error: "Failed to fetch diagrams" }, { status: 500 });
  }
}

// POST /api/diagrams — create or upsert a diagram
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const result = deserializeDiagram(body);

    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    const { diagram } = result;

    const saved = await prisma.diagram.upsert({
      where: { id: diagram.meta.id },
      update: {
        name:      diagram.meta.name,
        data:      body,
        nodeCount: diagram.nodes.length,
        edgeCount: diagram.edges.length,
      },
      create: {
        id:        diagram.meta.id,
        name:      diagram.meta.name,
        ownerId:   "local",
        data:      body,
        nodeCount: diagram.nodes.length,
        edgeCount: diagram.edges.length,
      },
    });

    return NextResponse.json({ id: saved.id }, { status: 200 });
  } catch (error) {
    console.error("[API] POST /diagrams:", error);
    return NextResponse.json({ error: "Failed to save diagram" }, { status: 500 });
  }
}
