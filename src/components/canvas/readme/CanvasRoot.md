# CanvasRoot.tsx

## What is this file about?
`CanvasRoot` is the main "stage" of the application. It is the primary container that brings together two completely different rendering technologies: **React Flow** (for drawing nodes, lines, and handling drag-and-drop interactions via the DOM) and **PixiJS** (for high-performance WebGL animations via the `SimulationOverlay`).

It connects your centralized data (`useCanvasStore`) directly to the visual layer.

## Why is its significance?
This file acts as the **"Glue"** or the **"Orchestrator"**. 

In modern web development, mixing standard HTML/CSS/React (React Flow) with WebGL (PixiJS) is notoriously difficult because they don't naturally talk to each other. `CanvasRoot` solves this by layering them perfectly on top of one another and ensuring they both read from the exact same source of truth (the Zustand store).

If this file didn't exist, you'd either have a static diagram with no packets (only React Flow) or a fast animation with no interactivity (only PixiJS).

## Key Code to Deeply Understand

### 1. "The Sandwich" Architecture
```tsx
<div className="relative w-full h-full">
    <ReactFlow {...props}>
        {/* React Flow UI elements */}
    </ReactFlow>

    {/* The WebGL Canvas */}
    <SimulationOverlay />
</div>
```
**Why understand this:** This is the most important architectural decision in the visualizer. Both `ReactFlow` and `SimulationOverlay` are styled to fill 100% of the parent `div`. Because `SimulationOverlay` comes *after* `ReactFlow` in the DOM, it renders **on top**. 
To ensure you can still click and drag the React Flow nodes underneath, the WebGL canvas inside `SimulationOverlay` must have `pointer-events: none` applied via CSS. This creates a sandwich: Interactivity on the bottom, transparent animations floating on top.

### 2. Binding Zustand to React Flow
```tsx
const {
    nodes,
    edges,
    onNodesChange,
    onEdgesChange,
    onConnect,
} = useCanvasStore();

// ... inside the JSX ...
<ReactFlow
    nodes={nodes}
    edges={edges}
    onNodesChange={onNodesChange as (c: NodeChange[]) => void}
    // ...
/>
```
**Why understand this:** React Flow *can* manage its own internal state, but you have bypassed that to use Zustand. This setup strictly enforces a **One-Way Data Flow**. When a user drags a node, React Flow fires the `onNodesChange` event, which tells Zustand to update the coordinates. The component then re-renders with the new `nodes` array from the store. This separation is what allows the `SimulationEngine` and `CommandInvoker` to also modify nodes without touching React code.

### 3. The Selection Callback
```tsx
const handleSelectionChange = useCallback(
    ({ nodes: selected }: { nodes: SystemNode[] }) => {
        setSelectedNodeIds(selected.map((n) => n.id));
    },
    [setSelectedNodeIds]
);
```
**Why understand this:** Selection in React Flow is slightly distinct from standard node properties. When a user clicks or lasso-selects multiple nodes, this callback fires. It extracts just the unique `id` strings and saves them to the store (`setSelectedNodeIds`). This allows other parts of the app (like a Properties Sidebar or a "Delete" button) to instantly know which nodes are currently active without querying React Flow directly.