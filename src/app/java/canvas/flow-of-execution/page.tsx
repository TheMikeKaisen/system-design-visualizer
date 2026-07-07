"use client";

import { useEffect } from "react";
import { ScenarioCanvasRoot } from "@/components/canvas/ScenarioCanvasRoot";
import { 
  javaExecutionScript, 
  JAVA_FLOW_NODES, 
  JAVA_FLOW_EDGES
} from "@/lib/scenario/scripts/javaExecutionFlow";
import { useScenarioStore } from "@/lib/store/useScenarioStore";
import { ReactFlowProvider } from "@xyflow/react";

const EPISODE1_EXPERIMENTS = [
  { id: "syntax-error", label: "Introduce Syntax Error", description: "See what happens when the compiler catches invalid code." },
  { id: "disable-jit", label: "Disable JIT Compiler", description: "Force the JVM to interpret bytecode line-by-line without optimization." }
];

export default function JavaExecutionFlowPage() {
  const loadScript = useScenarioStore(s => s.loadScript);

  useEffect(() => {
    // Initialize the store with the script for this page
    loadScript(javaExecutionScript);
  }, [loadScript]);

  return (
    <main className="w-screen h-screen overflow-hidden">
      <ReactFlowProvider>
        <ScenarioCanvasRoot 
          title="Java Internals: How Java Code Executes"
          experiments={EPISODE1_EXPERIMENTS}
          nodes={JAVA_FLOW_NODES} 
          edges={JAVA_FLOW_EDGES}

          backHref="/java"
          logoSrc="/logo/java.png"
        />
      </ReactFlowProvider>
    </main>
  );
}
