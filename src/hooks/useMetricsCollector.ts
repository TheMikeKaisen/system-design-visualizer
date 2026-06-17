"use client";

import { useEffect, useRef } from "react";
import { useSimulationStore } from "@/lib/store/useSimulationStore";
import { useObservabilityStore } from "@/lib/store/useObservabilityStore";
import type { SimulationDataPoint, GatewaySnapshot } from "@/types";

const COLLECTION_INTERVAL_MS = 1000;

/**
 * Collects simulation metrics once per second and pushes them
 * into the observability store. Mount this once in the canvas page.
 *
 * Uses imperative store reads — zero React re-renders in the loop.
 */
export function useMetricsCollector() {
  const prevTotalArrivedRef = useRef(0);
  const prevTsRef           = useRef(Date.now());

  useEffect(() => {
    const interval = setInterval(() => {
      const simState  = useSimulationStore.getState();
      const obsStore  = useObservabilityStore.getState();

      if (!simState.isRunning) return;

      const now       = Date.now();
      const deltaMs   = now - prevTsRef.current;
      prevTsRef.current = now;

      // Packets per second — delta since last collection
      const currentArrived  = simState.stats.totalArrived;
      const arrivedThisSec  = currentArrived - prevTotalArrivedRef.current;
      prevTotalArrivedRef.current = currentArrived;
      const packetsPerSec   = (arrivedThisSec / deltaMs) * 1000;

      // Active packets
      const activePackets = Object.values(simState.packets).filter(
        (p) => p.status === "traveling"
      ).length;

      // Drop rate
      const totalSent      = simState.stats.totalSent;
      const totalDropped   = simState.stats.totalDropped;
      const dropRatePct    = totalSent > 0
        ? (totalDropped / totalSent) * 100
        : 0;

      // Gateway snapshots
      const gatewayStates: Record<string, GatewaySnapshot> = {};
      for (const [id, gs] of Object.entries(simState.gatewayStates)) {
        gatewayStates[id] = {
          gatewayId:    id,
          cbState:      gs.cbState,
          shedCount:    gs.cbShedCount,
          tokenFillPct: gs.rateLimiterFillPct,
        };
      }

      const point: SimulationDataPoint = {
        ts:             now,
        packetsPerSec:  Math.round(packetsPerSec * 10) / 10,
        activePackets,
        avgLatencyMs:   Math.round(simState.stats.avgLatencyMs),
        dropRatePct:    Math.round(dropRatePct * 10) / 10,
        gatewayStates,
      };

      obsStore.pushDataPoint(point);
    }, COLLECTION_INTERVAL_MS);

    return () => clearInterval(interval);
  }, []);
}
