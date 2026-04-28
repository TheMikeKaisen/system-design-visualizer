import { create } from "zustand";
import { subscribeWithSelector } from "zustand/middleware";
import { immer } from "zustand/middleware/immer";
import {
    addEdge,
    applyNodeChanges,
    applyEdgeChanges,
    type NodeChange,
    type EdgeChange,
    type Connection,
} from "@xyflow/react";
import type {
    SystemNode,
    SystemEdge,
    ViewportTransform,
    SystemEdgeData,
} from "@/types";

// ─────────────────────────────────────────────
// Shape
// ─────────────────────────────────────────────

interface CanvasState {
    nodes: SystemNode[];
    edges: SystemEdge[];
    /** The live viewport from React Flow — Pixi reads this */
    viewport: ViewportTransform;
    selectedNodeIds: string[];
    selectedEdgeId: string | null;
}

interface CanvasActions {
    // React Flow change handlers (pass directly to <ReactFlow />)
    onNodesChange: (changes: NodeChange<SystemNode>[]) => void;
    onEdgesChange: (changes: EdgeChange<SystemEdge>[]) => void;
    onConnect: (connection: Connection) => void;

    // Imperative mutations (used by Command pattern)
    addNode: (node: SystemNode) => void;
    removeNode: (id: string) => void;
    removeEdge: (id: string) => void;
    restoreEdge: (edge: SystemEdge) => void;
    updateEdgeData: (id: string, data: Partial<SystemEdgeData>) => void;
    setSelectedEdgeId: (id: string | null) => void;
    updateNodeData: (id: string, data: Partial<SystemNode["data"]>) => void;
    setNodePosition: (id: string, x: number, y: number) => void;

    // Viewport — called by PixiBridge on React Flow's onMove
    setViewport: (vp: ViewportTransform) => void;

    setSelectedNodeIds: (ids: string[]) => void;
}

export type CanvasStore = CanvasState & CanvasActions;

// ─────────────────────────────────────────────
// Store Definition
// ─────────────────────────────────────────────

export const useCanvasStore = create<CanvasStore>()(
    subscribeWithSelector(
        immer((set) => ({
            // ── Initial State ──────────────────────
            nodes: [],
            edges: [],
            viewport: { x: 0, y: 0, zoom: 1 },
            selectedNodeIds: [],
            selectedEdgeId: null,

            // ── React Flow change handlers ──────────
            onNodesChange: (changes) =>
                set((state) => {
                    state.nodes = applyNodeChanges(changes, state.nodes);
                }),

            onEdgesChange: (changes) =>
                set((state) => {
                    state.edges = applyEdgeChanges(changes, state.edges);
                }),

            onConnect: (connection) =>
                set((state) => {
                    state.edges = addEdge(connection, state.edges) as SystemEdge[];
                }),

            // ── Imperative mutations ────────────────
            addNode: (node) =>
                set((state) => {
                    state.nodes.push(node);
                }),

            removeNode: (id) =>
                set((state) => {
                    state.nodes = state.nodes.filter((n) => n.id !== id);
                    state.edges = state.edges.filter(
                        (e) => e.source !== id && e.target !== id
                    );
                }),

            updateNodeData: (id, data) =>
                set((state) => {
                    const node = state.nodes.find((n) => n.id === id);
                    if (node) Object.assign(node.data, data);
                }),

            setNodePosition: (id, x, y) =>
                set((state) => {
                    const node = state.nodes.find((n) => n.id === id);
                    if (node) node.position = { x, y };
                }),

            // ── Viewport ────────────────────────────
            setViewport: (vp) =>
                set((state) => {
                    state.viewport = vp;
                }),

            setSelectedNodeIds: (ids) =>
                set((state) => {
                    state.selectedNodeIds = ids;
                }),

            restoreEdge: (edge: SystemEdge) =>
                set((state) => {
                    const exists = state.edges.some((e) => e.id === edge.id);
                    if (!exists) state.edges.push(edge);
                }),

            removeEdge: (id: string) =>
                set((state) => {
                    state.edges = state.edges.filter((e) => e.id !== id);
                }),
                
            updateEdgeData: (id: string, data: Partial<SystemEdgeData>) =>
                set((state) => {
                    const edge = state.edges.find((e) => e.id === id);
                    if (edge?.data) Object.assign(edge.data, data);
                }),

            setSelectedEdgeId: (id: string | null) =>
                set((state) => {
                    state.selectedEdgeId = id;
                }),
        }))
    )
);

// ─────────────────────────────────────────────
// Selectors (memoised, prevents over-rendering)
// ─────────────────────────────────────────────

export const selectViewport = (s: CanvasStore) => s.viewport;
export const selectNodes = (s: CanvasStore) => s.nodes;
export const selectEdges = (s: CanvasStore) => s.edges;