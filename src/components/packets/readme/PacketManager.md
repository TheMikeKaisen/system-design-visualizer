Let's go through this file completely. Before reading a single line of code, you need to understand what problem this file exists to solve.

---

## Why does PacketManager exist?

Think about what needs to happen every single frame of the simulation:

1. Packets need to move forward along their paths
2. New packets (whose paths just came back from the Web Worker) need to be added
3. Packets that have arrived need to be marked as done
4. Every visible packet needs a Pixi sprite positioned at the right place on screen

None of this can happen in React. React re-renders when state changes — it is event-driven. Animation is time-driven — it needs to run code every 16 milliseconds whether anything changed or not.

`PacketManager` is the bridge between the React world (Zustand state, component lifecycle) and the time-driven world (Pixi's 60fps loop). It lives as a React component so it can use hooks and manage its own cleanup, but it renders nothing — it is pure side-effect machinery.

---

## The file imports — what each one is for

```typescript
import { useEffect, useRef } from "react";
```

`useEffect` — runs code after the component mounts, and cleans it up when it unmounts. Every resource `PacketManager` creates (the engine, the ticker, the interval) lives inside a `useEffect` so it's automatically destroyed when the component is removed from the page.

`useRef` — stores a mutable value that persists across re-renders without causing re-renders. This is critical. If we stored `engineRef` in `useState`, every time the engine changed React would re-render the component. We don't want that — the engine is internal machinery, not UI state.

```typescript
import type { Application, Container } from "pixi.js";
import { Ticker } from "pixi.js";
```

`Application` — the Pixi app object. We receive it as a prop but don't use it directly in this file (it's there for future use).

`Container` — a Pixi scene graph node that can hold children. The `packetStage` prop is a Container — all packet sprites are added as children of it.

`Ticker` — Pixi's game loop. It calls your callback every frame, passing timing information. Think of it as `setInterval` but synchronized with the browser's animation frame (so it always runs at exactly the right time for smooth animation).

```typescript
import { PacketSprite } from "./PacketSprite";
```

The visual representation of a single packet. `PacketManager` creates and destroys these. It doesn't know how they draw themselves — that's `PacketSprite`'s job.

```typescript
import { SimulationEngine } from "@/lib/simulation/SimulationEngine";
```

The pure simulation logic class. It decides how fast packets move, when they arrive, when they spawn. It receives state as arguments and returns a diff — it never touches Zustand itself.

```typescript
import { useSimulationStore } from "@/lib/store/useSimulationStore";
import { useCanvasStore } from "@/lib/store/useCanvasStore";
```

The two Zustand stores. Note something important: these are imported but `PacketManager` does NOT use them as React hooks (`useSimulationStore(selector)`). It reads them imperatively inside the ticker loop with `.getState()`. This is intentional — hooks would cause re-renders, imperative reads don't.

```typescript
import { interpolatePath } from "@/lib/simulation/coordinateBridge";
import type { PathMetrics } from "@/lib/simulation/coordinateBridge";
```

`interpolatePath` — given a path and a progress value between 0 and 1, returns the exact world-space `{x, y}` position the packet is at. For example, if progress is `0.5`, the packet is exactly halfway along its path.

`PathMetrics` — the pre-computed path data. Contains the waypoints, the length of each segment, and the total path length. Pre-computed so we never do expensive math inside the render loop.

---

## The props

```typescript
interface PacketManagerProps {
  app: Application;
  packetStage: Container;
}
```

`PacketManager` receives two things from its parent (`SimulationOverlay`):

- `app` — the Pixi Application (available for future use)
- `packetStage` — the specific Pixi Container where packet sprites should live. This Container's transform is already synchronized with the React Flow viewport by `PixiBridge`, so anything drawn inside it automatically appears at the correct position on the canvas.

---

## The refs — why three of them

```typescript
const engineRef     = useRef<SimulationEngine | null>(null);
const spritesRef    = useRef<Map<string, PacketSprite>>(new Map());
const pathMetricsRef = useRef<Map<string, PathMetrics>>(new Map());
```

These three refs are the memory of `PacketManager`. They persist for the entire lifetime of the component, they never cause re-renders, and they are accessible from inside any `useEffect` callback without stale closure issues.

**`engineRef`** — holds the `SimulationEngine` instance. Created once on mount, destroyed on unmount.

**`spritesRef`** — a Map from packet ID to its `PacketSprite` object. When a new packet appears, we add an entry. When a packet is done, we destroy and remove the entry. This is the Pixi side of packet state.

**`pathMetricsRef`** — a Map from packet ID to its `PathMetrics`. This is the most important one architecturally. Paths are NOT in Zustand (we went through why — too expensive). They live here, in a plain JavaScript Map, never serialized, never diffed by React. The engine calls `onPathReady` when a worker response arrives and that callback puts the metrics here.

---

## `useEffect` block 1 — Bootstrap

```typescript
useEffect(() => {
  const config = useSimulationStore.getState().config;

  engineRef.current = new SimulationEngine(
    config.routingStrategy,
    (packetId, metrics) => {
      pathMetricsRef.current.set(packetId, metrics);
    }
  );

  return () => {
    engineRef.current?.destroy();
    engineRef.current = null;
    pathMetricsRef.current.clear();
  };
}, []);
```

The empty array `[]` means this runs exactly once — when `PacketManager` first mounts.

It creates the `SimulationEngine` with two arguments:

First: `config.routingStrategy` — which routing algorithm to start with (Round Robin, Least Connections, etc.).

Second: a callback function `(packetId, metrics) => { ... }`. This is `onPathReady`. Read this carefully — it's a closure. When the Web Worker finishes calculating a path, the engine calls this function. The function receives the packet's ID and its pre-computed path metrics. It stores them in `pathMetricsRef`. This is the only way path data gets into the system.

The return function is the cleanup. When `PacketManager` unmounts, the engine is destroyed (which terminates the Web Worker and clears all internal state), and the metrics map is cleared. No memory leaks.

---

## `useEffect` block 2 — Hot-swap strategy

```typescript
useEffect(() => {
  return useSimulationStore.subscribe(
    (s) => s.config.routingStrategy,
    (strategy) => engineRef.current?.setStrategy(strategy)
  );
}, []);
```

This listens for changes to the routing strategy in the store. When the user switches the dropdown from "Round Robin" to "Least Connections", this callback fires and calls `engine.setStrategy()`, which swaps out the strategy object inside the engine instantly.

It returns the unsubscribe function directly — `useEffect` cleanup calls whatever function the effect returned. So when `PacketManager` unmounts, this subscription is automatically removed.

---

## `useEffect` block 3 — Pruning

```typescript
useEffect(() => {
  const interval = setInterval(() => {
    const liveIds = new Set(
      Object.keys(useSimulationStore.getState().packets)
    );
    for (const id of pathMetricsRef.current.keys()) {
      if (!liveIds.has(id)) pathMetricsRef.current.delete(id);
    }
    useSimulationStore.getState().pruneFinishedPackets();
  }, 1000);
  return () => clearInterval(interval);
}, []);
```

This runs every second. It does two things:

**Clean up stale path metrics.** The simulation store prunes arrived/dropped packets. But `pathMetricsRef` is a separate Map that Zustand doesn't know about. If we never cleaned it up, it would grow forever — every packet that ever existed would have its metrics sitting in memory. We compare the live packet IDs in Zustand to the IDs in `pathMetricsRef` and delete anything that no longer has a corresponding packet.

**Prune finished packets from Zustand.** `pruneFinishedPackets()` removes packets with status `"arrived"` or `"dropped"` from the store. We do this once per second rather than immediately — it lets the sprites linger briefly for a visual fade-out before being removed.

The return `() => clearInterval(interval)` prevents the interval from running after the component unmounts.

---

## `useEffect` block 4 — The Pixi Ticker (the heart of the file)

This is the most important block. Read it slowly.

```typescript
useEffect(() => {
  const ticker = new Ticker();
  ticker.maxFPS = 60;

  ticker.add(() => {
```

We create a new Pixi `Ticker`. `maxFPS = 60` caps it at 60 frames per second. The callback we pass to `ticker.add()` runs every frame.

```typescript
    const engine = engineRef.current;
    if (!engine) return;
```

Guard: if the engine hasn't been created yet (extremely rare race condition on first frame), skip this frame entirely.

```typescript
    const simState    = useSimulationStore.getState();
    const canvasState = useCanvasStore.getState();
    if (!simState.isRunning) return;
```

Read both stores imperatively. No hooks. No subscriptions. Just direct reads — fast, zero re-render impact. If the simulation isn't running, skip everything.

```typescript
    // 1. Drain any packets that arrived since the last tick
    const newPackets = engine.drainNewPackets();
    for (const p of newPackets) {
      simState.addPacket(p);
    }
```

The engine buffers new packets internally as they come back from the Web Worker. `drainNewPackets()` takes them all out of that buffer and adds them to the Zustand store. This is called "draining" — you empty the buffer on each frame. After this call, the buffer is empty until more Worker responses arrive.

```typescript
    // 2. Run the pure tick — receive a diff
    const diff = engine.tick(
      ticker.deltaMS,
      simState.packets,
      pathMetricsRef.current,
      canvasState.nodes,
      canvasState.edges,
      simState.config
    );
```

This is where the simulation physics happen. We pass everything the engine needs:

- `ticker.deltaMS` — how many milliseconds since the last frame (typically ~16ms at 60fps)
- `simState.packets` — the current snapshot of all packets and their progress values
- `pathMetricsRef.current` — the Map of pre-computed path data
- `canvasState.nodes` and `canvasState.edges` — the graph topology
- `simState.config` — packets per second, routing strategy, source node IDs

The engine returns a `diff` object — a description of what changed. It does NOT mutate anything itself.

```typescript
    // 3. Apply the diff to the store in one batch
    for (const [id, progress] of diff.progressUpdates) {
      simState.updatePacketProgress(id, progress);
    }
    for (const id of diff.arrivedIds) simState.markPacketArrived(id);
    for (const id of diff.droppedIds) simState.markPacketDropped(id);
```

Apply the diff. Each packet's progress gets updated with its new position (a number from 0 to 1). Arrived packets get marked as arrived. Dropped packets get marked as dropped. These are small, targeted Zustand mutations.

```typescript
    // 4. Sync Pixi sprites
    syncSprites(
      simState.packets,
      pathMetricsRef.current,
      packetStage,
      spritesRef.current
    );
  });

  ticker.start();
  return () => { ticker.stop(); ticker.destroy(); };
}, [packetStage]);
```

After state is updated, sync the visual layer. Then start the ticker. Cleanup: stop and destroy the ticker when the component unmounts or `packetStage` changes.

The dependency `[packetStage]` means: if the Pixi Container we're drawing into changes, recreate the ticker with the new container.

---

## The `syncSprites` function

This is a reconciler — conceptually very similar to what React does for the DOM, but for Pixi sprites.

```typescript
function syncSprites(
  packets: Record<string, Packet>,
  metrics: Map<string, PathMetrics>,
  stage: Container,
  sprites: Map<string, PacketSprite>
): void {
```

It takes four arguments: the current packet state from Zustand, the path metrics, the Pixi container to draw in, and the current sprite map.

```typescript
  const liveIds = new Set(
    Object.entries(packets)
      .filter(([, p]) => p.status === "traveling")
      .map(([id]) => id)
  );
```

First: build a Set of IDs that should currently have visible sprites. Only `"traveling"` packets are visible — arrived and dropped packets are not.

```typescript
  // Create sprites for new packets
  for (const id of liveIds) {
    if (!sprites.has(id)) {
      const sprite = new PacketSprite(packets[id]);
      stage.addChild(sprite.container);
      sprites.set(id, sprite);
    }
  }
```

For every packet that should be visible: if we don't already have a sprite for it, create one. `stage.addChild()` puts it into the Pixi scene graph — it will now be rendered.

```typescript
  // Update or destroy
  for (const [id, sprite] of sprites) {
    if (!liveIds.has(id)) {
      sprite.destroy();
      sprites.delete(id);
      continue;
    }
```

For every sprite we currently have: if it's no longer in `liveIds` (packet has arrived, was dropped, or was pruned), destroy the sprite (removes it from the Pixi scene and frees GPU memory) and remove it from our Map.

```typescript
    const packet = packets[id];
    const m = metrics.get(id);
    if (!m) continue;

    const prevProgress = Math.max(0, packet.progress - 0.015);
    const curr = interpolatePath(m, packet.progress);
    const prev = interpolatePath(m, prevProgress);

    sprite.update(curr.x, curr.y, prev.x, prev.y);
  }
}
```

For every sprite that is still alive: calculate its current world-space position using `interpolatePath`. Also calculate where it was just a tiny bit earlier (`progress - 0.015`). This gives us a direction vector — we pass both current and previous positions to `sprite.update()` so the trail knows which direction to point.

`interpolatePath(m, packet.progress)` converts a single number (0 to 1) into an `{x, y}` world-space coordinate by walking along the path segments. If the packet is 50% of the way along a path from `{x:100}` to `{x:500}`, this returns `{x:300}`.

These are world-space coordinates. The Pixi Container's transform (applied by `PixiBridge`) converts them to screen coordinates automatically. `PacketManager` never needs to know what the zoom level is.

---

## The full data flow, one more time

Here is everything that happens in one frame, from top to bottom:

```
Pixi Ticker fires (every ~16ms)
│
├─ drainNewPackets()
│   └─ Worker responses that arrived since last frame
│   └─ Each new packet added to Zustand
│
├─ engine.tick()
│   └─ Reads: packets, pathMetrics, nodes, edges, config
│   └─ Advances every traveling packet by (speed × deltaMs)
│   └─ Checks if any packets have arrived (progress >= 1)
│   └─ Spawns new packets if time has elapsed
│   └─ Returns diff: {progressUpdates, arrivedIds, droppedIds}
│
├─ Apply diff to Zustand
│   └─ updatePacketProgress for each moving packet
│   └─ markPacketArrived for each arrived packet
│   └─ markPacketDropped for each dropped packet
│
└─ syncSprites()
    └─ For each traveling packet:
    │   └─ If no sprite exists → create PacketSprite, add to Pixi stage
    │   └─ If sprite exists → call sprite.update(curr, prev)
    │       └─ interpolatePath converts progress → world {x,y}
    │       └─ PacketSprite moves to that position
    │       └─ Trail drawn in direction of movement
    └─ For each sprite whose packet is gone → destroy sprite
```

The whole thing runs 60 times per second, completing in under 1 millisecond for typical diagrams. The main thread stays free. The user can drag nodes, draw edges, and type — none of it is interrupted.

---

## The one thing to really internalize

`PacketManager` sits at the exact boundary between three worlds:

- **React world** (component lifecycle, hooks, `useEffect`)
- **Zustand world** (state, diffs, updates)
- **Pixi world** (sprites, containers, ticker)

None of these worlds know about each other. React doesn't know Pixi exists. Pixi doesn't know Zustand exists. Zustand doesn't know React Flow exists. `PacketManager` is the only file that knows all three, and its job is to translate between them on every frame. That's why it exists as its own file — it has a single, clearly bounded responsibility.