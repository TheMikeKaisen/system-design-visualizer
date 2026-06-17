"use client";

import { useCanvasStore }       from "@/lib/store/useCanvasStore";
import { NodeInspector }        from "./NodeInspector";
import { EdgeInspector }        from "./EdgeInspector";
import { MiddlewareAuditLog }   from "./MiddlewareAuditLog";

export function InspectorPanel() {
  const { nodes, edges, selectedNodeIds, selectedEdgeId } = useCanvasStore();

  const selectedNode =
    selectedNodeIds.length === 1
      ? nodes.find((n) => n.id === selectedNodeIds[0])
      : null;

  const selectedEdge = selectedEdgeId
    ? edges.find((e) => e.id === selectedEdgeId)
    : null;

  return (
    <aside className="w-[260px] shrink-0 border-l border-border bg-background overflow-y-auto flex flex-col">
      {selectedNode ? (
        <>
          <NodeInspector key={selectedNode.id} node={selectedNode} />
          {selectedNode.data.kind === "apiGateway" && (
            <MiddlewareAuditLog gatewayId={selectedNode.id} />
          )}
        </>
      ) : selectedEdge ? (
        <EdgeInspector key={selectedEdge.id} edge={selectedEdge} />
      ) : (
        <EmptyState />
      )}
    </aside>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center h-48 gap-2 px-6 text-center">
      <p className="text-xs text-muted-foreground">
        Select a node or edge to inspect properties
      </p>
    </div>
  );
}