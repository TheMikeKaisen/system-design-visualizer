
import type {
  WorkerRequest,
  WorkerResponse,
  SystemNode,
  SystemEdge,
} from "@/types";

// ─────────────────────────────────────────────
// BFS — unchanged logic, different return shape
// ─────────────────────────────────────────────

interface BFSResult {
  nodeIds: string[];
  edgeIds: string[];
}

function bfsPath(
  sourceId: string,
  targetId: string,
  nodes:    SystemNode[],
  edges:    SystemEdge[]
): BFSResult | null {
  if (sourceId === targetId) {
    return { nodeIds: [sourceId], edgeIds: [] };
  }

  const adj = new Map<string, Array<{ neighborId: string; edgeId: string }>>();
  for (const node of nodes) adj.set(node.id, []);

  for (const edge of edges) {
    adj.get(edge.source)?.push({ neighborId: edge.target, edgeId: edge.id });
    adj.get(edge.target)?.push({ neighborId: edge.source, edgeId: edge.id });
  }

  const visited = new Set<string>([sourceId]);
  const queue: Array<{
    nodeId:   string;
    nodePath: string[];
    edgePath: string[];
  }> = [{ nodeId: sourceId, nodePath: [sourceId], edgePath: [] }];

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
        nodeId:   neighborId,
        nodePath: newNodePath,
        edgePath: newEdgePath,
      });
    }
  }

  return null;
}

// ─────────────────────────────────────────────
// Message handler
// ─────────────────────────────────────────────

self.onmessage = (event: MessageEvent<WorkerRequest>) => {
  const { type, payload } = event.data;
  if (type !== "CALCULATE_PATH") return;

  const { requestId, sourceId, targetId, nodes, edges } = payload;
  const result = bfsPath(sourceId, targetId, nodes, edges);

  const response: WorkerResponse = {
    type: "PATH_RESULT",
    payload: {
      requestId,
      edgeIds:  result?.edgeIds  ?? [],
      nodeIds:  result?.nodeIds  ?? [],
    },
  };

  self.postMessage(response);
};

export {};