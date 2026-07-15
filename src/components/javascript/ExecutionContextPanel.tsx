"use client";

import { useJSSimulationStore } from "@/store/useJSSimulationStore";
import { cn } from "@/lib/utils";
import { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ExecutionContext } from "@/lib/js-simulator/engine";

function AnimatedVariable({ name, value }: { name: string, value: string }) {
  const [displayValue, setDisplayValue] = useState(value);
  const prevValueRef = useRef(value);

  useEffect(() => {
    if (value !== prevValueRef.current) {
      if (prevValueRef.current === "undefined" || prevValueRef.current === "<uninitialized>") {
        setDisplayValue("allocating...");
        const timer = setTimeout(() => {
          setDisplayValue(value);
        }, 800);
        return () => clearTimeout(timer);
      } else {
        setDisplayValue(value);
      }
      prevValueRef.current = value;
    }
  }, [value]);

  const isAllocating = displayValue === "allocating...";

  return (
    <div className="flex items-center justify-between bg-muted/30 px-3 py-2 rounded border border-border/40 hover:bg-muted/50 transition-colors">
      <span className="text-blue-400 font-semibold">{name}</span>
      <span className="text-muted-foreground mx-2">→</span>
      {isAllocating ? (
        <div className="flex items-center gap-2">
          <div className="w-24 h-4 bg-muted overflow-hidden rounded">
            <motion.div 
              className="h-full bg-green-500" 
              initial={{ width: "0%" }}
              animate={{ width: "100%" }}
              transition={{ duration: 0.8, ease: "linear" }}
            />
          </div>
          <span className="text-[10px] text-muted-foreground animate-pulse">allocating...</span>
        </div>
      ) : (
          <span className={cn(
          "font-bold",
          displayValue === "undefined" || displayValue === "<uninitialized>" ? "text-red-400" :
          displayValue.includes("<TDZ>") ? "text-red-500 bg-red-500/10 px-2 py-0.5 rounded border border-red-500/30" :
          displayValue.includes("Function Object") ? "text-purple-400 whitespace-pre text-right" :
          "text-green-400"
        )}>
          {displayValue}
        </span>
      )}
    </div>
  );
}

interface TreeNode {
  ec: ExecutionContext;
  children: TreeNode[];
  isTopStack: boolean;
}

function ContextCard({ node }: { node: TreeNode }) {
  const { scenario, currentStepIndex } = useJSSimulationStore();
  const scopeLookup = scenario.steps[currentStepIndex].scopeLookup;
  
  const ec = node.ec;
  const isStackActive = node.isTopStack && !scopeLookup;
  const isLookupActive = scopeLookup?.activeContextId === ec.id;
  const isLookupChecked = scopeLookup?.checkedContextIds.includes(ec.id);
  const isLookupError = isLookupActive && scopeLookup?.status === "reference_error";
  
  let cardStyle = "bg-muted/10 border-border/40 opacity-80";
  if (isStackActive) cardStyle = "bg-card border-primary/30 ring-1 ring-primary/20";
  if (isLookupActive) {
    if (scopeLookup?.status === "found") cardStyle = "bg-card border-green-500/50 ring-2 ring-green-500/30";
    else if (isLookupError) cardStyle = "bg-card border-red-500/50 ring-2 ring-red-500/30";
    else cardStyle = "bg-card border-purple-500/50 ring-2 ring-purple-500/30"; // Searching
  } else if (isLookupChecked) {
    cardStyle = "bg-card/50 border-border/30 opacity-60";
  }

  // If this is a block scope or closure, give it different styling
  const isBlock = ec.isBlockScope;
  const isClosure = ec.isClosure;

  if (isClosure) {
    cardStyle = "bg-card border-fuchsia-500/50 ring-2 ring-fuchsia-500/20 shadow-[0_0_15px_rgba(217,70,239,0.15)]";
    if (isLookupActive && scopeLookup?.status === "found") cardStyle = "bg-card border-green-500/50 ring-2 ring-green-500/30 shadow-[0_0_15px_rgba(34,197,94,0.15)]";
    else if (isLookupActive && scopeLookup?.status === "searching") cardStyle = "bg-card border-fuchsia-500 ring-2 ring-fuchsia-500/50 shadow-[0_0_15px_rgba(217,70,239,0.3)]";
  }

  return (
    <motion.div 
      layout
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className={cn(
        "flex flex-col rounded-xl border shadow-sm overflow-hidden flex-shrink-0 transition-colors",
        cardStyle,
        isBlock ? "mt-4 border-l-4 border-l-indigo-500/50 ml-4 shadow-inner bg-card/80" : "",
        isClosure ? "mt-4 ml-4" : ""
      )}
    >
      {/* Header */}
      <div className={cn(
        "px-4 py-3 border-b flex items-center justify-between cursor-default transition-colors",
        (isStackActive || isLookupActive || isClosure) ? "border-border/50 bg-primary/5" : "border-transparent bg-muted/20",
        isClosure ? "bg-fuchsia-500/10 border-fuchsia-500/20" : "",
        isLookupActive && scopeLookup?.status === "found" ? "bg-green-500/10" : "",
        isLookupActive && isLookupError ? "bg-red-500/10" : "",
        isLookupActive && scopeLookup?.status === "searching" ? "bg-purple-500/10" : "",
        isBlock ? "bg-indigo-500/10" : ""
      )}>
        <h2 className={cn(
          "text-sm font-bold flex items-center gap-2",
          (isStackActive || isLookupActive) ? "text-primary" : "text-muted-foreground",
          isClosure ? "text-fuchsia-400" : "",
          isLookupActive && scopeLookup?.status === "found" ? "text-green-500" : "",
          isLookupActive && isLookupError ? "text-red-500" : "",
          isLookupActive && scopeLookup?.status === "searching" ? "text-purple-400" : "",
          isBlock && !isStackActive && !isLookupActive ? "text-indigo-400" : ""
        )}>
          {isClosure ? (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path><polyline points="3.29 7 12 12 20.71 7"></polyline><line x1="12" y1="22" x2="12" y2="12"></line></svg>
          ) : isBlock ? (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><line x1="9" y1="3" x2="9" y2="21"></line></svg>
          ) : (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
          )}
          {ec.name}
          {isLookupChecked && <span className="text-xs text-red-400/80 ml-2">❌ Not found</span>}
        </h2>
        
        {isClosure ? (
          <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-fuchsia-400/70">
            Memory Preserved
          </div>
        ) : isStackActive ? (
          <div className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider">
            <span className={cn("px-2 py-0.5 rounded-full transition-colors", ec.phase === "Creation Phase" ? "bg-amber-500/20 text-amber-500" : "text-muted-foreground")}>Creation</span>
            <span className="text-muted-foreground">→</span>
            <span className={cn("px-2 py-0.5 rounded-full transition-colors", ec.phase === "Execution Phase" ? "bg-green-500/20 text-green-500" : "text-muted-foreground")}>Execution</span>
            <span className="text-muted-foreground">→</span>
            <span className="text-muted-foreground">Destroyed</span>
          </div>
        ) : isLookupActive ? (
          <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-purple-400">
            <span className="relative flex h-2 w-2">
              {scopeLookup?.status === "searching" && (
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75"></span>
              )}
              <span className={cn("relative inline-flex rounded-full h-2 w-2", 
                scopeLookup?.status === "found" ? "bg-green-500" : 
                scopeLookup?.status === "reference_error" ? "bg-red-500" : "bg-purple-500"
              )}></span>
            </span>
            <span>{scopeLookup?.status === "found" ? "Found Match" : scopeLookup?.status === "reference_error" ? "Search Failed" : "Searching..."}</span>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-muted-foreground opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-muted-foreground"></span>
            </span>
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Suspended</span>
          </div>
        )}
      </div>
      
      {/* Body (Only shown if active, being searched, or if it's a block/closure (blocks and closures are always visible if their parent is)) */}
      <AnimatePresence>
        {(isStackActive || isLookupActive || isLookupChecked || isBlock || isClosure || node.children.length > 0) && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="p-4 flex flex-col gap-6"
          >
            {/* Variables / Memory */}
            <div>
              <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-3 border-b border-border/50 pb-1">
                {isClosure ? "Captured Variables" : "Lexical Environment"}
              </h3>
              <div className="flex flex-col gap-2 font-mono text-sm">
                {ec.variables.length === 0 ? (
                  <div className="text-muted-foreground text-xs italic">No variables</div>
                ) : (
                  ec.variables.map((v) => {
                    const isTarget = scopeLookup?.targetVariable === v.name;
                    const isFoundHere = isLookupActive && isTarget && scopeLookup?.status === "found";
                    
                    return (
                      <div key={`${ec.id}-${v.name}`} className={cn(
                        "transition-all duration-300",
                        isFoundHere ? "ring-2 ring-green-500/50 bg-green-500/10 rounded-lg transform scale-[1.02]" : "",
                        isTarget && isLookupActive && scopeLookup?.status === "searching" ? "ring-2 ring-purple-500/50 bg-purple-500/10 rounded-lg animate-pulse" : ""
                      )}>
                        <AnimatedVariable name={v.name} value={v.value} />
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Scope Chain */}
            {!isClosure && (
              <div>
                <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-3 border-b border-border/50 pb-1">
                  Scope Chain
                </h3>
                <div className="flex flex-col gap-2 font-mono text-xs">
                  <div className="flex items-start justify-between bg-black/20 p-3 rounded border border-border/30">
                    <span className="text-muted-foreground w-1/3">Local Memory:</span>
                    <span className="text-foreground w-2/3 text-right">This Context</span>
                  </div>
                  <div className="flex items-start justify-between bg-black/20 p-3 rounded border border-border/30">
                    <span className="text-muted-foreground w-1/3">Outer Env:</span>
                    <span className={cn(
                      "w-2/3 text-right",
                      ec.outerEnvironment ? "text-purple-400" : "text-muted-foreground italic"
                    )}>
                      {ec.outerEnvironment || "null"}
                    </span>
                  </div>
                </div>
              </div>
            )}
            
            {/* Render nested children (block scopes / inner closures) */}
            {node.children.length > 0 && (
              <div className="flex flex-col gap-4 mt-2">
                {node.children.map(child => (
                  <ContextCard key={child.ec.id} node={child} />
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export function ExecutionContextPanel() {
  const { scenario, currentStepIndex } = useJSSimulationStore();
  const currentState = scenario.steps[currentStepIndex];
  const callStack = currentState.callStack;

  if (callStack.length === 0) {
    return (
      <div className="flex flex-col h-full bg-card rounded-xl border border-border/50 shadow-sm p-8 items-center justify-center text-muted-foreground">
        No active execution context.
      </div>
    );
  }

  // Convert flat call stack to nested tree for block scopes
  const nodes = callStack.map((ec, i) => ({ ec, children: [] as TreeNode[], isTopStack: i === 0 }));
  const roots: TreeNode[] = [];
  
  for (let i = 0; i < nodes.length; i++) {
    if (nodes[i].ec.isBlockScope && i + 1 < nodes.length) {
       // It's a block scope, nest it inside its outer environment (the next context in the stack)
       nodes[i+1].children.push(nodes[i]);
    } else {
       // Root context (e.g. Global or Function)
       roots.push(nodes[i]);
    }
  }

  return (
    <div className="flex flex-col h-full bg-card rounded-xl border border-border/50 shadow-sm overflow-hidden p-4 gap-4 overflow-y-auto">
      <AnimatePresence mode="popLayout">
        {roots.map(rootNode => (
          <ContextCard key={rootNode.ec.id} node={rootNode} />
        ))}
      </AnimatePresence>
    </div>
  );
}
