
## The core problem it solves

When User A moves a node on their machine, they have a `MoveNodeCommand` object in memory. That object has methods like `execute()` and `undo()`. It has a reference to the Zustand store. It is a living JavaScript object.

Now User A wants to tell User B "I moved this node." User B is on a different machine. You cannot send a JavaScript object across the network. You cannot send functions. You cannot send class instances. You can only send **plain data** — JSON.

So you serialize the command to JSON:

```json
{
  "type": "MoveNode",
  "payload": {
    "nodeId": "svc-1",
    "nodeLabel": "Auth Service",
    "fromX": 100,
    "fromY": 100,
    "toX": 400,
    "toY": 300
  },
  "timestamp": 1710000000000,
  "clientId": "user-a-42"
}
```

User B receives this JSON. Now they have the data. But data alone does nothing. To actually move the node on User B's canvas, you need to turn that JSON back into a `MoveNodeCommand` object that can call `execute()`.

**That is what `registerCommand` enables.** It is a lookup table that maps the string `"MoveNode"` to the function that knows how to build a `MoveNodeCommand` from raw JSON payload.

---

## A concrete walkthrough

### Step 1 — Registration (happens at module load time)

When your app starts and imports `MoveNodeCommand.ts`, this runs immediately at the bottom of the file:

```typescript
registerCommand("MoveNode", (payload) => new MoveNodeCommand(
  payload.nodeId as string,
  payload.nodeLabel as string,
  { x: payload.fromX as number, y: payload.fromY as number },
  { x: payload.toX as number,   y: payload.toY as number  },
));
```

After this line runs, the `commandRegistry` Map looks like this:

```
commandRegistry = {
  "AddNode"    → function(payload) { ... returns new AddNodeCommand }
  "MoveNode"   → function(payload) { ... returns new MoveNodeCommand }
  "DeleteNode" → function(payload) { ... returns new DeleteNodeCommand }
}
```

Think of it as a phone book. The name (command type string) maps to a contact (a factory function that creates the command).

### Step 2 — User A performs an action

```typescript
// User A drags a node — CanvasRoot calls:
commandInvoker.record(
  new MoveNodeCommand("svc-1", "Auth Service", {x:100,y:100}, {x:400,y:300})
);
```

`CommandInvoker` calls `command.serialize()` which returns:

```typescript
{
  type: "MoveNode",
  payload: {
    nodeId: "svc-1",
    nodeLabel: "Auth Service",
    fromX: 100, fromY: 100,
    toX: 400,   toY: 300
  },
  timestamp: 1710000000000,
  clientId: "42"
}
```

This JSON gets broadcast to Yjs, which sends it to all connected peers.

### Step 3 — User B receives it

User B's `CommandInvoker.applyRemote()` receives the raw JSON:

```typescript
applyRemote(serialized: SerializedCommand): void {
  // Look up "MoveNode" in the registry
  const constructor = commandRegistry.get(serialized.type);

  if (!constructor) {
    console.warn(`Unknown command type: ${serialized.type}`);
    return;
  }

  // Call the factory function with the raw payload
  // This creates a real MoveNodeCommand object on User B's machine
  const command = constructor(serialized.payload);

  // Now we can execute it — it moves the node on User B's canvas
  command.execute();

  // NOTE: does NOT push to undo stack
  // User B cannot undo User A's actions
}
```

The registry lookup `commandRegistry.get("MoveNode")` returns the factory function registered in Step 1. That function receives the raw payload and constructs a proper `MoveNodeCommand` with all the right arguments. Then `command.execute()` calls `useCanvasStore.getState().setNodePosition("svc-1", 400, 300)` on User B's machine. The node moves.

---

## What happens without `registerCommand`

Without the registry, `applyRemote` would have to look like this:

```typescript
applyRemote(serialized: SerializedCommand): void {
  // Hardcoded switch — CommandInvoker must know about every command type
  switch (serialized.type) {
    case "MoveNode":
      new MoveNodeCommand(
        serialized.payload.nodeId,
        ...
      ).execute();
      break;
    case "AddNode":
      new AddNodeCommand(...).execute();
      break;
    case "DeleteNode":
      new DeleteNodeCommand(...).execute();
      break;
    // Every time you add a new command, you MUST edit this file
    // CommandInvoker is now coupled to every command type
  }
}
```

Two problems with this:

**1. Violation of the Open/Closed Principle.** `CommandInvoker` should be closed for modification. If you add a new command type (`ResizeNodeCommand`, `GroupNodesCommand`, `ChangeProtocolCommand`), you should not need to touch `CommandInvoker.ts`. With the registry, you add the new command file, call `registerCommand` at the bottom, and `CommandInvoker` automatically handles it. Zero changes to existing files.

**2. Circular dependency.** `CommandInvoker.ts` would need to import `MoveNodeCommand`, `AddNodeCommand`, `DeleteNodeCommand`, etc. Those files import from `useCanvasStore`. `useCanvasStore` might import other things. You end up with a tangle. The registry breaks this — `CommandInvoker` imports only the registry Map, and each command file registers itself independently.

---

## The warning matters

```typescript
if (commandRegistry.has(type)) {
  console.warn(`[CommandRegistry] Overwriting command type: ${type}`);
}
```

If two files accidentally register the same type string — say two developers both create a command and name it `"UpdateNode"` — one will silently overwrite the other. The warning surfaces this immediately in development. Without it, you'd see nodes not updating for remote peers and have no idea why, because the wrong factory function would be silently constructing the wrong command.

---

## Summary in one sentence

`registerCommand` lets `CommandInvoker` reconstruct any command from plain JSON data, without knowing anything about that command's implementation — so adding new commands requires zero changes to existing infrastructure.