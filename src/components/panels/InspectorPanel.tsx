"use client";

import { useCanvasStore } from "@/lib/store/useCanvasStore";
import { NodeInspector } from "./NodeInspector";
import { EdgeInspector } from "./EdgeInspector";

export function InspectorPanel() {
  const { nodes, edges, selectedNodeIds, selectedEdgeId } =
    useCanvasStore();

  const selectedNode =
    selectedNodeIds.length === 1
      ? nodes.find((n) => n.id === selectedNodeIds[0])
      : null;

  const selectedEdge = selectedEdgeId
    ? edges.find((e) => e.id === selectedEdgeId)
    : null;

  const hasSelection = selectedNode || selectedEdge;

  return (
    <aside className="w-[260px] shrink-0 border-l border-border bg-background overflow-y-auto">
      {selectedNode ? (
        <NodeInspector key={selectedNode.id} node={selectedNode} />
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
        Select a node or edge to inspect its properties
      </p>
    </div>
  );
}