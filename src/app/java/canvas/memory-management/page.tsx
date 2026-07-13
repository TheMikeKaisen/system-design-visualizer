"use client";

import { useEffect, useMemo, useState } from "react";
import { ScenarioCanvasRoot } from "@/components/canvas/ScenarioCanvasRoot";
import { 
  javaMemoryMethodAreaScript, 
  JAVA_MEMORY_NODES, 
  JAVA_MEMORY_EDGES
} from "@/lib/scenario/scripts/javaMemoryManagement";
import { useScenarioStore } from "@/lib/store/useScenarioStore";
import { ReactFlowProvider } from "@xyflow/react";

const EPISODE5_EXPERIMENTS = [
  { id: "static-change", label: "Change Static Variable", description: "Simulate what happens when an object modifies robotCount." },
  { id: "ep5-method-area", label: "2 Classes, 2 Methods", description: "Visualize Robot and Factory classes in the Method Area." },
];

export default function JavaMemoryManagementPage() {
  const loadScript = useScenarioStore(s => s.loadScript);
  const activeExperiments = useScenarioStore(s => s.activeExperiments);

  useEffect(() => {
    loadScript(javaMemoryMethodAreaScript);
  }, [loadScript]);

  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    handleResize(); 
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const nodes = useMemo(() => {
    return JAVA_MEMORY_NODES.map(node => {
      const newNode = JSON.parse(JSON.stringify(node));
      
      if (activeExperiments.includes("ep5-method-area")) {
        if (newNode.id === "node-method-area") {
          newNode.data.experiment = "ep5-method-area";
        }
        
        if (newNode.id === "node-source" && newNode.data.educational?.notes) {
          newNode.data.educational.notes.codeTitle = "Robot.java & Factory.java";
          newNode.data.educational.notes.codePreview = `public class Robot {
    public static int robotCount = 0;

    public void sayHello() {
        System.out.println("Hello");
    }

    public void chargeBattery() {
        batteryLevel = 100;
    }
}

public class Factory {
    public static String factoryName = "TechCorp";

    public void createRobot() {
        robotCount++;
    }

    public void shutdown() {
        System.out.println("Factory shutdown");
    }
}`;
        }
      }

      if (isMobile) {
        newNode.data.metadata = { ...newNode.data.metadata, layout: "vertical" };
        
        if (newNode.id === "node-source") {
          newNode.position = { x: 50, y: 0 };
        } else if (newNode.id === "node-method-area") {
          newNode.position = { x: 30, y: 250 };
        }
      }

      return newNode;
    });
  }, [activeExperiments, isMobile]);

  return (
    <main className="w-screen h-screen overflow-hidden">
      <ReactFlowProvider>
        <ScenarioCanvasRoot 
          title="Java: Memory Management (Method Area)"
          experiments={EPISODE5_EXPERIMENTS}
          nodes={nodes} 
          edges={JAVA_MEMORY_EDGES}
          backHref="/java"
          logoSrc="/logo/java.png"
        />
      </ReactFlowProvider>
    </main>
  );
}
