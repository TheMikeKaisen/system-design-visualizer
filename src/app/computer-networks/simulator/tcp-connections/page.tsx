"use client";

import React, { useEffect, useState } from "react";
import { useNetworkSimulationStore } from "@/store/useNetworkSimulationStore";
import {
  ALL_TCP_SCENARIOS,
  SCENARIO_TCP_HANDSHAKE,
  type TcpScenarioStep,
} from "@/lib/network-simulator/tcp-scenarios";
import { NetworkEpisodeShell } from "@/components/network-simulator/NetworkEpisodeShell";
import { TcpTopologyCanvas } from "@/components/network-simulator/TcpTopologyCanvas";
import { TcpTelemetryPanel } from "@/components/network-simulator/TcpTelemetryPanel";
import {
  TCP_GLOSSARY,
  TCP_TERM_PATTERNS,
  type TcpSegment,
} from "@/lib/network-simulator/tcp-engine";

export default function TcpConnectionsEpisodePage() {
  const { currentStepIndex, scenario, setScenario } = useNetworkSimulationStore();
  const currentStepKey = `${scenario.id}-${currentStepIndex}`;
  const [selectedSegmentState, setSelectedSegmentState] = useState<{
    stepKey: string;
    segment: TcpSegment | null;
  }>({
    stepKey: currentStepKey,
    segment: null,
  });

  useEffect(() => {
    setScenario(SCENARIO_TCP_HANDSHAKE);
    return () => {
      useNetworkSimulationStore.getState().reset();
    };
  }, [setScenario]);

  const selectedSegmentOverride =
    selectedSegmentState.stepKey === currentStepKey ? selectedSegmentState.segment : null;

  return (
    <NetworkEpisodeShell
      episodeNumber={3}
      title="TCP Connection Establishment & Lifecycle — 3-Way Handshake, Backlog & Teardown"
      scenarios={ALL_TCP_SCENARIOS}
      accentColor="teal"
      customGlossary={TCP_GLOSSARY}
      customTermPatterns={TCP_TERM_PATTERNS}
      canvasSlot={(step) => {
        const tcpStep = step as TcpScenarioStep | null;
        if (!tcpStep?.tcpData) return null;
        return (
          <TcpTopologyCanvas
            tcpData={tcpStep.tcpData}
            onSelectSegment={(seg) =>
              setSelectedSegmentState({
                stepKey: currentStepKey,
                segment: seg,
              })
            }
          />
        );
      }}
      telemetrySlot={(step) => {
        const tcpStep = step as TcpScenarioStep | null;
        if (!tcpStep?.tcpData) return null;
        return (
          <TcpTelemetryPanel
            tcpData={tcpStep.tcpData}
            activeSegmentOverride={selectedSegmentOverride}
          />
        );
      }}
    />
  );
}
