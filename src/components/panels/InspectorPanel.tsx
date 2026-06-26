"use client";

import { useCanvasStore }       from "@/lib/store/useCanvasStore";
import { NodeInspector }        from "./NodeInspector";
import { EdgeInspector }        from "./EdgeInspector";
import { MiddlewareAuditLog }   from "./MiddlewareAuditLog";
import { FIELDS }               from "./CloudMetadataPanel";

export function InspectorPanel() {
  const { nodes, edges, selectedNodeIds, selectedEdgeId } = useCanvasStore();

  const selectedNode =
    selectedNodeIds.length === 1
      ? nodes.find((n) => n.id === selectedNodeIds[0])
      : null;

  const selectedEdge = selectedEdgeId
    ? edges.find((e) => e.id === selectedEdgeId)
    : null;

  if (!selectedNode && !selectedEdge) {
    return null;
  }

  // Hide the panel if a node is selected but it has no configuration fields and no capacity
  if (selectedNode) {
    const hasConfig = (FIELDS[selectedNode.data.kind]?.length ?? 0) > 0;
    const hasCapacity = selectedNode.data.capacity != null;
    if (!hasConfig && !hasCapacity) {
      return null;
    }
  }

  return (
    <aside className="w-[260px] shrink-0 border-l border-black/10 dark:border-white/10 bg-background/80 backdrop-blur-xl overflow-y-auto flex flex-col shadow-xl z-10">
      {selectedNode ? (
        <>
          <NodeInspector key={selectedNode.id} node={selectedNode} />
          {selectedNode.data.kind === "apiGateway" && (
            <MiddlewareAuditLog gatewayId={selectedNode.id} />
          )}
        </>
      ) : (
        <EdgeInspector key={selectedEdge!.id} edge={selectedEdge!} />
      )}
    </aside>
  );
}