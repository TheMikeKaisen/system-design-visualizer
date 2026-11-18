"use client";

import React, { useRef, useEffect } from "react";
import { Terminal, Copy, Check } from "lucide-react";
import { useEC2SimulationStore } from "@/store/useEC2SimulationStore";

export function LiveTerminalMirror() {
  const currentStep = useEC2SimulationStore((s) => s.getCurrentStep());
  const [copied, setCopied] = React.useState(false);
  const copyTimerRef = useRef<NodeJS.Timeout | null>(null);
  const terminalContainerRef = useRef<HTMLDivElement>(null);

  // Auto-scroll terminal buffer safely on step change without hijacking outer viewport
  useEffect(() => {
    if (terminalContainerRef.current) {
      terminalContainerRef.current.scrollTop = terminalContainerRef.current.scrollHeight;
    }
  }, [currentStep.terminalLines]);

  // Clean up copy feedback timer on unmount
  useEffect(() => {
    return () => {
      if (copyTimerRef.current) {
        clearTimeout(copyTimerRef.current);
      }
    };
  }, []);

  const handleCopy = async () => {
    try {
      const text = currentStep.terminalLines.map((l) => l.text).join("\n");
      if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(text);
        setCopied(true);
        if (copyTimerRef.current) {
          clearTimeout(copyTimerRef.current);
        }
        copyTimerRef.current = setTimeout(() => setCopied(false), 1500);
      }
    } catch {
      // Graceful fallback for non-secure contexts or permission restrictions
    }
  };

  return (
    <div className="flex flex-col bg-[#050608] border border-white/[0.08] rounded-lg overflow-hidden h-full">
      {/* ── Terminal Window Top Bar ── */}
      <div className="px-3.5 py-2 bg-[#090b10] border-b border-white/[0.08] flex items-center justify-between">
        <div className="flex items-center gap-2">
          {/* macOS / Unix style traffic dots */}
          <div className="flex items-center gap-1.5" aria-hidden="true">
            <div className="w-2.5 h-2.5 rounded-full bg-rose-500/80" />
            <div className="w-2.5 h-2.5 rounded-full bg-amber-500/80" />
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/80" />
          </div>
          <div className="h-3 w-px bg-zinc-800 mx-1" aria-hidden="true" />
          <div className="flex items-center gap-1.5 text-xs font-mono text-zinc-300">
            <Terminal className="w-3.5 h-3.5 text-zinc-400" />
            <span>OpenSSH Client Terminal Mirror</span>
          </div>
        </div>

        {/* Copy Button */}
        <button
          type="button"
          onClick={handleCopy}
          className="text-[11px] font-mono px-2.5 py-1 rounded text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/80 transition-all active:scale-95 flex items-center gap-1.5 focus:outline-none focus-visible:ring-1 focus-visible:ring-zinc-400 min-h-[36px] touch-manipulation"
          title="Copy terminal buffer"
          aria-label="Copy terminal buffer"
        >
          {copied ? (
            <>
              <Check className="w-3 h-3 text-emerald-400" />
              <span className="text-emerald-400">Copied</span>
            </>
          ) : (
            <>
              <Copy className="w-3 h-3" />
              <span>Copy</span>
            </>
          )}
        </button>
      </div>

      {/* ── Terminal Scrollable Body ── */}
      <div
        ref={terminalContainerRef}
        tabIndex={0}
        role="region"
        aria-label="Terminal output buffer"
        className="p-3.5 flex-1 font-mono text-xs overflow-y-auto space-y-1.5 selection:bg-emerald-500/30 selection:text-emerald-200 focus:outline-none focus-visible:ring-1 focus-visible:ring-emerald-500/30"
      >
        {currentStep.terminalLines.map((line) => {
          if (line.type === "cmd") {
            return (
              <div key={line.id} className="flex items-start gap-2 text-zinc-100 font-bold">
                <span className="text-emerald-400 select-none">$</span>
                <span className="break-all">{line.text}</span>
              </div>
            );
          }
          if (line.type === "debug") {
            return (
              <div key={line.id} className="text-zinc-400 text-[11px] pl-3 leading-relaxed">
                {line.text}
              </div>
            );
          }
          if (line.type === "stderr") {
            return (
              <div key={line.id} className="text-rose-400 font-bold pl-3 leading-relaxed">
                {line.text}
              </div>
            );
          }
          if (line.type === "prompt") {
            return (
              <div key={line.id} className="flex items-center gap-2 text-emerald-400 font-bold mt-2">
                <span>{line.text}</span>
              </div>
            );
          }
          // Default stdout
          return (
            <div key={line.id} className="text-zinc-300 pl-3 leading-relaxed">
              {line.text}
            </div>
          );
        })}
      </div>
    </div>
  );
}
