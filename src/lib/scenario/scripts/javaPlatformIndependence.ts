import { ScenarioScript } from "../types";
import { SystemNode, SystemEdge } from "@/types";

// ─── Node factory helpers ─────────────────────────────────────────────────
function mkNode(id: string, type: string, x: number, y: number, label: string, kind: string, extra: Record<string, unknown> = {}): SystemNode {
  return {
    id, type,
    position: { x, y },
    data: { label, kind: kind as any, activeConnections: 0, load: 0, metadata: {}, capacity: null, securityPolicies: [], ...extra },
  };
}
function mkEdge(id: string, source: string, target: string, label?: string): SystemEdge {
  return { id, source, target, type: "straight", label, data: { protocol: "HTTP", throughputLimit: null, latencyMs: 0, errorRate: 0, middleware: [] } };
}
function dot(src: string, tgt: string, ms = 1200) {
  return { action: "animate-asset" as const, sourceId: src, targetId: tgt, assetType: "dot" as const, durationMs: ms };
}

// ─── Shared top nodes (platform-agnostic layer) ───────────────────────────
const NODE_SOURCE   = mkNode("pi-source",   "javaSource",   400, 40,  "Hello.java",       "javaSource", { metadata: { layout: "vertical" } });
const NODE_COMPILER = mkNode("pi-compiler", "javaCompiler", 400, 160, "javac Compiler",   "javaCompiler", { metadata: { layout: "vertical" } });
const NODE_BYTECODE = mkNode("pi-bytecode", "javaBytecode", 400, 280, "Hello.class",      "javaBytecode", { hero: true, metadata: { layout: "vertical" } });

// ─── Platform Boundary node ───────────────────────────────────────────────
const NODE_BOUNDARY = mkNode("pi-boundary", "platformBoundary", -100, 370, "Platform Boundary", "platformBoundary" as any);

// ─── Single-platform nodes per OS ─────────────────────────────────────────
function makeSinglePlatformNodes(os: "linux" | "windows" | "macos"): SystemNode[] {
  const configs: Record<string, { osLabel: string; jvmLabel: string; cpuLabel: string; osColor: string; cpuArch: string }> = {
    linux:   { osLabel: "Linux OS",   jvmLabel: "Linux JVM",   cpuLabel: "ARM CPU",           osColor: "orange", cpuArch: "ARM" },
    windows: { osLabel: "Windows OS", jvmLabel: "Windows JVM", cpuLabel: "Intel x64 CPU",     osColor: "blue",   cpuArch: "x64" },
    macos:   { osLabel: "macOS",      jvmLabel: "macOS JVM",   cpuLabel: "Apple Silicon CPU", osColor: "purple", cpuArch: "ARM64" },
  };
  const c = configs[os];
  return [
    mkNode(`pi-osframe-${os}`, "javaOsFrame", 300, 500, c.osLabel, "javaOsFrame" as any, { metadata: { os, width: 380, height: 320 } }),
    mkNode(`pi-jvm-${os}`,    "jvm",         400, 550, c.jvmLabel, "jvm", { metadata: { layout: "vertical" } }),
    mkNode(`pi-cpu-${os}`,    "javaCpu",     400, 720, c.cpuLabel, "javaCpu", { metadata: { layout: "vertical" } }),
  ];
}

function makeSinglePlatformEdges(os: string): SystemEdge[] {
  return [
    mkEdge("pi-e1", "pi-source",   "pi-compiler"),
    mkEdge("pi-e2", "pi-compiler", "pi-bytecode"),
    mkEdge("pi-e3", "pi-bytecode", `pi-jvm-${os}`),
    mkEdge("pi-e4", `pi-jvm-${os}`, `pi-cpu-${os}`, "Machine Code"),
  ];
}

export function getPlatformNodes(os: "linux" | "windows" | "macos"): SystemNode[] {
  return [NODE_SOURCE, NODE_COMPILER, NODE_BYTECODE, NODE_BOUNDARY, ...makeSinglePlatformNodes(os)];
}
export function getPlatformEdges(os: "linux" | "windows" | "macos"): SystemEdge[] {
  return makeSinglePlatformEdges(os);
}

// ─── Compare-all nodes ────────────────────────────────────────────────────
const COMPARE_OS_CONFIGS = [
  { os: "windows", x: 60,  jvmY: 550, cpuY: 720, frameX: -40, frameY: 500 },
  { os: "linux",   x: 400, jvmY: 550, cpuY: 720, frameX: 300, frameY: 500 },
  { os: "macos",   x: 740, jvmY: 550, cpuY: 720, frameX: 640, frameY: 500 },
] as const;

function makeCompareNodes(): SystemNode[] {
  const osNodes: SystemNode[] = [];
  for (const cfg of COMPARE_OS_CONFIGS) {
    const single = makeSinglePlatformNodes(cfg.os);
    single.forEach(n => {
      if (n.id.includes("jvm"))     { n.position.x = cfg.x; n.position.y = cfg.jvmY; }
      if (n.id.includes("cpu"))     { n.position.x = cfg.x; n.position.y = cfg.cpuY; }
      if (n.id.includes("osframe")){ n.position.x = cfg.frameX; n.position.y = cfg.frameY; (n.data.metadata as any).width = 380; (n.data.metadata as any).height = 320; }
    });
    osNodes.push(...single);
  }
  const compareBytecode = { ...NODE_BYTECODE, position: { x: 400, y: 280 } };
  return [NODE_SOURCE, NODE_COMPILER, compareBytecode, NODE_BOUNDARY, ...osNodes];
}

function makeCompareEdges(): SystemEdge[] {
  const edges: SystemEdge[] = [
    mkEdge("pi-e1", "pi-source", "pi-compiler"),
    mkEdge("pi-e2", "pi-compiler", "pi-bytecode"),
  ];
  for (const cfg of COMPARE_OS_CONFIGS) {
    edges.push(mkEdge(`pi-e3-${cfg.os}`, "pi-bytecode", `pi-jvm-${cfg.os}`));
    edges.push(mkEdge(`pi-e4-${cfg.os}`, `pi-jvm-${cfg.os}`, `pi-cpu-${cfg.os}`, "Machine Code"));
  }
  return edges;
}

export const COMPARE_ALL_NODES: SystemNode[] = makeCompareNodes();
export const COMPARE_ALL_EDGES: SystemEdge[] = makeCompareEdges();

// ─── Quiz ─────────────────────────────────────────────────────────────────
export const EPISODE_2_QUIZ = [
  {
    question: "Why doesn't Hello.class need recompilation when moving from Windows to Linux?",
    options: [
      { text: "Because Linux can convert Windows EXE files automatically", correct: false },
      { text: "Because the JVM on Linux translates the Bytecode into Linux machine code", correct: true },
      { text: "Because CPUs understand Bytecode natively", correct: false },
      { text: "Because Java source code is platform-independent", correct: false },
    ],
    explanation: "The JVM is the translator. It's different on every platform — but it always reads the same Bytecode."
  },
  {
    question: "You switch the CPU from ARM to Intel x64. What changes?",
    options: [
      { text: "Hello.java needs to be rewritten", correct: false },
      { text: "Hello.class is automatically updated", correct: false },
      { text: "Only the JVM's output changes — it produces different machine code", correct: true },
      { text: "Nothing — Java doesn't care about CPUs", correct: false },
    ],
    explanation: "The Bytecode stays identical. The JVM silently re-targets its output for the new CPU. Two levels of abstraction, one .class file."
  }
];

// ─── The Script ───────────────────────────────────────────────────────────
export const platformIndependenceScript: ScenarioScript = {
  id: "java-platform-independence",
  title: "How Can The Same Program Run Everywhere?",
  steps: [
    {
      durationMs: 2500,
      narrative: {
        title: "Your Source Code",
        timelineLabel: "Source",
        question: "Where does the journey begin?",
        explanation: "You write Java once. On Windows, on Linux, on a Mac — the source file is always identical. This is where the story begins.",
        keyTakeaway: "Source code never crosses the platform boundary.",
      },
      actions: [
        { action: "highlight", elementIds: ["pi-source"] },
        { action: "node-status", nodeId: "pi-source", status: "processing" },
      ],
    },
    {
      durationMs: 2500,
      narrative: {
        title: "Compilation",
        timelineLabel: "Compile",
        question: "What does the compiler do?",
        explanation: "The javac compiler reads your source. Its job isn't to make Windows code or Linux code — it produces something completely different.",
        interviewInsight: "javac does NOT produce machine code. It produces platform-independent Bytecode.",
      },
      actions: [
        { action: "highlight", elementIds: ["pi-source", "pi-compiler", "pi-e1"] },
        { action: "node-status", nodeId: "pi-source", status: "success" },
        { action: "node-status", nodeId: "pi-compiler", status: "processing" },
        dot("pi-source", "pi-compiler", 1800),
      ],
    },
    {
      autoAdvance: false,
      narrative: {
        title: "The Secret: Bytecode",
        timelineLabel: "Bytecode",
        question: "How is Hello.class different?",
        explanation: "The compiler produces Bytecode — an intermediate language that no CPU understands natively, but every JVM on Earth can read. It is the true hero of platform independence.",
        keyTakeaway: "Bytecode sits safely above the OS and Hardware layer.",
      },
      actions: [
        { action: "highlight", elementIds: ["pi-compiler", "pi-bytecode", "pi-e2"] },
        { action: "node-status", nodeId: "pi-compiler", status: "success" },
        { action: "node-status", nodeId: "pi-bytecode", status: "processing" },
        dot("pi-compiler", "pi-bytecode", 1800),
      ],
    },
    {
      durationMs: 3000,
      narrative: {
        title: "Crossing the Boundary",
        timelineLabel: "Cross Boundary",
        question: "What happens when you deploy?",
        explanation: "The Bytecode crosses the platform boundary. Nothing about the file changes. But where it goes next is entirely up to the JVM installed on this machine.",
      },
      actions: [
        { action: "highlight", elementIds: ["pi-bytecode", "pi-boundary"] },
        { action: "node-status", nodeId: "pi-boundary", status: "processing" },
        { action: "node-status", nodeId: "pi-bytecode", status: "success" },
      ],
    },
    {
      durationMs: 3500,
      narrative: {
        title: "The JVM Translates",
        timelineLabel: "Translate",
        question: "How does the machine understand it?",
        explanation: "The JVM is installed on this specific machine. It knows how to talk to this OS and this CPU. It reads universal Bytecode and produces machine code that only this hardware understands.",
        interviewInsight: "The JVM abstracts both the operating system AND the CPU architecture. It is the translator.",
      },
      actions: [
        { action: "node-status", nodeId: "pi-boundary", status: "success" },
        { action: "highlight", elementIds: ["pi-bytecode", "pi-jvm-linux", "pi-e3", "pi-osframe-linux"] },
        { action: "node-status", nodeId: "pi-jvm-linux", status: "processing" },
        dot("pi-bytecode", "pi-jvm-linux", 1000),
      ],
      excludedExperiments: ["no-jvm", "compare-all", "windows", "macos"],
    },
    {
      durationMs: 3500,
      narrative: {
        title: "The JVM Translates",
        timelineLabel: "Translate",
        question: "How does the machine understand it?",
        explanation: "The JVM is installed on this specific machine. It knows how to talk to this OS and this CPU. It reads universal Bytecode and produces machine code that only this hardware understands.",
      },
      actions: [
        { action: "node-status", nodeId: "pi-boundary", status: "success" },
        { action: "highlight", elementIds: ["pi-bytecode", "pi-jvm-windows", "pi-e3", "pi-osframe-windows"] },
        { action: "node-status", nodeId: "pi-jvm-windows", status: "processing" },
        dot("pi-bytecode", "pi-jvm-windows", 1000),
      ],
      requiredExperiments: ["windows"],
      excludedExperiments: ["no-jvm", "compare-all"],
    },
    {
      durationMs: 3500,
      narrative: {
        title: "The JVM Translates",
        timelineLabel: "Translate",
        question: "How does the machine understand it?",
        explanation: "The JVM is installed on this specific machine. It knows how to talk to this OS and this CPU. It reads universal Bytecode and produces machine code that only this hardware understands.",
      },
      actions: [
        { action: "node-status", nodeId: "pi-boundary", status: "success" },
        { action: "highlight", elementIds: ["pi-bytecode", "pi-jvm-macos", "pi-e3", "pi-osframe-macos"] },
        { action: "node-status", nodeId: "pi-jvm-macos", status: "processing" },
        dot("pi-bytecode", "pi-jvm-macos", 1000),
      ],
      requiredExperiments: ["macos"],
      excludedExperiments: ["no-jvm", "compare-all"],
    },
    {
      durationMs: 3500,
      narrative: {
        title: "The Same File — Three JVMs",
        timelineLabel: "Compare",
        question: "Can it run everywhere simultaneously?",
        explanation: "The exact same Hello.class flows into every JVM simultaneously. Not a copy. Not a recompiled version. The same bytes — and each JVM reads them perfectly.",
      },
      actions: [
        { action: "node-status", nodeId: "pi-boundary", status: "success" },
        { action: "highlight", elementIds: ["pi-bytecode", "pi-jvm-linux", "pi-jvm-windows", "pi-jvm-macos"] },
        { action: "node-status", nodeId: "pi-jvm-linux", status: "processing" },
        { action: "node-status", nodeId: "pi-jvm-windows", status: "processing" },
        { action: "node-status", nodeId: "pi-jvm-macos", status: "processing" },
        dot("pi-bytecode", "pi-jvm-linux", 1000),
        dot("pi-bytecode", "pi-jvm-windows", 1000),
        dot("pi-bytecode", "pi-jvm-macos", 1000),
      ],
      requiredExperiments: ["compare-all"],
    },
    {
      durationMs: 2500,
      autoAdvance: false,
      narrative: {
        title: "No JVM Installed",
        timelineLabel: "No JVM",
        question: "What happens if there is no JVM?",
        explanation: "Hello.class is perfectly valid — the Bytecode is fine. But without a JVM to translate it, this OS cannot execute it. Platform independence depends on the JVM being present.",
      },
      actions: [
        { action: "node-status", nodeId: "pi-boundary", status: "success" },
        { action: "node-status", nodeId: "pi-jvm-linux", status: "error" },
        { action: "tooltip", nodeId: "pi-jvm-linux", message: "No JVM installed" },
      ],
      requiredExperiments: ["no-jvm"],
    },
    {
      durationMs: 2000,
      narrative: {
        title: "Execution",
        timelineLabel: "Execute",
        question: "What does the CPU execute?",
        explanation: "The CPU executes the machine code. It never saw the Bytecode. It never needed to.",
      },
      actions: [
        { action: "highlight", elementIds: ["pi-jvm-linux", "pi-cpu-linux", "pi-e4"] },
        { action: "node-status", nodeId: "pi-jvm-linux", status: "success" },
        { action: "node-status", nodeId: "pi-cpu-linux", status: "success" },
        dot("pi-jvm-linux", "pi-cpu-linux", 1500),
      ],
      excludedExperiments: ["no-jvm", "compare-all", "windows", "macos"],
    },
    {
      durationMs: 2000,
      narrative: {
        title: "Execution",
        timelineLabel: "Execute",
        question: "What does the CPU execute?",
        explanation: "The CPU executes the machine code. It never saw the Bytecode. It never needed to.",
      },
      actions: [
        { action: "highlight", elementIds: ["pi-jvm-windows", "pi-cpu-windows", "pi-e4-windows"] },
        { action: "node-status", nodeId: "pi-jvm-windows", status: "success" },
        { action: "node-status", nodeId: "pi-cpu-windows", status: "success" },
        dot("pi-jvm-windows", "pi-cpu-windows", 1500),
      ],
      requiredExperiments: ["windows"],
      excludedExperiments: ["no-jvm", "compare-all"],
    },
    {
      durationMs: 2000,
      narrative: {
        title: "Execution",
        timelineLabel: "Execute",
        question: "What does the CPU execute?",
        explanation: "The CPU executes the machine code. It never saw the Bytecode. It never needed to.",
      },
      actions: [
        { action: "highlight", elementIds: ["pi-jvm-macos", "pi-cpu-macos", "pi-e4-macos"] },
        { action: "node-status", nodeId: "pi-jvm-macos", status: "success" },
        { action: "node-status", nodeId: "pi-cpu-macos", status: "success" },
        dot("pi-jvm-macos", "pi-cpu-macos", 1500),
      ],
      requiredExperiments: ["macos"],
      excludedExperiments: ["no-jvm", "compare-all"],
    },
    {
      durationMs: 2000,
      narrative: {
        title: "Three Paths, One Result",
        timelineLabel: "Execute",
        question: "What is the final result?",
        explanation: "Three different JVMs. Three different machine code outputs. One identical Hello.class.",
      },
      actions: [
        { action: "highlight", elementIds: ["pi-jvm-linux", "pi-jvm-windows", "pi-jvm-macos", "pi-cpu-linux", "pi-cpu-windows", "pi-cpu-macos"] },
        { action: "node-status", nodeId: "pi-jvm-linux", status: "success" },
        { action: "node-status", nodeId: "pi-jvm-windows", status: "success" },
        { action: "node-status", nodeId: "pi-jvm-macos", status: "success" },
        { action: "node-status", nodeId: "pi-cpu-linux", status: "success" },
        { action: "node-status", nodeId: "pi-cpu-windows", status: "success" },
        { action: "node-status", nodeId: "pi-cpu-macos", status: "success" },
        dot("pi-jvm-linux", "pi-cpu-linux", 1500),
        dot("pi-jvm-windows", "pi-cpu-windows", 1500),
        dot("pi-jvm-macos", "pi-cpu-macos", 1500),
      ],
      requiredExperiments: ["compare-all"],
    },
    {
      autoAdvance: false,
      narrative: {
        title: "Write Once, Run Anywhere",
        timelineLabel: "Review",
        question: "Why is Java platform independent?",
        explanation: "The source code never crosses the platform boundary. Only the Bytecode does — and every JVM on Earth knows how to read it.",
        keyTakeaway: "Bytecode + JVM = Platform Independence",
      },
      actions: [
        { action: "node-status", nodeId: "pi-boundary", status: "success" },
      ],
      excludedExperiments: ["no-jvm"],
      quiz: EPISODE_2_QUIZ,
    },
  ],
};
