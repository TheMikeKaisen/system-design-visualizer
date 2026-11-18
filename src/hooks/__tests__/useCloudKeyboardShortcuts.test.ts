import { renderHook } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { useCloudKeyboardShortcuts } from "../useCloudKeyboardShortcuts";
import { useCloudSimulationStore } from "@/store/useCloudSimulationStore";

describe("useCloudKeyboardShortcuts", () => {
  beforeEach(() => {
    useCloudSimulationStore.getState().resetEpisode();
  });

  it("toggles play/pause on Space key", () => {
    renderHook(() => useCloudKeyboardShortcuts(true));

    expect(useCloudSimulationStore.getState().isPlaying).toBe(false);
    window.dispatchEvent(new KeyboardEvent("keydown", { code: "Space" }));
    expect(useCloudSimulationStore.getState().isPlaying).toBe(true);

    window.dispatchEvent(new KeyboardEvent("keydown", { code: "Space" }));
    expect(useCloudSimulationStore.getState().isPlaying).toBe(false);
  });

  it("steps forward on ArrowRight or KeyL", () => {
    renderHook(() => useCloudKeyboardShortcuts(true));

    expect(useCloudSimulationStore.getState().currentStepIndex).toBe(0);
    window.dispatchEvent(new KeyboardEvent("keydown", { code: "ArrowRight" }));
    expect(useCloudSimulationStore.getState().currentStepIndex).toBe(1);

    window.dispatchEvent(new KeyboardEvent("keydown", { code: "KeyL" }));
    expect(useCloudSimulationStore.getState().currentStepIndex).toBe(2);
  });

  it("steps backward on ArrowLeft or KeyH", () => {
    renderHook(() => useCloudKeyboardShortcuts(true));

    useCloudSimulationStore.getState().setStepIndex(2);
    expect(useCloudSimulationStore.getState().currentStepIndex).toBe(2);

    window.dispatchEvent(new KeyboardEvent("keydown", { code: "ArrowLeft" }));
    expect(useCloudSimulationStore.getState().currentStepIndex).toBe(1);

    window.dispatchEvent(new KeyboardEvent("keydown", { code: "KeyH" }));
    expect(useCloudSimulationStore.getState().currentStepIndex).toBe(0);
  });

  it("resets to step 0 on KeyR or 'r' / 'R'", () => {
    renderHook(() => useCloudKeyboardShortcuts(true));

    useCloudSimulationStore.getState().setStepIndex(3);
    expect(useCloudSimulationStore.getState().currentStepIndex).toBe(3);

    window.dispatchEvent(new KeyboardEvent("keydown", { code: "KeyR" }));
    expect(useCloudSimulationStore.getState().currentStepIndex).toBe(0);

    useCloudSimulationStore.getState().setStepIndex(2);
    window.dispatchEvent(new KeyboardEvent("keydown", { key: "r" }));
    expect(useCloudSimulationStore.getState().currentStepIndex).toBe(0);
  });

  it("toggles telemetry inspector on KeyT or 't' / 'T'", () => {
    renderHook(() => useCloudKeyboardShortcuts(true));

    expect(useCloudSimulationStore.getState().isTelemetryExpanded).toBe(false);
    window.dispatchEvent(new KeyboardEvent("keydown", { code: "KeyT" }));
    expect(useCloudSimulationStore.getState().isTelemetryExpanded).toBe(true);

    window.dispatchEvent(new KeyboardEvent("keydown", { key: "t" }));
    expect(useCloudSimulationStore.getState().isTelemetryExpanded).toBe(false);
  });

  it("ignores hotkeys when modifier keys (Ctrl, Cmd, Alt) are pressed to avoid hijacking browser shortcuts", () => {
    renderHook(() => useCloudKeyboardShortcuts(true));

    useCloudSimulationStore.getState().setStepIndex(2);

    // Ctrl+R (reload page) must not be intercepted
    const ctrlREvent = new KeyboardEvent("keydown", { code: "KeyR", ctrlKey: true });
    const preventDefaultSpy = vi.spyOn(ctrlREvent, "preventDefault");
    window.dispatchEvent(ctrlREvent);

    expect(preventDefaultSpy).not.toHaveBeenCalled();
    expect(useCloudSimulationStore.getState().currentStepIndex).toBe(2);

    // Meta+T (new tab) must not be intercepted
    const metaTEvent = new KeyboardEvent("keydown", { code: "KeyT", metaKey: true });
    const metaTSpy = vi.spyOn(metaTEvent, "preventDefault");
    window.dispatchEvent(metaTEvent);

    expect(metaTSpy).not.toHaveBeenCalled();
    expect(useCloudSimulationStore.getState().isTelemetryExpanded).toBe(false);
  });

  it("ignores shortcuts when typing inside form input, textarea, or contentEditable", () => {
    renderHook(() => useCloudKeyboardShortcuts(true));

    const input = document.createElement("input");
    document.body.appendChild(input);

    const event = new KeyboardEvent("keydown", { code: "Space" });
    Object.defineProperty(event, "target", { value: input });
    window.dispatchEvent(event);

    expect(useCloudSimulationStore.getState().isPlaying).toBe(false);
    document.body.removeChild(input);
  });

  it("ignores shortcuts when disabled", () => {
    renderHook(() => useCloudKeyboardShortcuts(false));

    window.dispatchEvent(new KeyboardEvent("keydown", { code: "Space" }));
    expect(useCloudSimulationStore.getState().isPlaying).toBe(false);
  });
});
