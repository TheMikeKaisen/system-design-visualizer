
At a high level, **`SimulationEngine.ts` is the "brain" of your network simulation.** 

It handles the pure logic of how packets move, where they go, and when they are destroyed. Crucially, it is designed to be **stateless relative to the UI**—it receives data from your Zustand stores, calculates what should happen next, and returns a "diff" for the `PacketManager` to apply.

Here are the four main things it does:

### 1. The 60FPS "Heartbeat" (`tick`)
The `tick()` function is called every single frame. It takes the current state of the world (nodes, edges, active packets) and returns a `SimulationTickResult` containing:
*   Which packets moved (and their new `0.0` to `1.0` progress).
*   Which packets reached their destination.
*   Which packets were "dropped" (simulating network errors).

### 2. Intelligent Routing (`RoutingStrategy`)
When a packet is spawned, the engine decides which node it should go to. It uses a **Strategy Pattern** to swap between different behaviors:
*   **Round Robin**: Cycle through targets equally.
*   **Least Connections**: Send traffic to the node with the fewest active connections.
*   **Weighted**: Send traffic based on node "weight" (capacity).

### 3. Background Pathfinding (Web Workers)
Calculating the exact pixel-path between nodes (avoiding obstacles or following edges) can be computationally expensive. The engine offloads this to a **Web Worker** so that the main UI thread never stutters, even with hundreds of packets.

### 4. Traffic Generation (`spawnPackets`)
It tracks how much time has passed to decide when to "spawn" a new packet based on your `packetsPerSecond` setting. It uses an **accumulator** (like a small water tank that fills up) to ensure that if you set "0.5 packets per second," a packet is perfectly created every 2 seconds.

### Why it's built this way:
By keeping this logic in a separate class without any React or Pixi code, you can test the "math" of your simulation independently of the visuals. This is what allows your app to scale to complex diagrams without slowing down.