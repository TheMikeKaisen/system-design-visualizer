# Simulation Architecture Diagram

This diagram visualizes how the different layers of the application—React Flow, Zustand, the core simulation engine, and PixiJS—interact with one another via the `PacketManager`.

```mermaid
flowchart TD
    %% Styling Classes
    classDef react fill:#3b82f6,stroke:#fff,stroke-width:2px,color:#fff,rx:5px,ry:5px
    classDef store fill:#eab308,stroke:#fff,stroke-width:2px,color:#000,rx:5px,ry:5px
    classDef pixi fill:#ec4899,stroke:#fff,stroke-width:2px,color:#fff,rx:5px,ry:5px
    classDef pure fill:#22c55e,stroke:#fff,stroke-width:2px,color:#fff,rx:5px,ry:5px
    classDef worker fill:#f97316,stroke:#fff,stroke-width:2px,color:#fff,rx:5px,ry:5px

    subgraph ReactLayer ["React & State Layer"]
        ReactFlow["React Flow<br/>(Draws DOM Nodes & Edges)"]:::react
        ZustandC[("Canvas Store<br/>(Graph Topology)")]:::store
        ZustandS[("Simulation Store<br/>(Live Packet Data)")]:::store
    end

    subgraph BridgeLayer ["Orchestration Layer"]
        PixiBridge["PixiBridge<br/>(Reads React Flow Viewport)"]:::react
        PacketManager["PacketManager<br/>(60FPS Ticker Loop)"]:::react
    end

    subgraph LogicLayer ["Pure Simulation (No UI)"]
        Engine["SimulationEngine<br/>(Calculates Progress)"]:::pure
        Worker["Web Worker<br/>(BFS Pathfinding)"]:::worker
    end

    subgraph PixiLayer ["PixiJS Layer (WebGL)"]
        Stage["packetStage (Container)<br/>(Scaled by PixiBridge)"]:::pixi
        Sprites["PacketSprites<br/>(Circles & Trails)"]:::pixi
    end

    %% State flow
    ZustandC -.->|"Renders"| ReactFlow
    
    %% Viewport Sync
    ReactFlow =="Viewport (x, y, zoom)"==> PixiBridge
    PixiBridge =="Applies Transform"==> Stage

    %% Ticker Loop
    PacketManager -.->|"1. Reads current state"| ZustandC
    PacketManager -.->|"1. Reads current state"| ZustandS
    
    PacketManager == "2. tick(state, deltaMs)" ==> Engine
    Engine == "3. Returns diff (drops, arrivals)" ==> PacketManager
    Engine <-->|"Offloads heavy path math"| Worker

    PacketManager -.->|"4. Updates packet progress"| ZustandS
    PacketManager == "5. syncSprites()" ==> Sprites

    Sprites -.->|"Drawn inside"| Stage
```

## How to read this diagram:

1. **State & React (Top)**: Zustand holds the single source of truth. React Flow just reads the graph topology to draw the boxes.
2. **The 60FPS Loop (Middle)**: The `PacketManager` is the brain of the loop. Every frame (~16ms), it pulls data from the stores and gives it to the `SimulationEngine`.
3. **Pure Logic**: The `SimulationEngine` uses math to figure out where packets should be. It offloads heavy pathfinding to the `Web Worker` so the main thread doesn't freeze. It hands a "diff" back to the manager.
4. **Visuals (Bottom)**: The manager writes the diff to Zustand, then tells the PixiJS `PacketSprites` to move to their new coordinates. `PixiBridge` guarantees that the Pixi canvas lines up perfectly over the React Flow canvas.
