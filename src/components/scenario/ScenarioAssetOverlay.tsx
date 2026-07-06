import { useScenarioStore } from "@/lib/store/useScenarioStore";
import { useReactFlow, useStore } from "@xyflow/react";
import { useEffect, useState } from "react";

export function ScenarioAssetOverlay() {
  const activeAnimation = useScenarioStore(s => s.activeAssetAnimation);
  const { getNode } = useReactFlow();
  
  // Subscribe to canvas transform so the overlay scales and pans with the canvas
  const transform = useStore(s => s.transform);

  const [pos, setPos] = useState<{ x: number, y: number } | null>(null);
  const [targetPos, setTargetPos] = useState<{ x: number, y: number } | null>(null);

  useEffect(() => {
    if (!activeAnimation) {
      setPos(null);
      setTargetPos(null);
      return;
    }

    const source = getNode(activeAnimation.sourceId);
    const target = getNode(activeAnimation.targetId);

    if (source && target) {
      const sourceX = source.position.x + (source.measured?.width || 180) / 2;
      const sourceY = source.position.y + (source.measured?.height || 60) / 2;
      
      const targetX = target.position.x + (target.measured?.width || 180) / 2;
      const targetY = target.position.y + (target.measured?.height || 60) / 2;

      // Start at source immediately
      setPos({ x: sourceX, y: sourceY });
      setTargetPos({ x: targetX, y: targetY });

      // In the next frame, begin moving to target
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setPos({ x: targetX, y: targetY });
        });
      });
    }
  }, [activeAnimation, getNode]);

  if (!activeAnimation || !pos || !targetPos) return null;

  return (
    <div
      className="absolute top-0 left-0 pointer-events-none z-50"
      style={{
        transform: `translate(${transform[0]}px, ${transform[1]}px) scale(${transform[2]})`,
        transformOrigin: "0 0"
      }}
    >
      <div 
        className="absolute bg-background border border-primary text-primary shadow-lg rounded-md p-1.5 flex items-center justify-center"
        style={{
          left: pos.x,
          top: pos.y,
          transform: 'translate(-50%, -50%)',
          transition: pos.x === targetPos.x ? `left ${activeAnimation.durationMs}ms linear, top ${activeAnimation.durationMs}ms linear` : 'none',
        }}
      >
        {activeAnimation.assetType === "file" && (
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/><path d="m9 15 2 2 4-4"/></svg>
        )}
        {activeAnimation.assetType === "binary" && (
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/><path d="M8 13h2"/><path d="M8 17h2"/><path d="M14 13h2"/><path d="M14 17h2"/></svg>
        )}
        {activeAnimation.assetType === "gear" && (
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
        )}
      </div>
    </div>
  );
}
