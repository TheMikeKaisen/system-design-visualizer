import { SimulationScenario } from "./engine";

export const BLOCK_SCENARIO_1_WHAT_IS_A_BLOCK: SimulationScenario = {
  id: "block-1",
  title: "1. What is a Block?",
  code: `{
  let a = 10;
  const b = 20;
  var c = 30;
}

console.log(a);
console.log(b);
console.log(c);`,
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
      explanation: "Creation Phase: The Global Execution Context is created. 'var c' is hoisted out of the block to the global scope.",
      toastMessage: "Global Creation Phase",
      consoleOutput: [],
      callStack: [
        {
          id: "global",
          name: "Global Execution Context",
          phase: "Creation Phase",
          variables: [
            { name: "c", value: "undefined" }
          ],
          outerEnvironment: null
        }
      ]
    },
    {
      currentLine: 1,
      explanation: "Execution Phase: We enter the block. A new Block Scope (Lexical Environment) is created. 'let' and 'const' variables are placed in the block's TDZ.",
      toastMessage: "Entered Block Scope",
      consoleOutput: [],
      callStack: [
        {
          id: "block_1",
          name: "Block Scope",
          phase: "Execution Phase",
          isBlockScope: true,
          variables: [
            { name: "a", value: "<TDZ> 🔒" },
            { name: "b", value: "<TDZ> 🔒" }
          ],
          outerEnvironment: "Global Execution Context"
        },
        {
          id: "global",
          name: "Global Execution Context",
          phase: "Execution Phase",
          variables: [
            { name: "c", value: "undefined" }
          ],
          outerEnvironment: null
        }
      ]
    },
    {
      currentLine: 2,
      explanation: "Inside the block, 'a' is initialized.",
      toastMessage: "a = 10",
      consoleOutput: [],
      callStack: [
        {
          id: "block_1",
          name: "Block Scope",
          phase: "Execution Phase",
          isBlockScope: true,
          variables: [
            { name: "a", value: "10" },
            { name: "b", value: "<TDZ> 🔒" }
          ],
          outerEnvironment: "Global Execution Context"
        },
        {
          id: "global",
          name: "Global Execution Context",
          phase: "Execution Phase",
          variables: [
            { name: "c", value: "undefined" }
          ],
          outerEnvironment: null
        }
      ]
    },
    {
      currentLine: 3,
      explanation: "Inside the block, 'b' is initialized.",
      toastMessage: "b = 20",
      consoleOutput: [],
      callStack: [
        {
          id: "block_1",
          name: "Block Scope",
          phase: "Execution Phase",
          isBlockScope: true,
          variables: [
            { name: "a", value: "10" },
            { name: "b", value: "20" }
          ],
          outerEnvironment: "Global Execution Context"
        },
        {
          id: "global",
          name: "Global Execution Context",
          phase: "Execution Phase",
          variables: [
            { name: "c", value: "undefined" }
          ],
          outerEnvironment: null
        }
      ]
    },
    {
      currentLine: 4,
      explanation: "Inside the block, 'var c = 30' executes. Because 'var' escapes blocks, it updates 'c' in the Global Scope, not the Block Scope.",
      toastMessage: "c = 30 (Global)",
      consoleOutput: [],
      callStack: [
        {
          id: "block_1",
          name: "Block Scope",
          phase: "Execution Phase",
          isBlockScope: true,
          variables: [
            { name: "a", value: "10" },
            { name: "b", value: "20" }
          ],
          outerEnvironment: "Global Execution Context"
        },
        {
          id: "global",
          name: "Global Execution Context",
          phase: "Execution Phase",
          variables: [
            { name: "c", value: "30" }
          ],
          outerEnvironment: null
        }
      ]
    },
    {
      currentLine: 5,
      explanation: "We exit the block. The Block Scope is destroyed, and 'a' and 'b' are gone forever.",
      toastMessage: "Block Scope Destroyed",
      consoleOutput: [],
      callStack: [
        {
          id: "global",
          name: "Global Execution Context",
          phase: "Execution Phase",
          variables: [
            { name: "c", value: "30" }
          ],
          outerEnvironment: null
        }
      ]
    },
    {
      currentLine: 7,
      explanation: "Attempting to log 'a'. The engine searches the Global Scope.",
      toastMessage: "Searching for 'a'",
      consoleOutput: [],
      scopeLookup: {
        targetVariable: "a",
        status: "searching",
        activeContextId: "global",
        checkedContextIds: [],
        traceLog: []
      },
      callStack: [
        {
          id: "global",
          name: "Global Execution Context",
          phase: "Execution Phase",
          variables: [
            { name: "c", value: "30" }
          ],
          outerEnvironment: null
        }
      ]
    },
    {
      currentLine: 7,
      explanation: "'a' is not found in the Global Scope. The engine throws a ReferenceError.",
      toastMessage: "ReferenceError!",
      consoleOutput: ["ReferenceError: a is not defined"],
      scopeLookup: {
        targetVariable: "a",
        status: "reference_error",
        activeContextId: "global",
        checkedContextIds: ["global"],
        traceLog: []
      },
      visualEffect: { action: "error", target: "a", context: "Global EC" },
      callStack: [
        {
          id: "global",
          name: "Global Execution Context",
          phase: "Execution Phase",
          variables: [
            { name: "c", value: "30" }
          ],
          outerEnvironment: null
        }
      ]
    },
    {
      currentLine: null,
      explanation: "Execution halts due to the error.",
      toastMessage: "Execution Halted",
      consoleOutput: ["ReferenceError: a is not defined"],
      callStack: []
    }
  ]
};

export const BLOCK_SCENARIO_2_IF_STATEMENT: SimulationScenario = {
  id: "block-2",
  title: "2. if Statements Create Scope",
  code: `if (true) {
  let x = 5;
}

console.log(x);`,
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
      explanation: "Creation Phase: Global EC is created. There are no global variables.",
      toastMessage: "Global Creation Phase",
      consoleOutput: [],
      callStack: [
        {
          id: "global",
          name: "Global Execution Context",
          phase: "Creation Phase",
          variables: [],
          outerEnvironment: null
        }
      ]
    },
    {
      currentLine: 1,
      explanation: "Execution Phase: The if condition evaluates to true, so we enter the block. A new Block Scope is created.",
      toastMessage: "Entered if Block",
      consoleOutput: [],
      callStack: [
        {
          id: "block_1",
          name: "if Block Scope",
          phase: "Execution Phase",
          isBlockScope: true,
          variables: [
            { name: "x", value: "<TDZ> 🔒" }
          ],
          outerEnvironment: "Global Execution Context"
        },
        {
          id: "global",
          name: "Global Execution Context",
          phase: "Execution Phase",
          variables: [],
          outerEnvironment: null
        }
      ]
    },
    {
      currentLine: 2,
      explanation: "'x' is initialized to 5 inside the if block.",
      toastMessage: "x = 5",
      consoleOutput: [],
      callStack: [
        {
          id: "block_1",
          name: "if Block Scope",
          phase: "Execution Phase",
          isBlockScope: true,
          variables: [
            { name: "x", value: "5" }
          ],
          outerEnvironment: "Global Execution Context"
        },
        {
          id: "global",
          name: "Global Execution Context",
          phase: "Execution Phase",
          variables: [],
          outerEnvironment: null
        }
      ]
    },
    {
      currentLine: 3,
      explanation: "The if block finishes. Its Block Scope is destroyed.",
      toastMessage: "Block Destroyed",
      consoleOutput: [],
      callStack: [
        {
          id: "global",
          name: "Global Execution Context",
          phase: "Execution Phase",
          variables: [],
          outerEnvironment: null
        }
      ]
    },
    {
      currentLine: 5,
      explanation: "Attempting to log 'x'. The engine searches the Global Scope.",
      toastMessage: "Searching for 'x'",
      consoleOutput: [],
      scopeLookup: {
        targetVariable: "x",
        status: "searching",
        activeContextId: "global",
        checkedContextIds: [],
        traceLog: []
      },
      callStack: [
        {
          id: "global",
          name: "Global Execution Context",
          phase: "Execution Phase",
          variables: [],
          outerEnvironment: null
        }
      ]
    },
    {
      currentLine: 5,
      explanation: "'x' is not found. ReferenceError is thrown.",
      toastMessage: "ReferenceError!",
      consoleOutput: ["ReferenceError: x is not defined"],
      scopeLookup: {
        targetVariable: "x",
        status: "reference_error",
        activeContextId: "global",
        checkedContextIds: ["global"],
        traceLog: []
      },
      visualEffect: { action: "error", target: "x", context: "Global EC" },
      callStack: [
        {
          id: "global",
          name: "Global Execution Context",
          phase: "Execution Phase",
          variables: [],
          outerEnvironment: null
        }
      ]
    },
    {
      currentLine: null,
      explanation: "Execution halted.",
      toastMessage: "Halted",
      consoleOutput: ["ReferenceError: x is not defined"],
      callStack: []
    }
  ]
};

export const BLOCK_SCENARIO_3_SHADOWING: SimulationScenario = {
  id: "block-3",
  title: "3. Shadowing",
  code: `let a = 100;

{
  let a = 200;
  console.log(a);
}

console.log(a);`,
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
      explanation: "Creation Phase: Global EC is created with 'a' in TDZ.",
      toastMessage: "Global Creation",
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
      explanation: "Execution Phase: Global 'a' is initialized to 100.",
      toastMessage: "a = 100",
      consoleOutput: [],
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
      currentLine: 3,
      explanation: "Entered a new block. A new Block Scope is created, and it has its own separate 'a' placed in TDZ.",
      toastMessage: "New Block Scope",
      consoleOutput: [],
      callStack: [
        {
          id: "block_1",
          name: "Block Scope",
          phase: "Execution Phase",
          isBlockScope: true,
          variables: [
            { name: "a", value: "<TDZ> 🔒" }
          ],
          outerEnvironment: "Global Execution Context"
        },
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
      currentLine: 4,
      explanation: "Inner 'a' is initialized to 200. This inner 'a' shadows the outer 'a'.",
      toastMessage: "a = 200 (Shadowing)",
      consoleOutput: [],
      callStack: [
        {
          id: "block_1",
          name: "Block Scope",
          phase: "Execution Phase",
          isBlockScope: true,
          variables: [
            { name: "a", value: "200" }
          ],
          outerEnvironment: "Global Execution Context"
        },
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
      currentLine: 5,
      explanation: "Logging 'a'. The engine searches the current Block Scope.",
      toastMessage: "Searching for 'a'",
      consoleOutput: [],
      scopeLookup: {
        targetVariable: "a",
        status: "searching",
        activeContextId: "block_1",
        checkedContextIds: [],
        traceLog: []
      },
      callStack: [
        {
          id: "block_1",
          name: "Block Scope",
          phase: "Execution Phase",
          isBlockScope: true,
          variables: [
            { name: "a", value: "200" }
          ],
          outerEnvironment: "Global Execution Context"
        },
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
      currentLine: 5,
      explanation: "'a' is found in the current Block Scope. The search stops immediately, and the outer 'a' is never checked.",
      toastMessage: "Found inner 'a'!",
      consoleOutput: ["200"],
      scopeLookup: {
        targetVariable: "a",
        status: "found",
        activeContextId: "block_1",
        checkedContextIds: [],
        traceLog: []
      },
      visualEffect: { action: "resolve", target: "a", context: "Block Scope" },
      callStack: [
        {
          id: "block_1",
          name: "Block Scope",
          phase: "Execution Phase",
          isBlockScope: true,
          variables: [
            { name: "a", value: "200" }
          ],
          outerEnvironment: "Global Execution Context"
        },
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
      currentLine: 6,
      explanation: "The block exits and is destroyed. The inner 'a' is gone.",
      toastMessage: "Block Destroyed",
      consoleOutput: ["200"],
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
      currentLine: 8,
      explanation: "Logging 'a' again. The engine searches the Global Scope.",
      toastMessage: "Searching for 'a'",
      consoleOutput: ["200"],
      scopeLookup: {
        targetVariable: "a",
        status: "searching",
        activeContextId: "global",
        checkedContextIds: [],
        traceLog: []
      },
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
      currentLine: 8,
      explanation: "Found the original global 'a'.",
      toastMessage: "Found outer 'a'",
      consoleOutput: ["200", "100"],
      scopeLookup: {
        targetVariable: "a",
        status: "found",
        activeContextId: "global",
        checkedContextIds: [],
        traceLog: []
      },
      visualEffect: { action: "resolve", target: "a", context: "Global Scope" },
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
      explanation: "Execution complete.",
      toastMessage: "Completed",
      consoleOutput: ["200", "100"],
      callStack: []
    }
  ]
};

export const BLOCK_SCENARIO_4_ILLEGAL_SHADOWING: SimulationScenario = {
  id: "block-4",
  title: "4. Illegal Shadowing",
  code: `let x = 10;

{
  var x = 20;
}`,
  steps: [
    {
      currentLine: null,
      explanation: "Parsing Phase: Before execution, the engine builds the scope tree. It notices 'x' is declared with 'let' in the global scope, but then 'var x' is declared inside the block.",
      toastMessage: "Parsing Script...",
      consoleOutput: [],
      callStack: []
    },
    {
      currentLine: 4,
      explanation: "SyntaxError: 'var' declarations are not block-scoped, so they try to attach to the parent Execution Context (Global). Since 'let x' already exists there, it causes a conflict. The script never executes.",
      toastMessage: "SyntaxError Detected!",
      consoleOutput: ["SyntaxError: Identifier 'x' has already been declared"],
      visualEffect: { action: "error", target: "x", reason: "Parsing ❌ Execution never begins." },
      callStack: []
    }
  ]
};

export const BLOCK_SCENARIO_5_TDZ_TRAP: SimulationScenario = {
  id: "block-5",
  title: "5. TDZ Shadowing Trap",
  code: `let a = 1;

{
  console.log(a);
  let a = 2;
}`,
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
      explanation: "Creation Phase: Global EC is created with 'a' in TDZ.",
      toastMessage: "Global Creation",
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
      explanation: "Global 'a' is initialized to 1.",
      toastMessage: "a = 1",
      consoleOutput: [],
      callStack: [
        {
          id: "global",
          name: "Global Execution Context",
          phase: "Execution Phase",
          variables: [
            { name: "a", value: "1" }
          ],
          outerEnvironment: null
        }
      ]
    },
    {
      currentLine: 3,
      explanation: "Entered the block. A new Block Scope is created. The inner 'a' is placed in TDZ, shadowing the outer 'a'.",
      toastMessage: "Block Scope created",
      consoleOutput: [],
      callStack: [
        {
          id: "block_1",
          name: "Block Scope",
          phase: "Execution Phase",
          isBlockScope: true,
          variables: [
            { name: "a", value: "<TDZ> 🔒" }
          ],
          outerEnvironment: "Global Execution Context"
        },
        {
          id: "global",
          name: "Global Execution Context",
          phase: "Execution Phase",
          variables: [
            { name: "a", value: "1" }
          ],
          outerEnvironment: null
        }
      ]
    },
    {
      currentLine: 4,
      explanation: "Logging 'a'. The engine begins searching the current Block Scope.",
      toastMessage: "Searching for 'a'",
      consoleOutput: [],
      scopeLookup: {
        targetVariable: "a",
        status: "searching",
        activeContextId: "block_1",
        checkedContextIds: [],
        traceLog: []
      },
      callStack: [
        {
          id: "block_1",
          name: "Block Scope",
          phase: "Execution Phase",
          isBlockScope: true,
          variables: [
            { name: "a", value: "<TDZ> 🔒" }
          ],
          outerEnvironment: "Global Execution Context"
        },
        {
          id: "global",
          name: "Global Execution Context",
          phase: "Execution Phase",
          variables: [
            { name: "a", value: "1" }
          ],
          outerEnvironment: null
        }
      ]
    },
    {
      currentLine: 4,
      explanation: "The engine finds 'a' in the current block, but it's in the TDZ! Scope lookup stops at the first declaration it finds, even if it hasn't been initialized yet. It throws a ReferenceError.",
      toastMessage: "ReferenceError!",
      consoleOutput: ["ReferenceError: Cannot access 'a' before initialization"],
      scopeLookup: {
        targetVariable: "a",
        status: "reference_error",
        activeContextId: "block_1",
        checkedContextIds: ["block_1"],
        traceLog: []
      },
      visualEffect: { action: "error", target: "a", context: "Block Scope" },
      callStack: [
        {
          id: "block_1",
          name: "Block Scope",
          phase: "Execution Phase",
          isBlockScope: true,
          variables: [
            { name: "a", value: "<TDZ> 🔒" }
          ],
          outerEnvironment: "Global Execution Context"
        },
        {
          id: "global",
          name: "Global Execution Context",
          phase: "Execution Phase",
          variables: [
            { name: "a", value: "1" }
          ],
          outerEnvironment: null
        }
      ]
    },
    {
      currentLine: null,
      explanation: "Execution halts.",
      toastMessage: "Halted",
      consoleOutput: ["ReferenceError: Cannot access 'a' before initialization"],
      callStack: []
    }
  ]
};

export const BLOCK_SCENARIO_6_FUNCTION_VS_BLOCK: SimulationScenario = {
  id: "block-6",
  title: "6. Function Scope vs Block Scope",
  code: `function test() {
  var x = 10;
  {
    let x = 20;
    console.log(x);
  }
  console.log(x);
}

test();`,
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
      explanation: "Creation Phase: 'test' is hoisted to Global Scope.",
      toastMessage: "test hoisted",
      consoleOutput: [],
      callStack: [
        {
          id: "global",
          name: "Global Execution Context",
          phase: "Creation Phase",
          variables: [
            { name: "test", value: "Function Object" }
          ],
          outerEnvironment: null
        }
      ]
    },
    {
      currentLine: 10,
      explanation: "Execution Phase: Invoking test().",
      toastMessage: "test() called",
      consoleOutput: [],
      callStack: [
        {
          id: "global",
          name: "Global Execution Context",
          phase: "Execution Phase",
          variables: [
            { name: "test", value: "Function Object" }
          ],
          outerEnvironment: null
        }
      ]
    },
    {
      currentLine: 1,
      explanation: "Inside test(): The function Execution Context is created. 'var x' is initialized to undefined.",
      toastMessage: "Function EC Created",
      consoleOutput: [],
      callStack: [
        {
          id: "test_1",
          name: "test() FEC",
          phase: "Creation Phase",
          variables: [
            { name: "x", value: "undefined" }
          ],
          outerEnvironment: "Global Execution Context"
        },
        {
          id: "global",
          name: "Global Execution Context",
          phase: "Execution Phase",
          variables: [
            { name: "test", value: "Function Object" }
          ],
          outerEnvironment: null
        }
      ]
    },
    {
      currentLine: 2,
      explanation: "Function 'x' is initialized to 10.",
      toastMessage: "x = 10",
      consoleOutput: [],
      callStack: [
        {
          id: "test_1",
          name: "test() FEC",
          phase: "Execution Phase",
          variables: [
            { name: "x", value: "10" }
          ],
          outerEnvironment: "Global Execution Context"
        },
        {
          id: "global",
          name: "Global Execution Context",
          phase: "Execution Phase",
          variables: [
            { name: "test", value: "Function Object" }
          ],
          outerEnvironment: null
        }
      ]
    },
    {
      currentLine: 3,
      explanation: "Entered a block inside test(). A new Block Scope is created.",
      toastMessage: "Block Scope created",
      consoleOutput: [],
      callStack: [
        {
          id: "block_1",
          name: "Block Scope",
          phase: "Execution Phase",
          isBlockScope: true,
          variables: [
            { name: "x", value: "<TDZ> 🔒" }
          ],
          outerEnvironment: "test() FEC"
        },
        {
          id: "test_1",
          name: "test() FEC",
          phase: "Execution Phase",
          variables: [
            { name: "x", value: "10" }
          ],
          outerEnvironment: "Global Execution Context"
        },
        {
          id: "global",
          name: "Global Execution Context",
          phase: "Execution Phase",
          variables: [
            { name: "test", value: "Function Object" }
          ],
          outerEnvironment: null
        }
      ]
    },
    {
      currentLine: 4,
      explanation: "Inner 'x' is initialized to 20.",
      toastMessage: "Inner x = 20",
      consoleOutput: [],
      callStack: [
        {
          id: "block_1",
          name: "Block Scope",
          phase: "Execution Phase",
          isBlockScope: true,
          variables: [
            { name: "x", value: "20" }
          ],
          outerEnvironment: "test() FEC"
        },
        {
          id: "test_1",
          name: "test() FEC",
          phase: "Execution Phase",
          variables: [
            { name: "x", value: "10" }
          ],
          outerEnvironment: "Global Execution Context"
        },
        {
          id: "global",
          name: "Global Execution Context",
          phase: "Execution Phase",
          variables: [
            { name: "test", value: "Function Object" }
          ],
          outerEnvironment: null
        }
      ]
    },
    {
      currentLine: 5,
      explanation: "Logging 'x'. Finds 20 in the Block Scope.",
      toastMessage: "Logs 20",
      consoleOutput: ["20"],
      visualEffect: { action: "resolve", target: "x", context: "Block Scope" },
      callStack: [
        {
          id: "block_1",
          name: "Block Scope",
          phase: "Execution Phase",
          isBlockScope: true,
          variables: [
            { name: "x", value: "20" }
          ],
          outerEnvironment: "test() FEC"
        },
        {
          id: "test_1",
          name: "test() FEC",
          phase: "Execution Phase",
          variables: [
            { name: "x", value: "10" }
          ],
          outerEnvironment: "Global Execution Context"
        },
        {
          id: "global",
          name: "Global Execution Context",
          phase: "Execution Phase",
          variables: [
            { name: "test", value: "Function Object" }
          ],
          outerEnvironment: null
        }
      ]
    },
    {
      currentLine: 6,
      explanation: "Exited block. Block Scope destroyed.",
      toastMessage: "Block Destroyed",
      consoleOutput: ["20"],
      callStack: [
        {
          id: "test_1",
          name: "test() FEC",
          phase: "Execution Phase",
          variables: [
            { name: "x", value: "10" }
          ],
          outerEnvironment: "Global Execution Context"
        },
        {
          id: "global",
          name: "Global Execution Context",
          phase: "Execution Phase",
          variables: [
            { name: "test", value: "Function Object" }
          ],
          outerEnvironment: null
        }
      ]
    },
    {
      currentLine: 7,
      explanation: "Logging 'x'. Finds 10 in the Function Execution Context.",
      toastMessage: "Logs 10",
      consoleOutput: ["20", "10"],
      visualEffect: { action: "resolve", target: "x", context: "test() FEC" },
      callStack: [
        {
          id: "test_1",
          name: "test() FEC",
          phase: "Execution Phase",
          variables: [
            { name: "x", value: "10" }
          ],
          outerEnvironment: "Global Execution Context"
        },
        {
          id: "global",
          name: "Global Execution Context",
          phase: "Execution Phase",
          variables: [
            { name: "test", value: "Function Object" }
          ],
          outerEnvironment: null
        }
      ]
    },
    {
      currentLine: null,
      explanation: "Execution complete.",
      toastMessage: "Completed",
      consoleOutput: ["20", "10"],
      callStack: []
    }
  ]
};

export const BLOCK_SCOPE_SCENARIOS = [
  BLOCK_SCENARIO_1_WHAT_IS_A_BLOCK,
  BLOCK_SCENARIO_2_IF_STATEMENT,
  BLOCK_SCENARIO_3_SHADOWING,
  BLOCK_SCENARIO_4_ILLEGAL_SHADOWING,
  BLOCK_SCENARIO_5_TDZ_TRAP,
  BLOCK_SCENARIO_6_FUNCTION_VS_BLOCK
];
