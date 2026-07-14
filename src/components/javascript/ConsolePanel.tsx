"use client";

import { useJSSimulationStore } from "@/store/useJSSimulationStore";

export function ConsolePanel() {
  const { scenario, currentStepIndex } = useJSSimulationStore();
  const currentState = scenario.steps[currentStepIndex];

  return (
    <div className="flex flex-col h-full bg-card rounded-xl border border-border/50 shadow-sm overflow-hidden">
      <div className="px-4 py-3 border-b border-border/50 bg-muted/20">
        <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="4 17 10 11 4 5"></polyline><line x1="12" y1="19" x2="20" y2="19"></line></svg>
          Console
        </h2>
      </div>
      
      <div className="flex-1 bg-[#1e1e1e] p-4 font-mono text-sm text-green-400 overflow-y-auto">
        {(!currentState.consoleOutput || currentState.consoleOutput.length === 0) ? (
          <span className="text-gray-500 italic">No output yet...</span>
        ) : (
          currentState.consoleOutput.map((out, idx) => (
            <div key={idx} className="mb-1">{out}</div>
          ))
        )}
      </div>
    </div>
  );
}
