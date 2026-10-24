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


