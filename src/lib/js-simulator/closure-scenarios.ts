import { SimulationScenario } from "./engine";

export const CLOSURE_SCENARIO_1: SimulationScenario = {
  id: "closure-birth",
  title: "1. Birth of a Closure",
  code: `function outer() {
  let count = 0;

  function inner() {
    count++;
    console.log(count);
  }

  return inner;
}

const fn = outer();

fn();
fn();`,
  steps: [
    {
      currentLine: null,
      explanation: "Engine initialized. Preparing to parse and execute code.",
      toastMessage: "Engine Initialized",
      consoleOutput: [],
      callStack: []
    },
    {
      currentLine: null,
      explanation: "Global Execution Context is created. 'outer' function is allocated, 'fn' is in TDZ.",
      toastMessage: "Global Creation Phase",
      consoleOutput: [],
      callStack: [
        {
          id: "global",
          name: "Global Execution Context",
          phase: "Creation Phase",
          variables: [
            { name: "outer", value: "Function Object" },
            { name: "fn", value: "<TDZ>" }
          ],
          outerEnvironment: null,
        }
      ]
    },
    {
      currentLine: 12,
      explanation: "Execution Phase begins. 'outer()' is called to assign its return value to 'fn'.",
      toastMessage: "outer() invoked",
      consoleOutput: [],
      callStack: [
        {
          id: "global",
          name: "Global Execution Context",
          phase: "Execution Phase",
          variables: [
            { name: "outer", value: "Function Object" },
            { name: "fn", value: "<uninitialized>" }
          ],
          outerEnvironment: null,
        }
      ]
    },
    {
      currentLine: 1,
      explanation: "outer() Execution Context is created and pushed to the call stack. During its Creation Phase, 'count' is placed in the Temporal Dead Zone.",
      toastMessage: "outer() Creation Phase",
      consoleOutput: [],
      callStack: [
        {
          id: "outer_1",
          name: "outer() FEC",
          phase: "Creation Phase",
          variables: [
            { name: "count", value: "<TDZ>" },
            { name: "inner", value: "Function Object" }
          ],
          outerEnvironment: "Global Execution Context",
        },
        {
          id: "global",
          name: "Global Execution Context",
          phase: "Execution Phase",
          variables: [
            { name: "outer", value: "Function Object" },
            { name: "fn", value: "<uninitialized>" }
          ],
          outerEnvironment: null,
        }
      ]
    },
    {
      currentLine: 2,
      explanation: "Execution begins. We assign 0 to 'count'.",
      toastMessage: "let count = 0",
      consoleOutput: [],
      callStack: [
        {
          id: "outer_1",
          name: "outer() FEC",
          phase: "Execution Phase",
          variables: [
            { name: "count", value: "0" },
            { name: "inner", value: "Function Object" }
          ],
          outerEnvironment: "Global Execution Context",
        },
        {
          id: "global",
          name: "Global Execution Context",
          phase: "Execution Phase",
          variables: [
            { name: "outer", value: "Function Object" },
            { name: "fn", value: "<uninitialized>" }
          ],
          outerEnvironment: null,
        }
      ]
    },
    {
      currentLine: 9,
      explanation: "outer() returns the 'inner' function.",
      toastMessage: "Returning inner function",
      consoleOutput: [],
      callStack: [
        {
          id: "outer_1",
          name: "outer() FEC",
          phase: "Execution Phase",
          variables: [
            { name: "count", value: "0" },
            { name: "inner", value: "Function Object" }
          ],
          outerEnvironment: "Global Execution Context",
        },
        {
          id: "global",
          name: "Global Execution Context",
          phase: "Execution Phase",
          variables: [
            { name: "outer", value: "Function Object" },
            { name: "fn", value: "<uninitialized>" }
          ],
          outerEnvironment: null,
        }
      ]
    },
    {
      currentLine: 12,
      explanation: "Normally, the outer() Execution Context is destroyed. But because 'inner' references 'count', JS preserves its memory! The variables survive as a Closure.",
      toastMessage: "Closure Memory Created!",
      consoleOutput: [],
      callStack: [
        {
          id: "closure_outer_1",
          name: "Closure (outer)",
          phase: "Execution Phase",
          variables: [
            { name: "count", value: "0" }
          ],
          outerEnvironment: "Global Execution Context",
          isClosure: true
        },
        {
          id: "global",
          name: "Global Execution Context",
          phase: "Execution Phase",
          variables: [
            { name: "outer", value: "Function Object" },
            { name: "fn", value: "inner (Function)" }
          ],
          outerEnvironment: null,
        }
      ]
    },
    {
      currentLine: 14,
      explanation: "We now call fn(). Remember, fn is actually the 'inner' function we returned.",
      toastMessage: "fn() invoked",
      consoleOutput: [],
      callStack: [
        {
          id: "closure_outer_1",
          name: "Closure (outer)",
          phase: "Execution Phase",
          variables: [
            { name: "count", value: "0" }
          ],
          outerEnvironment: "Global Execution Context",
          isClosure: true
        },
        {
          id: "global",
          name: "Global Execution Context",
          phase: "Execution Phase",
          variables: [
            { name: "outer", value: "Function Object" },
            { name: "fn", value: "inner (Function)" }
          ],
          outerEnvironment: null,
        }
      ]
    },
    {
      currentLine: 4,
      explanation: "inner() EC is created and placed on the Call Stack.",
      toastMessage: "inner EC Created",
      consoleOutput: [],
      callStack: [
        {
          id: "inner_1",
          name: "inner() FEC",
          phase: "Creation Phase",
          variables: [],
          outerEnvironment: "Closure (outer)",
        },
        {
          id: "closure_outer_1",
          name: "Closure (outer)",
          phase: "Execution Phase",
          variables: [
            { name: "count", value: "0" }
          ],
          outerEnvironment: "Global Execution Context",
          isClosure: true
        },
        {
          id: "global",
          name: "Global Execution Context",
          phase: "Execution Phase",
          variables: [
            { name: "outer", value: "Function Object" },
            { name: "fn", value: "inner (Function)" }
          ],
          outerEnvironment: null,
        }
      ]
    },
    {
      currentLine: 5,
      explanation: "When executing `count++`, JavaScript needs to find 'count'. It searches the local memory first.",
      toastMessage: "Searching for count...",
      consoleOutput: [],
      scopeLookup: {
        targetVariable: "count",
        status: "searching",
        activeContextId: "inner_1",
        checkedContextIds: [],
        traceLog: ["Searching 'count'...", "Checking inner() Local Memory: ❌ Not found"]
      },
      callStack: [
        {
          id: "inner_1",
          name: "inner() FEC",
          phase: "Execution Phase",
          variables: [],
          outerEnvironment: "Closure (outer)",
        },
        {
          id: "closure_outer_1",
          name: "Closure (outer)",
          phase: "Execution Phase",
          variables: [
            { name: "count", value: "0" }
          ],
          outerEnvironment: "Global Execution Context",
          isClosure: true
        },
        {
          id: "global",
          name: "Global Execution Context",
          phase: "Execution Phase",
          variables: [
            { name: "outer", value: "Function Object" },
            { name: "fn", value: "inner (Function)" }
          ],
          outerEnvironment: null,
        }
      ]
    },
    {
      currentLine: 5,
      explanation: "Not found locally. It follows the scope chain to its outer environment: the Closure Memory! It finds 'count' here and increments it.",
      toastMessage: "Found in Closure!",
      consoleOutput: [],
      scopeLookup: {
        targetVariable: "count",
        status: "found",
        activeContextId: "closure_outer_1",
        checkedContextIds: ["inner_1"],
        traceLog: ["Searching 'count'...", "Checking inner() Local Memory: ❌ Not found", "Checking Closure (outer): ✅ Found count = 0"]
      },
      visualEffect: { action: "resolve", target: "count", context: "Closure (outer)" },
      callStack: [
        {
          id: "inner_1",
          name: "inner() FEC",
          phase: "Execution Phase",
          variables: [],
          outerEnvironment: "Closure (outer)",
        },
        {
          id: "closure_outer_1",
          name: "Closure (outer)",
          phase: "Execution Phase",
          variables: [
            { name: "count", value: "1" }
          ],
          outerEnvironment: "Global Execution Context",
          isClosure: true
        },
        {
          id: "global",
          name: "Global Execution Context",
          phase: "Execution Phase",
          variables: [
            { name: "outer", value: "Function Object" },
            { name: "fn", value: "inner (Function)" }
          ],
          outerEnvironment: null,
        }
      ]
    },
    {
      currentLine: 6,
      explanation: "It prints the updated count (1) to the console.",
      toastMessage: "console.log(count)",
      consoleOutput: ["1"],
      callStack: [
        {
          id: "inner_1",
          name: "inner() FEC",
          phase: "Execution Phase",
          variables: [],
          outerEnvironment: "Closure (outer)",
        },
        {
          id: "closure_outer_1",
          name: "Closure (outer)",
          phase: "Execution Phase",
          variables: [
            { name: "count", value: "1" }
          ],
          outerEnvironment: "Global Execution Context",
          isClosure: true
        },
        {
          id: "global",
          name: "Global Execution Context",
          phase: "Execution Phase",
          variables: [
            { name: "outer", value: "Function Object" },
            { name: "fn", value: "inner (Function)" }
          ],
          outerEnvironment: null,
        }
      ]
    },
    {
      currentLine: null,
      explanation: "inner() finishes execution and is popped off the Call Stack.",
      toastMessage: "inner EC Destroyed",
      consoleOutput: ["1"],
      callStack: [
        {
          id: "closure_outer_1",
          name: "Closure (outer)",
          phase: "Execution Phase",
          variables: [
            { name: "count", value: "1" }
          ],
          outerEnvironment: "Global Execution Context",
          isClosure: true
        },
        {
          id: "global",
          name: "Global Execution Context",
          phase: "Execution Phase",
          variables: [
            { name: "outer", value: "Function Object" },
            { name: "fn", value: "inner (Function)" }
          ],
          outerEnvironment: null,
        }
      ]
    },
    {
      currentLine: 15,
      explanation: "We call fn() a second time.",
      toastMessage: "fn() invoked again",
      consoleOutput: ["1"],
      callStack: [
        {
          id: "closure_outer_1",
          name: "Closure (outer)",
          phase: "Execution Phase",
          variables: [
            { name: "count", value: "1" }
          ],
          outerEnvironment: "Global Execution Context",
          isClosure: true
        },
        {
          id: "global",
          name: "Global Execution Context",
          phase: "Execution Phase",
          variables: [
            { name: "outer", value: "Function Object" },
            { name: "fn", value: "inner (Function)" }
          ],
          outerEnvironment: null,
        }
      ]
    },
    {
      currentLine: 4,
      explanation: "A brand new inner() EC is created, but it STILL points to the exact same Closure Memory!",
      toastMessage: "inner() EC Created",
      consoleOutput: ["1"],
      callStack: [
        {
          id: "inner_2",
          name: "inner() FEC",
          phase: "Creation Phase",
          variables: [],
          outerEnvironment: "Closure (outer)",
        },
        {
          id: "closure_outer_1",
          name: "Closure (outer)",
          phase: "Execution Phase",
          variables: [
            { name: "count", value: "1" }
          ],
          outerEnvironment: "Global Execution Context",
          isClosure: true
        },
        {
          id: "global",
          name: "Global Execution Context",
          phase: "Execution Phase",
          variables: [
            { name: "outer", value: "Function Object" },
            { name: "fn", value: "inner (Function)" }
          ],
          outerEnvironment: null,
        }
      ]
    },
    {
      currentLine: 5,
      explanation: "It finds count in the Closure Memory again, and increments it to 2.",
      toastMessage: "count incremented to 2",
      consoleOutput: ["1"],
      callStack: [
        {
          id: "inner_2",
          name: "inner() FEC",
          phase: "Execution Phase",
          variables: [],
          outerEnvironment: "Closure (outer)",
        },
        {
          id: "closure_outer_1",
          name: "Closure (outer)",
          phase: "Execution Phase",
          variables: [
            { name: "count", value: "2" }
          ],
          outerEnvironment: "Global Execution Context",
          isClosure: true
        },
        {
          id: "global",
          name: "Global Execution Context",
          phase: "Execution Phase",
          variables: [
            { name: "outer", value: "Function Object" },
            { name: "fn", value: "inner (Function)" }
          ],
          outerEnvironment: null,
        }
      ]
    },
    {
      currentLine: 6,
      explanation: "It prints the updated count.",
      toastMessage: "Logging count",
      consoleOutput: ["1", "2"],
      callStack: [
        {
          id: "inner_2",
          name: "inner() FEC",
          phase: "Execution Phase",
          variables: [],
          outerEnvironment: "Closure (outer)",
        },
        {
          id: "closure_outer_1",
          name: "Closure (outer)",
          phase: "Execution Phase",
          variables: [
            { name: "count", value: "2" }
          ],
          outerEnvironment: "Global Execution Context",
          isClosure: true
        },
        {
          id: "global",
          name: "Global Execution Context",
          phase: "Execution Phase",
          variables: [
            { name: "outer", value: "Function Object" },
            { name: "fn", value: "inner (Function)" }
          ],
          outerEnvironment: null,
        }
      ]
    },
    {
      currentLine: null,
      explanation: "The second inner() finishes execution and is popped off the Call Stack.",
      toastMessage: "inner EC Destroyed",
      consoleOutput: ["1", "2"],
      callStack: [
        {
          id: "closure_outer_1",
          name: "Closure (outer)",
          phase: "Execution Phase",
          variables: [
            { name: "count", value: "2" }
          ],
          outerEnvironment: "Global Execution Context",
          isClosure: true
        },
        {
          id: "global",
          name: "Global Execution Context",
          phase: "Execution Phase",
          variables: [
            { name: "outer", value: "Function Object" },
            { name: "fn", value: "inner (Function)" }
          ],
          outerEnvironment: null,
        }
      ]
    },
    {
      currentLine: null,
      explanation: "The script finishes executing. The Global EC is destroyed. Closure memory persists as long as 'fn' exists in memory!",
      toastMessage: "Program Finished",
      consoleOutput: ["1", "2"],
      callStack: []
    }
  ]
};

export const CLOSURE_SCENARIO_2: SimulationScenario = {
  id: "closure-lexical-scope",
  title: "2. Lexical Scope (Optimization)",
  code: `function outer(c) {
  let b = 20;
  let a = 10;

  function inner() {
    console.log(a, c);
  }

  return inner;
}

const func = outer("hello");
func();`,
  steps: [
    {
      currentLine: null,
      explanation: "Engine initialized. Preparing to parse and execute code.",
      toastMessage: "Engine Initialized",
      consoleOutput: [],
      callStack: []
    },
    {
      currentLine: null,
      explanation: "Global Creation Phase. Variables memory allocated.",
      toastMessage: "Global Creation Phase",
      consoleOutput: [],
      callStack: [
        {
          id: "global",
          name: "Global Execution Context",
          phase: "Creation Phase",
          variables: [
            { name: "outer", value: "Function Object" },
            { name: "func", value: "<TDZ>" }
          ],
          outerEnvironment: null,
        }
      ]
    },
    {
      currentLine: 12,
      explanation: "Execution begins. We prepare to call outer(\"hello\") to initialize func.",
      toastMessage: "Calling outer()",
      consoleOutput: [],
      callStack: [
        {
          id: "global",
          name: "Global Execution Context",
          phase: "Execution Phase",
          variables: [
            { name: "outer", value: "Function Object" },
            { name: "func", value: "<uninitialized>" }
          ],
          outerEnvironment: null,
        }
      ]
    },
    {
      currentLine: 1,
      explanation: "outer() Execution Context is created. During Creation Phase, arguments are initialized but 'let' variables are hoisted into the TDZ.",
      toastMessage: "outer() Creation Phase",
      consoleOutput: [],
      callStack: [
        {
          id: "outer_1",
          name: "outer() FEC",
          phase: "Creation Phase",
          variables: [
            { name: "c", value: '"hello"' },
            { name: "b", value: "<TDZ>" },
            { name: "a", value: "<TDZ>" },
            { name: "inner", value: "Function Object" }
          ],
          outerEnvironment: "Global Execution Context",
        },
        {
          id: "global",
          name: "Global Execution Context",
          phase: "Execution Phase",
          variables: [
            { name: "outer", value: "Function Object" },
            { name: "func", value: "<uninitialized>" }
          ],
          outerEnvironment: null,
        }
      ]
    },
    {
      currentLine: 2,
      explanation: "Execution Phase begins. Executing variable assignment for 'b'.",
      toastMessage: "let b = 20",
      consoleOutput: [],
      callStack: [
        {
          id: "outer_1",
          name: "outer() FEC",
          phase: "Execution Phase",
          variables: [
            { name: "c", value: '"hello"' },
            { name: "b", value: "20" },
            { name: "a", value: "<TDZ>" },
            { name: "inner", value: "Function Object" }
          ],
          outerEnvironment: "Global Execution Context",
        },
        {
          id: "global",
          name: "Global Execution Context",
          phase: "Execution Phase",
          variables: [
            { name: "outer", value: "Function Object" },
            { name: "func", value: "<uninitialized>" }
          ],
          outerEnvironment: null,
        }
      ]
    },
    {
      currentLine: 3,
      explanation: "Executing variable assignment for 'a'.",
      toastMessage: "let a = 10",
      consoleOutput: [],
      callStack: [
        {
          id: "outer_1",
          name: "outer() FEC",
          phase: "Execution Phase",
          variables: [
            { name: "c", value: '"hello"' },
            { name: "b", value: "20" },
            { name: "a", value: "10" },
            { name: "inner", value: "Function Object" }
          ],
          outerEnvironment: "Global Execution Context",
        },
        {
          id: "global",
          name: "Global Execution Context",
          phase: "Execution Phase",
          variables: [
            { name: "outer", value: "Function Object" },
            { name: "func", value: "<uninitialized>" }
          ],
          outerEnvironment: null,
        }
      ]
    },
    {
      currentLine: 9,
      explanation: "outer() completes and returns 'inner'.",
      toastMessage: "Returning inner function",
      consoleOutput: [],
      callStack: [
        {
          id: "outer_1",
          name: "outer() FEC",
          phase: "Execution Phase",
          variables: [
            { name: "c", value: '"hello"' },
            { name: "b", value: "20" },
            { name: "a", value: "10" },
            { name: "inner", value: "Function Object" }
          ],
          outerEnvironment: "Global Execution Context",
        },
        {
          id: "global",
          name: "Global Execution Context",
          phase: "Execution Phase",
          variables: [
            { name: "outer", value: "Function Object" },
            { name: "func", value: "<uninitialized>" }
          ],
          outerEnvironment: null,
        }
      ]
    },
    {
      currentLine: 12,
      explanation: "Modern engines (like V8) are highly optimized. Because 'b' is never used by 'inner', it is garbage collected. Only 'a' and 'c' are captured in the Closure.",
      toastMessage: "'b' is garbage collected",
      consoleOutput: [],
      callStack: [
        {
          id: "closure_outer_1",
          name: "Closure (outer)",
          phase: "Execution Phase",
          variables: [
            { name: "c", value: '"hello"' },
            { name: "a", value: "10" },
          ],
          outerEnvironment: "Global Execution Context",
          isClosure: true
        },
        {
          id: "global",
          name: "Global Execution Context",
          phase: "Execution Phase",
          variables: [
            { name: "outer", value: "Function Object" },
            { name: "func", value: "inner (Function)" }
          ],
          outerEnvironment: null,
        }
      ]
    },
    {
      currentLine: 13,
      explanation: "Now we execute func(), which invokes the returned 'inner' function.",
      toastMessage: "Calling func()",
      consoleOutput: [],
      callStack: [
        {
          id: "closure_outer_1",
          name: "Closure (outer)",
          phase: "Execution Phase",
          variables: [
            { name: "c", value: '"hello"' },
            { name: "a", value: "10" },
          ],
          outerEnvironment: "Global Execution Context",
          isClosure: true
        },
        {
          id: "global",
          name: "Global Execution Context",
          phase: "Execution Phase",
          variables: [
            { name: "outer", value: "Function Object" },
            { name: "func", value: "inner (Function)" }
          ],
          outerEnvironment: null,
        }
      ]
    },
    {
      currentLine: 5,
      explanation: "inner() Execution Context is created.",
      toastMessage: "inner() Creation Phase",
      consoleOutput: [],
      callStack: [
        {
          id: "inner_1",
          name: "inner() FEC",
          phase: "Creation Phase",
          variables: [],
          outerEnvironment: "Closure (outer)",
        },
        {
          id: "closure_outer_1",
          name: "Closure (outer)",
          phase: "Execution Phase",
          variables: [
            { name: "c", value: '"hello"' },
            { name: "a", value: "10" },
          ],
          outerEnvironment: "Global Execution Context",
          isClosure: true
        },
        {
          id: "global",
          name: "Global Execution Context",
          phase: "Execution Phase",
          variables: [
            { name: "outer", value: "Function Object" },
            { name: "func", value: "inner (Function)" }
          ],
          outerEnvironment: null,
        }
      ]
    },
    {
      currentLine: 6,
      explanation: "inner accesses 'a' and 'c' from its Closure Memory. 'b' no longer exists anywhere.",
      toastMessage: "Logging a and c",
      consoleOutput: ["10 hello"],
      callStack: [
        {
          id: "inner_1",
          name: "inner() FEC",
          phase: "Execution Phase",
          variables: [],
          outerEnvironment: "Closure (outer)",
        },
        {
          id: "closure_outer_1",
          name: "Closure (outer)",
          phase: "Execution Phase",
          variables: [
            { name: "c", value: '"hello"' },
            { name: "a", value: "10" },
          ],
          outerEnvironment: "Global Execution Context",
          isClosure: true
        },
        {
          id: "global",
          name: "Global Execution Context",
          phase: "Execution Phase",
          variables: [
            { name: "outer", value: "Function Object" },
            { name: "func", value: "inner (Function)" }
          ],
          outerEnvironment: null,
        }
      ]
    },
    {
      currentLine: null,
      explanation: "func() finishes. inner() EC is destroyed.",
      toastMessage: "inner EC Destroyed",
      consoleOutput: ["10 hello"],
      callStack: [
        {
          id: "closure_outer_1",
          name: "Closure (outer)",
          phase: "Execution Phase",
          variables: [
            { name: "c", value: '"hello"' },
            { name: "a", value: "10" },
          ],
          outerEnvironment: "Global Execution Context",
          isClosure: true
        },
        {
          id: "global",
          name: "Global Execution Context",
          phase: "Execution Phase",
          variables: [
            { name: "outer", value: "Function Object" },
            { name: "func", value: "inner (Function)" }
          ],
          outerEnvironment: null,
        }
      ]
    },
    {
      currentLine: null,
      explanation: "Program Finished. Global Execution Context is destroyed.",
      toastMessage: "Program Finished",
      consoleOutput: ["10 hello"],
      callStack: []
    }
  ]
};

export const CLOSURE_SCENARIO_3: SimulationScenario = {
  id: "closure-data-hiding",
  title: "3. Data Hiding (Private Variables)",
  code: `function Counter() {
  let count = 0;

  return {
    increment() { return ++count; },
    getCount() { return count; }
  };
}

const c = Counter();
c.increment();
c.increment();
console.log(c.count);`,
  steps: [
    {
      currentLine: null,
      explanation: "Engine initialized. Preparing to parse and execute code.",
      toastMessage: "Engine Initialized",
      consoleOutput: [],
      callStack: []
    },
    {
      currentLine: null,
      explanation: "Global Creation Phase. 'Counter' is allocated, 'c' is in TDZ.",
      toastMessage: "Global Creation Phase",
      consoleOutput: [],
      callStack: [
        {
          id: "global",
          name: "Global Execution Context",
          phase: "Creation Phase",
          variables: [
            { name: "Counter", value: "Function Object" },
            { name: "c", value: "<TDZ>" }
          ],
          outerEnvironment: null,
        }
      ]
    },
    {
      currentLine: 10,
      explanation: "Counter() is called to initialize 'c'.",
      toastMessage: "Calling Counter()",
      consoleOutput: [],
      callStack: [
        {
          id: "global",
          name: "Global Execution Context",
          phase: "Execution Phase",
          variables: [
            { name: "Counter", value: "Function Object" },
            { name: "c", value: "<uninitialized>" }
          ],
          outerEnvironment: null,
        }
      ]
    },
    {
      currentLine: 1,
      explanation: "Counter() Execution Context is created. 'count' is hoisted into TDZ.",
      toastMessage: "Counter() Creation Phase",
      consoleOutput: [],
      callStack: [
        {
          id: "counter_1",
          name: "Counter() FEC",
          phase: "Creation Phase",
          variables: [
            { name: "count", value: "<TDZ>" }
          ],
          outerEnvironment: "Global Execution Context",
        },
        {
          id: "global",
          name: "Global Execution Context",
          phase: "Execution Phase",
          variables: [
            { name: "Counter", value: "Function Object" },
            { name: "c", value: "<uninitialized>" }
          ],
          outerEnvironment: null,
        }
      ]
    },
    {
      currentLine: 2,
      explanation: "Execution Phase begins. We execute the variable assignment for 'count'.",
      toastMessage: "let count = 0",
      consoleOutput: [],
      callStack: [
        {
          id: "counter_1",
          name: "Counter() FEC",
          phase: "Execution Phase",
          variables: [
            { name: "count", value: "0" }
          ],
          outerEnvironment: "Global Execution Context",
        },
        {
          id: "global",
          name: "Global Execution Context",
          phase: "Execution Phase",
          variables: [
            { name: "Counter", value: "Function Object" },
            { name: "c", value: "<uninitialized>" }
          ],
          outerEnvironment: null,
        }
      ]
    },
    {
      currentLine: 4,
      explanation: "Counter() returns an object containing methods that close over 'count'.",
      toastMessage: "Returning methods",
      consoleOutput: [],
      callStack: [
        {
          id: "counter_1",
          name: "Counter() FEC",
          phase: "Execution Phase",
          variables: [
            { name: "count", value: "0" }
          ],
          outerEnvironment: "Global Execution Context",
        },
        {
          id: "global",
          name: "Global Execution Context",
          phase: "Execution Phase",
          variables: [
            { name: "Counter", value: "Function Object" },
            { name: "c", value: "<uninitialized>" }
          ],
          outerEnvironment: null,
        }
      ]
    },
    {
      currentLine: 10,
      explanation: "Counter() EC is destroyed, but 'count' is preserved in Closure Memory. 'c' is assigned the object.",
      toastMessage: "Closure Memory Created",
      consoleOutput: [],
      callStack: [
        {
          id: "closure_counter_1",
          name: "Closure (Counter)",
          phase: "Execution Phase",
          variables: [
            { name: "count", value: "0" }
          ],
          outerEnvironment: "Global Execution Context",
          isClosure: true
        },
        {
          id: "global",
          name: "Global Execution Context",
          phase: "Execution Phase",
          variables: [
            { name: "Counter", value: "Function Object" },
            { name: "c", value: "{ increment: fn, getCount: fn }" }
          ],
          outerEnvironment: null,
        }
      ]
    },
    {
      currentLine: 11,
      explanation: "We invoke c.increment().",
      toastMessage: "Calling c.increment()",
      consoleOutput: [],
      callStack: [
        {
          id: "closure_counter_1",
          name: "Closure (Counter)",
          phase: "Execution Phase",
          variables: [
            { name: "count", value: "0" }
          ],
          outerEnvironment: "Global Execution Context",
          isClosure: true
        },
        {
          id: "global",
          name: "Global Execution Context",
          phase: "Execution Phase",
          variables: [
            { name: "Counter", value: "Function Object" },
            { name: "c", value: "{ increment: fn, getCount: fn }" }
          ],
          outerEnvironment: null,
        }
      ]
    },
    {
      currentLine: 5,
      explanation: "increment() EC is created (Creation Phase).",
      toastMessage: "increment() Creation Phase",
      consoleOutput: [],
      callStack: [
        {
          id: "increment_1",
          name: "increment() FEC",
          phase: "Creation Phase",
          variables: [],
          outerEnvironment: "Closure (Counter)",
        },
        {
          id: "closure_counter_1",
          name: "Closure (Counter)",
          phase: "Execution Phase",
          variables: [
            { name: "count", value: "0" }
          ],
          outerEnvironment: "Global Execution Context",
          isClosure: true
        },
        {
          id: "global",
          name: "Global Execution Context",
          phase: "Execution Phase",
          variables: [
            { name: "Counter", value: "Function Object" },
            { name: "c", value: "{ increment: fn, getCount: fn }" }
          ],
          outerEnvironment: null,
        }
      ]
    },
    {
      currentLine: 5,
      explanation: "Executing ++count. It searches for 'count', finds it in Closure Memory, and updates it to 1.",
      toastMessage: "count incremented to 1",
      consoleOutput: [],
      callStack: [
        {
          id: "increment_1",
          name: "increment() FEC",
          phase: "Execution Phase",
          variables: [],
          outerEnvironment: "Closure (Counter)",
        },
        {
          id: "closure_counter_1",
          name: "Closure (Counter)",
          phase: "Execution Phase",
          variables: [
            { name: "count", value: "1" }
          ],
          outerEnvironment: "Global Execution Context",
          isClosure: true
        },
        {
          id: "global",
          name: "Global Execution Context",
          phase: "Execution Phase",
          variables: [
            { name: "Counter", value: "Function Object" },
            { name: "c", value: "{ increment: fn, getCount: fn }" }
          ],
          outerEnvironment: null,
        }
      ]
    },
    {
      currentLine: null,
      explanation: "increment() finishes and is popped off.",
      toastMessage: "increment() EC Destroyed",
      consoleOutput: [],
      callStack: [
        {
          id: "closure_counter_1",
          name: "Closure (Counter)",
          phase: "Execution Phase",
          variables: [
            { name: "count", value: "1" }
          ],
          outerEnvironment: "Global Execution Context",
          isClosure: true
        },
        {
          id: "global",
          name: "Global Execution Context",
          phase: "Execution Phase",
          variables: [
            { name: "Counter", value: "Function Object" },
            { name: "c", value: "{ increment: fn, getCount: fn }" }
          ],
          outerEnvironment: null,
        }
      ]
    },
    {
      currentLine: 12,
      explanation: "c.increment() is called again.",
      toastMessage: "Calling c.increment()",
      consoleOutput: [],
      callStack: [
        {
          id: "closure_counter_1",
          name: "Closure (Counter)",
          phase: "Execution Phase",
          variables: [
            { name: "count", value: "1" }
          ],
          outerEnvironment: "Global Execution Context",
          isClosure: true
        },
        {
          id: "global",
          name: "Global Execution Context",
          phase: "Execution Phase",
          variables: [
            { name: "Counter", value: "Function Object" },
            { name: "c", value: "{ increment: fn, getCount: fn }" }
          ],
          outerEnvironment: null,
        }
      ]
    },
    {
      currentLine: 5,
      explanation: "increment() EC created.",
      toastMessage: "increment() Creation Phase",
      consoleOutput: [],
      callStack: [
        {
          id: "increment_2",
          name: "increment() FEC",
          phase: "Creation Phase",
          variables: [],
          outerEnvironment: "Closure (Counter)",
        },
        {
          id: "closure_counter_1",
          name: "Closure (Counter)",
          phase: "Execution Phase",
          variables: [
            { name: "count", value: "1" }
          ],
          outerEnvironment: "Global Execution Context",
          isClosure: true
        },
        {
          id: "global",
          name: "Global Execution Context",
          phase: "Execution Phase",
          variables: [
            { name: "Counter", value: "Function Object" },
            { name: "c", value: "{ increment: fn, getCount: fn }" }
          ],
          outerEnvironment: null,
        }
      ]
    },
    {
      currentLine: 5,
      explanation: "Executing ++count. It updates 'count' in Closure Memory to 2.",
      toastMessage: "count incremented to 2",
      consoleOutput: [],
      callStack: [
        {
          id: "increment_2",
          name: "increment() FEC",
          phase: "Execution Phase",
          variables: [],
          outerEnvironment: "Closure (Counter)",
        },
        {
          id: "closure_counter_1",
          name: "Closure (Counter)",
          phase: "Execution Phase",
          variables: [
            { name: "count", value: "2" }
          ],
          outerEnvironment: "Global Execution Context",
          isClosure: true
        },
        {
          id: "global",
          name: "Global Execution Context",
          phase: "Execution Phase",
          variables: [
            { name: "Counter", value: "Function Object" },
            { name: "c", value: "{ increment: fn, getCount: fn }" }
          ],
          outerEnvironment: null,
        }
      ]
    },
    {
      currentLine: null,
      explanation: "increment() finishes and is popped off.",
      toastMessage: "increment() EC Destroyed",
      consoleOutput: [],
      callStack: [
        {
          id: "closure_counter_1",
          name: "Closure (Counter)",
          phase: "Execution Phase",
          variables: [
            { name: "count", value: "2" }
          ],
          outerEnvironment: "Global Execution Context",
          isClosure: true
        },
        {
          id: "global",
          name: "Global Execution Context",
          phase: "Execution Phase",
          variables: [
            { name: "Counter", value: "Function Object" },
            { name: "c", value: "{ increment: fn, getCount: fn }" }
          ],
          outerEnvironment: null,
        }
      ]
    },
    {
      currentLine: 13,
      explanation: "We try to access c.count directly. But 'count' is NOT a property of the object 'c'.",
      toastMessage: "Accessing c.count",
      consoleOutput: ["undefined"],
      callStack: [
        {
          id: "closure_counter_1",
          name: "Closure (Counter)",
          phase: "Execution Phase",
          variables: [
            { name: "count", value: "2" }
          ],
          outerEnvironment: "Global Execution Context",
          isClosure: true
        },
        {
          id: "global",
          name: "Global Execution Context",
          phase: "Execution Phase",
          variables: [
            { name: "Counter", value: "Function Object" },
            { name: "c", value: "{ increment: fn, getCount: fn }" }
          ],
          outerEnvironment: null,
        }
      ]
    },
    {
      currentLine: 13,
      explanation: "Because it's hidden in the Closure, 'count' is completely protected from the outside world. This achieves Data Privacy.",
      toastMessage: "Data is hidden!",
      consoleOutput: ["undefined"],
      callStack: [
        {
          id: "closure_counter_1",
          name: "Closure (Counter)",
          phase: "Execution Phase",
          variables: [
            { name: "count", value: "2" }
          ],
          outerEnvironment: "Global Execution Context",
          isClosure: true
        },
        {
          id: "global",
          name: "Global Execution Context",
          phase: "Execution Phase",
          variables: [
            { name: "Counter", value: "Function Object" },
            { name: "c", value: "{ increment: fn, getCount: fn }" }
          ],
          outerEnvironment: null,
        }
      ]
    },
    {
      currentLine: null,
      explanation: "Program Finished. The Global Execution Context is destroyed.",
      toastMessage: "Program Finished",
      consoleOutput: ["undefined"],
      callStack: []
    }
  ]
};

export const CLOSURE_SCENARIO_4: SimulationScenario = {
  id: "closure-settimeout",
  title: "4. Closures & setTimeout",
  code: `function outer() {
  var i = 10;

  setTimeout(function() {
    console.log(i);
  }, 3000);

  console.log("outer ends");
}

outer();`,
  steps: [
    {
      currentLine: null,
      explanation: "Engine initialized. Preparing to parse and execute code.",
      toastMessage: "Engine Initialized",
      consoleOutput: [],
      callStack: []
    },
    {
      currentLine: null,
      explanation: "Global Creation Phase.",
      toastMessage: "Global Creation Phase",
      consoleOutput: [],
      callStack: [
        {
          id: "global",
          name: "Global Execution Context",
          phase: "Creation Phase",
          variables: [
            { name: "outer", value: "Function Object" }
          ],
          outerEnvironment: null,
        }
      ]
    },
    {
      currentLine: 11,
      explanation: "Execution Phase begins. We invoke outer().",
      toastMessage: "Calling outer()",
      consoleOutput: [],
      callStack: [
        {
          id: "global",
          name: "Global Execution Context",
          phase: "Execution Phase",
          variables: [
            { name: "outer", value: "Function Object" }
          ],
          outerEnvironment: null,
        }
      ]
    },
    {
      currentLine: 1,
      explanation: "outer() Execution Context is created. Because it's a 'var', 'i' is hoisted and initialized to undefined.",
      toastMessage: "outer() Creation Phase",
      consoleOutput: [],
      callStack: [
        {
          id: "outer_1",
          name: "outer() FEC",
          phase: "Creation Phase",
          variables: [
            { name: "i", value: "undefined" }
          ],
          outerEnvironment: "Global Execution Context",
        },
        {
          id: "global",
          name: "Global Execution Context",
          phase: "Execution Phase",
          variables: [
            { name: "outer", value: "Function Object" }
          ],
          outerEnvironment: null,
        }
      ]
    },
    {
      currentLine: 2,
      explanation: "Execution Phase begins. 'i' is assigned 10.",
      toastMessage: "var i = 10",
      consoleOutput: [],
      callStack: [
        {
          id: "outer_1",
          name: "outer() FEC",
          phase: "Execution Phase",
          variables: [
            { name: "i", value: "10" }
          ],
          outerEnvironment: "Global Execution Context",
        },
        {
          id: "global",
          name: "Global Execution Context",
          phase: "Execution Phase",
          variables: [
            { name: "outer", value: "Function Object" }
          ],
          outerEnvironment: null,
        }
      ]
    },
    {
      currentLine: 4,
      explanation: "Calling setTimeout. setTimeout is a Web API provided by the browser.",
      toastMessage: "Calling setTimeout",
      consoleOutput: [],
      callStack: [
        {
          id: "outer_1",
          name: "outer() FEC",
          phase: "Execution Phase",
          variables: [
            { name: "i", value: "10" }
          ],
          outerEnvironment: "Global Execution Context",
        },
        {
          id: "global",
          name: "Global Execution Context",
          phase: "Execution Phase",
          variables: [
            { name: "outer", value: "Function Object" }
          ],
          outerEnvironment: null,
        }
      ]
    },
    {
      currentLine: 4,
      explanation: "The browser takes the callback function and starts a 3000ms timer in the Web APIs. The JS engine continues.",
      toastMessage: "Callback sent to Web APIs",
      consoleOutput: [],
      taskQueue: [
        { id: "timer_1", name: "Timeout Timer", timeout: "3000ms", callback: "function() {\n  console.log(i);\n}" }
      ],
      callStack: [
        {
          id: "outer_1",
          name: "outer() FEC",
          phase: "Execution Phase",
          variables: [
            { name: "i", value: "10" }
          ],
          outerEnvironment: "Global Execution Context",
        },
        {
          id: "global",
          name: "Global Execution Context",
          phase: "Execution Phase",
          variables: [
            { name: "outer", value: "Function Object" }
          ],
          outerEnvironment: null,
        }
      ]
    },
    {
      currentLine: 8,
      explanation: "Executing console.log('outer ends').",
      toastMessage: "Logging 'outer ends'",
      consoleOutput: ["outer ends"],
      taskQueue: [
        { id: "timer_1", name: "Timeout Timer", timeout: "3000ms", callback: "function() {\n  console.log(i);\n}" }
      ],
      callStack: [
        {
          id: "outer_1",
          name: "outer() FEC",
          phase: "Execution Phase",
          variables: [
            { name: "i", value: "10" }
          ],
          outerEnvironment: "Global Execution Context",
        },
        {
          id: "global",
          name: "Global Execution Context",
          phase: "Execution Phase",
          variables: [
            { name: "outer", value: "Function Object" }
          ],
          outerEnvironment: null,
        }
      ]
    },
    {
      currentLine: 9,
      explanation: "outer() finishes execution. Its EC is destroyed. But because the callback in the Web APIs still references 'i', Closure Memory is created!",
      toastMessage: "Closure Memory created",
      consoleOutput: ["outer ends"],
      taskQueue: [
        { id: "timer_1", name: "Timeout Timer", timeout: "3000ms", callback: "function() {\n  console.log(i);\n}" }
      ],
      callStack: [
        {
          id: "closure_outer_1",
          name: "Closure (outer)",
          phase: "Execution Phase",
          variables: [
            { name: "i", value: "10" }
          ],
          outerEnvironment: "Global Execution Context",
          isClosure: true
        },
        {
          id: "global",
          name: "Global Execution Context",
          phase: "Execution Phase",
          variables: [
            { name: "outer", value: "Function Object" }
          ],
          outerEnvironment: null,
        }
      ]
    },
    {
      currentLine: null,
      explanation: "3 seconds pass. The timer finishes, and the callback is pushed to the Task Queue, then moved to the Call Stack by the Event Loop.",
      toastMessage: "Timer finished",
      consoleOutput: ["outer ends"],
      taskQueue: [],
      callStack: [
        {
          id: "callback_1",
          name: "callback() FEC",
          phase: "Creation Phase",
          variables: [],
          outerEnvironment: "Closure (outer)",
        },
        {
          id: "closure_outer_1",
          name: "Closure (outer)",
          phase: "Execution Phase",
          variables: [
            { name: "i", value: "10" }
          ],
          outerEnvironment: "Global Execution Context",
          isClosure: true
        },
        {
          id: "global",
          name: "Global Execution Context",
          phase: "Execution Phase",
          variables: [
            { name: "outer", value: "Function Object" }
          ],
          outerEnvironment: null,
        }
      ]
    },
    {
      currentLine: 5,
      explanation: "The callback searches for 'i', finds it in the Closure Memory, and prints 10. The closure preserved 'i' even though outer() died 3 seconds ago!",
      toastMessage: "Logging i = 10",
      consoleOutput: ["outer ends", "10"],
      callStack: [
        {
          id: "callback_1",
          name: "callback() FEC",
          phase: "Execution Phase",
          variables: [],
          outerEnvironment: "Closure (outer)",
        },
        {
          id: "closure_outer_1",
          name: "Closure (outer)",
          phase: "Execution Phase",
          variables: [
            { name: "i", value: "10" }
          ],
          outerEnvironment: "Global Execution Context",
          isClosure: true
        },
        {
          id: "global",
          name: "Global Execution Context",
          phase: "Execution Phase",
          variables: [
            { name: "outer", value: "Function Object" }
          ],
          outerEnvironment: null,
        }
      ]
    },
    {
      currentLine: null,
      explanation: "The callback finishes and is popped off the Call Stack.",
      toastMessage: "callback EC Destroyed",
      consoleOutput: ["outer ends", "10"],
      callStack: [
        {
          id: "closure_outer_1",
          name: "Closure (outer)",
          phase: "Execution Phase",
          variables: [
            { name: "i", value: "10" }
          ],
          outerEnvironment: "Global Execution Context",
          isClosure: true
        },
        {
          id: "global",
          name: "Global Execution Context",
          phase: "Execution Phase",
          variables: [
            { name: "outer", value: "Function Object" }
          ],
          outerEnvironment: null,
        }
      ]
    },
    {
      currentLine: null,
      explanation: "Program Finished. The Global Execution Context is destroyed.",
      toastMessage: "Program Finished",
      consoleOutput: ["outer ends", "10"],
      callStack: []
    }
  ]
};

export const CLOSURE_SCENARIO_5: SimulationScenario = {
  id: "closure-loop-problem",
  title: "5. The Famous var Loop Problem",
  code: `for (var i = 1; i <= 3; i++) {
  setTimeout(function() {
    console.log(i);
  }, i * 1000);
}`,
  steps: [
    {
      currentLine: null,
      explanation: "Engine initialized. Preparing to parse and execute code.",
      toastMessage: "Engine Initialized",
      consoleOutput: [],
      callStack: []
    },
    {
      currentLine: null,
      explanation: "Global Creation Phase. Because 'var' is function-scoped (or globally scoped here), 'i' is hoisted to undefined.",
      toastMessage: "Global Creation Phase",
      consoleOutput: [],
      callStack: [
        {
          id: "global",
          name: "Global Execution Context",
          phase: "Creation Phase",
          variables: [
            { name: "i", value: "undefined" }
          ],
          outerEnvironment: null,
        }
      ]
    },
    {
      currentLine: 1,
      explanation: "Execution Phase. The loop starts. First initialization: var i = 1.",
      toastMessage: "i = 1",
      consoleOutput: [],
      callStack: [
        {
          id: "global",
          name: "Global Execution Context",
          phase: "Execution Phase",
          variables: [
            { name: "i", value: "1" }
          ],
          outerEnvironment: null,
        }
      ]
    },
    {
      currentLine: 2,
      explanation: "Iteration 1: setTimeout is called. A timer is sent to the Web APIs.",
      toastMessage: "Timer 1 sent",
      consoleOutput: [],
      taskQueue: [
        { id: "timer_1", name: "Timer 1", timeout: "1000ms", callback: "function() { console.log(i); }" }
      ],
      callStack: [
        {
          id: "global",
          name: "Global Execution Context",
          phase: "Execution Phase",
          variables: [
            { name: "i", value: "1" }
          ],
          outerEnvironment: null,
        }
      ]
    },
    {
      currentLine: 1,
      explanation: "Loop iterates. i++ executes. i becomes 2.",
      toastMessage: "i = 2",
      consoleOutput: [],
      taskQueue: [
        { id: "timer_1", name: "Timer 1", timeout: "1000ms", callback: "function() { console.log(i); }" }
      ],
      callStack: [
        {
          id: "global",
          name: "Global Execution Context",
          phase: "Execution Phase",
          variables: [
            { name: "i", value: "2" }
          ],
          outerEnvironment: null,
        }
      ]
    },
    {
      currentLine: 2,
      explanation: "Iteration 2: setTimeout is called. Another timer is sent to the Web APIs.",
      toastMessage: "Timer 2 sent",
      consoleOutput: [],
      taskQueue: [
        { id: "timer_1", name: "Timer 1", timeout: "1000ms", callback: "function() { console.log(i); }" },
        { id: "timer_2", name: "Timer 2", timeout: "2000ms", callback: "function() { console.log(i); }" }
      ],
      callStack: [
        {
          id: "global",
          name: "Global Execution Context",
          phase: "Execution Phase",
          variables: [
            { name: "i", value: "2" }
          ],
          outerEnvironment: null,
        }
      ]
    },
    {
      currentLine: 1,
      explanation: "Loop iterates. i++ executes. i becomes 3.",
      toastMessage: "i = 3",
      consoleOutput: [],
      taskQueue: [
        { id: "timer_1", name: "Timer 1", timeout: "1000ms", callback: "function() { console.log(i); }" },
        { id: "timer_2", name: "Timer 2", timeout: "2000ms", callback: "function() { console.log(i); }" }
      ],
      callStack: [
        {
          id: "global",
          name: "Global Execution Context",
          phase: "Execution Phase",
          variables: [
            { name: "i", value: "3" }
          ],
          outerEnvironment: null,
        }
      ]
    },
    {
      currentLine: 2,
      explanation: "Iteration 3: setTimeout is called. A third timer is sent to the Web APIs.",
      toastMessage: "Timer 3 sent",
      consoleOutput: [],
      taskQueue: [
        { id: "timer_1", name: "Timer 1", timeout: "1000ms", callback: "function() { console.log(i); }" },
        { id: "timer_2", name: "Timer 2", timeout: "2000ms", callback: "function() { console.log(i); }" },
        { id: "timer_3", name: "Timer 3", timeout: "3000ms", callback: "function() { console.log(i); }" }
      ],
      callStack: [
        {
          id: "global",
          name: "Global Execution Context",
          phase: "Execution Phase",
          variables: [
            { name: "i", value: "3" }
          ],
          outerEnvironment: null,
        }
      ]
    },
    {
      currentLine: 1,
      explanation: "Loop iterates one last time. i becomes 4. The condition i <= 3 fails, and the loop ends.",
      toastMessage: "i = 4, Loop Ends",
      consoleOutput: [],
      taskQueue: [
        { id: "timer_1", name: "Timer 1", timeout: "1000ms", callback: "function() { console.log(i); }" },
        { id: "timer_2", name: "Timer 2", timeout: "2000ms", callback: "function() { console.log(i); }" },
        { id: "timer_3", name: "Timer 3", timeout: "3000ms", callback: "function() { console.log(i); }" }
      ],
      callStack: [
        {
          id: "global",
          name: "Global Execution Context",
          phase: "Execution Phase",
          variables: [
            { name: "i", value: "4" }
          ],
          outerEnvironment: null,
        }
      ]
    },
    {
      currentLine: null,
      explanation: "Notice what happened to 'i' in the Global Memory. The loop finished, so i = 4. ALL three callbacks point to this EXACT SAME memory location!",
      toastMessage: "i is now 4",
      consoleOutput: [],
      taskQueue: [
        { id: "timer_1", name: "Timer 1", timeout: "1000ms", callback: "function() { console.log(i); }" },
        { id: "timer_2", name: "Timer 2", timeout: "2000ms", callback: "function() { console.log(i); }" },
        { id: "timer_3", name: "Timer 3", timeout: "3000ms", callback: "function() { console.log(i); }" }
      ],
      callStack: [
        {
          id: "global",
          name: "Global Execution Context",
          phase: "Execution Phase",
          variables: [
            { name: "i", value: "4" }
          ],
          outerEnvironment: null,
        }
      ]
    },
    {
      currentLine: null,
      explanation: "1 second passes. Timer 1 finishes. The callback is created in the Call Stack (Creation Phase).",
      toastMessage: "Timer 1 callback Created",
      consoleOutput: [],
      taskQueue: [
        { id: "timer_2", name: "Timer 2", timeout: "2000ms", callback: "function() { console.log(i); }" },
        { id: "timer_3", name: "Timer 3", timeout: "3000ms", callback: "function() { console.log(i); }" }
      ],
      callStack: [
        {
          id: "callback_1",
          name: "callback() FEC",
          phase: "Creation Phase",
          variables: [],
          outerEnvironment: "Global Execution Context",
        },
        {
          id: "global",
          name: "Global Execution Context",
          phase: "Execution Phase",
          variables: [
            { name: "i", value: "4" }
          ],
          outerEnvironment: null,
        }
      ]
    },
    {
      currentLine: 3,
      explanation: "It looks up 'i', finds it in Global memory, and prints 4.",
      toastMessage: "Timer 1 prints 4",
      consoleOutput: ["4"],
      taskQueue: [
        { id: "timer_2", name: "Timer 2", timeout: "2000ms", callback: "function() { console.log(i); }" },
        { id: "timer_3", name: "Timer 3", timeout: "3000ms", callback: "function() { console.log(i); }" }
      ],
      callStack: [
        {
          id: "callback_1",
          name: "callback() FEC",
          phase: "Execution Phase",
          variables: [],
          outerEnvironment: "Global Execution Context",
        },
        {
          id: "global",
          name: "Global Execution Context",
          phase: "Execution Phase",
          variables: [
            { name: "i", value: "4" }
          ],
          outerEnvironment: null,
        }
      ]
    },
    {
      currentLine: null,
      explanation: "Timer 1 callback is popped off the stack.",
      toastMessage: "Timer 1 Destroyed",
      consoleOutput: ["4"],
      taskQueue: [
        { id: "timer_2", name: "Timer 2", timeout: "2000ms", callback: "function() { console.log(i); }" },
        { id: "timer_3", name: "Timer 3", timeout: "3000ms", callback: "function() { console.log(i); }" }
      ],
      callStack: [
        {
          id: "global",
          name: "Global Execution Context",
          phase: "Execution Phase",
          variables: [
            { name: "i", value: "4" }
          ],
          outerEnvironment: null,
        }
      ]
    },
    {
      currentLine: null,
      explanation: "2 seconds pass. Timer 2 finishes. Its callback is pushed to the stack.",
      toastMessage: "Timer 2 callback Created",
      consoleOutput: ["4"],
      taskQueue: [
        { id: "timer_3", name: "Timer 3", timeout: "3000ms", callback: "function() { console.log(i); }" }
      ],
      callStack: [
        {
          id: "callback_2",
          name: "callback() FEC",
          phase: "Creation Phase",
          variables: [],
          outerEnvironment: "Global Execution Context",
        },
        {
          id: "global",
          name: "Global Execution Context",
          phase: "Execution Phase",
          variables: [
            { name: "i", value: "4" }
          ],
          outerEnvironment: null,
        }
      ]
    },
    {
      currentLine: 3,
      explanation: "It also points to the exact same 'i', which is still 4.",
      toastMessage: "Timer 2 prints 4",
      consoleOutput: ["4", "4"],
      taskQueue: [
        { id: "timer_3", name: "Timer 3", timeout: "3000ms", callback: "function() { console.log(i); }" }
      ],
      callStack: [
        {
          id: "callback_2",
          name: "callback() FEC",
          phase: "Execution Phase",
          variables: [],
          outerEnvironment: "Global Execution Context",
        },
        {
          id: "global",
          name: "Global Execution Context",
          phase: "Execution Phase",
          variables: [
            { name: "i", value: "4" }
          ],
          outerEnvironment: null,
        }
      ]
    },
    {
      currentLine: null,
      explanation: "Timer 2 callback is popped off the stack.",
      toastMessage: "Timer 2 Destroyed",
      consoleOutput: ["4", "4"],
      taskQueue: [
        { id: "timer_3", name: "Timer 3", timeout: "3000ms", callback: "function() { console.log(i); }" }
      ],
      callStack: [
        {
          id: "global",
          name: "Global Execution Context",
          phase: "Execution Phase",
          variables: [
            { name: "i", value: "4" }
          ],
          outerEnvironment: null,
        }
      ]
    },
    {
      currentLine: null,
      explanation: "3 seconds pass. Timer 3 finishes. Its callback is pushed.",
      toastMessage: "Timer 3 callback Created",
      consoleOutput: ["4", "4"],
      taskQueue: [],
      callStack: [
        {
          id: "callback_3",
          name: "callback() FEC",
          phase: "Creation Phase",
          variables: [],
          outerEnvironment: "Global Execution Context",
        },
        {
          id: "global",
          name: "Global Execution Context",
          phase: "Execution Phase",
          variables: [
            { name: "i", value: "4" }
          ],
          outerEnvironment: null,
        }
      ]
    },
    {
      currentLine: 3,
      explanation: "It prints 4 again. Because 'var' doesn't have block scope, there was only ever ONE 'i' in memory!",
      toastMessage: "Timer 3 prints 4",
      consoleOutput: ["4", "4", "4"],
      taskQueue: [],
      callStack: [
        {
          id: "callback_3",
          name: "callback() FEC",
          phase: "Execution Phase",
          variables: [],
          outerEnvironment: "Global Execution Context",
        },
        {
          id: "global",
          name: "Global Execution Context",
          phase: "Execution Phase",
          variables: [
            { name: "i", value: "4" }
          ],
          outerEnvironment: null,
        }
      ]
    },
    {
      currentLine: null,
      explanation: "Timer 3 callback is popped off the stack.",
      toastMessage: "Timer 3 Destroyed",
      consoleOutput: ["4", "4", "4"],
      taskQueue: [],
      callStack: [
        {
          id: "global",
          name: "Global Execution Context",
          phase: "Execution Phase",
          variables: [
            { name: "i", value: "4" }
          ],
          outerEnvironment: null,
        }
      ]
    },
    {
      currentLine: null,
      explanation: "Program Finished. Global Execution Context is destroyed.",
      toastMessage: "Program Finished",
      consoleOutput: ["4", "4", "4"],
      callStack: []
    }
  ]
};

export const CLOSURE_SCENARIO_6: SimulationScenario = {
  id: "closure-let-fixes-it",
  title: "6. How 'let' Fixes the Loop",
  code: `for (let i = 1; i <= 3; i++) {
  setTimeout(function() {
    console.log(i);
  }, i * 1000);
}`,
  steps: [
    {
      currentLine: null,
      explanation: "Engine initialized. Preparing to parse and execute code.",
      toastMessage: "Engine Initialized",
      consoleOutput: [],
      callStack: []
    },
    {
      currentLine: null,
      explanation: "Global Creation Phase. 'let' is block-scoped, so no 'i' is hoisted to the global context.",
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
      ]
    },
    {
      currentLine: 1,
      explanation: "Loop starts. Iteration 1: Because 'let' is block-scoped, a NEW block scope is created for this iteration. i = 1.",
      toastMessage: "Block #1 Created",
      consoleOutput: [],
      callStack: [
        {
          id: "closure_loop_1",
          name: "Closure (Block #1)",
          phase: "Execution Phase",
          variables: [{ name: "i", value: "1" }],
          outerEnvironment: "Global Execution Context",
          isClosure: true
        },
        {
          id: "global",
          name: "Global Execution Context",
          phase: "Execution Phase",
          variables: [],
          outerEnvironment: null,
        }
      ]
    },
    {
      currentLine: 2,
      explanation: "setTimeout is called. Timer 1 is sent to Web APIs. It closes over Block #1 where i = 1.",
      toastMessage: "Timer 1 sent",
      consoleOutput: [],
      taskQueue: [
        { id: "timer_1", name: "Timer 1", timeout: "1000ms", callback: "function() { console.log(i); }" }
      ],
      callStack: [
        {
          id: "closure_loop_1",
          name: "Closure (Block #1)",
          phase: "Execution Phase",
          variables: [{ name: "i", value: "1" }],
          outerEnvironment: "Global Execution Context",
          isClosure: true
        },
        {
          id: "global",
          name: "Global Execution Context",
          phase: "Execution Phase",
          variables: [],
          outerEnvironment: null,
        }
      ]
    },
    {
      currentLine: 1,
      explanation: "Loop iterates. Iteration 2: A brand new block scope is created. i = 2.",
      toastMessage: "Block #2 Created",
      consoleOutput: [],
      taskQueue: [
        { id: "timer_1", name: "Timer 1", timeout: "1000ms", callback: "function() { console.log(i); }" }
      ],
      callStack: [
        {
          id: "closure_loop_2",
          name: "Closure (Block #2)",
          phase: "Execution Phase",
          variables: [{ name: "i", value: "2" }],
          outerEnvironment: "Global Execution Context",
          isClosure: true
        },
        {
          id: "closure_loop_1",
          name: "Closure (Block #1)",
          phase: "Execution Phase",
          variables: [{ name: "i", value: "1" }],
          outerEnvironment: "Global Execution Context",
          isClosure: true
        },
        {
          id: "global",
          name: "Global Execution Context",
          phase: "Execution Phase",
          variables: [],
          outerEnvironment: null,
        }
      ]
    },
    {
      currentLine: 2,
      explanation: "setTimeout is called. Timer 2 is sent to Web APIs. It closes over Block #2 where i = 2.",
      toastMessage: "Timer 2 sent",
      consoleOutput: [],
      taskQueue: [
        { id: "timer_1", name: "Timer 1", timeout: "1000ms", callback: "function() { console.log(i); }" },
        { id: "timer_2", name: "Timer 2", timeout: "2000ms", callback: "function() { console.log(i); }" }
      ],
      callStack: [
        {
          id: "closure_loop_2",
          name: "Closure (Block #2)",
          phase: "Execution Phase",
          variables: [{ name: "i", value: "2" }],
          outerEnvironment: "Global Execution Context",
          isClosure: true
        },
        {
          id: "closure_loop_1",
          name: "Closure (Block #1)",
          phase: "Execution Phase",
          variables: [{ name: "i", value: "1" }],
          outerEnvironment: "Global Execution Context",
          isClosure: true
        },
        {
          id: "global",
          name: "Global Execution Context",
          phase: "Execution Phase",
          variables: [],
          outerEnvironment: null,
        }
      ]
    },
    {
      currentLine: 1,
      explanation: "Loop iterates. Iteration 3: Another brand new block scope is created. i = 3.",
      toastMessage: "Block #3 Created",
      consoleOutput: [],
      taskQueue: [
        { id: "timer_1", name: "Timer 1", timeout: "1000ms", callback: "function() { console.log(i); }" },
        { id: "timer_2", name: "Timer 2", timeout: "2000ms", callback: "function() { console.log(i); }" }
      ],
      callStack: [
        {
          id: "closure_loop_3",
          name: "Closure (Block #3)",
          phase: "Execution Phase",
          variables: [{ name: "i", value: "3" }],
          outerEnvironment: "Global Execution Context",
          isClosure: true
        },
        {
          id: "closure_loop_2",
          name: "Closure (Block #2)",
          phase: "Execution Phase",
          variables: [{ name: "i", value: "2" }],
          outerEnvironment: "Global Execution Context",
          isClosure: true
        },
        {
          id: "closure_loop_1",
          name: "Closure (Block #1)",
          phase: "Execution Phase",
          variables: [{ name: "i", value: "1" }],
          outerEnvironment: "Global Execution Context",
          isClosure: true
        },
        {
          id: "global",
          name: "Global Execution Context",
          phase: "Execution Phase",
          variables: [],
          outerEnvironment: null,
        }
      ]
    },
    {
      currentLine: 2,
      explanation: "setTimeout is called. Timer 3 is sent to Web APIs. It closes over Block #3 where i = 3.",
      toastMessage: "Timer 3 sent",
      consoleOutput: [],
      taskQueue: [
        { id: "timer_1", name: "Timer 1", timeout: "1000ms", callback: "function() { console.log(i); }" },
        { id: "timer_2", name: "Timer 2", timeout: "2000ms", callback: "function() { console.log(i); }" },
        { id: "timer_3", name: "Timer 3", timeout: "3000ms", callback: "function() { console.log(i); }" }
      ],
      callStack: [
        {
          id: "closure_loop_3",
          name: "Closure (Block #3)",
          phase: "Execution Phase",
          variables: [{ name: "i", value: "3" }],
          outerEnvironment: "Global Execution Context",
          isClosure: true
        },
        {
          id: "closure_loop_2",
          name: "Closure (Block #2)",
          phase: "Execution Phase",
          variables: [{ name: "i", value: "2" }],
          outerEnvironment: "Global Execution Context",
          isClosure: true
        },
        {
          id: "closure_loop_1",
          name: "Closure (Block #1)",
          phase: "Execution Phase",
          variables: [{ name: "i", value: "1" }],
          outerEnvironment: "Global Execution Context",
          isClosure: true
        },
        {
          id: "global",
          name: "Global Execution Context",
          phase: "Execution Phase",
          variables: [],
          outerEnvironment: null,
        }
      ]
    },
    {
      currentLine: 1,
      explanation: "Loop iterates. i becomes 4. The condition i <= 3 fails, and the loop ends.",
      toastMessage: "Loop Ends",
      consoleOutput: [],
      taskQueue: [
        { id: "timer_1", name: "Timer 1", timeout: "1000ms", callback: "function() { console.log(i); }" },
        { id: "timer_2", name: "Timer 2", timeout: "2000ms", callback: "function() { console.log(i); }" },
        { id: "timer_3", name: "Timer 3", timeout: "3000ms", callback: "function() { console.log(i); }" }
      ],
      callStack: [
        {
          id: "closure_loop_3",
          name: "Closure (Block #3)",
          phase: "Execution Phase",
          variables: [{ name: "i", value: "3" }],
          outerEnvironment: "Global Execution Context",
          isClosure: true
        },
        {
          id: "closure_loop_2",
          name: "Closure (Block #2)",
          phase: "Execution Phase",
          variables: [{ name: "i", value: "2" }],
          outerEnvironment: "Global Execution Context",
          isClosure: true
        },
        {
          id: "closure_loop_1",
          name: "Closure (Block #1)",
          phase: "Execution Phase",
          variables: [{ name: "i", value: "1" }],
          outerEnvironment: "Global Execution Context",
          isClosure: true
        },
        {
          id: "global",
          name: "Global Execution Context",
          phase: "Execution Phase",
          variables: [],
          outerEnvironment: null,
        }
      ]
    },
    {
      currentLine: null,
      explanation: "1 second passes. Timer 1 finishes. The callback is pushed to the Call Stack (Creation Phase).",
      toastMessage: "Timer 1 callback Created",
      consoleOutput: [],
      taskQueue: [
        { id: "timer_2", name: "Timer 2", timeout: "2000ms", callback: "function() { console.log(i); }" },
        { id: "timer_3", name: "Timer 3", timeout: "3000ms", callback: "function() { console.log(i); }" }
      ],
      callStack: [
        {
          id: "callback_1",
          name: "callback() FEC",
          phase: "Creation Phase",
          variables: [],
          outerEnvironment: "Closure (Block #1)",
        },
        {
          id: "closure_loop_3",
          name: "Closure (Block #3)",
          phase: "Execution Phase",
          variables: [{ name: "i", value: "3" }],
          outerEnvironment: "Global Execution Context",
          isClosure: true
        },
        {
          id: "closure_loop_2",
          name: "Closure (Block #2)",
          phase: "Execution Phase",
          variables: [{ name: "i", value: "2" }],
          outerEnvironment: "Global Execution Context",
          isClosure: true
        },
        {
          id: "closure_loop_1",
          name: "Closure (Block #1)",
          phase: "Execution Phase",
          variables: [{ name: "i", value: "1" }],
          outerEnvironment: "Global Execution Context",
          isClosure: true
        },
        {
          id: "global",
          name: "Global Execution Context",
          phase: "Execution Phase",
          variables: [],
          outerEnvironment: null,
        }
      ]
    },
    {
      currentLine: 3,
      explanation: "It looks up 'i', and finds it in its own unique Closure (Block #1). It prints 1.",
      toastMessage: "Timer 1 prints 1",
      consoleOutput: ["1"],
      taskQueue: [
        { id: "timer_2", name: "Timer 2", timeout: "2000ms", callback: "function() { console.log(i); }" },
        { id: "timer_3", name: "Timer 3", timeout: "3000ms", callback: "function() { console.log(i); }" }
      ],
      callStack: [
        {
          id: "callback_1",
          name: "callback() FEC",
          phase: "Execution Phase",
          variables: [],
          outerEnvironment: "Closure (Block #1)",
        },
        {
          id: "closure_loop_3",
          name: "Closure (Block #3)",
          phase: "Execution Phase",
          variables: [{ name: "i", value: "3" }],
          outerEnvironment: "Global Execution Context",
          isClosure: true
        },
        {
          id: "closure_loop_2",
          name: "Closure (Block #2)",
          phase: "Execution Phase",
          variables: [{ name: "i", value: "2" }],
          outerEnvironment: "Global Execution Context",
          isClosure: true
        },
        {
          id: "closure_loop_1",
          name: "Closure (Block #1)",
          phase: "Execution Phase",
          variables: [{ name: "i", value: "1" }],
          outerEnvironment: "Global Execution Context",
          isClosure: true
        },
        {
          id: "global",
          name: "Global Execution Context",
          phase: "Execution Phase",
          variables: [],
          outerEnvironment: null,
        }
      ]
    },
    {
      currentLine: null,
      explanation: "Timer 1 callback is popped off the stack.",
      toastMessage: "Timer 1 Destroyed",
      consoleOutput: ["1"],
      taskQueue: [
        { id: "timer_2", name: "Timer 2", timeout: "2000ms", callback: "function() { console.log(i); }" },
        { id: "timer_3", name: "Timer 3", timeout: "3000ms", callback: "function() { console.log(i); }" }
      ],
      callStack: [
        {
          id: "closure_loop_3",
          name: "Closure (Block #3)",
          phase: "Execution Phase",
          variables: [{ name: "i", value: "3" }],
          outerEnvironment: "Global Execution Context",
          isClosure: true
        },
        {
          id: "closure_loop_2",
          name: "Closure (Block #2)",
          phase: "Execution Phase",
          variables: [{ name: "i", value: "2" }],
          outerEnvironment: "Global Execution Context",
          isClosure: true
        },
        {
          id: "closure_loop_1",
          name: "Closure (Block #1)",
          phase: "Execution Phase",
          variables: [{ name: "i", value: "1" }],
          outerEnvironment: "Global Execution Context",
          isClosure: true
        },
        {
          id: "global",
          name: "Global Execution Context",
          phase: "Execution Phase",
          variables: [],
          outerEnvironment: null,
        }
      ]
    },
    {
      currentLine: null,
      explanation: "2 seconds pass. Timer 2 finishes. The callback is pushed to the Call Stack (Creation Phase).",
      toastMessage: "Timer 2 callback Created",
      consoleOutput: ["1"],
      taskQueue: [
        { id: "timer_3", name: "Timer 3", timeout: "3000ms", callback: "function() { console.log(i); }" }
      ],
      callStack: [
        {
          id: "callback_2",
          name: "callback() FEC",
          phase: "Creation Phase",
          variables: [],
          outerEnvironment: "Closure (Block #2)",
        },
        {
          id: "closure_loop_3",
          name: "Closure (Block #3)",
          phase: "Execution Phase",
          variables: [{ name: "i", value: "3" }],
          outerEnvironment: "Global Execution Context",
          isClosure: true
        },
        {
          id: "closure_loop_2",
          name: "Closure (Block #2)",
          phase: "Execution Phase",
          variables: [{ name: "i", value: "2" }],
          outerEnvironment: "Global Execution Context",
          isClosure: true
        },
        {
          id: "closure_loop_1",
          name: "Closure (Block #1)",
          phase: "Execution Phase",
          variables: [{ name: "i", value: "1" }],
          outerEnvironment: "Global Execution Context",
          isClosure: true
        },
        {
          id: "global",
          name: "Global Execution Context",
          phase: "Execution Phase",
          variables: [],
          outerEnvironment: null,
        }
      ]
    },
    {
      currentLine: 3,
      explanation: "It points to Closure (Block #2) and prints 2.",
      toastMessage: "Timer 2 prints 2",
      consoleOutput: ["1", "2"],
      taskQueue: [
        { id: "timer_3", name: "Timer 3", timeout: "3000ms", callback: "function() { console.log(i); }" }
      ],
      callStack: [
        {
          id: "callback_2",
          name: "callback() FEC",
          phase: "Execution Phase",
          variables: [],
          outerEnvironment: "Closure (Block #2)",
        },
        {
          id: "closure_loop_3",
          name: "Closure (Block #3)",
          phase: "Execution Phase",
          variables: [{ name: "i", value: "3" }],
          outerEnvironment: "Global Execution Context",
          isClosure: true
        },
        {
          id: "closure_loop_2",
          name: "Closure (Block #2)",
          phase: "Execution Phase",
          variables: [{ name: "i", value: "2" }],
          outerEnvironment: "Global Execution Context",
          isClosure: true
        },
        {
          id: "closure_loop_1",
          name: "Closure (Block #1)",
          phase: "Execution Phase",
          variables: [{ name: "i", value: "1" }],
          outerEnvironment: "Global Execution Context",
          isClosure: true
        },
        {
          id: "global",
          name: "Global Execution Context",
          phase: "Execution Phase",
          variables: [],
          outerEnvironment: null,
        }
      ]
    },
    {
      currentLine: null,
      explanation: "Timer 2 callback is popped off the stack.",
      toastMessage: "Timer 2 Destroyed",
      consoleOutput: ["1", "2"],
      taskQueue: [
        { id: "timer_3", name: "Timer 3", timeout: "3000ms", callback: "function() { console.log(i); }" }
      ],
      callStack: [
        {
          id: "closure_loop_3",
          name: "Closure (Block #3)",
          phase: "Execution Phase",
          variables: [{ name: "i", value: "3" }],
          outerEnvironment: "Global Execution Context",
          isClosure: true
        },
        {
          id: "closure_loop_2",
          name: "Closure (Block #2)",
          phase: "Execution Phase",
          variables: [{ name: "i", value: "2" }],
          outerEnvironment: "Global Execution Context",
          isClosure: true
        },
        {
          id: "closure_loop_1",
          name: "Closure (Block #1)",
          phase: "Execution Phase",
          variables: [{ name: "i", value: "1" }],
          outerEnvironment: "Global Execution Context",
          isClosure: true
        },
        {
          id: "global",
          name: "Global Execution Context",
          phase: "Execution Phase",
          variables: [],
          outerEnvironment: null,
        }
      ]
    },
    {
      currentLine: null,
      explanation: "3 seconds pass. Timer 3 finishes. The callback is pushed to the Call Stack (Creation Phase).",
      toastMessage: "Timer 3 callback Created",
      consoleOutput: ["1", "2"],
      taskQueue: [],
      callStack: [
        {
          id: "callback_3",
          name: "callback() FEC",
          phase: "Creation Phase",
          variables: [],
          outerEnvironment: "Closure (Block #3)",
        },
        {
          id: "closure_loop_3",
          name: "Closure (Block #3)",
          phase: "Execution Phase",
          variables: [{ name: "i", value: "3" }],
          outerEnvironment: "Global Execution Context",
          isClosure: true
        },
        {
          id: "closure_loop_2",
          name: "Closure (Block #2)",
          phase: "Execution Phase",
          variables: [{ name: "i", value: "2" }],
          outerEnvironment: "Global Execution Context",
          isClosure: true
        },
        {
          id: "closure_loop_1",
          name: "Closure (Block #1)",
          phase: "Execution Phase",
          variables: [{ name: "i", value: "1" }],
          outerEnvironment: "Global Execution Context",
          isClosure: true
        },
        {
          id: "global",
          name: "Global Execution Context",
          phase: "Execution Phase",
          variables: [],
          outerEnvironment: null,
        }
      ]
    },
    {
      currentLine: 3,
      explanation: "By creating a new scope per iteration, 'let' ensures every callback captures its own unique memory! This is the power of Closures + Block Scope.",
      toastMessage: "Timer 3 prints 3",
      consoleOutput: ["1", "2", "3"],
      taskQueue: [],
      callStack: [
        {
          id: "callback_3",
          name: "callback() FEC",
          phase: "Execution Phase",
          variables: [],
          outerEnvironment: "Closure (Block #3)",
        },
        {
          id: "closure_loop_3",
          name: "Closure (Block #3)",
          phase: "Execution Phase",
          variables: [{ name: "i", value: "3" }],
          outerEnvironment: "Global Execution Context",
          isClosure: true
        },
        {
          id: "closure_loop_2",
          name: "Closure (Block #2)",
          phase: "Execution Phase",
          variables: [{ name: "i", value: "2" }],
          outerEnvironment: "Global Execution Context",
          isClosure: true
        },
        {
          id: "closure_loop_1",
          name: "Closure (Block #1)",
          phase: "Execution Phase",
          variables: [{ name: "i", value: "1" }],
          outerEnvironment: "Global Execution Context",
          isClosure: true
        },
        {
          id: "global",
          name: "Global Execution Context",
          phase: "Execution Phase",
          variables: [],
          outerEnvironment: null,
        }
      ]
    },
    {
      currentLine: null,
      explanation: "Timer 3 callback is popped off the stack.",
      toastMessage: "Timer 3 Destroyed",
      consoleOutput: ["1", "2", "3"],
      taskQueue: [],
      callStack: [
        {
          id: "closure_loop_3",
          name: "Closure (Block #3)",
          phase: "Execution Phase",
          variables: [{ name: "i", value: "3" }],
          outerEnvironment: "Global Execution Context",
          isClosure: true
        },
        {
          id: "closure_loop_2",
          name: "Closure (Block #2)",
          phase: "Execution Phase",
          variables: [{ name: "i", value: "2" }],
          outerEnvironment: "Global Execution Context",
          isClosure: true
        },
        {
          id: "closure_loop_1",
          name: "Closure (Block #1)",
          phase: "Execution Phase",
          variables: [{ name: "i", value: "1" }],
          outerEnvironment: "Global Execution Context",
          isClosure: true
        },
        {
          id: "global",
          name: "Global Execution Context",
          phase: "Execution Phase",
          variables: [],
          outerEnvironment: null,
        }
      ]
    },
    {
      currentLine: null,
      explanation: "Program Finished. Global Execution Context is destroyed.",
      toastMessage: "Program Finished",
      consoleOutput: ["1", "2", "3"],
      callStack: []
    }
  ]
};

export const ALL_CLOSURE_SCENARIOS = [
  CLOSURE_SCENARIO_1,
  CLOSURE_SCENARIO_2,
  CLOSURE_SCENARIO_3,
  CLOSURE_SCENARIO_4,
  CLOSURE_SCENARIO_5,
  CLOSURE_SCENARIO_6
];
