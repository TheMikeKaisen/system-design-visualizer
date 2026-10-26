# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users
- **Primary Audience:** Software engineers, computer science students, and interview candidates seeking deep, dependable mental models of low-level runtime mechanics (execution contexts, event loop, CPU scheduling, JVM memory allocation) and distributed systems architectures.
- **Secondary Audience:** Technical educators, engineering leads, and distributed systems architects demonstrating, teaching, or verifying system behavior under load.
- **User Situation:** Self-paced deep learning, university coursework accompaniment, technical/systems interview preparation, or interactive architectural exploration.

## Product Purpose
System Simulator transforms abstract, invisible Computer Science concepts and distributed system mechanics into tactile, deterministic, real-time visual simulations. It exists because standard CS instruction relies on static diagrams and text for systems that are inherently dynamic and behavioral. Success means learners bridge the gap between knowing definitions and grasping operational behavior through stepping, scrubbing, and inspecting state transitions.

## Positioning
Unlike static diagramming tools (Excalidraw, Eraser) that produce inert boxes and arrows, and unlike pre-recorded video lectures or toy-grade animators, System Simulator delivers:
1. **Faithful low-level execution engines:** Deterministic, discrete step-by-step state models adhering to real engine mechanics (TDZ variable creation before assignment, round-robin CPU context switching with time-quantum expiration, JVM heap pointer references).
2. **WebGL-accelerated live distributed simulation:** Interactive React Flow canvas coupled with 60 FPS PixiJS packet flows reflecting real routing policies (Round Robin, Least Connections), token bucket rate limiting, circuit breaker state machines, and real-time multiplayer Yjs collaboration.

## Operating Context
- **Learning & Study Workflows:** Stepping forward/backward through code scenarios with active syntax highlights, call stacks, memory heap allocations, and synchronized step explanations.
- **Architectural Design Workflows:** Dragging distributed nodes (Clients, Load Balancers, Services, Caches, Databases, Queues) onto a freeform canvas, wiring edges, configuring node parameters, and running dynamic traffic simulations.
- **Device & Environment:** Modern desktop and tablet browsers (zero installation, zero dependencies), with responsive support for mobile review. Keyboard-first accessibility (Space, Arrow keys, R) and dark-mode-first editorial aesthetics.

## Capabilities and Constraints
- **Core Disciplines:** 33+ interactive simulation modules across 5 foundational tracks:
  - JavaScript Internals (Call Stack, Hoisting, Scope Chain, Let/Const TDZ, Block Scope, Closures, Event Loop)
  - Operating Systems (Process States, PCB, CPU Scheduling, Concurrency, Mutexes/Locks)
  - Java & JVM Architecture (Flow of Execution, Class Loading, Memory Model)
  - Frontend Architecture (DOM reconciliation, Rendering cycles)
  - Backend Internals (API Gateways, connection pooling, cache-aside)
- **Architectural Capstone (Canvas Studio):** Live distributed system simulator supporting 20+ cloud node types, real-time WebGL packet rendering, latency/throughput telemetric HUD, and CRDT multiplayer synchronization.
- **Strict Simulation Architecture Guardrails (Rule #4):** Data-driven state isolation (`SimulationScenario`), complete collection transparency rendering, deterministic composite React keys, explicit terminal theming, multi-modal feedback vectors, empty-to-empty call stack lifecycle, and two-phase context creation.
- **Authentication & Access Boundary:** Frictionless open-access default — all interactive curriculum simulators and canvas experimentation require no sign-in. NextAuth and Prisma persistence are reserved for saving custom diagrams, cloud synchronization, and collaborative workspaces.

## Brand Commitments
- **Canonical Product Name:** `System Simulator` (domain: `systemsimulator.vercel.app`).
- **Brand Geometry & Mark:** *The Isometric Strata & Core* — 30-degree isometric triple-layer chassis (Application, Kernel/Runtime, Substrate) anchored by an active amber execution nucleus and spark core.
- **Editorial Voice:** Direct, rigorous, and intellectually honest. Avoid marketing hype, cartoon gamification, or simplified metaphors that distort computer science reality.
- **Discipline Accent System:** Strictly tokenized per subject: JavaScript (`amber`), Operating Systems (`sky`), Java/JVM (`emerald`), Frontend Architecture (`violet`), Backend Internals (`blue`).

## Evidence on Hand
- **Curriculum Implementation:** 49 compiled Next.js App Router routes across `/javascript`, `/operating-systems`, `/java`, `/frontend`, `/backend`, and `/learning-paths`.
- **Canvas Implementation:** Live WebGL PixiJS canvas sandbox in `src/components/canvas` and `src/components/landing/MiniDistributedCanvas.tsx`.
- **Engineering Decisions:** 24 documented and verified architectural decision records in `DecisionsAndAnalysis/decisions.md`.
- **Automated Verification:** 47 Vitest test suites (426+ unit tests passing), 0 TypeScript errors (`tsc --noEmit`), 0 ESLint errors.

## Product Principles
1. **Faithful to Reality:** Never simplify a mental model into a metaphor that teaches the wrong intuition; execution states must mirror real language runtimes and kernel mechanics.
2. **Total State Inspectability:** Make the invisible visible — every stack frame, pointer address, queue transition, and CPU register state can be scrubbed, paused, and examined.
3. **Frictionless Intuition:** Learning should begin with zero setup friction; the user should be interacting with code or distributed systems within seconds of landing on the platform.
4. **Pedagogical Continuity:** Connect micro to macro — understanding begins at single-function execution and scales seamlessly into distributed system topologies.

## Accessibility & Inclusion
- Full compliance with WCAG 2.1 AA standards for color contrast, interactive touch targets, and typography readability.
- Complete keyboard navigation across all simulation controls (`Space` for Play/Pause, `ArrowRight`/`ArrowLeft` for Step Scrubbing, `R` for Restart).
- System-wide `prefers-reduced-motion` adherence: background circuit paths, animated packet transitions, and gradient shimmers automatically collapse to calm resting states when motion reduction is requested.
