import { SystemNode, SystemEdge } from "@/types";
import { IRoutingStrategy } from "./IRoutingStrategy";

// to select the node(server) using a round robin algorithm
export class RoundRobinStrategy implements IRoutingStrategy {
  private counter = 0;

  selectTarget(
    _source: SystemNode,
    candidates: SystemNode[],
    _edges: SystemEdge[]
  ): SystemNode {
    const target = candidates[this.counter % candidates.length];
    this.counter++;
    return target;
  }

  getName() { return "roundRobin" as const; }
}
