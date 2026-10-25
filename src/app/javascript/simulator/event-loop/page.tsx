"use client";

import { CodePanel } from "@/components/javascript/CodePanel";
import { CallStackPanel } from "@/components/javascript/CallStackPanel";
import { ConsolePanel } from "@/components/javascript/ConsolePanel";
import { WebAPIsPanel } from "@/components/javascript/WebAPIsPanel";
import { MicrotaskQueuePanel } from "@/components/javascript/MicrotaskQueuePanel";
import { CallbackQueuePanel } from "@/components/javascript/CallbackQueuePanel";
import { EventLoopIndicator } from "@/components/javascript/EventLoopIndicator";
import { EventLoopMobilePanels } from "@/components/javascript/EventLoopMobilePanels";
import { SimulationShell } from "@/components/javascript/SimulationShell";
import { ALL_EVENT_LOOP_SCENARIOS } from "@/lib/js-simulator/event-loop-scenarios";

export default function JSEventLoopSimulator() {
  return (
    <SimulationShell
      scenarios={ALL_EVENT_LOOP_SCENARIOS}
      defaultScenario={ALL_EVENT_LOOP_SCENARIOS[0]}
    >
      <main className="flex-1 overflow-hidden flex flex-col p-4 md:p-6 gap-4 relative">
        {/* Desktop Layout - "Runtime Landscape" */}
        <div className="hidden lg:flex flex-col h-full gap-4 min-h-0">
          {/* Top Half: Code & Engine */}
          <div className="flex-[3] flex gap-4 min-h-0">
            <div className="flex-1 min-h-0 relative shadow-sm">
              <CodePanel />
            </div>
            <div className="flex-1 min-h-0 relative shadow-sm">
              <CallStackPanel />
            </div>
            <div className="flex-1 min-h-0 relative shadow-sm">
              <WebAPIsPanel />
            </div>
          </div>

          {/* Bottom Half: Event Loop & Queues */}
          <div className="flex-[2] flex gap-4 bg-muted/5 p-4 rounded-xl border border-border/50 shadow-inner min-h-[160px] max-h-[240px]">
            <div className="flex-[2] min-w-0">
              <MicrotaskQueuePanel />
            </div>
            <div className="flex-1 min-w-[160px]">
              <EventLoopIndicator />
            </div>
            <div className="flex-[2] min-w-0">
              <CallbackQueuePanel />
            </div>
            <div className="flex-[2] min-w-0">
              <ConsolePanel />
            </div>
          </div>
        </div>

        {/* Mobile Layout */}
        <div className="lg:hidden flex flex-col h-full gap-4 min-h-0">
          <div className="flex-1 min-h-0 shadow-sm rounded-xl overflow-hidden">
            <CodePanel />
          </div>
          <div className="flex-1 min-h-0 bg-card rounded-xl border border-border/50 p-2 shadow-sm">
            <EventLoopMobilePanels />
          </div>
        </div>
      </main>
    </SimulationShell>
  );
}
