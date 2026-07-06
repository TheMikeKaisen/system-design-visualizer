import { EducationalNodeData } from "@/types";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

interface NodeNotesDialogProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  notes?: EducationalNodeData["notes"];
}

export function NodeNotesDialog({ isOpen, onClose, title, notes }: NodeNotesDialogProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) {
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !notes || !mounted) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div 
        className="bg-background border border-border w-full max-w-2xl rounded-xl shadow-2xl overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-border/60 bg-muted/30">
          <h2 className="text-xl font-semibold text-foreground tracking-tight">{title}</h2>
          <button 
            onClick={onClose}
            className="p-2 -mr-2 text-muted-foreground hover:text-foreground hover:bg-muted/50 rounded-lg transition-colors"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 6 6 18"/><path d="m6 6 12 12"/>
            </svg>
          </button>
        </div>
        
        <div className="p-6 overflow-y-auto max-h-[70vh] flex flex-col gap-6 custom-scrollbar">
          <section>
            <h3 className="text-sm font-bold uppercase tracking-widest text-primary mb-2 flex items-center gap-2">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>
              What is it?
            </h3>
            <p className="text-foreground/90 leading-relaxed">{notes.whatIsIt}</p>
          </section>

          <section>
            <h3 className="text-sm font-bold uppercase tracking-widest text-green-500 mb-2 flex items-center gap-2">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2v20"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
              Why is it needed?
            </h3>
            <p className="text-foreground/90 leading-relaxed">{notes.whyNeeded}</p>
          </section>

          <section>
            <h3 className="text-sm font-bold uppercase tracking-widest text-orange-500 mb-2 flex items-center gap-2">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><path d="M12 9v4"/><path d="M12 17h.01"/></svg>
              What if it's missing?
            </h3>
            <p className="text-foreground/90 leading-relaxed">{notes.whatIfMissing}</p>
          </section>

          <section className="bg-primary/10 border border-primary/20 p-4 rounded-lg">
            <h3 className="text-sm font-bold uppercase tracking-widest text-primary mb-2 flex items-center gap-2">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
              Interview Tips
            </h3>
            <p className="text-foreground/90 leading-relaxed">{notes.interviewTips}</p>
          </section>
        </div>
      </div>
    </div>,
    document.body
  );
}
