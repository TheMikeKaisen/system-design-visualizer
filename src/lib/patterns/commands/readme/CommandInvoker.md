
If `ICommand` is the **blueprint** and the `CommandRegistry` is the **dictionary**, then **`CommandInvoker.ts` is the Engine** that actually runs the show.

It is the single most important file for making your diagram feel professional and "alive." Here is its significance:

### 1. The Gatekeeper of Action
In a simple app, when you click "Add Node," you might just call `store.addNode()`. In your app, **nothing happens directly.** Instead, everything goes through the Invoker:
`invoker.execute(new AddNodeCommand(...))`
This centralizes every single change made to the system design.

### 2. Infinite Undo/Redo (`undoStack` & `redoStack`)
This file manages the "Time Machine." 
*   **`execute()`**: Pushes the action onto the `undoStack`.
*   **`undo()`**: Pops from `undoStack`, calls `.undo()`, and moves it to the `redoStack`.
*   **`redo()`**: Pops from `redoStack`, calls `.execute()`, and moves it back to the `undoStack`.
Because the Invoker handles this, your UI (buttons/shortcuts) doesn't need to know *how* to undo a move; it just tells the Invoker: "Go back one step."

### 3. The Collaboration Relay (`onCommandExecuted`)
Look at the `execute` method:
```typescript
const serialized = command.serialize();
this.onCommandExecuted?.(serialized);
```
This is the **"Broadcaster."** Every time you do something locally, the Invoker automatically turns it into data and yells it out to the network (via Yjs). This is why your friends see your changes in real-time.

### 4. Remote Replay (`applyRemote`)
This is the **"Receiver."** When a message comes in from another user, the Invoker uses that `commandRegistry` we talked about earlier to reconstruct the command and run it locally. 
*   **Crucial Detail**: `applyRemote` does *not* push to the undo stack. Why? Because you generally shouldn't be able to "Undo" an action that your friend performed!

### 5. Memory Management (`maxHistorySize`)
Undo stacks can grow forever and eat up RAM. This file includes a "Pruning" logic:
```typescript
if (this.undoStack.length > this.maxHistorySize) {
  this.undoStack.shift(); // Drop the oldest action
}
```
This ensures the app stays fast even after hours of editing.

### Summary
The `CommandInvoker` is what transforms your app from a **static canvas** into a **collaborative workspace with a memory.** It ensures that every action is reversible, syncable, and stable.