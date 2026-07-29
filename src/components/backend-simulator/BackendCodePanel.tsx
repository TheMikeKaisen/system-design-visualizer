import React, { useEffect, useRef } from "react";
import { BackendStepState } from "@/lib/backend-simulator/engine";
import { FileCode } from "lucide-react";

interface Props {
  step: BackendStepState;
}

export function BackendCodePanel({ step }: Props) {
  const codeRef = useRef<HTMLDivElement>(null);
  const activeLineRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (activeLineRef.current && codeRef.current) {
      activeLineRef.current.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    }
  }, [step.activeLine]);

  if (!step.code) return null;

  const lines = step.code.split("\n");

  return (
    <div className="flex-1 flex flex-col h-full bg-[#0a0a0a] rounded-xl border border-zinc-800 overflow-hidden shadow-2xl font-mono text-sm">
      {/* Header */}
      <div className="h-10 border-b border-zinc-800 bg-zinc-900/80 flex items-center px-4 shrink-0 justify-between">
        <div className="flex items-center">
          <FileCode className="w-4 h-4 text-emerald-500 mr-2" />
          <span className="text-xs font-semibold text-zinc-300">server.js</span>
        </div>
      </div>

      {/* Code Area */}
      <div className="flex-1 overflow-auto relative p-4 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]" ref={codeRef}>
        <div className="flex">
          {/* Line Numbers */}
          <div className="flex flex-col text-right pr-4 border-r border-zinc-800 text-zinc-600 select-none shrink-0 min-w-[2.5rem]">
            {lines.map((_, i) => (
              <div key={i} className="leading-6">
                {i + 1}
              </div>
            ))}
          </div>

          {/* Code Lines */}
          <div className="flex flex-col pl-4 relative w-full">
            {lines.map((line, i) => {
              const lineNumber = i + 1;
              const isActive = step.activeLine === lineNumber;
              
              // Simple syntax highlighting for JS/Node keywords
              const highlightedLine = line
                .replace(/(\/\/.*)/g, '<span class=text-zinc-500>$1</span>')
                .replace(/("(?:\\"|[^"])*"|'(?:\\'|[^'])*')/g, '<span class=text-emerald-300>$1</span>')
                .replace(/\b(const|var|let|function|return|require)\b/g, '<span class=text-pink-400>$1</span>')
                .replace(/\b(console|fs|Promise|process)\b/g, '<span class=text-blue-400>$1</span>')
                .replace(/\b(log|readFile|resolve|then|nextTick)\b/g, '<span class=text-yellow-200>$1</span>');

              return (
                <div
                  key={i}
                  ref={isActive ? activeLineRef : null}
                  className={`leading-6 relative w-full transition-colors duration-300 ${
                    isActive ? "text-foreground" : "text-zinc-400"
                  }`}
                >
                  {/* Highlight Background */}
                  {isActive && (
                    <div className="absolute -inset-x-4 inset-y-0 bg-emerald-500/10 border-l-2 border-emerald-500 pointer-events-none -ml-4" />
                  )}
                  {/* Code Text */}
                  <span dangerouslySetInnerHTML={{ __html: highlightedLine || "&nbsp;" }} />
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
