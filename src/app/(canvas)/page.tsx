import { ReactFlowProvider } from "@xyflow/react";
import { Toolbar } from "@/components/toolbar/Toolbar";
import { NodePalette } from "@/components/toolbar/NodePalette";
import { CanvasRoot } from "@/components/canvas/CanvasRoot";
import { InspectorPanel } from "@/components/panels/InspectorPanel";
import { SimulationStatsHUD } from "@/components/hud/SimulationStatsHUD";
import { redirect } from "next/navigation";
import { localStoragePersistence } from "@/lib/persistence/localStoragePersistence";


// export default function CanvasPage() {
//   return (
//     /**
//      * ReactFlowProvider must wrap anything that uses useReactFlow().
//      * It lives here (not in CanvasRoot) so sibling components like
//      * InspectorPanel can also call useReactFlow() if needed in the future.
//      */
//     <ReactFlowProvider>
//       <div className="flex flex-col h-screen overflow-hidden bg-background">
//         {/* Top bar */}
//         <Toolbar />

//         {/* Body — three-column layout */}
//         <div className="flex flex-1 overflow-hidden">
//           <NodePalette />

//           {/* Canvas — relative so overlay and HUD can position against it */}
//           <div className="relative flex-1 overflow-hidden">
//             <CanvasRoot />
//             <SimulationStatsHUD />
//           </div>

//           <InspectorPanel />
//         </div>
//       </div>
//     </ReactFlowProvider>
//   );
// }

export default function CanvasIndexPage() {
  // Redirect to the "resolve" page which will check localStorage client-side
  redirect("/canvas/resolve");
}