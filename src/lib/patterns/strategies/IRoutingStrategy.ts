import type { SystemNode, SystemEdge, RoutingStrategyKind } from "@/types";

export interface IRoutingStrategy {
  selectTarget(
    source: SystemNode,
    candidates: SystemNode[],
    edges: SystemEdge[]
  ): SystemNode;
  getName(): RoutingStrategyKind;
}
