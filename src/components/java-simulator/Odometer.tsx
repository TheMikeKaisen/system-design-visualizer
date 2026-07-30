import React from "react";
import { motion, AnimatePresence } from "framer-motion";

interface OdometerProps {
  values: number[]; // e.g. [125, 126, 127, -128]
}

export const Odometer: React.FC<OdometerProps> = ({ values }) => {
  const [currentIndex, setCurrentIndex] = React.useState(0);

  React.useEffect(() => {
    if (currentIndex < values.length - 1) {
      const timer = setTimeout(() => {
        setCurrentIndex(prev => prev + 1);
      }, 800); // Roll every 800ms
      return () => clearTimeout(timer);
    }
  }, [currentIndex, values]);

  return (
    <div className="flex flex-col items-center justify-center p-8 bg-zinc-900 rounded-xl border border-zinc-700 shadow-inner overflow-hidden">
      <div className="text-sm font-semibold text-primary mb-4 uppercase tracking-widest">Odometer</div>
      <div className="relative h-24 w-40 bg-black rounded-lg border-2 border-zinc-800 shadow-[inset_0_10px_20px_rgba(0,0,0,1)] flex items-center justify-center overflow-hidden">
        {/* Shadow overlays for 3D effect */}
        <div className="absolute top-0 left-0 w-full h-8 bg-gradient-to-b from-black/80 to-transparent z-10 pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 w-full h-8 bg-gradient-to-t from-black/80 to-transparent z-10 pointer-events-none"></div>
        
        <AnimatePresence mode="popLayout">
          <motion.div
            key={currentIndex}
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -50, opacity: 0 }}
            transition={{ type: "spring", stiffness: 200, damping: 20 }}
            className="text-5xl font-mono font-bold text-white tracking-tighter"
          >
            {values[currentIndex]}
          </motion.div>
        </AnimatePresence>
      </div>
      {currentIndex === values.length - 1 && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mt-6 text-red-400 font-semibold flex items-center gap-2"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>
          Wrap-around Occurred!
        </motion.div>
      )}
    </div>
  );
};
