"use client";

import React, { useEffect } from "react";
import { useBackendSimulationStore } from "@/store/useBackendSimulationStore";
import { BE_SCENARIO_2 } from "@/lib/backend-simulator/be-scenario-2";
import { BackendEpisodeShell } from "../1/page";

export default function BackendEpisode2Page() {
  const { setScenario } = useBackendSimulationStore();

  useEffect(() => {
    setScenario(BE_SCENARIO_2);
  }, [setScenario]);

  return <BackendEpisodeShell episodeNumber={2} title="Blocking vs Non-Blocking" />;
}
