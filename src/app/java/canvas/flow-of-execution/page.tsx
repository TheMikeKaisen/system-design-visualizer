"use client";

import { useEffect, useMemo } from "react";
import { ScenarioCanvasRoot } from "@/components/canvas/ScenarioCanvasRoot";
import { 
  javaExecutionScript, 
  JAVA_FLOW_NODES, 
  JAVA_FLOW_EDGES,
  PLATFORM_INDEPENDENCE_NODES,
  PLATFORM_INDEPENDENCE_EDGES
} from "@/lib/scenario/scripts/javaExecutionFlow";
import { useScenarioStore } from "@/lib/store/useScenarioStore";
import { ReactFlowProvider } from "@xyflow/react";

const EPISODE1_EXPERIMENTS = [
  { id: "platform-independence", label: "Platform Independence", description: "Visualize Write Once, Run Anywhere by fanning out to Windows, Linux, and macOS JVMs." },
  { id: "syntax-error", label: "Introduce Syntax Error", description: "See what happens when the compiler catches invalid code." },
  { id: "disable-jit", label: "Disable JIT Compiler", description: "Force the JVM to interpret bytecode line-by-line without optimization." }
];

export default function JavaExecutionFlowPage() {
  const loadScript = useScenarioStore(s => s.loadScript);
  const activeExperiments = useScenarioStore(s => s.activeExperiments);

  useEffect(() => {
    // Initialize the store with the script for this page
    loadScript(javaExecutionScript);
  }, [loadScript]);

  const isPlatformIndependenceEnabled = activeExperiments.includes("platform-independence");

  const nodes = useMemo(() => isPlatformIndependenceEnabled ? PLATFORM_INDEPENDENCE_NODES : JAVA_FLOW_NODES, [isPlatformIndependenceEnabled]);
  const edges = useMemo(() => isPlatformIndependenceEnabled ? PLATFORM_INDEPENDENCE_EDGES : JAVA_FLOW_EDGES, [isPlatformIndependenceEnabled]);

  return (
    <main className="w-screen h-screen overflow-hidden">
      <ReactFlowProvider>
        <ScenarioCanvasRoot 
          title="Java Internals: How Java Code Executes"
          experiments={EPISODE1_EXPERIMENTS}
          nodes={nodes} 
          edges={edges}
          backHref="/java"
          logoSrc="/logo/java.png"
        />
      </ReactFlowProvider>
    </main>
  );
}
