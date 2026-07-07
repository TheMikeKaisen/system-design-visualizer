"use client";

import { useTheme } from "next-themes";
import { useState, useEffect } from "react";
import {
  Background,
  BackgroundVariant,
  ReactFlow,
  type Node,
  type Edge,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";

import { nodeTypes, edgeTypes } from "@/components/nodes";
import { CanvasErrorBoundary } from "./CanvasErrorBoundary";
import { ScenarioToolbar } from "../scenario/ScenarioToolbar";
import { ScenarioTimeline } from "../scenario/ScenarioTimeline";
import { ScenarioContextPanel } from "../scenario/ScenarioContextPanel";
import { ScenarioAssetOverlay } from "../scenario/ScenarioAssetOverlay";
import { ScenarioCameraDirector } from "../scenario/ScenarioCameraDirector";

interface ScenarioCanvasRootProps {
  title?: string;
  experiments?: { id: string; label: string; description: string }[];
  nodes: Node[];
  edges: Edge[];
  contextPanel?: React.ReactNode;
  toolbarExtras?: React.ReactNode;
}

export function ScenarioCanvasRoot({ title, experiments, nodes, edges, contextPanel, toolbarExtras }: ScenarioCanvasRootProps) {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <CanvasErrorBoundary>
      <div className="flex flex-col w-full h-full bg-background overflow-hidden">
        
        {/* Top Toolbar */}
        <ScenarioToolbar title={title} experiments={experiments} extras={toolbarExtras} />

        <div className="flex-1 flex overflow-hidden">
          
          {/* Main Canvas Area */}
          <div className="flex-1 relative flex flex-col">
            <div className="flex-1 relative">
              <ReactFlow
                nodes={nodes}
                edges={edges}
                nodeTypes={nodeTypes}
                edgeTypes={edgeTypes}
                nodesDraggable={false}
                nodesConnectable={false}
                fitView
                fitViewOptions={{ padding: 0.2 }}
                onInit={(instance) => {
                  setTimeout(() => {
                    instance.fitView({ padding: 0.2, duration: 800 });
                  }, 100);
                }}
                proOptions={{ hideAttribution: true }}
                colorMode={mounted ? ((resolvedTheme as "light" | "dark") || "light") : "light"}
              >
                <Background variant={BackgroundVariant.Dots} gap={24} size={1} />
                <ScenarioAssetOverlay />
                <ScenarioCameraDirector />
              </ReactFlow>
            </div>
            
            {/* Bottom Timeline */}
            <ScenarioTimeline />
          </div>

          {/* Right Context Panel */}
          {contextPanel ?? <ScenarioContextPanel />}
        </div>
      </div>
    </CanvasErrorBoundary>
  );
}
