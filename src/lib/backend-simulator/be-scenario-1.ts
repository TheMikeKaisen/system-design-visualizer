import { BackendSimulationScenario } from "./engine";

const codeSnippet = `// Program sitting inert on disk
// Run this via terminal:
// > node server.js

console.log("Starting server...");
// V8 parses & compiles JS
// libuv prepares async I/O
`;

export const BE_SCENARIO_1: BackendSimulationScenario = {
  id: "node-architecture",
  title: "Node.js Internals",
  description: "What actually happens when you type 'node server.js'? Let's build the runtime from scratch.",
  layoutMode: "process-architecture",
  steps: [
    {
      id: "step-1",
      explanation: "A **Program** is just a file sitting on disk. Right now, `server.js` is inert. It's just bytes on a hard drive.",
      toastMessage: "Program is inert",
      glossaryTerm: "Program",
      code: codeSnippet,
      activeLine: 1,
      processArchitecture: {
        showProcess: false,
        showMainThread: false,
        showThreadPool: false,
        showV8: false,
        showLibuv: false
      }
    },
    {
      id: "step-2",
      explanation: "When you run `node server.js`, the Operating System creates a **Process**. This is a live, running instance with its own isolated memory space.",
      toastMessage: "OS creates a Process",
      glossaryTerm: "Process",
      code: codeSnippet,
      activeLine: 3,
      processArchitecture: {
        showProcess: true,
        showMainThread: false,
        showThreadPool: false,
        showV8: false,
        showLibuv: false,
        activeComponentId: "process"
      }
    },
    {
      id: "step-3",
      explanation: "Inside the process, Node starts exactly **one thread** to execute your JavaScript. This is the **Main Thread**, and it has a single Call Stack.",
      toastMessage: "Main Thread initialized",
      glossaryTerm: "Thread",
      code: codeSnippet,
      activeLine: 5,
      processArchitecture: {
        showProcess: true,
        showMainThread: true,
        showThreadPool: false,
        showV8: false,
        showLibuv: false,
        activeComponentId: "main-thread"
      }
    },
    {
      id: "step-4",
      explanation: "But wait! Node *also* spins up a **Thread Pool** inside that same process. By default, it creates 4 background threads, waiting for heavy tasks.",
      toastMessage: "libuv Thread Pool created",
      glossaryTerm: "Thread Pool",
      code: codeSnippet,
      activeLine: 5,
      processArchitecture: {
        showProcess: true,
        showMainThread: true,
        showThreadPool: true,
        howManyThreads: 1,
        showV8: false,
        showLibuv: false,
        activeComponentId: "thread-pool"
      }
    },
    {
      id: "step-5",
      explanation: "These threads share the same memory space as the main thread (they live in the same process 'house'), allowing Node to do multi-threaded work under the hood.",
      toastMessage: "Threads 2,3,4 online",
      glossaryTerm: "Thread Pool",
      code: codeSnippet,
      activeLine: 5,
      processArchitecture: {
        showProcess: true,
        showMainThread: true,
        showThreadPool: true,
        howManyThreads: 4,
        showV8: false,
        showLibuv: false,
        activeComponentId: "thread-pool"
      }
    },
    {
      id: "step-6",
      explanation: "What actually runs your JS? The **V8 Engine** (written in C++ by Google). V8 is embedded inside the process, parsing and executing JS on the Main Thread.",
      toastMessage: "V8 Engine loaded",
      glossaryTerm: "Engine",
      code: codeSnippet,
      activeLine: 6,
      processArchitecture: {
        showProcess: true,
        showMainThread: true,
        showThreadPool: true,
        howManyThreads: 4,
        showV8: true,
        showLibuv: false,
        activeComponentId: "v8"
      }
    },
    {
      id: "step-7",
      explanation: "V8 knows nothing about files or networks. For that, Node embeds **libuv**, a C++ library that handles async I/O, the Event Loop, and manages that Thread Pool.",
      toastMessage: "libuv loaded",
      glossaryTerm: "libuv",
      code: codeSnippet,
      activeLine: 7,
      processArchitecture: {
        showProcess: true,
        showMainThread: true,
        showThreadPool: true,
        howManyThreads: 4,
        showV8: true,
        showLibuv: true,
        activeComponentId: "libuv"
      }
    },
    {
      id: "step-8",
      explanation: "Together, V8 + libuv + Node APIs make up the **Node.js Runtime**. Your JS is single-threaded, but the process itself is highly multi-threaded.",
      toastMessage: "Runtime ready!",
      glossaryTerm: "Runtime",
      code: codeSnippet,
      activeLine: null,
      processArchitecture: {
        showProcess: true,
        showMainThread: true,
        showThreadPool: true,
        howManyThreads: 4,
        showV8: true,
        showLibuv: true
      },
      notes: [
        {
          title: "The Big Takeaway",
          content: "❌ 'Node is single-threaded'\n✅ 'The main thread running JS is single-threaded, but the Node process uses a multi-threaded thread pool underneath.'"
        }
      ]
    }
  ]
};
