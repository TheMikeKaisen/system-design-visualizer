"use client";

import React, { useEffect } from "react";
import { useBackendSimulationStore } from "@/store/useBackendSimulationStore";
import { BE_SCENARIO_3 } from "@/lib/backend-simulator/be-scenario-3";
import { BackendEpisodeShell } from "../1/page";

export default function BackendEpisode3Page() {
  const { setScenario } = useBackendSimulationStore();

  useEffect(() => {
    setScenario(BE_SCENARIO_3);
  }, [setScenario]);

  return <BackendEpisodeShell episodeNumber={3} title="Event Loop Phases" />;
}
