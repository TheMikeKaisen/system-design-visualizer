import { SystemNode, SystemEdge } from "@/types";
import { ScenarioScript } from "../types";

const EPISODE_3_QUIZ = {
  question: "Why did the JVM use the Bootstrap Class Loader to find java.lang.String, but the Application Class Loader to find Hello.class?",
  options: [
    "Because java.lang.String is a core Java class stored in rt.jar (or core modules).",
    "Because the Application loader is only for third-party JARs.",
    "Because the Bootstrap loader is faster than the Application loader.",
    "Because Hello.class was compiled with a newer version of Java."
  ],
  correctOptionIndex: 0,
  explanation: "Java organizes classes by trust and origin. Core classes (like String) are loaded by the highly trusted Bootstrap loader. User-created classes (like Hello) are loaded by the Application loader from your classpath."
};

export const CLASS_LOADING_NODES: SystemNode[] = [
  // Class Loaders
  {
    id: "node-bootstrap",
    type: "javaClassLoader",
    position: { x: 500, y: 100 },
    origin: [0.5, 0],
    data: {
      label: "Bootstrap Class Loader",
      kind: "javaClassLoader",
      activeConnections: 0,
      load: 0,
      metadata: {},
      capacity: null,
      securityPolicies: [],
      educational: {
        badges: [
          { label: "Loads", value: "Core Java Classes", color: "bg-green-500/10 border-green-500/20 text-green-700 dark:text-green-400" }
        ],
        notes: {
          whatIsIt: "This is the first and most trusted class loader in the JVM.\n\nIt loads Java's core runtime classes.\n\nExamples:\n\nObject\nString\nSystem\nArrayList\nHashMap",
          whatDoesItDo: "Whenever the JVM needs a core Java class, the request eventually reaches the Bootstrap Loader.\n\nIf it finds the class, the search stops immediately.",
          whenIsItInvolved: "Very early during JVM startup.\n\nMany classes are loaded before your main method even begins.",
          whatIfMissing: "Java itself would not start because essential classes such as Object and String would be unavailable.",
          interestingFact: "The Bootstrap Loader is implemented using native code rather than Java code.",
          interviewTips: "Question:\nWho loads java.lang.String?\n\nAnswer:\nBootstrap Class Loader."
        }
      }
    }
  },
  {
    id: "node-platform",
    type: "javaClassLoader",
    position: { x: 500, y: 250 },
    origin: [0.5, 0],
    data: {
      label: "Platform Class Loader",
      kind: "javaClassLoader",
      activeConnections: 0,
      load: 0,
      metadata: {},
      capacity: null,
      securityPolicies: [],
      educational: {
        badges: [
          { label: "Delegates To", value: "Bootstrap Loader", color: "bg-purple-500/10 border-purple-500/20 text-purple-700 dark:text-purple-400" }
        ],
        notes: {
          whatIsIt: "The Platform Class Loader loads Java platform libraries that are not part of the core runtime.\n\nExamples:\n\njdk.crypto.*\njdk.management.*\njdk.sql.*",
          whatDoesItDo: "It sits between the Bootstrap Loader and the Application Loader.\n\nIf the Bootstrap Loader cannot find a class, the Platform Loader gets a chance.",
          whenIsItInvolved: "When your program requires platform modules provided by the JDK.",
          whatIfMissing: "The Bootstrap Loader would become responsible for too many modules and the loading process would become less organized.",
          interestingFact: "Before Java 9 this role was performed by the Extension Class Loader.",
          interviewTips: "Many interviewers still say Extension Class Loader.\n\nThat terminology refers to Java 8 and earlier."
        }
      }
    }
  },
  {
    id: "node-application",
    type: "javaClassLoader",
    position: { x: 500, y: 400 },
    origin: [0.5, 0],
    data: {
      label: "Application Class Loader",
      kind: "javaClassLoader",
      activeConnections: 0,
      load: 0,
      metadata: {},
      capacity: null,
      securityPolicies: [],
      educational: {
        badges: [
          { label: "Delegates To", value: "Platform Loader", color: "bg-purple-500/10 border-purple-500/20 text-purple-700 dark:text-purple-400" }
        ],
        notes: {
          whatIsIt: "This loader is responsible for loading classes that belong to your application.\n\nExamples:\n\nHello.class\nUserService.class\nProductController.class",
          whatDoesItDo: "When the JVM needs a class, it asks the loader that loaded the current class.\n\nFor user applications, that is usually the Application Class Loader.\n\nBefore loading a class itself, it delegates the request to its parent loader.",
          whenIsItInvolved: "Almost immediately after the JVM starts.\n\nIt is usually responsible for loading your main class.",
          whatIfMissing: "The JVM would not know where your application's classes are stored.",
          interestingFact: "The Application Class Loader typically searches:\n\nclasspath\ntarget/classes\nbuild/classes\ndependency jars",
          interviewTips: "Question:\nWhich class loader usually loads your Spring Boot application classes?\n\nAnswer:\nThe Application Class Loader."
        }
      }
    }
  },
  
  // Classes
  {
    id: "node-hello-class",
    type: "javaClass",
    position: { x: 100, y: 400 },
    data: {
      label: "Hello.class",
      kind: "javaClass",
      activeConnections: 0,
      load: 0,
      metadata: {},
      capacity: null,
      securityPolicies: [],
      educational: {
        badges: [
          { label: "Loaded By", value: "Application Loader", color: "bg-blue-500/10 border-blue-500/20 text-blue-700 dark:text-blue-400" },
          { label: "Depends On", value: "String.class", color: "bg-amber-500/10 border-amber-500/20 text-amber-700 dark:text-amber-400" }
        ],
        notes: {
          codeTitle: "Hello.class (Application Bytecode)",
          codePreview: "public class Hello {\n    public static void main(String[] args) {\n        String name = \"OpenAI\";\n\n        System.out.println(name);\n    }\n}",
          compiledOutput: "Hello.java\n        ↓\njavac\n        ↓\nHello.class",
          whatIsIt: "This is the bytecode generated by the Java compiler.\n\nIt is no longer Java source code and it is not machine code either.\n\nIt is an intermediate representation designed for the JVM.",
          whatDoesItDo: "The JVM reads this file and executes the instructions stored inside it.\n\nDuring execution the JVM may discover additional dependencies such as:\n\njava.lang.String\njava.lang.System\njava.io.PrintStream\n\nThese classes may need to be loaded before execution can continue.",
          whenIsItInvolved: "Immediately after running:\n\njava Hello\n\nthe JVM asks the Application Class Loader to locate and load this class.",
          whatIfMissing: "Error:\nCould not find or load main class Hello\n\nThe JVM cannot start your application without the entry point class.",
          interestingFact: "A .class file contains a Constant Pool which stores references to methods, fields and other classes used by the program.\n\nThis is how the JVM knows that your program depends on String.",
          interviewTips: "Question:\nHow does the JVM know it needs java.lang.String before execution?\n\nAnswer:\nThe dependency information is stored inside the Constant Pool of the class file."
        }
      }
    }
  },
  {
    id: "node-library-jar",
    type: "javaClass",
    position: { x: 100, y: 550 },
    data: {
      label: "my-library.jar",
      kind: "javaClass",
      activeConnections: 0,
      load: 0,
      metadata: {},
      capacity: null,
      securityPolicies: []
    }
  },

  // JVM Execution Engine
  {
    id: "node-jvm-execution",
    type: "jvm",
    position: { x: 700, y: 400 },
    data: {
      label: "JVM Execution Engine",
      kind: "jvm",
      activeConnections: 0,
      load: 0,
      metadata: {},
      capacity: null,
      securityPolicies: [],
      educational: {
        badges: [
          { label: "Role", value: "Executes Bytecode", color: "bg-amber-500/10 border-amber-500/20 text-amber-700 dark:text-amber-400" }
        ],
        notes: {
          whatIsIt: "This is the component responsible for executing bytecode instructions.",
          whatDoesItDo: "The Execution Engine:\n\ninterprets bytecode\nperforms JIT compilation\nexecutes machine instructions\nmanages optimization",
          whenIsItInvolved: "Immediately after classes have been successfully loaded.",
          whatIfMissing: "The JVM could load classes but would never execute them.",
          interestingFact: "Modern JVMs use both:\n\nInterpreter\nJIT Compiler\n\nto balance startup time and runtime performance.",
          interviewTips: "The Execution Engine is different from the Class Loader subsystem.\n\nClass Loaders find classes.\n\nExecution Engine runs them."
        }
      }
    }
  }
];

export const CLASS_LOADING_EDGES: SystemEdge[] = [
  { id: "edge-hello-app", source: "node-hello-class", sourceHandle: "right-source", target: "node-application", targetHandle: "left-target", type: "straight", data: { protocol: "Load", throughputLimit: null, latencyMs: 0, errorRate: 0, middleware: [] } },
  { id: "edge-jar-app", source: "node-library-jar", sourceHandle: "right-source", target: "node-application", targetHandle: "left-target", type: "straight", data: { protocol: "Load", throughputLimit: null, latencyMs: 0, errorRate: 0, middleware: [] } },
  { id: "edge-app-jvm", source: "node-application", sourceHandle: "right-source", target: "node-jvm-execution", targetHandle: "left", type: "straight", data: { protocol: "Execute", throughputLimit: null, latencyMs: 0, errorRate: 0, middleware: [] } },
  
  // Delegation upward edges
  { id: "edge-app-plat", source: "node-application", sourceHandle: "top-source", target: "node-platform", targetHandle: "bottom-target", type: "straight", data: { protocol: "Delegate", throughputLimit: null, latencyMs: 0, errorRate: 0, middleware: [] } },
  { id: "edge-plat-boot", source: "node-platform", sourceHandle: "top-source", target: "node-bootstrap", targetHandle: "bottom-target", type: "straight", data: { protocol: "Delegate", throughputLimit: null, latencyMs: 0, errorRate: 0, middleware: [] } },
  
  // Return downward edges
  { id: "edge-boot-plat-ret", source: "node-bootstrap", sourceHandle: "bottom-source", target: "node-platform", targetHandle: "top-target", type: "straight", data: { protocol: "Return", throughputLimit: null, latencyMs: 0, errorRate: 0, middleware: [] } },
  { id: "edge-plat-app-ret", source: "node-platform", sourceHandle: "bottom-source", target: "node-application", targetHandle: "top-target", type: "straight", data: { protocol: "Return", throughputLimit: null, latencyMs: 0, errorRate: 0, middleware: [] } }
];

export const javaClassLoadingScript: ScenarioScript = {
  id: "java-class-loading",
  title: "How Does Java Find Classes?",
  steps: [
    // --- STEP 1: Idle State ---
    {
      narrative: {
        title: "1. Ready to Execute",
        description: "The JVM is about to run Hello.main(), but it first needs to locate and load Hello.class."
      },
      durationMs: 2500,
      actions: [
        { action: "clear" },
        { action: "highlight", elementIds: ["node-hello-class"] },
        { action: "tooltip", nodeId: "node-hello-class", message: "Ready to load", type: "info" }
      ]
    },

    // --- STEP 2: Hello.class to Application Loader ---
    {
      narrative: {
        title: "2. Loading Hello.class",
        description: "The JVM asks the Application Loader to load the Hello.class file from the classpath."
      },
      durationMs: 3000,
      actions: [
        { action: "clear" },
        { action: "highlight", elementIds: ["node-hello-class", "node-application", "edge-hello-app"] },
        { action: "node-status", nodeId: "node-application", status: "processing" },
        { action: "animate-asset", sourceId: "node-hello-class", targetId: "node-application", assetType: "dot", durationMs: 2000 }
      ]
    },

    // --- STEP 3: Application Loader Checks Its Cache ---
    {
      excludedExperiments: ["missing-class", "missing-dependency", "external-jar"],
      durationMs: 3000,
      narrative: {
        title: "3. Starting Execution",
        description: "The Application Loader loads Hello successfully and passes it to the JVM to start execution."
      },
      actions: [
        { action: "clear" },
        { action: "highlight", elementIds: ["node-application", "node-jvm-execution", "edge-app-jvm"] },
        { action: "node-status", nodeId: "node-application", status: "success" },
        { action: "node-status", nodeId: "node-jvm-execution", status: "processing" },
        { action: "animate-asset", sourceId: "node-application", targetId: "node-jvm-execution", assetType: "dot", durationMs: 2000 },
        { action: "tooltip", nodeId: "node-jvm-execution", message: "Starting execution of Hello.main()", type: "warning" }
      ]
    },

    // --- STEP 4: Dependency Detected ---
    {
      excludedExperiments: ["missing-class", "missing-dependency", "external-jar"],
      autoAdvance: false, // Wait for user
      narrative: {
        title: "4. Dependency Detected",
        description: "Execution reaches `String name = \"Hello\";`. The JVM pauses because it doesn't know what a String is yet."
      },
      actions: [
        { action: "clear" },
        { action: "highlight", elementIds: ["node-jvm-execution"] },
        { action: "node-status", nodeId: "node-jvm-execution", status: "processing" },
        { action: "tooltip", nodeId: "node-jvm-execution", message: "Dependency detected: java.lang.String" }
      ]
    },

    // --- STEP 5: Requesting String (App Loader) ---
    {
      excludedExperiments: ["missing-class", "missing-dependency", "external-jar"],
      durationMs: 2000,
      narrative: {
        title: "5. Requesting java.lang.String",
        description: "A new lookup starts. Because Hello.class was loaded by the Application Loader, the request begins there."
      },
      actions: [
        { action: "clear" },
        { action: "highlight", elementIds: ["node-application", "node-jvm-execution"] },
        { action: "node-status", nodeId: "node-application", status: "processing" }
      ]
    },

    // --- STEP 6: Delegation to Platform ---
    {
      excludedExperiments: ["missing-class", "missing-dependency", "external-jar"],
      durationMs: 2500,
      narrative: {
        title: "6. Delegating Upward",
        description: "Before searching itself, the Application Loader asks its parent (the Platform Loader)."
      },
      actions: [
        { action: "clear" },
        { action: "highlight", elementIds: ["node-application", "node-platform", "edge-app-plat"] },
        { action: "node-status", nodeId: "node-platform", status: "processing" },
        { action: "animate-asset", sourceId: "node-application", targetId: "node-platform", assetType: "dot", durationMs: 1500 }
      ]
    },

    // --- STEP 7: Delegation to Bootstrap ---
    {
      excludedExperiments: ["missing-class", "missing-dependency", "external-jar"],
      durationMs: 2500,
      narrative: {
        title: "7. Delegating to Bootstrap",
        description: "The Platform Loader also delegates upward to the Bootstrap Loader."
      },
      actions: [
        { action: "clear" },
        { action: "highlight", elementIds: ["node-platform", "node-bootstrap", "edge-plat-boot"] },
        { action: "node-status", nodeId: "node-bootstrap", status: "processing" },
        { action: "animate-asset", sourceId: "node-platform", targetId: "node-bootstrap", assetType: "dot", durationMs: 1500 }
      ]
    },

    // --- STEP 8: Bootstrap Finds String ---
    {
      excludedExperiments: ["missing-class", "missing-dependency", "external-jar"],
      durationMs: 2500,
      narrative: {
        title: "8. Bootstrap Finds String",
        description: "The Bootstrap Loader searches the core Java libraries (rt.jar/modules) and finds java.lang.String!"
      },
      actions: [
        { action: "clear" },
        { action: "highlight", elementIds: ["node-bootstrap"] },
        { action: "node-status", nodeId: "node-bootstrap", status: "success" },
        { action: "tooltip", nodeId: "node-bootstrap", message: "Found: java.lang.String", type: "success" }
      ]
    },

    // --- STEP 9: Returning the Result (Part 1) ---
    {
      excludedExperiments: ["missing-class", "missing-dependency", "external-jar"],
      durationMs: 1500,
      narrative: {
        title: "9. Returning the Result",
        description: "The answer travels back down the hierarchy: 'I found it, here you go.'"
      },
      actions: [
        { action: "clear" },
        { action: "highlight", elementIds: ["node-bootstrap", "node-platform", "edge-boot-plat-ret"] },
        { action: "node-status", nodeId: "node-platform", status: "success" },
        { action: "animate-asset", sourceId: "node-bootstrap", targetId: "node-platform", assetType: "dot", durationMs: 1200 }
      ]
    },

    // --- STEP 10: Returning the Result (Part 2) ---
    {
      excludedExperiments: ["missing-class", "missing-dependency", "external-jar"],
      durationMs: 1500,
      narrative: {
        title: "10. Returning the Result",
        description: "The answer travels back down the hierarchy: 'I found it, here you go.'"
      },
      actions: [
        { action: "clear" },
        { action: "highlight", elementIds: ["node-platform", "node-application", "edge-plat-app-ret"] },
        { action: "node-status", nodeId: "node-application", status: "success" },
        { action: "animate-asset", sourceId: "node-platform", targetId: "node-application", assetType: "dot", durationMs: 1200 }
      ]
    },

    // --- STEP 11: Delivering to JVM ---
    {
      excludedExperiments: ["missing-class", "missing-dependency", "external-jar"],
      durationMs: 3000,
      narrative: {
        title: "11. String Loaded",
        description: "The Application Loader delivers the loaded String class to the JVM Execution Engine."
      },
      actions: [
        { action: "clear" },
        { action: "highlight", elementIds: ["node-application", "node-jvm-execution", "edge-app-jvm"] },
        { action: "node-status", nodeId: "node-jvm-execution", status: "success" },
        { action: "animate-asset", sourceId: "node-application", targetId: "node-jvm-execution", assetType: "dot", durationMs: 2000 },
        { action: "tooltip", nodeId: "node-jvm-execution", message: "String.class loaded successfully.", type: "success" }
      ]
    },

    // --- STEP 12: Execution Resumes ---
    {
      excludedExperiments: ["missing-class", "missing-dependency", "external-jar"],
      autoAdvance: false,
      narrative: {
        title: "12. Execution Resumes",
        timelineLabel: "Review",
        description: "With all required classes loaded, the JVM continues executing your program.",
        keyTakeaway: "User code = Application Loader. Core Java = Bootstrap Loader. The JVM delegates upward first!"
      },
      actions: [
        { action: "clear" },
        { action: "highlight", elementIds: ["node-jvm-execution", "node-bootstrap", "node-platform", "node-application"] },
        { action: "node-status", nodeId: "node-bootstrap", status: "success" },
        { action: "node-status", nodeId: "node-platform", status: "success" },
        { action: "node-status", nodeId: "node-application", status: "success" },
        { action: "node-status", nodeId: "node-jvm-execution", status: "success" }
      ],
      quiz: EPISODE_3_QUIZ
    },

    // ════════════════════════════════════════════════════════════
    // EXPERIMENT 1: MISSING CLASS
    // ════════════════════════════════════════════════════════════
    {
      requiredExperiments: ["missing-class"],
      durationMs: 3500,
      narrative: {
        title: "Finding User Code",
        description: "The JVM asks the Application Loader for Hello.class. The Application Loader searches the classpath... but it's not there!"
      },
      actions: [
        { action: "clear" },
        { action: "highlight", elementIds: ["node-jvm-execution", "node-application"] },
        { action: "node-status", nodeId: "node-application", status: "processing" }
      ]
    },
    {
      requiredExperiments: ["missing-class"],
      autoAdvance: false,
      narrative: {
        title: "ClassNotFoundException",
        timelineLabel: "Crash",
        description: "Because no class loader could find the requested class, the JVM throws a ClassNotFoundException and crashes."
      },
      actions: [
        { action: "clear" },
        { action: "highlight", elementIds: ["node-jvm-execution", "node-application"] },
        { action: "node-status", nodeId: "node-application", status: "error" },
        { action: "node-status", nodeId: "node-jvm-execution", status: "error" },
        { action: "tooltip", nodeId: "node-jvm-execution", message: "java.lang.ClassNotFoundException: Hello" }
      ]
    },

    // ════════════════════════════════════════════════════════════
    // EXPERIMENT 2: EXTERNAL LIBRARY
    // ════════════════════════════════════════════════════════════
    {
      requiredExperiments: ["external-jar"],
      durationMs: 3000,
      narrative: {
        title: "External Dependency",
        description: "Your code needs a third-party class from Gson. The JVM requests it, and the Application Loader checks the classpath."
      },
      actions: [
        { action: "clear" },
        { action: "highlight", elementIds: ["node-jvm-execution", "node-application", "node-library-jar", "edge-jar-app"] },
        { action: "node-status", nodeId: "node-application", status: "processing" },
        { action: "tooltip", nodeId: "node-jvm-execution", message: "Needs: com.google.gson.Gson" },
        { action: "animate-asset", sourceId: "node-library-jar", targetId: "node-application", assetType: "dot", durationMs: 1500 }
      ]
    },
    {
      requiredExperiments: ["external-jar"],
      autoAdvance: false,
      narrative: {
        title: "JAR Loaded",
        timelineLabel: "Complete",
        description: "The Application Loader finds the class packed inside my-library.jar and loads it successfully."
      },
      actions: [
        { action: "clear" },
        { action: "highlight", elementIds: ["node-jvm-execution", "node-application", "node-library-jar"] },
        { action: "node-status", nodeId: "node-application", status: "success" },
        { action: "node-status", nodeId: "node-library-jar", status: "success" },
        { action: "node-status", nodeId: "node-jvm-execution", status: "success" }
      ]
    },

    // ════════════════════════════════════════════════════════════
    // EXPERIMENT 3: MISSING DEPENDENCY
    // ════════════════════════════════════════════════════════════
    {
      requiredExperiments: ["missing-dependency"],
      durationMs: 3500,
      narrative: {
        title: "Missing Dependency",
        description: "Hello.class was loaded, but suddenly it tries to use `UserService`. The JVM pauses and requests `UserService`."
      },
      actions: [
        { action: "clear" },
        { action: "highlight", elementIds: ["node-jvm-execution", "node-application"] },
        { action: "node-status", nodeId: "node-jvm-execution", status: "processing" },
        { action: "tooltip", nodeId: "node-jvm-execution", message: "Needs: UserService.class" },
        { action: "node-status", nodeId: "node-application", status: "processing" }
      ]
    },
    {
      requiredExperiments: ["missing-dependency"],
      autoAdvance: false,
      narrative: {
        title: "NoClassDefFoundError",
        timelineLabel: "Crash",
        description: "The Application Loader searches but fails. The JVM throws a NoClassDefFoundError.",
        interviewInsight: "NoClassDefFoundError happens when a class was present during compilation but is missing at runtime."
      },
      actions: [
        { action: "clear" },
        { action: "highlight", elementIds: ["node-jvm-execution", "node-application"] },
        { action: "node-status", nodeId: "node-application", status: "error" },
        { action: "node-status", nodeId: "node-jvm-execution", status: "error" },
        { action: "tooltip", nodeId: "node-jvm-execution", message: "java.lang.NoClassDefFoundError: UserService" }
      ]
    }
  ]
};
