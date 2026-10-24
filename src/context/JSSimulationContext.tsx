"use client";

import React, { createContext, useContext, ReactNode } from "react";
import { SimulationScenario } from "@/lib/js-simulator/engine";
import { useJSSimulationStore } from "@/store/useJSSimulationStore";

export interface SimulationContextValue {
  scenario: SimulationScenario;
  currentStepIndex: number;
}

export const JSSimulationContext = createContext<SimulationContextValue | null>(null);

export function JSSimulationProvider({
  scenario,
  currentStepIndex,
  children,
}: {
  scenario: SimulationScenario;
  currentStepIndex: number;
  children: ReactNode;
}) {
  return (
    <JSSimulationContext.Provider value={{ scenario, currentStepIndex }}>
      {children}
    </JSSimulationContext.Provider>
  );
}

export function useActiveSimulation() {
  const store = useJSSimulationStore();
  const override = useContext(JSSimulationContext);
  return {
    ...store,
    scenario: override?.scenario ?? store?.scenario,
    currentStepIndex: override?.currentStepIndex ?? store?.currentStepIndex ?? 0,
  };
}
