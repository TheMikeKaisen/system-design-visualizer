import { SimulationScenario } from "./engine";

export const HOISTING_VAR_SCENARIO: SimulationScenario = {
  id: "hoisting-var",
  title: "1. What happens to var?",
  code: `console.log(x);

var x = 10;
console.log(x);`,
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
      explanation: "Creation Phase: The Global Execution Context is created. Memory is allocated for 'x', and it is initialized to 'undefined'.",
      toastMessage: "Global EC Created",
      consoleOutput: [],
      callStack: [
        {
          id: "global",
          name: "Global Execution Context",
          phase: "Creation Phase",
          variables: [
            { name: "x", value: "undefined" }
          ],
          outerEnvironment: null
        }
      ]
    },
    {
      currentLine: 1,
      explanation: "Execution Phase: The engine executes line 1. Because 'x' was hoisted, it doesn't crash, but it logs 'undefined'.",
      toastMessage: "Logging x (undefined)",
      consoleOutput: ["undefined"],
      callStack: [
        {
          id: "global",
          name: "Global Execution Context",
          phase: "Execution Phase",
          variables: [
            { name: "x", value: "undefined" }
          ],
          outerEnvironment: null
        }
      ]
    },
    {
      currentLine: 3,
      explanation: "Line 3: The assignment happens. Memory is updated, and 'x' is now 10.",
      toastMessage: "x is assigned 10",
      consoleOutput: ["undefined"],
      callStack: [
        {
          id: "global",
          name: "Global Execution Context",
          phase: "Execution Phase",
          variables: [
            { name: "x", value: "10" }
          ],
          outerEnvironment: null
        }
      ]
    },
    {
      currentLine: 4,
      explanation: "Line 4: Now when we log 'x', it outputs 10 because the assignment has completed.",
      toastMessage: "Logging x (10)",
      consoleOutput: ["undefined", "10"],
      visualEffect: { action: "resolve", target: "x", context: "Global EC" },
      callStack: [
        {
          id: "global",
          name: "Global Execution Context",
          phase: "Execution Phase",
          variables: [
            { name: "x", value: "10" }
          ],
          outerEnvironment: null
        }
      ]
    },
    {
      currentLine: null,
      explanation: "The program finishes execution. The Global Execution Context is popped off the Call Stack, and the stack is now empty.",
      toastMessage: "Global EC destroyed",
      consoleOutput: ["undefined", "10"],
      callStack: []
    }
  ]
};

export const HOISTING_LET_SCENARIO: SimulationScenario = {
  id: "hoisting-let",
  title: "2. let & const (TDZ)",
  code: `console.log(age);

let age = 20;`,
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
      explanation: "Creation Phase: Memory is allocated for 'age', but it is placed in the Temporal Dead Zone (TDZ). It is locked and uninitialized.",
      toastMessage: "age is in TDZ",
      consoleOutput: [],
      callStack: [
        {
          id: "global",
          name: "Global Execution Context",
          phase: "Creation Phase",
          variables: [
            { name: "age", value: "<TDZ> 🔒" }
          ],
          outerEnvironment: null
        }
      ]
    },
    {
      currentLine: 1,
      explanation: "Execution Phase: Line 1 attempts to access 'age'. Since it is still in the TDZ, the engine throws a ReferenceError and halts.",
      toastMessage: "ReferenceError!",
      consoleOutput: ["ReferenceError: Cannot access 'age' before initialization"],
      visualEffect: { action: "error", target: "age", context: "TDZ Lock" },
      callStack: [
        {
          id: "global",
          name: "Global Execution Context",
          phase: "Execution Phase",
          variables: [
            { name: "age", value: "<TDZ> 🔒" }
          ],
          outerEnvironment: null
        }
      ]
    },
    {
      currentLine: null,
      explanation: "Execution is halted due to the error. The Call Stack is cleared.",
      toastMessage: "Execution Halted",
      consoleOutput: ["ReferenceError: Cannot access 'age' before initialization"],
      callStack: []
    }
  ]
};

export const HOISTING_FUNC_DECL_SCENARIO: SimulationScenario = {
  id: "hoisting-func-decl",
  title: "3. Function Declarations",
  code: `hello();

function hello() {
  console.log("Hello");
}`,
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
      explanation: "Creation Phase: The entire function object 'hello' is hoisted and placed in memory. It is ready to be invoked.",
      toastMessage: "Function hoisted",
      consoleOutput: [],
      callStack: [
        {
          id: "global",
          name: "Global Execution Context",
          phase: "Creation Phase",
          variables: [
            { name: "hello", value: "Function Object\\n0x8A93B2C" }
          ],
          outerEnvironment: null
        }
      ]
    },
    {
      currentLine: 1,
      explanation: "Execution Phase: Line 1 invokes 'hello()'. Since it fully exists in memory, this works perfectly.",
      toastMessage: "Invoking hello()",
      consoleOutput: [],
      callStack: [
        {
          id: "global",
          name: "Global Execution Context",
          phase: "Execution Phase",
          variables: [
            { name: "hello", value: "Function Object\\n0x8A93B2C" }
          ],
          outerEnvironment: null
        }
      ]
    },
    {
      currentLine: 4,
      explanation: "Inside hello(), the console.log executes.",
      toastMessage: "Logging 'Hello'",
      consoleOutput: ["Hello"],
      callStack: [
        {
          id: "hello_1",
          name: "hello() FEC",
          phase: "Execution Phase",
          variables: [],
          outerEnvironment: "Global Execution Context"
        },
        {
          id: "global",
          name: "Global Execution Context",
          phase: "Execution Phase",
          variables: [
            { name: "hello", value: "Function Object\\n0x8A93B2C" }
          ],
          outerEnvironment: null
        }
      ]
    },
    {
      currentLine: null,
      explanation: "Execution finishes successfully. The Global Execution Context is destroyed.",
      toastMessage: "Global EC destroyed",
      consoleOutput: ["Hello"],
      callStack: []
    }
  ]
};

export const HOISTING_FUNC_EXPR_SCENARIO: SimulationScenario = {
  id: "hoisting-func-expr",
  title: "4. Function Expressions",
  code: `sayHi();

var sayHi = function() {
  console.log("Hi");
}`,
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
      explanation: "Creation Phase: 'sayHi' is declared with 'var', so it is hoisted with the value 'undefined'. The function expression itself is NOT hoisted.",
      toastMessage: "sayHi = undefined",
      consoleOutput: [],
      callStack: [
        {
          id: "global",
          name: "Global Execution Context",
          phase: "Creation Phase",
          variables: [
            { name: "sayHi", value: "undefined" }
          ],
          outerEnvironment: null
        }
      ]
    },
    {
      currentLine: 1,
      explanation: "Execution Phase: Line 1 tries to invoke 'sayHi()'. Since its value is 'undefined', attempting to call it throws a TypeError.",
      toastMessage: "TypeError!",
      consoleOutput: ["TypeError: sayHi is not a function"],
      visualEffect: { action: "error", target: "sayHi", context: "Global EC" },
      callStack: [
        {
          id: "global",
          name: "Global Execution Context",
          phase: "Execution Phase",
          variables: [
            { name: "sayHi", value: "undefined" }
          ],
          outerEnvironment: null
        }
      ]
    },
    {
      currentLine: null,
      explanation: "Execution is halted due to the error. The Call Stack is cleared.",
      toastMessage: "Execution Halted",
      consoleOutput: ["TypeError: sayHi is not a function"],
      callStack: []
    }
  ]
};

export const ALL_HOISTING_SCENARIOS = [
  HOISTING_VAR_SCENARIO,
  HOISTING_LET_SCENARIO,
  HOISTING_FUNC_DECL_SCENARIO,
  HOISTING_FUNC_EXPR_SCENARIO
];
