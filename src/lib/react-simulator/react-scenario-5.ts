import { ReactSimulationScenario } from "./engine";

export const REACT_SCENARIO_5: ReactSimulationScenario = {
  id: "react-cleanup-5",
  title: "Cleanup & Race Conditions",
  description:
    "When effects set things up, they must tear them down. Miss the cleanup and you get memory leaks, stale data, and race conditions.",
  layoutMode: "use-effect-cleanup",
  steps: [
    // -----------------------------------------------------------------------
    // STEP 1 — Intuition: What is a cleanup function?
    // -----------------------------------------------------------------------
    {
      id: "e5-s1-intro",
      explanation:
        "When your effect **sets something up** — a timer, a WebSocket connection, an event listener — that thing keeps running in the background even after React is done with it. The **cleanup function** is your contract with React: \"when you're done with this effect, call this to undo what I set up.\"",
      toastMessage: "Episode 5 — Cleanup & Race Conditions",
      jsxCode: `useEffect(() => {
  // Set something up...
  const timer = setInterval(() => {
    console.log('tick');
  }, 1000);

  // Return a function that UNDOES the setup.
  return () => {
    clearInterval(timer); // ← cleanup function
  };
}, []);`,
      cleanupMoment: null,
      cleanupPhase: null,
      raceConditionRequests: [],
      notes: [
        {
          title: "🧹 The Cleanup Contract",
          content:
            "If your effect function **returns another function**, React treats it as the **cleanup function**. Its job: undo whatever the effect set up. Stop a timer. Close a connection. Remove a listener. Cancel a request.",
        },
      ],
    },

    // -----------------------------------------------------------------------
    // STEP 2 — When does cleanup run? Moment 1: On dep change
    // -----------------------------------------------------------------------
    {
      id: "e5-s2-when-cleanup-dep",
      explanation:
        "Common misconception: cleanup only runs on unmount. **Wrong.** Cleanup runs in **two moments**. **Moment 1**: When a **dependency changes** and the effect is about to re-run. React runs the **old cleanup first**, then runs the new effect.",
      toastMessage: "Cleanup Moment 1: Before effect re-runs (dep changed)",
      jsxCode: `useEffect(() => {
  fetch(\`/api/users/\${userId}\`)
    .then(res => res.json())
    .then(data => setUser(data));

  return () => {
    // This cleanup runs BEFORE the NEXT
    // effect fires, when userId changes.
    console.log('Cleaning up for userId:', userId);
  };
}, [userId]);
// Sequence when userId changes:
// 1. cleanup for OLD userId runs
// 2. NEW effect runs for new userId`,
      cleanupMoment: "dep-changed",
      cleanupPhase: "cleanup-runs",
      raceConditionRequests: [],
    },

    // -----------------------------------------------------------------------
    // STEP 3 — When does cleanup run? Moment 2: On unmount
    // -----------------------------------------------------------------------
    {
      id: "e5-s3-when-cleanup-unmount",
      explanation:
        "**Moment 2**: When the component is **removed from the screen** (unmounted) — the user navigates away, a conditional renders the component out. React runs the cleanup one final time. Without this, the effect keeps running invisibly — that's a **memory leak**.",
      toastMessage: "Cleanup Moment 2: On component unmount",
      jsxCode: `useEffect(() => {
  const ws = new WebSocket('wss://chat.example.com');
  ws.onmessage = (e) => setMessages(m => [...m, e.data]);

  return () => {
    // User navigated away → component unmounts.
    // Without this, the WebSocket stays open
    // forever — consuming memory, receiving
    // data nobody reads. A REAL memory leak.
    ws.close(); // ← cleanup on unmount
  };
}, [roomId]);`,
      cleanupMoment: "unmount",
      cleanupPhase: "cleanup-runs",
      raceConditionRequests: [],
      notes: [
        {
          title: "💧 Memory Leaks in Production",
          content:
            "In a real chat app, forgetting `ws.close()` in the cleanup means every time a user visits the chat page, a new WebSocket connection opens and never closes. After 10 visits, 10 connections are running in the background, all receiving data, all trying to update state on a component that no longer exists.",
        },
      ],
    },

    // -----------------------------------------------------------------------
    // STEP 4 — LiveClock: the broken version
    // -----------------------------------------------------------------------
    {
      id: "e5-s4-liveclock-broken",
      explanation:
        "Let's trace the **LiveClock** bug from the notes. No dep array AND no cleanup. On first render, `setInterval` starts — timer 1 is created. `setTime` triggers a re-render. The effect runs again. Timer 2 is created. Another re-render. Timer 3... All ticking simultaneously, none ever stopped.",
      toastMessage: "⚠️ Timer leak: new interval every render",
      jsxCode: `function LiveClock() {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    setInterval(() => {    // ← No ID captured!
      setTime(new Date()); // ← triggers re-render
    }, 1000);
    // ← No cleanup function returned!
  });
  //  ↑ No dependency array!

  // What happens:
  // Render 1 → setInterval → timer 1 created
  // setTime → re-render
  // Render 2 → setInterval → timer 2 created
  // setTime → re-render (twice as fast now!)
  // Render 3 → timer 3... and so on forever.
  return <p>{time.toLocaleTimeString()}</p>;
}`,
      cleanupMoment: null,
      cleanupPhase: null,
      raceConditionRequests: [],
      activeLine: 4,
      notes: [
        {
          title: "⚠️ Two Bugs, Not One",
          content:
            "Bug 1: No dependency array → effect re-runs after every render. Bug 2: No cleanup → old intervals are never stopped. These compound: each re-render creates a new interval while all old ones keep firing, causing exponentially accelerating re-renders.",
        },
      ],
    },

    // -----------------------------------------------------------------------
    // STEP 5 — LiveClock: the fix
    // -----------------------------------------------------------------------
    {
      id: "e5-s5-liveclock-fixed",
      explanation:
        "The fix requires **both** changes. First, capture the interval ID returned by `setInterval`. Second, return a cleanup function that calls `clearInterval(intervalId)`. Third, add `[]` as the dep array so the effect only runs once. The interval ticks every second, state updates, but the effect **never re-runs** — only the JSX re-evaluates.",
      toastMessage: "✅ Fixed: ID captured, cleanup returned, [] dep array",
      jsxCode: `function LiveClock() {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    // 1. Capture the ID returned by setInterval.
    const intervalId = setInterval(() => {
      setTime(new Date());
    }, 1000);

    // 2. Return cleanup using the captured ID.
    return () => {
      clearInterval(intervalId); // ← exact timer stopped
    };
  }, []); // 3. Run once on mount. Never again.

  // Every 1s: setTime fires → re-render.
  // But dep array [] means effect NEVER re-runs.
  // The one interval keeps ticking cleanly.
  return <p>{time.toLocaleTimeString()}</p>;
}`,
      cleanupMoment: "first-run",
      cleanupPhase: "effect-setup",
      raceConditionRequests: [],
      activeLine: 6,
      notes: [
        {
          title: "🔑 Three Rules for setInterval",
          content:
            "1. **Capture the ID** — `setInterval` returns a number ID, always store it in a variable.\n2. **Return cleanup** — `clearInterval(intervalId)` using that exact ID.\n3. **Add dep array** — `[]` means setup once, cleanup on unmount. The interval runs on its own; the effect doesn't re-run.",
        },
      ],
    },

    // -----------------------------------------------------------------------
    // STEP 6 — Cleanup in dep-change sequence: Step A (initial)
    // -----------------------------------------------------------------------
    {
      id: "e5-s6-dep-change-a",
      explanation:
        "Now let's trace the **dep-change cleanup sequence** precisely. The component first renders with `userId=\"u1\"`. The effect runs — fetch for `u1` starts. The effect is 'active' for `u1`. The cleanup function for this run is now **registered** in React's memory.",
      toastMessage: "userId = 'u1' — effect runs, fetch starts",
      jsxCode: `useEffect(() => {
  let cancelled = false; // closure variable

  fetch(\`/api/users/\${userId}\`)  // userId = "u1"
    .then(res => res.json())
    .then(data => {
      if (!cancelled) setUser(data);
    });

  return () => {
    cancelled = true; // cleanup registered ✓
  };
}, [userId]);
// State: effect for "u1" is ACTIVE
// Cleanup for "u1" is REGISTERED`,
      cleanupMoment: "first-run",
      cleanupPhase: "effect-setup",
      raceConditionRequests: [
        { id: "req-u1", label: 'Fetch user "u1"', status: "in-flight" },
      ],
      activeLine: 4,
    },

    // -----------------------------------------------------------------------
    // STEP 7 — Dep change: parent changes userId
    // -----------------------------------------------------------------------
    {
      id: "e5-s7-dep-change-b",
      explanation:
        "The parent changes `userId` to `\"u2\"`. The component re-renders. React compares dep arrays: `\"u1\"` vs `\"u2\"` — changed. React will re-run the effect. But **first**: React must run the **cleanup from the previous effect run** — the one registered in Step 6.",
      toastMessage: "userId changed to 'u2' — cleanup for 'u1' is next",
      jsxCode: `// Parent: userId = "u1" → "u2"
// UserProfile re-renders.

// React checks: ["u1"] vs ["u2"] → CHANGED
// Decision: Must re-run effect.
//
// But FIRST: React runs the cleanup function
// that was returned by the PREVIOUS effect run.
//
// The cleanup for "u1":
//   () => { cancelled = true; }
//
// This runs NOW, before the new effect.`,
      cleanupMoment: "dep-changed",
      cleanupPhase: "cleanup-runs",
      raceConditionRequests: [
        { id: "req-u1", label: 'Fetch user "u1"', status: "in-flight", isSlow: true },
      ],
    },

    // -----------------------------------------------------------------------
    // STEP 8 — Cleanup runs: cancelled = true for u1
    // -----------------------------------------------------------------------
    {
      id: "e5-s8-dep-change-c",
      explanation:
        "The cleanup runs: `cancelled = true`. This sets the `cancelled` flag inside the **closure** that the `u1` fetch callback reads. The `u1` fetch is still in-flight on the network — we can't cancel it. But when it resolves, `if (!cancelled)` will be `false`, so `setUser` is **never called**. Stale data is safely ignored.",
      toastMessage: "Cleanup runs: cancelled = true for 'u1' fetch",
      jsxCode: `// Cleanup for "u1" effect runs:
() => {
  cancelled = true;
  // ↑ This variable is shared via closure
  // with the fetch .then() callback.
  // When the "u1" response eventually arrives:
  //   .then(data => {
  //     if (!cancelled) setUser(data); ← FALSE now
  //   })
  // setUser is NOT called. Stale data discarded.
}`,
      cleanupMoment: "dep-changed",
      cleanupPhase: "cleanup-runs",
      raceConditionRequests: [
        { id: "req-u1", label: 'Fetch user "u1"', status: "blocked", isSlow: true },
      ],
      cancelledRequestId: "req-u1",
      activeLine: 3,
    },

    // -----------------------------------------------------------------------
    // STEP 9 — New effect runs for u2
    // -----------------------------------------------------------------------
    {
      id: "e5-s9-dep-change-d",
      explanation:
        "After the `u1` cleanup runs, React runs the **new effect** for `userId=\"u2\"`. A fresh `cancelled = false` variable is created in this new closure. A new fetch for `u2` starts. A new cleanup function (for `u2`) is registered. The lifecycle repeats.",
      toastMessage: "New effect runs for 'u2' — fresh closure",
      jsxCode: `// New effect runs for userId = "u2":
useEffect(() => {
  let cancelled = false; // ← FRESH variable, new closure

  fetch(\`/api/users/\${userId}\`) // userId = "u2"
    .then(res => res.json())
    .then(data => {
      if (!cancelled) setUser(data); // ← will apply ✓
    });

  return () => {
    cancelled = true; // cleanup for "u2" registered
  };
}, [userId]);`,
      cleanupMoment: "dep-changed",
      cleanupPhase: "new-effect",
      raceConditionRequests: [
        { id: "req-u1", label: 'Fetch user "u1"', status: "blocked", isSlow: true },
        { id: "req-u2", label: 'Fetch user "u2"', status: "in-flight" },
      ],
      activeLine: 5,
    },

    // -----------------------------------------------------------------------
    // STEP 10 — Race condition: without cleanup
    // -----------------------------------------------------------------------
    {
      id: "e5-s10-race-condition-bug",
      explanation:
        "Here's the **race condition** bug that happens without cleanup. User types `u1` — slow fetch starts. User quickly changes to `u2` — fast fetch starts. The `u2` fetch resolves first: UI shows user 2. Then the slow `u1` fetch resolves — it calls `setUser(u1Data)` and **overwrites the UI with wrong data**. The user now sees user 1's profile while the URL shows user 2.",
      toastMessage: "⚠️ Race condition: stale data wins!",
      jsxCode: `// WITHOUT cleanup (broken):
useEffect(() => {
  fetch(\`/api/users/\${userId}\`)
    .then(res => res.json())
    .then(data => setUser(data)); // ← always fires
}, [userId]);

// Timeline:
// t=0ms   userId="u1", slow fetch starts
// t=50ms  userId="u2", fast fetch starts
// t=200ms fetch for "u2" resolves → UI shows u2 ✓
// t=800ms fetch for "u1" resolves → setUser(u1Data)!
//         UI now shows u1's profile ← WRONG DATA ❌`,
      cleanupMoment: null,
      cleanupPhase: null,
      raceConditionRequests: [
        { id: "req-u1-race", label: 'Fetch user "u1" (slow, 800ms)', status: "in-flight", isSlow: true },
        { id: "req-u2-race", label: 'Fetch user "u2" (fast, 200ms)', status: "in-flight" },
      ],
      activeLine: 4,
      notes: [
        {
          title: "🏁 Race Condition Definition",
          content:
            "A **race condition** happens when two operations compete to update the same thing, and the outcome depends on which one wins the race — not on which one should logically win. Without cleanup, a slow, stale response can win and overwrite a faster, correct one.",
        },
      ],
    },

    // -----------------------------------------------------------------------
    // STEP 11 — Race condition: stale resolves last
    // -----------------------------------------------------------------------
    {
      id: "e5-s11-race-stale-wins",
      explanation:
        "The slow `u1` fetch resolves **after** `u2`. Without the `cancelled` flag, `setUser(u1Data)` fires unconditionally — the UI is now showing user 1's data while the component was supposed to be showing user 2. This is the race condition in action.",
      toastMessage: "❌ Stale 'u1' response overwrites UI with wrong data",
      jsxCode: `// t=800ms: The slow "u1" fetch finally resolves.
// Without cleanup:
fetch(\`/api/users/u1\`)
  .then(data => setUser(data)); // ← fires! No guard.
// setUser(u1Data) called.
// UI re-renders showing user 1's data.
// But userId is "u2" — this is WRONG.

// The user sees user 2's URL but user 1's content.
// This is a real production bug. Hard to reproduce
// in development (fast network), easy to hit on
// slow mobile connections.`,
      cleanupMoment: null,
      cleanupPhase: null,
      raceConditionRequests: [
        { id: "req-u1-race", label: 'Fetch user "u1" (STALE)', status: "applied", isSlow: true },
        { id: "req-u2-race", label: 'Fetch user "u2"', status: "resolved" },
      ],
      activeLine: 4,
    },

    // -----------------------------------------------------------------------
    // STEP 12 — Race condition: with cleanup fix
    // -----------------------------------------------------------------------
    {
      id: "e5-s12-race-fixed",
      explanation:
        "With the `cancelled` flag, the `u1` fetch still runs on the network — we can't abort it. But when it resolves, `if (!cancelled)` is `false` (cleanup set it to `true` when `userId` changed). `setUser` is **not called**. The `u2` data stays on screen. This is the correct behavior.",
      toastMessage: "✅ Cleanup flag blocks stale 'u1' response",
      jsxCode: `// t=800ms: The slow "u1" fetch resolves.
// WITH cleanup:
fetch(\`/api/users/u1\`)
  .then(data => {
    if (!cancelled) { // cancelled = true (cleanup ran)
      setUser(data);  // ← NOT called ✓
    }
  });
// Stale data is silently discarded.
// UI keeps showing user 2's data correctly.

// The sequence:
// userId changed → cleanup ran → cancelled = true
// → "u1" response arrives → check fails → ignored ✓`,
      cleanupMoment: "dep-changed",
      cleanupPhase: "cleanup-runs",
      raceConditionRequests: [
        { id: "req-u1-fixed", label: 'Fetch user "u1" (BLOCKED)', status: "blocked", isSlow: true },
        { id: "req-u2-fixed", label: 'Fetch user "u2"', status: "applied" },
      ],
      cancelledRequestId: "req-u1-fixed",
      activeLine: 5,
      notes: [
        {
          title: "✅ The Cleanup Pattern for Fetch",
          content:
            "The `cancelled` flag in a closure is the most common and simplest way to guard against race conditions in useEffect. The cleanup sets `cancelled = true`, and the async callback checks it before calling `setState`.",
        },
      ],
    },

    // -----------------------------------------------------------------------
    // STEP 13 — AbortController: the senior pattern
    // -----------------------------------------------------------------------
    {
      id: "e5-s13-abortcontroller",
      explanation:
        "There's a more powerful pattern: `AbortController`. Instead of just ignoring the response with a flag, it **actually cancels the in-flight network request**, freeing browser resources. The cleanup calls `controller.abort()`, which causes the fetch `Promise` to reject with an `AbortError`.",
      toastMessage: "Senior pattern: AbortController cancels the request itself",
      jsxCode: `useEffect(() => {
  const controller = new AbortController();

  fetch(\`/api/users/\${userId}\`, {
    signal: controller.signal // link to controller
  })
    .then(res => res.json())
    .then(data => setUser(data))
    .catch(err => {
      if (err.name === 'AbortError') return; // expected
      throw err; // re-throw real errors
    });

  return () => {
    controller.abort(); // actually cancels the request
  };
}, [userId]);`,
      cleanupMoment: "dep-changed",
      cleanupPhase: "cleanup-runs",
      raceConditionRequests: [
        { id: "req-abort", label: 'Fetch user "u1" (ABORTED)', status: "blocked", isSlow: true },
        { id: "req-abort2", label: 'Fetch user "u2"', status: "in-flight" },
      ],
      cancelledRequestId: "req-abort",
      activeLine: 15,
      notes: [
        {
          title: "🚀 AbortController vs cancelled Flag",
          content:
            "The `cancelled` flag ignores the response but the request still completes on the network. `AbortController` actually **terminates the request** mid-flight — the browser stops sending/receiving data for that request. Use AbortController when you care about network efficiency as well as correctness.",
        },
      ],
    },

    // -----------------------------------------------------------------------
    // STEP 14 — Summary
    // -----------------------------------------------------------------------
    {
      id: "e5-s14-summary",
      explanation:
        "Cleanup in one sentence: **if your effect sets something up, your cleanup tears it down**. It runs **twice**: before the effect re-runs (on dep change) and on unmount. The `cancelled` flag prevents stale responses from overwriting the UI. `AbortController` goes further and cancels the request itself.",
      toastMessage: "Episode 5 complete 🎉",
      jsxCode: `// Cleanup — the complete mental model:

useEffect(() => {
  // SET UP something
  // ...

  return () => {
    // TEAR DOWN exactly what you set up.
    // This runs:
    // 1. BEFORE the effect re-runs (dep changed)
    // 2. WHEN the component unmounts
  };
}, [dep]);

// Without cleanup:  memory leaks, race conditions
// With cleanup:     safe, predictable, production-ready`,
      cleanupMoment: null,
      cleanupPhase: null,
      raceConditionRequests: [],
      notes: [
        {
          title: "📖 Interview Answer — Senior Level",
          content:
            "\"The cleanup runs **before** the effect re-runs when a dependency changes, and also on unmount. For fetch-based effects, I use either a `cancelled` flag or `AbortController` to prevent stale responses from overwriting state — that's the race condition pattern. Not having cleanup is one of the most common memory leak sources in production React apps.\"",
        },
      ],
    },
  ],
};
