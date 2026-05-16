"use client";

import { useCallback, useRef, type DragEvent } from "react";
import {
  Background,
  BackgroundVariant,
  Controls,
  type NodeChange,
  type EdgeChange,
  type Connection,
  type Node,
  useReactFlow,
  ReactFlow,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";

import { useCanvasStore } from "@/lib/store/useCanvasStore";
import { SimulationOverlay } from "./SimulationOverlay";
import { CanvasErrorBoundary } from "./CanvasErrorBoundary";
import { nodeTypes, edgeTypes } from "@/components/nodes";
import { createNode } from "@/components/nodes/NodeFactory";
import { AddNodeCommand } from "@/lib/patterns/commands/AddNodeCommand";
import { MoveNodeCommand } from "@/lib/patterns/commands/MoveNodeCommand";
import { ConnectEdgeCommand } from "@/lib/patterns/commands/ConnectEdgeCommand";
import { commandInvoker } from "@/lib/store/useHistoryStore";
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts";
import type { NodeKind, SystemEdge, SystemNode } from "@/types";
import { nanoid } from "nanoid";

export function CanvasRoot() {
  const {
    nodes, edges,
    onNodesChange, onEdgesChange,
    setSelectedNodeIds, setSelectedEdgeId,
  } = useCanvasStore();

  const { screenToFlowPosition } = useReactFlow();

  // Snapshot node positions at drag-start for MoveNodeCommand
  const dragStartPositions = useRef<Map<string, { x: number; y: number }>>(new Map());

  useKeyboardShortcuts();

  // ── Selection ──────────────────────────────────────────────────────

  const handleSelectionChange = useCallback(
    ({ nodes: selected }: { nodes: SystemNode[] }) => {
      setSelectedNodeIds(selected.map((n) => n.id));
    },
    [setSelectedNodeIds]
  );

  const handleEdgeClick = useCallback(
    (_: React.MouseEvent, edge: SystemEdge) => {
      setSelectedEdgeId(edge.id);
      setSelectedNodeIds([]);
    },
    [setSelectedEdgeId, setSelectedNodeIds]
  );

  const handlePaneClick = useCallback(() => {
    setSelectedNodeIds([]);
    setSelectedEdgeId(null);
  }, [setSelectedNodeIds, setSelectedEdgeId]);

  // ── Drag → MoveNodeCommand ─────────────────────────────────────────

  const handleNodeDragStart = useCallback(
    (_: React.MouseEvent, node: SystemNode) => {
      dragStartPositions.current.set(node.id, { ...node.position });
    },
    []
  );

  const handleNodeDragStop = useCallback(
    (_: React.MouseEvent, node: SystemNode) => {
      const from = dragStartPositions.current.get(node.id);
      dragStartPositions.current.delete(node.id);

      if (!from) return;
      if (from.x === node.position.x && from.y === node.position.y) return;

      // React Flow already applied the position via onNodesChange.
      // We use record() — pushes to undo stack without re-executing.
      commandInvoker.record(
        new MoveNodeCommand(node.id, node.data.label, from, node.position)
      );
    },
    []
  );

  // ── Connect → ConnectEdgeCommand ───────────────────────────────────

  const handleConnect = useCallback(
    (connection: Connection) => {
      const edge: SystemEdge = {
        id: `edge-${nanoid(8)}`,
        source: connection.source,
        target: connection.target,
        sourceHandle: connection.sourceHandle ?? undefined,
        targetHandle: connection.targetHandle ?? undefined,
        type: "simulationEdge",
        data: {
          protocol: "HTTP",
          throughputLimit: null,
          latencyMs: 20,
          errorRate: 0,
          middleware: [],
        },
      };
      commandInvoker.execute(new ConnectEdgeCommand(edge));
    },
    []
  );

  // ── Drop from NodePalette ──────────────────────────────────────────

  const handleDrop = useCallback(
    (e: DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      const kind = e.dataTransfer.getData(
        "application/sysvis-node-kind"
      ) as NodeKind | "";

      if (!kind) return;

      const position = screenToFlowPosition({
        x: e.clientX,
        y: e.clientY,
      });

      const node = createNode({ kind, position });
      commandInvoker.execute(new AddNodeCommand(node));
    },
    [screenToFlowPosition]
  );

  const handleDragOver = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "copy";
  }, []);

  // ── React Flow change passthrough ──────────────────────────────────
  // We still pass RF's own change handlers for internal RF state (selection, etc.)
  // Command pattern wraps only our explicit mutations above.

  return (
    <CanvasErrorBoundary>
      <div
        className="relative w-full h-full"
        onDrop={handleDrop}
        onDragOver={handleDragOver}
      >
        <ReactFlow
          nodes={nodes}
          edges={edges}
          nodeTypes={nodeTypes}
          edgeTypes={edgeTypes}
          onNodesChange={onNodesChange as (c: NodeChange[]) => void}
          onEdgesChange={onEdgesChange as (c: EdgeChange[]) => void}
          onConnect={handleConnect}
          onSelectionChange={handleSelectionChange}
          onEdgeClick={handleEdgeClick}
          onPaneClick={handlePaneClick}
          onNodeDragStart={handleNodeDragStart as (e: React.MouseEvent, n: Node) => void}
          onNodeDragStop={handleNodeDragStop as (e: React.MouseEvent, n: Node) => void}
          defaultEdgeOptions={{ type: "simulationEdge" }}
          deleteKeyCode={null}   // We handle Delete ourselves in useKeyboardShortcuts
          fitView
          proOptions={{ hideAttribution: true }}
        >
          <Background variant={BackgroundVariant.Dots} gap={24} size={1} />
          <Controls position="bottom-right" />
        </ReactFlow>

        <SimulationOverlay />
      </div>
    </CanvasErrorBoundary>
  );
}