import React from "react";
import { ReactStepState } from "@/lib/react-simulator/engine";
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';

interface CodePanelProps {
  step: ReactStepState;
}

export function CodePanel({ step }: CodePanelProps) {
  const codeToShow = step.showCompiled && step.compiledCode ? step.compiledCode : step.jsxCode;

  if (!codeToShow) {
    return (
      <div className="flex-1 bg-zinc-950 rounded-xl border border-zinc-800 overflow-hidden flex flex-col font-mono relative shadow-2xl">
        <div className="h-10 border-b border-zinc-800 bg-zinc-900/50 flex items-center px-4">
          <span className="text-xs font-medium text-zinc-400">Editor</span>
        </div>
        <div className="flex-1 flex items-center justify-center text-zinc-500 text-sm">
          No code to display
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 bg-zinc-950 rounded-xl border border-zinc-800 overflow-hidden flex flex-col font-mono relative shadow-2xl">
      {/* Header */}
      <div className="h-10 border-b border-zinc-800 bg-zinc-900/50 flex items-center justify-between px-4 sticky top-0 z-10 shrink-0">
        <div className="flex items-center gap-2">
          <svg className="w-4 h-4 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
          </svg>
          <span className="text-xs font-medium text-zinc-300">
            {step.showCompiled ? "Babel Output (Compiled JS)" : "React Component (JSX)"}
          </span>
        </div>
      </div>

      {/* Code Area */}
      <div className="flex-1 overflow-auto bg-[#1e1e1e] relative">
        <SyntaxHighlighter
          language={step.showCompiled ? "javascript" : "jsx"}
          style={vscDarkPlus}
          showLineNumbers={true}
          wrapLines={true}
          lineNumberStyle={{ minWidth: '2.5em', paddingRight: '1em', color: '#6e7681', textAlign: 'right' }}
          customStyle={{
            margin: 0,
            padding: '1rem 0',
            background: 'transparent',
            fontSize: '14px',
            minHeight: '100%',
          }}
          lineProps={(lineNumber) => {
            const isHighlighted = step.activeLine === lineNumber && !step.showCompiled;
            return {
              style: {
                display: 'block',
                backgroundColor: isHighlighted ? 'rgba(59, 130, 246, 0.15)' : 'transparent',
                borderLeft: isHighlighted ? '3px solid rgb(59, 130, 246)' : '3px solid transparent',
                width: '100%'
              }
            };
          }}
        >
          {codeToShow}
        </SyntaxHighlighter>
      </div>
    </div>
  );
}
