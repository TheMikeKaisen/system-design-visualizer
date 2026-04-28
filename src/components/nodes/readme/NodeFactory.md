Edited CanvasRoot.md
Viewed NodeFactory.tsx:92-101

Here is the detailed explanation for `NodeFactory.tsx` formatted for your notes:

***

# NodeFactory.tsx

## What is this file about?
This file implements the **Factory Pattern** for generating nodes in your system design visualizer. Instead of manually writing out the boilerplate JSON every time a user wants to add a database or a load balancer, the rest of the application simply calls `createNode({ kind: 'database' })`. This file takes care of assigning a unique ID, generating the default label, and scaffolding the initial data structure required by React Flow and the Simulation Engine.

## Why is its significance?
Centralizing node creation here solves several major engineering problems simultaneously:
1.  **Consistency:** It guarantees that every node entering the system has the exact same structural shape (`SystemNode`), preventing random crashes caused by missing properties (like an undefined `metadata` object).
2.  **ID Management:** It handles the complexity of generating human-readable, sequentially unique IDs (e.g., `db-1`, `db-2`, `svc-1`). 
3.  **Collaboration & Save/Load Stability:** When loading a saved diagram or receiving a node from a remote peer, you must guarantee that new nodes created locally do not accidentally reuse an ID that already exists.

## Key Code to Deeply Understand

### 1. The Monotonic Counter (`nextId`)
```typescript
const counters = new Map<NodeKind, number>();

function nextId(kind: NodeKind): string {
  const prefix = KIND_PREFIX[kind] ?? "node";
  const count = (counters.get(kind) ?? 0) + 1;
  counters.set(kind, count);
  return `${prefix}-${count}`;
}
```
**Why understand this:** This is a classic "Monotonic Counter" (a sequence that only goes up). Instead of using random UUIDs like `123e4567-e89b-12d3`, it creates semantic, human-readable IDs like `lb-1` (Load Balancer 1) or `db-2` (Database 2). This makes debugging the simulation logs *significantly* easier, as you can instantly tell what type of node is passing a packet. The `counters` map keeps a separate running tally for every single `NodeKind`.

### 2. State Restoration (`syncCountersFromNodes`)
```typescript
export function syncCountersFromNodes(nodes: SystemNode[]): void {
  for (const node of nodes) {
    const kind = node.data.kind;
    const match = node.id.match(/-(\d+)$/);
    if (!match) continue;
    const num = parseInt(match[1], 10);
    const current = counters.get(kind) ?? 0;
    if (num > current) counters.set(kind, num);
  }
}
```
**Why understand this:** This function solves the **"Collision Bug."** 
Imagine you create `db-1` and `db-2`, save your diagram, and close the browser. When you reopen the browser and load the diagram, the `counters` map resets to `0`. If you try to add a new database, `nextId` will generate `db-1` again, causing React Flow to crash due to duplicate keys. 
This function runs right after loading a file. It scans all existing IDs using a Regular Expression (`/-(\d+)$/`), finds the highest number used for each kind, and "fast-forwards" the internal counter so the next generated ID is safely `db-3`.

### 3. The Factory Function and `forceId`
```typescript
export function createNode({
  kind,
  label,
  position = { x: 100, y: 100 },
  forceId,
}: CreateNodeOptions): SystemNode {
  // ... gets defaults ...
  return {
    id: forceId ?? nextId(kind),
    type: kind,
    // ...
```
**Why understand this:** The `createNode` function merges your requested options with the `KIND_DEFAULTS` to output a perfect `SystemNode`. But the most critical part for your multiplayer architecture is the `forceId` parameter. 

When User A creates a node locally, they call `createNode({ kind: 'database' })`, which generates `db-1`. The `AddNodeCommand` records `db-1` and sends it to User B over Yjs. 
When User B's machine runs the command, it **must** create the exact same node with the exact same ID so their canvases remain synchronized. User B's machine will call `createNode({ kind: 'database', forceId: 'db-1' })`, bypassing the `nextId` generator entirely to guarantee identical state.