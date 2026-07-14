import { SimulationScenario } from "./engine";

export const SCOPE_LOCAL_SCENARIO: SimulationScenario = {
  id: "scope-local",
  title: "1. Local Variable Found",
  code: `function greet() {
    const message = "Hello";
    console.log(message);
}

greet();`,
  steps: [
    {
      currentLine: null,
      explanation: "The JavaScript engine prepares to execute the script. The Call Stack is initially empty.",
      callStack: []
    },
    {
      currentLine: null,
      explanation: "Creation Phase: The Global Execution Context is created. The function 'greet' is hoisted and stored in memory.",
      toastMessage: "Global Execution Context Created",
      callStack: [
        {
          id: "global",
          name: "Global Execution Context",
          phase: "Creation Phase",
          variables: [{ name: "greet", value: "Function Object" }],
          outerEnvironment: null
        }
      ]
    },
    {
      currentLine: 6,
      explanation: "Execution Phase starts. The engine skips the function declaration and arrives at line 6, where 'greet()' is invoked.",
      toastMessage: "Invoking greet()",
      callStack: [
        {
          id: "global",
          name: "Global Execution Context",
          phase: "Execution Phase",
          variables: [{ name: "greet", value: "Function Object" }],
          outerEnvironment: null
        }
      ]
    },
    {
      currentLine: 1,
      explanation: "A new Execution Context is created for 'greet()'. During its Creation Phase, 'message' is placed in the Temporal Dead Zone (TDZ).",
      callStack: [
        {
          id: "greet_1",
          name: "greet() FEC",
          phase: "Creation Phase",
          variables: [{ name: "message", value: "<TDZ> 🔒" }],
          outerEnvironment: "Global Execution Context"
        },
        {
          id: "global",
          name: "Global Execution Context",
          phase: "Execution Phase",
          variables: [{ name: "greet", value: "Function Object" }],
          outerEnvironment: null
        }
      ]
    },
    {
      currentLine: 2,
      explanation: "Execution Phase inside 'greet()'. Line 2 assigns the value '\"Hello\"' to the constant 'message'.",
      toastMessage: "Assigning message",
      callStack: [
        {
          id: "greet_1",
          name: "greet() FEC",
          phase: "Execution Phase",
          variables: [{ name: "message", value: '"Hello"' }],
          outerEnvironment: "Global Execution Context"
        },
        {
          id: "global",
          name: "Global Execution Context",
          phase: "Execution Phase",
          variables: [{ name: "greet", value: "Function Object" }],
          outerEnvironment: null
        }
      ]
    },
    {
      currentLine: 3,
      explanation: "Executing console.log(message). JavaScript needs to resolve the variable 'message'.",
      callStack: [
        {
          id: "greet_1",
          name: "greet() FEC",
          phase: "Execution Phase",
          variables: [{ name: "message", value: '"Hello"' }],
          outerEnvironment: "Global Execution Context"
        },
        {
          id: "global",
          name: "Global Execution Context",
          phase: "Execution Phase",
          variables: [{ name: "greet", value: "Function Object" }],
          outerEnvironment: null
        }
      ],
      scopeLookup: {
        targetVariable: "message",
        status: "searching",
        activeContextId: "greet_1",
        checkedContextIds: [],
        traceLog: [
          "[1] Resolving 'message'...",
          "[2] Searching in greet() FEC..."
        ]
      }
    },
    {
      currentLine: 3,
      explanation: "JavaScript engine successfully finds 'message' locally inside the current execution context.",
      toastMessage: "Variable Found Locally",
      consoleOutput: ["Hello"],
      callStack: [
        {
          id: "greet_1",
          name: "greet() FEC",
          phase: "Execution Phase",
          variables: [{ name: "message", value: '"Hello"' }],
          outerEnvironment: "Global Execution Context"
        },
        {
          id: "global",
          name: "Global Execution Context",
          phase: "Execution Phase",
          variables: [{ name: "greet", value: "Function Object" }],
          outerEnvironment: null
        }
      ],
      scopeLookup: {
        targetVariable: "message",
        status: "found",
        activeContextId: "greet_1",
        checkedContextIds: [],
        traceLog: [
          "[1] Resolving 'message'...",
          "[2] Searching in greet() FEC... ✅ Found!",
          "[3] Value: \"Hello\""
        ]
      }
    },
    {
      currentLine: null,
      explanation: "Execution finishes successfully. All contexts are destroyed.",
      consoleOutput: ["Hello"],
      callStack: []
    }
  ]
};

export const SCOPE_GLOBAL_SCENARIO: SimulationScenario = {
  id: "scope-global",
  title: "2. Global Scope Lookup",
  code: `const company = "OpenAI";

function greet() {
    console.log(company);
}

greet();`,
  steps: [
    {
      currentLine: null,
      explanation: "Engine initialized.",
      callStack: []
    },
    {
      currentLine: null,
      explanation: "Creation Phase: Global EC is created. 'company' is in TDZ, and 'greet' is hoisted.",
      toastMessage: "Global EC Created",
      callStack: [
        {
          id: "global",
          name: "Global Execution Context",
          phase: "Creation Phase",
          variables: [
            { name: "company", value: "<TDZ> 🔒" },
            { name: "greet", value: "Function Object" }
          ],
          outerEnvironment: null
        }
      ]
    },
    {
      currentLine: 1,
      explanation: "Execution Phase starts. Line 1 assigns '\"OpenAI\"' to 'company'.",
      toastMessage: "Assigning company",
      callStack: [
        {
          id: "global",
          name: "Global Execution Context",
          phase: "Execution Phase",
          variables: [
            { name: "company", value: '"OpenAI"' },
            { name: "greet", value: "Function Object" }
          ],
          outerEnvironment: null
        }
      ]
    },
    {
      currentLine: 7,
      explanation: "The engine skips the function declaration and arrives at line 7, invoking 'greet()'.",
      toastMessage: "Invoking greet()",
      callStack: [
        {
          id: "global",
          name: "Global Execution Context",
          phase: "Execution Phase",
          variables: [
            { name: "company", value: '"OpenAI"' },
            { name: "greet", value: "Function Object" }
          ],
          outerEnvironment: null
        }
      ]
    },
    {
      currentLine: 3,
      explanation: "A new Execution Context is created for 'greet()'. It has no local variables.",
      callStack: [
        {
          id: "greet_1",
          name: "greet() FEC",
          phase: "Execution Phase",
          variables: [],
          outerEnvironment: "Global Execution Context"
        },
        {
          id: "global",
          name: "Global Execution Context",
          phase: "Execution Phase",
          variables: [
            { name: "company", value: '"OpenAI"' },
            { name: "greet", value: "Function Object" }
          ],
          outerEnvironment: null
        }
      ]
    },
    {
      currentLine: 4,
      explanation: "Looking for variable 'company'. Checking current local scope first.",
      callStack: [
        {
          id: "greet_1",
          name: "greet() FEC",
          phase: "Execution Phase",
          variables: [],
          outerEnvironment: "global"
        },
        {
          id: "global",
          name: "Global Execution Context",
          phase: "Execution Phase",
          variables: [
            { name: "company", value: '"OpenAI"' },
            { name: "greet", value: "Function Object" }
          ],
          outerEnvironment: null
        }
      ],
      scopeLookup: {
        targetVariable: "company",
        status: "searching",
        activeContextId: "greet_1",
        checkedContextIds: [],
        traceLog: [
          "[1] Resolving 'company'...",
          "[2] Searching in greet() FEC... ❌ Not Found."
        ]
      }
    },
    {
      currentLine: 4,
      explanation: "Not found locally! JavaScript checks the outer environment reference and searches the Global Execution Context.",
      callStack: [
        {
          id: "greet_1",
          name: "greet() FEC",
          phase: "Execution Phase",
          variables: [],
          outerEnvironment: "global"
        },
        {
          id: "global",
          name: "Global Execution Context",
          phase: "Execution Phase",
          variables: [
            { name: "company", value: '"OpenAI"' },
            { name: "greet", value: "Function Object" }
          ],
          outerEnvironment: null
        }
      ],
      scopeLookup: {
        targetVariable: "company",
        status: "searching",
        activeContextId: "global",
        checkedContextIds: ["greet_1"],
        traceLog: [
          "[1] Resolving 'company'...",
          "[2] Searching in greet() FEC... ❌ Not Found.",
          "[3] Following outer environment link...",
          "[4] Searching in Global EC..."
        ]
      }
    },
    {
      currentLine: 4,
      explanation: "Variable 'company' found in Global EC.",
      consoleOutput: ["OpenAI"],
      toastMessage: "Found in outer scope",
      callStack: [
        {
          id: "greet_1",
          name: "greet() FEC",
          phase: "Execution Phase",
          variables: [],
          outerEnvironment: "global"
        },
        {
          id: "global",
          name: "Global Execution Context",
          phase: "Execution Phase",
          variables: [
            { name: "company", value: '"OpenAI"' },
            { name: "greet", value: "Function Object" }
          ],
          outerEnvironment: null
        }
      ],
      scopeLookup: {
        targetVariable: "company",
        status: "found",
        activeContextId: "global",
        checkedContextIds: ["greet_1"],
        traceLog: [
          "[1] Resolving 'company'...",
          "[2] Searching in greet() FEC... ❌ Not Found.",
          "[3] Following outer environment link...",
          "[4] Searching in Global EC... ✅ Found! (\"OpenAI\")"
        ]
      }
    },
    {
      currentLine: null,
      explanation: "Execution finishes.",
      consoleOutput: ["OpenAI"],
      callStack: []
    }
  ]
};

export const SCOPE_MULTIPLE_LEVELS_SCENARIO: SimulationScenario = {
  id: "scope-multi",
  title: "3. Scope Chain Traversal",
  code: `const company = "OpenAI";

function engineering() {
    const team = "Platform";

    function backend() {
        console.log(team);
        console.log(company);
    }

    backend();
}

engineering();`,
  steps: [
    {
      currentLine: null,
      explanation: "Engine initialized.",
      callStack: []
    },
    {
      currentLine: null,
      explanation: "Global EC Creation Phase. 'company' is in TDZ, 'engineering' function is hoisted.",
      callStack: [
        {
          id: "global",
          name: "Global Execution Context",
          phase: "Creation Phase",
          variables: [
            { name: "company", value: "<TDZ> 🔒" },
            { name: "engineering", value: "Function Object" }
          ],
          outerEnvironment: null
        }
      ]
    },
    {
      currentLine: 1,
      explanation: "Execution Phase starts. Line 1 assigns '\"OpenAI\"' to 'company'.",
      callStack: [
        {
          id: "global",
          name: "Global Execution Context",
          phase: "Execution Phase",
          variables: [
            { name: "company", value: '"OpenAI"' },
            { name: "engineering", value: "Function Object" }
          ],
          outerEnvironment: null
        }
      ]
    },
    {
      currentLine: 14,
      explanation: "Line 14 invokes 'engineering()'.",
      callStack: [
        {
          id: "global",
          name: "Global Execution Context",
          phase: "Execution Phase",
          variables: [
            { name: "company", value: '"OpenAI"' },
            { name: "engineering", value: "Function Object" }
          ],
          outerEnvironment: null
        }
      ]
    },
    {
      currentLine: 3,
      explanation: "engineering() EC is created. 'team' is assigned '\"Platform\"', and 'backend' is hoisted.",
      callStack: [
        {
          id: "engineering_1",
          name: "engineering() FEC",
          phase: "Execution Phase",
          variables: [
            { name: "team", value: '"Platform"' },
            { name: "backend", value: "Function Object" }
          ],
          outerEnvironment: "global"
        },
        {
          id: "global",
          name: "Global Execution Context",
          phase: "Execution Phase",
          variables: [
            { name: "company", value: '"OpenAI"' },
            { name: "engineering", value: "Function Object" }
          ],
          outerEnvironment: null
        }
      ]
    },
    {
      currentLine: 11,
      explanation: "Line 11 inside engineering() invokes 'backend()'.",
      callStack: [
        {
          id: "engineering_1",
          name: "engineering() FEC",
          phase: "Execution Phase",
          variables: [
            { name: "team", value: '"Platform"' },
            { name: "backend", value: "Function Object" }
          ],
          outerEnvironment: "global"
        },
        {
          id: "global",
          name: "Global Execution Context",
          phase: "Execution Phase",
          variables: [
            { name: "company", value: '"OpenAI"' },
            { name: "engineering", value: "Function Object" }
          ],
          outerEnvironment: null
        }
      ]
    },
    {
      currentLine: 6,
      explanation: "backend() EC pushed. Ready to resolve console.log(team).",
      callStack: [
        {
          id: "backend_1",
          name: "backend() FEC",
          phase: "Execution Phase",
          variables: [],
          outerEnvironment: "engineering_1"
        },
        {
          id: "engineering_1",
          name: "engineering() FEC",
          phase: "Execution Phase",
          variables: [
            { name: "team", value: '"Platform"' },
            { name: "backend", value: "Function Object" }
          ],
          outerEnvironment: "global"
        },
        {
          id: "global",
          name: "Global Execution Context",
          phase: "Execution Phase",
          variables: [
            { name: "company", value: '"OpenAI"' },
            { name: "engineering", value: "Function Object" }
          ],
          outerEnvironment: null
        }
      ]
    },
    {
      currentLine: 7,
      explanation: "Resolving 'team'. Starting in local backend() EC.",
      callStack: [
        { id: "backend_1", name: "backend() FEC", phase: "Execution Phase", variables: [], outerEnvironment: "engineering_1" },
        { id: "engineering_1", name: "engineering() FEC", phase: "Execution Phase", variables: [{ name: "team", value: '"Platform"' }, { name: "backend", value: "Function Object" }], outerEnvironment: "global" },
        { id: "global", name: "Global Execution Context", phase: "Execution Phase", variables: [{ name: "company", value: '"OpenAI"' }, { name: "engineering", value: "Function Object" }], outerEnvironment: null }
      ],
      scopeLookup: {
        targetVariable: "team",
        status: "searching",
        activeContextId: "backend_1",
        checkedContextIds: [],
        traceLog: [
          "[1] Resolving 'team'...",
          "[2] Searching in backend() FEC... ❌ Not Found."
        ]
      }
    },
    {
      currentLine: 7,
      explanation: "Following outer environment pointer to engineering() EC...",
      callStack: [
        { id: "backend_1", name: "backend() FEC", phase: "Execution Phase", variables: [], outerEnvironment: "engineering_1" },
        { id: "engineering_1", name: "engineering() FEC", phase: "Execution Phase", variables: [{ name: "team", value: '"Platform"' }, { name: "backend", value: "Function Object" }], outerEnvironment: "global" },
        { id: "global", name: "Global Execution Context", phase: "Execution Phase", variables: [{ name: "company", value: '"OpenAI"' }, { name: "engineering", value: "Function Object" }], outerEnvironment: null }
      ],
      consoleOutput: ["Platform"],
      scopeLookup: {
        targetVariable: "team",
        status: "found",
        activeContextId: "engineering_1",
        checkedContextIds: ["backend_1"],
        traceLog: [
          "[1] Resolving 'team'...",
          "[2] Searching in backend() FEC... ❌ Not Found.",
          "[3] Following outer link...",
          "[4] Searching in engineering() FEC... ✅ Found! (\"Platform\")"
        ]
      }
    },
    {
      currentLine: 8,
      explanation: "Now resolving 'company'. Checking local backend() EC.",
      callStack: [
        { id: "backend_1", name: "backend() FEC", phase: "Execution Phase", variables: [], outerEnvironment: "engineering_1" },
        { id: "engineering_1", name: "engineering() FEC", phase: "Execution Phase", variables: [{ name: "team", value: '"Platform"' }, { name: "backend", value: "Function Object" }], outerEnvironment: "global" },
        { id: "global", name: "Global Execution Context", phase: "Execution Phase", variables: [{ name: "company", value: '"OpenAI"' }, { name: "engineering", value: "Function Object" }], outerEnvironment: null }
      ],
      consoleOutput: ["Platform"],
      scopeLookup: {
        targetVariable: "company",
        status: "searching",
        activeContextId: "backend_1",
        checkedContextIds: [],
        traceLog: [
          "[1] Resolving 'company'...",
          "[2] Searching in backend() FEC... ❌ Not Found."
        ]
      }
    },
    {
      currentLine: 8,
      explanation: "Checking outer environment (engineering EC).",
      callStack: [
        { id: "backend_1", name: "backend() FEC", phase: "Execution Phase", variables: [], outerEnvironment: "engineering_1" },
        { id: "engineering_1", name: "engineering() FEC", phase: "Execution Phase", variables: [{ name: "team", value: '"Platform"' }, { name: "backend", value: "Function Object" }], outerEnvironment: "global" },
        { id: "global", name: "Global Execution Context", phase: "Execution Phase", variables: [{ name: "company", value: '"OpenAI"' }, { name: "engineering", value: "Function Object" }], outerEnvironment: null }
      ],
      consoleOutput: ["Platform"],
      scopeLookup: {
        targetVariable: "company",
        status: "searching",
        activeContextId: "engineering_1",
        checkedContextIds: ["backend_1"],
        traceLog: [
          "[1] Resolving 'company'...",
          "[2] Searching in backend() FEC... ❌ Not Found.",
          "[3] Following outer link...",
          "[4] Searching in engineering() FEC... ❌ Not Found."
        ]
      }
    },
    {
      currentLine: 8,
      explanation: "Following outer link again... Checking Global EC.",
      callStack: [
        { id: "backend_1", name: "backend() FEC", phase: "Execution Phase", variables: [], outerEnvironment: "engineering_1" },
        { id: "engineering_1", name: "engineering() FEC", phase: "Execution Phase", variables: [{ name: "team", value: '"Platform"' }, { name: "backend", value: "Function Object" }], outerEnvironment: "global" },
        { id: "global", name: "Global Execution Context", phase: "Execution Phase", variables: [{ name: "company", value: '"OpenAI"' }, { name: "engineering", value: "Function Object" }], outerEnvironment: null }
      ],
      consoleOutput: ["Platform", "OpenAI"],
      scopeLookup: {
        targetVariable: "company",
        status: "found",
        activeContextId: "global",
        checkedContextIds: ["backend_1", "engineering_1"],
        traceLog: [
          "[1] Resolving 'company'...",
          "[2] Searching in backend() FEC... ❌ Not Found.",
          "[3] Following outer link...",
          "[4] Searching in engineering() FEC... ❌ Not Found.",
          "[5] Following outer link...",
          "[6] Searching in Global EC... ✅ Found! (\"OpenAI\")"
        ]
      }
    },
    {
      currentLine: null,
      explanation: "Execution finishes.",
      consoleOutput: ["Platform", "OpenAI"],
      callStack: []
    }
  ]
};

export const SCOPE_SHADOWING_SCENARIO: SimulationScenario = {
  id: "scope-shadowing",
  title: "4. Shadowing (Circuit Breaker)",
  code: `const language = "JavaScript";

function outer() {
    const language = "TypeScript";

    function inner() {
        console.log(language);
    }
    inner();
}
outer();`,
  steps: [
    { currentLine: null, explanation: "Engine initialized.", callStack: [] },
    {
      currentLine: null,
      explanation: "Global EC Created.",
      callStack: [
        { id: "global", name: "Global EC", phase: "Creation Phase", variables: [{ name: "language", value: "<TDZ> 🔒" }, { name: "outer", value: "Function Object" }], outerEnvironment: null }
      ]
    },
    {
      currentLine: 1,
      explanation: "Global Execution: Line 1 assigns '\"JavaScript\"' to 'language'.",
      callStack: [
        { id: "global", name: "Global EC", phase: "Execution Phase", variables: [{ name: "language", value: '"JavaScript"' }, { name: "outer", value: "Function Object" }], outerEnvironment: null }
      ]
    },
    {
      currentLine: 11,
      explanation: "Global Execution: Line 11 invokes 'outer()'.",
      callStack: [
        { id: "global", name: "Global EC", phase: "Execution Phase", variables: [{ name: "language", value: '"JavaScript"' }, { name: "outer", value: "Function Object" }], outerEnvironment: null }
      ]
    },
    {
      currentLine: 4,
      explanation: "outer() EC Created. Line 4 assigns '\"TypeScript\"' to a new local constant 'language'.",
      callStack: [
        { id: "outer_1", name: "outer() FEC", phase: "Execution Phase", variables: [{ name: "language", value: '"TypeScript"' }, { name: "inner", value: "Function Object" }], outerEnvironment: "global" },
        { id: "global", name: "Global EC", phase: "Execution Phase", variables: [{ name: "language", value: '"JavaScript"' }, { name: "outer", value: "Function Object" }], outerEnvironment: null }
      ]
    },
    {
      currentLine: 9,
      explanation: "Line 9 invokes 'inner()'.",
      callStack: [
        { id: "inner_1", name: "inner() FEC", phase: "Execution Phase", variables: [], outerEnvironment: "outer_1" },
        { id: "outer_1", name: "outer() FEC", phase: "Execution Phase", variables: [{ name: "language", value: '"TypeScript"' }, { name: "inner", value: "Function Object" }], outerEnvironment: "global" },
        { id: "global", name: "Global EC", phase: "Execution Phase", variables: [{ name: "language", value: '"JavaScript"' }, { name: "outer", value: "Function Object" }], outerEnvironment: null }
      ]
    },
    {
      currentLine: 7,
      explanation: "Resolving 'language'. Checking inner() FEC.",
      callStack: [
        { id: "inner_1", name: "inner() FEC", phase: "Execution Phase", variables: [], outerEnvironment: "outer_1" },
        { id: "outer_1", name: "outer() FEC", phase: "Execution Phase", variables: [{ name: "language", value: '"TypeScript"' }, { name: "inner", value: "Function Object" }], outerEnvironment: "global" },
        { id: "global", name: "Global EC", phase: "Execution Phase", variables: [{ name: "language", value: '"JavaScript"' }, { name: "outer", value: "Function Object" }], outerEnvironment: null }
      ],
      scopeLookup: {
        targetVariable: "language",
        status: "searching",
        activeContextId: "inner_1",
        checkedContextIds: [],
        traceLog: [ "[1] Resolving 'language'...", "[2] Checking inner() FEC... ❌" ]
      }
    },
    {
      currentLine: 7,
      explanation: "Checking outer() FEC... Found it!",
      callStack: [
        { id: "inner_1", name: "inner() FEC", phase: "Execution Phase", variables: [], outerEnvironment: "outer_1" },
        { id: "outer_1", name: "outer() FEC", phase: "Execution Phase", variables: [{ name: "language", value: '"TypeScript"' }, { name: "inner", value: "Function Object" }], outerEnvironment: "global" },
        { id: "global", name: "Global EC", phase: "Execution Phase", variables: [{ name: "language", value: '"JavaScript"' }, { name: "outer", value: "Function Object" }], outerEnvironment: null }
      ],
      consoleOutput: ["TypeScript"],
      scopeLookup: {
        targetVariable: "language",
        status: "found",
        activeContextId: "outer_1",
        checkedContextIds: ["inner_1"],
        traceLog: [ "[1] Resolving 'language'...", "[2] Checking inner() FEC... ❌", "[3] Checking outer() FEC... ✅ Found!", "[4] ⚡ SEARCH TERMINATED. Global EC ignored." ]
      }
    },
    { currentLine: null, explanation: "Execution finishes.", consoleOutput: ["TypeScript"], callStack: [] }
  ]
};

export const SCOPE_ERROR_SCENARIO: SimulationScenario = {
  id: "scope-error",
  title: "5. Reference Error",
  code: `function greet() {
    console.log(user);
}

greet();`,
  steps: [
    { currentLine: null, explanation: "Engine initialized.", callStack: [] },
    {
      currentLine: null,
      explanation: "Global EC Created. 'greet' function is hoisted.",
      callStack: [
        { id: "global", name: "Global EC", phase: "Creation Phase", variables: [{ name: "greet", value: "Function Object" }], outerEnvironment: null }
      ]
    },
    {
      currentLine: 5,
      explanation: "Global Execution: Line 5 invokes 'greet()'.",
      callStack: [
        { id: "global", name: "Global EC", phase: "Execution Phase", variables: [{ name: "greet", value: "Function Object" }], outerEnvironment: null }
      ]
    },
    {
      currentLine: 1,
      explanation: "greet() EC Created.",
      callStack: [
        { id: "greet_1", name: "greet() FEC", phase: "Execution Phase", variables: [], outerEnvironment: "global" },
        { id: "global", name: "Global EC", phase: "Execution Phase", variables: [{ name: "greet", value: "Function Object" }], outerEnvironment: null }
      ]
    },
    {
      currentLine: 2,
      explanation: "Checking local greet() FEC.",
      callStack: [
        { id: "greet_1", name: "greet() FEC", phase: "Execution Phase", variables: [], outerEnvironment: "global" },
        { id: "global", name: "Global EC", phase: "Execution Phase", variables: [{ name: "greet", value: "Function Object" }], outerEnvironment: null }
      ],
      scopeLookup: {
        targetVariable: "user",
        status: "searching",
        activeContextId: "greet_1",
        checkedContextIds: [],
        traceLog: [ "[1] Resolving 'user'...", "[2] Checking greet() FEC... ❌ Not found." ]
      }
    },
    {
      currentLine: 2,
      explanation: "Checking Global EC.",
      callStack: [
        { id: "greet_1", name: "greet() FEC", phase: "Execution Phase", variables: [], outerEnvironment: "global" },
        { id: "global", name: "Global EC", phase: "Execution Phase", variables: [{ name: "greet", value: "Function Object" }], outerEnvironment: null }
      ],
      scopeLookup: {
        targetVariable: "user",
        status: "searching",
        activeContextId: "global",
        checkedContextIds: ["greet_1"],
        traceLog: [ "[1] Resolving 'user'...", "[2] Checking greet() FEC... ❌", "[3] Checking Global EC... ❌ Not found." ]
      }
    },
    {
      currentLine: 2,
      explanation: "Variable not found in any scope. Throwing ReferenceError.",
      callStack: [
        { id: "greet_1", name: "greet() FEC", phase: "Execution Phase", variables: [], outerEnvironment: "global" },
        { id: "global", name: "Global EC", phase: "Execution Phase", variables: [{ name: "greet", value: "Function Object" }], outerEnvironment: null }
      ],
      consoleOutput: ["ReferenceError: user is not defined"],
      scopeLookup: {
        targetVariable: "user",
        status: "reference_error",
        activeContextId: "global", 
        checkedContextIds: ["greet_1", "global"],
        traceLog: [ "[1] Resolving 'user'...", "[2] Checking greet() FEC... ❌", "[3] Checking Global EC... ❌", "[4] 💥 Search Failed. ReferenceError!" ]
      }
    },
    { currentLine: null, explanation: "Execution halted.", consoleOutput: ["ReferenceError: user is not defined"], callStack: [] }
  ]
};

export const ALL_SCOPE_SCENARIOS = [
  SCOPE_LOCAL_SCENARIO,
  SCOPE_GLOBAL_SCENARIO,
  SCOPE_MULTIPLE_LEVELS_SCENARIO,
  SCOPE_SHADOWING_SCENARIO,
  SCOPE_ERROR_SCENARIO
];
