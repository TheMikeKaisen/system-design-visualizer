import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface TeacherPanelProps {
  explanation: string;
}

export function TeacherPanel({ explanation }: TeacherPanelProps) {
  return (
    <div className="bg-muted/30 border-b border-border/50 py-3 px-6 flex items-start gap-4">
      {/* Persistent Avatar */}
      <div className="flex-shrink-0 mt-0.5">
        <div className="w-10 h-10 rounded-full bg-primary/10 border border-primary/30 flex items-center justify-center overflow-hidden">
          <svg className="w-6 h-6 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l9-5-9-5-9 5 9 5z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l9-5-9-5-9 5 9 5zm0 0l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14zm-4 6v-7.5l4-2.222" />
          </svg>
        </div>
      </div>
      
      {/* Insight Text */}
      <div className="flex-1">
        <h3 className="text-xs font-semibold text-primary uppercase tracking-wider mb-1">
          Notes
        </h3>
        <AnimatePresence mode="wait">
          <motion.p
            key={explanation}
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            transition={{ duration: 0.3 }}
            className="text-sm text-foreground/90 leading-relaxed"
          >
            {explanation}
          </motion.p>
        </AnimatePresence>
      </div>
    </div>
  );
}
