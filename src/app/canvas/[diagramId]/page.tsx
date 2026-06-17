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
import { MetricsDashboard }  from "@/components/observability/MetricsDashboard";
import { MetricsCollectorMount } from "@/components/observability/MetricsCollectorMount";
import { env }               from "@/lib/env";
import { auth }              from "@/lib/auth/auth";

interface Props {
  params: Promise<{ diagramId: string }>;
}

export default async function DiagramPage({ params }: Props) {
  const { diagramId } = await params;
  const collabEnabled = env.NEXT_PUBLIC_COLLAB_ENABLED;
  const session = await auth();

  return (
    <ReactFlowProvider>
      <CollabProvider diagramId={diagramId} enabled={collabEnabled}>
        <DiagramLoader diagramId={diagramId} collabEnabled={collabEnabled} />
        <MetricsCollectorMount />
        <PresenceAvatars />

        <div className="flex flex-col h-screen overflow-hidden bg-background">
          <Toolbar user={session?.user} />

          <div className="flex flex-1 overflow-hidden">
            <NodePalette />

            <div className="relative flex-1 overflow-hidden" data-testid="canvas-root" id="canvas-root">
              <CanvasRoot />
              <RemoteCursors />
              <SimulationStatsHUD />
              <MetricsDashboard />
            </div>

            <InspectorPanel />
          </div>
        </div>
      </CollabProvider>
    </ReactFlowProvider>
  );
}
