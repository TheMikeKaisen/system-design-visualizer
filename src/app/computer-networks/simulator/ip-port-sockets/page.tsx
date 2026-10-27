"use client";

import React, { useEffect } from "react";
import { useNetworkSimulationStore } from "@/store/useNetworkSimulationStore";
import { SCENARIO_HANDSHAKE } from "@/lib/network-simulator/scenarios";
import { NetworkEpisodeShell } from "@/components/network-simulator/NetworkEpisodeShell";

export default function IpPortSocketsEpisodePage() {
  const { setScenario } = useNetworkSimulationStore();

  useEffect(() => {
    setScenario(SCENARIO_HANDSHAKE);
  }, [setScenario]);

  return (
    <NetworkEpisodeShell
      episodeNumber={1}
      title="IP Addresses, Ports & Sockets — How Network Connections Work"
    />
  );
}
