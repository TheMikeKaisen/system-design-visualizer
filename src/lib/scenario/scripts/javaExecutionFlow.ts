import { ScenarioScript } from "../types";
import { SystemNode, SystemEdge } from "@/types";

export const JAVA_FLOW_NODES: SystemNode[] = [
  {
    id: "node-source",
    type: "javaSource",
    position: { x: 50, y: 300 },
    data: {
      label: "Hello.java",
      kind: "javaSource",
      activeConnections: 0,
      load: 0,
      metadata: {},
      capacity: null,
      securityPolicies: [],
      educational: {
        notes: {
          whatIsIt: "A plain text file containing Java source code written by a human developer.",
          whyNeeded: "Computers do not understand English. Source code is the human-readable set of instructions that will eventually be translated for the computer.",
          whatIfMissing: "Without source code, there is no program to compile or run.",
          interviewTips: "Understand the difference between compilation and interpretation. Java source is compiled first."
        }
      }
    }
  },
  {
    id: "node-compiler",
    type: "javaCompiler",
    position: { x: 280, y: 300 },
    data: {
      label: "Compiler (javac)",
      kind: "javaCompiler",
      activeConnections: 0,
      load: 0,
      metadata: {},
      capacity: null,
      securityPolicies: [],
      educational: {
        notes: {
          whatIsIt: "The Java Compiler (javac) reads source code and translates it into bytecode.",
          whyNeeded: "It checks for syntax errors and structural problems before the program ever runs. If it passes, it creates platform-independent bytecode.",
          whatIfMissing: "You couldn't run Java code on the JVM, as the JVM only understands bytecode.",
          interviewTips: "Be ready to explain that javac does *not* produce machine code. It produces bytecode (WORA: Write Once, Run Anywhere)."
        }
      }
    }
  },
  {
    id: "node-bytecode",
    type: "javaBytecode",
    position: { x: 510, y: 300 },
    data: {
      label: "Hello.class",
      kind: "javaBytecode",
      activeConnections: 0,
      load: 0,
      metadata: {},
      capacity: null,
      securityPolicies: [],
      educational: {
        notes: {
          whatIsIt: "A file containing Java Bytecode, a highly optimized set of instructions for the JVM.",
          whyNeeded: "Bytecode is the secret to Java's cross-platform capabilities. The same .class file can be run on Windows, Mac, or Linux.",
          whatIfMissing: "Without bytecode, the JVM has nothing to execute.",
          interviewTips: "Bytecode is an intermediate representation. It is platform-independent, unlike C++ compiled binaries."
        }
      }
    }
  },
  {
    id: "node-jvm",
    type: "jvm",
    position: { x: 740, y: 300 },
    data: {
      label: "JVM",
      kind: "jvm",
      activeConnections: 0,
      load: 0,
      metadata: {},
      capacity: null,
      securityPolicies: [],
      educational: {
        notes: {
          whatIsIt: "The Java Virtual Machine (JVM) is an engine that provides a runtime environment to drive the Java Code.",
          whyNeeded: "It translates bytecode into machine-specific instructions and handles memory management (Garbage Collection).",
          whatIfMissing: "You would have to compile your code separately for every different OS and CPU architecture.",
          interviewTips: "Understand JVM internals: Class Loader, Bytecode Verifier, and the Execution Engine (Interpreter + JIT Compiler)."
        }
      }
    }
  },
  {
    id: "node-cpu",
    type: "javaCpu",
    position: { x: 1070, y: 300 },
    data: {
      label: "CPU",
      kind: "javaCpu",
      activeConnections: 0,
      load: 0,
      metadata: {},
      capacity: null,
      securityPolicies: [],
      educational: {
        notes: {
          whatIsIt: "The actual hardware processor executing binary instructions (0s and 1s).",
          whyNeeded: "All software must be reduced to physical electrical signals in the CPU to actually do work.",
          whatIfMissing: "No hardware, no execution.",
          interviewTips: "Mention that the JIT (Just-In-Time) compiler inside the JVM compiles frequently executed bytecode directly into native machine code."
        }
      }
    }
  }
];

export const JAVA_FLOW_EDGES: SystemEdge[] = [
  { id: "edge-1", source: "node-source", target: "node-compiler", type: "default", data: { protocol: "HTTP", throughputLimit: null, latencyMs: 0, errorRate: 0, middleware: [] } },
  { id: "edge-2", source: "node-compiler", target: "node-bytecode", type: "default", data: { protocol: "HTTP", throughputLimit: null, latencyMs: 0, errorRate: 0, middleware: [] } },
  { id: "edge-3", source: "node-bytecode", target: "node-jvm", type: "default", data: { protocol: "HTTP", throughputLimit: null, latencyMs: 0, errorRate: 0, middleware: [] } },
  { id: "edge-4", source: "node-jvm", target: "node-cpu", type: "default", label: "Machine Code", data: { protocol: "HTTP", throughputLimit: null, latencyMs: 0, errorRate: 0, middleware: [] } }
];

// --- Platform Independence Expansion ---



export const javaExecutionScript: ScenarioScript = {
  id: "java-execution-101",
  title: "Java Execution Flow",
  steps: [
    // --- Step 0 ---
    {
      narrative: {
        title: "1. The Source Code",
        description: "It all begins with human-readable source code. A developer writes Java code and saves it in a file with a .java extension."
      },
      durationMs: 2000,
      actions: [
        { action: "clear" },
        { action: "highlight", elementIds: ["node-source"] },
        { action: "node-status", nodeId: "node-source", status: "success" }
      ]
    },
    // --- Step 1 (Normal Path) ---
    {
      excludedExperiments: ["syntax-error"],
      durationMs: 2000,
      narrative: {
        title: "2. Compilation",
        description: "The Java Compiler (javac) reads the source code. If there are no syntax errors, it translates your human-readable Java into intermediate Bytecode."
      },
      actions: [
        { action: "clear" },
        { action: "highlight", elementIds: ["node-source", "node-compiler", "edge-1"] },
        { action: "node-status", nodeId: "node-compiler", status: "processing" },
        { action: "animate-asset", sourceId: "node-source", targetId: "node-compiler", assetType: "dot", durationMs: 1500 }
      ]
    },
    
    // BRANCH: Syntax Error (Fails at Source)
    {
      requiredExperiments: ["syntax-error"],
      autoAdvance: false, // Wait for user
      narrative: {
        title: "Compilation Failed!",
        description: "Experiment Active: You introduced a syntax error in Hello.java (e.g., missing a semicolon). The compiler cannot parse it, so the process halts."
      },
      actions: [
        { action: "clear" },
        { action: "highlight", elementIds: ["node-source"] },
        { action: "node-status", nodeId: "node-source", status: "error" },
        { action: "tooltip", nodeId: "node-source", message: "Error: ';' expected on line 4" }
      ]
    },

    // NORMAL PATH: Step 2
    {
      excludedExperiments: ["syntax-error"],
      autoAdvance: false, // Pause here for guided mode
      narrative: {
        title: "Compilation Complete",
        description: "The compiler has successfully generated bytecode. Click Continue to proceed to the JVM."
      },
      actions: [
        { action: "clear" },
        { action: "highlight", elementIds: ["node-compiler"] },
        { action: "node-status", nodeId: "node-compiler", status: "success" }
      ]
    },
    // NORMAL PATH: Step 3
    {
      excludedExperiments: ["syntax-error"],
      durationMs: 2000,
      narrative: {
        title: "3. Bytecode Generation",
        description: "The result is a .class file containing Bytecode. Unlike machine code, this isn't tied to any specific operating system. It's universally understood by any JVM."
      },
      actions: [
        { action: "clear" },
        { action: "highlight", elementIds: ["node-compiler", "node-bytecode", "edge-2"] },
        { action: "node-status", nodeId: "node-compiler", status: "success" },
        { action: "node-status", nodeId: "node-bytecode", status: "processing" },
        { action: "animate-asset", sourceId: "node-compiler", targetId: "node-bytecode", assetType: "dot", durationMs: 1500 }
      ]
    },
    // NORMAL PATH: Step 4
    {
      excludedExperiments: ["syntax-error", "platform-independence"],
      durationMs: 3500,
      narrative: {
        title: "4. Entering the JVM",
        description: "The Bytecode is fed into the Java Virtual Machine (JVM). The JVM is specific to your OS, but it can read any standard .class file."
      },
      actions: [
        { action: "clear" },
        { action: "highlight", elementIds: ["node-bytecode", "node-jvm", "edge-3"] },
        { action: "node-status", nodeId: "node-bytecode", status: "success" },
        { action: "node-status", nodeId: "node-jvm", status: "processing" },
        { action: "animate-asset", sourceId: "node-bytecode", targetId: "node-jvm", assetType: "dot", durationMs: 1000 }
      ]
    },
    // BRANCH: Disable JIT
    {
      requiredExperiments: ["disable-jit"],
      excludedExperiments: ["syntax-error"],
      autoAdvance: false,
      narrative: {
        title: "JVM Execution (JIT Disabled)",
        description: "Experiment Active: JIT Compiler is disabled. The JVM is strictly interpreting the bytecode line-by-line, which is much slower."
      },
      actions: [
        { action: "clear" },
        { action: "highlight", elementIds: ["node-jvm"] },
        { action: "node-status", nodeId: "node-jvm", status: "processing" }
        // Potentially add slow animation effect here
      ]
    },
    // NORMAL PATH: Step 5
    {
      excludedExperiments: ["syntax-error", "disable-jit"],
      durationMs: 2000,
      narrative: {
        title: "5. Execution",
        description: "The JVM translates the Bytecode into native Machine Code on the fly, which the CPU then executes."
      },
      actions: [
        { action: "clear" },
        { action: "highlight", elementIds: ["node-jvm", "node-cpu", "edge-4"] },
        { action: "node-status", nodeId: "node-jvm", status: "success" },
        { action: "node-status", nodeId: "node-cpu", status: "success" },
        { action: "animate-asset", sourceId: "node-jvm", targetId: "node-cpu", assetType: "dot", durationMs: 1500 }
      ]
    },

    // NORMAL PATH: Step 6
    {
      excludedExperiments: ["syntax-error"],
      autoAdvance: false,
      narrative: {
        title: "Complete",
        description: "Write Once, Run Anywhere! You write Java once, compile it to bytecode once, and any JVM on any device can run it."
      },
      actions: [
        { action: "clear" },
        { action: "highlight", elementIds: ["node-source", "node-compiler", "node-bytecode", "node-jvm", "node-cpu"] },
        { action: "node-status", nodeId: "node-cpu", status: "success" }
      ]
    }
  ]
};
