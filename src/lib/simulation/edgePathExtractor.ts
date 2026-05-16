import type { WorldPoint, ViewportTransform } from "@/types";

/**
 * Extracts the actual rendered SVG path from a React Flow edge
 * and converts it to world-space waypoints.
 *
 * WHY THIS APPROACH:
 * React Flow renders edges as SVG <path> elements with bezier curves.
 * The packet must travel along the exact same curve, not a straight line.
 * The only way to get the exact curve geometry is to read it from the DOM.
 *
 * HOW IT WORKS:
 * 1. Find the SVG <path> element for this edge in the DOM
 * 2. Use SVGPathElement.getTotalLength() and getPointAtLength() to sample
 *    points along the curve at regular intervals
 * 3. Convert screen-space points back to world-space using the viewport transform
 * 4. Return the world-space points as waypoints
 *
 * PERFORMANCE:
 * This runs once per packet creation, not every frame.
 * Results are cached in PathMetrics and reused for the packet's lifetime.
 * Node moves invalidate the cache — new packets get fresh paths.
 */

const SAMPLE_COUNT = 20; // Number of points to sample along the curve
                          // Higher = smoother travel, more memory per packet
                          // 20 is visually perfect and memory-efficient

/**
 * Finds the SVG path element for a given React Flow edge ID.
 * React Flow sets data-id attribute on edge path elements.
 */
function findEdgePathElement(edgeId: string): SVGPathElement | null {
  // React Flow renders edges with data-id on the path element
  const selector = `.react-flow__edge[data-id="${edgeId}"] path`;
  const el = document.querySelector(selector);
  return el instanceof SVGPathElement ? el : null;
}

/**
 * Converts a screen-space DOMPoint back to world-space coordinates.
 *
 * React Flow applies: screen = world * zoom + pan
 * Therefore: world = (screen - pan) / zoom
 */
function screenToWorld(
  screenX: number,
  screenY: number,
  viewport: ViewportTransform
): WorldPoint {
  return {
    x: (screenX - viewport.x) / viewport.zoom,
    y: (screenY - viewport.y) / viewport.zoom,
  };
}

/**
 * Gets the SVG viewport transform matrix from the React Flow pane.
 * React Flow applies a CSS transform to its inner pane — we need
 * the actual DOM matrix to correctly convert coordinates.
 */
function getReactFlowTransform(): DOMMatrix | null {
  const pane = document.querySelector(".react-flow__pane");
  if (!pane) return null;

  // The transform is on the inner viewport element
  const viewport = document.querySelector(".react-flow__viewport");
  if (!viewport) return null;

  const style = window.getComputedStyle(viewport);
  const transform = style.transform;
  if (!transform || transform === "none") return new DOMMatrix();
  return new DOMMatrix(transform);
}

export interface ExtractedEdgePath {
  waypoints:  WorldPoint[];
  /** true if we successfully extracted from SVG, false if fallback used */
  fromSvg:    boolean;
}

/**
 * Extracts world-space waypoints from a React Flow edge's rendered SVG path.
 *
 * @param edgeId    The React Flow edge ID
 * @param viewport  Current viewport transform from useCanvasStore
 * @param fallback  Straight-line fallback if SVG extraction fails
 */
export function extractEdgePath(
  edgeId:   string,
  viewport: ViewportTransform,
  fallback: { from: WorldPoint; to: WorldPoint }
): ExtractedEdgePath {
  const pathEl = findEdgePathElement(edgeId);

  if (!pathEl) {
    // Edge not yet rendered or not found — use straight line fallback
    return {
      waypoints: [fallback.from, fallback.to],
      fromSvg:   false,
    };
  }

  const totalLength = pathEl.getTotalLength();

  if (totalLength === 0) {
    return {
      waypoints: [fallback.from, fallback.to],
      fromSvg:   false,
    };
  }

  // Sample points along the SVG path
  const waypoints: WorldPoint[] = [];

  for (let i = 0; i <= SAMPLE_COUNT; i++) {
    const distance   = (i / SAMPLE_COUNT) * totalLength;
    const svgPoint   = pathEl.getPointAtLength(distance);

    // svgPoint is in SVG coordinate space.
    // React Flow's SVG has the same coordinate space as the React Flow pane
    // BEFORE the viewport transform is applied. The viewport transform is
    // applied to the .react-flow__viewport container via CSS transform.
    // So svgPoint is already in world-space — no conversion needed!
    // (The SVG coordinate system = React Flow world coordinate system)

    waypoints.push({ x: svgPoint.x, y: svgPoint.y });
  }

  return { waypoints, fromSvg: true };
}

/**
 * Extracts paths for a sequence of edges (a multi-hop packet path).
 * Concatenates the waypoints, avoiding duplicate intermediate points.
 */
export function extractMultiEdgePath(
  edgeIds:   string[],
  viewport:  ViewportTransform,
  nodes:     Array<{ id: string; position: { x: number; y: number }; measured?: { width?: number; height?: number } }>,
  edges:     Array<{ id: string; source: string; target: string }>
): WorldPoint[] {
  if (edgeIds.length === 0) return [];

  const nodeCenter = (id: string): WorldPoint => {
    const node = nodes.find((n) => n.id === id);
    if (!node) return { x: 0, y: 0 };
    return {
      x: node.position.x + (node.measured?.width  ?? 180) / 2,
      y: node.position.y + (node.measured?.height ?? 60)  / 2,
    };
  };

  const allWaypoints: WorldPoint[] = [];

  for (let i = 0; i < edgeIds.length; i++) {
    const edgeId   = edgeIds[i];
    const edgeDef  = edges.find((e) => e.id === edgeId);
    if (!edgeDef) continue;

    const fallback = {
      from: nodeCenter(edgeDef.source),
      to:   nodeCenter(edgeDef.target),
    };

    const { waypoints } = extractEdgePath(edgeId, viewport, fallback);

    if (i === 0) {
      allWaypoints.push(...waypoints);
    } else {
      // Skip first point of subsequent edges (it's the same as the last point
      // of the previous edge — the intermediate node center)
      allWaypoints.push(...waypoints.slice(1));
    }
  }

  return allWaypoints;
}
