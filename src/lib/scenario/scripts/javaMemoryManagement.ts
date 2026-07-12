import { SystemNode, SystemEdge } from "@/types";
import { createNode } from "@/components/nodes/NodeFactory";
import { ScenarioScript } from "@/lib/scenario/types";

export const JAVA_MEMORY_NODES: SystemNode[] = [
  createNode({
    kind: "javaSource",
    forceId: "node-source",
    label: "Robot.java",
    position: { x: 50, y: 150 },
  }),
  createNode({
    kind: "javaMethodArea",
    forceId: "node-method-area",
    label: "Method Area (Metaspace)",
    position: { x: 550, y: 100 },
  }),
];

JAVA_MEMORY_NODES[0].data.educational = {
  notes: {
    whatIsIt: "Java Source Code",
    interviewTips: "",
    codeLanguage: "java",
    codeTitle: "Robot.java",
    codePreview: `public class Robot {
    // Static Fields (Shared)
    public static int robotCount = 0;
    public static final String BRAND = "TechCorp";

    // Instance Fields (Per Object)
    private String name;
    private int batteryLevel;

    public void sayHello() {
        System.out.println("Hello!");
    }
}`,
  },
};

JAVA_MEMORY_NODES[1].data.educational = {
  notes: {
    whatIsIt: "The Method Area is a shared memory region inside the JVM that stores information about classes that have been loaded into memory.\n\nA good way to think about it is:\n- **The Heap** stores objects.\n- **The Stack** stores method execution state.\n- **The Method Area** stores everything the JVM knows about classes.\n\nIf the Heap is a city full of buildings (objects), the Method Area is the architectural blueprint office that stores the designs of those buildings.",
    whatDoesItDo: "It stores:\n**1. Class Metadata**\nInformation describing the class itself (e.g., Class Name, Superclass, Interfaces, Modifiers).\n\n**2. Method Metadata and Bytecode**\nThe JVM stores method definitions only once. Every object shares this single method definition.\n\n**3. Field Metadata**\nThe definition of the field, not the field value for each object.\n\n**4. Static Variables**\nBelong to the class itself. There is only one copy regardless of how many objects exist.\n\n**5. Runtime Constant Pool**\nStores symbolic references used by bytecode (Class references, Method references, Field references, String references, Numeric constants).",
    whyNeeded: "Imagine this code:\n\n`Robot r1 = new Robot();`\n`Robot r2 = new Robot();`\n`Robot r3 = new Robot();`\n\nWithout the Method Area, every object would need to carry its own copy of methods, field definitions, class information, and inheritance information.\n\nThis would waste enormous amounts of memory. Instead, Java stores the class definition once in the Method Area, and all objects share it.",
    interestingFact: "Before Java 8, the Method Area was implemented as the Permanent Generation (PermGen). After Java 8, it was replaced by Metaspace, which uses native memory. For educational purposes: Method Area = Metaspace is a reasonable simplification.",
    interviewTips: "**What does NOT live in the Method Area?**\n- Objects (Heap)\n- Object Fields (Heap)\n- Local Variables (Stack)\n- Method Execution State (Stack)\n\n**Is there one Method Area per object or class?**\nNo. There is exactly 1 JVM and 1 Method Area shared by all loaded classes.\n\n**Do string literals live in the Method Area?**\nThis is a big misconception. The reference belongs to the class (in the Method Area), but the actual String object lives in the Heap's String Pool.\n\n**Is the Constant Pool the same as the String Pool?**\nNo. Runtime Constant Pool (Method Area) contains references. String Pool (Heap) contains actual String objects.\n\n**Is Method Area garbage collected?**\nYes. If classes become unreachable and their class loaders are unloaded, JVM may reclaim Method Area memory.",
  },
};

export const JAVA_MEMORY_EDGES: SystemEdge[] = [
  {
    id: "edge-load",
    source: "node-source",
    target: "node-method-area",
    sourceHandle: "right",
    targetHandle: "left",
    type: "straight",
    data: {
      protocol: "Execute",
      latencyMs: 1500,
      throughputLimit: null,
      errorRate: 0,
      middleware: [],
    },
  },
];

export const javaMemoryMethodAreaScript: ScenarioScript = {
  id: "java-memory-method-area",
  title: "Java Memory Management - Method Area",
  steps: [
    {
      narrative: {
        title: "Class Loading",
        description: "When the JVM starts or a class is first referenced, the ClassLoader reads the .class file and stores its blueprint in the Method Area."
      },
      durationMs: 2500,
      actions: [
        { action: "clear" },
        { action: "highlight", elementIds: ["node-source", "node-method-area"] },
        { action: "node-status", nodeId: "node-method-area", status: "success" }
      ],
    },
  ],
};
