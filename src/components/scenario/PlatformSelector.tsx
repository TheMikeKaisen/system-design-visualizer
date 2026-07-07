"use client";
import { useState, useRef, useEffect } from "react";

type Platform = "linux" | "windows" | "macos";

interface PlatformSelectorProps {
  selectedPlatform: Platform;
  onSelect: (p: Platform) => void;
  isComparing: boolean;
  onCompare: () => void;
  onSingle: () => void;
}

const PLATFORMS: { id: Platform; label: string; cpu: string }[] = [
  { id: "windows", label: "Windows", cpu: "Intel x64" },
  { id: "linux",   label: "Linux",   cpu: "ARM" },
  { id: "macos",   label: "macOS",   cpu: "Apple Silicon" },
];

export function PlatformSelector({ selectedPlatform, onSelect, isComparing, onSingle }: PlatformSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  const currentPlatform = PLATFORMS.find(p => p.id === selectedPlatform) || PLATFORMS[0];

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="flex items-center gap-3 bg-background/90 border border-border/60 rounded-xl px-4 py-2 shadow-md backdrop-blur-sm">
      {isComparing ? (
        <div className="flex items-center gap-3">
          <span className="text-[10px] font-bold uppercase tracking-widest text-primary">Comparing All</span>
          <div className="w-px h-4 bg-border/60" />
          <button
            onClick={onSingle}
            className="text-xs font-medium text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
            Return to Lesson
          </button>
        </div>
      ) : (
        <div className="flex items-center gap-3" ref={dropdownRef}>
          <div className="flex flex-col">
            <span className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground/70 mb-0.5">Platform</span>
            <button 
              onClick={() => setIsOpen(!isOpen)}
              className="flex items-center gap-2 text-sm font-semibold text-foreground hover:text-primary transition-colors"
            >
              {currentPlatform.label}
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}><path d="m6 9 6 6 6-6"/></svg>
            </button>
          </div>
          
          {isOpen && (
            <div className="absolute top-full mt-2 left-0 w-40 bg-background border border-border/60 rounded-lg shadow-xl overflow-hidden z-50">
              {PLATFORMS.map(p => (
                <button
                  key={p.id}
                  onClick={() => {
                    onSelect(p.id);
                    setIsOpen(false);
                  }}
                  className={`w-full text-left px-4 py-2.5 text-sm transition-colors flex items-center justify-between
                    ${selectedPlatform === p.id ? 'bg-primary/10 text-primary font-semibold' : 'text-foreground hover:bg-muted'}`}
                >
                  {p.label}
                  {selectedPlatform === p.id && <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="20 6 9 17 4 12"/></svg>}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
