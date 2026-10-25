"use client";

import { CodePanel } from "@/components/javascript/CodePanel";
import { CallStackPanel } from "@/components/javascript/CallStackPanel";
import { ExecutionContextPanel } from "@/components/javascript/ExecutionContextPanel";
import { MobileTabbedPanels } from "@/components/javascript/MobileTabbedPanels";
import { SimulationShell } from "@/components/javascript/SimulationShell";
import { BLOCK_SCOPE_SCENARIOS } from "@/lib/js-simulator/block-scope-scenarios";

export default function JSBlockScopeSimulator() {
  return (
    <SimulationShell
      scenarios={BLOCK_SCOPE_SCENARIOS}
      defaultScenario={BLOCK_SCOPE_SCENARIOS[0]}
    >
      <main className="flex-1 overflow-hidden flex flex-col p-4 md:p-6 gap-6 relative">
        <div className="flex-1 flex flex-col lg:grid lg:grid-cols-3 gap-4 lg:gap-6 min-h-0 relative overflow-hidden">
          {/* Top/Left: Code Panel */}
          <div className="flex-[0_0_45%] min-h-0 lg:flex-none lg:h-full lg:col-span-1 shrink-0">
            <CodePanel />
          </div>

          {/* Desktop: Grid for Stack & Context */}
          <div className="hidden lg:contents">
            <div className="h-full min-h-0">
              <CallStackPanel />
            </div>
            <div className="h-full min-h-0">
              <ExecutionContextPanel />
            </div>
          </div>

          {/* Mobile: Tabs for Stack & Context */}
          <div className="flex-1 flex flex-col lg:hidden min-h-0 relative">
            <MobileTabbedPanels />
          </div>
        </div>
      </main>
    </SimulationShell>
  );
}
