'use client';
import React, { useRef } from 'react';
import { OOPMemoryState } from '@/lib/java-simulator/oop-engine';
import { StackFrame } from './StackFrame';
import { HeapObjectCard } from './HeapObjectCard';
import { ReferenceLink } from './ReferenceLink';

interface MemoryContainerProps {
  state: OOPMemoryState;
}

// Removed hardcoded absolute positioning

export function MemoryContainer({ state }: MemoryContainerProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  // Find all active references to draw lines
  const references: { start: string; end: string; color?: string }[] = [];
  const linkColors = ["#a855f7", "#3b82f6", "#10b981", "#f59e0b"]; // Purple, Blue, Green, Yellow
  
  state.stackFrames.forEach(frame => {
    frame.variables.forEach(v => {
      if (v.isReference && v.refId && v.value !== 'null') {
        // Only draw if the target heap object actually exists in current state
        const targetIndex = state.heapObjects.findIndex(obj => obj.id === v.refId);
        if (targetIndex !== -1) {
          references.push({
            start: `stack-${v.id}`,
            end: `heap-${v.refId}`,
            color: linkColors[targetIndex % linkColors.length]
          });
        }
      }
    });
  });

  return (
    <div ref={containerRef} className="flex-1 w-full h-full flex flex-col md:flex-row bg-zinc-950/50 rounded-xl border border-border/40 overflow-hidden relative">
      
      {/* SVG Layer for Reference Arrows */}
      {references.map((ref, i) => (
        <ReferenceLink 
          key={`${ref.start}-${ref.end}`} // Only remount when the reference itself is new
          startId={ref.start} 
          endId={ref.end} 
          color={ref.color}
          containerRef={containerRef} 
        />
      ))}

      {/* Stack (Left Pane) */}
      <div className="w-full md:w-80 border-b md:border-b-0 md:border-r border-border/40 flex flex-col bg-zinc-950 z-10 relative">
        <div className="bg-zinc-900/80 px-4 py-2 border-b border-border/40 backdrop-blur sticky top-0 z-20">
          <h2 className="text-sm font-semibold tracking-wide text-foreground flex items-center gap-2">
            <svg className="w-4 h-4 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" /></svg>
            Stack Memory
          </h2>
        </div>
        
        <div className="flex-1 p-4 overflow-y-auto gap-8 flex flex-col-reverse">
          {/* We render stack frames in reverse so the newest is at the top or bottom depending on preference. 
              Usually stack grows downwards in text, but conceptually upwards. We'll use flex-col-reverse to push newest to bottom. 
              Wait, standard visualization usually puts the active frame on TOP. Let's not use flex-col-reverse if we just map normally, 
              but let's reverse the array so active (last pushed) is at the top. */}
          {[...state.stackFrames].reverse().map((frame) => (
            <StackFrame key={frame.id} frame={frame} />
          ))}
          
          {state.stackFrames.length === 0 && (
            <div className="h-full flex flex-col items-center justify-center text-muted-foreground opacity-50 space-y-2">
              <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
              <span className="text-sm font-medium">Stack is empty</span>
            </div>
          )}
        </div>
      </div>

      {/* Heap (Right Pane) */}
      <div className="flex-1 relative bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-zinc-900 via-zinc-950 to-black z-10 overflow-hidden">
        <div className="absolute top-0 inset-x-0 bg-gradient-to-b from-zinc-900/80 to-transparent px-4 py-2 z-20 pointer-events-none">
          <h2 className="text-sm font-semibold tracking-wide text-foreground flex items-center gap-2">
            <svg className="w-4 h-4 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
            Heap Memory
          </h2>
        </div>
        
        <div className="absolute inset-0 pt-14 pb-6 px-6 overflow-y-auto flex flex-col items-center gap-6">
          {state.heapObjects.length === 0 && (
            <div className="h-full w-full flex flex-col items-center justify-center text-muted-foreground opacity-30 space-y-2">
              <svg className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M14 10l-2 1m0 0l-2-1m2 1v2.5M20 7l-2 1m2-1l-2-1m2 1v2.5M14 4l-2-1-2 1M4 7l2-1M4 7l2 1M4 7v2.5M12 21l-2-1m2 1l2-1m-2 1v-2.5M6 18l-2-1v-2.5M18 18l2-1v-2.5" /></svg>
              <span className="text-sm font-medium">Heap is empty</span>
            </div>
          )}

          {state.heapObjects.map((obj) => (
            <HeapObjectCard key={obj.id} obj={obj} />
          ))}
        </div>
      </div>

    </div>
  );
}
