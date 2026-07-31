'use client';
import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

interface ReferenceLinkProps {
  startId: string; // The ID of the HTML element on the stack (e.g., 'stack-v_s1')
  endId: string;   // The ID of the HTML element on the heap (e.g., 'heap-@1001')
  color?: string;
  containerRef: React.RefObject<HTMLDivElement | null>; // To calculate relative positions
}

export function ReferenceLink({ startId, endId, color = '#a855f7', containerRef }: ReferenceLinkProps) {
  const [path, setPath] = useState('');

  useEffect(() => {
    const updatePath = () => {
      const startEl = document.getElementById(startId);
      const endEl = document.getElementById(endId);
      const container = containerRef.current;

      if (startEl && endEl && container) {
        const startRect = startEl.getBoundingClientRect();
        const endRect = endEl.getBoundingClientRect();
        const containerRect = container.getBoundingClientRect();

        // Calculate relative coordinates
        const startX = startRect.right - containerRect.left;
        const startY = startRect.top + startRect.height / 2 - containerRect.top;

        const endX = endRect.left - containerRect.left;
        const endY = endRect.top + 20 - containerRect.top; // Pointing near the top-left of the heap card

        // Draw a smooth cubic bezier curve
        const controlPointX1 = startX + (endX - startX) / 2;
        const controlPointY1 = startY;
        const controlPointX2 = startX + (endX - startX) / 2;
        const controlPointY2 = endY;

        setPath(`M ${startX} ${startY} C ${controlPointX1} ${controlPointY1}, ${controlPointX2} ${controlPointY2}, ${endX} ${endY}`);
      }
    };

    // Initial draw and setup observers
    updatePath();
    window.addEventListener('resize', updatePath);
    
    // We also use a MutationObserver on the container to detect layout changes when steps change
    let observer: MutationObserver | null = null;
    if (containerRef.current) {
      observer = new MutationObserver(updatePath);
      observer.observe(containerRef.current, { childList: true, subtree: true, attributes: true });
    }

    return () => {
      window.removeEventListener('resize', updatePath);
      if (observer) observer.disconnect();
    };
  }, [startId, endId, containerRef]);

  if (!path) return null;

  return (
    <svg className="absolute inset-0 pointer-events-none z-20" style={{ width: '100%', height: '100%' }}>
      <defs>
        <marker
          id={`arrowhead-${startId}`}
          markerWidth="10"
          markerHeight="7"
          refX="9"
          refY="3.5"
          orient="auto"
        >
          <polygon points="0 0, 10 3.5, 0 7" fill={color} />
        </marker>
        
        {/* Glow filter */}
        <filter id={`glow-${startId}`}>
          <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
          <feMerge>
            <feMergeNode in="coloredBlur"/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>
      </defs>
      
      {/* Invisible thicker path for hover/debugging if needed, or just standard path */}
      <motion.path
        d={path}
        fill="none"
        stroke={color}
        strokeWidth="2"
        markerEnd={`url(#arrowhead-${startId})`}
        filter={`url(#glow-${startId})`}
        initial={{ pathLength: 0, opacity: 0 }}
        animate={{ pathLength: 1, opacity: 0.8 }}
        transition={{ duration: 0.5, ease: "easeInOut" }}
      />
    </svg>
  );
}
