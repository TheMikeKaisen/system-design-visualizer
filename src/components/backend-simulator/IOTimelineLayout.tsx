import React from "react";
import { BackendStepState } from "@/lib/backend-simulator/engine";
import { BackendCodePanel } from "./BackendCodePanel";
import { IOTimelinePanel } from "./IOTimelinePanel";
import { ThreadStatusPanel } from "./ThreadStatusPanel";
import { ConsoleOutputPanel } from "./ConsoleOutputPanel";
import { ThreadPoolPanel } from "./ThreadPoolPanel";

interface Props {
  step: BackendStepState;
}

export function IOTimelineLayout({ step }: Props) {
  return (
    <div className="flex flex-col h-full gap-4 p-4">
      {/* Top Half: Code & Thread Status */}
      <div className="flex h-64 gap-4 shrink-0">
        <div className="flex-1 min-w-0">
          <BackendCodePanel step={step} />
        </div>
        <div className="w-64 shrink-0 flex flex-col gap-4">
          <ThreadStatusPanel status={step.threadStatus} />
          <div className="flex-1 min-h-0">
            <ConsoleOutputPanel output={step.consoleOutput} />
          </div>
        </div>
        {/* Thread Pool (shows contrast between blocking vs non-blocking) */}
        <div className="w-80 shrink-0">
          <ThreadPoolPanel threads={step.threadPool} />
        </div>
      </div>

      {/* Bottom Half: Timelines */}
      <div className="flex-1 flex gap-4 min-h-0">
        {step.timelineMode === "blocking" && step.timelineRequests && (
          <IOTimelinePanel mode="blocking" requests={step.timelineRequests} />
        )}
        {step.timelineMode === "nonblocking" && step.timelineRequests && (
          <IOTimelinePanel mode="nonblocking" requests={step.timelineRequests} />
        )}
      </div>
    </div>
  );
}
