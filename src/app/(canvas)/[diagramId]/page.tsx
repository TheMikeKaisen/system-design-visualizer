import { ReactFlowProvider } from "@xyflow/react";
import { Toolbar }           from "@/components/toolbar/Toolbar";
import { NodePalette }       from "@/components/toolbar/NodePalette";
import { CanvasRoot }        from "@/components/canvas/CanvasRoot";
import { InspectorPanel }    from "@/components/panels/InspectorPanel";
import { SimulationStatsHUD } from "@/components/hud/SimulationStatsHUD";
import { DiagramLoader }     from "@/components/canvas/DiagramLoader";
import { CollabProvider }    from "@/components/collaboration/CollabProvider";
import { RemoteCursors }     from "@/components/collaboration/RemoteCursors";
import { PresenceAvatars }   from "@/components/collaboration/PresenceAvatars";
import { env }               from "@/lib/env";

interface Props {
  params: Promise<{ diagramId: string }>;
}

export default async function DiagramPage({ params }: Props) {
  const { diagramId } = await params;
  const collabEnabled = env.NEXT_PUBLIC_COLLAB_ENABLED;

  return (
    <ReactFlowProvider>
      <CollabProvider diagramId={diagramId} enabled={collabEnabled}>
        <DiagramLoader diagramId={diagramId} collabEnabled={collabEnabled} />
        <PresenceAvatars />

        <div className="flex flex-col h-screen overflow-hidden bg-background">
          <Toolbar />

          <div className="flex flex-1 overflow-hidden">
            <NodePalette />

            <div className="relative flex-1 overflow-hidden">
              <CanvasRoot />
              <RemoteCursors />
              <SimulationStatsHUD />
            </div>

            <InspectorPanel />
          </div>
        </div>
      </CollabProvider>
    </ReactFlowProvider>
  );
}
