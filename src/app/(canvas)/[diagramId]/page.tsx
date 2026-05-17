import { ReactFlowProvider } from "@xyflow/react";
import { Toolbar } from "@/components/toolbar/Toolbar";
import { NodePalette } from "@/components/toolbar/NodePalette";
import { CanvasRoot } from "@/components/canvas/CanvasRoot";
import { InspectorPanel } from "@/components/panels/InspectorPanel";
import { SimulationStatsHUD } from "@/components/hud/SimulationStatsHUD";
import { DiagramLoader } from "@/components/canvas/DiagramLoader";

interface Props {
  params: Promise<{ diagramId: string }>;
}

export default async function DiagramPage({ params }: Props) {
  const { diagramId } = await params;

  return (
    <ReactFlowProvider>
      {/*
       * DiagramLoader runs client-side on mount.
       * It reads localStorage for this diagramId and populates the stores.
       * Phase 5: diagramId === Yjs room ID — this is where collab connects.
       */}
      <DiagramLoader diagramId={diagramId} />

      <div className="flex flex-col h-screen overflow-hidden bg-background">
        <Toolbar />
        <div className="flex flex-1 overflow-hidden">
          <NodePalette />
          <div className="relative flex-1 overflow-hidden">
            <CanvasRoot />
            <SimulationStatsHUD />
          </div>
          <InspectorPanel />
        </div>
      </div>
    </ReactFlowProvider>
  );
}
