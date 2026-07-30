import { ReactSimulationScenario } from "./engine";

export const REACT_SCENARIO_4: ReactSimulationScenario = {
  id: "react-useeffect-4",
  title: "useEffect — Side Effects & the Dependency Array",
  description:
    "Most misunderstood hook in React. We'll trace exactly when it runs, why the dependency array exists, and what breaks without it.",
  layoutMode: "use-effect",
  steps: [
    // -----------------------------------------------------------------------
    // STEP 1 — Intuition: What is a side effect?
    // -----------------------------------------------------------------------
    {
      id: "e4-s1-intro",
      explanation:
        "Everything so far — components, JSX, state — has been about **describing what should appear on screen**. But real apps need to do things that have **nothing to do with the screen**: fetch data, start timers, talk to a WebSocket, update the browser tab title. These are called **side effects**.",
      toastMessage: "Episode 4 — useEffect",
      jsxCode: `// Side effects are actions that reach OUTSIDE
// of React's "describe the UI" job.

// Examples:
// ✅ fetch('/api/user')        — talks to a server
// ✅ setInterval(() => {}, 1000) — starts a timer
// ✅ document.title = 'Home'   — touches the browser
// ✅ socket.connect()          — connects to live chat

// The component function body is ONLY for:
// describing what the UI looks like.
// Do NOT put side effects in there directly.`,
      effectPhase: null,
      notes: [
        {
          title: "🌐 What is a Side Effect?",
          content:
            'A **side effect** is any code that reaches **outside** of calculating and returning a value. Fetching data, starting timers, and subscribing to live streams are all side effects — they\'re "on the side" of the main job of returning UI.',
        },
      ],
    },

    // -----------------------------------------------------------------------
    // STEP 2 — The Problem: Why can't you put side effects in the render body?
    // -----------------------------------------------------------------------
    {
      id: "e4-s2-problem",
      explanation:
        "Here's the trap: if you put a `fetch()` directly in the component body, it runs on **every single render**. If `setUser(data)` inside the fetch triggers a re-render, you get a fetch → re-render → fetch → re-render... **infinite loop**. Component functions are supposed to be pure — just return UI given data.",
      toastMessage: "⚠️ Fetch in render body = infinite loop!",
      jsxCode: `function UserProfile({ userId }) {
  const [user, setUser] = useState(null);

  // ❌ WRONG — this runs on EVERY render.
  // setUser triggers a re-render.
  // That re-render runs fetch() again.
  // That fetch calls setUser again.
  // INFINITE LOOP.
  fetch(\`/api/users/\${userId}\`)
    .then(res => res.json())
    .then(data => setUser(data));

  return <div>{user?.name}</div>;
}`,
      effectPhase: null,
      activeLine: 9,
      notes: [
        {
          title: "♾️ The Infinite Loop Trap",
          content:
            "Component functions re-run on every render. Putting a `fetch()` directly inside — without any guard — means it fires every render. If that fetch calls `setState`, it triggers another render, which fires another fetch, forever.",
        },
      ],
    },

    // -----------------------------------------------------------------------
    // STEP 3 — useEffect: The Solution
    // -----------------------------------------------------------------------
    {
      id: "e4-s3-solution",
      explanation:
        "`useEffect` gives you a clearly **separated, controlled place** to say: **\"after React finishes updating the screen, THEN also do this side thing.\"** The effect function runs after rendering — not during — which breaks the infinite loop.",
      toastMessage: "useEffect = run after render, not during",
      jsxCode: `function UserProfile({ userId }) {
  const [user, setUser] = useState(null);

  // ✅ CORRECT — useEffect separates
  // side effect code from render code.
  useEffect(() => {
    fetch(\`/api/users/\${userId}\`)
      .then(res => res.json())
      .then(data => setUser(data));
  }, [userId]);
  //  ↑ dependency array — we'll cover this next

  return <div>{user?.name ?? 'Loading...'}</div>;
}`,
      effectPhase: null,
      activeLine: 6,
      notes: [
        {
          title: "💡 useEffect's Job",
          content:
            "`useEffect` takes a function (the **effect function**) and tells React: **\"after you're done updating the real DOM for this render, run this function.\"** This keeps side effect code clearly separated from the UI description.",
        },
      ],
    },

    // -----------------------------------------------------------------------
    // STEP 4 — The Render Pipeline: where does useEffect fit?
    // -----------------------------------------------------------------------
    {
      id: "e4-s4-render-phase",
      explanation:
        "Let's trace the exact pipeline. **Step 1**: The component function runs — JSX is returned, the Virtual DOM tree is built.",
      toastMessage: "Pipeline Step 1: Component renders",
      jsxCode: `function UserProfile({ userId }) {
  const [user, setUser] = useState(null);

  useEffect(() => {
    fetch(\`/api/users/\${userId}\`)
      .then(res => res.json())
      .then(data => setUser(data));
  }, [userId]);

  // ← React calls this function.
  // JSX is evaluated, Virtual DOM built.
  return <div>{user?.name ?? 'Loading...'}</div>;
}`,
      effectPhase: "render",
      activeLine: 12,
    },

    // -----------------------------------------------------------------------
    // STEP 5 — DOM Update phase
    // -----------------------------------------------------------------------
    {
      id: "e4-s5-dom-update",
      explanation:
        "**Step 2**: React diffs the old Virtual DOM against the new one, finds what changed, and applies the minimal set of changes to the **real DOM**. The DOM is now updated in memory — but the user hasn't necessarily seen it yet.",
      toastMessage: "Pipeline Step 2: Real DOM updated",
      jsxCode: `// After React evaluates the component function:
//
// Virtual DOM (before):   Virtual DOM (now):
//   <div>null</div>         <div>Loading...</div>
//           |
//           ▼ diffing
//           |
//   Real DOM updated:
//   <div>Loading...</div>
//
// The DOM is mutated in memory.
// The user hasn't visually seen this yet.`,
      effectPhase: "dom-update",
    },

    // -----------------------------------------------------------------------
    // STEP 6 — Paint phase
    // -----------------------------------------------------------------------
    {
      id: "e4-s6-paint",
      explanation:
        "**Step 3**: The **browser** (not React) takes the updated DOM and **paints** it to the screen — actually drawing pixels. This is the moment the user visually sees the update. `useEffect` has NOT run yet.",
      toastMessage: "Pipeline Step 3: Browser paints — user sees the screen",
      jsxCode: `// After the real DOM is updated:
//
//   Browser engine reads the updated DOM
//       |
//       ▼ layout + compositing
//       |
//   Pixels are drawn to the screen ← PAINT
//   The user now visually sees "Loading..."
//
// useEffect has NOT fired yet.
// The user sees the update first.
// Only then does useEffect run.`,
      effectPhase: "paint",
    },

    // -----------------------------------------------------------------------
    // STEP 7 — Effect runs
    // -----------------------------------------------------------------------
    {
      id: "e4-s7-effect-runs",
      explanation:
        "**Step 4**: Only **after** the browser has painted does `useEffect`'s function run. React checks the dependency array, sees this is the first render (so effect always runs), and executes the effect function. The `fetch()` starts. Since it's async, the rest of the app keeps running while we wait for the network.",
      toastMessage: "Pipeline Step 4: useEffect fires ✅",
      jsxCode: `useEffect(() => {
  // ← THIS runs NOW, after paint.
  console.log('Fetching user:', userId);

  fetch(\`/api/users/\${userId}\`)
    .then(res => res.json())
    .then(data => setUser(data));
    // setUser(data) will trigger a re-render
    // when the network responds — later.
}, [userId]);`,
      effectPhase: "effect-runs",
      activeLine: 2,
      notes: [
        {
          title: "⏱️ Async fetch inside useEffect",
          content:
            "`fetch()` is **asynchronous** — it starts the request and returns immediately. The component keeps working while the network responds. When data arrives, `.then(data => setUser(data))` fires, triggering a re-render with the real user data.",
        },
      ],
    },

    // -----------------------------------------------------------------------
    // STEP 8 — Dependency array: No array at all
    // -----------------------------------------------------------------------
    {
      id: "e4-s8-dep-no-array",
      explanation:
        "The **dependency array** is the second argument to `useEffect`. It controls **when** the effect re-runs. **Form 1: No array at all** — the effect runs after **every single render**, no exceptions. This is almost never what you want.",
      toastMessage: "No dep array = runs after EVERY render",
      jsxCode: `useEffect(() => {
  console.log('This runs after EVERY render.');
  // No dependency array at all.
  // Form: useEffect(fn)
  //
  // This fires on:
  //   ✓ First render
  //   ✓ State changes
  //   ✓ Prop changes
  //   ✓ Parent re-renders
  //   ✓ Literally anything that causes a re-render
});
//  ↑ No second argument at all.`,
      effectPhase: null,
      depArrayMode: "no-array",
      depArrayCurrent: null,
      depArrayPrevious: null,
      depArrayChanged: undefined,
      notes: [
        {
          title: "⚠️ No Array = Runs Every Render",
          content:
            "Omitting the dependency array entirely is **not the same as an empty array**. It means the effect fires after every single render. If the effect calls `setState`, this almost always causes an **infinite re-render loop**.",
        },
      ],
    },

    // -----------------------------------------------------------------------
    // STEP 9 — Dependency array: Empty array
    // -----------------------------------------------------------------------
    {
      id: "e4-s9-dep-empty",
      explanation:
        "**Form 2: Empty array `[]`** — the effect runs exactly **once**, right after the very first render, and then **never again**. React sees the array is empty, so there are no values that could change — the effect can never be triggered again. This is the \"on mount\" pattern.",
      toastMessage: "Empty dep array = runs exactly ONCE",
      jsxCode: `useEffect(() => {
  console.log('This runs only ONCE.');
  // Form: useEffect(fn, [])
  //
  // This fires on:
  //   ✓ First render ONLY
  //   ✗ State changes — skipped
  //   ✗ Prop changes — skipped
  //   ✗ Parent re-renders — skipped
  //
  // "On mount" — common for one-time setup.
}, []);
//  ↑ Empty array.`,
      effectPhase: null,
      depArrayMode: "empty",
      depArrayCurrent: "[]",
      depArrayPrevious: null,
      depArrayChanged: false,
      notes: [
        {
          title: "🟢 [] = Run Once On Mount",
          content:
            "An **empty** dependency array means \"there are no values to watch, so never re-run.\" The effect still fires after the first render — it does NOT mean \"never run.\" This is the most common mistake beginners make when first learning this.",
        },
      ],
    },

    // -----------------------------------------------------------------------
    // STEP 10 — Dependency array: With values
    // -----------------------------------------------------------------------
    {
      id: "e4-s10-dep-with-value",
      explanation:
        "**Form 3: Array with values `[userId]`** — the effect runs after the first render, AND any time one of the listed values **has changed** since the last render. React compares each value using `Object.is()` — essentially strict equality.",
      toastMessage: "Dep array [userId] = re-run when userId changes",
      jsxCode: `useEffect(() => {
  console.log('Fetching user:', userId);
  fetch(\`/api/users/\${userId}\`)
    .then(res => res.json())
    .then(data => setUser(data));
}, [userId]);
//  ↑ [userId] — "only re-run if userId changed."
//
// This fires on:
//   ✓ First render
//   ✓ When userId changes from "u1" to "u2"
//   ✗ When unrelated state changes — skipped
//   ✗ When parent re-renders — skipped`,
      effectPhase: null,
      depArrayMode: "with-value",
      depArrayCurrent: '"u1"',
      depArrayPrevious: null,
      depArrayChanged: true,
      notes: [
        {
          title: "🎯 Only Re-run When Values Change",
          content:
            "The dependency array is React's optimization gate. If `userId` is still `\"u1\"` on the next render, React sees no change and **skips** the effect entirely — no unnecessary network calls.",
        },
      ],
    },

    // -----------------------------------------------------------------------
    // STEP 11 — Dep changed: re-run
    // -----------------------------------------------------------------------
    {
      id: "e4-s11-dep-changed",
      explanation:
        "The parent changes `userId` from `\"u1\"` to `\"u2\"`. The component re-renders. React compares the dep array: **previous `\"u1\"` vs current `\"u2\"`** — they're different. The effect **must run again**. React queues it.",
      toastMessage: "userId changed → effect will re-run",
      jsxCode: `// Parent component changes the userId prop:
// userId: "u1" → "u2"

// UserProfile re-renders.
// React checks the dependency array:
//
//   Previous render: [userId] = ["u1"]
//   Current render:  [userId] = ["u2"]
//
//   "u1" === "u2"? → ❌ NO — DIFFERENT
//
// Decision: MUST re-run the effect.
// (But first — does a cleanup function exist?
//  We'll cover that in Episode 5.)`,
      effectPhase: "effect-runs",
      depArrayMode: "with-value",
      depArrayCurrent: '"u2"',
      depArrayPrevious: '"u1"',
      depArrayChanged: true,
    },

    // -----------------------------------------------------------------------
    // STEP 12 — Dep same: skip
    // -----------------------------------------------------------------------
    {
      id: "e4-s12-dep-same",
      explanation:
        "Something else causes a re-render — say, a completely unrelated state update. `userId` is still `\"u2\"`. React compares: **previous `\"u2\"` vs current `\"u2\"`** — same value. The effect is **skipped entirely**. No unnecessary fetch happens.",
      toastMessage: "userId same → effect SKIPPED ✅",
      jsxCode: `// Some unrelated state triggers a re-render.
// userId prop hasn't changed: still "u2".

// React checks the dependency array:
//
//   Previous render: [userId] = ["u2"]
//   Current render:  [userId] = ["u2"]
//
//   "u2" === "u2"? → ✅ YES — SAME
//
// Decision: SKIP the effect.
// fetch() does NOT run again.
// This is the entire point of the dep array.`,
      effectPhase: null,
      depArrayMode: "with-value",
      depArrayCurrent: '"u2"',
      depArrayPrevious: '"u2"',
      depArrayChanged: false,
    },

    // -----------------------------------------------------------------------
    // STEP 13 — Referential equality gotcha
    // -----------------------------------------------------------------------
    {
      id: "e4-s13-ref-equality",
      explanation:
        "⚠️ **Important gotcha**: React compares dependency values using `Object.is()` — which checks **referential equality** for objects and arrays. An object literal `{ id: userId }` creates a **brand new object in memory every render**, even if its contents look identical. React sees it as changed every time — the effect re-runs on every render.",
      toastMessage: "⚠️ Object/array deps create new references every render!",
      jsxCode: `// ❌ WRONG — object literal in dep array
useEffect(() => {
  console.log('runs');
}, [{ id: userId }]);
// A NEW object {} is created every render.
// Previous: { id: "u1" } at address 0xABC
// Current:  { id: "u1" } at address 0xDEF
// Object.is(0xABC, 0xDEF) → false → ALWAYS runs!

// ✅ CORRECT — use the primitive value directly
useEffect(() => {
  console.log('runs');
}, [userId]); // "u1" === "u1" → same primitive → skipped`,
      effectPhase: null,
      depArrayMode: "with-value",
      depArrayCurrent: '{ id: "u1" } (new ref)',
      depArrayPrevious: '{ id: "u1" } (old ref)',
      depArrayChanged: true,
      notes: [
        {
          title: "🔑 Object.is() — Not Deep Equality",
          content:
            "React does NOT do a deep comparison of objects. It uses `Object.is()` — similar to `===` — which compares **identity** (memory address) for objects. Always depend on **primitive values** (`userId`, `count`) extracted from objects, not the objects themselves.",
        },
      ],
    },

    // -----------------------------------------------------------------------
    // STEP 14 — StrictMode double invoke
    // -----------------------------------------------------------------------
    {
      id: "e4-s14-strictmode",
      explanation:
        "In **React StrictMode** (the default in Next.js development), React **intentionally** runs your effect, then immediately runs its cleanup, then runs the effect again — only in development, never in production. This is not a bug. It's React stress-testing your cleanup logic.",
      toastMessage: "StrictMode: mount → cleanup → mount (dev only)",
      jsxCode: `// In <React.StrictMode> (dev only):
//
// STEP 1: Component mounts
//         → Effect runs ✓
//
// STEP 2: React simulates unmount
//         → Cleanup runs ✓
//
// STEP 3: React remounts
//         → Effect runs again ✓
//
// WHY? To catch bugs where the effect sets
// something up that cleanup doesn't undo.
// If your app works correctly under StrictMode,
// cleanup is properly implemented.`,
      effectPhase: null,
      notes: [
        {
          title: "🔄 StrictMode is Your Friend",
          content:
            "If your app breaks in development — double-fetching, double-logging — it means your **cleanup function is incomplete**. StrictMode is exposing a real bug you'd hit in production when a user navigates away and back quickly. Fix the cleanup, not the StrictMode.",
        },
      ],
    },

    // -----------------------------------------------------------------------
    // STEP 15 — Summary
    // -----------------------------------------------------------------------
    {
      id: "e4-s15-summary",
      explanation:
        "That's `useEffect` — the full picture. The pipeline: **render → DOM update → browser paint → effect runs**. The dep array: **no array** (every render), **`[]`** (once on mount), **`[values]`** (when those values change). Objects in the dep array create new references every render — use primitives. StrictMode double-invokes in dev to test cleanup.",
      toastMessage: "Episode 4 complete 🎉",
      jsxCode: `// useEffect mental model — lock this in:

useEffect(() => {
  // Runs AFTER the browser paints.
  // Never blocks the user from seeing the screen.
}, [dep]);
// No array → every render
// []       → once on mount
// [dep]    → when dep changes (Object.is)

// Always return a cleanup if you set something up.
// (That's Episode 5 — Cleanup & Race Conditions.)`,
      effectPhase: null,
      depArrayMode: "with-value",
      depArrayCurrent: "dep",
      depArrayPrevious: "dep",
      depArrayChanged: false,
      notes: [
        {
          title: "📖 Interview Answer — Senior Level",
          content:
            'useEffect runs **after** the browser paints the screen, not before. The dep array controls re-running: empty = once, values = when those values change via Object.is(). Object/array literals in deps cause re-runs every render because they\'re new references. StrictMode double-invokes in dev — not a bug, it\'s testing your cleanup. "And cleanup" — that\'s next.',
        },
      ],
    },
  ],
};
