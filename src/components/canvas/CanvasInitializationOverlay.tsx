"use client";

import { useDiagramStore } from "@/lib/store/useDiagramStore";
import { Loader2 } from "lucide-react";

export function CanvasInitializationOverlay() {
  const isInitialized = useDiagramStore((s) => s.isInitialized);

  if (isInitialized) return null;

  return (
    <div className="absolute inset-0 flex items-center justify-center bg-background/50 backdrop-blur-sm z-50 pointer-events-none">
      <div className="flex flex-col items-center gap-4 bg-background p-6 rounded-xl border shadow-sm">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm font-medium text-muted-foreground animate-pulse">
          Loading Canvas...
        </p>
      </div>
    </div>
  );
}
