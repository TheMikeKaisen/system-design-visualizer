# Engineering Audit & Refactoring Proposal: JavaScript Subject
**System Simulator — Architectural, Reliability, Security, UI/UX, and Code Quality Evaluation**

**Audit Subject**: JavaScript (`/javascript`, 7 Simulator Episodes, `src/components/javascript`, `src/lib/js-simulator`, `src/store/useJSSimulationStore.ts`)  
**Target File**: `Agent_reports/javascript_audit_report.md`  
**Auditor**: Senior Software Architect, Staff-Level Engineer, Security Reviewer & Code Quality Auditor  
**Date**: October 2026  
**Status**: Completed — Ready for Mandatory Discussion & Approval Gate  

---

## Table of Contents
1. [Special Investigation: Episode Cards in `/javascript` Route](#1-special-investigation-episode-cards-in-javascript-route)
2. [Report A: Executive Summary](#report-a-executive-summary)
3. [Report B: Simulation Inventory](#report-b-simulation-inventory)
4. [Report C: Findings Register & Prior Investigation Corrections](#report-c-findings-register--prior-investigation-corrections)
5. [Report D: Duplication and Reuse Map](#report-d-duplication-and-reuse-map)
6. [Report E: Proposed Architecture & Component Flow](#report-e-proposed-architecture--component-flow)
7. [Report F: UI/UX & Visual Consistency Plan](#report-f-uiux--visual-consistency-plan)
8. [Report G: Testing, Reliability, and Security Plan](#report-g-testing-reliability-and-security-plan)
9. [Report H: Prioritized Implementation Roadmap](#report-h-prioritized-implementation-roadmap)
10. [Section 11: Mandatory Discussion and Approval Gate](#section-11-mandatory-discussion-and-approval-gate)
11. [Remaining Questions & Gaps](#remaining-questions--gaps)

---

## 1. Special Investigation: Episode Cards in `/javascript` Route

### Question
> *"Here check if we are creating a new component for each episode card in `/javascript` route too."*

### Codebase Evidence & Findings
- **File Checked**: [`src/app/javascript/page.tsx`](file:///C:/Users/computer/Downloads/system-design-visualizer/system-design-visualizer/src/app/javascript/page.tsx#L45-L299) (304 lines total).
- **Other Subject Landing Pages Inspected for Context**:
  - [`src/app/operating-systems/page.tsx`](file:///C:/Users/computer/Downloads/system-design-visualizer/system-design-visualizer/src/app/operating-systems/page.tsx#L48-L336) (343 lines, 7 inline cards)
  - [`src/app/frontend/page.tsx`](file:///C:/Users/computer/Downloads/system-design-visualizer/system-design-visualizer/src/app/frontend/page.tsx#L45-L245) (245 lines, 7 inline cards)
  - [`src/app/backend/page.tsx`](file:///C:/Users/computer/Downloads/system-design-visualizer/system-design-visualizer/src/app/backend/page.tsx#L45-L130) (130 lines, 3 inline cards)

### Conclusive Finding
1. **No Dedicated Component Per Card, But 100% Inline Duplication**:
   - We are **NOT** creating a dedicated component for each episode card in `/javascript`.
   - However, there is also **ZERO component reuse**.
   - In [`src/app/javascript/page.tsx`](file:///C:/Users/computer/Downloads/system-design-visualizer/system-design-visualizer/src/app/javascript/page.tsx#L47-L297), lines 47–297 contain **7 copy-pasted blocks** of 35 lines each (one for each Episode 1 through 7).
   - Every single card duplicates:
     - Card container styling: `relative h-full p-4 sm:p-6 rounded-2xl border border-border bg-card hover:border-[#F7DF1E]/50 hover:shadow-[0_0_30px_-5px_rgba(247,223,30,0.2)] transition-all duration-300 flex flex-col justify-center`
     - Desktop episode badge (`text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60`)
     - Responsive mobile/desktop layout switch (`flex items-center sm:block gap-4 sm:gap-0`)
     - Icon wrapper with hover transition (`w-12 h-12 sm:w-10 sm:h-10 shrink-0 rounded-xl bg-[#F7DF1E]/10 text-amber-500 flex items-center justify-center sm:mb-4 group-hover:scale-110 transition-transform duration-300`)
     - Mobile-only episode badge (`text-[9px] font-bold uppercase tracking-widest text-muted-foreground/60`)
     - Title clamp: `text-base sm:text-xl font-bold text-foreground sm:mb-3 group-hover:text-amber-500 transition-colors line-clamp-2`
     - Description clamp: `hidden sm:block text-sm text-muted-foreground mb-6 leading-relaxed line-clamp-3`
     - Mobile chevron arrow
     - Footer date and "Launch" CTA button with translate hover effect (`group-hover:translate-x-0.5 transition-transform`).

2. **System-Wide Anti-Pattern**:
   - This exact inline card copy-paste is repeated across `operating-systems/page.tsx` (7 cards), `frontend/page.tsx` (7 cards), and `backend/page.tsx` (3 cards).
   - In total, **24 identical 35-line card structures** (~840 lines) are duplicated across the project's landing pages.

3. **Recommendation**:
   - Extract a reusable, accessible `<EpisodeCard>` primitive into [`src/components/ui/EpisodeCard.tsx`](file:///C:/Users/computer/Downloads/system-design-visualizer/system-design-visualizer/src/components/ui) driven by a typed metadata array (`EpisodeMetadata[]`).
   - This shrinks [`src/app/javascript/page.tsx`](file:///C:/Users/computer/Downloads/system-design-visualizer/system-design-visualizer/src/app/javascript/page.tsx) from **304 lines down to ~45 lines**, establishes single-source-of-truth styling, and provides a reusable primitive ready for `/operating-systems`, `/backend`, and `/frontend`.

---

## 2. Report A: Executive Summary

### Overall Condition of the Subject
The JavaScript visualization module provides an engaging educational experience, visually explaining V8 engine fundamentals: Call Stack, Hoisting & TDZ, Scope Chaining, let/const/var, Block Scope & Shadowing, Closures, and the Event Loop. The visual feedback and stepwise walkthroughs are conceptually intuitive for students.

However, an exhaustive engineering audit reveals that the underlying codebase suffers from:
1. **Severe Architectural Duplication**: >80% (>1,200 lines) of the code across the 7 simulator pages is identical copy-pasted boilerplate (navigation, controls, dropdowns, overlays, timers).
2. **Cross-Route State Leakage & Frame Flash**: Because [`useJSSimulationStore`](file:///C:/Users/computer/Downloads/system-design-visualizer/system-design-visualizer/src/store/useJSSimulationStore.ts) is a global Zustand singleton with deferred `useEffect` initialization, navigating between episodes momentarily renders the data, code, variables, and flags of the *previous* episode.
3. **React 19 Render Violations**: 8 ESLint `react-hooks/set-state-in-effect` errors and render-phase `setState` mutations in [`MobileTabbedPanels.tsx:21-23`](file:///C:/Users/computer/Downloads/system-design-visualizer/system-design-visualizer/src/components/javascript/MobileTabbedPanels.tsx#L21-L23).
4. **UX & Accessibility Flaws**: In Episode 7, the step explanation popup automatically disappears after **2 seconds**, preventing students from reading it. Furthermore, **zero keyboard shortcuts exist** anywhere in the module (violating WCAG 2.1.1).
5. **Zero Automated Test Coverage**: 30 test files and 240 tests exist across the repository, but **exactly 0 tests exist for the JavaScript visualizer**.

### Top Five Recommended Improvements
1. **Eliminate Cross-Route State Leakage & Harden Defensive Indexing**:
   Reset simulator store state on unmount and clamp index lookups defensively across all components (`CallStackPanel`, `ExecutionContextPanel`, `CodePanel`, `ConsolePanel`).
2. **Extract `<SimulationShell>` Layout**:
   Centralize navigation, playback controls, progress scrubber, scenario dropdown, keyboard shortcuts, and auto-play timers into a single unified layout.
3. **Extract Reusable `<EpisodeCard>` Component**:
   Replace 250 lines of duplicate card JSX in `/javascript/page.tsx` with a typed `<EpisodeCard>` primitive.
4. **Fix Episode 7 Explanation Auto-Dismissal & Reconcile Asynchronous Queues**:
   Keep educational explanations permanently visible on the active step (matching Episodes 1–6), and reconcile the deprecated `taskQueue` in Episode 6 with Episode 7's `webAPIs` and queues.
5. **Build Comprehensive Behavioral Test Suite**:
   Implement unit tests for `useJSSimulationStore`, scenario integrity tests (validating line numbers and step continuity), and component rendering tests.

---

## 3. Report B: Simulation Inventory

| Episode | Entry Route | Main Components | Scenario Data | State Ownership | Verified Issues & Code Smells |
|---|---|---|---|---|---|
| **1: Call Stack** | [`/javascript/simulator/call-stack`](file:///C:/Users/computer/Downloads/system-design-visualizer/system-design-visualizer/src/app/javascript/simulator/call-stack/page.tsx) | `CodePanel`, `CallStackPanel`, `ExecutionContextPanel`, `MobileTabbedPanels` | `GREET_SCENARIO` ([`engine.ts:77`](file:///C:/Users/computer/Downloads/system-design-visualizer/system-design-visualizer/src/lib/js-simulator/engine.ts#L77)) | `useJSSimulationStore` | `scenario.steps[currentStepIndex].toastMessage` on line 50 lacks optional chaining (unlike all other episodes). Flash of previous scenario on navigation. No scenario dropdown (hardcoded 1 scenario). |
| **2: Hoisting** | [`/javascript/simulator/hoisting`](file:///C:/Users/computer/Downloads/system-design-visualizer/system-design-visualizer/src/app/javascript/simulator/hoisting/page.tsx) | `CodePanel`, `CallStackPanel`, `ExecutionContextPanel`, `MobileTabbedPanels`, Custom Dropdown, VisualEffect Overlay | 4 scenarios in [`hoisting-scenarios.ts:301`](file:///C:/Users/computer/Downloads/system-design-visualizer/system-design-visualizer/src/lib/js-simulator/hoisting-scenarios.ts#L301) | `useJSSimulationStore` | `HOISTING_FUNC_DECL_SCENARIO` skips `Creation Phase` of `hello() FEC` and pops both frames in one step. 47-line `visualEffect` overlay duplicate of Ep 4 & 5. Dropdown shows previous episode title on initial mount. |
| **3: Scope Chaining** | [`/javascript/simulator/scope`](file:///C:/Users/computer/Downloads/system-design-visualizer/system-design-visualizer/src/app/javascript/simulator/scope/page.tsx) | `CodePanel`, `CallStackPanel`, `ExecutionContextPanel`, `MobileTabbedPanels`, Custom Dropdown, Resolution Trace Overlay | 5 scenarios in [`scope-scenarios.ts:808`](file:///C:/Users/computer/Downloads/system-design-visualizer/system-design-visualizer/src/lib/js-simulator/scope-scenarios.ts#L808) | `useJSSimulationStore` | `Resolution Trace` popup overlay (lines 204–246) hardcoded with string inspections (`log.includes("✅")`). Entire overlay is copy-pasted into Episode 6. |
| **4: let, const & var** | [`/javascript/simulator/let-const`](file:///C:/Users/computer/Downloads/system-design-visualizer/system-design-visualizer/src/app/javascript/simulator/let-const/page.tsx) | `CodePanel`, `CallStackPanel`, `ExecutionContextPanel`, `MobileTabbedPanels`, Custom Dropdown, VisualEffect Overlay | 6 scenarios in [`let-const-scenarios.ts:406`](file:///C:/Users/computer/Downloads/system-design-visualizer/system-design-visualizer/src/lib/js-simulator/let-const-scenarios.ts#L406) | `useJSSimulationStore` | High educational redundancy with Episode 2 (both teach TDZ with `let`/`const`). 47-line duplicate `visualEffect` overlay. |
| **5: Block Scope** | [`/javascript/simulator/block-scope`](file:///C:/Users/computer/Downloads/system-design-visualizer/system-design-visualizer/src/app/javascript/simulator/block-scope/page.tsx) | `CodePanel`, `CallStackPanel`, `ExecutionContextPanel`, `MobileTabbedPanels`, Custom Dropdown, VisualEffect Overlay | 6 scenarios in [`block-scope-scenarios.ts:1094`](file:///C:/Users/computer/Downloads/system-design-visualizer/system-design-visualizer/src/lib/js-simulator/block-scope-scenarios.ts#L1094) | `useJSSimulationStore` | Scenario 1 (`BLOCK_SCENARIO_1_WHAT_IS_A_BLOCK`) has dead code on lines 13–14 after uncaught ReferenceError at line 12. Tree nesting heuristic in `ExecutionContextPanel:269` assumes parent is `i + 1`. Duplicate `visualEffect` overlay. |
| **6: Closures** | [`/javascript/simulator/closures`](file:///C:/Users/computer/Downloads/system-design-visualizer/system-design-visualizer/src/app/javascript/simulator/closures/page.tsx) | `CodePanel`, `CallStackPanel`, `ExecutionContextPanel`, `TaskQueuePanel`, `MobileTabbedPanels`, Custom Dropdown, SyntaxError Modal, Resolution Trace Overlay | 6 scenarios in [`closure-scenarios.ts:2857`](file:///C:/Users/computer/Downloads/system-design-visualizer/system-design-visualizer/src/lib/js-simulator/closure-scenarios.ts#L2857) | `useJSSimulationStore` | Closures stuffed in `callStack` array as `{ isClosure: true }`. In `ExecutionContextPanel:269`, tree construction does NOT check `isClosure`, rendering closures as orphan root cards instead of displaying parent lexical linkage. Uses deprecated `TaskQueuePanel` for `taskQueue: []`. 100% duplicate of Ep 3 `Resolution Trace` popup. |
| **7: Event Loop** | [`/javascript/simulator/event-loop`](file:///C:/Users/computer/Downloads/system-design-visualizer/system-design-visualizer/src/app/javascript/simulator/event-loop/page.tsx) | `CodePanel`, `CallStackPanel`, `WebAPIsPanel`, `MicrotaskQueuePanel`, `CallbackQueuePanel`, `EventLoopIndicator`, `ConsolePanel`, `StepExplanationPopup`, `EventLoopMobilePanels`, Custom Dropdown | 6 scenarios in [`event-loop-scenarios.ts:1404`](file:///C:/Users/computer/Downloads/system-design-visualizer/system-design-visualizer/src/lib/js-simulator/event-loop-scenarios.ts#L1404) | `useJSSimulationStore` | Completely divergent layout architecture. `StepExplanationPopup` auto-dismisses after 2 seconds, destroying readability. Standalone `ConsolePanel` while Ep 1–6 embeds console in `CodePanel`. `CodePanel` hardcodes check for `!scenario.id.startsWith("el-")`. `MicrotaskQueuePanel` and `CallbackQueuePanel` are 95% duplicate code. `CallStackPanel:15` has unused `isEventLoopMode`. |

---

## 4. Report C: Findings Register & Prior Investigation Corrections

### Detailed Review & Corrections of Prior Investigation
The prior investigation identified real surface symptoms but made several key errors in mechanism, missed major educational bugs, and hallucinated a security vulnerability:

1. **Prior Finding JS-CRIT-01 Correction (Crash Mechanism & Real Flaw)**:
   - *Prior Claim*: "User is on an episode with 7+ steps at step index 6, navigates to Call Stack (defaults to 4 steps). Before useEffect calls setScenario, initial synchronous render uses currentStepIndex: 6 against a 4-step array, crashing with TypeError."
   - *What the Code Actually Shows*: In Next.js/React, `useJSSimulationStore` is a global Zustand singleton. On the initial render of `/javascript/simulator/call-stack`, `scenario` in the store is **STILL the 7-step scenario** from the previous page! It does not magically revert to a 4-step array on mount. When `useEffect` runs `setScenario(GREET_SCENARIO)`, Zustand atomically resets BOTH `scenario` to `GREET_SCENARIO` AND `currentStepIndex` to 0 in a single `set({...})` call.
   - *The Real Flaw Identified*: **Cross-Episode State Leakage / Frame Flash**. On every navigation between episodes, the destination page renders the *previous* episode's code, title, and variables for 1 frame before switching. The crash risk is real in edge cases (e.g. empty step arrays or out-of-order store dispatch) because `ExecutionContextPanel.tsx:69, 254`, `CallStackPanel.tsx:9-10`, `CodePanel.tsx:12-13`, `ConsolePanel.tsx:7`, and `call-stack/page.tsx:50` completely lack fallback guards for `scenario.steps[currentStepIndex] === undefined`.
2. **Prior Finding JS-SEC-10 Correction (Hallucinated Vulnerability)**:
   - *Prior Claim*: "Finding JS-SEC-10: Denial of Service Risk from Rapid Auto-Play Keypresses / Unbounded Loop: Keyboard shortcuts and auto-play loops trigger rapid Zustand state dispatches...".
   - *What the Code Actually Shows*: **ZERO keyboard shortcut listeners exist anywhere in the JavaScript simulator codebase!** Grep for `keydown`, `keypress`, and `keyup` returned 0 results. The prior investigator hallucinated both the feature and the vulnerability.
   - *The Real Defect Identified*: **Severe Accessibility & UX Gap (WCAG 2.1.1 Keyboard Accessible)**. Users are completely unable to interact with the simulator via keyboard; every step requires mouse clicks on buttons that lack ARIA keyboard handlers.
3. **Prior Report Gaps Uncovered**:
   - The prior investigator missed that Episode 7's educational explanation auto-dismisses after 2 seconds, crippling learning.
   - The prior investigator missed that Episode 6 duplicates Episode 3's `Resolution Trace` popup.
   - The prior investigator missed that Episode 5 Scenario 1 contains dead, unreachable code after an uncaught ReferenceError.
   - The prior investigator missed that `hoisting`, `let-const`, and `block-scope` all copy-paste the exact same 48-line `visualEffect` overlay.

---

### Finding JS-MED-01: Cross-Episode State Leakage & Frame Flash (Zustand Global Singleton)
- **Category**: State Management & Architecture
- **Severity**: **Medium**
- **Affected Files**:
  - All 7 simulator pages (`src/app/javascript/simulator/*/page.tsx`)
  - [`src/store/useJSSimulationStore.ts`](file:///C:/Users/computer/Downloads/system-design-visualizer/system-design-visualizer/src/store/useJSSimulationStore.ts)
- **Evidence**:
  In each simulator page, the scenario is initialized inside `useEffect`:
  ```tsx
  // src/app/javascript/simulator/hoisting/page.tsx:30-34
  useEffect(() => {
    if (!ALL_HOISTING_SCENARIOS.find(s => s.id === scenario.id)) {
      setScenario(ALL_HOISTING_SCENARIOS[0]);
    }
  }, [scenario.id, setScenario]);
  ```
- **Impact**:
  Because `useEffect` runs asynchronously after the first paint, the new episode renders using the state of the *previous* episode for the first frame. For example, entering Hoisting from Call Stack renders "Greeting Function Execution" in the dropdown and displays Call Stack code in the editor for 1 frame.
- **Recommended Fix**:
  Add an episode wrapper/shell that either resets store state on unmount, or use an episode-scoped provider/store.
- **Effort**: Small | **Regression Risk**: Low

---

### Finding JS-HIGH-02: Missing Defensive Step Index Fallbacks in Shared Panels
- **Category**: Runtime Reliability
- **Severity**: **High**
- **Affected Files**:
  - [`src/components/javascript/ExecutionContextPanel.tsx:69, 253-254`](file:///C:/Users/computer/Downloads/system-design-visualizer/system-design-visualizer/src/components/javascript/ExecutionContextPanel.tsx#L69)
  - [`src/components/javascript/CallStackPanel.tsx:9-10`](file:///C:/Users/computer/Downloads/system-design-visualizer/system-design-visualizer/src/components/javascript/CallStackPanel.tsx#L9-L10)
  - [`src/components/javascript/CodePanel.tsx:12-13`](file:///C:/Users/computer/Downloads/system-design-visualizer/system-design-visualizer/src/components/javascript/CodePanel.tsx#L12-L13)
  - [`src/components/javascript/ConsolePanel.tsx:7, 19`](file:///C:/Users/computer/Downloads/system-design-visualizer/system-design-visualizer/src/components/javascript/ConsolePanel.tsx#L7)
  - [`src/app/javascript/simulator/call-stack/page.tsx:50`](file:///C:/Users/computer/Downloads/system-design-visualizer/system-design-visualizer/src/app/javascript/simulator/call-stack/page.tsx#L50)
- **Evidence**:
  ```tsx
  // CallStackPanel.tsx:9-10
  const currentState = scenario.steps[currentStepIndex];
  const callStack = currentState.callStack.filter(ec => !ec.isBlockScope && !ec.isClosure);

  // ExecutionContextPanel.tsx:69
  const scopeLookup = scenario.steps[currentStepIndex].scopeLookup;
  ```
- **Impact**:
  If `scenario.steps` is ever empty, or `currentStepIndex` evaluates out of bounds during fast state transitions, the entire page crashes with an uncaught `TypeError: Cannot read properties of undefined`.
- **Recommended Fix**:
  Implement safe fallback derivation:
  ```tsx
  const currentState = scenario.steps[currentStepIndex] ?? scenario.steps[0] ?? null;
  if (!currentState) return null;
  ```
- **Effort**: Small | **Regression Risk**: Very Low

---

### Finding JS-BUG-03: Auto-Play Timer Leak on Same-Episode Re-entry
- **Category**: State Management & Lifecycle
- **Severity**: **Medium**
- **Affected Files**:
  - All 7 simulator pages (`src/app/javascript/simulator/*/page.tsx`)
  - [`src/store/useJSSimulationStore.ts`](file:///C:/Users/computer/Downloads/system-design-visualizer/system-design-visualizer/src/store/useJSSimulationStore.ts)
- **Evidence**:
  When a user leaves a simulator with `isPlaying: true`, the local `setTimeout` is cleared by `clearTimeout(timer)`, but `isPlaying: true` remains in Zustand. When returning to the same episode, `scenario.id` matches, so `setScenario` is not called, and the page immediately auto-plays without user consent.
- **Recommended Fix**:
  Add an unmount cleanup hook in the simulator shell:
  ```tsx
  useEffect(() => {
    return () => {
      useJSSimulationStore.getState().reset();
    };
  }, []);
  ```
- **Effort**: Small | **Regression Risk**: Very Low

---

### Finding JS-BUG-04: React 19 Linting Violations (`react-hooks/set-state-in-effect`)
- **Category**: Runtime Reliability / Linting
- **Severity**: **Medium**
- **Affected Files**:
  - `call-stack/page.tsx:51`, `hoisting/page.tsx:52`, `scope/page.tsx:51`, `let-const/page.tsx:52`, `block-scope/page.tsx:51`, `closures/page.tsx:52`
  - [`src/components/javascript/StepExplanationPopup.tsx:24`](file:///C:/Users/computer/Downloads/system-design-visualizer/system-design-visualizer/src/components/javascript/StepExplanationPopup.tsx#L24)
  - [`src/components/javascript/CodePanel.tsx:21`](file:///C:/Users/computer/Downloads/system-design-visualizer/system-design-visualizer/src/components/javascript/CodePanel.tsx#L21)
- **Evidence**:
  Verified with `npx eslint src/app/javascript src/components/javascript`:
  ```
  error: Calling setState synchronously within an effect can trigger cascading renders  react-hooks/set-state-in-effect
  ```
- **Impact**:
  Causes redundant synchronous renders in React 19 and triggers build warnings.
- **Recommended Fix**:
  Derive active notifications directly from `currentState.toastMessage` without storing redundant local state, or use a notification manager with timed auto-dismissal.
- **Effort**: Small | **Regression Risk**: Low

---

### Finding JS-BUG-05: Render-Phase State Mutation in `MobileTabbedPanels.tsx`
- **Category**: React Render Purity
- **Severity**: **Medium**
- **Affected File**: [`src/components/javascript/MobileTabbedPanels.tsx:21-23`](file:///C:/Users/computer/Downloads/system-design-visualizer/system-design-visualizer/src/components/javascript/MobileTabbedPanels.tsx#L21-L23)
- **Evidence**:
  ```tsx
  if (activeTab === "queue" && !hasTaskQueue) {
    setActiveTab("callstack");
  }
  ```
- **Impact**:
  Mutating state during render violates React purity, triggering console warnings and erratic re-renders in concurrent mode.
- **Recommended Fix**:
  Use derived tab selection:
  ```tsx
  const effectiveTab = (activeTab === "queue" && !hasTaskQueue) ? "callstack" : activeTab;
  ```
- **Effort**: Small | **Regression Risk**: Very Low

---

### Finding JS-UX-06: Episode 7 Explanation Auto-Dismissal Cripples Learning
- **Category**: UI/UX & Educational Accuracy
- **Severity**: **High**
- **Affected File**: [`src/components/javascript/StepExplanationPopup.tsx:25-27, 34`](file:///C:/Users/computer/Downloads/system-design-visualizer/system-design-visualizer/src/components/javascript/StepExplanationPopup.tsx#L25-L27)
- **Evidence**:
  ```tsx
  if (scenario.steps[currentStepIndex]?.explanation) {
    setActiveExplanation(scenario.steps[currentStepIndex].explanation!);
    if (!isHoveringExplanation) {
      t = setTimeout(() => setActiveExplanation(null), 2000);
    }
  }
  ```
- **Impact**:
  In Episode 7, the educational explanation popup automatically disappears after **2 seconds** unless the user rapidly hovers over it. This severely impedes learners trying to digest how microtasks, macrotasks, and the event loop coordinate. In Episodes 1–6, explanations remain permanently visible on the step. Furthermore, `isHoveringExplanation` in the dependency array causes re-render ping-pong.
- **Recommended Fix**:
  Keep the explanation persistently visible for the duration of the step.
- **Effort**: Small | **Regression Risk**: Low

---

### Finding JS-UX-07: Complete Absence of Keyboard Navigation (WCAG 2.1.1 Failure)
- **Category**: Accessibility & UI/UX
- **Severity**: **Medium**
- **Affected Files**: All files in `src/app/javascript/` and `src/components/javascript/`
- **Evidence**:
  Repository search for `keydown`, `keypress`, `keyup`, and `onKeyDown` yielded **zero keyboard handlers**.
- **Impact**:
  Users cannot advance steps with Right Arrow, step back with Left Arrow, toggle playback with Space, or restart with R. Keyboard-only users and screen reader users cannot operate the simulator controls.
- **Recommended Fix**:
  Implement a global keyboard shortcuts listener in `<SimulationShell>` (`Space`, `ArrowRight`, `ArrowLeft`, `R`) with proper focus management and `aria-label` tags on all buttons.
- **Effort**: Small | **Regression Risk**: Very Low

---

### Finding JS-ARCH-08: Extreme Code Duplication Across Simulator Pages (>1,200 Lines)
- **Category**: Architecture & Maintainability
- **Severity**: **High**
- **Affected Files**: All 7 simulator pages (`src/app/javascript/simulator/*/page.tsx`)
- **Evidence**:
  The 7 pages contain ~1,848 lines of code. >1,200 lines are verbatim duplicates:
  - Navbar & logo links (45 lines x 7 = 315 lines)
  - Playback controls & progress scrubber (40 lines x 7 = 280 lines)
  - Dropdown menu markup, state, and click-outside listener (35 lines x 6 = 210 lines)
  - VisualEffect error overlay markup (48 lines x 3 = 144 lines)
  - Resolution trace popup markup (45 lines x 2 = 90 lines)
  - Auto-play and toast timer effects (25 lines x 7 = 175 lines)
- **Impact**:
  Any bugfix, shortcut addition, or styling update requires changing 7 distinct files, guaranteeing code drift.
- **Recommended Fix**:
  Extract a single declarative `<SimulationShell>` component in `src/components/javascript/SimulationShell.tsx`.
- **Effort**: Medium | **Regression Risk**: Low

---

### Finding JS-ARCH-09: 95% Code Duplication Between `MicrotaskQueuePanel` and `CallbackQueuePanel`
- **Category**: Shared Components & Reusability
- **Severity**: **Medium**
- **Affected Files**:
  - [`src/components/javascript/MicrotaskQueuePanel.tsx`](file:///C:/Users/computer/Downloads/system-design-visualizer/system-design-visualizer/src/components/javascript/MicrotaskQueuePanel.tsx) (76 lines)
  - [`src/components/javascript/CallbackQueuePanel.tsx`](file:///C:/Users/computer/Downloads/system-design-visualizer/system-design-visualizer/src/components/javascript/CallbackQueuePanel.tsx) (73 lines)
- **Evidence**:
  Both components share identical layoutId animations, spring physics, queue item cards, callback truncation, and empty state cards. They differ only in color theme (`fuchsia` vs `amber`) and header title badge.
- **Recommended Fix**:
  Unify into `<QueuePanel variant="microtask" | "callback" />`.
- **Effort**: Small | **Regression Risk**: Very Low

---

### Finding JS-ARCH-10: Inconsistent Asynchronous Queue Mental Model (Episode 6 vs Episode 7)
- **Category**: Architecture & Educational Consistency
- **Severity**: **Medium**
- **Affected Files**:
  - [`src/lib/js-simulator/engine.ts:63`](file:///C:/Users/computer/Downloads/system-design-visualizer/system-design-visualizer/src/lib/js-simulator/engine.ts#L63)
  - [`src/lib/js-simulator/closure-scenarios.ts:2812`](file:///C:/Users/computer/Downloads/system-design-visualizer/system-design-visualizer/src/lib/js-simulator/closure-scenarios.ts#L2812)
  - [`src/components/javascript/TaskQueuePanel.tsx`](file:///C:/Users/computer/Downloads/system-design-visualizer/system-design-visualizer/src/components/javascript/TaskQueuePanel.tsx)
- **Evidence**:
  In `engine.ts:63`: `taskQueue?: TaskQueueItem[]; // Deprecated for Episode 7, kept for Episode 6`.
  Episode 6 models timers using a monolithic `taskQueue` and renders `TaskQueuePanel`. Episode 7 introduces `webAPIs`, `microtaskQueue`, and `callbackQueue`.
- **Impact**:
  Learners are presented with conflicting architecture models between consecutive episodes.
- **Recommended Fix**:
  Migrate Episode 6 Scenario 6 to use `webAPIs` and `callbackQueue`, deprecating `TaskQueuePanel.tsx`.
- **Effort**: Small | **Regression Risk**: Low

---

### Finding JS-ARCH-11: Call Stack Abused for Block Scopes & Closures (Spec Inaccuracy)
- **Category**: Architecture & Educational Accuracy
- **Severity**: **Medium**
- **Affected Files**:
  - [`src/lib/js-simulator/engine.ts:8-16`](file:///C:/Users/computer/Downloads/system-design-visualizer/system-design-visualizer/src/lib/js-simulator/engine.ts#L8-L16)
  - [`src/components/javascript/CallStackPanel.tsx:10`](file:///C:/Users/computer/Downloads/system-design-visualizer/system-design-visualizer/src/components/javascript/CallStackPanel.tsx#L10)
  - [`src/components/javascript/ExecutionContextPanel.tsx:269`](file:///C:/Users/computer/Downloads/system-design-visualizer/system-design-visualizer/src/components/javascript/ExecutionContextPanel.tsx#L269)
- **Evidence**:
  In `CallStackPanel.tsx:10`:
  `const callStack = currentState.callStack.filter(ec => !ec.isBlockScope && !ec.isClosure);`
  In `ExecutionContextPanel.tsx:269`, tree nesting only checks `ec.isBlockScope`. `ec.isClosure` is ignored, rendering closures as disconnected root cards.
- **Impact**:
  In V8/ECMAScript, block scopes are Lexical Environments and closures reside in Heap memory; neither is a call stack frame.
- **Recommended Fix**:
  Separate `callStack: StackFrame[]` from `lexicalEnvironments` and `heapClosures`.
- **Effort**: Medium | **Regression Risk**: Medium

---

### Finding JS-EDU-12: Unreachable Dead Code in Block Scope Scenario 1
- **Category**: Educational Accuracy
- **Severity**: **Low**
- **Affected File**: [`src/lib/js-simulator/block-scope-scenarios.ts:6-14, 194-220`](file:///C:/Users/computer/Downloads/system-design-visualizer/system-design-visualizer/src/lib/js-simulator/block-scope-scenarios.ts#L6-L14)
- **Evidence**:
  The scenario code shows:
  ```javascript
  { let a = 10; const b = 20; var c = 30; }
  console.log(a); // Step 8 throws uncaught ReferenceError
  console.log(b); // Step 9 NEVER RUNS
  console.log(c); // Step 10 NEVER RUNS
  ```
  Step 8 halts execution due to uncaught ReferenceError. Lines `console.log(b)` and `console.log(c)` are never executed, confusing learners who expect to see `c` print `30`.
- **Recommended Fix**:
  Wrap in separate try/catch blocks or explain why execution halts in step notes.
- **Effort**: Small | **Regression Risk**: Low

---

### Finding JS-TEST-13: Complete Absence of Test Coverage
- **Category**: Testing Strategy
- **Severity**: **High**
- **Affected Files**: All files in `src/app/javascript`, `src/components/javascript`, `src/lib/js-simulator`, `src/store/useJSSimulationStore.ts`.
- **Evidence**:
  `npx vitest run` executed 30 test files and 240 tests; **0 tests cover the JavaScript visualizer**.
- **Impact**:
  Refactoring or adding features risks silent regression of step line calculations or state synchronization.
- **Recommended Fix**:
  Add unit tests for `useJSSimulationStore`, scenario integrity tests, and component render tests.
- **Effort**: Medium | **Regression Risk**: None (additive)

---

## 5. Report D: Duplication and Reuse Map

| Component / Logic | Occurrences | Duplication Type | Recommended Action | Classification |
|---|---|---|---|---|
| **Episode Card UI** | 7 occurrences in `app/javascript/page.tsx` (plus 17 across backend, frontend, OS) | Structural & Visual (100% duplicate) | Extract `<EpisodeCard>` into `src/components/ui/EpisodeCard.tsx` driven by typed `EpisodeMetadata[]`. | **A. Extract and reuse** |
| **Playback Control Bar** | 7 occurrences across all simulator pages | Exact logic & markup | Extract `<PlaybackControls>` into `src/components/javascript/controls/`. | **A. Extract and reuse** |
| **Simulator Navbar & Breadcrumbs** | 7 occurrences across all simulator pages | Exact markup | Extract `<SimulatorNavbar>` into `src/components/javascript/controls/`. | **A. Extract and reuse** |
| **Scenario Selector Dropdown** | 6 occurrences (Episodes 2–7) | Exact logic, ref, & markup | Extract `<ScenarioDropdown>` with accessible keyboard navigation into `src/components/javascript/controls/`. | **A. Extract and reuse** |
| **VisualEffect Error Overlay** | 3 occurrences (Hoisting, let-const, Block Scope) | Exact 48-line JSX block | Extract `<VisualEffectOverlay>` into `src/components/javascript/overlays/`. | **A. Extract and reuse** |
| **Resolution Trace Overlay** | 2 occurrences (Scope, Closures) | Exact 45-line JSX block | Extract `<ResolutionTraceOverlay>` into `src/components/javascript/overlays/`. | **A. Extract and reuse** |
| **Queue Panels** | `MicrotaskQueuePanel.tsx` & `CallbackQueuePanel.tsx` | Structural (95% duplicate) | Consolidate into `<QueuePanel variant="microtask" | "callback" />`. | **A. Extract and reuse** |
| **Console Output** | Embedded in `CodePanel.tsx` (Ep 1–6) vs `ConsolePanel.tsx` (Ep 7) | Duplicate markup & purpose | Extract pure `<ConsoleOutput lines={...} />` view component. | **B. Share logic, preserve separate UI** |
| **Mobile Panels Container** | `MobileTabbedPanels.tsx` vs `EventLoopMobilePanels.tsx` | Structural | Keep separate due to 3-tab vs 5-tab layout differences, but share tab button styling primitives. | **C. Share design tokens / primitives** |

---

## 6. Report E: Proposed Architecture & Component Flow

```
                      ┌────────────────────────────────────────┐
                      │        app/javascript/page.tsx         │
                      │ (Clean map over JAVASCRIPT_EPISODES)   │
                      └───────────────────┬────────────────────┘
                                          │
                                          ▼
                      ┌────────────────────────────────────────┐
                      │   src/components/ui/EpisodeCard.tsx    │
                      └────────────────────────────────────────┘

                                    Simulator Routes
                      ┌────────────────────────────────────────┐
                      │    src/app/javascript/simulator/*      │
                      └───────────────────┬────────────────────┘
                                          │
                                          ▼
                      ┌────────────────────────────────────────┐
                      │            SimulationShell             │
                      │  - SimulatorNavbar & Back to JS        │
                      │  - ScenarioDropdown Selector           │
                      │  - PlaybackControls (Play, Prev, Next) │
                      │  - Keyboard Shortcuts (Space, Arrows)  │
                      │  - Step Progress Bar & Scrubber        │
                      │  - Step Explanation Banner             │
                      │  - Auto-Play Timer (cleans on unmount) │
                      │  - VisualEffect / Trace Overlays       │
                      └───────────────────┬────────────────────┘
                                          │
                   ┌──────────────────────┴──────────────────────┐
                   ▼                                             ▼
     ┌────────────────────────────┐               ┌─────────────────────────────┐
     │  Standard 3-Panel Layout   │               │   Event Loop Landscape      │
     │  - CodePanel               │               │   - Top: CodePanel,         │
     │  - CallStackPanel          │               │          CallStack, WebAPIs │
     │  - ExecutionContextPanel   │               │   - Bottom: QueuePanel      │
     │  - MobileTabbedPanels      │               │     (Microtask/Callback),   │
     └────────────────────────────┘               │     EventLoopIndicator,     │
                                                  │     ConsolePanel            │
                                                  └─────────────────────────────┘
```

---

## 7. Report F: UI/UX & Visual Consistency Plan

### Inconsistencies Identified
1. **Explanation Placement Drift**:
   - Episodes 1–6 render explanation docked at the bottom of `CodePanel`.
   - Episode 7 renders a floating `StepExplanationPopup` that disappears after 2 seconds.
2. **Console Placement**:
   - Episodes 1–6 embed the console docked inside `CodePanel` (hidden on mobile).
   - Episode 7 renders a standalone bottom card.
3. **Dropdown Sizing**:
   - Different truncation limits (`max-w-[130px]` vs `max-w-[150px]`) and widths (`w-64` vs `w-72`).
4. **Color Contrast**:
   - Micro-badges (`text-[9px]` with `text-muted-foreground/60`) fail WCAG 2.1 AA minimum contrast (requires 4.5:1).

### Open-Source Reference Research
| Project / Design System | Repository / Link | Key Insight / Interaction Worth Studying | Adoption Recommendation |
|---|---|---|---|
| **Radix UI Primitives** | [github.com/radix-ui/primitives](https://github.com/radix-ui/primitives) | Accessible dropdown menus and tooltips with full keyboard navigation and ARIA attributes. | **Adopt**: Standardize `<ScenarioDropdown>` using Radix DropdownMenu (already installed as `radix-ui`). |
| **Vercel AI SDK Playground** | [sdk.vercel.ai](https://sdk.vercel.ai) | Clean, high-density toolbar with unified playback/stepper controls, keyboard shortcuts badges, and responsive collapse. | **Adapt**: Follow their playback controller layout and pill progress indicator. |
| **Python Tutor / V8 Visualizers** | [pythontutor.com](https://pythontutor.com) | Clear conceptual separation between "Frames" (Call Stack) and "Objects" (Heap memory / Closures) with directional arrows. | **Inspire**: Visually represent closure references as pointers from function instances to heap memory records. |
| **Shadcn/ui Design System** | [ui.shadcn.com](https://ui.shadcn.com) | Consistent card anatomy: `CardHeader`, `CardTitle`, `CardDescription`, `CardContent`, `CardFooter`. | **Adopt**: Standardize all panel containers in JavaScript simulators to use uniform border radii, borders, and muted header styling. |

### Visual Consistency Target System
- **Accent Color**: JavaScript Yellow/Amber (`#F7DF1E` / `amber-500`) for landing page and branding accents.
- **Execution State Palette**:
  - Creation Phase / TDZ: Amber/Yellow (`amber-500/20` border, `amber-400` text).
  - Execution Phase / Active: Emerald/Green (`emerald-500/20` border, `emerald-400` text).
  - Scope Lookup / Searching: Violet/Purple (`purple-500/20` border, `purple-400` text).
  - Error / ReferenceError / TypeError: Red/Rose (`red-500/20` border, `red-400` text).
  - Closure Memory: Fuchsia/Pink (`fuchsia-500/20` border, `fuchsia-400` text).
- **Typography Scale**:
  - Minimum text size: `12px` (`text-xs`) for all code tokens, variables, and queue names (eliminating illegible `text-[9px]`).
  - Monospace font: `font-mono` applied consistently to variables, code lines, line numbers, and memory addresses.

---

## 8. Report G: Testing, Reliability, and Security Plan

### Test Strategy
1. **Scenario Integrity Unit Tests**:
   - Validate that each scenario's step `currentLine` points to a valid line number in `scenario.code`.
   - Validate that initial steps have `currentLine === null` and empty console output.
   - Validate error steps have terminal conditions.
2. **Zustand Store Unit Tests (`useJSSimulationStore.test.ts`)**:
   - Initial state check.
   - `nextStep()` bounds check (cannot exceed `scenario.steps.length - 1`).
   - `prevStep()` bounds check (cannot go below 0).
   - `reset()` resets index to 0 and stops playing.
   - `setScenario()` resets index to 0 and stops playing.
   - `togglePlay()` resumes or pauses correctly; loops from start if at the end.
3. **Component Interaction Tests**:
   - `PlaybackControls`: Clicking Next, Prev, Restart, Play calls appropriate store actions.
   - `QueuePanel`: Animates queue addition/removal and renders empty queue state.
4. **Security Verification**:
   - Confirmed no `eval()`, `new Function()`, or `dangerouslySetInnerHTML` in JavaScript visualizer.
   - Input strings are strictly sanitized React text nodes.

---

## 9. Report H: Prioritized Implementation Roadmap

### Stage 1: Defensive Hardening & Crash Prevention (Zero Blast Radius)
- **Scope**:
  - Add defensive optional chaining and fallback lookups across all panel components (`ExecutionContextPanel`, `CallStackPanel`, `CodePanel`, `ConsolePanel`, `call-stack/page.tsx`).
  - Fix React 19 `react-hooks/set-state-in-effect` violations across all 6 episode pages, `StepExplanationPopup.tsx`, and `CodePanel.tsx`.
  - Fix render-phase `setState` mutation in `MobileTabbedPanels.tsx:21-23`.
  - Add store unmount reset hook to prevent auto-play timer leaks.
- **Expected Benefit**: Eliminates crash risks on state anomalies, cleans up 8 ESLint violations, guarantees React purity.
- **Dependencies**: None.
- **Acceptance Criteria**: `npx eslint src/app/javascript src/components/javascript` passes with 0 errors.

### Stage 2: Reusable Episode Card & Landing Page Cleanup
- **Scope**:
  - Extract `<EpisodeCard>` into `src/components/ui/EpisodeCard.tsx`.
  - Refactor `src/app/javascript/page.tsx` to map over `JAVASCRIPT_EPISODES` config array.
- **Expected Benefit**: Reduces `app/javascript/page.tsx` from 304 lines to ~45 lines; provides a reusable primitive for `/operating-systems`, `/backend`, and `/frontend`.
- **Dependencies**: Stage 1.
- **Acceptance Criteria**: Landing page renders identically; responsive behavior and hover interactions remain visually pixel-perfect.

### Stage 3: Extract `<SimulationShell>` and Unify Playback Controls
- **Scope**:
  - Create `src/components/javascript/SimulationShell.tsx`.
  - Move shared Navigation, Playback Controls, Progress Scrubber, Scenario Dropdown, Overlays, and Keyboard Shortcuts into `SimulationShell`.
  - Migrate Episodes 1 through 6 to use `SimulationShell`.
- **Expected Benefit**: Deletes >1,000 lines of duplicated boilerplate across the simulator pages. Adds keyboard navigation.
- **Dependencies**: Stage 1, Stage 2.
- **Acceptance Criteria**: All 6 episodes retain their existing scenario dropdowns and stepping behavior; keyboard shortcuts (`Space`, `Arrows`, `R`) function seamlessly.

### Stage 4: Component Unification & Decoupling
- **Scope**:
  - Consolidate `MicrotaskQueuePanel.tsx` and `CallbackQueuePanel.tsx` into `<QueuePanel>`.
  - Remove hardcoded `"el-"` ID sniffing from `CodePanel.tsx`.
  - Standardize explanation banner placement; fix Episode 7 explanation auto-dismissal.
- **Expected Benefit**: Removes ~100 lines of duplicate code; cleans up component contracts.
- **Dependencies**: Stage 3.
- **Acceptance Criteria**: Episode 7 animations and task migrations between queues continue functioning seamlessly.

### Stage 5: Automated Testing Suite
- **Scope**:
  - Add unit tests for `useJSSimulationStore`.
  - Add integrity unit tests for all 7 scenario files.
  - Add component tests for `PlaybackControls` and `QueuePanel`.
- **Expected Benefit**: Brings JavaScript subject from 0% test coverage to robust behavioral coverage.
- **Dependencies**: Stage 1–4.
- **Acceptance Criteria**: All new tests pass with `npm run test` without warnings.

---

## 10. Section 11: Mandatory Discussion and Approval Gate

Before writing or editing any application source files, the following architectural and design decisions require your input and explicit approval:

### 1. Architectural Trade-off: Global Zustand Store vs. Episode-Scoped State
- **Current Problem**:
  `useJSSimulationStore` is a single global Zustand store. If Episode A is active and user navigates to Episode B, Episode B momentarily inherits Episode A's state before `useEffect` resets it, causing 1 frame of mismatched content.
- **Options**:
  - **Option 1 (Recommended)**: Retain the global Zustand store for simplicity and lightweight footprint, but add an immediate unmount reset hook and defensive clamping on all component selectors.
  - **Option 2**: Create an episode-scoped React Context (`<SimulationProvider>`) per episode page so state is completely destroyed and isolated upon route changes.
- **Your Input Needed**: Do you prefer keeping the global Zustand store with strict lifecycle reset guards (lower migration cost), or moving to a scoped context provider?

### 2. Educational Accuracy: Modeling Block Scopes and Closures
- **Current Problem**:
  Block scopes and Closures are pushed directly onto the `callStack` array in scenario definitions, and UI panels manually filter them out with `.filter(ec => !ec.isBlockScope && !ec.isClosure)`.
- **Options**:
  - **Option 1 (Incremental)**: Maintain the current scenario schema to avoid altering existing educational scripts, but cleanly isolate the UI filtering and fix tree nesting.
  - **Option 2 (Architectural Clean-up)**: Refactor the scenario schema to separate `callStack` (pure stack frames) from `lexicalScopes` (block scopes and closure memory), updating the scenarios accordingly.
- **Your Input Needed**: Should we keep the existing scenario schema and isolate the UI filter, or refactor the scenario schema for strict educational accuracy?

### 3. Shared `<EpisodeCard>` Scope
- **Current Problem**:
  `/javascript`, `/operating-systems`, `/backend`, and `/frontend` all copy-paste the exact same 35-line card markup inline.
- **Options**:
  - **Option 1 (Subject-Focused)**: Extract `EpisodeCard` and apply it only to `/javascript/page.tsx` first (zero blast radius outside JavaScript).
  - **Option 2 (Cross-Subject)**: Place `EpisodeCard` into `src/components/ui/EpisodeCard.tsx` designed to be adopted by other subjects in follow-up tasks.
- **Your Input Needed**: Shall we extract `EpisodeCard` as a shared UI primitive ready for all routes, or keep it local to the JavaScript route?

### 4. Approval for First Implementation Stage
Upon your approval, we recommend beginning immediately with **Stage 1 (Defensive Hardening & Crash Prevention)**:
- Touch files:
  - `src/app/javascript/simulator/call-stack/page.tsx`
  - `src/components/javascript/ExecutionContextPanel.tsx`
  - `src/components/javascript/CallStackPanel.tsx`
  - `src/components/javascript/CodePanel.tsx`
  - `src/components/javascript/MobileTabbedPanels.tsx`
  - `src/store/useJSSimulationStore.ts`
- Fixes defensive indexing, cleans up React 19 setState warnings, and prevents timer leakage with zero visual disruption.

---

## 11. Remaining Questions & Gaps
- **E2E Visual Regression**: Playwright tests exist in `/e2e` for canvas export and auth, but no visual snapshot specs test simulator animations. Verifying Framer Motion physics under rapid stepping currently requires manual verification.
- **Function Object Memory Syntax**: Scenario function values vary between `"Function Object\n0x2F81A3B"` and `"Function Object"`. We should establish whether simulated memory addresses are preferred across all episodes.
- **Reconciliation of Episode 6 & 7 Asynchronous Mental Models**: Whether to upgrade Episode 6 Scenario 6 from `taskQueue` to `webAPIs + callbackQueue` or keep `taskQueue` for backward compatibility.
- **Next Investigator Priority**: Implement Stage 1 to eliminate potential indexing crashes and resolve ESLint `react-hooks/set-state-in-effect` violations.
