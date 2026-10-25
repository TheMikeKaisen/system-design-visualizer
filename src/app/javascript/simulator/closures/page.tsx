"use client";

import { useActiveSimulation } from "@/context/JSSimulationContext";
import { CodePanel } from "@/components/javascript/CodePanel";
import { CallStackPanel } from "@/components/javascript/CallStackPanel";
import { ExecutionContextPanel } from "@/components/javascript/ExecutionContextPanel";
import { TaskQueuePanel } from "@/components/javascript/TaskQueuePanel";
import { MobileTabbedPanels } from "@/components/javascript/MobileTabbedPanels";
import { SimulationShell } from "@/components/javascript/SimulationShell";
import { ALL_CLOSURE_SCENARIOS } from "@/lib/js-simulator/closure-scenarios";

function ClosuresLayout() {
  const { scenario, currentStepIndex } = useActiveSimulation();
  const steps = scenario?.steps ?? [];
  const safeIndex = Math.max(0, Math.min(currentStepIndex, Math.max(0, steps.length - 1)));
  const currentState = steps[safeIndex] ?? null;
  const hasTaskQueue = (currentState?.taskQueue !== undefined && currentState.taskQueue.length > 0) ||
                       (currentState?.callbackQueue !== undefined && currentState.callbackQueue.length > 0);

  return (
    <main className="flex-1 overflow-hidden flex flex-col p-4 md:p-6 gap-6 relative">
      <div className="flex-1 flex flex-col lg:grid lg:grid-cols-3 gap-4 lg:gap-6 min-h-0 relative overflow-hidden">
        {/* Top/Left: Code Panel */}
        <div className="flex-[0_0_45%] min-h-0 lg:flex-none lg:h-full lg:col-span-1 shrink-0">
          <CodePanel />
        </div>

        {/* Desktop: Grid for Stack & Context */}
        <div className="hidden lg:contents">
          <div className="h-full min-h-0 flex flex-col gap-4 lg:gap-6">
            <div className="flex-1 min-h-0">
              <CallStackPanel />
            </div>
            {hasTaskQueue && (
              <div className="flex-1 min-h-0">
                <TaskQueuePanel />
              </div>
            )}
          </div>
          <div className="h-full min-h-0 relative">
            <ExecutionContextPanel />
          </div>
        </div>

        {/* Mobile: Tabs for Stack & Context */}
        <div className="flex-1 flex flex-col lg:hidden min-h-0 relative">
          <MobileTabbedPanels />
        </div>
      </div>
    </main>
  );
}

export default function JSClosuresSimulator() {
  return (
    <SimulationShell
      scenarios={ALL_CLOSURE_SCENARIOS}
      defaultScenario={ALL_CLOSURE_SCENARIOS[0]}
    >
      <ClosuresLayout />
    </SimulationShell>
  );
}
