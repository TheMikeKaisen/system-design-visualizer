import { SimulationScenario } from "./engine";

export const LET_CONST_SCENARIO_1_DECLARATIONS: SimulationScenario = {
  id: "let-const-1",
  title: "1. The Three Declarations",
  code: `var score = 100;
let age = 20;
const country = "India";`,
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
      explanation: "Creation Phase: The engine scans for variable declarations. 'var' is initialized to undefined. 'let' and 'const' are placed in the Temporal Dead Zone (TDZ).",
      toastMessage: "Creation Phase Started",
      consoleOutput: [],
      callStack: [
        {
          id: "global",
          name: "Global Execution Context",
          phase: "Creation Phase",
          variables: [
            { name: "score", value: "undefined" },
            { name: "age", value: "<TDZ> 🔒" },
            { name: "country", value: "<TDZ> 🔒" }
          ],
          outerEnvironment: null
        }
      ]
    },
    {
      currentLine: 1,
      explanation: "Execution Phase: The engine executes line 1, assigning 100 to 'score'.",
      toastMessage: "score = 100",
      consoleOutput: [],
      callStack: [
        {
          id: "global",
          name: "Global Execution Context",
          phase: "Execution Phase",
          variables: [
            { name: "score", value: "100" },
            { name: "age", value: "<TDZ> 🔒" },
            { name: "country", value: "<TDZ> 🔒" }
          ],
          outerEnvironment: null
        }
      ]
    },
    {
      currentLine: 2,
      explanation: "Line 2: 'age' is released from the TDZ and assigned the value 20.",
      toastMessage: "age = 20 (TDZ Lifted)",
      consoleOutput: [],
      callStack: [
        {
          id: "global",
          name: "Global Execution Context",
          phase: "Execution Phase",
          variables: [
            { name: "score", value: "100" },
            { name: "age", value: "20" },
            { name: "country", value: "<TDZ> 🔒" }
          ],
          outerEnvironment: null
        }
      ]
    },
    {
      currentLine: 3,
      explanation: "Line 3: 'country' is released from the TDZ and assigned the string 'India'.",
      toastMessage: "country = 'India'",
      consoleOutput: [],
      callStack: [
        {
          id: "global",
          name: "Global Execution Context",
          phase: "Execution Phase",
          variables: [
            { name: "score", value: "100" },
            { name: "age", value: "20" },
            { name: "country", value: '"India"' }
          ],
          outerEnvironment: null
        }
      ]
    },
    {
      currentLine: null,
      explanation: "The program finishes execution. The Global Execution Context is popped off the Call Stack.",
      toastMessage: "Execution Completed",
      consoleOutput: [],
      callStack: []
    }
  ]
};

export const LET_CONST_SCENARIO_2_TDZ: SimulationScenario = {
  id: "let-const-2",
  title: "2. The Temporal Dead Zone (TDZ)",
  code: `console.log(a);

let a = 100;`,
  steps: [
    {
      currentLine: null,
      explanation: "The JavaScript engine prepares to execute the script.",
      toastMessage: "Engine initialized",
      consoleOutput: [],
      callStack: []
    },
    {
      currentLine: null,
      explanation: "Creation Phase: 'a' is hoisted but placed in the TDZ. It exists but cannot be accessed until its declaration line is evaluated.",
      toastMessage: "a is in TDZ",
      consoleOutput: [],
      callStack: [
        {
          id: "global",
          name: "Global Execution Context",
          phase: "Creation Phase",
          variables: [
            { name: "a", value: "<TDZ> 🔒" }
          ],
          outerEnvironment: null
        }
      ]
    },
    {
      currentLine: 1,
      explanation: "Execution Phase: Attempting to access 'a' while it's still locked in the TDZ throws a ReferenceError. The engine strictly blocks this access.",
      toastMessage: "Access Blocked!",
      consoleOutput: ["ReferenceError: Cannot access 'a' before initialization"],
      visualEffect: { action: "error", target: "a", context: "Global EC" },
      callStack: [
        {
          id: "global",
          name: "Global Execution Context",
          phase: "Execution Phase",
          variables: [
            { name: "a", value: "<TDZ> 🔒" }
          ],
          outerEnvironment: null
        }
      ]
    },
    {
      currentLine: null,
      explanation: "Execution halts due to the ReferenceError. The program crashes.",
      toastMessage: "Execution Halted",
      consoleOutput: ["ReferenceError: Cannot access 'a' before initialization"],
      callStack: []
    }
  ]
};

export const LET_CONST_SCENARIO_3_VAR_HOISTING: SimulationScenario = {
  id: "let-const-3",
  title: "3. Why var Behaves Differently",
  code: `console.log(a);

var a = 100;`,
  steps: [
    {
      currentLine: null,
      explanation: "The JavaScript engine initializes.",
      toastMessage: "Engine initialized",
      consoleOutput: [],
      callStack: []
    },
    {
      currentLine: null,
      explanation: "Creation Phase: Unlike let/const, 'var' is hoisted and immediately initialized with 'undefined', avoiding the TDZ.",
      toastMessage: "a = undefined",
      consoleOutput: [],
      callStack: [
        {
          id: "global",
          name: "Global Execution Context",
          phase: "Creation Phase",
          variables: [
            { name: "a", value: "undefined" }
          ],
          outerEnvironment: null
        }
      ]
    },
    {
      currentLine: 1,
      explanation: "Execution Phase: Line 1 logs the value of 'a'. Since it was initialized as undefined, no error is thrown.",
      toastMessage: "Logs undefined",
      consoleOutput: ["undefined"],
      callStack: [
        {
          id: "global",
          name: "Global Execution Context",
          phase: "Execution Phase",
          variables: [
            { name: "a", value: "undefined" }
          ],
          outerEnvironment: null
        }
      ]
    },
    {
      currentLine: 3,
      explanation: "Line 3: 'a' is reassigned to 100.",
      toastMessage: "a = 100",
      consoleOutput: ["undefined"],
      callStack: [
        {
          id: "global",
          name: "Global Execution Context",
          phase: "Execution Phase",
          variables: [
            { name: "a", value: "100" }
          ],
          outerEnvironment: null
        }
      ]
    },
    {
      currentLine: null,
      explanation: "Execution Completed.",
      toastMessage: "Stack cleared",
      consoleOutput: ["undefined"],
      callStack: []
    }
  ]
};

export const LET_CONST_SCENARIO_4_REDECLARATION: SimulationScenario = {
  id: "let-const-4",
  title: "4. Redeclaration Rules",
  code: `var a = 100;
var a = 200; // Allowed

let b = 100;
let b = 200; // SyntaxError`,
  steps: [
    {
      currentLine: null,
      explanation: "Parsing Phase: Before the engine even creates an Execution Context or runs line 1, it parses the entire script. It detects that 'b' is declared twice using 'let'.",
      toastMessage: "Parsing Script...",
      consoleOutput: [],
      callStack: []
    },
    {
      currentLine: 4,
      explanation: "SyntaxError: 'let' and 'const' do not allow redeclaration in the same scope. The engine throws a SyntaxError and refuses to execute ANY code. No Execution Context is ever created.",
      toastMessage: "SyntaxError Detected!",
      consoleOutput: ["SyntaxError: Identifier 'b' has already been declared"],
      visualEffect: { action: "error", target: "b", reason: "Execution context is not created in this case" },
      callStack: []
    }
  ]
};

export const LET_CONST_SCENARIO_5_CONST_INIT: SimulationScenario = {
  id: "let-const-5",
  title: "5. const Initialization",
  code: `const c;

c = 10;`,
  steps: [
    {
      currentLine: null,
      explanation: "Parsing Phase: The JavaScript engine parses the script before running it. It sees a 'const' declaration without an initial value.",
      toastMessage: "Parsing Script...",
      consoleOutput: [],
      callStack: []
    },
    {
      currentLine: 1,
      explanation: "SyntaxError: A constant must know its value immediately upon declaration. The engine throws a SyntaxError and halts before execution even begins.",
      toastMessage: "SyntaxError Detected!",
      consoleOutput: ["SyntaxError: Missing initializer in const declaration"],
      visualEffect: { action: "error", target: "c", reason: "Execution context is not created in this case" },
      callStack: []
    }
  ]
};

export const LET_CONST_SCENARIO_6_REASSIGNMENT: SimulationScenario = {
  id: "let-const-6",
  title: "6. Reassignment Rules",
  code: `let count = 10;
count = 20; // OK

const max = 100;
max = 200; // TypeError`,
  steps: [
    {
      currentLine: null,
      explanation: "Engine initialized.",
      toastMessage: "Init",
      consoleOutput: [],
      callStack: []
    },
    {
      currentLine: null,
      explanation: "Creation Phase: 'count' and 'max' are placed in the TDZ.",
      toastMessage: "TDZ populated",
      consoleOutput: [],
      callStack: [
        {
          id: "global",
          name: "Global EC",
          phase: "Creation Phase",
          variables: [
            { name: "count", value: "<TDZ> 🔒" },
            { name: "max", value: "<TDZ> 🔒" }
          ],
          outerEnvironment: null
        }
      ]
    },
    {
      currentLine: 1,
      explanation: "Execution Phase: 'count' is initialized to 10.",
      toastMessage: "count = 10",
      consoleOutput: [],
      callStack: [
        {
          id: "global",
          name: "Global EC",
          phase: "Execution Phase",
          variables: [
            { name: "count", value: "10" },
            { name: "max", value: "<TDZ> 🔒" }
          ],
          outerEnvironment: null
        }
      ]
    },
    {
      currentLine: 2,
      explanation: "Line 2: 'count' (a let variable) is successfully reassigned to 20.",
      toastMessage: "count updated",
      consoleOutput: [],
      callStack: [
        {
          id: "global",
          name: "Global EC",
          phase: "Execution Phase",
          variables: [
            { name: "count", value: "20" },
            { name: "max", value: "<TDZ> 🔒" }
          ],
          outerEnvironment: null
        }
      ]
    },
    {
      currentLine: 4,
      explanation: "Line 4: 'max' is released from the TDZ and initialized to 100.",
      toastMessage: "max = 100",
      consoleOutput: [],
      callStack: [
        {
          id: "global",
          name: "Global EC",
          phase: "Execution Phase",
          variables: [
            { name: "count", value: "20" },
            { name: "max", value: "100" }
          ],
          outerEnvironment: null
        }
      ]
    },
    {
      currentLine: 5,
      explanation: "Line 5: Attempting to reassign a 'const' variable. The engine blocks this and throws a TypeError.",
      toastMessage: "TypeError!",
      consoleOutput: ["TypeError: Assignment to constant variable."],
      visualEffect: { action: "error", target: "max", context: "Global EC" },
      callStack: [
        {
          id: "global",
          name: "Global EC",
          phase: "Execution Phase",
          variables: [
            { name: "count", value: "20" },
            { name: "max", value: "100" }
          ],
          outerEnvironment: null
        }
      ]
    },
    {
      currentLine: null,
      explanation: "Execution halts due to the TypeError.",
      toastMessage: "Execution Halted",
      consoleOutput: ["TypeError: Assignment to constant variable."],
      callStack: []
    }
  ]
};

export const LET_CONST_SCENARIOS = [
  LET_CONST_SCENARIO_1_DECLARATIONS,
  LET_CONST_SCENARIO_2_TDZ,
  LET_CONST_SCENARIO_3_VAR_HOISTING,
  LET_CONST_SCENARIO_4_REDECLARATION,
  LET_CONST_SCENARIO_5_CONST_INIT,
  LET_CONST_SCENARIO_6_REASSIGNMENT
];
