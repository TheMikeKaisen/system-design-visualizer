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
    - CTAs: *"Browse All Modules"* and *"Open Canvas Studio"*.
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
    - Set initial playback to paused (`isAutoCycling: false, isPlayingManual: false`), allowing visitors to read idle state peacefully. Clicking "Step Run" initiates simulation and full tour across disciplines.
    - **High-Affordance Interactive Control Highlighting (Option 4)**:
      - The primary **"Step Run"** button features subject-themed luminescence (amber glow for JS, sky glow for OS, emerald glow for Java) with a live pulsing beacon (`animate-ping`) when idle.
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




