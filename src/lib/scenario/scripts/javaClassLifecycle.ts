import { ScenarioScript } from "../types";
import { SystemNode, SystemEdge } from "@/types";

export const JAVA_LIFECYCLE_NODES: SystemNode[] = [
  {
    id: "node-loading",
    type: "javaBytecode",
    position: { x: 50, y: 150 },
    data: {
      label: "Loading",
      kind: "javaBytecode",
      activeConnections: 0,
      load: 0,
      metadata: {},
      capacity: null,
      securityPolicies: [],
      educational: {
        notes: {
          whatIsIt: "The JVM has located the .class file and is now reading its contents into memory.\n\nAt this stage, Java is simply taking the raw bytecode stored inside the file and creating an internal representation that the JVM can work with.\n\nThe class exists inside the JVM now, but it cannot be executed yet.",
          whyNeeded: "The JVM cannot work directly with files stored on disk.\n\nBefore a class can be used, its bytecode must first be brought into the JVM.\n\nThis step is performed by the Class Loader subsystem that we explored in Episode 3.",
          interestingFact: "Loading answers one question:\n\n**\"Where is the class file?\"**\n\nIt does not verify the code or execute anything yet.",
          interviewTips: "Loading a class and initializing a class are two different operations.\n\nA class may be loaded long before it is actually initialized."
        }
      }
    }
  },
  {
    id: "node-linking-group",
    type: "labeledGroup",
    position: { x: 300, y: 50 },
    style: { 
      width: 650, 
      height: 220
    },
    data: { 
      label: "Linking",
      kind: "group",
      activeConnections: 0,
      load: 0,
      metadata: {},
      capacity: null,
      securityPolicies: []
    }
  },
  {
    id: "node-verification",
    type: "javaBytecode",
    parentId: "node-linking-group",
    extent: "parent",
    position: { x: 20, y: 80 },
    data: {
      label: "Verification",
      kind: "javaBytecode",
      activeConnections: 0,
      load: 0,
      metadata: {},
      capacity: null,
      securityPolicies: [],
      educational: {
        notes: {
          whatIsIt: "The JVM now validates the bytecode that was loaded.\n\nIt checks whether the class follows JVM rules and whether the bytecode could potentially break the runtime.\n\nExamples of checks include:\n• Invalid instructions\n• Corrupted bytecode\n• Illegal stack operations\n• Invalid method signatures",
          whyNeeded: "Java was designed to execute code from many different sources.\n\nWithout verification, malicious or corrupted bytecode could crash the JVM or compromise security.\n\nVerification is one of the reasons Java became popular in environments where running untrusted code mattered.",
          interestingFact: "Verification answers the question:\n\n**\"Can this class be trusted?\"**\n\nIf verification fails, the class will never execute.",
          interviewTips: "Verification happens only once when the class is loaded, not every time a method is called."
        }
      }
    }
  },
  {
    id: "node-preparation",
    type: "javaBytecode",
    parentId: "node-linking-group",
    extent: "parent",
    position: { x: 230, y: 80 },
    data: {
      label: "Preparation",
      kind: "javaBytecode",
      activeConnections: 0,
      load: 0,
      metadata: {},
      capacity: null,
      securityPolicies: [],
      educational: {
        miniMonitor: "static int count = 0;",
        notes: {
          whatIsIt: "The JVM allocates memory for all static fields defined in the class.\n\nHowever, the actual values from your code are not assigned yet. Instead, Java assigns default values.",
          codeTitle: "Your code vs. JVM Preparation",
          codePreview: "java\n// What you wrote:\nstatic int count = 10;\n\n// What the JVM sets during Preparation:\ncount = 0;",
          whyNeeded: "The JVM needs memory locations for static fields before initialization begins.\n\nPreparation creates those locations and places default values inside them.",
          interestingFact: "Preparation does not execute your code.\n\nIt only reserves memory and assigns default values.",
          interviewTips: "Many developers assume `static int count = 10;` immediately becomes 10. That actually happens during Initialization, not Preparation."
        }
      }
    }
  },
  {
    id: "node-resolution",
    type: "javaBytecode",
    parentId: "node-linking-group",
    extent: "parent",
    position: { x: 440, y: 80 },
    data: {
      label: "Resolution",
      kind: "javaBytecode",
      activeConnections: 0,
      load: 0,
      metadata: {},
      capacity: null,
      securityPolicies: [],
      educational: {
        notes: {
          whatIsIt: "The JVM replaces symbolic references with actual runtime references.\n\nSuppose your class contains `String name;`. The class file initially contains a symbolic reference `java.lang.String`.\n\nDuring Resolution, the JVM converts that symbolic name into an actual runtime reference to the loaded class.",
          whyNeeded: "Names written inside source code are not enough for execution.\n\nThe JVM needs direct references to the classes, methods and fields that the program will use.",
          interestingFact: "Resolution answers the question:\n\n**\"Where exactly is the thing I want to use?\"**",
          interviewTips: "If a required dependency cannot be resolved, the JVM may throw `NoClassDefFoundError` or related linkage errors."
        }
      }
    }
  },
  {
    id: "node-initialization",
    type: "javaBytecode",
    position: { x: 1000, y: 130 },
    data: {
      label: "Initialization",
      kind: "javaBytecode",
      activeConnections: 0,
      load: 0,
      metadata: {},
      capacity: null,
      securityPolicies: [],
      educational: {
        miniMonitor: "static int count = 10;",
        notes: {
          whatIsIt: "This is the first moment where your class actually starts executing code.\n\nThe JVM now:\n1. Assigns explicit values to static fields.\n2. Executes static initialization blocks.",
          codeTitle: "Code executed during Initialization",
          codePreview: "java\nstatic int count = 10;\n\nstatic {\n    System.out.println(\"Initializing...\");\n}",
          whyNeeded: "Some classes require setup work before they can be used.\n\nInitialization gives the class an opportunity to prepare itself before any objects are created or methods are called.",
          interestingFact: "Initialization is the point where Java begins executing **your** code, not the JVM's internal setup code.",
          interviewTips: "A class is initialized only once during the lifetime of a ClassLoader. Subsequent uses of the class reuse the already initialized version."
        }
      }
    }
  },
  {
    id: "node-ready",
    type: "jvm",
    position: { x: 1250, y: 130 },
    data: {
      label: "Ready for Execution",
      kind: "jvm",
      activeConnections: 0,
      load: 0,
      metadata: {},
      capacity: null,
      securityPolicies: [],
      educational: {
        notes: {
          whatIsIt: "The class has successfully completed all stages of the lifecycle.\n\nThe JVM now considers the class fully usable. Methods can execute, objects can be created and static fields can be accessed safely.",
          whyNeeded: "Only after reaching this state can your application begin running normally.\n\nEverything before this point was preparation work performed by the JVM behind the scenes.",
          interestingFact: "The JVM performs a surprising amount of work before a single line of your code actually runs.",
          interviewTips: "When interviewers ask: \"What happens when the JVM loads a class?\" this entire pipeline is usually the answer they are looking for:\n\nLoading → Linking (Verification, Preparation, Resolution) → Initialization → Ready for Execution"
        }
      }
    }
  }
];

export const JAVA_LIFECYCLE_EDGES: SystemEdge[] = [
  { id: "edge-1", source: "node-loading", target: "node-verification", type: "default", data: { protocol: "Execute", throughputLimit: null, latencyMs: 0, errorRate: 0, middleware: [] } },
  { id: "edge-2", source: "node-verification", target: "node-preparation", type: "default", data: { protocol: "Execute", throughputLimit: null, latencyMs: 0, errorRate: 0, middleware: [] } },
  { id: "edge-3", source: "node-preparation", target: "node-resolution", type: "default", data: { protocol: "Execute", throughputLimit: null, latencyMs: 0, errorRate: 0, middleware: [] } },
  { id: "edge-4", source: "node-resolution", target: "node-initialization", type: "default", data: { protocol: "Execute", throughputLimit: null, latencyMs: 0, errorRate: 0, middleware: [] } },
  { id: "edge-5", source: "node-initialization", target: "node-ready", type: "default", data: { protocol: "Execute", throughputLimit: null, latencyMs: 0, errorRate: 0, middleware: [] } }
];

export const javaClassLifecycleScript: ScenarioScript = {
  id: "java-class-lifecycle",
  title: "Episode 4: The Class Lifecycle",
  steps: [
    {
      narrative: {
        title: "1. The Class Lifecycle",
        description: "When the JVM finds `Hello.class`, it doesn't execute it right away. The class must first go through a rigorous preparation process called the **Class Lifecycle**. \n\nThis lifecycle ensures the code is safe, allocates memory, and gets everything ready before a single line of your actual code runs.\n\nLet's watch how the JVM handles this class:\n```java\npublic class Hello {\n    static int count = 10;\n    static {\n        System.out.println(\"Static Block Run\");\n    }\n}\n```"
      },
      durationMs: 2000,
      actions: [
        { action: "clear" }
      ]
    },
    // Normal Flow & Load Without Init
    {
      excludedExperiments: ["corrupted-bytecode"],
      narrative: {
        title: "2. Loading",
        description: "First, the JVM reads the raw 1s and 0s from the `.class` file on your hard drive and loads them into memory. It creates a blueprint (a `Class` object) that it will use later to create instances."
      },
      durationMs: 1500,
      actions: [
        { action: "clear" },
        { action: "highlight", elementIds: ["node-loading"] },
        { action: "node-status", nodeId: "node-loading", status: "success" }
      ]
    },
    {
      requiredExperiments: ["corrupted-bytecode"],
      narrative: {
        title: "Experiment: Verification Failure",
        description: "**Experiment Active:** We injected corrupted bytecode into `Hello.class`.\n\nThe JVM is highly paranoid. Before doing anything, it verifies the bytecode to ensure it doesn't contain malicious instructions or invalid memory access. Since the bytecode is corrupted, the JVM instantly throws a `VerifyError` and halts. This is a core security feature of Java."
      },
      autoAdvance: false,
      durationMs: 3000,
      actions: [
        { action: "clear" },
        { action: "highlight", elementIds: ["node-loading", "node-verification"] },
        { action: "animate-asset", sourceId: "node-loading", targetId: "node-verification", assetType: "dot", durationMs: 1500 },
        { action: "node-status", nodeId: "node-verification", status: "error" },
        { action: "tooltip", nodeId: "node-verification", message: "java.lang.VerifyError", type: "error" }
      ]
    },
    {
      excludedExperiments: ["corrupted-bytecode"],
      narrative: {
        title: "3. Linking: Verification",
        description: "Now begins the **Linking** phase. The first step is Verification. The JVM acts like a strict security guard, checking the loaded bytecode to ensure it is perfectly safe and won't crash the system. Our code is clean, so it passes."
      },
      durationMs: 1500,
      actions: [
        { action: "clear" },
        { action: "highlight", elementIds: ["node-loading", "node-verification"] },
        { action: "node-status", nodeId: "node-verification", status: "success" },
        { action: "animate-asset", sourceId: "node-loading", targetId: "node-verification", assetType: "dot", durationMs: 1500 }
      ]
    },
    {
      excludedExperiments: ["corrupted-bytecode"],
      narrative: {
        title: "4. Linking: Preparation",
        description: "Next is Preparation. The JVM sets aside memory for all `static` variables in our class. \n\n**Notice the mini-monitor:** The JVM initializes these variables to their absolute **default** values (like `0` for numbers and `null` for objects). Our `count` variable is currently `0`, even though our code says `10`. This is a massive \"gotcha\" in Java!"
      },
      autoAdvance: false,
      durationMs: 1500,
      actions: [
        { action: "clear" },
        { action: "highlight", elementIds: ["node-verification", "node-preparation"] },
        { action: "node-status", nodeId: "node-preparation", status: "success" },
        { action: "animate-asset", sourceId: "node-verification", targetId: "node-preparation", assetType: "dot", durationMs: 1500 }
      ]
    },
    {
      requiredExperiments: ["missing-dependency"],
      narrative: {
        title: "Experiment: Resolution Failure",
        description: "**Experiment Active:** We removed a class that `Hello.class` depends on.\n\nDuring the Resolution step, the JVM tries to figure out exactly where all the referenced classes are in memory. Since our dependency is missing, the JVM panics and throws a `NoClassDefFoundError`. The program crashes before it even starts running."
      },
      autoAdvance: false,
      durationMs: 3000,
      actions: [
        { action: "clear" },
        { action: "highlight", elementIds: ["node-preparation", "node-resolution"] },
        { action: "animate-asset", sourceId: "node-preparation", targetId: "node-resolution", assetType: "dot", durationMs: 1500 },
        { action: "node-status", nodeId: "node-resolution", status: "error" },
        { action: "tooltip", nodeId: "node-resolution", message: "java.lang.NoClassDefFoundError", type: "error" }
      ]
    },
    {
      excludedExperiments: ["corrupted-bytecode", "missing-dependency"],
      narrative: {
        title: "5. Linking: Resolution",
        description: "The final step of Linking. In our code, we might reference other classes by their names (like `String`). The JVM resolves these string names into actual physical memory addresses so it knows exactly where to find them later.\n\n**Linking is now complete!** But wait... the JVM pauses here. Why?"
      },
      autoAdvance: false,
      durationMs: 1500,
      actions: [
        { action: "clear" },
        { action: "highlight", elementIds: ["node-preparation", "node-resolution"] },
        { action: "node-status", nodeId: "node-resolution", status: "success" },
        { action: "animate-asset", sourceId: "node-preparation", targetId: "node-resolution", assetType: "dot", durationMs: 1500 }
      ]
    },
    {
      requiredExperiments: ["load-without-init"],
      narrative: {
        title: "Experiment: Stopped Before Initialization",
        description: "**Experiment Active:** We used `Class.forName(..., false, loader)` to load the class.\n\nThis experiment proves that the JVM is **lazy**. It loaded and linked the class, but explicitly stopped before the final phase. The static block has NOT run, and `count` is still `0`!\n\nFrameworks like Spring do this to safely scan thousands of classes without accidentally running their static code."
      },
      autoAdvance: false,
      durationMs: 3000,
      actions: [
        { action: "clear" },
        { action: "highlight", elementIds: ["node-resolution"] },
        { action: "tooltip", nodeId: "node-resolution", message: "Loading stopped early", type: "info" }
      ]
    },
    {
      excludedExperiments: ["corrupted-bytecode", "missing-dependency", "load-without-init"],
      narrative: {
        title: "6. Initialization",
        description: "Because we are actually using the class (e.g., creating a `new Hello()`), the JVM finally wakes up and runs the **Initialization** phase. \n\nIt executes our `static {}` blocks and finally assigns the real values to our static variables. **Notice the mini-monitor:** `count` is now officially `10`!"
      },
      autoAdvance: false,
      durationMs: 1500,
      actions: [
        { action: "clear" },
        { action: "highlight", elementIds: ["node-resolution", "node-initialization"] },
        { action: "node-status", nodeId: "node-initialization", status: "success" },
        { action: "tooltip", nodeId: "node-initialization", message: "count = 10; Static blocks run", type: "success" },
        { action: "animate-asset", sourceId: "node-resolution", targetId: "node-initialization", assetType: "dot", durationMs: 1500 }
      ]
    },
    {
      excludedExperiments: ["corrupted-bytecode", "missing-dependency", "load-without-init"],
      narrative: {
        title: "7. Ready for Execution",
        description: "The class is now fully prepared. The JVM can safely create objects from it or invoke its static methods."
      },
      autoAdvance: false,
      durationMs: 2000,
      actions: [
        { action: "clear" },
        { action: "highlight", elementIds: ["node-initialization", "node-ready"] },
        { action: "animate-asset", sourceId: "node-initialization", targetId: "node-ready", assetType: "dot", durationMs: 1500 },
        { action: "node-status", nodeId: "node-ready", status: "success" },
        { action: "tooltip", nodeId: "node-ready", message: "Ready!", type: "success" }
      ],
      quiz: [
        {
          question: "During which phase are static variables assigned their DEFAULT values (e.g., int count = 0)?",
          options: [
            { text: "Initialization", correct: false },
            { text: "Verification", correct: false },
            { text: "Preparation", correct: true },
            { text: "Loading", correct: false }
          ],
          explanation: "Preparation allocates memory for static fields and sets them to default values. Initialization assigns their actual defined values."
        },
        {
          question: "If a class fails the Verification phase, what exception is typically thrown?",
          options: [
            { text: "NoClassDefFoundError", correct: false },
            { text: "VerifyError", correct: true },
            { text: "ClassNotFoundException", correct: false },
            { text: "NullPointerException", correct: false }
          ],
          explanation: "The JVM throws a VerifyError if the bytecode is structurally incorrect or violates safety constraints."
        }
      ]
    }
  ]
};
