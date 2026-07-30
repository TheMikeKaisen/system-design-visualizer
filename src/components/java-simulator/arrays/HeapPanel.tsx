"use client";

import React, { useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useJavaArraysStore } from "@/store/useJavaArraysStore";
import { cn } from "@/lib/utils";
import { PrimitiveArray, ObjectArray, ClassInstance, JavaArrayState } from "@/lib/java-simulator/arrays-engine";

const to32BitBinary = (num: number) => {
  return (num >>> 0).toString(2).padStart(32, "0");
};

// --- Recursive HeapNode ---
const HeapNode = ({ 
  address, 
  heap, 
  currentStep, 
  isChild = false 
}: { 
  address: string, 
  heap: JavaArrayState['heap'], 
  currentStep: JavaArrayState,
  isChild?: boolean 
}) => {
  const obj = heap[address];
  if (!obj || obj.isGarbageCollected) return null;

  // Find children if it's an ObjectArray
  let children: string[] = [];
  if (obj.type === "ObjectArray") {
    children = obj.elements
      .filter((el): el is string => typeof el === 'string' && el.startsWith('0x'))
      // Only include children that actually exist in the heap
      .filter(el => heap[el] && !heap[el].isGarbageCollected);
  }

  return (
    <div className="flex flex-col items-center gap-8 relative">
      {/* Visual Tree Connector (only for children) */}
      {isChild && (
        <div className="absolute -top-8 left-1/2 w-px h-8 bg-border/50 -z-10" />
      )}

      {/* Main Block */}
      <motion.div
        layout
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ 
          opacity: 0, 
          scale: 0.9, 
          borderColor: "rgb(239 68 68)", // red-500
          transition: { duration: 0.5 }
        }}
        className={cn(
          "bg-black/40 border border-border/50 rounded-xl flex flex-col overflow-hidden relative shadow-lg min-w-[200px]",
          currentStep.highlightedAddresses?.includes(address) && "border-amber-500/50 shadow-[0_0_15px_rgba(245,158,11,0.2)]",
          isChild && "border-blue-500/30" // Subtle tint for nested blocks
        )}
      >
        {/* Address Header */}
        <div 
          id={`heap-obj-${address}`} // Anchor for incoming pointers
          className="bg-zinc-900/80 px-4 py-2 border-b border-border/50 font-mono text-xs text-center flex items-center justify-between relative"
        >
          <div className="absolute left-0 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-emerald-500/20 shadow-[0_0_8px_rgba(16,185,129,0)]"></div>
          <span className="text-muted-foreground w-full">{address}</span>
        </div>

        {/* Object Content */}
        <div className="p-4 flex flex-col gap-2">
          {obj.type === "PrimitiveArray" || obj.type === "ObjectArray" ? (
            <ArrayBlock 
              address={address} 
              array={obj} 
              showHeaders={currentStep.showObjectHeaders}
              showByteLevel={currentStep.showByteLevel}
            />
          ) : (
            <ObjectBlock obj={obj as ClassInstance} />
          )}
        </div>
      </motion.div>

      {/* Nested Children Container */}
      {children.length > 0 && (
        <div className="flex flex-row gap-8 items-start relative mt-4 p-6 pt-0 border border-border/20 rounded-2xl bg-white/[0.02]">
          <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-2 text-[10px] font-mono text-muted-foreground bg-zinc-950">
            Referenced Elements
          </div>
          {children.map(childAddr => (
            <HeapNode 
              key={childAddr} 
              address={childAddr} 
              heap={heap} 
              currentStep={currentStep} 
              isChild={true} 
            />
          ))}
        </div>
      )}
    </div>
  );
};


export const HeapPanel: React.FC = () => {
  const { scenario, currentStepIndex } = useJavaArraysStore();
  const currentStep = scenario.steps[currentStepIndex];

  // Calculate Roots
  const rootAddresses = useMemo(() => {
    const childAddresses = new Set<string>();
    
    // Pass 1: Collect all references
    Object.values(currentStep.heap).forEach(obj => {
      if (obj.type === "ObjectArray") {
        obj.elements.forEach(el => {
          if (typeof el === 'string' && el.startsWith('0x')) {
            childAddresses.add(el);
          }
        });
      }
    });

    // Pass 2: Roots are anything not in the child set
    return Object.keys(currentStep.heap).filter(addr => !childAddresses.has(addr));
  }, [currentStep.heap]);

  return (
    <div className="flex-1 flex flex-col bg-zinc-950/80 backdrop-blur-md relative h-full">
      <div className="p-4 border-b border-border/50 bg-black/20 flex items-center justify-between">
        <h3 className="font-semibold text-amber-500 flex items-center gap-2">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><ellipse cx="12" cy="5" rx="9" ry="3"></ellipse><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"></path><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"></path></svg>
          Memory Heap
        </h3>
      </div>
      
      <div id="heap-panel-scroll" className="flex-1 overflow-auto p-8 flex gap-12 flex-wrap items-start content-start relative">
        <AnimatePresence>
          {rootAddresses.map(address => (
            <HeapNode 
              key={address} 
              address={address} 
              heap={currentStep.heap} 
              currentStep={currentStep} 
            />
          ))}
        </AnimatePresence>

        {Object.keys(currentStep.heap).length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center text-muted-foreground text-sm">
            Heap is empty.
          </div>
        )}
      </div>
    </div>
  );
};

// --- Sub-components ---

const ArrayBlock = ({ 
  address, 
  array, 
  showHeaders, 
  showByteLevel 
}: { 
  address: string, 
  array: PrimitiveArray | ObjectArray, 
  showHeaders?: boolean,
  showByteLevel?: boolean
}) => {
  return (
    <div className="flex flex-col gap-2 w-full">
      <div className="text-xs font-mono text-center text-amber-400 font-semibold mb-2">
        {array.elementType}[]
      </div>

      <AnimatePresence>
        {showHeaders && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="flex flex-col gap-1 mb-2 border-b border-border/50 pb-3"
          >
            <div className="flex justify-between text-[10px] font-mono bg-white/5 px-2 py-1 rounded">
              <span className="text-muted-foreground">Mark Word</span>
              <span className="text-gray-400">0x000...01</span>
            </div>
            <div className="flex justify-between text-[10px] font-mono bg-white/5 px-2 py-1 rounded">
              <span className="text-muted-foreground">Class Ptr</span>
              <span className="text-blue-400">{array.elementType}[] metadata</span>
            </div>
            <div className="flex justify-between text-[10px] font-mono bg-white/5 px-2 py-1 rounded border border-amber-500/20">
              <span className="text-muted-foreground">Length</span>
              <span className="text-amber-400 font-bold">{array.length}</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex flex-wrap gap-1 justify-center">
        {array.elements.map((el, i) => {
          // If byte level is requested and it's a number, render 32 bits
          if (showByteLevel && typeof el === 'number') {
            const binString = to32BitBinary(el);
            // Split into 4 bytes (8 bits each)
            const bytes = [
              binString.slice(0, 8),
              binString.slice(8, 16),
              binString.slice(16, 24),
              binString.slice(24, 32)
            ];
            
            return (
              <div key={i} className="flex flex-col border border-border/50 rounded overflow-hidden mt-2 w-full">
                <div className="bg-black/50 text-[10px] text-center py-1 text-muted-foreground font-mono">
                  Element {i} ({el})
                </div>
                {bytes.map((byteStr, bIdx) => (
                  <div key={bIdx} className="flex gap-[1px] justify-center p-1 bg-zinc-900 border-t border-border/30">
                    {byteStr.split('').map((bit, bitIdx) => (
                      <div 
                        key={bitIdx}
                        className={cn(
                          "w-4 h-5 flex items-center justify-center text-[9px] font-mono rounded-sm border",
                          bit === '1' ? "bg-primary/20 text-primary border-primary/30" : "bg-black/40 text-gray-500 border-border/50"
                        )}
                      >
                        {bit}
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            );
          }

          // Default rendering
          const isRef = typeof el === 'string' && el.startsWith('0x');
          return (
            <div 
              key={i}
              id={isRef ? `heap-ref-${address}-${i}` : undefined}
              className={cn(
                "w-10 h-10 flex flex-col items-center justify-center border rounded font-mono text-sm relative",
                isRef ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400" :
                el === null || el === "?" ? "bg-white/5 border-border/50 text-muted-foreground" :
                "bg-blue-500/10 border-blue-500/30 text-blue-300"
              )}
            >
              {el === null ? "null" : el}
              
              {/* Output dot for arrows to start from */}
              {isRef && (
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full border border-emerald-500 rounded animate-pulse opacity-20"></div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

const ObjectBlock = ({ obj }: { obj: ClassInstance }) => {
  return (
    <div className="flex flex-col gap-2 w-full min-w-[120px]">
      <div className="text-xs font-mono text-center text-purple-400 font-semibold mb-2">
        {obj.className} Object
      </div>
      <div className="flex justify-center items-center h-12 bg-white/5 border border-white/10 rounded-lg text-sm text-muted-foreground italic">
        (Instance Data)
      </div>
    </div>
  );
};
