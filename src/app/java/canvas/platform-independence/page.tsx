"use client";

import { useEffect, useState, useMemo } from "react";
import { ReactFlowProvider } from "@xyflow/react";
import { ScenarioCanvasRoot } from "@/components/canvas/ScenarioCanvasRoot";
import { platformIndependenceScript, getPlatformNodes, getPlatformEdges, COMPARE_ALL_NODES, COMPARE_ALL_EDGES } from "@/lib/scenario/scripts/javaPlatformIndependence";
import { useScenarioStore } from "@/lib/store/useScenarioStore";
import { PlatformSelector } from "@/components/scenario/PlatformSelector";
import { Ep2ContextPanel } from "@/components/scenario/Ep2ContextPanel";

type Platform = "linux" | "windows" | "macos";

const EPISODE2_EXPERIMENTS = [
  { id: "no-jvm", label: "No JVM Installed", description: "What happens when you deploy Java on a machine without a JVM installed?" }
];

function PageInner() {
  const loadScript = useScenarioStore(s => s.loadScript);
  const reset      = useScenarioStore(s => s.reset);
  const activeExperiments = useScenarioStore(s => s.activeExperiments);
  const toggleExperiment = useScenarioStore(s => s.toggleExperiment);

  const [platform, setPlatform] = useState<Platform>("linux");
  
  const isComparing = activeExperiments.includes("compare-all");

  useEffect(() => {
    useScenarioStore.setState(state => {
      const exps = state.activeExperiments.filter(e => e === "compare-all" || e === "no-jvm") as string[];
      if (!exps.includes("linux")) {
        return { activeExperiments: [...exps, "linux"] };
      }
      return state;
    });
    loadScript(platformIndependenceScript);
  }, [loadScript]);

  function handleSelectPlatform(p: Platform) {
    setPlatform(p);
    useScenarioStore.setState(state => {
      const exps = state.activeExperiments.filter(e => e === "compare-all" || e === "no-jvm") as string[];
      return { activeExperiments: [...exps, p] };
    });
    if (isComparing) toggleExperiment("compare-all");
    reset();
    loadScript(platformIndependenceScript);
  }

  const nodes = useMemo(
    () => isComparing ? COMPARE_ALL_NODES : getPlatformNodes(platform),
    [platform, isComparing]
  );
  const edges = useMemo(
    () => isComparing ? COMPARE_ALL_EDGES : getPlatformEdges(platform),
    [platform, isComparing]
  );

  const selector = (
    <PlatformSelector
      selectedPlatform={platform}
      onSelect={handleSelectPlatform}
      isComparing={isComparing}
      onCompare={() => toggleExperiment("compare-all")}
      onSingle={() => toggleExperiment("compare-all")}
    />
  );

  return (
    <ScenarioCanvasRoot
      title="Java Internals: Platform Independence"
      experiments={EPISODE2_EXPERIMENTS}
      nodes={nodes}
      edges={edges}
      backHref="/java"
      logoSrc="/logo/java.png"
      contextPanel={<Ep2ContextPanel selectedPlatform={platform} isComparing={isComparing} onCompare={() => toggleExperiment("compare-all")} />}
      toolbarExtras={selector}
    />
  );
}

export default function PlatformIndependencePage() {
  return (
    <main className="w-screen h-screen overflow-hidden">
      <ReactFlowProvider>
        <PageInner />
      </ReactFlowProvider>
    </main>
  );
}
