"use client";

import { useEffect, useRef } from "react";
import { useReactFlow } from "@xyflow/react";
import { useScenarioStore } from "@/lib/store/useScenarioStore";

export function ScenarioCameraDirector() {
  const { getNodes, fitBounds, fitView } = useReactFlow();
  const highlightedElementIds = useScenarioStore(s => s.highlightedElementIds);
  const currentStepIndex = useScenarioStore(s => s.currentStepIndex);
  
  // Track previous step to avoid re-running on every small highlight change 
  // if not necessary, but generally we want to re-frame when step changes.
  const prevStepRef = useRef(currentStepIndex);

  useEffect(() => {
    // Only run if we actually changed steps or if it's the first step
    if (currentStepIndex !== prevStepRef.current || currentStepIndex === 0) {
      prevStepRef.current = currentStepIndex;

      // Small timeout to ensure nodes have been measured by React Flow
      // and state has fully flushed.
      const timer = setTimeout(() => {
        const allNodes = getNodes();
        
        // Find nodes that are currently highlighted
        const activeNodes = allNodes.filter(n => highlightedElementIds.has(n.id));

        if (activeNodes.length === 0) {
          // If nothing is explicitly highlighted, fit the whole view
          fitView({ duration: 1200, padding: 0.2 });
          return;
        }

        // Calculate bounding box of active nodes
        let minX = Infinity;
        let minY = Infinity;
        let maxX = -Infinity;
        let maxY = -Infinity;

        activeNodes.forEach(n => {
          const w = n.measured?.width || 200;
          const h = n.measured?.height || 100;
          
          const pos = (n as any).positionAbsolute || n.position;
          
          const originX = n.origin?.[0] ?? 0;
          const originY = n.origin?.[1] ?? 0;
          
          const x = pos.x - originX * w;
          const y = pos.y - originY * h;

          if (x < minX) minX = x;
          if (y < minY) minY = y;
          if (x + w > maxX) maxX = x + w;
          if (y + h > maxY) maxY = y + h;
        });

        const bounds = {
          x: minX,
          y: minY,
          width: maxX - minX,
          height: maxY - minY,
        };

        // Smoothly move the camera to frame these nodes
        fitBounds(bounds, { duration: 1200, padding: 0.4 });
      }, 50);

      return () => clearTimeout(timer);
    }
  }, [currentStepIndex, highlightedElementIds, getNodes, fitBounds, fitView]);

  return null; // Headless component
}
