import { ReactSimulationScenario } from "./engine";

export const REACT_SCENARIO_7: ReactSimulationScenario = {
  id: "react-useref-7",
  title: "useRef: The React Memory Librarian",
  description: "A hook that lets you safely store values outside of the render cycle, or access DOM elements directly without triggering re-renders.",
  layoutMode: "use-ref",
  steps: [
    {
      id: "e7-s1-broken-stopwatch",
      explanation: "Imagine you're building a stopwatch. You click Start... then Stop. Nothing happens. The timer keeps running forever. Where did the timer ID go? Let's look at how normal variables behave during a re-render.",
      toastMessage: "Episode 7: The Broken Stopwatch",
      jsxCode: `function BrokenTimer() {
  const [time, setTime] = useState(0);
  // ❌ Problem: Recreated on EVERY render!
  let timerId; 

  const start = () => {
    timerId = setInterval(() => setTime(t => t + 1), 1000);
  };

  const stop = () => {
    clearInterval(timerId); 
  };

  return <button onClick={stop}>Stop</button>;
}`,
      useRefMode: "react-memory",
      isRenderTriggered: false,
      letValue: "undefined",
    },
    {
      id: "e7-s2-let-fails",
      explanation: "When `start` is clicked, `timerId` might become `1045`. But a second later, `setTime` triggers a re-render. The function runs from top to bottom again! `let timerId;` runs again, resetting it to `undefined`. When you click stop, you are trying to clear `undefined` instead of `1045`. The ID is lost forever.",
      toastMessage: "let timerId resets to undefined!",
      jsxCode: `function BrokenTimer() {
  const [time, setTime] = useState(0);
  // ❌ Problem: Recreated on EVERY render!
  let timerId; 

  const start = () => {
    timerId = setInterval(() => setTime(t => t + 1), 1000);
  };

  const stop = () => {
    clearInterval(timerId); 
  };

  return <button onClick={stop}>Stop</button>;
}`,
      activeLine: 4,
      useRefMode: "react-memory",
      isRenderTriggered: true,
      letValue: "undefined",
      notes: [
        {
          title: "🔄 The Component Lifecycle",
          content: "Every re-render is a completely fresh execution of the function. Any normal variables inside the function (`let count = 0`) are born again from scratch. They have no memory of previous renders."
        }
      ]
    },
    {
      id: "e7-s3-intro-useref",
      explanation: "React introduces `useRef`. When you call `useRef(0)`, React creates a box `{ current: 0 }` and stores it safely on a shelf in \"React Memory\", outside of your component.",
      toastMessage: "React creates Box #42 on the shelf",
      jsxCode: `function FixedTimer() {
  const [time, setTime] = useState(0);
  
  // ✅ Create a box on the shelf
  const timerIdRef = useRef(0); 

  // ...
}`,
      activeLine: 5,
      useRefMode: "react-memory",
      isRenderTriggered: false,
      activeBoxId: "Box #42",
      refValue: 0,
      boxShelfStatus: "shelf"
    },
    {
      id: "e7-s4-librarian",
      explanation: "Here is the magic. On the next render, the function runs again. It sees `useRef(0)`. But React acts like a Librarian. It says \"Oh, you already have a box.\" It ignores the `0`, walks over to the shelf, and hands back the **EXACT SAME Box #42**.",
      toastMessage: "The Librarian hands back the SAME box",
      jsxCode: `function FixedTimer() {
  const [time, setTime] = useState(0);
  
  // ✅ Next render: Librarian hands back Box #42
  const timerIdRef = useRef(0); 

  // ...
}`,
      activeLine: 5,
      useRefMode: "react-memory",
      isRenderTriggered: true,
      activeBoxId: "Box #42",
      refValue: 0,
      boxShelfStatus: "handed-down",
      notes: [
        {
          title: "📦 Box #42",
          content: "It doesn't return a copy. It doesn't return Box #43. It returns the exact identical object in memory. This is why it survives re-renders."
        }
      ]
    },
    {
      id: "e7-s5-silent-mutation",
      explanation: "When you update the ref (`timerIdRef.current = 1045`), the box opens, the value updates, and it closes. Notice what DOES NOT happen: no explosions, no shockwaves, no re-renders. The UI is completely unaware that the value changed. It's totally silent.",
      toastMessage: "ref.current = 1045: Mutates silently",
      jsxCode: `function FixedTimer() {
  const [time, setTime] = useState(0);
  const timerIdRef = useRef(0); 

  const start = () => {
    // Silently mutate the box contents
    timerIdRef.current = 1045;
  };
}`,
      activeLine: 7,
      useRefMode: "react-memory",
      isRenderTriggered: false,
      activeBoxId: "Box #42",
      refValue: 1045,
      boxShelfStatus: "mutating"
    },
    {
      id: "e7-s6-state-shockwave",
      explanation: "Now watch what happens when state changes. `setTime` fires. A massive re-render shockwave rips through the component. `let` variables would be destroyed. But look at Box #42 on the shelf! It's perfectly safe. The Librarian simply hands it down again.",
      toastMessage: "State triggers render, but Box #42 survives!",
      jsxCode: `function FixedTimer() {
  const [time, setTime] = useState(0);
  const timerIdRef = useRef(0); 

  const start = () => {
    timerIdRef.current = 1045;
    
    // Boom! Re-render scheduled
    setTime(1);
  };
}`,
      activeLine: 9,
      useRefMode: "react-memory",
      isRenderTriggered: true,
      stateValue: 1,
      activeBoxId: "Box #42",
      refValue: 1045,
      boxShelfStatus: "handed-down"
    },
    {
      id: "e7-s7-fixed-timer",
      explanation: "Because Box #42 survived the re-renders, when the user finally clicks Stop, the `stop` function looks inside the box, finds the exact ID (`1045`), and successfully clears the timer. Problem solved.",
      toastMessage: "The Fixed Timer works!",
      jsxCode: `function FixedTimer() {
  const [time, setTime] = useState(0);
  const timerIdRef = useRef(null); 

  const start = () => {
    timerIdRef.current = setInterval(() => setTime(t => t+1), 1000);
  };

  const stop = () => {
    // ✅ Success! Retrieves exact ID from Box #42
    clearInterval(timerIdRef.current); 
  };

  return <button onClick={stop}>Stop</button>;
}`,
      useRefMode: "react-memory",
      isRenderTriggered: false,
      stateValue: 1,
      activeBoxId: "Box #42",
      refValue: 1045,
      boxShelfStatus: "shelf"
    },
    {
      id: "e7-s8-dom-problem",
      explanation: "Now for the second superpower: **Direct DOM Access**. Sometimes you need to touch a real HTML node (like calling `.focus()`). First, we create an empty vault (`null`). During the first render, the real DOM node doesn't exist yet.",
      toastMessage: "DOM Access: First render, inputRef is null",
      jsxCode: `function SearchBox() {
  const inputRef = useRef(null); // Starts as null

  useEffect(() => {
    // ...
  }, []);

  // Tell React to connect our ref to this DOM node
  return <input ref={inputRef} placeholder="Search..." />;
}`,
      useRefMode: "dom-ref",
      refCurrentStatus: "null",
      domNodeExists: false,
      activeLine: 2
    },
    {
      id: "e7-s9-dom-attach",
      explanation: "Next, React updates the real DOM. Immediately after creating the `<input>` DOM node, React automatically populates `inputRef.current` with it. It throws a 'grappling hook' to connect the React world to the Browser world.",
      toastMessage: "React throws a grappling hook to the real DOM",
      jsxCode: `function SearchBox() {
  const inputRef = useRef(null);

  useEffect(() => {
    // ...
  }, []);

  // Tell React to connect our ref to this DOM node
  return <input ref={inputRef} placeholder="Search..." />;
}`,
      useRefMode: "dom-ref",
      refCurrentStatus: "dom-node",
      domNodeExists: true,
      activeLine: 9
    },
    {
      id: "e7-s10-misconception",
      explanation: "❌ **Misconception:** 'Changing ref.current updates the UI.'\nWrong! Changing a ref NEVER triggers a re-render. If you want something to visually update on screen, it MUST be state (`useState`). Only use `useRef` for internal bookkeeping or DOM access.",
      toastMessage: "Misconception: Refs do NOT update the UI",
      jsxCode: `// ❌ BAD: Trying to use a ref for UI
const titleRef = useRef("Old Title");

// Later...
titleRef.current = "New Title"; 
// Nothing happens on screen! The component won't re-render.

// ✅ GOOD: Use state for UI
const [title, setTitle] = useState("Old Title");
setTitle("New Title"); // Schedules a re-render
`,
      useRefMode: "react-memory",
      stateValue: '"New Title"',
      refValue: '"New Title"',
      isRenderTriggered: true,
      activeBoxId: "Box #99",
      boxShelfStatus: "shelf"
    }
  ]
};
