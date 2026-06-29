import { ReactFlowProvider } from "@xyflow/react";
import { RotateCcw }         from "lucide-react";
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
          {/* Mobile Landscape Warning Overlay */}
          <div className="md:hidden landscape:hidden fixed inset-0 z-[100] bg-background/95 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center">
            <RotateCcw className="w-12 h-12 mb-4 text-muted-foreground animate-pulse" />
            <h2 className="text-xl font-semibold mb-2 text-foreground">Rotate your device</h2>
            <p className="text-muted-foreground text-sm max-w-[250px]">
              Please rotate your device to landscape mode to use the canvas effectively.
            </p>
          </div>

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
