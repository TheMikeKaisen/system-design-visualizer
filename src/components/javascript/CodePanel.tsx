"use client";

import { useJSSimulationStore } from "@/store/useJSSimulationStore";
import { cn } from "@/lib/utils";
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus, prism } from 'react-syntax-highlighter/dist/cjs/styles/prism';
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

export function CodePanel() {
  const { scenario, currentStepIndex } = useJSSimulationStore();
  const currentState = scenario.steps[currentStepIndex];
  const activeLine = currentState.currentLine;

  const codeLines = scenario.code.split("\n");
  
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const isDark = !mounted || resolvedTheme === "dark";

  return (
    <div className="flex flex-col h-full bg-white dark:bg-[#1e1e1e] rounded-xl overflow-hidden border border-border/40 shadow-lg">
      <div className="bg-gray-100 dark:bg-[#2d2d2d] px-4 py-2 border-b border-border/40 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-red-500"></div>
          <div className="w-3 h-3 rounded-full bg-amber-500"></div>
          <div className="w-3 h-3 rounded-full bg-green-500"></div>
        </div>
        <span className="text-xs font-mono text-muted-foreground">script.js</span>
        <div className="w-16"></div> {/* Spacer for centering */}
      </div>
      
      <div className="flex-1 overflow-y-auto text-sm font-mono relative pt-2">
        <SyntaxHighlighter
          language="javascript"
          style={isDark ? vscDarkPlus : prism}
          showLineNumbers={true}
          wrapLines={true}
          lineProps={(lineNumber: number) => {
            const isActive = activeLine === lineNumber;
            return {
              style: {
                display: "block",
                backgroundColor: isActive ? "rgba(59, 130, 246, 0.3)" : "transparent",
                borderLeft: isActive ? "3px solid #3b82f6" : "3px solid transparent",
                paddingLeft: "4px"
              }
            };
          }}
          customStyle={{
            margin: 0,
            padding: "8px 0 16px 0",
            background: "transparent",
            fontSize: "14px",
            lineHeight: "1.6"
          }}
        >
          {scenario.code}
        </SyntaxHighlighter>
      </div>
      
      {/* Console Output */}
      {currentState.consoleOutput && (
        <div className="hidden lg:flex h-32 border-t border-border/40 bg-black flex-col shrink-0">
          <div className="bg-[#2d2d2d] px-4 py-1 border-b border-border/40 flex items-center">
            <span className="text-[10px] font-bold text-green-400 font-mono tracking-wider">
              {'>_ CONSOLE'}
            </span>
          </div>
          <div className="flex-1 overflow-y-auto p-3 font-mono text-sm text-green-400 bg-black/50">
            {currentState.consoleOutput.length === 0 ? (
              <span className="text-gray-500 italic">No output yet...</span>
            ) : (
              currentState.consoleOutput.map((out, idx) => (
                <div key={idx}>{out}</div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Explanation Banner */}
      <div className="bg-primary/10 border-t border-primary/20 p-4 shrink-0">
        <p className="text-sm text-foreground dark:text-gray-200 leading-relaxed font-medium">
          {currentState.explanation}
        </p>
      </div>
    </div>
  );
}
