import { ReactSimulationScenario } from "./engine";

export const REACT_SCENARIO_1: ReactSimulationScenario = {
  id: "react-rendering-1",
  title: "React Rendering & Virtual DOM",
  description: "Learn how React actually shows things on screen: JSX -> Virtual DOM -> Real DOM -> Diffing.",
  steps: [
    // ---------------------------------------------------------
    // EXAMPLE 1: INITIAL RENDER
    // ---------------------------------------------------------
    {
      id: "ex1-step1",
      explanation: "Example 1: Let's see how React renders a simple component from scratch.",
      toastMessage: "App initialized",
      jsxCode: `function Greeting() {\n  return <h1>Hello, Rohan</h1>;\n}`,
      notes: [
        {
          title: "Intuition First",
          content: "Imagine you're painting a wall.\n\n**The old way (no React):** Every time a brick needs repainting, you manually find that exact brick and paint it. This is `document.getElementById(...)`. It is slow and hard to maintain as apps grow.\n\n**React's way:** You just describe **what the whole wall should look like**, and give that description to a smart assistant. The assistant compares what the wall looks like now vs what you want, and repaints ONLY the bricks that need changing."
        }
      ]
    },
    {
      id: "ex1-step2",
      explanation: "You write JSX. It looks like HTML, but browsers don't understand JSX at all. A tool called Babel compiles it.",
      toastMessage: "Babel compilation",
      jsxCode: `function Greeting() {\n  return <h1>Hello, Rohan</h1>;\n}`,
      compiledCode: `React.createElement('h1', null, 'Hello, Rohan')`,
      showCompiled: true,
      notes: [
        {
          title: "JSX is NOT HTML",
          content: "It looks like HTML so it's readable to humans, but the browser has no idea what `<h1>Hello, Rohan</h1>` means in a `.js` file. Babel translates it into plain JavaScript function calls before it reaches the browser."
        }
      ]
    },
    {
      id: "ex1-step3",
      explanation: "When React.createElement runs, it returns a plain JavaScript object called a React Element. This tree of objects is the Virtual DOM.",
      showCompiled: true,
      compiledCode: `{\n  type: 'h1',\n  props: {\n    children: 'Hello, Rohan'\n  }\n}`,
      virtualDom: {
        id: "v-h1",
        type: "h1",
        props: { children: "Hello, Rohan" },
        children: ["Hello, Rohan"],
        diffStatus: "added"
      },
      notes: [
        {
          title: "React Element & Virtual DOM",
          content: "A **React Element** is just a plain JS object describing what you WANT on screen. It is a blueprint, not the actual finished building. The **Virtual DOM** is just a tree of these plain `{type, props}` objects sitting in memory. Creating thousands of them is cheap and fast."
        }
      ]
    },
    {
      id: "ex1-step4",
      explanation: "Finally, React looks at the Virtual DOM tree and constructs the expensive Real Browser DOM.",
      virtualDom: {
        id: "v-h1",
        type: "h1",
        props: { children: "Hello, Rohan" },
        children: ["Hello, Rohan"],
        diffStatus: "unchanged"
      },
      realDom: {
        id: "r-h1",
        type: "h1",
        text: "Hello, Rohan",
        attributes: {},
        children: [],
        highlight: true
      },
      notes: [
        {
          title: "Real Browser DOM",
          content: "The real DOM is the actual structure the browser uses to paint pixels. Touching the real DOM is slow (causes layout/paint recalculations). React's goal is to touch this layer as little as possible."
        }
      ]
    },
    // ---------------------------------------------------------
    // EXAMPLE 2: RECONCILIATION & DIFFING
    // ---------------------------------------------------------
    {
      id: "ex2-step1",
      explanation: "Example 2: State Changes. Let's see what happens when a user interacts with a Counter component.",
      jsxCode: `function Counter() {\n  const [count, setCount] = useState(0);\n\n  return (\n    <div>\n      <p>You clicked {count} times</p>\n      <button onClick={() => setCount(count + 1)}>Click me</button>\n    </div>\n  );\n}`,
      activeLine: 2,
      virtualDom: {
        id: "v-div-0",
        type: "div",
        props: {},
        children: [
          { id: "v-p-0", type: "p", props: {}, children: ["You clicked 0 times"] },
          { id: "v-button-0", type: "button", props: { onClick: "fn" }, children: ["Click me"] }
        ],
        diffStatus: "unchanged"
      },
      realDom: {
        id: "r-div",
        type: "div",
        attributes: {},
        children: [
          { id: "r-p", type: "p", text: "You clicked 0 times", attributes: {}, children: [] },
          { id: "r-button", type: "button", text: "Click me", attributes: {}, children: [] }
        ]
      },
      notes: [
        {
          title: "Initial Setup",
          content: "React internally converted this JSX into createElement calls, built a Virtual DOM tree, and painted the Real DOM. The `count` is currently `0`."
        }
      ]
    },
    {
      id: "ex2-step2",
      explanation: "The user clicks the button. The onClick handler calls setCount(1). React sees state changed and schedules a re-render.",
      activeLine: 7,
      toastMessage: "User clicked button",
      jsxCode: `function Counter() {\n  const [count, setCount] = useState(0);\n\n  return (\n    <div>\n      <p>You clicked {count} times</p>\n      <button onClick={() => setCount(count + 1)}>Click me</button>\n    </div>\n  );\n}`,
      virtualDom: {
        id: "v-div-0",
        type: "div",
        props: {},
        children: [
          { id: "v-p-0", type: "p", props: {}, children: ["You clicked 0 times"] },
          { id: "v-button-0", type: "button", props: { onClick: "fn" }, children: ["Click me"] }
        ],
        diffStatus: "unchanged"
      },
      realDom: {
        id: "r-div",
        type: "div",
        attributes: {},
        children: [
          { id: "r-p", type: "p", text: "You clicked 0 times", attributes: {}, children: [] },
          { id: "r-button", type: "button", text: "Click me", attributes: {}, children: [] }
        ]
      }
    },
    {
      id: "ex2-step3",
      explanation: "React runs the whole Counter() function again. This produces a BRAND NEW tree of React Elements (Virtual DOM).",
      activeLine: 1,
      activeAction: "diffing",
      oldVirtualDom: {
        id: "v-div-0",
        type: "div",
        props: {},
        children: [
          { id: "v-p-0", type: "p", props: {}, children: ["You clicked 0 times"] },
          { id: "v-button-0", type: "button", props: { onClick: "fn" }, children: ["Click me"] }
        ]
      },
      virtualDom: {
        id: "v-div-1",
        type: "div",
        props: {},
        children: [
          { id: "v-p-1", type: "p", props: {}, children: ["You clicked 1 times"] },
          { id: "v-button-1", type: "button", props: { onClick: "fn" }, children: ["Click me"] }
        ]
      },
      realDom: {
        id: "r-div",
        type: "div",
        attributes: {},
        children: [
          { id: "r-p", type: "p", text: "You clicked 0 times", attributes: {}, children: [] },
          { id: "r-button", type: "button", text: "Click me", attributes: {}, children: [] }
        ]
      },
      notes: [
        {
          title: "Two Trees",
          content: "React now has TWO trees in memory:\n1. The OLD tree (what's currently on screen, count: 0).\n2. The NEW tree (what SHOULD be drawn now, count: 1)."
        }
      ]
    },
    {
      id: "ex2-step4",
      explanation: "React compares the old tree and the new tree node by node. This is called diffing.",
      activeAction: "diffing",
      oldVirtualDom: {
        id: "v-div-0",
        type: "div",
        props: {},
        children: [
          { id: "v-p-0", type: "p", props: {}, children: ["You clicked 0 times"] },
          { id: "v-button-0", type: "button", props: { onClick: "fn" }, children: ["Click me"] }
        ]
      },
      virtualDom: {
        id: "v-div-1",
        type: "div",
        props: {},
        diffStatus: "unchanged",
        children: [
          { id: "v-p-1", type: "p", props: {}, diffStatus: "changed", children: ["You clicked 1 times"] },
          { id: "v-button-1", type: "button", props: { onClick: "fn" }, diffStatus: "unchanged", children: ["Click me"] }
        ]
      },
      realDom: {
        id: "r-div",
        type: "div",
        attributes: {},
        children: [
          { id: "r-p", type: "p", text: "You clicked 0 times", attributes: {}, children: [] },
          { id: "r-button", type: "button", text: "Click me", attributes: {}, children: [] }
        ]
      },
      notes: [
        {
          title: "Finding the Difference",
          content: "React finds:\n- The `<div>` is the same type → keep it.\n- The `<button>` is the same type → keep it.\n- The `<p>` is the same type, but its text changed from '0' to '1' → mark this text for update."
        }
      ]
    },
    {
      id: "ex2-step5",
      explanation: "React touches the Real DOM — but ONLY the tiny piece that changed. The <div> and <button> in the real DOM are untouched.",
      activeAction: "reconciliation",
      virtualDom: {
        id: "v-div-1",
        type: "div",
        props: {},
        diffStatus: "unchanged",
        children: [
          { id: "v-p-1", type: "p", props: {}, diffStatus: "unchanged", children: ["You clicked 1 times"] },
          { id: "v-button-1", type: "button", props: { onClick: "fn" }, diffStatus: "unchanged", children: ["Click me"] }
        ]
      },
      realDom: {
        id: "r-div",
        type: "div",
        attributes: {},
        children: [
          { id: "r-p", type: "p", text: "You clicked 1 times", attributes: {}, children: [], highlight: true },
          { id: "r-button", type: "button", text: "Click me", attributes: {}, children: [] }
        ]
      },
      notes: [
        {
          title: "Reconciliation",
          content: "This comparison and patching process is called **Reconciliation**. React re-ran the *whole function* and rebuilt the *whole* virtual tree (cheap), but only touched **one single tiny piece** of the browser DOM (expensive).\n\nReact gives you correctness and maintainability by default, at a reasonably fast speed, without manually tracking changes."
        }
      ]
    }
  ]
};
