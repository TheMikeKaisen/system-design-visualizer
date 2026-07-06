"use client";

import { useEffect } from "react";
import { ScenarioCanvasRoot } from "@/components/canvas/ScenarioCanvasRoot";
import { javaExecutionScript, JAVA_FLOW_NODES, JAVA_FLOW_EDGES } from "@/lib/scenario/scripts/javaExecutionFlow";
import { useScenarioStore } from "@/lib/store/useScenarioStore";
import { ReactFlowProvider } from "@xyflow/react";

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
          nodes={JAVA_FLOW_NODES} 
          edges={JAVA_FLOW_EDGES} 
        />
      </ReactFlowProvider>
    </main>
  );
}
