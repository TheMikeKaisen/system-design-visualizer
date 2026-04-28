
This file (`useHistoryStore.ts`) is the **bridge between your application's logic and your React UI** for the Undo/Redo system. 

### 1. What is this store about?
At its core, this file implements the **Command Pattern** in a React-friendly way. 

It splits the Undo/Redo responsibilities into two distinct parts:
1.  **The Brain (`commandInvoker`)**: A pure, non-React TypeScript class that manages the actual undo/redo stacks, enforces the history limit (100 items), and executes the logic. It is created as a singleton (`export const commandInvoker = new CommandInvoker(...)`), meaning only one instance ever exists for the lifetime of the app.
2.  **The UI State (`useHistoryStore`)**: A lightweight Zustand store that holds *only* the data React needs to render the screen (e.g., "Is the undo button disabled?" and "What text should the undo tooltip show?"). 

### 2. What is the Use Case?
Imagine a user drags a new "Service Node" onto the canvas:
1.  Your code creates an `AddNodeCommand`.
2.  You call `commandInvoker.execute(command)`.
3.  The invoker pushes this command to its internal "undo stack".
4.  The invoker triggers its `onCommandExecuted` callback.
5.  That callback tells the Zustand store: `_syncFromInvoker()`.
6.  The Zustand store asks the invoker: *"Can we undo right now?"* (Yes) *"What did we just do?"* (Added a Service Node).
7.  Zustand updates its state (`canUndo: true`, `undoLabel: "Add Service Node"`).
8.  Your `<UndoRedoControls />` component in the toolbar automatically re-renders, turning the Undo button from grey (disabled) to black (enabled).

### 3. How does it help the project?
This architecture provides three massive benefits to your system design visualizer:

*   **Extreme Performance**: By keeping the heavy undo/redo logic in a vanilla TypeScript class, React doesn't have to evaluate or re-render the entire history stack every time a user does something. React *only* knows about boolean flags and strings.
*   **Fixes the "React Flow Drag" Problem**: React Flow handles node dragging internally. If a user drags a node, React Flow has *already* moved it on the screen. If you tried to `execute()` a "MoveNodeCommand", it would move the node twice. This store provides a **`record(command)`** function. This tells the invoker to put the action into the undo stack *without* running it, perfectly solving the gap between React Flow's internal state and your custom undo history.
*   **Multiplayer Ready (Yjs)**: Notice the `onCommandExecuted(serialized: SerializedCommand)` callback. Every single action a user takes on the canvas flows through this exact bottleneck. When you are ready to add real-time collaboration, you simply add `yjsCommandLog.push(serialized)` right there. You won't have to rewrite a single component.

### 4. Everything you need to know (The API)

If you are writing a component and you want to interact with history, here is how you use this file:

#### When to use `commandInvoker` directly:
Use this inside standard event handlers (like `onClick` or `onDrop`) when you don't care about React re-renders.
```typescript
import { commandInvoker } from "@/lib/store/useHistoryStore";
import { DeleteNodeCommand } from "@/lib/patterns/commands/DeleteNodeCommand";

function handleDelete() {
  const cmd = new DeleteNodeCommand(selectedNode, connectedEdges);
  commandInvoker.execute(cmd); 
}
```

#### When to use `useHistoryStore` (The Hook):
Use this **only** inside a React component when you want the component to visually update based on the history state.
```tsx
import { useHistoryStore } from "@/lib/store/useHistoryStore";

export function Toolbar() {
  // This component will re-render exactly when history changes
  const { canUndo, undoLabel, undo } = useHistoryStore();

  return (
    <button disabled={!canUndo} onClick={undo}>
      Undo {undoLabel}
    </button>
  );
}
```

#### The `_syncFromInvoker` trick:
You might wonder why methods like `undo: () => { commandInvoker.undo(); ... }` exist in the Zustand store. Whenever you call an action through Zustand, it forwards the command to the pure TypeScript brain, and then immediately runs `_syncFromInvoker()`. This guarantees that the UI is always perfectly in sync with the brain's internal stacks.