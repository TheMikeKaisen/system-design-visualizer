"use client";

import React, { useEffect, useState } from "react";
import { useNetworkSimulationStore } from "@/store/useNetworkSimulationStore";
import {
  ALL_HTTP_SCENARIOS,
  SCENARIO_HTTP_CANONICAL_GET,
} from "@/lib/network-simulator/http-scenarios";
import type { HttpScenarioStep } from "@/lib/network-simulator/http-engine";
import { NetworkEpisodeShell } from "@/components/network-simulator/NetworkEpisodeShell";
import { HttpTopologyCanvas } from "@/components/network-simulator/HttpTopologyCanvas";
import { HttpTelemetryPanel } from "@/components/network-simulator/HttpTelemetryPanel";
import {
  HTTP_GLOSSARY,
  HTTP_TERM_PATTERNS,
} from "@/lib/network-simulator/http-engine";

export default function HttpLifecycleEpisodePage({
  defaultTelemetryCollapsed = true,
}: {
  defaultTelemetryCollapsed?: boolean;
} = {}) {
  const { setScenario } = useNetworkSimulationStore();
  const [activeTelemetryTab, setActiveTelemetryTab] = useState<
    "devtools" | "waterfall" | "backend"
  >("devtools");

  useEffect(() => {
    setScenario(SCENARIO_HTTP_CANONICAL_GET);
    return () => {
      useNetworkSimulationStore.getState().reset();
    };
  }, [setScenario]);

  return (
    <NetworkEpisodeShell
      episodeNumber={4}
      title="HTTP Request & Response Lifecycle — 2-Phase Fetch, Keep-Alive, Status Codes & CORS"
      scenarios={ALL_HTTP_SCENARIOS}
      accentColor="teal"
      canvasSpan="8"
      defaultTelemetryCollapsed={defaultTelemetryCollapsed}
      customGlossary={HTTP_GLOSSARY}
      customTermPatterns={HTTP_TERM_PATTERNS}
      canvasSlot={(step, _idx, telemetryControls) => {
        const httpStep = step as HttpScenarioStep | null;
        if (!httpStep?.httpData) return null;
        return (
          <HttpTopologyCanvas
            httpData={httpStep.httpData}
            onSelectPacket={() => {
              setActiveTelemetryTab("devtools");
              telemetryControls?.expandTelemetry();
            }}
          />
        );
      }}
      telemetrySlot={(step, _idx, telemetryControls) => {
        const httpStep = step as HttpScenarioStep | null;
        if (!httpStep?.httpData) return null;
        return (
          <HttpTelemetryPanel
            httpData={httpStep.httpData}
            activeTabOverride={activeTelemetryTab}
            onTabChange={setActiveTelemetryTab}
            onToggleCollapse={telemetryControls?.toggleCollapse}
            isCollapsed={telemetryControls?.isCollapsed}
          />
        );
      }}
    />
  );
}
