import { BackendSimulationScenario } from "./engine";

const codeSnippet = `const fs = require('fs');

console.log("1: Starting");

fs.readFile('bigfile.txt', 'utf8', (err, data) => {
  console.log("3: File read complete");
});

console.log("2: This runs immediately");`;

export const BE_SCENARIO_2: BackendSimulationScenario = {
  id: "blocking-vs-non-blocking",
  title: "Blocking vs Non-Blocking I/O",
  description: "Why does Node's single thread not grind to a halt when reading a large file? Let's compare a Blocking server against Node's Non-Blocking architecture.",
  layoutMode: "io-timeline",
  steps: [
    {
      id: "step-1",
      explanation: "Node.js is famous for being non-blocking. But to understand why that's awesome, we first need to see what would happen if it wasn't. Let's pretend Node acted like a traditional blocking server...",
      toastMessage: "Simulating concurrent requests...",
      code: codeSnippet,
      activeLine: null,
      timelineMode: "blocking",
      timelineRequests: [],
      threadStatus: "free",
      consoleOutput: []
    },
    {
      id: "step-2",
      explanation: "In this hypothetical blocking mode, the main thread starts Request A and hits the file read command.",
      toastMessage: "Request A arrives",
      code: codeSnippet,
      activeLine: 3,
      timelineMode: "blocking",
      timelineRequests: [
        { id: "A", label: "Request A", startPct: 0, widthPct: 5, status: "processing", isBlocking: true }
      ],
      threadStatus: "working",
      consoleOutput: ["1: Starting"]
    },
    {
      id: "step-3",
      explanation: "Because disk I/O is slow, the thread **stops everything and waits**. It is completely frozen until the disk returns the file.",
      toastMessage: "Thread FROZEN",
      code: codeSnippet,
      activeLine: 5,
      timelineMode: "blocking",
      timelineRequests: [
        { id: "A", label: "Request A", startPct: 0, widthPct: 35, status: "frozen", isBlocking: true }
      ],
      threadStatus: "frozen",
      consoleOutput: ["1: Starting"]
    },
    {
      id: "step-4",
      explanation: "While the thread is frozen, **Request B arrives**. But the thread is busy doing nothing! Request B has to sit and wait in a queue.",
      toastMessage: "Request B is waiting...",
      code: codeSnippet,
      activeLine: 5,
      timelineMode: "blocking",
      timelineRequests: [
        { id: "A", label: "Request A", startPct: 0, widthPct: 60, status: "frozen", isBlocking: true },
        { id: "B", label: "Request B", startPct: 35, widthPct: 25, status: "waiting" }
      ],
      threadStatus: "frozen",
      consoleOutput: ["1: Starting"]
    },
    {
      id: "step-5",
      explanation: "Now let's look at Node's REAL Non-Blocking approach. Node starts Request A and prints '1: Starting'.",
      toastMessage: "Switching to Non-Blocking",
      code: codeSnippet,
      activeLine: 3,
      timelineMode: "nonblocking",
      timelineRequests: [
        { id: "A", label: "Request A", startPct: 0, widthPct: 10, status: "processing", isBlocking: false }
      ],
      threadStatus: "working",
      consoleOutput: ["1: Starting"],
      threadPool: [
        { id: 1, status: "idle", task: "" },
        { id: 2, status: "idle", task: "" },
        { id: 3, status: "idle", task: "" },
        { id: 4, status: "idle", task: "" }
      ]
    },
    {
      id: "step-5-half",
      explanation: "The Main Thread hits the slow file read command. Instead of freezing, it packages this task up and passes it to libuv in the background. The Main Thread is now completely free.",
      toastMessage: "Task passed to libuv",
      code: codeSnippet,
      activeLine: 5,
      timelineMode: "nonblocking",
      timelineRequests: [
        { id: "A", label: "Request A", startPct: 0, widthPct: 10, status: "complete", isBlocking: false },
        { id: "pool_A", label: "Reading File", startPct: 10, widthPct: 50, status: "processing" }
      ],
      threadStatus: "free",
      consoleOutput: ["1: Starting"],
      threadPool: [
        { id: 1, status: "working", task: "fs.readFile('bigfile.txt')" },
        { id: 2, status: "idle", task: "" },
        { id: 3, status: "idle", task: "" },
        { id: 4, status: "idle", task: "" }
      ]
    },
    {
      id: "step-6",
      explanation: "Because the task was offloaded, the Main Thread immediately moves to the next line without wasting a single millisecond. It prints '2: This runs immediately'.",
      toastMessage: "Main thread moves on",
      code: codeSnippet,
      activeLine: 9,
      timelineMode: "nonblocking",
      timelineRequests: [
        { id: "A", label: "Request A", startPct: 0, widthPct: 15, status: "complete", isBlocking: false },
        { id: "pool_A", label: "Reading File", startPct: 10, widthPct: 50, status: "processing" }
      ],
      threadStatus: "working",
      consoleOutput: ["1: Starting", "2: This runs immediately"],
      threadPool: [
        { id: 1, status: "working", task: "fs.readFile('bigfile.txt')" },
        { id: 2, status: "idle", task: "" },
        { id: 3, status: "idle", task: "" },
        { id: 4, status: "idle", task: "" }
      ]
    },
    {
      id: "step-7",
      explanation: "When **Request B arrives**, the main thread handles it instantly! Nobody is blocked.",
      toastMessage: "Request B handled instantly",
      code: codeSnippet,
      activeLine: 9,
      timelineMode: "nonblocking",
      timelineRequests: [
        { id: "A", label: "Request A", startPct: 0, widthPct: 15, status: "complete", isBlocking: false },
        { id: "B", label: "Request B", startPct: 25, widthPct: 15, status: "complete" },
        { id: "pool_A", label: "Reading File", startPct: 10, widthPct: 50, status: "processing" }
      ],
      threadStatus: "working",
      consoleOutput: ["1: Starting", "2: This runs immediately"],
      threadPool: [
        { id: 1, status: "working", task: "fs.readFile('bigfile.txt')" },
        { id: 2, status: "idle", task: "" },
        { id: 3, status: "idle", task: "" },
        { id: 4, status: "idle", task: "" }
      ]
    },
    {
      id: "step-8",
      explanation: "Later, the background thread finishes reading the file. It alerts the Event Loop, which pushes the callback onto the Call Stack.",
      toastMessage: "File read finished in background",
      code: codeSnippet,
      activeLine: 6,
      timelineMode: "nonblocking",
      timelineRequests: [
        { id: "A", label: "Request A", startPct: 0, widthPct: 15, status: "complete", isBlocking: false },
        { id: "B", label: "Request B", startPct: 25, widthPct: 15, status: "complete" },
        { id: "pool_A", label: "Reading File", startPct: 10, widthPct: 50, status: "complete" },
        { id: "A_cb", label: "Req A Callback", startPct: 60, widthPct: 15, status: "processing" }
      ],
      threadStatus: "working",
      consoleOutput: ["1: Starting", "2: This runs immediately", "3: File read complete"],
      threadPool: [
        { id: 1, status: "idle", task: "" },
        { id: 2, status: "idle", task: "" },
        { id: 3, status: "idle", task: "" },
        { id: 4, status: "idle", task: "" }
      ]
    },
    {
      id: "step-9",
      explanation: "This is why Node can handle 10,000 connections with a single thread. The main thread never idles; it delegates I/O and only comes back to finish the job later.",
      toastMessage: "Simulation Complete",
      code: codeSnippet,
      activeLine: null,
      timelineMode: "nonblocking",
      timelineRequests: [
        { id: "A", label: "Request A", startPct: 0, widthPct: 15, status: "complete", isBlocking: false },
        { id: "B", label: "Request B", startPct: 25, widthPct: 15, status: "complete" },
        { id: "pool_A", label: "Reading File", startPct: 10, widthPct: 50, status: "complete" },
        { id: "A_cb", label: "Req A Callback", startPct: 60, widthPct: 15, status: "complete" }
      ],
      threadStatus: "free",
      consoleOutput: ["1: Starting", "2: This runs immediately", "3: File read complete"],
      threadPool: [
        { id: 1, status: "idle", task: "" },
        { id: 2, status: "idle", task: "" },
        { id: 3, status: "idle", task: "" },
        { id: 4, status: "idle", task: "" }
      ]
    }
  ]
};
