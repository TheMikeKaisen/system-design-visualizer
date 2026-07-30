"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useJavaArraysStore } from "@/store/useJavaArraysStore";

interface ArrowData {
  id: string;
  startX: number;
  startY: number;
  endX: number;
  endY: number;
  color: string;
}

export const ReferenceArrows: React.FC = () => {
  const { scenario, currentStepIndex } = useJavaArraysStore();
  const currentStep = scenario.steps[currentStepIndex];
  
  const [arrows, setArrows] = useState<ArrowData[]>([]);

  const calculateArrows = useCallback(() => {
    const newArrows: ArrowData[] = [];
    
    // We need a common parent to calculate relative offsets. 
    // Assuming this SVG is absolutely positioned filling the nearest relative parent (the MemoryCanvas).
    const svgContainer = document.getElementById("reference-arrows-container");
    if (!svgContainer) return;
    const containerRect = svgContainer.getBoundingClientRect();

    const getCenter = (el: HTMLElement) => {
      const rect = el.getBoundingClientRect();
      return {
        x: rect.left + rect.width / 2 - containerRect.left,
        y: rect.top + rect.height / 2 - containerRect.top
      };
    };

    const getRightCenter = (el: HTMLElement) => {
      const rect = el.getBoundingClientRect();
      return {
        x: rect.right - containerRect.left,
        y: rect.top + rect.height / 2 - containerRect.top
      };
    };
    
    const getLeftCenter = (el: HTMLElement) => {
      const rect = el.getBoundingClientRect();
      return {
        x: rect.left - containerRect.left,
        y: rect.top + rect.height / 2 - containerRect.top
      };
    };
    
    const getBottomCenter = (el: HTMLElement) => {
      const rect = el.getBoundingClientRect();
      return {
        x: rect.left + rect.width / 2 - containerRect.left,
        y: rect.bottom - containerRect.top
      };
    };
    
    const getTopCenter = (el: HTMLElement) => {
      const rect = el.getBoundingClientRect();
      return {
        x: rect.left + rect.width / 2 - containerRect.left,
        y: rect.top - containerRect.top
      };
    };

    // 1. Stack to Heap Arrows
    currentStep.stack.forEach(frame => {
      frame.variables.forEach(v => {
        if (typeof v.value === 'string' && v.value.startsWith('0x')) {
          const stackAnchor = document.getElementById(`stack-var-${v.name}`);
          const heapTarget = document.getElementById(`heap-obj-${v.value}`);
          
          if (stackAnchor && heapTarget) {
            const start = getRightCenter(stackAnchor);
            const end = getLeftCenter(heapTarget);
            
            newArrows.push({
              id: `stack-${v.name}-to-${v.value}`,
              startX: start.x,
              startY: start.y,
              endX: end.x,
              endY: end.y,
              color: "rgb(16 185 129)" // emerald-500
            });
          }
        }
      });
    });

    // 2. Heap to Heap Arrows (for ObjectArrays/2D arrays)
    Object.entries(currentStep.heap).forEach(([address, obj]) => {
      if (obj.type === "ObjectArray") {
        obj.elements.forEach((el, idx) => {
          if (typeof el === 'string' && el.startsWith('0x')) {
            const sourceAnchor = document.getElementById(`heap-ref-${address}-${idx}`);
            const targetAnchor = document.getElementById(`heap-obj-${el}`);
            
            if (sourceAnchor && targetAnchor) {
              const start = getBottomCenter(sourceAnchor);
              const end = getTopCenter(targetAnchor);
              
              newArrows.push({
                id: `heap-${address}-${idx}-to-${el}`,
                startX: start.x,
                startY: start.y,
                endX: end.x,
                endY: end.y,
                color: "rgb(59 130 246)" // blue-500
              });
            }
          }
        });
      }
    });

    setArrows(newArrows);
  }, [currentStep]);

  // Recalculate on step change, window resize, or scroll
  useEffect(() => {
    // Small delay to allow DOM/framer-motion to render the new elements
    const timer = setTimeout(calculateArrows, 150);
    const timer2 = setTimeout(calculateArrows, 400); // safety catch after animations
    
    const stackScroll = document.getElementById("stack-panel-scroll");
    const heapScroll = document.getElementById("heap-panel-scroll");
    
    // Use requestAnimationFrame for smooth scrolling updates
    let scrollTicking = false;
    const onScroll = () => {
      if (!scrollTicking) {
        window.requestAnimationFrame(() => {
          calculateArrows();
          scrollTicking = false;
        });
        scrollTicking = true;
      }
    };
    
    window.addEventListener('resize', calculateArrows);
    stackScroll?.addEventListener('scroll', onScroll, { passive: true });
    heapScroll?.addEventListener('scroll', onScroll, { passive: true });
    
    return () => {
      clearTimeout(timer);
      clearTimeout(timer2);
      window.removeEventListener('resize', calculateArrows);
      stackScroll?.removeEventListener('scroll', onScroll);
      heapScroll?.removeEventListener('scroll', onScroll);
    };
  }, [calculateArrows]);

  return (
    <>
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes draw-arrow {
          to {
            stroke-dashoffset: 0;
          }
        }
      `}} />
      <svg 
        id="reference-arrows-container"
      className="absolute inset-0 w-full h-full pointer-events-none z-50"
      style={{ overflow: 'visible' }}
    >
      <defs>
        <marker id="arrowhead-emerald" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
          <polygon points="0 0, 10 3.5, 0 7" fill="rgb(16 185 129)" />
        </marker>
        <marker id="arrowhead-blue" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
          <polygon points="0 0, 10 3.5, 0 7" fill="rgb(59 130 246)" />
        </marker>
      </defs>
      
      {arrows.map(arrow => {
        // Create a smooth cubic bezier curve
        const isHorizontal = arrow.color.includes('185'); // Emerald = Stack to Heap (left to right)
        let controlPoint1X, controlPoint1Y, controlPoint2X, controlPoint2Y;
        
        if (isHorizontal) {
          const dx = Math.max(Math.abs(arrow.endX - arrow.startX) * 0.5, 50);
          controlPoint1X = arrow.startX + dx;
          controlPoint1Y = arrow.startY;
          controlPoint2X = arrow.endX - dx;
          controlPoint2Y = arrow.endY;
        } else {
          // Vertical-ish curve (Heap to Heap)
          const dy = Math.max(Math.abs(arrow.endY - arrow.startY) * 0.5, 50);
          controlPoint1X = arrow.startX;
          controlPoint1Y = arrow.startY + dy;
          controlPoint2X = arrow.endX;
          controlPoint2Y = arrow.endY - dy;
        }

        const pathData = `M ${arrow.startX} ${arrow.startY} C ${controlPoint1X} ${controlPoint1Y}, ${controlPoint2X} ${controlPoint2Y}, ${arrow.endX} ${arrow.endY}`;
        const markerId = isHorizontal ? "url(#arrowhead-emerald)" : "url(#arrowhead-blue)";
        
        return (
          <path
            key={arrow.id}
            d={pathData}
            fill="none"
            stroke={arrow.color}
            strokeWidth="2.5"
            strokeLinecap="round"
            markerEnd={markerId}
            className="drop-shadow-md animate-draw-arrow"
            style={{
              strokeDasharray: 1000,
              strokeDashoffset: 0,
              animation: "draw-arrow 0.5s ease-out forwards"
            }}
          />
        );
      })}
      </svg>
    </>
  );
};
