
import type {
  WorkerRequest,
  WorkerResponse,
  SystemNode,
  SystemEdge,
  WorldPoint,
} from "@/types";

// BFS over the edge graph
interface BFSResult {
  nodeIds: string[];
  edgeIds: string[];
}

function bfsPath(
  sourceId: string,
  targetId: string,
  nodes: SystemNode[],
  edges: SystemEdge[]
): BFSResult | null {
  if (sourceId === targetId) return { nodeIds: [sourceId], edgeIds: [] };

  // Build adjacency list: nodeId → [{neighborId, edgeId}]
  const adj = new Map<string, Array<{ neighborId: string; edgeId: string }>>();
  for (const node of nodes) adj.set(node.id, []);

  for (const edge of edges) {
    adj.get(edge.source)?.push({ neighborId: edge.target, edgeId: edge.id });
    // Treat edges as bidirectional for path-finding purposes
    adj.get(edge.target)?.push({ neighborId: edge.source, edgeId: edge.id });
  }

  // BFS
  const visited = new Set<string>([sourceId]);
  const queue: Array<{ nodeId: string; nodePath: string[]; edgePath: string[] }> = [
    { nodeId: sourceId, nodePath: [sourceId], edgePath: [] },
  ];

  while (queue.length > 0) {
    const current = queue.shift()!;

    for (const { neighborId, edgeId } of adj.get(current.nodeId) ?? []) {
      if (visited.has(neighborId)) continue;
      visited.add(neighborId);

      const newNodePath = [...current.nodePath, neighborId];
      const newEdgePath = [...current.edgePath, edgeId];

      if (neighborId === targetId) {
        return { nodeIds: newNodePath, edgeIds: newEdgePath };
      }

      queue.push({
        nodeId: neighborId,
        nodePath: newNodePath,
        edgePath: newEdgePath,
      });
    }
  }

  return null; // No path found
}

// Convert BFS result to world-space waypoints
/**
 * The node's React Flow position is its TOP-LEFT corner.
 * We want packets to enter/exit from the CENTER of each node.
 * Default node size: 180×60px (a sensible default; override if needed).
 */
const NODE_W = 180;
const NODE_H = 60;

function nodeCenterPoint(node: SystemNode): WorldPoint {
  return {
    x: node.position.x + (node.measured?.width ?? NODE_W) / 2,
    y: node.position.y + (node.measured?.height ?? NODE_H) / 2,
  };
}

function buildWaypoints(
  nodeIds: string[],
  nodes: SystemNode[]
): WorldPoint[] {
  const nodeMap = new Map(nodes.map((n) => [n.id, n]));
  return nodeIds.flatMap((id) => {
    const node = nodeMap.get(id);
    return node ? [nodeCenterPoint(node)] : [];
  });
}

// ─────────────────────────────────────────────
// Message handler
// ─────────────────────────────────────────────

self.onmessage = (event: MessageEvent<WorkerRequest>) => {
  const { type, payload } = event.data;

  if (type !== "CALCULATE_PATH") return;

  const { requestId, sourceId, targetId, nodes, edges } = payload;

  const result = bfsPath(sourceId, targetId, nodes, edges);

  if (!result) {
    // No path — post an empty path back. Engine will mark the packet as dropped.
    const response: WorkerResponse = {
      type: "PATH_RESULT",
      payload: { requestId, path: [], edgeIds: [] },
    };
    self.postMessage(response);
    return;
  }

  const path = buildWaypoints(result.nodeIds, nodes);

  const response: WorkerResponse = {
    type: "PATH_RESULT",
    payload: { requestId, path, edgeIds: result.edgeIds },
  };

  self.postMessage(response);
};

export {}; // Make this a module (required for TS worker files)