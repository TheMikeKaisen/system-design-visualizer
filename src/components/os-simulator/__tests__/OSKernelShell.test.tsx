import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { OSKernelShell } from "../OSKernelShell";

// Mock ThemeToggle
vi.mock("@/components/ThemeToggle", () => ({
  ThemeToggle: () => <button data-testid="theme-toggle">Theme</button>,
}));

describe("OSKernelShell", () => {
  const defaultProps = {
    title: "Process States Simulator",
    currentStepIndex: 1,
    totalSteps: 5,
    isPlaying: false,
    playbackSpeed: 1,
    onPlayPause: vi.fn(),
    onNext: vi.fn(),
    onPrev: vi.fn(),
    onReset: vi.fn(),
    onSpeedChange: vi.fn(),
    children: <div data-testid="stage-content">Simulation Active</div>,
  };

  it("renders navbar branding, title, step counter, and stage children", () => {
    render(<OSKernelShell {...defaultProps} />);

    expect(screen.getByText("Back to OS")).toBeDefined();
    expect(screen.getByText("Process States Simulator")).toBeDefined();
    expect(screen.getByText("2/5")).toBeDefined();
    expect(screen.getByTestId("stage-content")).toBeDefined();
    expect(screen.getByTestId("theme-toggle")).toBeDefined();
  });

  it("triggers onPlayPause, onNext, onPrev, and onReset on button clicks", () => {
    const onPlayPause = vi.fn();
    const onNext = vi.fn();
    const onPrev = vi.fn();
    const onReset = vi.fn();

    render(
      <OSKernelShell
        {...defaultProps}
        onPlayPause={onPlayPause}
        onNext={onNext}
        onPrev={onPrev}
        onReset={onReset}
      />
    );

    fireEvent.click(screen.getByTitle(/Play/i));
    expect(onPlayPause).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByTitle(/Next Step/i));
    expect(onNext).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByTitle(/Previous Step/i));
    expect(onPrev).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByTitle(/Restart/i));
    expect(onReset).toHaveBeenCalledTimes(1);
  });

  it("supports keyboard navigation shortcuts", () => {
    const onPlayPause = vi.fn();
    const onNext = vi.fn();
    const onPrev = vi.fn();
    const onReset = vi.fn();

    render(
      <OSKernelShell
        {...defaultProps}
        onPlayPause={onPlayPause}
        onNext={onNext}
        onPrev={onPrev}
        onReset={onReset}
      />
    );

    window.dispatchEvent(new KeyboardEvent("keydown", { code: "Space" }));
    expect(onPlayPause).toHaveBeenCalledTimes(1);

    window.dispatchEvent(new KeyboardEvent("keydown", { code: "ArrowRight" }));
    expect(onNext).toHaveBeenCalledTimes(1);

    window.dispatchEvent(new KeyboardEvent("keydown", { code: "ArrowLeft" }));
    expect(onPrev).toHaveBeenCalledTimes(1);

    window.dispatchEvent(new KeyboardEvent("keydown", { code: "KeyR" }));
    expect(onReset).toHaveBeenCalledTimes(1);
  });

  it("disables Prev button at step 0 and Next button at last step", () => {
    const { rerender } = render(
      <OSKernelShell {...defaultProps} currentStepIndex={0} />
    );
    expect(screen.getByTitle(/Previous Step/i)).toHaveProperty("disabled", true);
    expect(screen.getByTitle(/Next Step/i)).toHaveProperty("disabled", false);

    rerender(
      <OSKernelShell {...defaultProps} currentStepIndex={4} totalSteps={5} />
    );
    expect(screen.getByTitle(/Next Step/i)).toHaveProperty("disabled", true);
    expect(screen.getByTitle(/Previous Step/i)).toHaveProperty("disabled", false);
  });

  it("renders chapters and speed pills, firing callbacks when clicked", () => {
    const onChapterSelect = vi.fn();
    const onSpeedChange = vi.fn();

    render(
      <OSKernelShell
        {...defaultProps}
        chapters={[
          { title: "Creation", startStep: 0, endStep: 2 },
          { title: "Execution", startStep: 3, endStep: 4 },
        ]}
        currentChapterIndex={0}
        onChapterSelect={onChapterSelect}
        onSpeedChange={onSpeedChange}
      />
    );

    fireEvent.click(screen.getByText("Execution"));
    expect(onChapterSelect).toHaveBeenCalledWith(1);

    fireEvent.click(screen.getByText("2x"));
    expect(onSpeedChange).toHaveBeenCalledWith(2);
  });
});
