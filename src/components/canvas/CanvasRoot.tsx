"use client";

import { useCallback } from "react";
import {
    ReactFlow,
    Background,
    BackgroundVariant,
    Controls,
    type NodeChange,
    type EdgeChange,
    type Connection,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";

import { useCanvasStore } from "@/lib/store/useCanvasStore";
import { SimulationOverlay } from "./SimulationOverlay";
import { nodeTypes } from "@/components/nodes";
import type { SystemNode, SystemEdge } from "@/types";
import { CanvasErrorBoundary } from "./CanvasErrorBoundary";

export function CanvasRoot() {
    const {
        nodes,
        edges,
        onNodesChange,
        onEdgesChange,
        onConnect,
        setSelectedNodeIds,
    } = useCanvasStore();

    const handleSelectionChange = useCallback(
        ({ nodes: selected }: { nodes: SystemNode[] }) => {
            setSelectedNodeIds(selected.map((n) => n.id));
        },
        [setSelectedNodeIds]
    );

    return (
        /**
         * The wrapper must be `position: relative` so that SimulationOverlay's
         * `position: absolute; inset: 0` canvas fills exactly this container.
         */
        <CanvasErrorBoundary>
            <div className="relative w-full h-full">
                <ReactFlow
                    nodes={nodes}
                    edges={edges}
                    nodeTypes={nodeTypes}
                    onNodesChange={onNodesChange as (c: NodeChange[]) => void}
                    onEdgesChange={onEdgesChange as (c: EdgeChange[]) => void}
                    onConnect={onConnect as (c: Connection) => void}
                    onSelectionChange={handleSelectionChange}
                    fitView
                    proOptions={{ hideAttribution: true }}
                >
                    <Background variant={BackgroundVariant.Dots} gap={20} size={1} />
                    <Controls />
                </ReactFlow>


                {/*
       * THE SANDWICH:
       * SimulationOverlay renders a transparent Pixi canvas ABOVE React Flow.
       * pointer-events: none on the canvas (set inside SimulationOverlay)
       * ensures React Flow still receives all mouse/touch input for dragging.
       */}
                <SimulationOverlay />
            </div>
        </CanvasErrorBoundary>

    );
}