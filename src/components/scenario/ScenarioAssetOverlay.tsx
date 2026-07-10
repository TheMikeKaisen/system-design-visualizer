import { useScenarioStore } from "@/lib/store/useScenarioStore";
import { useReactFlow, useStore } from "@xyflow/react";
import { useEffect, useState } from "react";

function AssetAnimation({ animation, getNode }: any) {
  const [pos, setPos] = useState<{ x: number, y: number } | null>(null);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    const source = getNode(animation.sourceId);
    const target = getNode(animation.targetId);

    if (source && target) {
      // Helper to compute absolute position for child nodes
      const getAbsolutePosition = (node: any): { x: number, y: number } => {
        let x = node.position?.x || 0;
        let y = node.position?.y || 0;
        let current = node;
        
        while (current.parentId) {
          const parent = getNode(current.parentId);
          if (!parent) break;
          x += parent.position?.x || 0;
          y += parent.position?.y || 0;
          current = parent;
        }
        return { x, y };
      };

      const srcPos = getAbsolutePosition(source);
      const tgtPos = getAbsolutePosition(target);

      const srcOriginX = source.origin?.[0] ?? 0;
      const srcOriginY = source.origin?.[1] ?? 0;
      const tgtOriginX = target.origin?.[0] ?? 0;
      const tgtOriginY = target.origin?.[1] ?? 0;

      const srcW = source.measured?.width ?? (source as any).width ?? 180;
      const srcH = source.measured?.height ?? (source as any).height ?? 56;
      const tgtW = target.measured?.width ?? (target as any).width ?? 180;
      const tgtH = target.measured?.height ?? (target as any).height ?? 56;

      const getHandlePos = (node: any, posAbsolute: any, type: 'source'|'target', posType: 'top'|'bottom'|'left'|'right') => {
        const handles = node.internals?.handleBounds?.[type];
        if (handles && handles.length > 0) {
          const h = handles.find((h: any) => h.position === posType || h.id?.includes(posType)) || handles[0];
          return { x: posAbsolute.x + h.x + h.width / 2, y: posAbsolute.y + h.y + h.height / 2 };
        }
        return null;
      };

      const srcCenterY = srcPos.y + (0.5 - srcOriginY) * srcH;
      const tgtCenterY = tgtPos.y + (0.5 - tgtOriginY) * tgtH;
      const srcCenterX = srcPos.x + (0.5 - srcOriginX) * srcW;
      const tgtCenterX = tgtPos.x + (0.5 - tgtOriginX) * tgtW;

      const dx = tgtCenterX - srcCenterX;
      const dy = tgtCenterY - srcCenterY;

      let sourceX, sourceY, targetX, targetY;

      if (Math.abs(dy) > Math.abs(dx)) {
        // Vertical movement
        if (dy < 0) {
          // Going UP: source TOP -> target BOTTOM
          const sPos = getHandlePos(source, srcPos, 'source', 'top');
          const tPos = getHandlePos(target, tgtPos, 'target', 'bottom');
          sourceX = sPos ? sPos.x : srcCenterX;
          sourceY = sPos ? sPos.y : srcPos.y - srcOriginY * srcH;
          targetX = tPos ? tPos.x : tgtCenterX;
          targetY = tPos ? tPos.y : tgtPos.y + (1 - tgtOriginY) * tgtH;
        } else {
          // Going DOWN: source BOTTOM -> target TOP
          const sPos = getHandlePos(source, srcPos, 'source', 'bottom');
          const tPos = getHandlePos(target, tgtPos, 'target', 'top');
          sourceX = sPos ? sPos.x : srcCenterX;
          sourceY = sPos ? sPos.y : srcPos.y + (1 - srcOriginY) * srcH;
          targetX = tPos ? tPos.x : tgtCenterX;
          targetY = tPos ? tPos.y : tgtPos.y - tgtOriginY * tgtH;
        }
      } else {
        // Horizontal movement
        if (dx > 0) {
          // Going RIGHT: source RIGHT -> target LEFT
          const sPos = getHandlePos(source, srcPos, 'source', 'right');
          const tPos = getHandlePos(target, tgtPos, 'target', 'left');
          sourceX = sPos ? sPos.x : srcPos.x + (1 - srcOriginX) * srcW;
          sourceY = sPos ? sPos.y : srcCenterY;
          targetX = tPos ? tPos.x : tgtPos.x - tgtOriginX * tgtW;
          targetY = tPos ? tPos.y : tgtCenterY;
        } else {
          // Going LEFT: source LEFT -> target RIGHT
          const sPos = getHandlePos(source, srcPos, 'source', 'left');
          const tPos = getHandlePos(target, tgtPos, 'target', 'right');
          sourceX = sPos ? sPos.x : srcPos.x - srcOriginX * srcW;
          sourceY = sPos ? sPos.y : srcCenterY;
          targetX = tPos ? tPos.x : tgtPos.x + (1 - tgtOriginX) * tgtW;
          targetY = tPos ? tPos.y : tgtCenterY;
        }
      }

      // Start at source immediately
      setPos({ x: sourceX, y: sourceY });
      setIsAnimating(false);

      // In the next frame, begin moving to target
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setIsAnimating(true);
          setPos({ x: targetX, y: targetY });
        });
      });
    }
  }, [animation, getNode]);

  if (!pos) return null;

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
        transition: isAnimating ? `left ${animation.durationMs}ms linear, top ${animation.durationMs}ms linear` : 'none',
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
