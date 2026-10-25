"use client";

import React, { useEffect } from "react";
import { useBackendSimulationStore } from "@/store/useBackendSimulationStore";
import { BE_SCENARIO_1 } from "@/lib/backend-simulator/be-scenario-1";
import { BackendEpisodeShell } from "@/components/backend-simulator/BackendEpisodeShell";

export default function BackendEpisode1Page() {
  const { setScenario } = useBackendSimulationStore();

  useEffect(() => {
    setScenario(BE_SCENARIO_1);
  }, [setScenario]);

  return <BackendEpisodeShell episodeNumber={1} title="Node Architecture" />;
}
