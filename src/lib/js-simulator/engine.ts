export type ExecutionPhase = "Creation Phase" | "Execution Phase";

export interface ExecutionVariable {
  name: string;
  value: string;
}

export interface ExecutionContext {
  id: string;
  name: string;
  phase: ExecutionPhase;
  variables: ExecutionVariable[];
  outerEnvironment: string | null;
  isBlockScope?: boolean;
  isClosure?: boolean;
}

export interface ScopeLookupState {
  targetVariable: string;
  status: "searching" | "found" | "not_found" | "reference_error";
  activeContextId: string;
  checkedContextIds: string[];
  traceLog: string[];
}

export interface TaskQueueItem {
  id: string;
  name: string;
  timeout: string;
  callback: string;
}

export interface WebAPIItem {
  id: string;
  type: "setTimeout" | "setInterval" | "fetch" | "promise" | "queueMicrotask";
  label: string;
  callback: string;
  delay?: string;
  status: "running" | "complete";
}

export interface QueueItem {
  id: string;
  label: string;
  callback: string;
  source: string;
}

export interface EventLoopState {
  phase: "idle" | "checking_microtasks" | "draining_microtask" | "checking_callbacks" | "moving_callback" | "stack_busy";
  message: string;
  activeTask?: QueueItem;
}

export interface SimulationState {
  currentLine: number | null;
  callStack: ExecutionContext[];
  explanation: string;
  consoleOutput?: string[];
  toastMessage?: string;
  visualEffect?: { action: string; target: string; context?: string; reason?: string };
  scopeLookup?: ScopeLookupState;
  taskQueue?: TaskQueueItem[]; // Deprecated for Episode 7, kept for Episode 6
  webAPIs?: WebAPIItem[];
  microtaskQueue?: QueueItem[];
  callbackQueue?: QueueItem[];
  eventLoop?: EventLoopState;
}

export interface SimulationScenario {
  id: string;
  title: string;
  code: string;
  steps: SimulationState[];
}

export const GREET_SCENARIO: SimulationScenario = {
  id: "greet-scenario",
  title: "Execution Context & Call Stack",
  code: `var x = 10;

function greet(name) {
  const msg = "Hello, ";
  console.log(msg + name);
}

greet("Karthik");`,
  steps: [
    {
      currentLine: null,
      explanation: "The JavaScript engine prepares to execute the script. The Call Stack is initially empty.",
      toastMessage: "Engine initialized",
      consoleOutput: [],
      callStack: []
    },
    {
      currentLine: null,
      explanation: "The JavaScript engine starts by creating the Global Execution Context in the Creation Phase. It hoists 'var' variables as undefined and allocates memory for functions.",
      toastMessage: "Global Execution Context Created",
      consoleOutput: [],
      callStack: [
        {
          id: "global",
          name: "Global Execution Context",
          phase: "Creation Phase",
          variables: [
            { name: "x", value: "undefined" },
            { name: "greet", value: "Function Object\\n0x2F81A3B" },
          ],
          outerEnvironment: null,
        }
      ]
    },
    {
      currentLine: 1,
      explanation: "The Execution Phase begins. The engine executes line 1, assigning the value 10 to the variable 'x'.",
      toastMessage: "Global Execution Phase: x = 10",
      consoleOutput: [],
      callStack: [
        {
          id: "global",
          name: "Global Execution Context",
          phase: "Execution Phase",
          variables: [
            { name: "x", value: "10" },
            { name: "greet", value: "Function Object\\n0x2F81A3B" },
          ],
          outerEnvironment: null,
        }
      ]
    },
    {
      currentLine: 8,
      explanation: "During execution, the function declaration statement is encountered but no action is needed because the function object was already created during the Creation Phase. The engine encounters the function invocation 'greet(\"Karthik\")'.",
      toastMessage: "Function greet() invoked",
      consoleOutput: [],
      callStack: [
        {
          id: "global",
          name: "Global Execution Context",
          phase: "Execution Phase",
          variables: [
            { name: "x", value: "10" },
            { name: "greet", value: "Function Object\\n0x2F81A3B" },
          ],
          outerEnvironment: null,
        }
      ]
    },
    {
      currentLine: 8,
      explanation: "A new Execution Context is created for 'greet()' and pushed onto the Call Stack. We enter its Creation Phase where arguments are initialized.",
      toastMessage: "New Execution Context pushed onto stack",
      consoleOutput: [],
      callStack: [
        {
          id: "greet_1",
          name: "greet() FEC",
          phase: "Creation Phase",
          variables: [
            { name: "name", value: '"Karthik"' },
            { name: "msg", value: "<uninitialized>" },
          ],
          outerEnvironment: "Global Execution Context",
        },
        {
          id: "global",
          name: "Global Execution Context",
          phase: "Execution Phase",
          variables: [
            { name: "x", value: "10" },
            { name: "greet", value: "Function Object\\n0x2F81A3B" },
          ],
          outerEnvironment: null,
        }
      ]
    },
    {
      currentLine: 4,
      explanation: "The 'greet' function's Execution Phase begins. The engine executes line 4, assigning '\"Hello, \"' to the 'msg' constant.",
      toastMessage: "Line 4 executing...",
      consoleOutput: [],
      callStack: [
        {
          id: "greet_1",
          name: "greet() FEC",
          phase: "Execution Phase",
          variables: [
            { name: "name", value: '"Karthik"' },
            { name: "msg", value: '"Hello, "' },
          ],
          outerEnvironment: "Global Execution Context",
        },
        {
          id: "global",
          name: "Global Execution Context",
          phase: "Execution Phase",
          variables: [
            { name: "x", value: "10" },
            { name: "greet", value: "Function Object\\n0x2F81A3B" },
          ],
          outerEnvironment: null,
        }
      ]
    },
    {
      currentLine: 5,
      explanation: "Line 5 executes. 'msg' and 'name' are resolved by looking at the current Execution Context's variables. console.log is executed.",
      toastMessage: "Line 5 executing...",
      consoleOutput: ["Hello, Karthik"],
      visualEffect: { action: "resolve", target: "msg, name", context: "greet FEC" },
      callStack: [
        {
          id: "greet_1",
          name: "greet() FEC",
          phase: "Execution Phase",
          variables: [
            { name: "name", value: '"Karthik"' },
            { name: "msg", value: '"Hello, "' },
          ],
          outerEnvironment: "Global Execution Context",
        },
        {
          id: "global",
          name: "Global Execution Context",
          phase: "Execution Phase",
          variables: [
            { name: "x", value: "10" },
            { name: "greet", value: "Function Object\\n0x2F81A3B" },
          ],
          outerEnvironment: null,
        }
      ]
    },
    {
      currentLine: 6,
      explanation: "The 'greet' function reaches the end. Its Execution Context is popped off the Call Stack and destroyed.",
      toastMessage: "Execution Context removed from stack",
      consoleOutput: ["Hello, Karthik"],
      callStack: [
        {
          id: "global",
          name: "Global Execution Context",
          phase: "Execution Phase",
          variables: [
            { name: "x", value: "10" },
            { name: "greet", value: "Function Object\\n0x2F81A3B" },
          ],
          outerEnvironment: null,
        }
      ]
    },
    {
      currentLine: null,
      explanation: "The program finishes execution. The Global Execution Context is popped off the Call Stack, and the stack is now empty.",
      toastMessage: "Global Execution Context destroyed",
      consoleOutput: ["Hello, Karthik"],
      callStack: []
    }
  ]
};
