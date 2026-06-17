"use client";
import { useMetricsCollector } from "@/hooks/useMetricsCollector";

export function MetricsCollectorMount() {
  useMetricsCollector();
  return null;
}
