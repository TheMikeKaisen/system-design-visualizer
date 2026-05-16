import { z } from "zod";
import type {
  SerializedDiagram,
  SystemNode,
  SystemEdge,
  ViewportTransform,
  DiagramMeta,
} from "@/types";
import { DIAGRAM_FORMAT_VERSION } from "@/types";
import { syncCountersFromNodes } from "@/components/nodes/NodeFactory";

// ─────────────────────────────────────────────
// Zod validation schema
// Used when IMPORTING — never trust external data
// ─────────────────────────────────────────────

const ViewportSchema = z.object({
  x: z.number(),
  y: z.number(),
  zoom: z.number().min(0.1).max(10),
});

const MetaSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  ownerId: z.string(),
  collaborators: z.array(z.string()),
  createdAt: z.number(),
  updatedAt: z.number(),
});

/**
 * We validate the outer envelope strictly.
 * Node/edge data is passed through as-is — React Flow handles internal shape.
 * This keeps the schema forward-compatible as we add new node kinds.
 */
const SerializedDiagramSchema = z.object({
  version: z.literal(DIAGRAM_FORMAT_VERSION),
  meta: MetaSchema,
  nodes: z.array(z.record(z.string(), z.unknown())),
  edges: z.array(z.record(z.string(), z.unknown())),
  viewport: ViewportSchema,
});

// ─────────────────────────────────────────────
// Serialize
// ─────────────────────────────────────────────

export function serializeDiagram(
  nodes: SystemNode[],
  edges: SystemEdge[],
  viewport: ViewportTransform,
  meta: DiagramMeta
): SerializedDiagram {
  return {
    version: DIAGRAM_FORMAT_VERSION,
    meta: { ...meta, updatedAt: Date.now() },
    nodes,
    edges,
    viewport,
  };
}

// ─────────────────────────────────────────────
// Deserialize + validate
// ─────────────────────────────────────────────

export type DeserializeResult =
  | { ok: true; diagram: SerializedDiagram }
  | { ok: false; error: string };

export function deserializeDiagram(raw: unknown): DeserializeResult {
  const result = SerializedDiagramSchema.safeParse(raw);

  if (!result.success) {
    const firstError = result.error.issues[0];
    return {
      ok: false,
      error: firstError
      ? `Invalid diagram format: ${firstError.path.join(".")} — ${firstError.message}`
      : "Invalid diagram format",    };
  }

  const parsed = result.data;

  // Version migration hook — add cases as format evolves
  const migrated = migrateIfNeeded(parsed);

  // CRITICAL: sync ID counters so new nodes never collide with loaded ones
  syncCountersFromNodes(migrated.nodes as SystemNode[]);

  return {
    ok: true,
    diagram: migrated as SerializedDiagram,
  };
}

// ─────────────────────────────────────────────
// Migration
// ─────────────────────────────────────────────

function migrateIfNeeded(diagram: z.infer<typeof SerializedDiagramSchema>) {
  // Version 1 is current — nothing to migrate yet.
  // Future: if (diagram.version === 1) return migrateV1toV2(diagram);
  return diagram;
}

// ─────────────────────────────────────────────
// JSON helpers
// ─────────────────────────────────────────────

export function diagramToJSON(diagram: SerializedDiagram): string {
  return JSON.stringify(diagram, null, 2);
}

export function jsonToDiagram(json: string): DeserializeResult {
  try {
    const parsed = JSON.parse(json);
    return deserializeDiagram(parsed);
  } catch {
    return { ok: false, error: "File is not valid JSON." };
  }
}
