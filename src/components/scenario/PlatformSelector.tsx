"use client";

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
  return (
    <div className="flex items-center gap-3 bg-background/90 border border-border/60 rounded-xl px-4 py-2.5 shadow-md backdrop-blur-sm">
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
        <div className="flex flex-col gap-0.5">
          <span className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground/70">Current Platform</span>
          <div className="flex items-center gap-2">
            {PLATFORMS.map(p => (
              <label key={p.id} className="flex items-center gap-1.5 cursor-pointer group">
                <div
                  className={`w-3.5 h-3.5 rounded-full border-2 flex items-center justify-center transition-all ${selectedPlatform === p.id ? "border-primary bg-primary/20" : "border-border/60 group-hover:border-primary/50"}`}
                  onClick={() => onSelect(p.id)}
                >
                  {selectedPlatform === p.id && <div className="w-1.5 h-1.5 rounded-full bg-primary" />}
                </div>
                <span className={`text-xs font-medium transition-colors ${selectedPlatform === p.id ? "text-foreground" : "text-muted-foreground group-hover:text-foreground"}`} onClick={() => onSelect(p.id)}>
                  {p.label}
                </span>
              </label>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
