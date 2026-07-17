import { SimulationScenario } from "./engine";

export const EVENT_LOOP_SCENARIO_1: SimulationScenario = {
  id: "el-1",
  title: "1. setTimeout is NOT instant",
  code: `console.log("Start");

setTimeout(() => {
  console.log("Timeout");
}, 0);

console.log("End");`,
  steps: [
    {
      currentLine: null,
      explanation: "Engine initialized. Preparing to parse and execute code.",
      toastMessage: "Engine Initialized",
      consoleOutput: [],
      callStack: [],
      webAPIs: [],
      microtaskQueue: [],
      callbackQueue: [],
      eventLoop: { phase: "idle", message: "Event Loop is idle" }
    },
    {
      currentLine: null,
      explanation: "Global Execution Context is created.",
      toastMessage: "Global Creation Phase",
      consoleOutput: [],
      callStack: [
        {
          id: "global",
          name: "Global Execution Context",
          phase: "Creation Phase",
          variables: [],
          outerEnvironment: null,
        }
      ],
      webAPIs: [],
      microtaskQueue: [],
      callbackQueue: [],
      eventLoop: { phase: "idle", message: "Event Loop is idle" }
    },
    {
      currentLine: 1,
      explanation: "Execution Phase begins. console.log executes synchronously.",
      toastMessage: "Line 1 executing...",
      consoleOutput: ["Start"],
      callStack: [
        {
          id: "global",
          name: "Global Execution Context",
          phase: "Execution Phase",
          variables: [],
          outerEnvironment: null,
        }
      ],
      webAPIs: [],
      microtaskQueue: [],
      callbackQueue: [],
      eventLoop: { phase: "stack_busy", message: "Call Stack is executing code" }
    },
    {
      currentLine: 3,
      explanation: "setTimeout is encountered. It is not part of core JavaScript, but a Web API provided by the browser.",
      toastMessage: "setTimeout invoked",
      consoleOutput: ["Start"],
      callStack: [
        {
          id: "global",
          name: "Global Execution Context",
          phase: "Execution Phase",
          variables: [],
          outerEnvironment: null,
        }
      ],
      webAPIs: [],
      microtaskQueue: [],
      callbackQueue: [],
      eventLoop: { phase: "stack_busy", message: "Call Stack is executing code" }
    },
    {
      currentLine: 3,
      explanation: "The browser takes over the timer. The callback and delay (0ms) are registered in the Web APIs environment.",
      toastMessage: "Handed off to Browser",
      consoleOutput: ["Start"],
      callStack: [
        {
          id: "global",
          name: "Global Execution Context",
          phase: "Execution Phase",
          variables: [],
          outerEnvironment: null,
        }
      ],
      webAPIs: [
        { id: "timer1", type: "setTimeout", label: "setTimeout()", callback: "() => console.log('Timeout')", delay: "0ms", status: "running" }
      ],
      microtaskQueue: [],
      callbackQueue: [],
      eventLoop: { phase: "stack_busy", message: "Call Stack is executing code" }
    },
    {
      currentLine: 3,
      explanation: "Because the delay is 0ms, the timer completes instantly. But the callback does NOT go to the Call Stack. It goes to the Callback Queue (Macrotask Queue).",
      toastMessage: "Timer finished",
      consoleOutput: ["Start"],
      callStack: [
        {
          id: "global",
          name: "Global Execution Context",
          phase: "Execution Phase",
          variables: [],
          outerEnvironment: null,
        }
      ],
      webAPIs: [
        { id: "timer1", type: "setTimeout", label: "setTimeout()", callback: "() => console.log('Timeout')", delay: "0ms", status: "complete" }
      ],
      microtaskQueue: [],
      callbackQueue: [],
      eventLoop: { phase: "stack_busy", message: "Call Stack is executing code" }
    },
    {
      currentLine: 7,
      explanation: "The callback is now waiting in the Callback Queue. Meanwhile, synchronous code continues executing! console.log('End') runs.",
      toastMessage: "Callback queued. Line 7 executing...",
      consoleOutput: ["Start", "End"],
      callStack: [
        {
          id: "global",
          name: "Global Execution Context",
          phase: "Execution Phase",
          variables: [],
          outerEnvironment: null,
        }
      ],
      webAPIs: [],
      microtaskQueue: [],
      callbackQueue: [
        { id: "cb1", label: "Anonymous ()", callback: "console.log('Timeout')", source: "setTimeout" }
      ],
      eventLoop: { phase: "stack_busy", message: "Call Stack is executing code" }
    },
    {
      currentLine: null,
      explanation: "The global execution context finishes and pops off the Call Stack. The Call Stack is now EMPTY.",
      toastMessage: "Global Context Popped",
      consoleOutput: ["Start", "End"],
      callStack: [],
      webAPIs: [],
      microtaskQueue: [],
      callbackQueue: [
        { id: "cb1", label: "Anonymous ()", callback: "console.log('Timeout')", source: "setTimeout" }
      ],
      eventLoop: { phase: "idle", message: "Call Stack is empty" }
    },
    {
      currentLine: null,
      explanation: "The Event Loop detects the Call Stack is empty. It first checks the Microtask Queue... it is empty.",
      toastMessage: "Event Loop checking Microtasks",
      consoleOutput: ["Start", "End"],
      callStack: [],
      webAPIs: [],
      microtaskQueue: [],
      callbackQueue: [
        { id: "cb1", label: "Anonymous ()", callback: "console.log('Timeout')", source: "setTimeout" }
      ],
      eventLoop: { phase: "checking_microtasks", message: "Checking Microtask Queue..." }
    },
    {
      currentLine: null,
      explanation: "Since there are no microtasks, the Event Loop checks the Callback Queue (Macrotasks) and finds our waiting callback.",
      toastMessage: "Event Loop checking Callbacks",
      consoleOutput: ["Start", "End"],
      callStack: [],
      webAPIs: [],
      microtaskQueue: [],
      callbackQueue: [
        { id: "cb1", label: "Anonymous ()", callback: "console.log('Timeout')", source: "setTimeout" }
      ],
      eventLoop: { phase: "checking_callbacks", message: "Checking Callback Queue..." }
    },
    {
      currentLine: null,
      explanation: "The Event Loop pulls the callback from the queue and pushes it onto the Call Stack to be executed.",
      toastMessage: "Moving to Call Stack",
      consoleOutput: ["Start", "End"],
      callStack: [],
      webAPIs: [],
      microtaskQueue: [],
      callbackQueue: [],
      eventLoop: { phase: "moving_callback", message: "Moving callback to Call Stack" }
    },
    {
      currentLine: 4,
      explanation: "The callback's Execution Context enters the Creation Phase on the Call Stack.",
      toastMessage: "Callback Execution Context created",
      consoleOutput: ["Start", "End"],
      callStack: [
        {
          id: "cb1_ctx",
          name: "Anonymous ()",
          phase: "Creation Phase",
          variables: [],
          outerEnvironment: "Global",
        }
      ],
      webAPIs: [],
      microtaskQueue: [],
      callbackQueue: [],
      eventLoop: { phase: "stack_busy", message: "Call Stack is executing code" }
    },
    {
      currentLine: 4,
      explanation: "The callback executes, logging 'Timeout'.",
      toastMessage: "Callback executing",
      consoleOutput: ["Start", "End", "Timeout"],
      callStack: [
        {
          id: "cb1_ctx",
          name: "Anonymous ()",
          phase: "Execution Phase",
          variables: [],
          outerEnvironment: "Global",
        }
      ],
      webAPIs: [],
      microtaskQueue: [],
      callbackQueue: [],
      eventLoop: { phase: "stack_busy", message: "Call Stack is executing code" }
    },
    {
      currentLine: null,
      explanation: "The callback finishes and pops off the Call Stack.",
      toastMessage: "Callback finished",
      consoleOutput: ["Start", "End", "Timeout"],
      callStack: [],
      webAPIs: [],
      microtaskQueue: [],
      callbackQueue: [],
      eventLoop: { phase: "idle", message: "Call Stack is empty" }
    },
    {
      currentLine: null,
      explanation: "All queues are empty, Call Stack is empty. The program is fully complete.",
      toastMessage: "Execution Complete",
      consoleOutput: ["Start", "End", "Timeout"],
      callStack: [],
      webAPIs: [],
      microtaskQueue: [],
      callbackQueue: [],
      eventLoop: { phase: "idle", message: "Program Complete" }
    }
  ]
};

export const EVENT_LOOP_SCENARIO_2: SimulationScenario = {
  id: "el-2",
  title: "2. Promises Jump the Queue",
  code: `console.log("Start");

setTimeout(() => {
  console.log("Timeout");
}, 0);

Promise.resolve().then(() => {
  console.log("Promise");
});

console.log("End");`,
  steps: [
    {
      currentLine: null,
      explanation: "Engine initialized.",
      toastMessage: "Engine Initialized",
      consoleOutput: [],
      callStack: [],
      webAPIs: [],
      microtaskQueue: [],
      callbackQueue: [],
      eventLoop: { phase: "idle", message: "Event Loop is idle" }
    },
    {
      currentLine: null,
      explanation: "Global Execution Context is created.",
      toastMessage: "Global Creation Phase",
      consoleOutput: [],
      callStack: [{ id: "global", name: "Global Execution Context", phase: "Creation Phase", variables: [], outerEnvironment: null }],
      webAPIs: [],
      microtaskQueue: [],
      callbackQueue: [],
      eventLoop: { phase: "idle", message: "Event Loop is idle" }
    },
    {
      currentLine: 1,
      explanation: "Execution Phase. Line 1 executes.",
      toastMessage: "Line 1 executing...",
      consoleOutput: ["Start"],
      callStack: [{ id: "global", name: "Global Execution Context", phase: "Execution Phase", variables: [], outerEnvironment: null }],
      webAPIs: [],
      microtaskQueue: [],
      callbackQueue: [],
      eventLoop: { phase: "stack_busy", message: "Call Stack is busy" }
    },
    {
      currentLine: 3,
      explanation: "setTimeout is called with 0ms delay. Handed off to Web APIs.",
      toastMessage: "Handed off to Browser",
      consoleOutput: ["Start"],
      callStack: [{ id: "global", name: "Global Execution Context", phase: "Execution Phase", variables: [], outerEnvironment: null }],
      webAPIs: [{ id: "timer1", type: "setTimeout", label: "setTimeout()", callback: "() => console.log('Timeout')", delay: "0ms", status: "running" }],
      microtaskQueue: [],
      callbackQueue: [],
      eventLoop: { phase: "stack_busy", message: "Call Stack is busy" }
    },
    {
      currentLine: 3,
      explanation: "Timer finishes instantly. Callback goes to the Callback Queue (Macrotasks).",
      toastMessage: "Timer finished",
      consoleOutput: ["Start"],
      callStack: [{ id: "global", name: "Global Execution Context", phase: "Execution Phase", variables: [], outerEnvironment: null }],
      webAPIs: [{ id: "timer1", type: "setTimeout", label: "setTimeout()", callback: "() => console.log('Timeout')", delay: "0ms", status: "complete" }],
      microtaskQueue: [],
      callbackQueue: [],
      eventLoop: { phase: "stack_busy", message: "Call Stack is busy" }
    },
    {
      currentLine: 7,
      explanation: "Promise.resolve() creates a resolved promise immediately. The .then() callback is queued into the Microtask Queue.",
      toastMessage: "Microtask queued",
      consoleOutput: ["Start"],
      callStack: [{ id: "global", name: "Global Execution Context", phase: "Execution Phase", variables: [], outerEnvironment: null }],
      webAPIs: [],
      microtaskQueue: [{ id: "mt1", label: "Promise.then()", callback: "console.log('Promise')", source: "Promise" }],
      callbackQueue: [{ id: "cb1", label: "Anonymous ()", callback: "console.log('Timeout')", source: "setTimeout" }],
      eventLoop: { phase: "stack_busy", message: "Call Stack is busy" }
    },
    {
      currentLine: 11,
      explanation: "console.log('End') executes synchronously.",
      toastMessage: "Line 11 executing...",
      consoleOutput: ["Start", "End"],
      callStack: [{ id: "global", name: "Global Execution Context", phase: "Execution Phase", variables: [], outerEnvironment: null }],
      webAPIs: [],
      microtaskQueue: [{ id: "mt1", label: "Promise.then()", callback: "console.log('Promise')", source: "Promise" }],
      callbackQueue: [{ id: "cb1", label: "Anonymous ()", callback: "console.log('Timeout')", source: "setTimeout" }],
      eventLoop: { phase: "stack_busy", message: "Call Stack is busy" }
    },
    {
      currentLine: null,
      explanation: "Global Context pops off. Call Stack is empty.",
      toastMessage: "Global Context Popped",
      consoleOutput: ["Start", "End"],
      callStack: [],
      webAPIs: [],
      microtaskQueue: [{ id: "mt1", label: "Promise.then()", callback: "console.log('Promise')", source: "Promise" }],
      callbackQueue: [{ id: "cb1", label: "Anonymous ()", callback: "console.log('Timeout')", source: "setTimeout" }],
      eventLoop: { phase: "idle", message: "Call Stack is empty" }
    },
    {
      currentLine: null,
      explanation: "Event Loop checks the Microtask Queue FIRST. It has higher priority than the Callback (Macrotask) Queue.",
      toastMessage: "Checking Microtasks",
      consoleOutput: ["Start", "End"],
      callStack: [],
      webAPIs: [],
      microtaskQueue: [{ id: "mt1", label: "Promise.then()", callback: "console.log('Promise')", source: "Promise" }],
      callbackQueue: [{ id: "cb1", label: "Anonymous ()", callback: "console.log('Timeout')", source: "setTimeout" }],
      eventLoop: { phase: "checking_microtasks", message: "Found Microtask! It jumps the queue." }
    },
    {
      currentLine: null,
      explanation: "The microtask is moved to the Call Stack.",
      toastMessage: "Moving Microtask",
      consoleOutput: ["Start", "End"],
      callStack: [],
      webAPIs: [],
      microtaskQueue: [],
      callbackQueue: [{ id: "cb1", label: "Anonymous ()", callback: "console.log('Timeout')", source: "setTimeout" }],
      eventLoop: { phase: "moving_callback", message: "Moving Microtask to Stack" }
    },
    {
      currentLine: 8,
      explanation: "Microtask Execution Context created.",
      toastMessage: "Microtask executing",
      consoleOutput: ["Start", "End"],
      callStack: [{ id: "mt1_ctx", name: "Promise Callback", phase: "Creation Phase", variables: [], outerEnvironment: "Global" }],
      webAPIs: [],
      microtaskQueue: [],
      callbackQueue: [{ id: "cb1", label: "Anonymous ()", callback: "console.log('Timeout')", source: "setTimeout" }],
      eventLoop: { phase: "stack_busy", message: "Call Stack is busy" }
    },
    {
      currentLine: 8,
      explanation: "Microtask executes, logging 'Promise'.",
      toastMessage: "Line 8 executing...",
      consoleOutput: ["Start", "End", "Promise"],
      callStack: [{ id: "mt1_ctx", name: "Promise Callback", phase: "Execution Phase", variables: [], outerEnvironment: "Global" }],
      webAPIs: [],
      microtaskQueue: [],
      callbackQueue: [{ id: "cb1", label: "Anonymous ()", callback: "console.log('Timeout')", source: "setTimeout" }],
      eventLoop: { phase: "stack_busy", message: "Call Stack is busy" }
    },
    {
      currentLine: null,
      explanation: "Microtask completes and pops off the stack.",
      toastMessage: "Microtask complete",
      consoleOutput: ["Start", "End", "Promise"],
      callStack: [],
      webAPIs: [],
      microtaskQueue: [],
      callbackQueue: [{ id: "cb1", label: "Anonymous ()", callback: "console.log('Timeout')", source: "setTimeout" }],
      eventLoop: { phase: "idle", message: "Call Stack is empty" }
    },
    {
      currentLine: null,
      explanation: "Event Loop checks Microtask Queue again (it's empty). Then it checks the Callback Queue.",
      toastMessage: "Checking Callbacks",
      consoleOutput: ["Start", "End", "Promise"],
      callStack: [],
      webAPIs: [],
      microtaskQueue: [],
      callbackQueue: [{ id: "cb1", label: "Anonymous ()", callback: "console.log('Timeout')", source: "setTimeout" }],
      eventLoop: { phase: "checking_callbacks", message: "Checking Callback Queue..." }
    },
    {
      currentLine: null,
      explanation: "The macrotask callback is moved to the Call Stack.",
      toastMessage: "Moving Macrotask",
      consoleOutput: ["Start", "End", "Promise"],
      callStack: [],
      webAPIs: [],
      microtaskQueue: [],
      callbackQueue: [],
      eventLoop: { phase: "moving_callback", message: "Moving callback to Stack" }
    },
    {
      currentLine: 4,
      explanation: "Callback executes, logging 'Timeout'.",
      toastMessage: "Line 4 executing...",
      consoleOutput: ["Start", "End", "Promise", "Timeout"],
      callStack: [{ id: "cb1_ctx", name: "Anonymous ()", phase: "Execution Phase", variables: [], outerEnvironment: "Global" }],
      webAPIs: [],
      microtaskQueue: [],
      callbackQueue: [],
      eventLoop: { phase: "stack_busy", message: "Call Stack is busy" }
    },
    {
      currentLine: null,
      explanation: "Program is fully complete.",
      toastMessage: "Execution Complete",
      consoleOutput: ["Start", "End", "Promise", "Timeout"],
      callStack: [],
      webAPIs: [],
      microtaskQueue: [],
      callbackQueue: [],
      eventLoop: { phase: "idle", message: "Program Complete" }
    }
  ]
};

export const EVENT_LOOP_SCENARIO_3: SimulationScenario = {
  id: "el-3",
  title: "3. fetch() and the Microtask Queue",
  code: `console.log("Start");

fetch("https://api.example.com/data")
  .then((response) => response.json())
  .then((data) => {
    console.log("Data:", data);
  });

console.log("End");`,
  steps: [
    {
      currentLine: null,
      explanation: "Engine initialized.",
      toastMessage: "Engine Initialized",
      consoleOutput: [],
      callStack: [],
      webAPIs: [],
      microtaskQueue: [],
      callbackQueue: [],
      eventLoop: { phase: "idle", message: "Event Loop is idle" }
    },
    {
      currentLine: null,
      explanation: "Global Execution Context is created.",
      toastMessage: "Global Creation Phase",
      consoleOutput: [],
      callStack: [{ id: "global", name: "Global Execution Context", phase: "Creation Phase", variables: [], outerEnvironment: null }],
      webAPIs: [],
      microtaskQueue: [],
      callbackQueue: [],
      eventLoop: { phase: "idle", message: "Event Loop is idle" }
    },
    {
      currentLine: 1,
      explanation: "Execution Phase. Line 1 executes.",
      toastMessage: "Line 1 executing...",
      consoleOutput: ["Start"],
      callStack: [{ id: "global", name: "Global Execution Context", phase: "Execution Phase", variables: [], outerEnvironment: null }],
      webAPIs: [],
      microtaskQueue: [],
      callbackQueue: [],
      eventLoop: { phase: "stack_busy", message: "Call Stack is busy" }
    },
    {
      currentLine: 3,
      explanation: "fetch() is a Browser Web API. A network request is initiated in the background.",
      toastMessage: "fetch() initiated",
      consoleOutput: ["Start"],
      callStack: [{ id: "global", name: "Global Execution Context", phase: "Execution Phase", variables: [], outerEnvironment: null }],
      webAPIs: [{ id: "fetch1", type: "fetch", label: "fetch('api.example.com/data')", callback: ".then(response => response.json())", status: "running" }],
      microtaskQueue: [],
      callbackQueue: [],
      eventLoop: { phase: "stack_busy", message: "Call Stack is busy" }
    },
    {
      currentLine: 9,
      explanation: "The fetch request is pending. Execution continues synchronously to line 9.",
      toastMessage: "Line 9 executing...",
      consoleOutput: ["Start", "End"],
      callStack: [{ id: "global", name: "Global Execution Context", phase: "Execution Phase", variables: [], outerEnvironment: null }],
      webAPIs: [{ id: "fetch1", type: "fetch", label: "fetch('api.example.com/data')", callback: ".then(response => response.json())", status: "running" }],
      microtaskQueue: [],
      callbackQueue: [],
      eventLoop: { phase: "stack_busy", message: "Call Stack is busy" }
    },
    {
      currentLine: null,
      explanation: "Global Context pops off. The Call Stack is empty. The browser is still fetching the data.",
      toastMessage: "Waiting for fetch...",
      consoleOutput: ["Start", "End"],
      callStack: [],
      webAPIs: [{ id: "fetch1", type: "fetch", label: "fetch('api.example.com/data')", callback: ".then(response => response.json())", status: "running" }],
      microtaskQueue: [],
      callbackQueue: [],
      eventLoop: { phase: "idle", message: "Call Stack empty, waiting for async tasks..." }
    },
    {
      currentLine: null,
      explanation: "Some time passes... the network request resolves successfully!",
      toastMessage: "fetch() resolved",
      consoleOutput: ["Start", "End"],
      callStack: [],
      webAPIs: [{ id: "fetch1", type: "fetch", label: "fetch('api.example.com/data')", callback: ".then(response => response.json())", status: "complete" }],
      microtaskQueue: [],
      callbackQueue: [],
      eventLoop: { phase: "idle", message: "Call Stack empty, waiting for async tasks..." }
    },
    {
      currentLine: null,
      explanation: "Because fetch() uses Promises, its callbacks are queued in the Microtask Queue.",
      toastMessage: "Microtask queued",
      consoleOutput: ["Start", "End"],
      callStack: [],
      webAPIs: [],
      microtaskQueue: [{ id: "mt1", label: "Promise.then()", callback: "response => response.json()", source: "fetch()" }],
      callbackQueue: [],
      eventLoop: { phase: "idle", message: "Call Stack empty, waiting for async tasks..." }
    },
    {
      currentLine: null,
      explanation: "Event Loop checks the Microtask Queue and finds the first .then() callback.",
      toastMessage: "Checking Microtasks",
      consoleOutput: ["Start", "End"],
      callStack: [],
      webAPIs: [],
      microtaskQueue: [{ id: "mt1", label: "Promise.then()", callback: "response => response.json()", source: "fetch()" }],
      callbackQueue: [],
      eventLoop: { phase: "checking_microtasks", message: "Checking Microtask Queue..." }
    },
    {
      currentLine: 4,
      explanation: "The first .then() callback is executed on the Call Stack.",
      toastMessage: "Executing response.json()",
      consoleOutput: ["Start", "End"],
      callStack: [{ id: "mt1_ctx", name: "Anonymous (response)", phase: "Execution Phase", variables: [{ name: "response", value: "Response Object" }], outerEnvironment: "Global" }],
      webAPIs: [],
      microtaskQueue: [],
      callbackQueue: [],
      eventLoop: { phase: "stack_busy", message: "Call Stack is busy" }
    },
    {
      currentLine: null,
      explanation: "response.json() completes (returning another Promise). This queues the next .then() callback into the Microtask Queue.",
      toastMessage: "Next .then() queued",
      consoleOutput: ["Start", "End"],
      callStack: [],
      webAPIs: [],
      microtaskQueue: [{ id: "mt2", label: "Promise.then()", callback: "data => console.log('Data:', data)", source: "response.json()" }],
      callbackQueue: [],
      eventLoop: { phase: "idle", message: "Call Stack is empty" }
    },
    {
      currentLine: 6,
      explanation: "The second .then() callback is executed.",
      toastMessage: "Executing second .then()",
      consoleOutput: ["Start", "End", "Data: { user: 'Alice' }"],
      callStack: [{ id: "mt2_ctx", name: "Anonymous (data)", phase: "Execution Phase", variables: [{ name: "data", value: "{ user: 'Alice' }" }], outerEnvironment: "Global" }],
      webAPIs: [],
      microtaskQueue: [],
      callbackQueue: [],
      eventLoop: { phase: "stack_busy", message: "Call Stack is busy" }
    },
    {
      currentLine: null,
      explanation: "Program is fully complete.",
      toastMessage: "Execution Complete",
      consoleOutput: ["Start", "End", "Data: { user: 'Alice' }"],
      callStack: [],
      webAPIs: [],
      microtaskQueue: [],
      callbackQueue: [],
      eventLoop: { phase: "idle", message: "Program Complete" }
    }
  ]
};

export const EVENT_LOOP_SCENARIO_4: SimulationScenario = {
  id: "el-4",
  title: "4. Nested Microtasks Drain Fully",
  code: `console.log("Start");

setTimeout(() => console.log("Timeout"), 0);

Promise.resolve()
  .then(() => {
    console.log("Promise 1");
    return Promise.resolve();
  })
  .then(() => console.log("Promise 2"));

console.log("End");`,
  steps: [
    {
      currentLine: null,
      explanation: "Engine initialized.",
      toastMessage: "Engine Initialized",
      consoleOutput: [],
      callStack: [],
      webAPIs: [],
      microtaskQueue: [],
      callbackQueue: [],
      eventLoop: { phase: "idle", message: "Event Loop is idle" }
    },
    {
      currentLine: null,
      explanation: "Global Execution Context is created.",
      toastMessage: "Global Creation Phase",
      consoleOutput: [],
      callStack: [{ id: "global", name: "Global Execution Context", phase: "Creation Phase", variables: [], outerEnvironment: null }],
      webAPIs: [],
      microtaskQueue: [],
      callbackQueue: [],
      eventLoop: { phase: "idle", message: "Event Loop is idle" }
    },
    {
      currentLine: 1,
      explanation: "Execution Phase. Line 1 executes.",
      toastMessage: "Line 1 executing...",
      consoleOutput: ["Start"],
      callStack: [{ id: "global", name: "Global Execution Context", phase: "Execution Phase", variables: [], outerEnvironment: null }],
      webAPIs: [],
      microtaskQueue: [],
      callbackQueue: [],
      eventLoop: { phase: "stack_busy", message: "Call Stack is busy" }
    },
    {
      currentLine: 3,
      explanation: "setTimeout is called with 0ms delay. Handed off to Web APIs.",
      toastMessage: "Handed off to Browser",
      consoleOutput: ["Start"],
      callStack: [{ id: "global", name: "Global Execution Context", phase: "Execution Phase", variables: [], outerEnvironment: null }],
      webAPIs: [{ id: "timer1", type: "setTimeout", label: "setTimeout()", callback: "() => console.log('Timeout')", delay: "0ms", status: "running" }],
      microtaskQueue: [],
      callbackQueue: [],
      eventLoop: { phase: "stack_busy", message: "Call Stack is busy" }
    },
    {
      currentLine: 3,
      explanation: "Timer finishes instantly. Callback goes to the Callback Queue.",
      toastMessage: "Timer finished",
      consoleOutput: ["Start"],
      callStack: [{ id: "global", name: "Global Execution Context", phase: "Execution Phase", variables: [], outerEnvironment: null }],
      webAPIs: [{ id: "timer1", type: "setTimeout", label: "setTimeout()", callback: "() => console.log('Timeout')", delay: "0ms", status: "complete" }],
      microtaskQueue: [],
      callbackQueue: [],
      eventLoop: { phase: "stack_busy", message: "Call Stack is busy" }
    },
    {
      currentLine: 5,
      explanation: "Promise.resolve() queues the first .then() callback into the Microtask Queue.",
      toastMessage: "Microtask queued",
      consoleOutput: ["Start"],
      callStack: [{ id: "global", name: "Global Execution Context", phase: "Execution Phase", variables: [], outerEnvironment: null }],
      webAPIs: [],
      microtaskQueue: [{ id: "mt1", label: "Promise.then()", callback: "() => { console.log('Promise 1'); return Promise.resolve(); }", source: "Promise" }],
      callbackQueue: [{ id: "cb1", label: "Anonymous ()", callback: "console.log('Timeout')", source: "setTimeout" }],
      eventLoop: { phase: "stack_busy", message: "Call Stack is busy" }
    },
    {
      currentLine: 12,
      explanation: "console.log('End') executes synchronously.",
      toastMessage: "Line 12 executing...",
      consoleOutput: ["Start", "End"],
      callStack: [{ id: "global", name: "Global Execution Context", phase: "Execution Phase", variables: [], outerEnvironment: null }],
      webAPIs: [],
      microtaskQueue: [{ id: "mt1", label: "Promise.then()", callback: "() => { console.log('Promise 1'); return Promise.resolve(); }", source: "Promise" }],
      callbackQueue: [{ id: "cb1", label: "Anonymous ()", callback: "console.log('Timeout')", source: "setTimeout" }],
      eventLoop: { phase: "stack_busy", message: "Call Stack is busy" }
    },
    {
      currentLine: null,
      explanation: "Global Context pops off. Call Stack is empty.",
      toastMessage: "Global Context Popped",
      consoleOutput: ["Start", "End"],
      callStack: [],
      webAPIs: [],
      microtaskQueue: [{ id: "mt1", label: "Promise.then()", callback: "() => { console.log('Promise 1'); return Promise.resolve(); }", source: "Promise" }],
      callbackQueue: [{ id: "cb1", label: "Anonymous ()", callback: "console.log('Timeout')", source: "setTimeout" }],
      eventLoop: { phase: "idle", message: "Call Stack is empty" }
    },
    {
      currentLine: null,
      explanation: "Event Loop checks the Microtask Queue FIRST.",
      toastMessage: "Checking Microtasks",
      consoleOutput: ["Start", "End"],
      callStack: [],
      webAPIs: [],
      microtaskQueue: [{ id: "mt1", label: "Promise.then()", callback: "() => { console.log('Promise 1'); return Promise.resolve(); }", source: "Promise" }],
      callbackQueue: [{ id: "cb1", label: "Anonymous ()", callback: "console.log('Timeout')", source: "setTimeout" }],
      eventLoop: { phase: "checking_microtasks", message: "Found Microtask!" }
    },
    {
      currentLine: 7,
      explanation: "The first microtask is executed. It logs 'Promise 1'.",
      toastMessage: "Executing Microtask 1",
      consoleOutput: ["Start", "End", "Promise 1"],
      callStack: [{ id: "mt1_ctx", name: "Anonymous ()", phase: "Execution Phase", variables: [], outerEnvironment: "Global" }],
      webAPIs: [],
      microtaskQueue: [],
      callbackQueue: [{ id: "cb1", label: "Anonymous ()", callback: "console.log('Timeout')", source: "setTimeout" }],
      eventLoop: { phase: "stack_busy", message: "Call Stack is busy" }
    },
    {
      currentLine: 8,
      explanation: "The microtask returns a new Promise, queuing the second .then() callback into the Microtask Queue.",
      toastMessage: "Nested Microtask queued",
      consoleOutput: ["Start", "End", "Promise 1"],
      callStack: [{ id: "mt1_ctx", name: "Anonymous ()", phase: "Execution Phase", variables: [], outerEnvironment: "Global" }],
      webAPIs: [],
      microtaskQueue: [{ id: "mt2", label: "Promise.then()", callback: "() => console.log('Promise 2')", source: "Promise 1" }],
      callbackQueue: [{ id: "cb1", label: "Anonymous ()", callback: "console.log('Timeout')", source: "setTimeout" }],
      eventLoop: { phase: "stack_busy", message: "Call Stack is busy" }
    },
    {
      currentLine: null,
      explanation: "The first microtask completes and pops off the stack.",
      toastMessage: "Microtask 1 complete",
      consoleOutput: ["Start", "End", "Promise 1"],
      callStack: [],
      webAPIs: [],
      microtaskQueue: [{ id: "mt2", label: "Promise.then()", callback: "() => console.log('Promise 2')", source: "Promise 1" }],
      callbackQueue: [{ id: "cb1", label: "Anonymous ()", callback: "console.log('Timeout')", source: "setTimeout" }],
      eventLoop: { phase: "idle", message: "Call Stack is empty" }
    },
    {
      currentLine: null,
      explanation: "The Event Loop checks the Microtask Queue AGAIN. It must drain completely before touching the Callback Queue.",
      toastMessage: "Draining Microtasks",
      consoleOutput: ["Start", "End", "Promise 1"],
      callStack: [],
      webAPIs: [],
      microtaskQueue: [{ id: "mt2", label: "Promise.then()", callback: "() => console.log('Promise 2')", source: "Promise 1" }],
      callbackQueue: [{ id: "cb1", label: "Anonymous ()", callback: "console.log('Timeout')", source: "setTimeout" }],
      eventLoop: { phase: "draining_microtask", message: "Draining Microtasks..." }
    },
    {
      currentLine: 10,
      explanation: "The second microtask executes, logging 'Promise 2'.",
      toastMessage: "Executing Microtask 2",
      consoleOutput: ["Start", "End", "Promise 1", "Promise 2"],
      callStack: [{ id: "mt2_ctx", name: "Anonymous ()", phase: "Execution Phase", variables: [], outerEnvironment: "Global" }],
      webAPIs: [],
      microtaskQueue: [],
      callbackQueue: [{ id: "cb1", label: "Anonymous ()", callback: "console.log('Timeout')", source: "setTimeout" }],
      eventLoop: { phase: "stack_busy", message: "Call Stack is busy" }
    },
    {
      currentLine: null,
      explanation: "The second microtask completes and pops off the stack.",
      toastMessage: "Microtask 2 complete",
      consoleOutput: ["Start", "End", "Promise 1", "Promise 2"],
      callStack: [],
      webAPIs: [],
      microtaskQueue: [],
      callbackQueue: [{ id: "cb1", label: "Anonymous ()", callback: "console.log('Timeout')", source: "setTimeout" }],
      eventLoop: { phase: "idle", message: "Call Stack is empty" }
    },
    {
      currentLine: null,
      explanation: "Event Loop checks Microtasks (empty), then checks the Callback Queue.",
      toastMessage: "Checking Callbacks",
      consoleOutput: ["Start", "End", "Promise 1", "Promise 2"],
      callStack: [],
      webAPIs: [],
      microtaskQueue: [],
      callbackQueue: [{ id: "cb1", label: "Anonymous ()", callback: "console.log('Timeout')", source: "setTimeout" }],
      eventLoop: { phase: "checking_callbacks", message: "Checking Callback Queue..." }
    },
    {
      currentLine: 3,
      explanation: "The macrotask callback finally gets its turn to execute.",
      toastMessage: "Executing Macrotask",
      consoleOutput: ["Start", "End", "Promise 1", "Promise 2", "Timeout"],
      callStack: [{ id: "cb1_ctx", name: "Anonymous ()", phase: "Execution Phase", variables: [], outerEnvironment: "Global" }],
      webAPIs: [],
      microtaskQueue: [],
      callbackQueue: [],
      eventLoop: { phase: "stack_busy", message: "Call Stack is busy" }
    },
    {
      currentLine: null,
      explanation: "Program is fully complete.",
      toastMessage: "Execution Complete",
      consoleOutput: ["Start", "End", "Promise 1", "Promise 2", "Timeout"],
      callStack: [],
      webAPIs: [],
      microtaskQueue: [],
      callbackQueue: [],
      eventLoop: { phase: "idle", message: "Program Complete" }
    }
  ]
};

export const EVENT_LOOP_SCENARIO_5: SimulationScenario = {
  id: "el-5",
  title: "5. Multiple Timers and Ordering",
  code: `console.log("Start");

setTimeout(() => console.log("Timer 1 (1000ms)"), 1000);
setTimeout(() => console.log("Timer 2 (500ms)"), 500);
setTimeout(() => console.log("Timer 3 (0ms)"), 0);

console.log("End");`,
  steps: [
    {
      currentLine: null,
      explanation: "Engine initialized.",
      toastMessage: "Engine Initialized",
      consoleOutput: [],
      callStack: [],
      webAPIs: [],
      microtaskQueue: [],
      callbackQueue: [],
      eventLoop: { phase: "idle", message: "Event Loop is idle" }
    },
    {
      currentLine: null,
      explanation: "Global Execution Context is created.",
      toastMessage: "Global Creation Phase",
      consoleOutput: [],
      callStack: [{ id: "global", name: "Global Execution Context", phase: "Creation Phase", variables: [], outerEnvironment: null }],
      webAPIs: [],
      microtaskQueue: [],
      callbackQueue: [],
      eventLoop: { phase: "idle", message: "Event Loop is idle" }
    },
    {
      currentLine: 1,
      explanation: "Line 1 executes.",
      toastMessage: "Line 1 executing...",
      consoleOutput: ["Start"],
      callStack: [{ id: "global", name: "Global Execution Context", phase: "Execution Phase", variables: [], outerEnvironment: null }],
      webAPIs: [],
      microtaskQueue: [],
      callbackQueue: [],
      eventLoop: { phase: "stack_busy", message: "Call Stack is busy" }
    },
    {
      currentLine: 3,
      explanation: "Timer 1 (1000ms) handed off to Web APIs.",
      toastMessage: "Timer 1 started",
      consoleOutput: ["Start"],
      callStack: [{ id: "global", name: "Global Execution Context", phase: "Execution Phase", variables: [], outerEnvironment: null }],
      webAPIs: [{ id: "t1", type: "setTimeout", label: "setTimeout()", callback: "console.log('Timer 1')", delay: "1000ms", status: "running" }],
      microtaskQueue: [],
      callbackQueue: [],
      eventLoop: { phase: "stack_busy", message: "Call Stack is busy" }
    },
    {
      currentLine: 4,
      explanation: "Timer 2 (500ms) handed off to Web APIs.",
      toastMessage: "Timer 2 started",
      consoleOutput: ["Start"],
      callStack: [{ id: "global", name: "Global Execution Context", phase: "Execution Phase", variables: [], outerEnvironment: null }],
      webAPIs: [
        { id: "t1", type: "setTimeout", label: "setTimeout()", callback: "console.log('Timer 1')", delay: "1000ms", status: "running" },
        { id: "t2", type: "setTimeout", label: "setTimeout()", callback: "console.log('Timer 2')", delay: "500ms", status: "running" }
      ],
      microtaskQueue: [],
      callbackQueue: [],
      eventLoop: { phase: "stack_busy", message: "Call Stack is busy" }
    },
    {
      currentLine: 5,
      explanation: "Timer 3 (0ms) handed off to Web APIs.",
      toastMessage: "Timer 3 started",
      consoleOutput: ["Start"],
      callStack: [{ id: "global", name: "Global Execution Context", phase: "Execution Phase", variables: [], outerEnvironment: null }],
      webAPIs: [
        { id: "t1", type: "setTimeout", label: "setTimeout()", callback: "console.log('Timer 1')", delay: "1000ms", status: "running" },
        { id: "t2", type: "setTimeout", label: "setTimeout()", callback: "console.log('Timer 2')", delay: "500ms", status: "running" },
        { id: "t3", type: "setTimeout", label: "setTimeout()", callback: "console.log('Timer 3')", delay: "0ms", status: "running" }
      ],
      microtaskQueue: [],
      callbackQueue: [],
      eventLoop: { phase: "stack_busy", message: "Call Stack is busy" }
    },
    {
      currentLine: 5,
      explanation: "Timer 3 (0ms) completes immediately. Its callback is added to the Callback Queue.",
      toastMessage: "Timer 3 finished",
      consoleOutput: ["Start"],
      callStack: [{ id: "global", name: "Global Execution Context", phase: "Execution Phase", variables: [], outerEnvironment: null }],
      webAPIs: [
        { id: "t1", type: "setTimeout", label: "setTimeout()", callback: "console.log('Timer 1')", delay: "1000ms", status: "running" },
        { id: "t2", type: "setTimeout", label: "setTimeout()", callback: "console.log('Timer 2')", delay: "500ms", status: "running" }
      ],
      microtaskQueue: [],
      callbackQueue: [{ id: "cb3", label: "Anonymous ()", callback: "console.log('Timer 3 (0ms)')", source: "setTimeout" }],
      eventLoop: { phase: "stack_busy", message: "Call Stack is busy" }
    },
    {
      currentLine: 7,
      explanation: "Line 7 executes synchronously.",
      toastMessage: "Line 7 executing...",
      consoleOutput: ["Start", "End"],
      callStack: [{ id: "global", name: "Global Execution Context", phase: "Execution Phase", variables: [], outerEnvironment: null }],
      webAPIs: [
        { id: "t1", type: "setTimeout", label: "setTimeout()", callback: "console.log('Timer 1')", delay: "1000ms", status: "running" },
        { id: "t2", type: "setTimeout", label: "setTimeout()", callback: "console.log('Timer 2')", delay: "500ms", status: "running" }
      ],
      microtaskQueue: [],
      callbackQueue: [{ id: "cb3", label: "Anonymous ()", callback: "console.log('Timer 3 (0ms)')", source: "setTimeout" }],
      eventLoop: { phase: "stack_busy", message: "Call Stack is busy" }
    },
    {
      currentLine: null,
      explanation: "Global Context pops off. Call Stack is empty. Event Loop moves Timer 3 callback to stack.",
      toastMessage: "Executing Timer 3",
      consoleOutput: ["Start", "End"],
      callStack: [{ id: "cb3_ctx", name: "Anonymous ()", phase: "Execution Phase", variables: [], outerEnvironment: "Global" }],
      webAPIs: [
        { id: "t1", type: "setTimeout", label: "setTimeout()", callback: "console.log('Timer 1')", delay: "1000ms", status: "running" },
        { id: "t2", type: "setTimeout", label: "setTimeout()", callback: "console.log('Timer 2')", delay: "500ms", status: "running" }
      ],
      microtaskQueue: [],
      callbackQueue: [],
      eventLoop: { phase: "stack_busy", message: "Call Stack is busy" }
    },
    {
      currentLine: 5,
      explanation: "Timer 3 callback executes.",
      toastMessage: "Timer 3 executed",
      consoleOutput: ["Start", "End", "Timer 3 (0ms)"],
      callStack: [{ id: "cb3_ctx", name: "Anonymous ()", phase: "Execution Phase", variables: [], outerEnvironment: "Global" }],
      webAPIs: [
        { id: "t1", type: "setTimeout", label: "setTimeout()", callback: "console.log('Timer 1')", delay: "1000ms", status: "running" },
        { id: "t2", type: "setTimeout", label: "setTimeout()", callback: "console.log('Timer 2')", delay: "500ms", status: "running" }
      ],
      microtaskQueue: [],
      callbackQueue: [],
      eventLoop: { phase: "stack_busy", message: "Call Stack is busy" }
    },
    {
      currentLine: null,
      explanation: "500ms later... Timer 2 completes.",
      toastMessage: "Timer 2 finished",
      consoleOutput: ["Start", "End", "Timer 3 (0ms)"],
      callStack: [],
      webAPIs: [
        { id: "t1", type: "setTimeout", label: "setTimeout()", callback: "console.log('Timer 1')", delay: "1000ms", status: "running" }
      ],
      microtaskQueue: [],
      callbackQueue: [{ id: "cb2", label: "Anonymous ()", callback: "console.log('Timer 2 (500ms)')", source: "setTimeout" }],
      eventLoop: { phase: "idle", message: "Call Stack is empty" }
    },
    {
      currentLine: null,
      explanation: "Event Loop moves Timer 2 callback to stack.",
      toastMessage: "Executing Timer 2",
      consoleOutput: ["Start", "End", "Timer 3 (0ms)"],
      callStack: [{ id: "cb2_ctx", name: "Anonymous ()", phase: "Execution Phase", variables: [], outerEnvironment: "Global" }],
      webAPIs: [
        { id: "t1", type: "setTimeout", label: "setTimeout()", callback: "console.log('Timer 1')", delay: "1000ms", status: "running" }
      ],
      microtaskQueue: [],
      callbackQueue: [],
      eventLoop: { phase: "stack_busy", message: "Call Stack is busy" }
    },
    {
      currentLine: 4,
      explanation: "Timer 2 callback executes.",
      toastMessage: "Timer 2 executed",
      consoleOutput: ["Start", "End", "Timer 3 (0ms)", "Timer 2 (500ms)"],
      callStack: [{ id: "cb2_ctx", name: "Anonymous ()", phase: "Execution Phase", variables: [], outerEnvironment: "Global" }],
      webAPIs: [
        { id: "t1", type: "setTimeout", label: "setTimeout()", callback: "console.log('Timer 1')", delay: "1000ms", status: "running" }
      ],
      microtaskQueue: [],
      callbackQueue: [],
      eventLoop: { phase: "stack_busy", message: "Call Stack is busy" }
    },
    {
      currentLine: null,
      explanation: "Another 500ms later... Timer 1 completes.",
      toastMessage: "Timer 1 finished",
      consoleOutput: ["Start", "End", "Timer 3 (0ms)", "Timer 2 (500ms)"],
      callStack: [],
      webAPIs: [],
      microtaskQueue: [],
      callbackQueue: [{ id: "cb1", label: "Anonymous ()", callback: "console.log('Timer 1 (1000ms)')", source: "setTimeout" }],
      eventLoop: { phase: "idle", message: "Call Stack is empty" }
    },
    {
      currentLine: null,
      explanation: "Event Loop moves Timer 1 callback to stack.",
      toastMessage: "Executing Timer 1",
      consoleOutput: ["Start", "End", "Timer 3 (0ms)", "Timer 2 (500ms)"],
      callStack: [{ id: "cb1_ctx", name: "Anonymous ()", phase: "Execution Phase", variables: [], outerEnvironment: "Global" }],
      webAPIs: [],
      microtaskQueue: [],
      callbackQueue: [],
      eventLoop: { phase: "stack_busy", message: "Call Stack is busy" }
    },
    {
      currentLine: 3,
      explanation: "Timer 1 callback executes.",
      toastMessage: "Timer 1 executed",
      consoleOutput: ["Start", "End", "Timer 3 (0ms)", "Timer 2 (500ms)", "Timer 1 (1000ms)"],
      callStack: [{ id: "cb1_ctx", name: "Anonymous ()", phase: "Execution Phase", variables: [], outerEnvironment: "Global" }],
      webAPIs: [],
      microtaskQueue: [],
      callbackQueue: [],
      eventLoop: { phase: "stack_busy", message: "Call Stack is busy" }
    },
    {
      currentLine: null,
      explanation: "Program is fully complete.",
      toastMessage: "Execution Complete",
      consoleOutput: ["Start", "End", "Timer 3 (0ms)", "Timer 2 (500ms)", "Timer 1 (1000ms)"],
      callStack: [],
      webAPIs: [],
      microtaskQueue: [],
      callbackQueue: [],
      eventLoop: { phase: "idle", message: "Program Complete" }
    }
  ]
};

export const EVENT_LOOP_SCENARIO_6: SimulationScenario = {
  id: "el-6",
  title: "6. The Full Orchestra",
  code: `console.log("1");

setTimeout(() => console.log("2"), 0);

Promise.resolve().then(() => {
  console.log("3");
  setTimeout(() => console.log("4"), 0);
});

Promise.resolve().then(() => console.log("5"));

console.log("6");`,
  steps: [
    {
      currentLine: null,
      explanation: "Engine initialized.",
      toastMessage: "Engine Initialized",
      consoleOutput: [],
      callStack: [],
      webAPIs: [],
      microtaskQueue: [],
      callbackQueue: [],
      eventLoop: { phase: "idle", message: "Event Loop is idle" }
    },
    {
      currentLine: null,
      explanation: "Global Execution Context is created.",
      toastMessage: "Global Creation Phase",
      consoleOutput: [],
      callStack: [{ id: "global", name: "Global Execution Context", phase: "Creation Phase", variables: [], outerEnvironment: null }],
      webAPIs: [],
      microtaskQueue: [],
      callbackQueue: [],
      eventLoop: { phase: "idle", message: "Event Loop is idle" }
    },
    {
      currentLine: 1,
      explanation: "Execution Phase. Line 1 executes.",
      toastMessage: "Line 1 executing...",
      consoleOutput: ["1"],
      callStack: [{ id: "global", name: "Global Execution Context", phase: "Execution Phase", variables: [], outerEnvironment: null }],
      webAPIs: [],
      microtaskQueue: [],
      callbackQueue: [],
      eventLoop: { phase: "stack_busy", message: "Call Stack is busy" }
    },
    {
      currentLine: 3,
      explanation: "setTimeout is called with 0ms delay. Handed off to Web APIs.",
      toastMessage: "Handed off to Browser",
      consoleOutput: ["1"],
      callStack: [{ id: "global", name: "Global Execution Context", phase: "Execution Phase", variables: [], outerEnvironment: null }],
      webAPIs: [{ id: "t1", type: "setTimeout", label: "setTimeout()", callback: "() => console.log('2')", delay: "0ms", status: "running" }],
      microtaskQueue: [],
      callbackQueue: [],
      eventLoop: { phase: "stack_busy", message: "Call Stack is busy" }
    },
    {
      currentLine: 3,
      explanation: "Timer completes instantly. Callback goes to the Callback Queue.",
      toastMessage: "Timer finished",
      consoleOutput: ["1"],
      callStack: [{ id: "global", name: "Global Execution Context", phase: "Execution Phase", variables: [], outerEnvironment: null }],
      webAPIs: [{ id: "t1", type: "setTimeout", label: "setTimeout()", callback: "() => console.log('2')", delay: "0ms", status: "complete" }],
      microtaskQueue: [],
      callbackQueue: [],
      eventLoop: { phase: "stack_busy", message: "Call Stack is busy" }
    },
    {
      currentLine: 5,
      explanation: "First Promise.resolve() queues a microtask.",
      toastMessage: "Microtask 1 queued",
      consoleOutput: ["1"],
      callStack: [{ id: "global", name: "Global Execution Context", phase: "Execution Phase", variables: [], outerEnvironment: null }],
      webAPIs: [],
      microtaskQueue: [{ id: "mt1", label: "Promise.then()", callback: "() => {\n  console.log('3');\n  setTimeout(() => console.log('4'), 0);\n}", source: "Promise 1" }],
      callbackQueue: [{ id: "cb1", label: "Anonymous ()", callback: "console.log('2')", source: "setTimeout 1" }],
      eventLoop: { phase: "stack_busy", message: "Call Stack is busy" }
    },
    {
      currentLine: 10,
      explanation: "Second Promise.resolve() queues another microtask.",
      toastMessage: "Microtask 2 queued",
      consoleOutput: ["1"],
      callStack: [{ id: "global", name: "Global Execution Context", phase: "Execution Phase", variables: [], outerEnvironment: null }],
      webAPIs: [],
      microtaskQueue: [
        { id: "mt1", label: "Promise.then()", callback: "() => {\n  console.log('3');\n  setTimeout(() => console.log('4'), 0);\n}", source: "Promise 1" },
        { id: "mt2", label: "Promise.then()", callback: "() => console.log('5')", source: "Promise 2" }
      ],
      callbackQueue: [{ id: "cb1", label: "Anonymous ()", callback: "console.log('2')", source: "setTimeout 1" }],
      eventLoop: { phase: "stack_busy", message: "Call Stack is busy" }
    },
    {
      currentLine: 12,
      explanation: "Line 12 executes synchronously.",
      toastMessage: "Line 12 executing...",
      consoleOutput: ["1", "6"],
      callStack: [{ id: "global", name: "Global Execution Context", phase: "Execution Phase", variables: [], outerEnvironment: null }],
      webAPIs: [],
      microtaskQueue: [
        { id: "mt1", label: "Promise.then()", callback: "() => {\n  console.log('3');\n  setTimeout(() => console.log('4'), 0);\n}", source: "Promise 1" },
        { id: "mt2", label: "Promise.then()", callback: "() => console.log('5')", source: "Promise 2" }
      ],
      callbackQueue: [{ id: "cb1", label: "Anonymous ()", callback: "console.log('2')", source: "setTimeout 1" }],
      eventLoop: { phase: "stack_busy", message: "Call Stack is busy" }
    },
    {
      currentLine: null,
      explanation: "Global Context pops off. Call Stack is empty.",
      toastMessage: "Global Context Popped",
      consoleOutput: ["1", "6"],
      callStack: [],
      webAPIs: [],
      microtaskQueue: [
        { id: "mt1", label: "Promise.then()", callback: "() => {\n  console.log('3');\n  setTimeout(() => console.log('4'), 0);\n}", source: "Promise 1" },
        { id: "mt2", label: "Promise.then()", callback: "() => console.log('5')", source: "Promise 2" }
      ],
      callbackQueue: [{ id: "cb1", label: "Anonymous ()", callback: "console.log('2')", source: "setTimeout 1" }],
      eventLoop: { phase: "idle", message: "Call Stack is empty" }
    },
    {
      currentLine: null,
      explanation: "Event Loop checks the Microtask Queue FIRST.",
      toastMessage: "Checking Microtasks",
      consoleOutput: ["1", "6"],
      callStack: [],
      webAPIs: [],
      microtaskQueue: [
        { id: "mt1", label: "Promise.then()", callback: "() => {\n  console.log('3');\n  setTimeout(() => console.log('4'), 0);\n}", source: "Promise 1" },
        { id: "mt2", label: "Promise.then()", callback: "() => console.log('5')", source: "Promise 2" }
      ],
      callbackQueue: [{ id: "cb1", label: "Anonymous ()", callback: "console.log('2')", source: "setTimeout 1" }],
      eventLoop: { phase: "checking_microtasks", message: "Found Microtask!" }
    },
    {
      currentLine: null,
      explanation: "Moving first microtask to Call Stack.",
      toastMessage: "Moving Microtask 1",
      consoleOutput: ["1", "6"],
      callStack: [],
      webAPIs: [],
      microtaskQueue: [
        { id: "mt2", label: "Promise.then()", callback: "() => console.log('5')", source: "Promise 2" }
      ],
      callbackQueue: [{ id: "cb1", label: "Anonymous ()", callback: "console.log('2')", source: "setTimeout 1" }],
      eventLoop: { phase: "moving_callback", message: "Moving Microtask 1 to Stack" }
    },
    {
      currentLine: 6,
      explanation: "First microtask executes. It logs '3'.",
      toastMessage: "Executing Microtask 1",
      consoleOutput: ["1", "6", "3"],
      callStack: [{ id: "mt1_ctx", name: "Anonymous ()", phase: "Execution Phase", variables: [], outerEnvironment: "Global" }],
      webAPIs: [],
      microtaskQueue: [
        { id: "mt2", label: "Promise.then()", callback: "() => console.log('5')", source: "Promise 2" }
      ],
      callbackQueue: [{ id: "cb1", label: "Anonymous ()", callback: "console.log('2')", source: "setTimeout 1" }],
      eventLoop: { phase: "stack_busy", message: "Call Stack is busy" }
    },
    {
      currentLine: 7,
      explanation: "First microtask also calls setTimeout. Handed off to Web APIs.",
      toastMessage: "Nested setTimeout started",
      consoleOutput: ["1", "6", "3"],
      callStack: [{ id: "mt1_ctx", name: "Anonymous ()", phase: "Execution Phase", variables: [], outerEnvironment: "Global" }],
      webAPIs: [{ id: "t2", type: "setTimeout", label: "setTimeout()", callback: "() => console.log('4')", delay: "0ms", status: "running" }],
      microtaskQueue: [
        { id: "mt2", label: "Promise.then()", callback: "() => console.log('5')", source: "Promise 2" }
      ],
      callbackQueue: [{ id: "cb1", label: "Anonymous ()", callback: "console.log('2')", source: "setTimeout 1" }],
      eventLoop: { phase: "stack_busy", message: "Call Stack is busy" }
    },
    {
      currentLine: 7,
      explanation: "The nested timer finishes instantly and queues a second macrotask.",
      toastMessage: "Nested Timer finished",
      consoleOutput: ["1", "6", "3"],
      callStack: [{ id: "mt1_ctx", name: "Anonymous ()", phase: "Execution Phase", variables: [], outerEnvironment: "Global" }],
      webAPIs: [{ id: "t2", type: "setTimeout", label: "setTimeout()", callback: "() => console.log('4')", delay: "0ms", status: "complete" }],
      microtaskQueue: [
        { id: "mt2", label: "Promise.then()", callback: "() => console.log('5')", source: "Promise 2" }
      ],
      callbackQueue: [{ id: "cb1", label: "Anonymous ()", callback: "console.log('2')", source: "setTimeout 1" }],
      eventLoop: { phase: "stack_busy", message: "Call Stack is busy" }
    },
    {
      currentLine: null,
      explanation: "First microtask completes and pops off the stack.",
      toastMessage: "Microtask 1 complete",
      consoleOutput: ["1", "6", "3"],
      callStack: [],
      webAPIs: [],
      microtaskQueue: [
        { id: "mt2", label: "Promise.then()", callback: "() => console.log('5')", source: "Promise 2" }
      ],
      callbackQueue: [
        { id: "cb1", label: "Anonymous ()", callback: "console.log('2')", source: "setTimeout 1" },
        { id: "cb2", label: "Anonymous ()", callback: "console.log('4')", source: "setTimeout 2" }
      ],
      eventLoop: { phase: "idle", message: "Call Stack is empty" }
    },
    {
      currentLine: null,
      explanation: "Event Loop checks the Microtask Queue AGAIN. It must drain completely.",
      toastMessage: "Draining Microtasks",
      consoleOutput: ["1", "6", "3"],
      callStack: [],
      webAPIs: [],
      microtaskQueue: [
        { id: "mt2", label: "Promise.then()", callback: "() => console.log('5')", source: "Promise 2" }
      ],
      callbackQueue: [
        { id: "cb1", label: "Anonymous ()", callback: "console.log('2')", source: "setTimeout 1" },
        { id: "cb2", label: "Anonymous ()", callback: "console.log('4')", source: "setTimeout 2" }
      ],
      eventLoop: { phase: "draining_microtask", message: "Draining Microtasks..." }
    },
    {
      currentLine: 10,
      explanation: "Second microtask executes. It logs '5'.",
      toastMessage: "Executing Microtask 2",
      consoleOutput: ["1", "6", "3", "5"],
      callStack: [{ id: "mt2_ctx", name: "Anonymous ()", phase: "Execution Phase", variables: [], outerEnvironment: "Global" }],
      webAPIs: [],
      microtaskQueue: [],
      callbackQueue: [
        { id: "cb1", label: "Anonymous ()", callback: "console.log('2')", source: "setTimeout 1" },
        { id: "cb2", label: "Anonymous ()", callback: "console.log('4')", source: "setTimeout 2" }
      ],
      eventLoop: { phase: "stack_busy", message: "Call Stack is busy" }
    },
    {
      currentLine: null,
      explanation: "Second microtask completes. Microtask queue is now empty.",
      toastMessage: "Microtask 2 complete",
      consoleOutput: ["1", "6", "3", "5"],
      callStack: [],
      webAPIs: [],
      microtaskQueue: [],
      callbackQueue: [
        { id: "cb1", label: "Anonymous ()", callback: "console.log('2')", source: "setTimeout 1" },
        { id: "cb2", label: "Anonymous ()", callback: "console.log('4')", source: "setTimeout 2" }
      ],
      eventLoop: { phase: "idle", message: "Call Stack is empty" }
    },
    {
      currentLine: null,
      explanation: "Event Loop checks Microtasks (empty), then checks Callback Queue.",
      toastMessage: "Checking Callbacks",
      consoleOutput: ["1", "6", "3", "5"],
      callStack: [],
      webAPIs: [],
      microtaskQueue: [],
      callbackQueue: [
        { id: "cb1", label: "Anonymous ()", callback: "console.log('2')", source: "setTimeout 1" },
        { id: "cb2", label: "Anonymous ()", callback: "console.log('4')", source: "setTimeout 2" }
      ],
      eventLoop: { phase: "checking_callbacks", message: "Checking Callback Queue..." }
    },
    {
      currentLine: null,
      explanation: "First macrotask callback is moved to Call Stack.",
      toastMessage: "Moving Macrotask 1",
      consoleOutput: ["1", "6", "3", "5"],
      callStack: [],
      webAPIs: [],
      microtaskQueue: [],
      callbackQueue: [
        { id: "cb2", label: "Anonymous ()", callback: "console.log('4')", source: "setTimeout 2" }
      ],
      eventLoop: { phase: "moving_callback", message: "Moving callback to Stack" }
    },
    {
      currentLine: 3,
      explanation: "First macrotask executes, logging '2'.",
      toastMessage: "Executing Macrotask 1",
      consoleOutput: ["1", "6", "3", "5", "2"],
      callStack: [{ id: "cb1_ctx", name: "Anonymous ()", phase: "Execution Phase", variables: [], outerEnvironment: "Global" }],
      webAPIs: [],
      microtaskQueue: [],
      callbackQueue: [
        { id: "cb2", label: "Anonymous ()", callback: "console.log('4')", source: "setTimeout 2" }
      ],
      eventLoop: { phase: "stack_busy", message: "Call Stack is busy" }
    },
    {
      currentLine: null,
      explanation: "First macrotask completes and pops off the stack.",
      toastMessage: "Macrotask 1 complete",
      consoleOutput: ["1", "6", "3", "5", "2"],
      callStack: [],
      webAPIs: [],
      microtaskQueue: [],
      callbackQueue: [
        { id: "cb2", label: "Anonymous ()", callback: "console.log('4')", source: "setTimeout 2" }
      ],
      eventLoop: { phase: "idle", message: "Call Stack is empty" }
    },
    {
      currentLine: null,
      explanation: "Event Loop checks queues again and finds the second macrotask.",
      toastMessage: "Checking Callbacks",
      consoleOutput: ["1", "6", "3", "5", "2"],
      callStack: [],
      webAPIs: [],
      microtaskQueue: [],
      callbackQueue: [
        { id: "cb2", label: "Anonymous ()", callback: "console.log('4')", source: "setTimeout 2" }
      ],
      eventLoop: { phase: "checking_callbacks", message: "Checking Callback Queue..." }
    },
    {
      currentLine: 8,
      explanation: "Second macrotask executes, logging '4'.",
      toastMessage: "Executing Macrotask 2",
      consoleOutput: ["1", "6", "3", "5", "2", "4"],
      callStack: [{ id: "cb2_ctx", name: "Anonymous ()", phase: "Execution Phase", variables: [], outerEnvironment: "Global" }],
      webAPIs: [],
      microtaskQueue: [],
      callbackQueue: [],
      eventLoop: { phase: "stack_busy", message: "Call Stack is busy" }
    },
    {
      currentLine: null,
      explanation: "Program is fully complete.",
      toastMessage: "Execution Complete",
      consoleOutput: ["1", "6", "3", "5", "2", "4"],
      callStack: [],
      webAPIs: [],
      microtaskQueue: [],
      callbackQueue: [],
      eventLoop: { phase: "idle", message: "Program Complete" }
    }
  ]
};

export const ALL_EVENT_LOOP_SCENARIOS = [
  EVENT_LOOP_SCENARIO_1,
  EVENT_LOOP_SCENARIO_2,
  EVENT_LOOP_SCENARIO_3,
  EVENT_LOOP_SCENARIO_4,
  EVENT_LOOP_SCENARIO_5,
  EVENT_LOOP_SCENARIO_6
];
