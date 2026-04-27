// src/lib/patterns/strategies/WeightedStrategy.ts
import type { IRoutingStrategy } from "./IRoutingStrategy";
import type { SystemNode, SystemEdge, RoutingStrategyKind } from "@/types";

/**
 * Weighted routing strategy.
 *
 * Selects a target node with probability proportional to its weight.
 * Weight is read from node.data.metadata.weight (number, default 1).
 *
 * Example: if node A has weight 3 and node B has weight 1,
 * A receives ~75% of traffic and B receives ~25%.
 *
 * This is stateless — weight is on the node, not the strategy instance.
 */
export class WeightedStrategy implements IRoutingStrategy {
  selectTarget(
    _source: SystemNode,
    candidates: SystemNode[],
    _edges: SystemEdge[]
  ): SystemNode {
    if (candidates.length === 0) {
      throw new Error("[WeightedStrategy] No candidates provided");
    }

    if (candidates.length === 1) return candidates[0];

    // Read weight from metadata, default to 1 if not set
    const weights = candidates.map((node) => {
      const w = Number(node.data.metadata.weight ?? 1);
      return isFinite(w) && w > 0 ? w : 1;
    });

    const totalWeight = weights.reduce((sum, w) => sum + w, 0);

    // Pick a random point in [0, totalWeight)
    let random = Math.random() * totalWeight;

    // Walk through candidates, subtracting each weight until we land
    for (let i = 0; i < candidates.length; i++) {
      random -= weights[i];
      if (random <= 0) return candidates[i];
    }

    // Floating point fallback — return last candidate
    return candidates[candidates.length - 1];
  }

  getName(): RoutingStrategyKind {
    return "weighted";
  }
}