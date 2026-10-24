# System Simulator — Architecture & Design Decisions Log

This document serves as the single source of truth for architectural, UI/UX, reliability, and engineering decisions made during the System Simulator audit and refactoring. All AI agents and engineers working on subsequent stages must consult and append to this log.

---

## Decision Record 001: Priority 1 — Defensive Step Indexing & Crash Prevention (JS-HIGH-02)
- **Status**: Approved & Implemented
- **Category**: Runtime Reliability
- **Problem**:
  Shared visualization panels (`ExecutionContextPanel`, `CallStackPanel`, `CodePanel`, `ConsolePanel`, etc.) unconditionally read `scenario.steps[currentStepIndex].*` without fallback guards. If a step is temporarily undefined during rapid user clicking or scenario transitions, the page crashes with `TypeError: Cannot read properties of undefined`.
- **Decision & Implementation**:
  - Implemented clamp-based defensive fallback resolution across all 11 shared panel components (`ExecutionContextPanel`, `CallStackPanel`, `CodePanel`, `ConsolePanel`, `WebAPIsPanel`, `MicrotaskQueuePanel`, `CallbackQueuePanel`, `EventLoopIndicator`, `TaskQueuePanel`, `MobileTabbedPanels`, `EventLoopMobilePanels`) using `steps[Math.max(0, Math.min(currentStepIndex, steps.length - 1))] ?? null`.
  - Guaranteed fallback defaults for `callStack`, `webAPIs`, `taskQueue`, `microtaskQueue`, `callbackQueue`, `variables`, and `scopeLookup`.
  - Replaced the render-phase mutation in `MobileTabbedPanels.tsx` with pure derived state (`effectiveTab = activeTab === "queue" && !hasTaskQueue ? "callstack" : activeTab`), eliminating React purity violations.
- **Blast Radius**: Zero (internal safety guards, completely backward-compatible).

---

## Decision Record 002: Priority 2 — State & Auto-Play Cleanup on Navigation (JS-MED-01, JS-BUG-03)
- **Status**: Approved & Implemented
- **Category**: State Management & Lifecycle
- **Problem**:
  The global Zustand store persists active auto-play and step state across routes. Navigating away during auto-play leaves the play loop active, which can resume unprompted upon re-entering the lesson. Navigating between episodes causes a 1-frame flash of the previous episode's code and variables.
- **Decision & Implementation**:
  - Implemented the "Fresh Start" navigation model: when leaving any episode or returning to it, playback is guaranteed paused (`isPlaying: false`) and step index resets to 0 (`currentStepIndex: 0`).
  - Added `pause: () => set({ isPlaying: false })` and `resetEpisode: (defaultScenario?) => set(...)` actions to `useJSSimulationStore`.
  - Added unmount lifecycle cleanups (`useJSSimulationStore.getState().reset()`) to all 7 simulator pages (`call-stack`, `hoisting`, `scope`, `let-const`, `block-scope`, `closures`, `event-loop`).
  - Eliminated the 1-frame visual flash on route transitions by immediately deriving the episode's default scenario during render whenever `scenario.id` belongs to another episode.
- **Blast Radius**: Zero (improves navigation predictability without affecting on-page simulations).

---

## Decision Record 003: Step Explanation UI/UX & Space Optimization (Ep 5 vs Ep 7)
- **Status**: Approved & Implemented
- **Category**: UI/UX, Component Reusability & Space Optimization
- **Subject**: Episode 5 vs. Episode 7 Popups and Explanations
- **Core Insights**:
  1. **UI Discrepancy**:
     - Episodes 1–6 docked explanations statically at the bottom of `CodePanel`, with Episode 5 adding a sleek, floating rounded-full pill (`bg-card border rounded-full px-6 py-3 shadow-xl` with an animated amber pulsing dot) for step toasts, plus a centered dark frosted modal for variable resolution.
     - Episode 7 used a heavy floating banner (`bg-primary/95 text-primary-foreground rounded-xl p-4 shadow-2xl`) that automatically disappeared after 2 seconds.
  2. **Overlap Problem in Episode 7**:
     - Episode 7 features a dense 2-tier layout (Top: Code, Call Stack, Web APIs; Bottom: Queues, Event Loop, Console).
     - Because `StepExplanationPopup` floated absolutely at `top-6`, keeping it permanently visible occluded the top portion of the Call Stack, Code, and Web APIs panels.
  3. **Architectural Direction & Implementation**:
     - Created unified, reusable `StepExplanationBar` (`src/components/javascript/StepExplanationBar.tsx`) utilizing Episode 5's refined design tokens (frosted dark card background `bg-card/90 dark:bg-zinc-900/85 backdrop-blur-md`, subtle border `border-border/60`, animated amber pulsing status indicator dot, uppercase step pill badge, and clear high-contrast typography in `text-sm text-foreground/90 dark:text-zinc-200`).
     - Mounted `StepExplanationBar` directly beneath `<nav>` in normal layout flow (`shrink-0`) across all 7 simulator episodes (`call-stack`, `hoisting`, `scope`, `let-const`, `block-scope`, `closures`, `event-loop`). This delivers 0% panel overlap and full unobstructed vertical height.
     - Removed the `pt-10` layout padding offset in Episode 7 so panels utilize full vertical height.
     - Preserved the previous docked explanation block in `src/components/javascript/CodePanel.tsx` by commenting it out as requested, pending user verification before deletion.
     - Maintained backwards-compatibility by updating `StepExplanationPopup.tsx` to alias `StepExplanationBar`.
- **Blast Radius**: Zero regressions; eliminates floating card occlusion and timer race conditions across all 7 episodes.

---

## Decision Record 004: Reusable Episode Card Primitive & Typed Metadata Architecture
- **Status**: Approved & Implemented
- **Category**: Component Architecture & UI Consistency
- **Problem**:
  - Episode listings on learning path pages (such as JavaScript) were previously hardcoded as repetitious, ~300-line blocks of markup directly in route `page.tsx` files.
  - Repeating raw HTML cards created maintenance friction, visual divergence risks across subjects, and contrast defects (e.g., `text-[10px] text-muted-foreground/60` failing WCAG 2.1 AA standards).
  - Lack of a consistent, color-tokenized card abstraction prevented uniform subject theming (e.g., JavaScript orange/amber vs. Operating Systems teal/pink/violet).
- **Decision & Implementation**:
  - Implemented Option 1 for Episode Configuration: isolated metadata array in `src/app/javascript/episodes.tsx` with a typed `EpisodeMetadata` interface.
  - Implemented Option 1 for Component Architecture: built a reusable, accessible primitive in `src/components/ui/EpisodeCard.tsx` and refactored `src/app/javascript/page.tsx` with zero blast radius outside JavaScript.
  - Integrated tokenized subject theming: supported accent presets (`amber` [default for JS], `yellow`, `orange`, `teal`, `cyan`, `sky`, `blue`, `indigo`, `green`, `emerald`, `pink`, `purple`, `violet`, `rose`) that uniformly style hover borders, shadows, icon containers, title hover transitions, and the "Launch" CTA button.
  - Implemented robust episode label formatting supporting numbers, string numbers (`"5"` -> `"Episode 5"`), and pre-formatted strings (`"Episode 5"` -> `"Episode 5"`), with clean header rendering when episode numbers or badges are absent.
  - Ensured WCAG 2.1 AA accessible names without trailing colons and upgraded badge typography to `text-xs font-semibold text-muted-foreground`.
  - Preserved exact micro-interactions (icon `group-hover:scale-110`, arrow `group-hover:translate-x-0.5`).
  - Added comprehensive unit test suite `src/components/ui/__tests__/EpisodeCard.test.tsx` covering all variants, props configurations, accessible labels, string formatting, and color presets.
  - Resolved TypeScript empty-interface ESLint errors in `src/components/ui/Input.tsx` and `src/components/ui/NativeSelect.tsx` to ensure `npx eslint src/components/ui` passes cleanly.
- **Blast Radius**: Zero outside `src/app/javascript`, `src/components/ui`, and newly created `EpisodeCard` primitive.

---

## Decision Record 005: Brand Identity Modernization — The Isometric Strata & Core (Stage 1)
- **Status**: Implemented & Verified
- **Category**: Brand Identity & Visual Language
- **Problem**:
  - The previous logo was an overly generic 1-to-2 network router graph, and the sign-in page used an inconsistent 4-square icon with the legacy name `sysvis`.
  - The product had fragmented naming (`System Design Visualizer`, `sysvis`, `System Simulator`), whereas the canonical product identity is `System Simulator` (matching `systemsimulator.vercel.app`).
  - The visual identity needed to communicate the platform's multi-layered simulation scope (JavaScript runtime, OS kernel/processes, JVM architecture, frontend DOM reconciliation, and distributed system canvas) with editorial, Awwwards-tier geometric precision rather than neon/cyberpunk clichés.
- **Decision & Implementation**:
  - **Logo Geometry ("The Isometric Strata & Core")**:
    - Modeled an isometric coordinate system (`dx: 11, dy: 6.25`, corresponding to an exact ~30-degree isometric projection angle within a 32x32 bounding box).
    - Structured into 3 stratified computational tiers:
      1. Top facet (Application / Execution Context): `M 16 3.25 L 27 9.5 L 16 15.75 L 5 9.5 Z` with crisp 1.75px stroke.
      2. Middle shelf (Runtime & Kernel / Memory Strata): `M 5 16 L 16 22.25 L 27 16` with 1.25px stroke and 0.55 opacity.
      3. Base chassis & spine (Infrastructure Substrate): `M 5 9.5 V 22.5 L 16 28.75 L 27 22.5 V 9.5` and `M 16 15.75 V 28.75`.
    - Integrated an active execution nucleus at the focal top aperture: an amber diamond (`polygon points="16,6.25 21,9.5 16,12.75 11,9.5"` with `className="fill-amber-500 dark:fill-amber-400"`) anchored by a white spark core (`circle cx="16" cy="9.5" r="1.5"`).
  - **Standardized Component**:
    - Updated [`src/components/ui/Logo.tsx`](file:///C:/Users/computer/Downloads/system-design-visualizer/system-design-visualizer/src/components/ui/Logo.tsx) with backward-compatible `size?: number` and `className?: string` props.
  - **Unified Auth & Brand Heading**:
    - Updated [`src/app/auth/sign-in/page.tsx`](file:///C:/Users/computer/Downloads/system-design-visualizer/system-design-visualizer/src/app/auth/sign-in/page.tsx) to import `<Logo size={28} />` and display `System Simulator`, removing the redundant inline `LogoIcon`.
  - **Automated Verification**:
    - Created unit test suite [`src/components/ui/__tests__/Logo.test.tsx`](file:///C:/Users/computer/Downloads/system-design-visualizer/system-design-visualizer/src/components/ui/__tests__/Logo.test.tsx) testing default sizing, custom dimensions, class forwarding, and amber nucleus coordinates.
    - Verified all 35 test files (266 tests) pass cleanly; `tsc` and `eslint` pass with 0 errors.
- **Blast Radius**: Zero regressions; backwards-compatible across all 24 existing header and toolbar call-sites.

---

## Decision Record 006: Hero Interactive Multi-Discipline Runtime Sandbox (Stage 2)
- **Status**: Implemented & Verified
- **Category**: Landing Page Architecture & Multi-Discipline Demonstration
- **Problem**:
  - The previous landing page hero only displayed an abstract SVG diagram of distributed system canvas nodes, misrepresenting the platform as primarily a diagramming tool.
  - The platform's true core differentiator is its 33 interactive, multi-discipline runtime simulators (JavaScript execution contexts, Operating Systems kernel & CPU schedulers, Java JVM bytecode & memory models).
  - Users needed an instant, tangible sandbox in the hero that demonstrates these execution runtimes with tactile controls and idle auto-cycling.
- **Decision & Implementation**:
  - **Component Architecture (`src/components/landing/HeroRuntimeSandbox.tsx`)**:
    - Built a high-performance, self-contained interactive sandbox spanning 3 disciplines:
      1. **JavaScript**: Call Stack lifecycle, TDZ creation phase, closure capture (`makeCounter() -> increment()`), and scope chain lookup.
      2. **Operating Systems**: Round-Robin CPU scheduling, time quantum expiration (20ms), PCB context switching, and I/O wait queue blocking.
      3. **Java & JVM**: Stack frames, Eden space heap allocation (`new User("Alice")`), reference pointers (`0x7A4F`), and method invocation.
    - Follows all 7 Simulation Rules in `AGENTS.md`:
      - Rule 1: Discrete step-by-step data model.
      - Rule 2: Transparency rendering for collections (showing inactive frames/queues dimmed).
      - Rule 3: Deterministic keys (`${tab.id}-${item.id}`).
      - Rule 4: Hardcoded terminal typography (`text-zinc-200`, `text-zinc-400`, `bg-[#0b0c0f]`).
      - Rule 5: Multi-modal feedback (step badge, banner explanation, line highlight, state indicator).
      - Rule 6: Engine initialization lifecycle (empty stack at step 0).
      - Rule 7: Two-phase context creation (TDZ creation before assignment).
  - **Idle Auto-Cycling**:
    - Automatically advances through tabs every 8 seconds when idle, showing an animated hairline progress indicator.
    - Seamlessly pauses when hovered or interacted with, and supports manual step scrubbing (`Prev`, `Next`, `Reset`) and continuous internal playback (`Step Run / Pause`).
  - **Automated Verification**:
    - Created unit test suite [`src/components/landing/__tests__/HeroRuntimeSandbox.test.tsx`](file:///C:/Users/computer/Downloads/system-design-visualizer/system-design-visualizer/src/components/landing/__tests__/HeroRuntimeSandbox.test.tsx) testing default JS state, tab switching, step navigation, reset, internal play/pause, idle auto-cycle, and hover pause.
    - Verified all 36 test files (274 tests) pass; `tsc` and `eslint` clean (0 errors, 0 warnings).
- **Blast Radius**: Zero (isolated new component ready to be mounted in the redesigned hero).

---

## Decision Record 007: Editorial Landing Page Redesign & Architectural Capstone Rebalance (Stage 3)
- **Status**: Implemented & Verified
- **Category**: Product Positioning, UI/UX & Landing Page Redesign
- **Problem**:
  - The legacy landing page was 88% weighted toward the Canvas Studio and only advertised Java while displaying dummy "Coming Soon" locks for other topics, completely hiding the 33 live interactive simulations across JavaScript, Operating Systems, Java/JVM, Frontend Architecture, and Backend Internals.
  - The visual hierarchy lacked Awwwards-caliber editorial polish, relying on generic neon purple accents and stock SVG diagrams rather than tactile computational demonstrations.
- **Decision & Implementation**:
  - **Hero Rebalance with Embedded Runtime Sandbox**:
    - Featured the new headline: *"Understand systems from the inside out."*
    - Mounted [`HeroRuntimeSandbox`](file:///C:/Users/computer/Downloads/system-design-visualizer/system-design-visualizer/src/components/landing/HeroRuntimeSandbox.tsx) directly in the hero, showcasing real code syntax, call stack frames, OS process queues, and JVM heap pointers with idle auto-cycling.
    - Set dual CTAs: Primary *"Explore 33 Simulations"* (`/learning-paths`) and Secondary *"Launch Canvas Studio"* (`/canvas`).
  - **Five Core Disciplines Showcase**:
    - JavaScript (7 episodes • `/javascript`), Operating Systems (7 episodes • `/operating-systems`), Java/JVM (9 episodes • `/java`), Frontend Architecture (7 episodes • `/frontend`), and Backend Internals (3 episodes • `/backend`).
    - Every discipline card displays exact episode counts, topic tag pills, and direct launch links.
    - Added a 6th Master Directory card linking to `/learning-paths`.
  - **Simulation Mechanics Editorial Section**:
    - Articulated the 4 core engineering principles: Strict Two-Phase Execution, Transparent Abstractions, Live Memory Pointers, and Hardware Interrupt Modeling.
  - **Architectural Capstone Rebalance**:
    - Repositioned the Canvas Studio as the architectural summit: *"Once you master component internals, assemble distributed systems at scale."*
    - Highlighted 20+ cloud node types, Token Bucket rate limiting, Circuit Breaker state machines, and real-time multiplayer Yjs collaboration.
  - **Brand & Metadata Synchronization**:
    - Updated [`src/app/layout.tsx`](file:///C:/Users/computer/Downloads/system-design-visualizer/system-design-visualizer/src/app/layout.tsx) with canonical branding: *"System Simulator — Interactive Computational & System Design Runtimes"*.
    - Updated navigation and footer with the new *"Isometric Strata & Core"* [`Logo`](file:///C:/Users/computer/Downloads/system-design-visualizer/system-design-visualizer/src/components/ui/Logo.tsx).
  - **Automated Verification**:
    - Created [`LandingPage.test.tsx`](file:///C:/Users/computer/Downloads/system-design-visualizer/system-design-visualizer/src/components/landing/__tests__/LandingPage.test.tsx) verifying navigation, hero headline, all 5 discipline links, metrics, and footer.
    - Verified `npx tsc --noEmit` (0 errors), `npx eslint` (0 errors), all 37 Vitest test suites (278 tests passing), and full Next.js production build (`npm run build` compiling all 49 static & dynamic routes).
- **Blast Radius**: Zero regressions.





