import { BackendSimulationScenario } from "./engine";

const codeSnippet = `const fs = require('fs');

fs.readFile("a.txt", () => {
    console.log("A");

    Promise.resolve().then(() => {
        console.log("B");
    });

    console.log("C");
});

Promise.resolve().then(() => console.log("promise"));
process.nextTick(() => console.log("tick"));
setTimeout(() => console.log("timer"), 0);`;

// Helper to create empty phase queues
const emptyPhases = () => [
  { name: "timers" as const, isActive: false, queue: [] },
  { name: "pending" as const, isActive: false, queue: [] },
  { name: "poll" as const, isActive: false, queue: [] },
  { name: "check" as const, isActive: false, queue: [] },
  { name: "close" as const, isActive: false, queue: [] }
];

export const BE_SCENARIO_3: BackendSimulationScenario = {
  id: "event-loop-phases",
  title: "The Event Loop & Phases",
  description: "There is no single 'Macrotask Queue'. Node has 5 phases, plus microtasks, plus nextTick. Let's trace it exactly.",
  layoutMode: "node-runtime-dashboard",
  steps: [
    {
      id: "step-1",
      explanation: "We have a script combining `fs.readFile`, Promises, `process.nextTick`, and `setTimeout`. Let's execute the synchronous part top-to-bottom first.",
      toastMessage: "Starting execution",
      code: codeSnippet,
      activeLine: null,
      callStack: [],
      threadPool: [
        { id: 1, status: "idle" }, { id: 2, status: "idle" }, { id: 3, status: "idle" }, { id: 4, status: "idle" }
      ],
      eventLoopPhases: emptyPhases(),
      nextTickQueue: [],
      microtaskQueue: [],
      activePhase: "idle",
      consoleOutput: []
    },
    {
      id: "step-2",
      explanation: "`fs.readFile` is called. It hands the file read off to libuv's Thread Pool and registers the callback. The main thread continues immediately.",
      toastMessage: "File read handed to Thread 2",
      code: codeSnippet,
      activeLine: 3,
      callStack: [{ id: "main", label: "Global Execution" }],
      threadPool: [
        { id: 1, status: "idle" }, 
        { id: 2, status: "working", task: "Reading a.txt" }, 
        { id: 3, status: "idle" }, { id: 4, status: "idle" }
      ],
      eventLoopPhases: emptyPhases(),
      nextTickQueue: [],
      microtaskQueue: [],
      activePhase: "idle",
      consoleOutput: []
    },
    {
      id: "step-3",
      explanation: "Next, we hit `Promise.resolve().then(...)`. Promise callbacks are **Microtasks**. They go into the Microtask queue, not the event loop phases.",
      toastMessage: "Promise queued",
      code: codeSnippet,
      activeLine: 13,
      callStack: [{ id: "main", label: "Global Execution" }],
      threadPool: [
        { id: 1, status: "idle" }, { id: 2, status: "working", task: "Reading a.txt" }, { id: 3, status: "idle" }, { id: 4, status: "idle" }
      ],
      eventLoopPhases: emptyPhases(),
      nextTickQueue: [],
      microtaskQueue: [ { id: "p1", label: "() => log('promise')", type: "microtask", isProcessed: false } ],
      activePhase: "idle",
      consoleOutput: []
    },
    {
      id: "step-4",
      explanation: "Next, `process.nextTick(...)`. This has its own queue that has the absolute highest priority in Node, above both microtasks and the event loop.",
      toastMessage: "nextTick queued",
      code: codeSnippet,
      activeLine: 14,
      callStack: [{ id: "main", label: "Global Execution" }],
      threadPool: [
        { id: 1, status: "idle" }, { id: 2, status: "working", task: "Reading a.txt" }, { id: 3, status: "idle" }, { id: 4, status: "idle" }
      ],
      eventLoopPhases: emptyPhases(),
      nextTickQueue: [ { id: "nt1", label: "() => log('tick')", type: "nextTick", isProcessed: false } ],
      microtaskQueue: [ { id: "p1", label: "() => log('promise')", type: "microtask", isProcessed: false } ],
      activePhase: "idle",
      consoleOutput: []
    },
    {
      id: "step-5",
      explanation: "Finally, `setTimeout(..., 0)`. Timers are handled by the Event Loop, so this callback goes into the **Timers Phase** queue.",
      toastMessage: "Timer queued",
      code: codeSnippet,
      activeLine: 15,
      callStack: [{ id: "main", label: "Global Execution" }],
      threadPool: [
        { id: 1, status: "idle" }, { id: 2, status: "working", task: "Reading a.txt" }, { id: 3, status: "idle" }, { id: 4, status: "idle" }
      ],
      eventLoopPhases: [
        { name: "timers", isActive: false, queue: [{ id: "t1", label: "() => log('timer')", isProcessed: false }] },
        { name: "pending", isActive: false, queue: [] },
        { name: "poll", isActive: false, queue: [] },
        { name: "check", isActive: false, queue: [] },
        { name: "close", isActive: false, queue: [] }
      ],
      nextTickQueue: [ { id: "nt1", label: "() => log('tick')", type: "nextTick", isProcessed: false } ],
      microtaskQueue: [ { id: "p1", label: "() => log('promise')", type: "microtask", isProcessed: false } ],
      activePhase: "idle",
      consoleOutput: []
    },
    {
      id: "step-6",
      explanation: "The synchronous script is done! The Call Stack empties. Before the Event Loop can start its phases, Node MUST drain the priority queues first.",
      toastMessage: "Call Stack empty",
      code: codeSnippet,
      activeLine: null,
      callStack: [],
      threadPool: [
        { id: 1, status: "idle" }, { id: 2, status: "working", task: "Reading a.txt" }, { id: 3, status: "idle" }, { id: 4, status: "idle" }
      ],
      eventLoopPhases: [
        { name: "timers", isActive: false, queue: [{ id: "t1", label: "() => log('timer')", isProcessed: false }] },
        { name: "pending", isActive: false, queue: [] },
        { name: "poll", isActive: false, queue: [] },
        { name: "check", isActive: false, queue: [] },
        { name: "close", isActive: false, queue: [] }
      ],
      nextTickQueue: [ { id: "nt1", label: "() => log('tick')", type: "nextTick", isProcessed: false } ],
      microtaskQueue: [ { id: "p1", label: "() => log('promise')", type: "microtask", isProcessed: false } ],
      activePhase: "nextTick",
      consoleOutput: []
    },
    {
      id: "step-7",
      explanation: "`process.nextTick` has highest priority. Its queue drains first, executing the callback. Output: `tick`.",
      toastMessage: "nextTick executes",
      code: codeSnippet,
      activeLine: 14,
      callStack: [{ id: "nt_cb", label: "nextTick cb" }],
      threadPool: [
        { id: 1, status: "idle" }, { id: 2, status: "working", task: "Reading a.txt" }, { id: 3, status: "idle" }, { id: 4, status: "idle" }
      ],
      eventLoopPhases: [
        { name: "timers", isActive: false, queue: [{ id: "t1", label: "() => log('timer')", isProcessed: false }] },
        { name: "pending", isActive: false, queue: [] },
        { name: "poll", isActive: false, queue: [] },
        { name: "check", isActive: false, queue: [] },
        { name: "close", isActive: false, queue: [] }
      ],
      nextTickQueue: [ { id: "nt1", label: "() => log('tick')", type: "nextTick", isProcessed: true } ],
      microtaskQueue: [ { id: "p1", label: "() => log('promise')", type: "microtask", isProcessed: false } ],
      activePhase: "nextTick",
      consoleOutput: ["tick"]
    },
    {
      id: "step-8",
      explanation: "NextTick queue is empty. Next up is the Microtask queue. The Promise callback executes. Output: `promise`.",
      toastMessage: "Microtask executes",
      code: codeSnippet,
      activeLine: 13,
      callStack: [{ id: "micro_cb", label: "Promise cb" }],
      threadPool: [
        { id: 1, status: "idle" }, { id: 2, status: "working", task: "Reading a.txt" }, { id: 3, status: "idle" }, { id: 4, status: "idle" }
      ],
      eventLoopPhases: [
        { name: "timers", isActive: false, queue: [{ id: "t1", label: "() => log('timer')", isProcessed: false }] },
        { name: "pending", isActive: false, queue: [] },
        { name: "poll", isActive: false, queue: [] },
        { name: "check", isActive: false, queue: [] },
        { name: "close", isActive: false, queue: [] }
      ],
      nextTickQueue: [],
      microtaskQueue: [ { id: "p1", label: "() => log('promise')", type: "microtask", isProcessed: true } ],
      activePhase: "microtasks",
      consoleOutput: ["tick", "promise"]
    },
    {
      id: "step-9",
      explanation: "With both priority queues empty, the Event Loop begins its cycle. It starts at the **Timers phase**. It sees our `setTimeout` and executes it. Output: `timer`.",
      toastMessage: "Timers phase active",
      code: codeSnippet,
      activeLine: 15,
      callStack: [{ id: "timer_cb", label: "setTimeout cb" }],
      threadPool: [
        { id: 1, status: "idle" }, { id: 2, status: "working", task: "Reading a.txt" }, { id: 3, status: "idle" }, { id: 4, status: "idle" }
      ],
      eventLoopPhases: [
        { name: "timers", isActive: true, queue: [{ id: "t1", label: "() => log('timer')", isProcessed: true }] },
        { name: "pending", isActive: false, queue: [] },
        { name: "poll", isActive: false, queue: [] },
        { name: "check", isActive: false, queue: [] },
        { name: "close", isActive: false, queue: [] }
      ],
      nextTickQueue: [],
      microtaskQueue: [],
      activePhase: "timers",
      consoleOutput: ["tick", "promise", "timer"]
    },
    {
      id: "step-10",
      explanation: "The event loop cycles through pending callbacks, then reaches the **Poll phase**. At this exact moment, Thread 2 finishes reading the file! It puts the callback in the Poll queue.",
      toastMessage: "Thread 2 complete!",
      code: codeSnippet,
      activeLine: 3,
      callStack: [],
      threadPool: [
        { id: 1, status: "idle" }, { id: 2, status: "idle" }, { id: 3, status: "idle" }, { id: 4, status: "idle" }
      ],
      eventLoopPhases: [
        { name: "timers", isActive: false, queue: [] },
        { name: "pending", isActive: false, queue: [] },
        { name: "poll", isActive: true, queue: [{ id: "poll1", label: "readFile cb", isProcessed: false }] },
        { name: "check", isActive: false, queue: [] },
        { name: "close", isActive: false, queue: [] }
      ],
      nextTickQueue: [],
      microtaskQueue: [],
      activePhase: "poll",
      consoleOutput: ["tick", "promise", "timer"]
    },
    {
      id: "step-11",
      explanation: "The Poll phase sees the callback and pushes it to the Call Stack. Output: `A`.",
      toastMessage: "Poll phase executing",
      code: codeSnippet,
      activeLine: 4,
      callStack: [{ id: "poll_cb", label: "readFile cb" }],
      threadPool: [
        { id: 1, status: "idle" }, { id: 2, status: "idle" }, { id: 3, status: "idle" }, { id: 4, status: "idle" }
      ],
      eventLoopPhases: [
        { name: "timers", isActive: false, queue: [] },
        { name: "pending", isActive: false, queue: [] },
        { name: "poll", isActive: true, queue: [{ id: "poll1", label: "readFile cb", isProcessed: true }] },
        { name: "check", isActive: false, queue: [] },
        { name: "close", isActive: false, queue: [] }
      ],
      nextTickQueue: [],
      microtaskQueue: [],
      activePhase: "poll",
      consoleOutput: ["tick", "promise", "timer", "A"]
    },
    {
      id: "step-12",
      explanation: "Inside the callback, we create a new Promise! This goes straight to the Microtask queue. Then we output `C`. The callback finishes.",
      toastMessage: "Microtask queued",
      code: codeSnippet,
      activeLine: 10,
      callStack: [{ id: "poll_cb", label: "readFile cb" }],
      threadPool: [
        { id: 1, status: "idle" }, { id: 2, status: "idle" }, { id: 3, status: "idle" }, { id: 4, status: "idle" }
      ],
      eventLoopPhases: [
        { name: "timers", isActive: false, queue: [] },
        { name: "pending", isActive: false, queue: [] },
        { name: "poll", isActive: true, queue: [{ id: "poll1", label: "readFile cb", isProcessed: true }] },
        { name: "check", isActive: false, queue: [] },
        { name: "close", isActive: false, queue: [] }
      ],
      nextTickQueue: [],
      microtaskQueue: [{ id: "p2", label: "() => log('B')", type: "microtask", isProcessed: false }],
      activePhase: "poll",
      consoleOutput: ["tick", "promise", "timer", "A", "C"]
    },
    {
      id: "step-13",
      explanation: "Crucial rule: **Microtasks run IMMEDIATELY after the current callback finishes**, before the event loop is allowed to move to the Check phase. Output: `B`.",
      toastMessage: "Microtask interrupts event loop!",
      code: codeSnippet,
      activeLine: 7,
      callStack: [{ id: "micro_cb2", label: "Promise cb" }],
      threadPool: [
        { id: 1, status: "idle" }, { id: 2, status: "idle" }, { id: 3, status: "idle" }, { id: 4, status: "idle" }
      ],
      eventLoopPhases: [
        { name: "timers", isActive: false, queue: [] },
        { name: "pending", isActive: false, queue: [] },
        { name: "poll", isActive: true, queue: [] },
        { name: "check", isActive: false, queue: [] },
        { name: "close", isActive: false, queue: [] }
      ],
      nextTickQueue: [],
      microtaskQueue: [{ id: "p2", label: "() => log('B')", type: "microtask", isProcessed: true }],
      activePhase: "microtasks",
      consoleOutput: ["tick", "promise", "timer", "A", "C", "B"]
    },
    {
      id: "step-14",
      explanation: "Done! The final output is `tick`, `promise`, `timer`, `A`, `C`, `B`. The event loop continues cycling forever, waiting for new I/O in the Poll phase.",
      toastMessage: "Simulation Complete",
      code: codeSnippet,
      activeLine: null,
      callStack: [],
      threadPool: [
        { id: 1, status: "idle" }, { id: 2, status: "idle" }, { id: 3, status: "idle" }, { id: 4, status: "idle" }
      ],
      eventLoopPhases: [
        { name: "timers", isActive: false, queue: [] },
        { name: "pending", isActive: false, queue: [] },
        { name: "poll", isActive: false, queue: [] },
        { name: "check", isActive: false, queue: [] },
        { name: "close", isActive: false, queue: [] }
      ],
      nextTickQueue: [],
      microtaskQueue: [],
      activePhase: "idle",
      consoleOutput: ["tick", "promise", "timer", "A", "C", "B"],
      notes: [
        {
          title: "Priority Hierarchy",
          content: "1. **process.nextTick()** (Highest)\n2. **Promise microtasks**\n3. **Event Loop Phases** (Timers, Poll, Check...)"
        }
      ]
    }
  ]
};
