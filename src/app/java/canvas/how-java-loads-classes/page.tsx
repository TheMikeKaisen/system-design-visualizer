"use client";

import { useEffect, useMemo } from "react";
import { ScenarioCanvasRoot } from "@/components/canvas/ScenarioCanvasRoot";
import { 
  javaClassLoadingScript, 
  CLASS_LOADING_NODES, 
  CLASS_LOADING_EDGES
} from "@/lib/scenario/scripts/javaClassLoading";
import { useScenarioStore } from "@/lib/store/useScenarioStore";
import { ReactFlowProvider } from "@xyflow/react";

const EPISODE3_EXPERIMENTS = [
  { id: "missing-class", label: "Missing Class", description: "See what happens when you run code that doesn't exist." }
];

export default function JavaClassLoadingPage() {
  const loadScript = useScenarioStore(s => s.loadScript);
  const activeExperiments = useScenarioStore(s => s.activeExperiments);

  useEffect(() => {
    // Initialize the store with the script for this page
    loadScript(javaClassLoadingScript);
  }, [loadScript]);

  const nodes = useMemo(() => {
    const isMissingClass = activeExperiments.includes("missing-class");

    // Start with core nodes
    const baseNodes = CLASS_LOADING_NODES.filter(n => {
      // Remove Hello.class if it's the missing class experiment
      if (isMissingClass && n.id === "node-hello-class") return false;
      if (n.id === "node-library-jar") return false;
      return true;
    });

    return baseNodes;
  }, [activeExperiments]);

  const edges = useMemo(() => {
    const isMissingClass = activeExperiments.includes("missing-class");

    return CLASS_LOADING_EDGES.filter(e => {
      if (isMissingClass && e.source === "node-hello-class") return false;
      if (e.source === "node-library-jar") return false;
      return true;
    });
  }, [activeExperiments]);

  return (
    <main className="w-screen h-screen overflow-hidden">
      <ReactFlowProvider>
        <ScenarioCanvasRoot 
          title="Java Internals: How Java Finds Classes"
          experiments={EPISODE3_EXPERIMENTS}
          nodes={nodes} 
          edges={edges}
          backHref="/java"
          logoSrc="/logo/java.png"
        />
      </ReactFlowProvider>
    </main>
  );
}
