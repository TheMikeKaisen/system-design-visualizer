"use client";

import { useEffect, useMemo, useState } from "react";
import { Position } from "@xyflow/react";
import { ScenarioCanvasRoot } from "@/components/canvas/ScenarioCanvasRoot";
import { 
  javaClassLifecycleScript, 
  JAVA_LIFECYCLE_NODES, 
  JAVA_LIFECYCLE_EDGES
} from "@/lib/scenario/scripts/javaClassLifecycle";
import { useScenarioStore } from "@/lib/store/useScenarioStore";
import { ReactFlowProvider } from "@xyflow/react";

const EPISODE4_EXPERIMENTS = [
  { id: "corrupted-bytecode", label: "Corrupted Bytecode", description: "Inject malicious or malformed bytecode and see where it fails." },
  { id: "missing-dependency", label: "Missing Dependency", description: "Remove a required class before linking happens." },
  { id: "load-without-init", label: "Load without Initialization", description: "Use Class.forName(..., false, loader) to stop the lifecycle early." }
];

export default function JavaClassLifecyclePage() {
  const loadScript = useScenarioStore(s => s.loadScript);
  const activeExperiments = useScenarioStore(s => s.activeExperiments);

  useEffect(() => {
    // Initialize the store with the script for this page
    loadScript(javaClassLifecycleScript);
  }, [loadScript]);

  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    handleResize(); // Check immediately
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Dynamic node updates based on active experiments
  const nodes = useMemo(() => {
    return JAVA_LIFECYCLE_NODES.map(node => {
      // Create a deep copy to avoid mutating the constant
      const newNode = JSON.parse(JSON.stringify(node));
      
      const isLoadWithoutInit = activeExperiments.includes("load-without-init");
      const isCorruptedBytecode = activeExperiments.includes("corrupted-bytecode");
      const isMissingDependency = activeExperiments.includes("missing-dependency");

      // We can inject specific logic or code previews into nodes if an experiment is active
      if (isLoadWithoutInit && newNode.id === "node-resolution" && newNode.data.educational?.notes) {
        newNode.data.educational.notes.codePreview = "Class<?> clazz = Class.forName(\"Hello\", false, classLoader);\nSystem.out.println(\"Class loaded but not initialized yet.\");";
      }
      
      if (isCorruptedBytecode && newNode.id === "node-verification" && newNode.data.educational?.notes) {
        newNode.data.educational.notes.codePreview = "// CAFEBABE header modified to CAFEDEAD\n// The Bytecode Verifier rejects this.";
      }

      if (isMissingDependency && newNode.id === "node-resolution" && newNode.data.educational?.notes) {
        newNode.data.educational.notes.codePreview = "public class Hello {\n    // SomeMissingClass is nowhere on the classpath\n    SomeMissingClass obj = new SomeMissingClass();\n}";
      }

      // Vertical layout overrides for mobile
      if (isMobile) {
        newNode.data.metadata = { ...newNode.data.metadata, layout: "vertical" };
        
        if (newNode.id === "node-loading") {
          newNode.position = { x: 50, y: 0 };
        } else if (newNode.id === "node-linking-group") {
          newNode.position = { x: 20, y: 110 };
          newNode.style = { ...newNode.style, width: 240, height: 420 };
        } else if (newNode.id === "node-verification") {
          newNode.position = { x: 30, y: 50 };
        } else if (newNode.id === "node-preparation") {
          // preparation node is taller due to the mini-monitor, so we shift it up slightly
          // to make the vertical visual gaps between the 3 nodes identical
          newNode.position = { x: 30, y: 165 };
        } else if (newNode.id === "node-resolution") {
          newNode.position = { x: 30, y: 310 };
        } else if (newNode.id === "node-initialization") {
          newNode.position = { x: 50, y: 580 };
        } else if (newNode.id === "node-ready") {
          newNode.position = { x: 50, y: 730 };
        }
      }

      return newNode;
    });
  }, [activeExperiments, isMobile]);

  return (
    <main className="w-screen h-screen overflow-hidden">
      <ReactFlowProvider>
        <ScenarioCanvasRoot 
          title="Java: The Class Lifecycle"
          experiments={EPISODE4_EXPERIMENTS}
          nodes={nodes} 
          edges={JAVA_LIFECYCLE_EDGES}
          backHref="/java"
          logoSrc="/logo/java.png"
        />
      </ReactFlowProvider>
    </main>
  );
}
