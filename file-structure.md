```sh
system-design-visualizer
└── src
    ├── app
    │   ├── favicon.ico
    │   ├── globals.css
    │   ├── layout.tsx
    │   └── page.tsx
    ├── components
    │   ├── canvas
    │   │   ├── PixiBridge.tsx
    │   │   └── SimulationOverlay.tsx
    │   ├── nodes
    │   ├── packets
    │   ├── toolbar
    │   └── ui
    ├── hooks
    ├── lib
    │   ├── patterns
    │   │   ├── commands
    │   │   │   ├── AddNodeCommand.ts
    │   │   │   ├── CommandInvoker.ts
    │   │   │   └── ICommand.ts
    │   │   └── strategies
    │   │       ├── IRoutingStrategy.ts
    │   │       ├── LeastConnectionsStrategy.ts
    │   │       └── RoundRobinStrategy.ts
    │   ├── simulation
    │   ├── store
    │   │   └── useCanvasStore.ts
    │   └── workers
    └── types
        └── index.ts

18 directories, 14 files
```