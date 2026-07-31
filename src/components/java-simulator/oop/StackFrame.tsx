import React from 'react';
import { motion } from 'framer-motion';
import { OOPStackFrame } from '@/lib/java-simulator/oop-engine';

interface StackFrameProps {
  frame: OOPStackFrame;
}

export function StackFrame({ frame }: StackFrameProps) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className={`border rounded-lg overflow-hidden transition-colors duration-300 ${
        frame.isActive ? 'border-primary/50 bg-background shadow-lg shadow-primary/10' : 'border-border/40 bg-muted/20 opacity-70'
      }`}
    >
      <div className={`px-4 py-2 text-xs font-mono font-bold ${
        frame.isActive ? 'bg-primary/10 text-primary' : 'bg-muted/50 text-muted-foreground'
      }`}>
        {frame.methodName}
      </div>
      
      <div className="p-3 space-y-2">
        {frame.variables.length === 0 && (
          <div className="text-xs text-muted-foreground italic text-center py-1">
            No local variables
          </div>
        )}
        
        {frame.variables.map((v) => (
          <div key={v.id} className="flex items-center justify-between text-xs font-mono bg-muted/30 p-2 rounded border border-border/30">
            <div className="flex gap-2 items-baseline">
              <span className="text-blue-400">{v.type}</span>
              <span className="text-foreground">{v.name}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground">=</span>
              <span 
                id={`stack-${v.id}`} // crucial for SVG anchoring
                className={`font-semibold ${v.isReference && v.value.startsWith('@') ? 'text-purple-400 cursor-pointer' : 'text-orange-400'}`}
              >
                {v.value}
              </span>
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  );
}
