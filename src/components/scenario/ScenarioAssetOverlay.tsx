import { useScenarioStore } from "@/lib/store/useScenarioStore";
import { useReactFlow, useStore } from "@xyflow/react";
import { useEffect, useState } from "react";

function AssetAnimation({ animation, getNode }: any) {
  const [pos, setPos] = useState<{ x: number, y: number } | null>(null);
  const [targetPos, setTargetPos] = useState<{ x: number, y: number } | null>(null);

  useEffect(() => {
    const source = getNode(animation.sourceId);
    const target = getNode(animation.targetId);

    if (source && target) {
      const isVertical = source.data?.metadata?.layout === "vertical";

      const sourceX = isVertical 
        ? source.position.x + (source.measured?.width || 180) / 2 
        : source.position.x + (source.measured?.width || 180);
      const sourceY = isVertical 
        ? source.position.y + (source.measured?.height || 56) 
        : source.position.y + 28;
      
      const targetX = isVertical 
        ? target.position.x + (target.measured?.width || 180) / 2 
        : target.position.x;
      const targetY = isVertical 
        ? target.position.y 
        : target.position.y + 28;

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
  }, [animation, getNode]);

  if (!pos || !targetPos) return null;

  return (
    <div 
      className={
        animation.assetType === "dot"
          ? "absolute flex items-center justify-center pointer-events-none z-10"
          : "absolute bg-background border border-primary text-primary shadow-lg rounded-md p-1.5 flex items-center justify-center pointer-events-none z-10"
      }
      style={{
        left: pos.x,
        top: pos.y,
        transform: 'translate(-50%, -50%)',
        transition: pos.x === targetPos.x ? `left ${animation.durationMs}ms linear, top ${animation.durationMs}ms linear` : 'none',
      }}
    >
      {animation.assetType === "file" && (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/><path d="m9 15 2 2 4-4"/></svg>
      )}
      {animation.assetType === "binary" && (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/><path d="M8 13h2"/><path d="M8 17h2"/><path d="M14 13h2"/><path d="M14 17h2"/></svg>
      )}
      {animation.assetType === "gear" && (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
      )}
      {animation.assetType === "dot" && (
        <div className="w-5 h-5 rounded-full bg-yellow-400 border-[3px] border-background shadow-[0_0_15px_rgba(250,204,21,0.8)]" />
      )}
    </div>
  );
}

export function ScenarioAssetOverlay() {
  const activeAnimations = useScenarioStore(s => s.activeAssetAnimations);
  const { getNode } = useReactFlow();
  
  const transform = useStore(s => s.transform);

  if (!activeAnimations || activeAnimations.length === 0) return null;

  return (
    <div
      className="absolute top-0 left-0 pointer-events-none z-10"
      style={{
        transform: `translate(${transform[0]}px, ${transform[1]}px) scale(${transform[2]})`,
        transformOrigin: "0 0"
      }}
    >
      {activeAnimations.map((anim) => (
        <AssetAnimation key={anim.id} animation={anim} getNode={getNode} />
      ))}
    </div>
  );
}
