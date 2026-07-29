import { ReactSimulationScenario } from "./engine";

export const REACT_SCENARIO_3: ReactSimulationScenario = {
  id: "react-usestate-3",
  title: "useState — Batching & Stale State",
  description:
    "React doesn't apply state updates instantly. Understanding snapshots, stale closures, and the functional update pattern.",
  layoutMode: "usestate-batching",
  steps: [
    // -----------------------------------------------------------------------
    // STEP 1 — Intuition: The Waiter Batching Analogy
    // -----------------------------------------------------------------------
    {
      id: "u-step-1",
      explanation:
        "Imagine a waiter collecting orders. They don't sprint to the kitchen after every single word — they **batch** the whole table's order and go once. React does the same: multiple `setState` calls in one handler are collected and processed **together**, causing one re-render, not three.",
      toastMessage: "Episode 3 — Batching & Stale State",
      jsxCode: `// The topic: what ACTUALLY happens when you call
// setState multiple times in one event handler?

function Counter() {
  const [count, setCount] = useState(0);

  const handleClick = () => {
    setCount(count + 1);
    setCount(count + 1);
    setCount(count + 1);
    // Does count become 3? Let's find out.
  };

  return <button onClick={handleClick}>{count}</button>;
}`,
      notes: [
        {
          title: "🍽️ The Batching Waiter",
          content:
            "A smart waiter collects all orders from a table before going to the kitchen. React similarly **batches** state updates that happen within the same event handler, re-rendering the component only **once** — not after every single `setState` call.",
        },
      ],
      snapshotValues: [],
      updateQueue: [],
      resolvedValue: null,
    },

    // -----------------------------------------------------------------------
    // STEP 2 — Initial render: count = 0, snapshot frozen
    // -----------------------------------------------------------------------
    {
      id: "u-step-2",
      explanation:
        "The component renders. `count` is `0`. This value is now a **frozen snapshot** for this entire render cycle — like a photo taken at this moment. It will not change while this render is running.",
      toastMessage: "Render 1: count = 0 (snapshot frozen)",
      jsxCode: `function Counter() {
  const [count, setCount] = useState(0);
  // count = 0 — this is the SNAPSHOT for this render.
  // It is a plain JavaScript const.
  // It CANNOT update itself mid-function.

  const handleClick = () => {
    setCount(count + 1);
    setCount(count + 1);
    setCount(count + 1);
  };

  return <button onClick={handleClick}>{count}</button>;
}`,
      activeLine: 2,
      snapshotValues: [
        { name: "count", value: "0", isStale: false },
      ],
      updateQueue: [],
      resolvedValue: null,
      renderCount: 1,
    },

    // -----------------------------------------------------------------------
    // STEP 3 — User clicks: handleClick starts
    // -----------------------------------------------------------------------
    {
      id: "u-step-3",
      explanation:
        "`handleClick` begins executing. React does NOT re-render yet. Remember: **re-render is the LAST step**, not the first. The handler runs completely first.",
      toastMessage: "User clicked! Handler starts...",
      jsxCode: `const handleClick = () => {
  setCount(count + 1); // ← evaluates to setCount(0 + 1) = setCount(1)
  setCount(count + 1);
  setCount(count + 1);
};`,
      activeLine: 2,
      snapshotValues: [
        { name: "count", value: "0", isStale: false },
      ],
      updateQueue: [],
      resolvedValue: null,
      renderCount: 1,
    },

    // -----------------------------------------------------------------------
    // STEP 4 — First setCount(count + 1) queued
    // -----------------------------------------------------------------------
    {
      id: "u-step-4",
      explanation:
        "First call: `setCount(count + 1)` evaluates as `setCount(0 + 1)` = `setCount(1)`. React does NOT apply this yet — it **queues** the instruction: \"set count to 1\".",
      jsxCode: `const handleClick = () => {
  setCount(count + 1); // ← queues: "set count to 1"
  setCount(count + 1);
  setCount(count + 1);
};`,
      activeLine: 2,
      snapshotValues: [
        { name: "count", value: "0", isStale: false },
      ],
      updateQueue: [
        {
          id: "q1",
          type: "value",
          displayLabel: "set count to 1",
          isProcessed: false,
        },
      ],
      resolvedValue: null,
      renderCount: 1,
    },

    // -----------------------------------------------------------------------
    // STEP 5 — Second setCount(count + 1): STALE!
    // -----------------------------------------------------------------------
    {
      id: "u-step-5",
      explanation:
        "Second call: `count` is STILL `0` — the snapshot hasn't changed mid-function. So `setCount(count + 1)` is again `setCount(1)`. React queues: \"set count to 1\" again. The same instruction!",
      toastMessage: "⚠️ Stale snapshot! count is still 0",
      jsxCode: `const handleClick = () => {
  setCount(count + 1); // queued: "set count to 1"
  setCount(count + 1); // ← count is STILL 0! Queues: "set count to 1"
  setCount(count + 1);
};`,
      activeLine: 3,
      snapshotValues: [
        { name: "count", value: "0", isStale: true },
      ],
      updateQueue: [
        {
          id: "q1",
          type: "value",
          displayLabel: "set count to 1",
          isProcessed: false,
          isStale: true,
        },
        {
          id: "q2",
          type: "value",
          displayLabel: "set count to 1",
          isProcessed: false,
          isStale: true,
        },
      ],
      resolvedValue: null,
      renderCount: 1,
    },

    // -----------------------------------------------------------------------
    // STEP 6 — Third setCount: Still stale, queue has 3 "set 1" cards
    // -----------------------------------------------------------------------
    {
      id: "u-step-6",
      explanation:
        "Third call — same story. `count` is still `0`. All three calls have now been queued. But all three literally say \"set count to 1\". The queue does not add them up.",
      jsxCode: `const handleClick = () => {
  setCount(count + 1); // queued: "set count to 1"
  setCount(count + 1); // queued: "set count to 1"
  setCount(count + 1); // ← queued: "set count to 1"
};`,
      activeLine: 4,
      snapshotValues: [
        { name: "count", value: "0", isStale: true },
      ],
      updateQueue: [
        {
          id: "q1",
          type: "value",
          displayLabel: "set count to 1",
          isProcessed: false,
          isStale: true,
        },
        {
          id: "q2",
          type: "value",
          displayLabel: "set count to 1",
          isProcessed: false,
          isStale: true,
        },
        {
          id: "q3",
          type: "value",
          displayLabel: "set count to 1",
          isProcessed: false,
          isStale: true,
        },
      ],
      resolvedValue: null,
      renderCount: 1,
    },

    // -----------------------------------------------------------------------
    // STEP 7 — Handler finishes → React processes queue → resolves to 1
    // -----------------------------------------------------------------------
    {
      id: "u-step-7",
      explanation:
        "`handleClick` finishes running. Only NOW does React process its internal queue. Three instructions, all saying \"set count to 1\" — React applies the last one. Final result: `count = 1`. Not 3.",
      toastMessage: "Queue processed → count = 1 (not 3!)",
      jsxCode: `// handleClick() has finished.
// React now processes its internal batch queue:

// Instruction 1: "set count to 1"  → count = 1
// Instruction 2: "set count to 1"  → count = 1 (same)
// Instruction 3: "set count to 1"  → count = 1 (same)

// React re-renders ONCE. count = 1.`,
      snapshotValues: [
        { name: "count", value: "0 → 1", isStale: false },
      ],
      updateQueue: [
        {
          id: "q1",
          type: "value",
          displayLabel: "set count to 1",
          resolvedTo: "1",
          isProcessed: true,
          isStale: true,
        },
        {
          id: "q2",
          type: "value",
          displayLabel: "set count to 1",
          resolvedTo: "1",
          isProcessed: true,
          isStale: true,
        },
        {
          id: "q3",
          type: "value",
          displayLabel: "set count to 1",
          resolvedTo: "1",
          isProcessed: true,
          isStale: true,
        },
      ],
      resolvedValue: "1",
      renderCount: 2,
      notes: [
        {
          title: "😱 The Trap",
          content:
            "3 `setState` calls did NOT cause 3 re-renders, and they did NOT produce `count = 3`. They were **batched** into one re-render with result `1` — because all three read from the frozen snapshot (`count = 0`).",
        },
      ],
    },

    // -----------------------------------------------------------------------
    // STEP 8 — The Fix: functional updates
    // -----------------------------------------------------------------------
    {
      id: "u-step-8",
      explanation:
        "The fix: pass a **function** to the setter instead of a value. `setCount(prev => prev + 1)` — React guarantees that `prev` always equals the **true latest result** from the previous queued update, not the stale snapshot.",
      toastMessage: "✅ The fix: functional updates",
      jsxCode: `const handleClick = () => {
  setCount((prev) => prev + 1); // prev = 0 → returns 1
  setCount((prev) => prev + 1); // prev = 1 → returns 2
  setCount((prev) => prev + 1); // prev = 2 → returns 3
};

// Each updater function BUILDS on the result of the previous.
// React runs them IN ORDER against the true latest value.`,
      activeLine: 2,
      snapshotValues: [
        { name: "count", value: "0", isStale: false },
      ],
      updateQueue: [],
      resolvedValue: null,
      renderCount: 1,
      notes: [
        {
          title: "🔑 Value vs Function",
          content:
            "**`setCount(count + 1)`** — reads the snapshot. If called 3 times, all 3 use the same old value.\n\n**`setCount(prev => prev + 1)`** — receives the latest queued result. Each call builds on the previous, giving correct cumulative results.",
        },
      ],
    },

    // -----------------------------------------------------------------------
    // STEP 9 — Queue processing with functional updates: chain 0→1→2→3
    // -----------------------------------------------------------------------
    {
      id: "u-step-9",
      explanation:
        "React queues all three **functions**. When processing, it runs each one in order, feeding each the output of the previous. The chain: 0 → 1 → 2 → 3. Final result: `count = 3`. ✅",
      toastMessage: "Queue processed → count = 3 ✅",
      jsxCode: `// React processes the queue:
// fn1: prev = 0 → returns 1
// fn2: prev = 1 → returns 2   ← uses result of fn1
// fn3: prev = 2 → returns 3   ← uses result of fn2

// React re-renders ONCE with count = 3. Correct!`,
      snapshotValues: [
        { name: "count", value: "0 → 3", isStale: false },
      ],
      updateQueue: [
        {
          id: "fq1",
          type: "fn",
          displayLabel: "prev => prev + 1",
          resolvedTo: "1",
          isProcessed: true,
        },
        {
          id: "fq2",
          type: "fn",
          displayLabel: "prev => prev + 1",
          resolvedTo: "2",
          isProcessed: true,
        },
        {
          id: "fq3",
          type: "fn",
          displayLabel: "prev => prev + 1",
          resolvedTo: "3",
          isProcessed: true,
        },
      ],
      resolvedValue: "3",
      renderCount: 2,
    },

    // -----------------------------------------------------------------------
    // STEP 10 — Interview answer: Phase B summary
    // -----------------------------------------------------------------------
    {
      id: "u-step-10",
      explanation:
        "\"No — React batches state updates in the same event handler into a single re-render. The trap: if you call `setCount(count + 1)` three times, all three use the same snapshot value, so they overwrite each other. The fix: `setCount(prev => prev + 1)` — React runs these functions in sequence, each building on the last result.\"",
      toastMessage: "🎤 Interview-ready answer",
      jsxCode: `// ❌ TRAP — all three use count = 0 from the snapshot
const handleClick = () => {
  setCount(count + 1); // → 1
  setCount(count + 1); // → 1 (still count=0!)
  setCount(count + 1); // → 1 (still count=0!)
}; // Result: 1

// ✅ FIX — each builds on the previous result
const handleClick = () => {
  setCount((prev) => prev + 1); // 0 → 1
  setCount((prev) => prev + 1); // 1 → 2
  setCount((prev) => prev + 1); // 2 → 3
}; // Result: 3`,
      notes: [
        {
          title: "🎤 Senior-Level Answer",
          content:
            "\"React **batches** state updates in the same event handler into a single re-render. If you call `setCount(count + 1)` three times, all three use the same frozen snapshot (`count = 0`), so the result is `1` not `3`. The fix is **functional updates** — `setCount(prev => prev + 1)` — React runs these in sequence, each receiving the true latest queued result.\"",
        },
        {
          title: "🔍 React 18 Note",
          content:
            "Before React 18, batching only happened inside React event handlers. In React 18+, batching happens almost everywhere — including inside `setTimeout`, `Promise.then`, and native event handlers. An interviewer who knows this detail will be impressed if you mention it.",
        },
      ],
      snapshotValues: [
        { name: "count", value: "0", isStale: false },
      ],
      updateQueue: [],
      resolvedValue: null,
      renderCount: 1,
    },
  ],
};
