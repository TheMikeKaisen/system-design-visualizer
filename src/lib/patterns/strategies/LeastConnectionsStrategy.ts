import { SystemNode, SystemEdge } from "@/types";
import { IRoutingStrategy } from "./IRoutingStrategy";


// to select the node(server) with the least number of load.
export class LeastConnectionsStrategy implements IRoutingStrategy {
  selectTarget(
    _source: SystemNode,
    candidates: SystemNode[],
    _edges: SystemEdge[]
  ): SystemNode {
    return candidates.reduce((min, node) =>
      node.data.activeConnections < min.data.activeConnections ? node : min
    );
  }

  getName() { return "leastConnections" as const; }
}