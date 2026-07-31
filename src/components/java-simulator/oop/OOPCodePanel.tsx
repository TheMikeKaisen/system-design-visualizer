"use client";
import React, { useEffect, useState } from "react";
import { useJavaOOPStore } from "@/store/useJavaOOPStore";
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus, prism } from 'react-syntax-highlighter/dist/cjs/styles/prism';
import { useTheme } from "next-themes";

export const OOPCodePanel: React.FC = () => {
  const { scenario, currentStepIndex } = useJavaOOPStore();
  const currentStep = scenario.steps[currentStepIndex];
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (currentStep?.activeLine) {
      document.getElementById("oop-active-code-line")?.scrollIntoView({
        behavior: 'smooth',
        block: 'center'
      });
    }
  }, [currentStep?.activeLine]);

  if (!currentStep) return null;

  const isDark = !mounted || resolvedTheme === "dark";

  return (
    <div className="h-full flex flex-col bg-white dark:bg-zinc-950 border border-border/50 rounded-xl overflow-hidden shadow-2xl relative">
      <div className="flex items-center justify-between px-4 py-2 border-b border-border/50 bg-gray-100 dark:bg-zinc-900/50">
        <div className="flex items-center gap-2">
          <div className="flex gap-1.5">
            <div className="w-3 h-3 rounded-full bg-red-500/80"></div>
            <div className="w-3 h-3 rounded-full bg-yellow-500/80"></div>
            <div className="w-3 h-3 rounded-full bg-green-500/80"></div>
          </div>
          <span className="ml-2 text-xs font-mono text-muted-foreground/80">
            Demo.java
          </span>
        </div>
      </div>
      
      <div className="flex-1 overflow-auto font-mono text-[13px] leading-relaxed relative pt-2 pb-2">
        <SyntaxHighlighter
          language="java"
          style={isDark ? vscDarkPlus : prism}
          showLineNumbers={true}
          wrapLines={true}
          lineProps={(lineNumber: number) => {
            const isActive = currentStep.activeLine === lineNumber;
            return {
              ...(isActive ? { id: "oop-active-code-line" } : {}),
              style: {
                display: "block",
                backgroundColor: isActive ? (isDark ? "rgba(168, 85, 247, 0.2)" : "rgba(168, 85, 247, 0.1)") : "transparent",
                borderLeft: isActive ? "3px solid #a855f7" : "3px solid transparent",
                paddingLeft: "4px"
              }
            };
          }}
          customStyle={{
            margin: 0,
            padding: "8px 0 16px 0",
            background: "transparent",
            fontSize: "13px",
            lineHeight: "1.6"
          }}
        >
          {currentStep.code}
        </SyntaxHighlighter>
      </div>
      
      {/* Console Output Panel */}
      <div className="h-32 bg-black border-t border-border/50 flex flex-col font-mono text-sm relative z-20 shrink-0">
        <div className="bg-zinc-900 px-4 py-1.5 border-b border-border/50 flex items-center gap-2">
          <span className="text-[10px] font-bold text-green-500 tracking-wider">
            {'>_ CONSOLE'}
          </span>
        </div>
        <div className="flex-1 overflow-y-auto p-3 space-y-1 text-gray-300">
          {currentStep.consoleOutput && currentStep.consoleOutput.length > 0 ? (
            currentStep.consoleOutput.map((out: string, i: number) => (
              <div key={i} className="whitespace-pre-wrap">{out}</div>
            ))
          ) : (
            <div className="text-gray-600 italic text-xs">Waiting for output...</div>
          )}
        </div>
      </div>
    </div>
  );
};
