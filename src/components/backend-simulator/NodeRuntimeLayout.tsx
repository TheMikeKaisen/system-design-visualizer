import React from "react";
import { BackendStepState } from "@/lib/backend-simulator/engine";
import { BackendCodePanel } from "./BackendCodePanel";
import { BackendCallStackPanel } from "./BackendCallStackPanel";
import { ThreadPoolPanel } from "./ThreadPoolPanel";
import { ConsoleOutputPanel } from "./ConsoleOutputPanel";
import { EventLoopPhasesPanel } from "./EventLoopPhasesPanel";
import { PriorityQueuesPanel } from "./PriorityQueuesPanel";

interface Props {
  step: BackendStepState;
}

export function NodeRuntimeLayout({ step }: Props) {
  return (
    <div className="flex h-full gap-4 p-4">
      {/* Column 1: Main Thread (Call Stack & Code) */}
      <div className="w-[28%] flex flex-col gap-4 min-w-0">
        <div className="h-64 shrink-0">
          <BackendCallStackPanel stack={step.callStack} />
        </div>
        <div className="flex-1 min-h-0">
          <BackendCodePanel step={step} />
        </div>
      </div>

      {/* Column 2: libuv Thread Pool */}
      <div className="w-[28%] flex flex-col gap-4 min-w-0">
        <ThreadPoolPanel threads={step.threadPool} />
        
        {/* Console Output (replaces the placeholder) */}
        <div className="h-48 shrink-0">
          <ConsoleOutputPanel output={step.consoleOutput || []} />
        </div>
      </div>

      {/* Column 3: Event Loop Phases & Priority Queues */}
      <div className="flex-1 flex flex-col gap-6 min-w-0">
        <PriorityQueuesPanel 
          nextTickQueue={step.nextTickQueue} 
          microtaskQueue={step.microtaskQueue}
          activePhase={step.activePhase}
        />
        <div className="flex-1 min-h-0">
          <EventLoopPhasesPanel phases={step.eventLoopPhases} />
        </div>
      </div>
    </div>
  );
}
