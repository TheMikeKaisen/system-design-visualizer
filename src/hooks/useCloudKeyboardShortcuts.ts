import { useEffect } from "react";
import { useCloudSimulationStore } from "@/store/useCloudSimulationStore";

/**
 * useCloudKeyboardShortcuts
 * WCAG 2.1.1 accessible keyboard controller for the Cloud IAM simulator.
 * - Space: Play / Pause toggle
 * - ArrowLeft / KeyH: Step backward
 * - ArrowRight / KeyL: Step forward
 * - KeyR: Reset simulation to step 0
 * - KeyT: Toggle telemetry / policy inspector panel
 */
export function useCloudKeyboardShortcuts(enabled = true) {
  useEffect(() => {
    if (!enabled) return;

    function handleKeyDown(e: KeyboardEvent) {
      // Ignore keystrokes when meta, ctrl, or alt keys are pressed to avoid hijacking browser shortcuts
      if (e.metaKey || e.ctrlKey || e.altKey) {
        return;
      }

      // Ignore keystrokes inside text inputs, textareas, or content-editable elements
      const target = e.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.tagName === "SELECT" ||
          target.isContentEditable)
      ) {
        return;
      }

      if (e.code === "Space") {
        e.preventDefault();
        useCloudSimulationStore.getState().togglePlay();
      } else if (e.code === "ArrowLeft" || e.code === "KeyH") {
        e.preventDefault();
        useCloudSimulationStore.getState().prevStep();
      } else if (e.code === "ArrowRight" || e.code === "KeyL") {
        e.preventDefault();
        useCloudSimulationStore.getState().nextStep();
      } else if (e.code === "KeyR" || e.key === "r" || e.key === "R") {
        e.preventDefault();
        useCloudSimulationStore.getState().resetStep();
      } else if (e.code === "KeyT" || e.key === "t" || e.key === "T") {
        e.preventDefault();
        useCloudSimulationStore.getState().toggleTelemetry();
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [enabled]);
}
