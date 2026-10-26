import { renderHook } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { useOSKeyboardShortcuts } from "../useOSKeyboardShortcuts";

describe("useOSKeyboardShortcuts", () => {
  it("fires onPlayPause on Space key", () => {
    const onPlayPause = vi.fn();
    renderHook(() => useOSKeyboardShortcuts({ onPlayPause }));

    window.dispatchEvent(new KeyboardEvent("keydown", { code: "Space" }));
    expect(onPlayPause).toHaveBeenCalledTimes(1);
  });

  it("fires onNext on ArrowRight when canNext is true", () => {
    const onNext = vi.fn();
    renderHook(() => useOSKeyboardShortcuts({ onNext, canNext: true }));

    window.dispatchEvent(new KeyboardEvent("keydown", { code: "ArrowRight" }));
    expect(onNext).toHaveBeenCalledTimes(1);
  });

  it("does not fire onNext when canNext is false", () => {
    const onNext = vi.fn();
    renderHook(() => useOSKeyboardShortcuts({ onNext, canNext: false }));

    window.dispatchEvent(new KeyboardEvent("keydown", { code: "ArrowRight" }));
    expect(onNext).not.toHaveBeenCalled();
  });

  it("fires onPrev on ArrowLeft when canPrev is true", () => {
    const onPrev = vi.fn();
    renderHook(() => useOSKeyboardShortcuts({ onPrev, canPrev: true }));

    window.dispatchEvent(new KeyboardEvent("keydown", { code: "ArrowLeft" }));
    expect(onPrev).toHaveBeenCalledTimes(1);
  });

  it("does not fire onPrev when canPrev is false", () => {
    const onPrev = vi.fn();
    renderHook(() => useOSKeyboardShortcuts({ onPrev, canPrev: false }));

    window.dispatchEvent(new KeyboardEvent("keydown", { code: "ArrowLeft" }));
    expect(onPrev).not.toHaveBeenCalled();
  });

  it("fires onReset on KeyR or 'r'", () => {
    const onReset = vi.fn();
    renderHook(() => useOSKeyboardShortcuts({ onReset }));

    window.dispatchEvent(new KeyboardEvent("keydown", { code: "KeyR" }));
    expect(onReset).toHaveBeenCalledTimes(1);

    window.dispatchEvent(new KeyboardEvent("keydown", { key: "r" }));
    expect(onReset).toHaveBeenCalledTimes(2);
  });

  it("ignores shortcuts when isEnabled is false", () => {
    const onPlayPause = vi.fn();
    renderHook(() => useOSKeyboardShortcuts({ onPlayPause, isEnabled: false }));

    window.dispatchEvent(new KeyboardEvent("keydown", { code: "Space" }));
    expect(onPlayPause).not.toHaveBeenCalled();
  });

  it("ignores shortcuts when typing in an input element", () => {
    const onPlayPause = vi.fn();
    renderHook(() => useOSKeyboardShortcuts({ onPlayPause }));

    const input = document.createElement("input");
    document.body.appendChild(input);

    const event = new KeyboardEvent("keydown", { code: "Space" });
    Object.defineProperty(event, "target", { value: input });
    window.dispatchEvent(event);

    expect(onPlayPause).not.toHaveBeenCalled();
    document.body.removeChild(input);
  });
});
