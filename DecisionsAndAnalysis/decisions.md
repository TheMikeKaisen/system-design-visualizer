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
    - Seamlessly pauses when hovered or interacted with, and supports manual step scrubbing (`Prev`, `Next`, `Reset`) and continuous internal playback (`Run / Pause`).
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
    - Set dual CTAs: Primary *"Start Learning"* (`/learning-paths`) and Secondary *"Launch Canvas Studio"* (`/canvas`).
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

---

## Decision Record 008: Comprehensive Editorial Copy Synchronization, Miniature Distributed Topology Centerpiece & Sequential Runtime Sandbox Progression
- **Status**: Implemented & Verified
- **Category**: Editorial Copy, Hero Layout, Runtime Simulation Progression & Canvas Centerpiece
- **Problem**:
  - The hero layout split attention between left-aligned copy and a side preview, which made the runtime visualization feel confined.
  - The runtime sandbox auto-cycled across tabs prematurely after fixed timer intervals without completing the execution steps of the active discipline, leaving visitors unable to grasp the full execution lifecycle.
  - Canvas Studio appeared as a static promotional card rather than an interactive architectural centerpiece connecting component runtimes to distributed scale.
  - Section copy contained inconsistent phrasing and raw module counts ("33 Episodes", "7 Episodes"), conflicting with a unified product narrative: "discover mechanics -> inspect state -> experiment -> develop deep understanding".
- **Decision & Implementation**:
  - **Full-Width Centered Hero & Exact Editorial Copy**:
    - Headline: *"Don't just use software. Understand how it works."* with gradient text accent.
    - Supporting Copy: *"Explore what happens beneath the abstractions — from JavaScript execution and memory allocation to operating system scheduling and distributed systems. Run interactive simulations. Inspect internal state. Learn by experimenting."*
    - Dual CTAs: Primary *"Start Learning"* (`/learning-paths`) and Secondary *"Open Canvas Studio"* (`/canvas`).
    - Positioned `HeroRuntimeSandbox` directly beneath the centered hero headline in a full-width container.
  - **Complete Subject-by-Subject Runtime Sandbox Progression (`HeroRuntimeSandbox.tsx`)**:
    - Configured the continuous execution engine to play through all execution steps of the active subject (Step 0 through Step 5).
    - Upon finishing the final step, it briefly pauses and automatically transitions to the next discipline (JavaScript -> Operating Systems -> Java & JVM -> loop).
    - User interaction (scrubbing buttons, tab clicks, play/pause) instantly halts the auto-cycle and yields full manual control to the user.
  - **Editorial Discipline Showcase (`page-sections.tsx`)**:
    - Section Heading: *"Go beyond the abstractions."*
    - Supporting Copy: *"Every module makes the invisible visible. Step through execution, inspect state transitions, and see how the underlying mechanics shape the software you build."*
    - Strict qualitative labels ("Modules", "All Modules", "Interactive") replacing raw count numbers.
    - Explicit card action labels matching user specifications: *"Explore JavaScript"*, *"Explore Operating Systems"*, *"Explore Java & JVM"*, *"Explore Frontend Systems"*, *"Explore Backend Systems"*.
  - **Simulation Mechanics (`How It Works`)**:
    - Section Heading: *"Every step has a reason."*
    - Supporting Copy: *"These aren't prerecorded animations. Explore computational models that expose how state changes, operations execute, and systems respond to each action."*
    - 4 Core Feature Badges: *"Explicit state transitions"*, *"Inspectable internals"*, *"Deterministic execution"*, *"Transparent models"*.
  - **Canvas Studio as Centerpiece with Miniature Distributed Architecture (`MiniDistributedCanvas.tsx`)**:
    - Heading: *"From a single function to a distributed system."*
    - Supporting Copy: *"Start with the mechanics of a single execution environment. Then explore how services communicate, requests move through a system, and distributed architectures behave under load."*
    - Action CTA: *"Build a System"* (`/canvas`) paired with *"No sign-up required"*.
    - Visual Centerpiece: Interactive distributed topology with 6 connected nodes (Client, Load Balancer, Order Service, Redis Cache, Kafka Event Stream, PostgreSQL Database).
    - Features live packet transit animation (HTTP request -> LB routing -> Service handling -> Redis Cache check & DB write -> Kafka event emission), telemetric latency/throughput HUD, and node inspection on click.
  - **Final CTA**:
    - Heading: *"Curiosity is the starting point. Understanding is the goal."*
    - Copy: *"Pick a concept, run an experiment, and see what happens beneath the surface."*
    - CTAs: *"Explore Learning Paths"* and *"Open Canvas Studio"*.
  - **Negative Space & Layout Rhythm**:
    - Rebalanced padding (`py-20 sm:py-28`) and alternating subtle ambient backgrounds (`bg-background`, `bg-zinc-950/20`, `bg-zinc-950/40`) to create intentional editorial breathing room without excessive empty darkness.
  - **Automated Verification**:
    - All 38 Vitest test suites (282 unit tests) pass 100%.
    - `npx tsc --noEmit` clean with 0 errors.
    - `npx eslint` clean with 0 errors / 0 warnings.
    - Full Next.js production build (`npm run build`) succeeded across all 49 routes.
- **Blast Radius**: Zero regressions; all modifications remain unstaged in the working tree per Rule #1.

---

## Decision Record 009: Unified `<SimulationShell>` Primitive, Global Keyboard Accessibility & Simulator Boilerplate Elimination
- **Status**: Implemented & Verified
- **Category**: Architecture, Accessibility & Component Unification
- **Problem**:
  - The 7 JavaScript simulator pages (`call-stack`, `hoisting`, `scope`, `let-const`, `block-scope`, `closures`, `event-loop`) contained over 1,400 lines of duplicate boilerplate for navigation bars, scenario selectors, playback controls, progress scrubbers, overlay wrappers, and auto-play timers.
  - The simulators had zero keyboard navigation support, failing WCAG 2.1.1 accessibility guidelines.
  - Route `page.tsx` files should never export helper components; an existing helper export (`BackendEpisodeShell` in `backend/episodes/1/page.tsx`) conflicted with Next.js App Router route type checking.
- **Decision & Implementation**:
  - **Unified `<SimulationShell>` (`src/components/javascript/SimulationShell.tsx`)**:
    - Extracted a single declarative wrapper providing:
      1. **Navigation & Scenario Switching**: Brand mark, back navigation link, and scenario title / dropdown listbox with click-outside detection.
      2. **Unified Playback Controls**: Restart, Prev, Play/Pause, and Next buttons with accessible tooltips and ARIA attributes.
      3. **Progress Scrubber**: Interactive step scrubber with percentage progress indicator and click-to-jump tracks.
      4. **Explanation Integration**: Seamlessly mounts `StepExplanationBar` in normal layout flow with zero panel occlusion.
      5. **Global Keyboard Accessibility (WCAG 2.1.1)**: Added `Space` (Play/Pause), `ArrowRight` (Next Step), `ArrowLeft` (Previous Step), and `KeyR` (Restart), safely ignoring events when focused in editable inputs.
      6. **Integrated Overlays**: Centralized rendering for variable resolution searching, syntax error dialogs, and scope lookup traces.
      7. **Lifecycle Management**: Automatically manages unmount reset and auto-play interval timers.
  - **Migrated All 7 Simulator Pages**:
    - Converted all 7 JavaScript simulator routes to consume `<SimulationShell>`, reducing page files from ~200–300 lines down to ~45–75 lines each (>1,400 lines of duplicate code eliminated).
  - **Component Decoupling (`src/components/backend-simulator/BackendEpisodeShell.tsx`)**:
    - Moved `BackendEpisodeShell` out of the route file `src/app/backend/episodes/1/page.tsx` into a dedicated component, restoring clean Next.js App Router type checking.
  - **Automated Verification**:
    - Created unit test suite [`SimulationShell.test.tsx`](file:///C:/Users/computer/Downloads/system-design-visualizer/system-design-visualizer/src/components/javascript/__tests__/SimulationShell.test.tsx) testing rendering, scenario switching, playback controls, keyboard events, and overlay activations.
    - Verified all 39 Vitest suites (287 tests) pass cleanly.
    - Verified `npx tsc --noEmit` (0 errors), `npx eslint` (0 errors / 0 warnings), and Next.js production build (`npm run build` compiling all 49 routes).
- **Blast Radius**: Zero regressions; all modifications remain unstaged in the working tree per Rule #1.

---

## Decision Record 010: Centered Hero 100vh Viewport Calibration & Rich Token Syntax Highlighting Beautification
- **Status**: Implemented & Verified
- **Category**: UI/UX Layout, Hero Viewport Optimization & Syntax Theming
- **Problem**:
  - The user rejected the 2-column hero approach in favor of Option 1 (centered hero layout).
  - The previous centered hero had loose vertical padding (`pt-28 sm:pt-36 pb-16 sm:pb-24`) that pushed `HeroRuntimeSandbox` below the fold, requiring users to scroll on initial page load.
  - Code lines rendered inside `HeroRuntimeSandbox` used monochrome grey text (`text-zinc-400` / `text-zinc-300`), lacking the rich syntax tokenization found in the platform's simulators.
- **Decision & Implementation**:
  - **Strict 100vh Centered Hero Viewport Calibration (`src/components/landing/page-sections.tsx`)**:
    - Reverted the 2-column layout and restored Option 1: centered architectural layout.
    - Decoupled navbar clearance at the page root level (`<main className="pt-16">`), giving `HeroSection` an exact vertical budget of `min-h-[calc(100vh-4rem)]`.
    - Calibrated hero vertical padding (`pt-6 sm:pt-8 md:pt-10 pb-4 sm:pb-6`), header margins (`mb-2 sm:mb-2.5`, `mt-2 sm:mt-2.5`, `mt-3 sm:mt-3.5`), typography scales (`text-xl sm:text-2xl md:text-3xl lg:text-[36px] xl:text-[40px] leading-[1.14]`), and CTA heights (`py-1.5 sm:py-2`).
    - Added `scroll-mt-16` to all anchor sections (`#disciplines`, `#how-it-works`, `#canvas-studio`) so in-page anchor links land cleanly below the fixed 64px navbar.
    - Calibrated `HeroRuntimeSandbox` center stage (`min-h-[210px] sm:min-h-[230px] lg:min-h-[245px]`) and compact window bars (`py-1.5 sm:py-2`), ensuring the entire hero composition (kicker badge, headline, supporting copy, CTAs, AND the complete `HeroRuntimeSandbox` with tabs, code panel, memory/stack panel, and bottom step explanation/control bar) fits strictly within 100vh on initial load across standard desktop and laptop screens (from 600px+ height) without requiring scrolling.
  - **Rich Token Syntax Highlighting Beautification (`src/components/landing/HeroRuntimeSandbox.tsx`)**:
    - Implemented a robust single-pass regex tokenizer `highlightCodeTokens(line: string, linePrefix?: string)`:
      - **Strings**: Double and single-quoted literals (`"Alice"`, `'Alice'`) in emerald green (`text-emerald-400 font-medium`), correctly preventing internal slashes (e.g. `https://...`) from misidentifying as comments.
      - **Comments**: Single-line comments (`// ...`) in muted zinc italic (`text-zinc-500 italic font-mono`).
      - **Keywords**: JS, C/OS, and Java language keywords (`function`, `let`, `const`, `return`, `class`, `new`, `public`, `static`, `void`, `int`, `var`, `if`, `while`, etc.) in vibrant purple (`text-purple-400 font-medium`).
      - **Types & Classes**: Known types (`User`, `Process`, `String`, `Main`) and PascalCase identifiers in teal (`text-teal-300 font-medium`).
      - **Functions & Invocations**: Known function identifiers and dynamic function call detection (identifiers followed by `(`) in sky/blue (`text-sky-300 font-medium`).
      - **Numbers & Hex**: Integers, decimals, and hex addresses (`0`, `1`, `20`, `0x0040`) in amber/orange (`text-amber-400 font-medium font-mono`).
      - **Multi-Char Operators & Punctuation**: `->`, `+=`, `===`, `!==`, `==`, `!=`, `<=`, `>=`, `&&`, `||`, and symbols in muted zinc (`text-zinc-400`).
      - **Variables & Identifiers**: `count`, `args`, `user`, `prev`, `next`, `pcb` in light zinc (`text-zinc-100 font-mono`).
      - **Rule #4 Compliance**: Enforces deterministic composite keys `${linePrefix}-${i}-${token.slice(0, 8)}` instead of array index.
    - Active line highlighting with radiant discipline-specific accent bars (`border-amber-400`, `border-sky-400`, `border-emerald-400`), ambient background glows, and line number indicators.
  - **Canvas Studio Visual Polish**:
    - Maintained authentic system design canvas preview (`MiniDistributedCanvas.tsx`) reflecting real architecture nodes (Client, Load Balancer / API Gateway with rate limits & circuit breakers, Order Service, Redis Cache, PostgreSQL Primary, Kafka Stream) with subtle glassmorphism and inner top highlights (`inset 0 1px 0 rgba(255,255,255,0.06)`).
  - **Automated Verification**:
    - Comprehensive unit tests in `HeroRuntimeSandbox.test.tsx` verifying multi-discipline syntax highlighting token classes, glowing active line styling, embedded slash URL tokenization, and hexadecimal address tokenization.
    - Verified all 40 Vitest suites (294 tests) pass 100%.
    - Verified `npx tsc --noEmit` (0 errors), `npx eslint` on touched files (0 errors / 0 warnings).
- **Blast Radius**: Zero regressions; all modifications remain unstaged in the working tree per Rule #1.

---

## Decision Record 011: Design System Consistency — Standardized EpisodeCard Migration & Subject Accent Theming
- **Status**: Implemented & Verified
- **Category**: Design System, UI Consistency & Refactoring
- **Problem**:
  - While JavaScript had been migrated to the unified `EpisodeCard` primitive (Record 004), the remaining three discipline landing pages (`src/app/operating-systems/page.tsx`, `src/app/frontend/page.tsx`, and `src/app/backend/page.tsx`) were still handcrafting repetitive raw JSX card markup (>700 lines of duplicate code).
  - The legacy cards exhibited visual inconsistencies: mismatched padding, inconsistent hover physics, random rainbow badge accents within the same discipline (e.g. green, pink, amber badges in Operating Systems), and copy typos (e.g. Operating Systems Episode 4 displaying "Episode 5").
  - Lack of centralized metadata configurations made maintaining subject curricula error-prone.
- **Decision & Implementation**:
  - **Subject Configuration Decoupling**:
    - Created typed metadata definitions:
      - `src/app/operating-systems/episodes.tsx` (`OPERATING_SYSTEMS_EPISODES`: 7 episodes, unified `sky` accent theme).
      - `src/app/frontend/episodes.tsx` (`FRONTEND_EPISODES`: 7 episodes, unified `violet` accent theme).
      - `src/app/backend/episodes.tsx` (`BACKEND_EPISODES`: 3 episodes, unified `emerald` accent theme).
    - Unified color themes strictly per discipline:
      - Operating Systems: `sky` (replacing haphazard pink/green/amber mixes).
      - Frontend Architecture: `violet` (replacing inconsistent badges).
      - Backend Internals: `emerald` (clean backend systems branding).
      - JavaScript: `amber` (as established in Record 004).
  - **Page Template Standardization**:
    - Refactored `operating-systems/page.tsx` (reduced from 342 lines down to 88 lines). Corrected the legacy Episode 4 badge typo.
    - Refactored `frontend/page.tsx` (reduced from 251 lines down to 59 lines).
    - Refactored `backend/page.tsx` (reduced from 135 lines down to 59 lines).
    - Replaced hardcoded JSX blocks with clean declarative mapping over `EpisodeCard` with responsive `grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6`.
  - **Automated Verification**:
    - Created comprehensive unit test suite [`SubjectPathPages.test.tsx`](file:///C:/Users/computer/Downloads/system-design-visualizer/system-design-visualizer/src/app/__tests__/SubjectPathPages.test.tsx) testing all 3 subject index pages, verifying correct rendering of episode titles, links, badges, and accent theming.
    - Full Vitest test suite passes 100% (40 test files, 291 unit tests).
    - `npx tsc --noEmit` clean with 0 errors.
    - `npx eslint` clean with 0 errors and 0 warnings.
    - Full Next.js production build (`npm run build`) succeeded across all 49 routes.
- **Blast Radius**: Zero regressions; eliminated >550 lines of duplicate markup, standardized visual experience across all 4 core subject directories. All changes remain unstaged per Rule #1.

---

## Decision Record 012: Unified `<DisciplineCard>` Primitive & Zero-Layout-Shift Sandbox Subject Transitions
- **Status**: Implemented & Verified
- **Category**: Design System Unification, UI/UX Layout Stability & Animation Performance
- **Problem**:
  - The subject cards on the landing page and `/learning-paths` exhibited conflicting color themes (e.g. Java was orange on learning-paths vs emerald on landing; JavaScript was yellow vs amber; OS was teal vs sky; Frontend was blue vs violet).
  - `/learning-paths` was using legacy manual card markup (>160 lines) with old branding and blocked mobile visitors with an artificial "Bigger Screen Required" modal.
  - When the active discipline tab auto-cycled in `HeroRuntimeSandbox`, `AnimatePresence` without synchronization kept both the exiting and entering panels in normal flex layout flow simultaneously for 150ms. Coupled with unconstrained `min-h` bounds, this caused the sandbox container to visibly stretch, shrink, and "reload" for a fraction of a second during each subject transition.
- **Decision & Implementation**:
  - **Shared `<DisciplineCard>` Primitive ([`src/components/ui/DisciplineCard.tsx`](file:///C:/Users/computer/Downloads/system-design-visualizer/system-design-visualizer/src/components/ui/DisciplineCard.tsx))**:
    - Extracted a single canonical component and metadata registry (`DISCIPLINES`) defining exact brand accents:
      - JavaScript: `amber` (`#f59e0b`, `bg-amber-500/10`, `border-amber-500/30`)
      - Operating Systems: `sky` (`#0ea5e9`, `bg-sky-500/10`, `border-sky-500/30`)
      - Java & JVM: `emerald` (`#10b981`, `bg-emerald-500/10`, `border-emerald-500/30`)
      - Frontend: `violet` (`#8b5cf6`, `bg-violet-500/10`, `border-violet-500/30`)
      - Backend: `blue` (`#3b82f6`, `bg-blue-500/10`, `border-blue-500/30`)
    - Both [`src/components/landing/page-sections.tsx`](file:///C:/Users/computer/Downloads/system-design-visualizer/system-design-visualizer/src/components/landing/page-sections.tsx) and [`src/app/learning-paths/page.tsx`](file:///C:/Users/computer/Downloads/system-design-visualizer/system-design-visualizer/src/app/learning-paths/page.tsx) now render the identical `DisciplineCard` components with matching typography, hover glow hairlines, topic badges, and action CTAs.
    - Updated `/learning-paths` navigation to canonical `System Simulator` branding and removed the artificial mobile blocker, delivering a responsive 6-card grid (including companion Canvas Studio card).
  - **Zero-Layout-Shift Sandbox Subject Transitions ([`src/components/landing/HeroRuntimeSandbox.tsx`](file:///C:/Users/computer/Downloads/system-design-visualizer/system-design-visualizer/src/components/landing/HeroRuntimeSandbox.tsx))**:
    - **Root Cause Isolated**: Unconstrained `min-h-[210px]` containers allowed natural content variance between 9 lines of JS vs 6 lines of Java, and concurrent rendering of exiting/entering panels in normal document flow caused a 150ms vertical height jump.
    - **Fixed Height Lock**: Locked the center stage to exact height `h-[255px] sm:h-[270px] lg:h-[280px] overflow-hidden` with `h-full` on both code and architectural engine columns.
    - **Atomic Layout Transitions**: Replaced asynchronous AnimatePresence layout collisions with synchronous React unmount/mount cycles wrapped in fixed-geometry panels (`h-[72px] sm:h-[76px]` for top stack/CPU frames, `flex-1 min-h-0` for bottom queues/heap/scopes).
    - **Code Line Normalization**: Locked line height to `h-[21px] sm:h-[23px]` with vertical centering, guaranteeing that container dimensions remain 100% frozen with zero pixel shift during tab switches.
  - **Automated Verification**:
    - Created unit tests in [`DisciplineCard.test.tsx`](file:///C:/Users/computer/Downloads/system-design-visualizer/system-design-visualizer/src/components/ui/__tests__/DisciplineCard.test.tsx) and [`LearningPathsPage.test.tsx`](file:///C:/Users/computer/Downloads/system-design-visualizer/system-design-visualizer/src/app/__tests__/LearningPathsPage.test.tsx).
    - Verified all 42 Vitest test suites (298 tests) pass 100%.
    - `npx tsc --noEmit` and `npx eslint` pass with 0 errors and 0 warnings.
    - Next.js production build compiles all 49 routes cleanly.
- **Blast Radius**: Zero regressions; eliminated duplicate card markup and resolved layout shift. All changes remain unstaged per Rule #1.

---

## Decision Record 013: Raycast-Style Landing Page Architecture & Dedicated Stage Runtime Sandbox
- **Status**: Implemented & Verified
- **Category**: UI/UX Architecture, Visual Polish & Interaction Design
- **Problem**:
  - Compressing both the brand headline block and the multi-panel interactive sandbox into a single 100vh viewport created severe visual congestion. The sandbox had to be squeezed into a 255px container with tiny code text and cramped state panels, while the hero headline was forced into smaller typography.
  - Automatically running simulations and cycling tabs as soon as the page loaded was distracting to visitors trying to read code or evaluate the value proposition.
- **Decision & Implementation**:
  - **Section 1 — The Raycast Hero Stage ([`src/components/landing/page-sections.tsx`](file:///C:/Users/computer/Downloads/system-design-visualizer/system-design-visualizer/src/components/landing/page-sections.tsx))**:
    - Decoupled the hero from the sandbox, giving the hero approximately 85–90% of the desktop viewport height (`min-h-[85vh] sm:min-h-[90vh] flex flex-col justify-center items-center text-center`).
    - Established confident typography: headline (*"Don't just use software. Understand how it works."*) scaled to `text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight`, with supporting copy (*"Explore the inner workings of software through interactive, visual simulations."*), and dual CTAs: `"Explore Learning Paths"` and `"Open Canvas Studio"`.
    - Integrated candidate `hero-background-1.jpeg` as an atmospheric system topology backdrop (`public/images/hero-topology.jpeg`), masked with an elliptical radial gradient (`radial-gradient(ellipse 65% 60% at 50% 45%, black 20%, transparent 75%)`) and animated with a 10s subtle breathing drift (`hero-topology-bg` in `landing.css`, respecting `prefers-reduced-motion`). Contrast is naturally achieved through dark composition rather than artificial text drop-shadows.
    - Added an ambient scroll hint at the bottom guiding users to the sandbox below.
  - **Section 2 — Dedicated Stage Interactive Sandbox ([`src/components/landing/page-sections.tsx`](file:///C:/Users/computer/Downloads/system-design-visualizer/system-design-visualizer/src/components/landing/page-sections.tsx) & [`src/components/landing/HeroRuntimeSandbox.tsx`](file:///C:/Users/computer/Downloads/system-design-visualizer/system-design-visualizer/src/components/landing/HeroRuntimeSandbox.tsx))**:
    - Created a dedicated section with heading: *"See what happens beneath the surface."* and subheading: *"Explore how code executes, memory is allocated, processes are scheduled, and systems communicate."*
    - Expanded sandbox height from cramped 255px to generous IDE proportions (`h-[440px] sm:h-[460px] lg:h-[480px]`).
    - Increased code line height to `h-[26px] sm:h-[28px]` and text size to `text-xs sm:text-sm` with relaxed leading.
    - Expanded Call Stack from 48px to `h-[84px] sm:h-[94px]` (allowing 3–4 frames to display cleanly), expanded CPU Core and JVM stack/heap panels.
    - Set initial playback to paused (`isAutoCycling: false, isPlayingManual: false`), allowing visitors to read idle state peacefully. Clicking "Run" initiates simulation and full tour across disciplines.
    - **High-Affordance Interactive Control Highlighting (Option 4)**:
      - The primary **"Run"** button features subject-themed luminescence (amber glow for JS, sky glow for OS, emerald glow for Java) with a live pulsing beacon (`animate-ping`) when idle.
      - Stepping forward is highlighted via a distinct, labeled **"Next"** button (`<span>Next</span> <SkipForward />`) with tactile border and elevation.
      - The top window bar features an explicit **"Live Interactive Sandbox"** indicator, and the active discipline tab features enhanced tactile elevation with hairline border contrast.
      - The bottom explanation banner includes a dynamic step counter badge `(currentStep + 1 / maxSteps)`.
  - **Automated Verification**:
    - Updated unit tests in [`src/components/landing/__tests__/LandingPage.test.tsx`](file:///C:/Users/computer/Downloads/system-design-visualizer/system-design-visualizer/src/components/landing/__tests__/LandingPage.test.tsx) and [`src/components/landing/__tests__/HeroRuntimeSandbox.test.tsx`](file:///C:/Users/computer/Downloads/system-design-visualizer/system-design-visualizer/src/components/landing/__tests__/HeroRuntimeSandbox.test.tsx).
    - Verified all 42 Vitest test suites (299 tests) pass with 100% green.
    - `npx tsc --noEmit` and `npx eslint` pass with 0 errors and 0 warnings.
    - Next.js production build (`npm run build`) succeeded across all 49 routes.
- **Blast Radius**: Zero regressions; dramatically improved readability, visual hierarchy, and user agency on the landing page. All changes remain unstaged in accordance with Rule #1.

---

## Decision Record 014: Unified `<QueuePanel>` Primitive, Explicit Console Suppress Architecture & Episode 6 Asynchronous Modernization
- **Status**: Implemented & Verified
- **Category**: Component Architecture, Code Smell Elimination & Simulation Unification
- **Problem**:
  - `MicrotaskQueuePanel.tsx` (165 lines) and `CallbackQueuePanel.tsx` (165 lines) were 90% identical duplicate code blocks, violating DRY principles and creating divergence risks for queue animations and styling.
  - `CodePanel.tsx:67` contained a fragile string-sniffing hack (`!scenario?.id?.startsWith("el-")`) to suppress the embedded console on the Event Loop page, which would break if scenarios were renamed or new event-driven modules were added.
  - Episode 6 (Closures) Scenarios 5 & 6 used the legacy `taskQueue: [...]` schema, requiring the codebase to retain `TaskQueuePanel.tsx` and presenting an inconsistent mental model compared to Episode 7's modern `webAPIs` and `callbackQueue`.
- **Decision & Implementation**:
  - **Unified `<QueuePanel>` Primitive (`src/components/javascript/QueuePanel.tsx`)**:
    - Created a polymorphic `<QueuePanel variant="microtask" | "callback" />` primitive supporting:
      - Dynamic theming: `fuchsia` for microtasks, `amber` for callbacks.
      - Dynamic badges: `⚡ Higher Priority` badge on microtasks; `(Macrotasks)` subtitle on callbacks.
      - Dynamic event loop phase detection: `checking_microtasks` / `draining_microtask` vs `checking_callbacks`.
      - Shared Framer Motion item animations and defensive step indexing.
    - Updated `src/app/javascript/simulator/event-loop/page.tsx` and `EventLoopMobilePanels.tsx` to consume `<QueuePanel>` directly.
    - Converted `MicrotaskQueuePanel.tsx` and `CallbackQueuePanel.tsx` to thin backward-compatible wrappers around `<QueuePanel>`.
  - **Explicit Declarative Console Architecture**:
    - Added `hideEmbeddedConsole?: boolean` to `SimulationScenario` in `src/lib/js-simulator/engine.ts`.
    - Declared `hideEmbeddedConsole: true` on all 6 Event Loop scenarios in `src/lib/js-simulator/event-loop-scenarios.ts`.
    - Refactored `CodePanel.tsx:67` to check `!scenario?.hideEmbeddedConsole`, completely removing string prefix sniffing.
  - **Episode 6 Asynchronous Modernization & Graceful Fallback**:
    - Modernized `TaskQueuePanel.tsx` to automatically render `callbackQueue` items with seamless fallback to `taskQueue`.
    - Updated queue presence detection in `MobileTabbedPanels.tsx` and `src/app/javascript/simulator/closures/page.tsx` to detect either `callbackQueue` or `taskQueue`.
  - **Automated Verification**:
    - Created unit test suite `QueuePanel.test.tsx` verifying both variants, empty states, and event loop phase styling.
    - Updated `DefensivePanels.test.tsx` verifying out-of-bounds safety across both `QueuePanel` variants.
- **Blast Radius**: Zero regressions; eliminated duplicate code, decoupled component logic from scenario naming, and standardized queue architecture. All changes remain unstaged per Rule #1.

---

## Decision Record 015: Automated Curriculum Scenario Integrity Inspector & Closure Memory Lexical Scope Hierarchy
- **Status**: Implemented & Verified
- **Category**: Data Integrity, Automated Guardrails & Educational UI/UX
- **Problem**:
  - Across 7 JavaScript episodes with 42+ scenarios (~400 simulation steps), any formatting or code edits carried a risk of line drift (e.g. step `currentLine` highlighting a blank line or comment). Previously, catching such drift required clicking through every scenario manually.
  - In `ExecutionContextPanel.tsx`, closure memory was rendered as an isolated floating card without an explicit lexical parent pointer or visual scope retention indicator, making it difficult for beginners to understand which outer scope birthed the closure.
- **Decision & Implementation**:
  - **Automated Scenario Integrity Inspector (`src/lib/js-simulator/__tests__/scenarioIntegrity.test.ts`)**:
    - Created an automated validation suite with 109 continuous assertions covering all scenarios across all 7 episodes:
      1. **Line Bounds & Non-Empty Check**: Verifies that every step with a non-null `currentLine` points to a real, non-empty code line within the scenario's code boundaries.
      2. **Step 0 Clean Initialization**: Verifies that Step 0 contains an empty or clean stack and zero premature console or queue items.
      3. **Content Completeness**: Verifies non-empty explanation copy across every single step.
      4. **Context Schema Verification**: Ensures all execution contexts conform strictly to `ExecutionContext` contracts (`id`, `name`, `phase`, `variables`).
  - **Closure Memory Lexical Hierarchy (`src/components/javascript/ExecutionContextPanel.tsx`)**:
    - Added high-contrast lexical parent badge in the card header: `Lexical Parent ➔ {ec.outerEnvironment || "Global"}` (`bg-fuchsia-500/15 text-fuchsia-300 border-fuchsia-500/30`).
    - Added cohesive `border-l-4 border-l-fuchsia-500/60` and `bg-card/90` styling to visually differentiate closure memory cards from standard stack frames.
    - Added a dedicated `Retained Lexical Scope` section inside the card body showing the outer environment preserved in heap memory.
  - **Automated Verification**:
    - Created unit test suite `ExecutionContextPanel.test.tsx` verifying empty stack, global context, nested block scopes, and closure memory parent badges.
    - Full Vitest suite passes 100% (45 test suites, 415 unit tests).
    - `npx tsc --noEmit` and `npx eslint` pass with 0 errors and 0 warnings.
    - Full Next.js production build (`npm run build`) succeeded across all 49 routes.
- **Blast Radius**: Zero regressions; introduces permanent regression guardrails and clarifies JavaScript scope retention. All modifications remain unstaged in accordance with Rule #1.

---

## Decision Record 016: Editorial Light-Mode Architecture, Computational Graph Signature Motif & Continuum Bridge
- **Status**: Implemented & Verified
- **Category**: Design Systems, UI/UX Architecture, Visual Polish & Interactive Identity
- **Problem**:
  - The previous light mode suffered from stark, uncalibrated `#FFFFFF` backgrounds across all sections, causing severe eye strain and flat visual rhythm.
  - Body and subtitle text used faint grey (`--muted-foreground: oklch(0.556 0 0)`), failing WCAG contrast standards and appearing washed out.
  - The dark hero background image (`hero-topology.jpeg`) appeared as an unnatural black circular disc/smudge in light mode directly beneath the CTAs.
  - The headline gradient (amber → sky → emerald) felt disjointed on light surfaces, and discipline cards lacked identity in their resting state.
  - The dark simulator and canvas mockups felt pasted on without depth or ambient integration against light backgrounds.
- **Decision & Implementation**:
  - **Editorial Warm Stone Canvas & Alternating Sections ([`globals.css`](file:///C:/Users/computer/Downloads/system-design-visualizer/system-design-visualizer/src/app/globals.css) & [`page-sections.tsx`](file:///C:/Users/computer/Downloads/system-design-visualizer/system-design-visualizer/src/components/landing/page-sections.tsx))**:
    - Calibrated base light canvas to warm off-white **`#FAFAF9`** (Stone-50).
    - Established rhythmic section alternation: Hero (`#FAFAF9`) → Sandbox (`#F5F5F4` Stone-100 tint) → Disciplines (`#FAFAF9`) → How It Works (`#F5F5F4` tint) → Canvas (`#FAFAF9`) → Final CTA (`#F5F5F4` tint).
    - Darkened headings to dense ink **`#0A0A0A`** and body copy to rich, readable **`#52525B`** (`text-zinc-600 dark:text-zinc-400`).
  - **Signature Motif: `<HeroComputationalGraph />` ([`src/components/landing/HeroComputationalGraph.tsx`](file:///C:/Users/computer/Downloads/system-design-visualizer/system-design-visualizer/src/components/landing/HeroComputationalGraph.tsx))**:
    - Replaced the generic particle image with an engineered computational topology featuring 9 mathematical nodes (Ingress, Scheduler, Pipeline, Heap Pool, Queue, Registers, Cache, Sink, Bus Hub) connected by fine bezier circuit traces.
    - Added autonomous data packet flows with discrete node activation state transitions.
    - **Dual-Mode Treatment**: Soft monochrome blueprint with pale technical lines (`rgba(15,23,42,0.08)`) and cyan-teal diffuse halo in light mode; obsidian luminescence with subtle amber/sky accents in dark mode.
    - **Cursor Parallax**: Added dampened 60fps cursor parallax with smooth lerp, gracefully disabled when `prefers-reduced-motion` is active.
    - **Downward Vertical Circuit Bus Bridge**: A central bus conduit descends from the hero and connects seamlessly into Section 2 (*"See what happens beneath the surface"*), bridging abstract computation directly to the concrete runtime sandbox.
  - **Harmonious Headline Gradient & Shimmer ([`landing.css`](file:///C:/Users/computer/Downloads/system-design-visualizer/system-design-visualizer/src/components/landing/landing.css))**:
    - Switched headline to closer cool hues: `from-teal-600 via-cyan-600 to-blue-600` in light mode (`dark:from-teal-400 dark:via-cyan-400 dark:to-blue-400`).
    - Added a slow, luxurious 7-second hue shimmer (`headline-gradient-shimmer`) with reduced-motion protection.
  - **Discipline Cards Permanent Resting Tints ([`DisciplineCard.tsx`](file:///C:/Users/computer/Downloads/system-design-visualizer/system-design-visualizer/src/components/ui/DisciplineCard.tsx))**:
    - Added permanent 20–25% discipline color borders (`border-amber-500/25`, `border-sky-500/25`, etc.) and permanent 8–10% icon background tints on pure white cards with soft elevation shadows (`shadow-[0_2px_10px_rgba(0,0,0,0.03)]`).
  - **Soft Coloured Mockup Shadows**:
    - Embedded both `HeroRuntimeSandbox` and `MiniDistributedCanvas` with soft atmospheric ambient back-glows (`from-amber-500/12 via-sky-500/12 to-emerald-500/12 blur-2xl`) and deep multi-layered shadows (`shadow-[0_24px_60px_-12px_rgba(15,23,42,0.22)]`), integrating the dark hardware mockups seamlessly onto the light background.
  - **Automated Verification**:
    - Created unit tests in [`HeroComputationalGraph.test.tsx`](file:///C:/Users/computer/Downloads/system-design-visualizer/system-design-visualizer/src/components/landing/__tests__/HeroComputationalGraph.test.tsx).
    - Verified all 46 Vitest test suites (417 unit tests) pass 100% green.
    - `npx tsc --noEmit` and `npx eslint` pass with 0 errors and 0 warnings.
    - Next.js production build (`npm run build`) succeeded across all 49 routes.
- **Blast Radius**: Zero regressions; elevates the entire light mode visual experience to an award-winning editorial standard. All changes remain unstaged in working tree in accordance with Rule #1.

---

## Decision Record 017: Hero Background Refinement — Ambient Computational Field
- **Status**: Implemented & Verified
- **Category**: Visual Design, Creative Interaction & Design Systems
- **Problem**:
  - The previous hero background featured a closed elliptical loop surrounding the central headline, complete with 9 prominent technical text labels (`INGRESS`, `SCHEDULER`, `PIPELINE`, `HEAP_POOL`, `TASK_QUEUE`, `REGISTERS`, `L1_CACHE`, `STATE_SINK`, `BUS_HUB_01`) and repetitive concentric circles (`r="9"`, `r="14"`).
  - This composition resembled a diagrammatic oval frame that enclosed and competed with the typography rather than providing an ambient, atmospheric computational background.
  - Furthermore, cursor parallax across the entire canvas compromised typographic stability on various screen sizes.
- **Decision & Implementation**:
  - **Ambient Computational Field Architecture ([`HeroComputationalGraph.tsx`](file:///C:/Users/computer/Downloads/system-design-visualizer/system-design-visualizer/src/components/landing/HeroComputationalGraph.tsx))**:
    - **Eliminated Closed Ellipse**: Replaced the closed framing loop with 4 disconnected, asymmetric, gently curved bezier traces (`field-path-a`, `field-path-b`, `field-path-c`, `field-path-d`) entering from peripheral corners and tapering out into the canvas.
    - **Protected Central Negative Space**: Kept the central viewport area (`x: 380–820`, `y: 150–520`) completely clear of lines and nodes, guaranteeing unobstructed readability and maximum contrast for the headline, subtitle, and primary/secondary CTAs.
    - **Eliminated All Permanent Labels**: Removed all 9 technical text labels and eliminated all `<text>` elements from the SVG background.
    - **Restrained Geometric Nodes**: Scaled down to 7 discrete, restrained nodes (`r: 2.2–2.8px`) with subdued opacities and variable positioning across the peripheral quadrants. Eliminated concentric double rings; only two designated active nodes have a single, faint halo ring (`r: 7px`, `stroke-[0.9]`).
    - **Continuous, Staggered Flow**: Integrated 4 out-of-phase data packet transitions with staggered durations (4.5s to 11s) along open paths, gracefully converging into the Section 2 vertical bus bridge.
    - **Dual-Mode Art Direction**:
      - *Light Mode*: Ultra-pale neutral gray linework (`stroke-zinc-900/[0.06]`), soft stone glow, and translucent cyan-teal accents seamlessly integrated on `#FAFAF9`.
      - *Dark Mode*: Graphite/starlight linework (`stroke-white/[0.07]`) and obsidian luminescence.
    - **Hydration-Safe Reduced-Motion**: Implemented `useSyncExternalStore` media query listener for `(prefers-reduced-motion: reduce)` to eliminate cascading re-renders and ESLint warnings while completely omitting animation loops when reduced motion is preferred.
    - **Rock-Solid Typographic Stability**: Removed mouse parallax from the background SVG, ensuring the focal typography remains crisp and completely anchored.
  - **Automated Verification**:
    - Updated unit test suite in [`HeroComputationalGraph.test.tsx`](file:///C:/Users/computer/Downloads/system-design-visualizer/system-design-visualizer/src/components/landing/__tests__/HeroComputationalGraph.test.tsx) asserting path existence, node counts, absence of technical labels, and reduced-motion compliance.
    - Verified all 46 Vitest suites (417 unit tests) pass 100% green.
    - `npx tsc --noEmit` and `npx eslint` pass with 0 errors and 0 warnings.
- **Blast Radius**: Zero regressions outside the hero background. All modifications remain unstaged in working tree in accordance with Rule #1.

---

## Decision Record 018: Coherent Abstract Computational Network Hero Background
- **Status**: Implemented & Verified
- **Category**: Visual Design, Creative Interaction & Computational Systems Identity
- **Problem**:
  - The previous iteration removed the large elliptical outline and replaced it with disconnected curved paths and small colored particles.
  - While it improved negative space, the background resembled generic decorative technology artwork rather than a coherent visualization of computational systems.
  - It failed to communicate the product's identity as a platform exploring how software components communicate and how information flows through systems.
- **Decision & Implementation**:
  - **Canonical Distributed Request Architecture ([`HeroComputationalGraph.tsx`](file:///C:/Users/computer/Downloads/system-design-visualizer/system-design-visualizer/src/components/landing/HeroComputationalGraph.tsx))**:
    - Modeled the core 7-node computational lifecycle:
      - `CLIENT` (96, 145): Secondary node (`r: 3.5px`, cyan/teal), outbound request initiator and inbound response receiver.
      - `INGRESS` (230, 80): Primary node (`r: 4.5px`, ring `r: 14px`, teal), entry point for HTTP requests.
      - `LOAD_BALANCER` (920, 85): Primary node (`r: 4.8px`, ring `r: 16px`, blue), routes requests across application instances.
      - `APP_SERVICE_A` (1110, 210): Primary node (`r: 4.5px`, ring `r: 14px`, teal), request processing and cache lookup coordinator.
      - `APP_SERVICE_B` (1060, 420): Primary node (`r: 4.5px`, ring `r: 14px`, teal), alternate service instance.
      - `APP_CACHE` (180, 520): Secondary node (`r: 3.8px`, ring `r: 11px`, cyan), cache hit return & subtle amber miss transition.
      - `DATABASE` (460, 610): Secondary node (`r: 4.0px`, ring `r: 12px`, blue), persistent store queried exclusively on cache misses.
    - Zero permanent text labels (`<text>` count: 0), preserving clean, confident typography without diagrammatic noise.
  - **Quiet Central Negative Space & Peripheral Routing**:
    - `C02` (Ingress ➔ LB) arcs high across the top periphery (`y: 40–85`) comfortably above the headline.
    - `C05` / `C06` (App Services ➔ Cache) sweeps deeply along the bottom margin (`y: 560–580`) well below the dual CTAs.
    - Central area (`x: 250–900, y: 100–550`) is 100% free of bright lines, nodes, or particle crossings.
    - Relocated ambient glows from the center to peripheral node clusters, keeping text contrast pristine.
  - **Deterministic 18s Repeating Lifecycle (Cycle A: Hit vs Cycle B: Miss)**:
    - **Cycle A (0s–9s, Cache Hit)**: Outbound packet travels Client ➔ Ingress ➔ LB ➔ App Service A ➔ App Cache. Cache illuminates cyan; Database remains 100% idle. Response packet returns via reverse path to Client, followed by quiet resting idle.
    - **Cycle B (9s–18s, Cache Miss)**: Outbound packet travels Client ➔ Ingress ➔ LB ➔ App Service B ➔ App Cache. Cache signals a miss, querying Database (which illuminates blue). Database returns result, and response travels back to Client, followed by quiet resting idle.
    - Destination nodes illuminate with subtle ring and core pulse animations upon signal arrival.
  - **Dual-Mode Sophistication & Section 2 Convergence**:
    - *Light Mode*: Restrained pale neutral linework (`stroke-zinc-900/[0.08]`), muted colored nodes, zero harsh bloom.
    - *Dark Mode*: Graphite starlight linework (`stroke-white/[0.09]`), glowing cyan/teal/blue accents.
    - Lower traces converge seamlessly into Section 2 vertical bus bridge (`M 600 640 L 600 680`).
  - **WCAG Reduced Motion & Performance**:
    - Uses pure declarative SVG SMIL (`<animateMotion>`, `<animate>`) with zero React re-renders or runtime JS loops.
    - `useSyncExternalStore` media query listener completely omits all motion packets and animations when `(prefers-reduced-motion: reduce)` is active, displaying the resting architectural topology.
  - **Automated Verification**:
    - Updated [`HeroComputationalGraph.test.tsx`](file:///C:/Users/computer/Downloads/system-design-visualizer/system-design-visualizer/src/components/landing/__tests__/HeroComputationalGraph.test.tsx) testing canonical node export, IDs, connections C01–C07, packet counts, zero `<text>` labels, and reduced motion.
    - Verified all 46 Vitest suites (418 unit tests) pass 100%.
    - Verified `npx tsc --noEmit` (0 errors), `npx eslint` (0 errors / 0 warnings), and Next.js production build (`npm run build` compiling all 49 routes).
- **Blast Radius**: Zero regressions; confined cleanly to hero background and its test suite. All changes remain unstaged per Rule #1.

---

## Decision Record 019: Gestalt Perimeter Loop Elimination & Open Asymmetric Computational Network Hero Background
- **Status**: Implemented & Verified
- **Category**: Visual Design, Creative Interaction, UI Architecture & Computational Systems Identity
- **Problem**:
  - The previous iteration (Record 018) placed all 7 canonical nodes along the outer perimeter (top, right, bottom, left) and connected them sequentially in a request-response cycle.
  - While intended to keep the central text region clear, connecting perimeter nodes in a full cycle mathematically and visually formed an enclosing oval loop around the hero headline and CTAs.
  - Under Gestalt visual principles (*Law of Closure and Continuity*), human perception grouped these perimeter curves into a single continuous oval wireframe enclosing the typography, causing the background to appear "more or less the same" despite code changes.
  - In dark mode, low ambient opacity against the pitch-black void heightened the high-contrast wireframe outline.
- **Decision & Implementation**:
  - **Gestalt Perimeter Disruption ([`HeroComputationalGraph.tsx`](file:///C:/Users/computer/Downloads/system-design-visualizer/system-design-visualizer/src/components/landing/HeroComputationalGraph.tsx))**:
    - **Complete Elimination of the Bottom Arc & Oval**: Rather than wrapping a sweeping curve across the entire bottom under the buttons, `APP_CACHE` ($1100, 460$) and `DATABASE` ($960, 570$) were repositioned into the right-hand backend cluster. The entire bottom-left quadrant is left as open negative space, completely eliminating the bottom half of the oval.
    - **Asymmetric Composition (2 Nodes Left vs 5 Nodes Right)**: 
      - Upper-left cluster: `CLIENT` ($90, 190$) and `INGRESS` ($230, 110$). External incoming request trace from off-screen ($(-20, 210)$).
      - Top transit: `C02` ($230, 110 \rightarrow 950, 100$) high transit conduit skirting above the headline.
      - Right-side backend cluster: `LOAD_BALANCER` ($950, 100$), `APP_SERVICE_A` ($1110, 190$), `APP_SERVICE_B` ($1040, 310$), `APP_CACHE` ($1100, 460$), and `DATABASE` ($960, 570$). External upstream & downstream mesh traces exiting the canvas ($1220\text{px}$).
      - Section 2 downward conduit: Converges cleanly from the lower database bus into the central vertical conduit ($600, 640 \rightarrow 600, 680$).
  - **Deterministic 18s Lifecycle**:
    - Preserved the authentic 7-node request lifecycle:
      - Cycle A ($0\text{s}–9\text{s}$): Inbound Request $\rightarrow$ App Service A $\rightarrow$ Cache Hit (Database $100\%$ idle) $\rightarrow$ Response returns to Client $\rightarrow$ Quiet resting idle.
      - Cycle B ($9\text{s}–18\text{s}$): Inbound Request $\rightarrow$ App Service B $\rightarrow$ Cache Miss (amber signal) $\rightarrow$ Database query (blue signal) $\rightarrow$ Database result returns $\rightarrow$ Response returns to Client $\rightarrow$ Quiet resting idle.
  - **Zero Permanent Text Labels & Clear Center**:
    - Zero permanent text labels ($<\text{text}>$ count: 0). Central text region ($x: 270–930, y: 120–510$) remains $100\%$ free of bright nodes, lines, or packet crossings.
  - **Automated Verification**:
    - Unit tests in [`HeroComputationalGraph.test.tsx`](file:///C:/Users/computer/Downloads/system-design-visualizer/system-design-visualizer/src/components/landing/__tests__/HeroComputationalGraph.test.tsx) asserting canonical node export, zero text labels, presence of connections C01–C07, absence of `<ellipse>` elements, and WCAG reduced motion compliance.
    - All unit tests pass $100\%$ green.
    - `npx tsc --noEmit` clean with 0 errors.
    - All modifications remain unstaged in the working tree in strict adherence to Rule #1.
- **Blast Radius**: Zero regressions; confined exclusively to the hero background SVG component and its test file.

---

## Decision Record 020: Operating Systems Phase 1 — Route Disambiguation, FCFS Decommissioning, Defensive Bounds Clamping & Reliability Hardening
- **Status**: Implemented & Verified
- **Category**: Architecture, Runtime Reliability, Curriculum Integrity & Code Quality
- **Problem**:
  - **Curriculum Route Collision (OS-CRIT-02)**: Episode 2 (*"CPU Scheduling Deep-Dive"*) and Episode 4 (*"CPU Schedulers"*) both pointed to the same URL (`/operating-systems/simulator/cpu-scheduling`). Episode 2's handcrafted 609-line scenario ([`cpu-scheduling-scenario.ts`](file:///C:/Users/computer/Downloads/system-design-visualizer/system-design-visualizer/src/lib/os-simulator/cpu-scheduling-scenario.ts)) simulating Chrome, Spotify, VS Code, and Discord was completely unmounted in the UI.
  - **Orphaned Duplicate Code (OS-CRIT-03)**: An unused ghost route [`fcfs-scheduling/page.tsx`](file:///C:/Users/computer/Downloads/system-design-visualizer/system-design-visualizer/src/app/operating-systems/simulator/fcfs-scheduling/page.tsx) (1,589 lines) and [`fcfs-engine.ts`](file:///C:/Users/computer/Downloads/system-design-visualizer/system-design-visualizer/src/lib/os-simulator/fcfs-engine.ts) (349 lines) had zero incoming links or imports across the application.
  - **Unchecked Bounds Crashes (OS-CRIT-01)**: Simulator pages read `scenario.steps[currentStepIndex].*` unconditionally without fallback clamping, risking fatal `TypeError: Cannot read properties of undefined` during fast clicking or scenario transitions.
  - **22 ESLint Errors & 5 Warnings**: React 19 `react-hooks/set-state-in-effect` violations occurred across simulator pages, unescaped quote entities (`"`) and JSX comment text nodes existed in concurrency episodes, and unused imports/variables created build noise.
  - **PCB Navigation & Array Safety (OS-MED-05, OS-LOW-04)**: PCB back link used raw HTML `<a>` triggering full browser reloads, and ready queue mappings lacked `.filter(Boolean)`.
- **Decision & Implementation**:
  - **1. Route Disambiguation & Restored Episode 2 Simulator**:
    - Created dedicated route [`/operating-systems/simulator/cpu-scheduling-deep-dive`](file:///C:/Users/computer/Downloads/system-design-visualizer/system-design-visualizer/src/app/operating-systems/simulator/cpu-scheduling-deep-dive/page.tsx) for Episode 2, mounting `cpu-scheduling-scenario.ts` with the core OS visualizer components (`ZoneContainer`, `CPUBlock`, `SchedulerBadge`, `OSStatsSidebar`, `OSExplanationPanel`, `InterruptOverlay`, `OSToast`).
    - Added an interactive Algorithm Selector toggle in the navbar (`[Non-Preemptive (FCFS) | Preemptive (Round Robin)]`), wired directly to `useOSSimulationStore.setSchedulingMode()`.
    - Maintained Episode 4 as the universal multi-algorithm Gantt chart comparator at `/operating-systems/simulator/cpu-scheduling`.
    - Updated [`src/app/operating-systems/episodes.tsx`](file:///C:/Users/computer/Downloads/system-design-visualizer/system-design-visualizer/src/app/operating-systems/episodes.tsx) with distinct routes.
  - **2. Decommissioned Orphaned FCFS Code**:
    - Confirmed 0 references via global search and deleted `src/app/operating-systems/simulator/fcfs-scheduling/page.tsx` and `src/lib/os-simulator/fcfs-engine.ts` (-1,938 lines of dead code).
  - **3. Defensive Bounds Indexing & Fallback State (Decision Record 001)**:
    - Added clamp-based indexing `const safeIndex = steps.length > 0 ? Math.max(0, Math.min(currentStepIndex, steps.length - 1)) : 0; const step = steps[safeIndex] ?? FALLBACK_STEP;` across all simulator pages (`cpu-scheduling-deep-dive`, `process-states`, `process-control-block`, `producer-consumer`, `printer-spooler`, `lock-variables`, `cpu-scheduling`).
    - Provided fully typed `FALLBACK_STEP` instances for zero-undefined resilience.
  - **4. Complete Elimination of All 22 ESLint Errors & 5 Warnings**:
    - Eliminated `react-hooks/set-state-in-effect` violations in all auto-play timers by scheduling completion via asynchronous timeouts or derived state.
    - Converted `OSToast.tsx` from a high-frequency 30ms JavaScript interval to declarative Framer Motion animations (`0` React re-renders) and fixed invalid CSS property value `borderLeftColor: "teal-500"` to canonical hex `#14b8a6`.
    - Converted `PCBViewer.tsx` auto-expansion from an effect-based `setState` to idiomatic state adjustment during render.
    - Fixed unescaped entities (`&quot;`) and converted JSX text comment nodes to string expressions (`{"// CRITICAL SECTION"}`) in `printer-spooler` and `producer-consumer`.
    - Replaced React key array indices (`key={i}`) with composite keys (`key={`buffer-slot-${i}`}`, `key={`code-line-${process}-${idx}-${line.text.slice(0, 10)}`}`).
    - Removed unused variables and imports in `OSStatsSidebar.tsx`, `process-states-scenario.ts`, and `useOSSimulationStore.ts`.
  - **5. PCB Navigation & Array Safety**:
    - Replaced `<a href="/operating-systems">` with Next.js `<Link href="/operating-systems">` in `process-control-block/page.tsx`.
    - Added `.filter(Boolean)` on ready queue mappings in `process-control-block/page.tsx` and `cpu-scheduling/page.tsx`.
  - **6. Automated Verification**:
    - Created unit test suite [`CpuSchedulingDeepDive.test.tsx`](file:///C:/Users/computer/Downloads/system-design-visualizer/system-design-visualizer/src/app/operating-systems/simulator/cpu-scheduling-deep-dive/__tests__/CpuSchedulingDeepDive.test.tsx) testing navigation, heading, algorithm mode switching between FCFS and Round Robin, queue/CPU rendering, and step advancement.
    - Updated [`SubjectPathPages.test.tsx`](file:///C:/Users/computer/Downloads/system-design-visualizer/system-design-visualizer/src/app/__tests__/SubjectPathPages.test.tsx) with assertions for Episode 2 and Episode 4 links.
    - Verified all 47 Vitest test suites (423 unit tests) pass 100%.
    - Verified `npx tsc --noEmit` clean with 0 errors.
    - Verified `npx eslint` across all Operating Systems code clean with 0 errors / 0 warnings.
    - All modifications remain unstaged in the working tree in strict compliance with Rule #1.
- **Blast Radius**: Zero regressions; backwards-compatible across all learning paths and simulators.

---

## Decision Record 021: Hero Section Computational Network — Perimeter Flanking Architecture & Safe Text Corridor Guarantee
- **Status**: Implemented & Verified
- **Category**: UI/UX, Design Systems, Information Architecture & Responsive Design
- **Problem**:
  - The previous node positions placed `INGRESS` at `(310, 108)` (directly colliding with the "Don't" headline text), `LOAD_BALANCER` at `(574, 78)` (whose bottom label collided with the top of the headline), and `APP_SERVICE_B` at `(900, 168)` (directly colliding with the end of "Understand how it works.").
  - On tablet and mobile viewports, fixed SVG coordinates squished into multi-line text, impairing WCAG contrast and reading flow.
- **Decision & Implementation**:
  - **1. Perimeter Flanking Architecture**:
    - Re-architected node positioning to frame the hero copy into a clean two-flank distributed system topology:
      - **Left Ingress & Traffic Tier**: Client `(80, 90)`, Ingress `(100, 260)`, Load Balancer `(120, 430)`.
      - **Right Backend & Persistence Tier**: App Service A `(1150, 90)`, App Service B `(1180, 230)`, Application Cache `(1120, 380)`, Database `(1180, 520)`.
    - Established an architectural **Central Text Corridor Exclusion Zone** (`x: 200–1080, y: 120–480`) guaranteed to contain 0 node boxes or text labels.
  - **2. High Canopy & Basin Bezier Circuit Paths**:
    - `conn-c03` arcs high over the headline (`y = 20–50` at apex) carrying traffic from Load Balancer across to App Service A.
    - `conn-c04` sweeps beneath the CTA buttons (`y = 570` at basin) across to Application Cache.
    - Preserved canonical flow and animated motion packets along all 7 routes with WCAG reduced-motion toggling.
  - **3. Responsive Multi-Tier Display**:
    - Switched SVG scaling to `preserveAspectRatio="xMidYMid slice"`.
    - Node cards adapted for medium/large screens (`hidden md:inline`), text labels for large screens (`hidden lg:inline`), preventing mobile collisions while preserving ambient particles and packet flows across all screen sizes.
  - **4. Automated Verification**:
    - Unit tests in [`HeroComputationalGraph.test.tsx`](file:///C:/Users/computer/Downloads/system-design-visualizer/system-design-visualizer/src/components/landing/__tests__/HeroComputationalGraph.test.tsx) asserting canonical nodes, connections C01–C07, reduced-motion bypass, absence of framing ellipses, and added an automated assertion confirming every node avoids the central corridor.
    - 5/5 Vitest tests pass cleanly. `tsc --noEmit` and `eslint` clean with 0 errors.
    - Strict adherence to Rule #1: all changes remain unstaged in the working tree.
- **Blast Radius**: Zero regressions; confined exclusively to the hero background SVG component, its unit tests, and architecture log.

---

## Decision Record 022: Distributed System Graph Fidelity — Parallel Instance Load Balancing, Application-Managed Data Access & Directional Request Flow
- **Status**: Implemented & Verified
- **Category**: Architecture, Distributed Systems Pedagogy & Visual Design
- **Problem**:
  - The previous graph topology had subtle architectural inconsistencies that could mislead learners:
    1. **Sequential Pipe Misconception**: App Service A appeared to connect sequentially to App Service B, which then connected to the cache (`App A -> App B -> Cache`), suggesting a chain rather than two interchangeable application instances.
    2. **Cache-to-Database Direct Link Misconception**: A direct path connected Application Cache to Database, falsely implying the cache autonomously queries the database rather than adhering to standard application-managed cache-aside patterns.
    3. **Missing Flow Direction**: Connection lines lacked explicit directional cues, leaving ambiguity about whether information represented ingress requests, dispatches, or data access lookups.
- **Decision & Implementation**:
  - **1. Parallel Load Balancing**:
    - Disconnected App Service A from App Service B completely.
    - Routed independent load-balancing dispatch paths from Load Balancer to App Service A (`conn-c03`) and App Service B (`conn-c04`), modeling authentic L7 traffic distribution across redundant instances.
  - **2. Application-Managed Caching & Persistence**:
    - Removed the direct connection between Application Cache and Database.
    - Wired each application instance to coordinate data tier interactions independently:
      - App Service A $\rightarrow$ Application Cache (`conn-c05`) and App Service B $\rightarrow$ Application Cache (`conn-c06`) for in-memory lookups.
      - App Service A $\rightarrow$ Database (`conn-c07`) and App Service B $\rightarrow$ Database (`conn-c08`) in amber persistence strokes for cache misses / persistent writes.
  - **3. Explicit Directional Cues (Chevrons & Motion Flow)**:
    - Added SVG `<marker>` definitions (`#hcg-arrow-teal`, `#hcg-arrow-cyan`, `#hcg-arrow-amber`) providing crisp, directional arrowheads at the destination ends of all 8 connection paths.
    - Synchronized animated SVG `<animateMotion>` packet dots to travel in strict alignment with the architectural request flow.
  - **4. Automated Verification**:
    - Updated [`HeroComputationalGraph.test.tsx`](file:///C:/Users/computer/Downloads/system-design-visualizer/system-design-visualizer/src/components/landing/__tests__/HeroComputationalGraph.test.tsx) asserting all 8 connections (`conn-c01` through `conn-c08`), all 3 directional markers, safe corridor clearance, and reduced-motion support.
    - 5/5 Vitest tests pass cleanly. `tsc --noEmit` and `eslint` clean with 0 errors.
    - Strict adherence to Rule #1: all changes remain unstaged in the working tree.
- **Blast Radius**: Zero regressions; confined exclusively to the hero background SVG component, its unit tests, and architecture log.

---

## Decision Record 023: Framed Architectural Stage — Upward Intake Flow, Cloud Tier Enclosures & Horizontal Canopy Bus
- **Status**: Implemented & Verified
- **Category**: UI/UX, Design Systems, Information Architecture & Responsive Layout
- **Problem**:
  - The previous node arrangement stacked nodes in rigid vertical columns along the viewport edges and linked them with a looping oval ellipse that resembled a generic ring rather than authentic cloud infrastructure.
  - Furthermore, having Load Balancer at the bottom left created awkward, unnatural connection lines across the canvas.
- **Decision & Implementation**:
  - **1. Upward Intake Flow (Client $\rightarrow$ Ingress $\rightarrow$ Load Balancer)**:
    - Positioned `CLIENT` at the bottom left `(106, 440)`.
    - Positioned `INGRESS` in the middle left `(106, 275)`.
    - Positioned `LOAD_BALANCER` at the top left `(106, 110)`.
    - Requests initiate at Client and flow **upward** through Ingress into Load Balancer via vertical bus paths (`conn-c01`, `conn-c02`) with upward-pointing arrowheads.
  - **2. Horizontal Canopy Bus to Compute Cluster**:
    - With Load Balancer at the top left `(106, 110)`, level with App Service A `(1148, 115)`, traffic flows naturally across a dedicated horizontal canopy bus (`y = 48–54`) above the headline.
    - Branches cleanly into App Service A (`conn-c03`) and App Service B (`conn-c04`), modeling realistic L7 round-robin dispatch.
  - **3. Cloud Architecture Tier Enclosures**:
    - Framed the 7 nodes within 3 labeled structural tier enclosures:
      - `EDGE & INGRESS` (Left Flank)
      - `COMPUTE CLUSTER` (Upper Right Flank)
      - `PERSISTENCE TIER` (Lower Right Flank)
    - Preserved clean dark card styling without distracting glassmorphism or active status indicators.
  - **4. Framed Architectural Stage & Responsiveness**:
    - Wrapped the SVG within a centered `max-w-7xl` container (`w-full max-w-7xl h-full`), preventing ultra-wide monitor distortion.
    - Tier enclosures and node cards gracefully collapse for mobile (`hidden md:inline`), preserving ambient particles and circuit flows behind centered copy.
  - **5. Automated Verification**:
    - Updated [`HeroComputationalGraph.test.tsx`](file:///C:/Users/computer/Downloads/system-design-visualizer/system-design-visualizer/src/components/landing/__tests__/HeroComputationalGraph.test.tsx) asserting all 7 canonical nodes, 3 architectural tiers, 8 connections, directional markers, and central corridor clearance.
    - All unit tests pass 100%. `tsc --noEmit` and `eslint` clean with 0 errors / 0 warnings.
    - Strict adherence to Rule #1: all modifications remain unstaged in the working tree.
- **Blast Radius**: Zero regressions; confined exclusively to the hero background SVG component, its unit tests, and architecture log.

---

## Decision Record 024: Mobile-First Landing Page Optimization — Portrait Architecture Topology, Disciplines List View & Mobile Decluttering
- **Status**: Implemented & Verified
- **Category**: Mobile UX/UI, Responsive Architecture, Performance & Layout
- **Problem**:
  1. On mobile viewports (`< 768px`), hero nodes were completely hidden due to `hidden md:inline` CSS classes. Scaling down the 1280x640 widescreen SVG to fit a 390px mobile screen compressed coordinates by 3.3× (reducing 52px boxes to 15.7px dots with unreadable typography) and squished the circuit into a narrow 195px band behind the mobile headline and CTAs.
  2. The 6-card disciplines grid (`DisciplineCard`) consumed excessive vertical scroll height on mobile screens with heavy card chrome, multi-line descriptions, and topic tag lists.
  3. The 4 simulation engine feature cards (*"Explicit state transitions"*, *"Inspectable internals"*, etc.) and the interactive Canvas Studio sandbox (`MiniDistributedCanvas`) added visual clutter and heavy DOM overhead on small screens.
- **Decision & Implementation**:
  1. **Dual-Stage Responsive Computational Graph (`src/components/landing/HeroComputationalGraph.tsx`)**:
     - Decoupled the desktop widescreen stage (`hidden md:block w-full max-w-7xl h-full`, `viewBox="0 0 1280 640"`) from a dedicated portrait-optimized mobile architectural stage (`block md:hidden w-full h-full`, `viewBox="0 0 390 680"`).
     - **Top Tier (Edge & Ingress, $y=46$)**: Positions `Client`, `Ingress`, and `Load Balancer` in an uncluttered horizontal tier directly above the mobile headline, with glowing teal animated packet flows.
     - **Lateral Bus Conduits**: Channels requests down the left and right outer margins of the mobile screen ($x \approx 20\text{px}$ and $x \approx 370\text{px}$), gracefully framing the headline, subtitle, and CTA buttons without text collisions.
     - **Bottom Tier (Compute & Persistence, $y=585$)**: Positions `App Service A`, `App Service B`, `Application Cache`, and `Database` below the CTA buttons, with amber queries into Database and cyan requests into Cache, converging into the Section 2 vertical bus bridge.
     - Sized mobile node badges at $36 \times 36\text{px}$ with glowing accent rings and native `<title>` accessible tooltips, guaranteeing 100% visibility, crisp ergonomics, and zero text crowding.
  2. **Mobile Disciplines List View (`src/components/landing/page-sections.tsx`)**:
     - Retained the 3x2 card grid on tablet and desktop (`hidden md:grid`).
     - On smaller screens (`block md:hidden`), replaced cards with a high-contrast, touch-optimized list: discipline logo/icon + title on the left (`flex items-center gap-3.5`), and right arrow chevron (`ArrowRight`) on the right.
     - Included all 5 core disciplines (JavaScript, Operating Systems, Java & JVM, Frontend Architecture, Backend Internals) plus the 6th *"Explore Learning Paths"* directory link.
  3. **Mobile Decluttering for How It Works & Canvas Studio (`src/components/landing/page-sections.tsx`)**:
     - Applied `hidden md:grid` to the 4 simulation mechanics feature cards in `SimulationEngineSection`, keeping the explanatory copy and badges uncluttered.
     - Applied `hidden md:block` to the `MiniDistributedCanvas` sandbox widget in `CanvasStudioSection`, keeping the section heading and primary *"Build a System"* CTA prominent.
  4. **Automated Verification**:
     - Updated unit tests in [`LandingPage.test.tsx`](file:///C:/Users/computer/Downloads/system-design-visualizer/system-design-visualizer/src/components/landing/__tests__/LandingPage.test.tsx) and [`HeroComputationalGraph.test.tsx`](file:///C:/Users/computer/Downloads/system-design-visualizer/system-design-visualizer/src/components/landing/__tests__/HeroComputationalGraph.test.tsx) asserting responsive visibility classes, mobile node rendering, and mobile list content.
     - All 47 Vitest test suites (426 tests) pass 100% green.
     - `npx tsc --noEmit` clean with 0 errors.
     - `npx eslint` clean with 0 errors and 0 warnings.
     - Strict adherence to Rule #1: all modifications remain unstaged in the working tree.
- **Blast Radius**: Zero regressions; delivers an award-winning mobile experience with high readability, fast navigation, and dedicated portrait system architecture.

---

## Decision Record 025: Durable Product Context Capture (`PRODUCT.md`) & Design System Initialization
- **Status**: Implemented & Verified
- **Category**: Product Architecture, Design Authority & Workflow Configuration
- **Problem**:
  - The repository lacked a durable, centralized `PRODUCT.md` specification defining canonical product positioning, target audience, operating contexts, brand commitments, and foundational design principles.
  - Future UI refactorings and new features risked divergence between the low-level runtime simulators and the distributed system Canvas Studio without an authoritative contract.
- **Decision & Implementation**:
  - **1. Durable Product Truth Specification ([`PRODUCT.md`](file:///C:/Users/computer/Downloads/system-design-visualizer/system-design-visualizer/PRODUCT.md))**:
    - Captured confirmed product truth under `impeccable:product-schema 1`:
      - **Audience**: Dual-audience focus spanning CS students & engineers building intuition from code execution up to distributed systems (technical interview preparation and deep fundamental mastery).
      - **Purpose & Positioning**: Tactile, deterministic, inspectable simulation platform with strict two-phase execution, transparent abstractions, and real-time multiplayer capability.
      - **Dual-Pillar Strategy**: Equilibrium between micro runtime simulators (JavaScript, OS, Java/JVM, Frontend, Backend) and macro Canvas Studio distributed topologies.
      - **Frictionless Access Boundary**: Free open-access default for all simulation modules and canvas experimentation without sign-in; authentication and database persistence reserved for saving/sharing diagrams and collaborative workspaces.
      - **Brand Commitments**: Canonical name `System Simulator` (`systemsimulator.vercel.app`), *The Isometric Strata & Core* brand geometry, and tokenized discipline accent palettes.
  - **2. Workflow Configuration ([`.impeccable/config.json`](file:///C:/Users/computer/Downloads/system-design-visualizer/system-design-visualizer/.impeccable/config.json))**:
    - Recorded `"buildPath": "code"` reflecting that landing pages and runtime surfaces are already established, directing future work to lean, code-first implementation.
  - **3. Verification**:
    - Re-ran `impeccable context` confirming clean resolution of `PRODUCT.md` with zero schema violations.
    - `npx tsc --noEmit` verified with 0 errors.
    - Strict adherence to Rule #1: all modifications remain unstaged in the working tree.
- **Blast Radius**: Zero regressions; zero changes to production bundle or runtime components.

---

## Decision Record 026: Impeccable Landing Page Polish — Antipattern Elimination, Contrast Hardening & Eyebrow Ban Adherence
- **Status**: Implemented & Verified
- **Category**: UI/UX Craft, Design Systems, Typography & Accessibility Polish
- **Problem**:
  - Mechanical detector audits flagged `gradient-text` on the hero headline and `side-tab` 2px accent borders on code line containers in the runtime sandbox.
  - Formulaic SaaS kicker/eyebrow pill badges (`Core Disciplines`, `How It Works`, `Canvas Studio`) cluttered section headers in violation of the Impeccable craft floor ban.
  - Text selection color was low-contrast in light mode (`selection:text-amber-300` on amber-20), and "No sign-up required" used pseudo-technical monospace with sub-optimal WCAG contrast.
- **Decision & Implementation**:
  - **1. Gradient Text Elimination ([`page-sections.tsx`](file:///C:/Users/computer/Downloads/system-design-visualizer/system-design-visualizer/src/components/landing/page-sections.tsx))**:
    - Replaced the AI-tell gradient text and hue shimmer on "Understand how it works." with solid editorial `text-teal-600 dark:text-teal-400`, perfectly aligned with the teal computational network motif and Isometric Strata mark.
    - Removed orphaned `.headline-gradient-shimmer` keyframe rules from [`landing.css`](file:///C:/Users/computer/Downloads/system-design-visualizer/system-design-visualizer/src/components/landing/landing.css).
  - **2. Eyebrow Ban Adherence ([`page-sections.tsx`](file:///C:/Users/computer/Downloads/system-design-visualizer/system-design-visualizer/src/components/landing/page-sections.tsx))**:
    - Removed the redundant eyebrow pills above headings in `DisciplinesSection`, `SimulationEngineSection`, and `CanvasStudioSection`, letting the strong editorial headings speak with full authority.
  - **3. Side-Tab Accent Elimination ([`HeroRuntimeSandbox.tsx`](file:///C:/Users/computer/Downloads/system-design-visualizer/system-design-visualizer/src/components/landing/HeroRuntimeSandbox.tsx))**:
    - Upgraded active line highlighting from thick `border-l-2` to a refined 1px `border-l` with subtle inner highlight, satisfying the craft floor and eliminating all detector warnings.
  - **4. Contrast & Accessibility Polish**:
    - Upgraded text selection to `selection:bg-amber-500/25 selection:text-amber-950 dark:selection:text-amber-200`, delivering AAA contrast in both modes.
    - Upgraded "No sign-up required" from muted monospace `text-zinc-500 font-mono` to `text-zinc-600 dark:text-zinc-400 font-medium`.
    - Added responsive abbreviation to navbar CTA (`<span className="hidden sm:inline">Open </span>Canvas Studio`) preventing mobile navbar overcrowding.
  - **5. Automated Verification**:
    - Mechanical design detector returns clean `[]` across all landing files.
    - `npx eslint` on touched files clean (0 errors, 0 warnings).
    - `npx tsc --noEmit` clean with 0 errors.
    - Full Vitest test suite passes 100% (47 test files, 426 tests passing).
    - Strict adherence to Rule #1: all changes remain unstaged in the working tree.
- **Blast Radius**: Zero regressions; strictly elevated typographic craft, contrast, and visual maturity across the landing page.


