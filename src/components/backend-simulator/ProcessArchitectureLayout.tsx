import React from "react";
import { BackendStepState } from "@/lib/backend-simulator/engine";
import { ProcessArchitecturePanel } from "./ProcessArchitecturePanel";
import { GlossaryCard } from "./GlossaryCard";
import { BackendCodePanel } from "./BackendCodePanel";

interface Props {
  step: BackendStepState;
}

export function ProcessArchitectureLayout({ step }: Props) {
  return (
    <div className="flex h-full gap-4 p-4">
      {/* Left Column: Architecture Diagram */}
      <div className="flex-1 min-w-0">
        <ProcessArchitecturePanel state={step.processArchitecture} />
      </div>

      {/* Right Column: Code & Glossary */}
      <div className="w-80 shrink-0 flex flex-col gap-4">
        {step.code && (
          <div className="h-64 shrink-0">
            <BackendCodePanel step={step} />
          </div>
        )}
        
        {step.glossaryTerm && (
          <GlossaryCard term={step.glossaryTerm} />
        )}
      </div>
    </div>
  );
}
