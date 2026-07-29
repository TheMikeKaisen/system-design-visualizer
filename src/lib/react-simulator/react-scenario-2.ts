import { ReactSimulationScenario } from "./engine";

export const REACT_SCENARIO_2: ReactSimulationScenario = {
  id: "react-props-state-2",
  title: "Props, State & One-Way Data Flow",
  description:
    "Understand the critical difference between props and state — and why React enforces that data only flows downward.",
  layoutMode: "props-flow",
  steps: [
    // -----------------------------------------------------------------------
    // STEP 1 — Intuition: The Restaurant Analogy
    // -----------------------------------------------------------------------
    {
      id: "p-step-1",
      explanation:
        "Think of a component like a **restaurant order form**. Some information comes from outside (the table number, handed by the host). Some information the waiter tracks themselves, internally. These two things map to **props** and **state**.",
      toastMessage: "Episode 2 — Props & State",
      jsxCode: `// Props  → data passed IN from a parent (read-only)
// State  → data a component owns and manages itself

// The waiter (component) can READ the table number
// (prop) but can NEVER change it.
// Only the host (parent) can hand out a different one.`,
      notes: [
        {
          title: "🍽️ The Restaurant Rule",
          content:
            "**Props** = the table number handed to the waiter. **Read-only.** The waiter never changes it.\n\n**State** = the waiter's internal tally of items written. **Only the waiter can update it.**",
        },
      ],
      componentTree: null,
      propsInspector: null,
    },

    // -----------------------------------------------------------------------
    // STEP 2 — Parent defined: App owns the state
    // -----------------------------------------------------------------------
    {
      id: "p-step-2",
      explanation:
        "We define `App` — the **parent** component. It owns the state: `count` and its updater `setCount`. No child has access to these yet.",
      toastMessage: "Parent component created",
      jsxCode: `function App() {
  const [count, setCount] = useState(0);
  //  ^ App OWNS this. No child can touch it directly.

  const handleIncrement = () => {
    setCount(count + 1);
  };

  return <Counter count={count} onIncrement={handleIncrement} />;
}`,
      activeLine: 2,
      componentTree: {
        id: "app",
        name: "App",
        isActive: true,
        isParent: true,
        state: [
          { name: "count", value: "0" },
          { name: "setCount", value: "fn()" },
        ],
        props: [],
        children: [],
      },
      propsInspector: null,
    },

    // -----------------------------------------------------------------------
    // STEP 3 — Child defined: Counter receives props
    // -----------------------------------------------------------------------
    {
      id: "p-step-3",
      explanation:
        "Now we define `Counter` — the **child**. It receives `count` and `onIncrement` as props. Notice: it does not create any state of its own. It is a pure receiver.",
      jsxCode: `function Counter(props) {
  // props = { count: 0, onIncrement: fn }

  return (
    <div>
      <p>Count is: {props.count}</p>
      <button onClick={props.onIncrement}>Add One</button>
    </div>
  );
}`,
      activeLine: 1,
      componentTree: {
        id: "app",
        name: "App",
        isParent: true,
        state: [
          { name: "count", value: "0" },
          { name: "setCount", value: "fn()" },
        ],
        props: [],
        children: [
          {
            id: "counter",
            name: "Counter",
            isActive: true,
            props: [],
            state: [],
            children: [],
          },
        ],
      },
      propsInspector: null,
    },

    // -----------------------------------------------------------------------
    // STEP 4 — Props flow DOWN: App passes count + onIncrement
    // -----------------------------------------------------------------------
    {
      id: "p-step-4",
      explanation:
        "App renders `<Counter count={count} onIncrement={handleIncrement} />`. Two props flow **downward** — the current value, and a function the child can call. This is **one-way data flow**.",
      toastMessage: "Props flowing down ⬇️",
      jsxCode: `function App() {
  const [count, setCount] = useState(0);

  const handleIncrement = () => {
    setCount(count + 1);
  };

  return <Counter count={count} onIncrement={handleIncrement} />;
  //               ^^^^^^^^^^^  ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  //               data prop    function prop (callback)
}`,
      activeLine: 8,
      componentTree: {
        id: "app",
        name: "App",
        isActive: true,
        isParent: true,
        state: [
          { name: "count", value: "0" },
          { name: "setCount", value: "fn()" },
        ],
        props: [],
        children: [
          {
            id: "counter",
            name: "Counter",
            props: [
              { name: "count", value: "0", isReadOnly: true },
              { name: "onIncrement", value: "fn()", isFunction: true, isReadOnly: true },
            ],
            state: [],
            children: [],
          },
        ],
      },
      propsInspector: [
        { name: "count", value: "0", isReadOnly: true },
        { name: "onIncrement", value: "handleIncrement()", isFunction: true, isReadOnly: true },
      ],
    },

    // -----------------------------------------------------------------------
    // STEP 5 — Child READS props, never modifies
    // -----------------------------------------------------------------------
    {
      id: "p-step-5",
      explanation:
        "Inside `Counter`, `props.count` is simply displayed. It is **never** reassigned. The component is a pure reader of what the parent handed it.",
      jsxCode: `function Counter(props) {
  return (
    <div>
      <p>Count is: {props.count}</p>
      {/* props.count is READ ONLY — never modify! */}
      <button onClick={props.onIncrement}>Add One</button>
    </div>
  );
}`,
      activeLine: 4,
      componentTree: {
        id: "app",
        name: "App",
        isParent: true,
        state: [
          { name: "count", value: "0" },
          { name: "setCount", value: "fn()" },
        ],
        props: [],
        children: [
          {
            id: "counter",
            name: "Counter",
            isActive: true,
            props: [
              { name: "count", value: "0", isReadOnly: true },
              { name: "onIncrement", value: "fn()", isFunction: true, isReadOnly: true },
            ],
            state: [],
            children: [],
          },
        ],
      },
      propsInspector: [
        { name: "count", value: "0", isReadOnly: true },
        { name: "onIncrement", value: "handleIncrement()", isFunction: true, isReadOnly: true },
      ],
    },

    // -----------------------------------------------------------------------
    // STEP 6 — User clicks: child triggers the parent's function
    // -----------------------------------------------------------------------
    {
      id: "p-step-6",
      explanation:
        "User clicks the button. Counter calls `props.onIncrement()`. The child is NOT changing state — it is **triggering** a function that lives in the parent. Like pressing a call bell, not rewriting the host's chart.",
      toastMessage: "Button clicked! Child calls onIncrement()",
      jsxCode: `function Counter(props) {
  return (
    <div>
      <p>Count is: {props.count}</p>
      <button onClick={props.onIncrement}>Add One</button>
      {/* ↑ This call goes UP to the parent. */}
      {/* The child has NOT touched state directly. */}
    </div>
  );
}`,
      activeLine: 5,
      componentTree: {
        id: "app",
        name: "App",
        isParent: true,
        state: [
          { name: "count", value: "0" },
          { name: "setCount", value: "fn()" },
        ],
        props: [],
        children: [
          {
            id: "counter",
            name: "Counter",
            isActive: true,
            props: [
              { name: "count", value: "0", isReadOnly: true },
              { name: "onIncrement", value: "fn()", isFunction: true, isReadOnly: true },
            ],
            state: [],
            children: [],
          },
        ],
      },
      propsInspector: [
        { name: "count", value: "0", isReadOnly: true },
        { name: "onIncrement", value: "handleIncrement()", isFunction: true, isReadOnly: true },
      ],
    },

    // -----------------------------------------------------------------------
    // STEP 7 — handleIncrement runs in App → setCount(1)
    // -----------------------------------------------------------------------
    {
      id: "p-step-7",
      explanation:
        "`handleIncrement` — defined inside `App` — calls `setCount(count + 1)`. The state change happens **inside the parent**. React schedules a re-render of `App`, not `Counter`.",
      toastMessage: "App's setCount(1) fires → re-render scheduled",
      jsxCode: `function App() {
  const [count, setCount] = useState(0);

  const handleIncrement = () => {
    setCount(count + 1); // ← runs HERE, in the parent
  };

  return <Counter count={count} onIncrement={handleIncrement} />;
}`,
      activeLine: 5,
      componentTree: {
        id: "app",
        name: "App",
        isActive: true,
        isParent: true,
        state: [
          { name: "count", value: "0 → 1", },
          { name: "setCount", value: "fn()" },
        ],
        props: [],
        children: [
          {
            id: "counter",
            name: "Counter",
            props: [
              { name: "count", value: "0", isReadOnly: true },
              { name: "onIncrement", value: "fn()", isFunction: true, isReadOnly: true },
            ],
            state: [],
            children: [],
          },
        ],
      },
      propsInspector: null,
    },

    // -----------------------------------------------------------------------
    // STEP 8 — App re-renders, new props flow down
    // -----------------------------------------------------------------------
    {
      id: "p-step-8",
      explanation:
        "App re-renders with `count = 1`. It passes the **new** `count` prop down to Counter. Counter re-renders because its parent gave it updated props — not because Counter changed anything itself.",
      toastMessage: "Props updated ⬇️ count = 1",
      jsxCode: `// App re-renders (count is now 1)
// ↓ New props flow DOWN
<Counter count={1} onIncrement={handleIncrement} />

// Counter sees: props.count = 1
// It re-renders and displays "Count is: 1"`,
      componentTree: {
        id: "app",
        name: "App",
        isActive: true,
        isParent: true,
        state: [
          { name: "count", value: "1" },
          { name: "setCount", value: "fn()" },
        ],
        props: [],
        children: [
          {
            id: "counter",
            name: "Counter",
            isActive: true,
            props: [
              { name: "count", value: "1", isReadOnly: true, isNew: true },
              { name: "onIncrement", value: "fn()", isFunction: true, isReadOnly: true },
            ],
            state: [],
            children: [],
          },
        ],
      },
      propsInspector: [
        { name: "count", value: "1", isReadOnly: true, isNew: true },
        { name: "onIncrement", value: "handleIncrement()", isFunction: true, isReadOnly: true },
      ],
    },

    // -----------------------------------------------------------------------
    // STEP 9 — Key rule: data NEVER flows upward directly
    // -----------------------------------------------------------------------
    {
      id: "p-step-9",
      explanation:
        "The golden rule: **data flows ONE way — down**. The child never reaches up and mutates the parent. It only calls functions the parent handed it. This keeps the app predictable — there's always one clear owner of each piece of data.",
      jsxCode: `// ✅ CORRECT — one-way data flow
//   App (state owner)
//     ↓  passes count + handler as props
//   Counter (reads props, calls callback)

// ❌ WRONG — never do this:
// function Counter(props) {
//   props.count = 5;  // Mutating props — BUG!
// }`,
      notes: [
        {
          title: "💡 Lifting State Up",
          content:
            "When two siblings need to share data, **lift the state** to their common parent. The parent holds the state and passes it + updater functions down to each child as props. This is the most fundamental React architecture pattern.",
        },
        {
          title: "🧠 Quick Distinction",
          content:
            '**Props** answer "what was I given?"\n\n**State** answers "what do I remember myself?"\n\nThey are independent — a component can have both, one, or neither.',
        },
      ],
      componentTree: {
        id: "app",
        name: "App",
        isParent: true,
        state: [
          { name: "count", value: "1" },
          { name: "setCount", value: "fn()" },
        ],
        props: [],
        children: [
          {
            id: "counter",
            name: "Counter",
            props: [
              { name: "count", value: "1", isReadOnly: true },
              { name: "onIncrement", value: "fn()", isFunction: true, isReadOnly: true },
            ],
            state: [],
            children: [],
          },
        ],
      },
      propsInspector: [
        { name: "count", value: "1", isReadOnly: true },
        { name: "onIncrement", value: "handleIncrement()", isFunction: true, isReadOnly: true },
      ],
    },
  ],
};
