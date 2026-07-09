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
import { MobileToolbar } from "../scenario/mobile/MobileToolbar";
import { MobileFAB } from "../scenario/mobile/MobileFAB";
import { MobileSimulationOverlay } from "../scenario/mobile/MobileSimulationOverlay";
import { SystemNode, SystemEdge } from "@/types";

interface ScenarioCanvasRootProps {
  title?: string;
  experiments?: { id: string; label: string; description: string }[];
  nodes: SystemNode[];
  edges: SystemEdge[];
  contextPanel?: React.ReactNode;
  toolbarExtras?: React.ReactNode;
  backHref?: string;
  logoSrc?: string;
}

export function ScenarioCanvasRoot({ title = "System Design Visualizer", experiments, nodes, edges, contextPanel, toolbarExtras, backHref, logoSrc }: ScenarioCanvasRootProps) {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Derive product / lesson for mobile toolbar
  const [product, ...restLesson] = (title || "").split(": ");
  const lesson = restLesson.join(": ");

  return (
    <CanvasErrorBoundary>
      <div className="flex flex-col w-full h-full bg-background overflow-hidden">
        
        {/* Desktop Toolbar (hidden on mobile) */}
        <ScenarioToolbar title={title} experiments={experiments} extras={toolbarExtras} backHref={backHref} logoSrc={logoSrc} />

        {/* Mobile Toolbar (hidden on desktop) */}
        <MobileToolbar
          backHref={backHref}
          logoSrc={logoSrc}
          product={product}
          lesson={lesson}
          experiments={experiments}
        />

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
            
            {/* Bottom Timeline (hidden on mobile) */}
            <ScenarioTimeline />
          </div>

          {/* Right Context Panel — mounted on all screens, CSS-hidden on mobile so timer still runs */}
          <div className="hidden sm:flex">
            {contextPanel ?? <ScenarioContextPanel nodes={nodes} />}
          </div>
        </div>

        {/* Mobile-only floating UI */}
        <MobileSimulationOverlay />
        <MobileFAB />
      </div>
    </CanvasErrorBoundary>
  );
}

