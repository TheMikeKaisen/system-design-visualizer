import React from 'react';
import { motion } from 'framer-motion';
import { OOPHeapObject } from '@/lib/java-simulator/oop-engine';

interface HeapObjectCardProps {
  obj: OOPHeapObject;
  position?: { x: number; y: number }; // Used by MemoryContainer to freely place them
}

export function HeapObjectCard({ obj }: HeapObjectCardProps) {
  return (
    <motion.div
      initial={obj.isNew ? { opacity: 0, scale: 0.5, y: 20 } : false}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={obj.isNew ? { type: 'spring', stiffness: 300, damping: 20 } : {}}
      id={`heap-${obj.id}`} // anchor for SVG reference arrows connecting to the whole object
      className="w-64 shrink-0 border border-purple-500/30 rounded-xl overflow-hidden bg-background/80 backdrop-blur shadow-2xl shadow-purple-900/10 flex flex-col relative z-20"
    >
      {/* Header */}
      <div className="bg-purple-900/20 px-4 py-2 border-b border-purple-500/20 flex justify-between items-center">
        <span className="text-xs font-mono font-bold text-purple-300">
          new {obj.className}()
        </span>
        <span className="text-[10px] font-mono bg-purple-950 px-2 py-0.5 rounded text-purple-400 border border-purple-800">
          {obj.id}
        </span>
      </div>

      {/* Fields */}
      <div className="p-3 space-y-1">
        {obj.fields.map((f) => (
          <motion.div
            key={f.id}
            animate={obj.highlightedFieldId === f.id ? { backgroundColor: ['rgba(168, 85, 247, 0.5)', 'rgba(168, 85, 247, 0)'] } : {}}
            transition={{ duration: 1 }}
            className="flex items-center justify-between text-[11px] font-mono px-2 py-1.5 rounded"
          >
            <div className="flex gap-2">
              <span className="text-blue-400">{f.type}</span>
              <span className="text-foreground/80">{f.name}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground">=</span>
              <span className={`font-semibold ${f.isReference && f.value === 'null' ? 'text-muted-foreground' : f.type === 'String' ? 'text-green-400' : 'text-orange-400'}`}>
                {f.value}
              </span>
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}
