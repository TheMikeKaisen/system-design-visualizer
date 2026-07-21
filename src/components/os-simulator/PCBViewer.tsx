"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, ChevronUp } from "lucide-react";
import type { OSProcess } from "@/lib/os-simulator/engine";
import { cn } from "@/lib/utils";

interface PCBViewerProps {
  process: OSProcess;
  className?: string;
}

export function PCBViewer({ process, className }: PCBViewerProps) {
  const [isExpanded, setIsExpanded] = useState(process.state === "running" || process.pcb?.forceExpand === true);
  
  useEffect(() => {
    setIsExpanded(process.state === "running" || process.pcb?.forceExpand === true);
  }, [process.state, process.pcb?.forceExpand]);

  const pcb = process.pcb;

  if (!pcb) {
    return (
      <div className={cn("p-6 flex flex-col items-center justify-center border border-dashed border-border/50 rounded-xl bg-card/20", className)}>
        <p className="text-sm text-muted-foreground/60 italic">No Process Control Block allocated</p>
      </div>
    );
  }

  // Define the stacked blocks to match the user's diagram with explanations
  const blocks = [
    { 
      id: "state",
      label: "Process State", 
      value: process.state.toUpperCase(),
      explanation: "Current status (running, ready, etc.)"
    },
    { 
      id: "pid",
      label: "Process Number (PID)", 
      value: process.pid,
      explanation: "Unique identifier for the OS"
    },
    { 
      id: "programCounter",
      label: "Program Counter", 
      value: pcb.programCounter,
      explanation: "Memory address of the next instruction"
    },
    { 
      id: "registers",
      label: "Registers", 
      value: `EAX: ${pcb.registers.eax} | EBX: ${pcb.registers.ebx} | ECX: ${pcb.registers.ecx}`,
      explanation: "Temporary variables the CPU is actively using"
    },
    { 
      id: "memoryLimits",
      label: "Memory Limits", 
      value: pcb.memoryLimits.limit ? `Base: ${pcb.memoryLimits.base} - Limit: ${pcb.memoryLimits.limit}` : "None",
      explanation: "Boundaries preventing access to other apps' memory"
    },
    { 
      id: "openFiles",
      label: "List of open files", 
      value: pcb.openFiles.length > 0 ? pcb.openFiles.join(", ") : "None",
      explanation: "File handles currently managed by the OS"
    },
  ];

  return (
    <div className={cn("bg-card/60 backdrop-blur-md border border-border/50 rounded-2xl overflow-hidden", className)}>
      {/* Header (Clickable for collapsing) */}
      <button 
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between p-5 hover:bg-white/5 transition-colors text-left"
      >
        <div className="flex items-center gap-3">
          <div 
            className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-white shadow-md text-lg shrink-0"
            style={{ backgroundColor: process.color }}
          >
            {process.name.charAt(0)}
          </div>
          <div>
            <h3 className="font-bold text-foreground text-base leading-none">{process.name} PCB</h3>
            <p className="text-[11px] font-mono text-muted-foreground mt-1">Kernel Memory Block</p>
          </div>
        </div>
        <div className="text-muted-foreground p-1 rounded-full hover:bg-white/10 transition-colors">
          {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
        </div>
      </button>
      
      {/* The Stacked PCB Diagram */}
      <AnimatePresence initial={false}>
        {isExpanded && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <div className="px-5 pb-5">
              <div className="flex flex-col rounded-xl border-2 border-amber-500/40 overflow-hidden shadow-[0_0_20px_-5px_rgba(245,158,11,0.2)]">
                {blocks.map((block, i) => {
                  const isHighlighted = pcb.highlightFields?.includes(block.id);
                  return (
                    <div 
                      key={block.id} 
                      className={cn(
                        "flex flex-col py-2.5 px-4 transition-all duration-500",
                        i !== blocks.length - 1 && "border-b border-amber-500/20",
                        isHighlighted 
                          ? "bg-amber-500/30 ring-2 ring-inset ring-amber-500/50" 
                          : "bg-amber-500/5 hover:bg-amber-500/10"
                      )}
                    >
                      <span className="text-[10px] uppercase tracking-wider text-amber-500/70 font-bold mb-0.5">{block.label}</span>
                      <span className="text-xs font-mono font-semibold text-foreground/90">{block.value}</span>
                      <span className="text-[10px] text-muted-foreground/70 mt-1 italic leading-tight">{block.explanation}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
