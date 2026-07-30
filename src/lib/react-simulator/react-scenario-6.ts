import { ReactSimulationScenario } from "./engine";

export const REACT_SCENARIO_6: ReactSimulationScenario = {
  id: "react-uselayouteffect-6",
  title: "useLayoutEffect vs useEffect",
  description:
    "Both run after the DOM is updated. Only one runs before the browser paints. The difference is one frame — and it matters.",
  layoutMode: "use-layout-effect",
  steps: [
    // -----------------------------------------------------------------------
    // STEP 1 — Intuition: The photographer analogy
    // -----------------------------------------------------------------------
    {
      id: "e6-s1-intro",
      explanation:
        "Imagine two workers preparing a room for a photo. **Worker A** rearranges furniture, immediately fixes a crooked painting, and only then allows the photo to be taken. The photo shows a perfect room. **Worker B** rearranges furniture, the photo is taken immediately, and then B fixes the painting. The photo shows the crooked painting.",
      toastMessage: "Episode 6 — useLayoutEffect vs useEffect",
      jsxCode: `// Worker A = useLayoutEffect
// Fixes things BEFORE the camera clicks.
// Camera = the browser painting pixels.

// Worker B = useEffect
// Fixes things AFTER the camera clicks.
// User may briefly see the "wrong" state.

// Both hooks have the SAME API:
useLayoutEffect(() => { /* ... */ }, [deps]);
useEffect(() => { /* ... */ }, [deps]);

// The ONLY difference: when they run
// relative to the browser paint step.`,
      timingMode: "both",
      useEffectPhaseActive: null,
      useLayoutEffectPhaseActive: null,
      viewportElementPosition: "initial",
      notes: [
        {
          title: "📸 The Photography Analogy",
          content:
            "The \"camera click\" = the browser painting pixels to the screen. `useLayoutEffect` acts before the click — any changes it makes are baked into the very first frame the user sees. `useEffect` acts after — the user may briefly see the \"before\" state.",
        },
      ],
    },

    // -----------------------------------------------------------------------
    // STEP 2 — A new term: "paint"
    // -----------------------------------------------------------------------
    {
      id: "e6-s2-paint-term",
      explanation:
        "In Episode 4 we said `useEffect` runs \"after the DOM is updated.\" Now let's be more precise. There are **two things** that happen after React updates the DOM: (1) the DOM is updated **in memory**, and (2) the **browser draws the updated pixels to the screen**. This drawing step is called **painting**. There is a real, measurable gap between these two moments.",
      toastMessage: "New term: 'paint' = browser draws pixels to screen",
      jsxCode: `// Two separate events after React updates the DOM:
//
// EVENT 1: React writes to the real DOM in memory.
//   → document.getElementById('app').innerText = 'New!'
//   → The DOM object is updated. Memory only.
//
// EVENT 2: The browser PAINTS.
//   → Browser reads the DOM.
//   → Calculates layout (position/size of elements).
//   → Composites layers.
//   → Draws pixels to the screen.
//   → User's eyes receive photons. ← this is "paint"
//
// The gap between EVENT 1 and EVENT 2
// is where useLayoutEffect runs.`,
      timingMode: "both",
      useEffectPhaseActive: null,
      useLayoutEffectPhaseActive: null,
      viewportElementPosition: "initial",
      notes: [
        {
          title: "🖥️ DOM Update ≠ User Sees It",
          content:
            "Updating the DOM is a JavaScript memory operation. The browser physically drawing pixels is a separate, subsequent step. Modern browsers batch these for performance. The gap between them is typically 0–16ms (one frame at 60fps).",
        },
      ],
    },

    // -----------------------------------------------------------------------
    // STEP 3 — useEffect full pipeline
    // -----------------------------------------------------------------------
    {
      id: "e6-s3-ue-pipeline",
      explanation:
        "The complete `useEffect` pipeline: **Render** (component function runs, Virtual DOM built) → **DOM Update** (React applies changes to real DOM) → **Browser Paints** (user visually sees the updated screen) → **useEffect runs** (after paint, asynchronously). The user sees the update **before** the effect fires.",
      toastMessage: "useEffect: runs AFTER browser paints",
      jsxCode: `// useEffect timing — full pipeline:
//
// 1. Component renders
//    (JSX evaluated, Virtual DOM built)
//          │
// 2. Real DOM updated
//    (React's minimal changes applied)
//          │
// 3. Browser PAINTS
//    (user sees the new screen NOW ← HERE)
//          │
// 4. useEffect runs
//    (asynchronously, after paint)
//    (user already sees the new state)`,
      timingMode: "use-effect",
      useEffectPhaseActive: "effect",
      useLayoutEffectPhaseActive: null,
      viewportElementPosition: "initial",
    },

    // -----------------------------------------------------------------------
    // STEP 4 — useLayoutEffect full pipeline
    // -----------------------------------------------------------------------
    {
      id: "e6-s4-ule-pipeline",
      explanation:
        "The complete `useLayoutEffect` pipeline: **Render** → **DOM Update** → **useLayoutEffect runs** (SYNCHRONOUSLY — the browser is **blocked** from painting until it finishes) → **Browser Paints**. The effect fires **before** the user sees anything. Any changes made by the effect are included in the very first painted frame.",
      toastMessage: "useLayoutEffect: runs BEFORE browser paints (synchronous)",
      jsxCode: `// useLayoutEffect timing — full pipeline:
//
// 1. Component renders
//    (JSX evaluated, Virtual DOM built)
//          │
// 2. Real DOM updated
//    (React's minimal changes applied)
//          │
// 3. useLayoutEffect runs ← HERE
//    (SYNCHRONOUSLY — browser is BLOCKED)
//    (cannot paint until this finishes)
//          │
// 4. Browser PAINTS
//    (user sees the FINAL state, with
//     whatever useLayoutEffect changed)`,
      timingMode: "use-layout-effect",
      useEffectPhaseActive: null,
      useLayoutEffectPhaseActive: "layout-effect",
      viewportElementPosition: "initial",
      notes: [
        {
          title: "⚡ Synchronous = Browser is Waiting",
          content:
            "\"Synchronous\" here means the browser cannot paint until `useLayoutEffect`'s function completely finishes. If that function takes 100ms, the screen freezes for 100ms. This is the trade-off. `useEffect` never blocks the browser — it runs completely independently after the user already sees the update.",
        },
      ],
    },

    // -----------------------------------------------------------------------
    // STEP 5 — Side-by-side comparison
    // -----------------------------------------------------------------------
    {
      id: "e6-s5-compare-both",
      explanation:
        "Side by side: both hooks update the DOM first. Then they diverge. `useLayoutEffect` fires **before paint** — blocking the browser. `useEffect` fires **after paint** — never blocking. Same API, same cleanup rules, same dep array behavior. The only difference: one frame.",
      toastMessage: "Side-by-side: the single frame of difference",
      jsxCode: `//  useLayoutEffect        useEffect
//  ─────────────────      ─────────────────
//  1. Render              1. Render
//  2. DOM update          2. DOM update
//  3. ★ Effect runs       3. Browser PAINTS ← user sees
//     (browser BLOCKED)   4. Effect runs
//  4. Browser PAINTS         (browser not blocked)
//
// Same API:
useLayoutEffect(() => { ... }, [deps]);
useEffect(() => { ... }, [deps]);
//
// Same dep array. Same cleanup. Same rules.
// One difference: before paint vs after paint.`,
      timingMode: "both",
      useEffectPhaseActive: "effect",
      useLayoutEffectPhaseActive: "layout-effect",
      viewportElementPosition: "initial",
    },

    // -----------------------------------------------------------------------
    // STEP 6 — The tooltip scenario: code introduced
    // -----------------------------------------------------------------------
    {
      id: "e6-s6-tooltip-code",
      explanation:
        "Here's the classic scenario that makes `useLayoutEffect` necessary. A **tooltip** must appear positioned right next to a button. The tooltip's correct position can only be calculated **after** it's in the DOM (we need to measure the button's size and position). Initial state: position is `{top: 0, left: 0}`.",
      toastMessage: "Tooltip scenario: must measure DOM before showing position",
      jsxCode: `function Tooltip({ targetRef }) {
  const tooltipRef = useRef(null);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  //                                                    ↑ wrong initial value

  useEffect(() => { // ← let's try useEffect first
    // Measure the button's real screen position.
    const rect = targetRef.current.getBoundingClientRect();
    setPosition({
      top: rect.bottom,
      left: rect.left,
    });
  }, [targetRef]);

  return (
    <div ref={tooltipRef}
      style={{ position: 'absolute', top: position.top, left: position.left }}>
      Tooltip content
    </div>
  );
}`,
      timingMode: "use-effect",
      useEffectPhaseActive: null,
      useLayoutEffectPhaseActive: null,
      viewportElementPosition: "initial",
      viewportLabel: "Tooltip",
      activeLine: 5,
    },

    // -----------------------------------------------------------------------
    // STEP 7 — useEffect: Tooltip renders at wrong position
    // -----------------------------------------------------------------------
    {
      id: "e6-s7-ue-tooltip-step1",
      explanation:
        "With `useEffect`: The Tooltip component renders. Initial `position` state is `{top: 0, left: 0}` — meaning top-left corner of the screen. The component's JSX uses this wrong position. React updates the real DOM with the tooltip at position (0, 0).",
      toastMessage: "Step 1: Tooltip renders at (0, 0) — wrong position",
      jsxCode: `// Tooltip renders.
// position = { top: 0, left: 0 } ← initial state

// JSX evaluates to:
// <div style={{ position: 'absolute', top: 0, left: 0 }}>
//   Tooltip content
// </div>

// Real DOM: tooltip is at top:0, left:0 (top-left corner)
// useEffect has NOT run yet.
// The effect hasn't measured the button yet.`,
      timingMode: "use-effect",
      useEffectPhaseActive: "dom-update",
      useLayoutEffectPhaseActive: null,
      viewportElementPosition: "wrong",
      viewportLabel: "Tooltip",
    },

    // -----------------------------------------------------------------------
    // STEP 8 — useEffect: Browser PAINTS wrong position
    // -----------------------------------------------------------------------
    {
      id: "e6-s8-ue-tooltip-step2",
      explanation:
        "The browser **paints** the DOM — including the tooltip at position (0, 0). **The user now sees the tooltip flash in the top-left corner.** This is the flicker. useEffect hasn't run yet — it's waiting for after paint.",
      toastMessage: "⚠️ Browser paints: user sees tooltip in wrong position (flicker!)",
      jsxCode: `// Browser PAINTS. User sees this frame:
//
//  ┌──────────────────────────────┐
//  │ Tooltip content              │ ← Top-left corner!
//  │                              │   Wrong position.
//  │                              │
//  │   [Button]                   │ ← Where it should be
//  │                              │
//  └──────────────────────────────┘
//
// The user SEES this wrong position.
// useEffect has still not run.
// It fires AFTER this paint.`,
      timingMode: "use-effect",
      useEffectPhaseActive: "paint",
      useLayoutEffectPhaseActive: null,
      viewportElementPosition: "wrong",
      viewportShowFlickerFlash: true,
      viewportLabel: "Tooltip",
    },

    // -----------------------------------------------------------------------
    // STEP 9 — useEffect runs: measures, setPosition
    // -----------------------------------------------------------------------
    {
      id: "e6-s9-ue-tooltip-step3",
      explanation:
        "NOW `useEffect` runs. It measures the button's real position using `getBoundingClientRect()`. It calls `setPosition` with the correct values. This triggers a re-render. React updates the DOM again, the browser paints again — the tooltip appears in the correct position. **The user saw two different positions.** That's the flicker.",
      toastMessage: "useEffect fires, measures, re-renders — correct pos now",
      jsxCode: `// useEffect fires (after first paint):
const rect = targetRef.current.getBoundingClientRect();
setPosition({ top: rect.bottom, left: rect.left });

// setPosition → re-render scheduled
// Tooltip re-renders with correct position
// Real DOM updated again
// Browser PAINTS again:
//
//  ┌──────────────────────────────┐
//  │                              │
//  │   [Button]                   │
//  │   Tooltip content            │ ← Correct position ✓
//  └──────────────────────────────┘
//
// User saw: flash at (0,0) → then correct. FLICKER.`,
      timingMode: "use-effect",
      useEffectPhaseActive: "effect",
      useLayoutEffectPhaseActive: null,
      viewportElementPosition: "correct",
      viewportLabel: "Tooltip",
      activeLine: 2,
    },

    // -----------------------------------------------------------------------
    // STEP 10 — useLayoutEffect: Tooltip renders at wrong position
    // -----------------------------------------------------------------------
    {
      id: "e6-s10-ule-tooltip-step1",
      explanation:
        "Now with `useLayoutEffect`. Same start: Tooltip renders with initial `position = {top: 0, left: 0}`. React updates the real DOM — tooltip at (0, 0). **But the browser has NOT painted yet.** `useLayoutEffect` fires right here, before paint.",
      toastMessage: "useLayoutEffect: DOM updated, browser BLOCKED from painting",
      jsxCode: `// WITH useLayoutEffect:
function Tooltip({ targetRef }) {
  const [position, setPosition] = useState({ top: 0, left: 0 });

  useLayoutEffect(() => { // ← runs BEFORE paint
    const rect = targetRef.current.getBoundingClientRect();
    setPosition({ top: rect.bottom, left: rect.left });
  }, [targetRef]);

  return (
    <div style={{ position: 'absolute', top: position.top, left: position.left }}>
      Tooltip content
    </div>
  );
}
// Tooltip rendered. DOM at (0,0). Browser BLOCKED.`,
      timingMode: "use-layout-effect",
      useEffectPhaseActive: null,
      useLayoutEffectPhaseActive: "dom-update",
      viewportElementPosition: "initial",
      viewportLabel: "Tooltip",
      activeLine: 5,
    },

    // -----------------------------------------------------------------------
    // STEP 11 — useLayoutEffect runs: measures, setPosition (browser still blocked)
    // -----------------------------------------------------------------------
    {
      id: "e6-s11-ule-tooltip-step2",
      explanation:
        "`useLayoutEffect` runs synchronously. It measures the button's real position. It calls `setPosition` with correct values. React processes this state change **immediately** — since we're in the synchronous phase, React re-renders the Tooltip right now, updates the DOM to the correct position. The browser is still blocked from painting.",
      toastMessage: "useLayoutEffect measures, setPosition — re-render (still blocked)",
      jsxCode: `// useLayoutEffect fires (browser still BLOCKED):
const rect = targetRef.current.getBoundingClientRect();
setPosition({ top: rect.bottom, left: rect.left });

// React immediately processes the state update
// (we're in the synchronous layout phase).
// Tooltip RE-RENDERS now:
//   position = { top: rect.bottom, left: rect.left }
//
// Real DOM updated AGAIN with correct position.
// Browser is STILL blocked. Has not painted yet.
// The user has not seen ANY frame yet.`,
      timingMode: "use-layout-effect",
      useEffectPhaseActive: null,
      useLayoutEffectPhaseActive: "layout-effect",
      viewportElementPosition: "initial",
      viewportLabel: "Tooltip",
      activeLine: 2,
    },

    // -----------------------------------------------------------------------
    // STEP 12 — useLayoutEffect: Browser paints correct position ONLY
    // -----------------------------------------------------------------------
    {
      id: "e6-s12-ule-tooltip-step3",
      explanation:
        "Only now does the browser **paint**. The DOM has already been corrected by `useLayoutEffect`. The first (and only) frame the user sees has the tooltip in the **correct position**. No flicker. No wrong position. The measurement and correction happened entirely before the first pixel was drawn.",
      toastMessage: "✅ Browser paints: user sees ONLY correct position — no flicker!",
      jsxCode: `// NOW the browser is allowed to paint.
// DOM is already at the correct position.
//
//  ┌──────────────────────────────┐
//  │                              │
//  │   [Button]                   │
//  │   Tooltip content            │ ← Only frame shown ✓
//  └──────────────────────────────┘
//
// The user never saw the (0,0) position.
// No flicker. No jump.
//
// This is the ONLY scenario where
// useLayoutEffect is the correct choice.`,
      timingMode: "use-layout-effect",
      useEffectPhaseActive: null,
      useLayoutEffectPhaseActive: "paint",
      viewportElementPosition: "correct",
      viewportLabel: "Tooltip",
    },

    // -----------------------------------------------------------------------
    // STEP 13 — The trade-off: blocking cost
    // -----------------------------------------------------------------------
    {
      id: "e6-s13-blocking-cost",
      explanation:
        "The trade-off is explicit: `useLayoutEffect` prevents flicker but **delays the first paint** until it finishes. If the code inside is slow — complex calculations, synchronous DOM reads on thousands of elements — the entire page visually freezes for that duration. `useEffect` never blocks. Use `useLayoutEffect` only when the blocking cost is justified by the flicker prevention.",
      toastMessage: "⚠️ useLayoutEffect: slow code = visible freeze!",
      jsxCode: `// useLayoutEffect: be careful of slow code
useLayoutEffect(() => {
  // ❌ Danger: reading layout of 1000 elements
  // forces the browser to recalculate layout.
  const heights = allItemRefs.map(
    ref => ref.current.getBoundingClientRect().height
  );
  // This runs SYNCHRONOUSLY before paint.
  // If it takes 200ms, the screen freezes 200ms.

  // ✅ Fine: quick DOM measurement of one element
  const rect = buttonRef.current.getBoundingClientRect();
  setPosition({ top: rect.bottom, left: rect.left });
}, []);`,
      timingMode: "both",
      useEffectPhaseActive: null,
      useLayoutEffectPhaseActive: null,
      viewportElementPosition: "initial",
      notes: [
        {
          title: "⚖️ The Core Trade-off",
          content:
            "**useLayoutEffect**: no flicker, but blocks paint (screen freezes if slow).\n**useEffect**: never blocks paint, but may briefly show wrong state if effect changes something visual.\n\nFor data fetching, subscriptions, logging: always `useEffect`. They don't touch the DOM synchronously — no reason to block paint.",
        },
      ],
    },

    // -----------------------------------------------------------------------
    // STEP 14 — The golden rule
    // -----------------------------------------------------------------------
    {
      id: "e6-s14-golden-rule",
      explanation:
        "**The golden rule**: **Default to `useEffect` for everything.** Only reach for `useLayoutEffect` when you specifically need to (1) **read or mutate the DOM**, (2) **before the user sees it**, (3) **to prevent a visible, human-noticeable flicker**. Tooltips, modal positioning, scroll restoration — yes. Data fetching, subscriptions, logging, analytics — never.",
      toastMessage: "Golden rule: useEffect always. useLayoutEffect only for DOM flicker.",
      jsxCode: `// THE GOLDEN RULE:

// ✅ Use useEffect for:
//   - Data fetching
//   - WebSocket subscriptions
//   - Setting document.title
//   - Logging / analytics
//   - timers (setInterval / setTimeout)

// ✅ Use useLayoutEffect ONLY for:
//   - Measuring DOM element size/position
//   - Repositioning tooltips / modals / popups
//   - Scroll position restoration
//   - Anything that changes the DOM and must
//     prevent a human-visible position flash

// ❌ Never use useLayoutEffect as a "safe" default.
//    It slows down your app for no reason.`,
      timingMode: "both",
      useEffectPhaseActive: null,
      useLayoutEffectPhaseActive: null,
      viewportElementPosition: "initial",
      notes: [
        {
          title: "📖 Senior-Level Answer",
          content:
            "\"Both run after React updates the real DOM. `useEffect` runs asynchronously after the browser paints — the user sees the update first. `useLayoutEffect` runs synchronously before paint — it can block the browser if slow. I default to `useEffect` for everything and only use `useLayoutEffect` when I have a DOM measurement that must prevent a visible flicker — like tooltip or modal positioning. Using it for data fetching is a performance anti-pattern.\"",
        },
      ],
    },

    // -----------------------------------------------------------------------
    // STEP 15 — SSR warning
    // -----------------------------------------------------------------------
    {
      id: "e6-s15-ssr-warning",
      explanation:
        "One more important note: **`useLayoutEffect` does not work on the server**. During server-side rendering (SSR), there is no DOM, no browser, and no paint step. React will warn you if you use `useLayoutEffect` in code that runs on the server. In Next.js, this is a common gotcha when using server components or SSR pages.",
      toastMessage: "⚠️ useLayoutEffect + SSR = React warning in Next.js",
      jsxCode: `// In Next.js with SSR:
// useLayoutEffect causes this warning:
//
// Warning: useLayoutEffect does nothing on the server
// because its effect cannot be encoded into the
// server renderer's output format.
//
// Fix options:
// 1. Switch to useEffect (if flicker is acceptable)
// 2. Check typeof window !== 'undefined'
// 3. Use a library like 'use-isomorphic-layout-effect'
//    which uses useLayoutEffect on client, useEffect on server

import useIsomorphicLayoutEffect from 'use-isomorphic-layout-effect';
// npm i use-isomorphic-layout-effect`,
      timingMode: "both",
      useEffectPhaseActive: null,
      useLayoutEffectPhaseActive: null,
      viewportElementPosition: "initial",
      notes: [
        {
          title: "🚀 Next.js + useLayoutEffect",
          content:
            "In Next.js (which does SSR by default), `useLayoutEffect` in a component that also renders on the server will trigger a React warning. The safest fix is the `use-isomorphic-layout-effect` package, which automatically uses `useLayoutEffect` on client and falls back to `useEffect` on server.",
        },
      ],
    },
  ],
};
