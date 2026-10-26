import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { OSConcurrencyShell } from "../OSConcurrencyShell";

// Mock ThemeToggle
vi.mock("@/components/ThemeToggle", () => ({
  ThemeToggle: () => <button data-testid="theme-toggle">Theme</button>,
}));

describe("OSConcurrencyShell", () => {
  const defaultProps = {
    title: "Producer-Consumer Problem",
    subtitle: "Episode 5 • Bounded Buffer Race Condition",
    currentStepIndex: 1,
    totalSteps: 6,
    isPlaying: false,
    onPlayPause: vi.fn(),
    onNext: vi.fn(),
    onPrev: vi.fn(),
    onReset: vi.fn(),
    onStepSelect: vi.fn(),
    chapter: "Race Condition",
    explanation: "Process A enters the critical section.",
    sharedResourceSlot: <div data-testid="shared-buffer">Buffer [Item 1]</div>,
    processASlot: <div data-testid="process-a">Producer Thread</div>,
    processBSlot: <div data-testid="process-b">Consumer Thread</div>,
    scenarios: [
      { id: "A", label: "Scenario A", isActive: true },
      { id: "B", label: "Scenario B", isActive: false },
    ],
    onScenarioSelect: vi.fn(),
    noteTitle: "Lost Update Hazard",
    noteContent: "Both threads increment count concurrently without atomic protection.",
  };

  it("renders navbar, title, shared resource, and process columns", () => {
    render(<OSConcurrencyShell {...defaultProps} />);

    expect(screen.getByText("Back to OS")).toBeDefined();
    expect(screen.getByText("Producer-Consumer Problem")).toBeDefined();
    expect(
      screen.getByText("Episode 5 • Bounded Buffer Race Condition")
    ).toBeDefined();
    expect(screen.getByTestId("shared-buffer")).toBeDefined();
    expect(screen.getByTestId("process-a")).toBeDefined();
    expect(screen.getByTestId("process-b")).toBeDefined();
    expect(screen.getByText("Process A enters the critical section.")).toBeDefined();
    expect(screen.getByText("Step 2 of 6")).toBeDefined();
    expect(screen.getByText("Lost Update Hazard")).toBeDefined();
  });

  it("handles circular button clicks for play, step forward, step back, and reset", () => {
    const onPlayPause = vi.fn();
    const onNext = vi.fn();
    const onPrev = vi.fn();
    const onReset = vi.fn();

    render(
      <OSConcurrencyShell
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
      <OSConcurrencyShell
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

  it("allows switching scenarios and jumping to steps via the timeline scrubber", () => {
    const onScenarioSelect = vi.fn();
    const onStepSelect = vi.fn();

    render(
      <OSConcurrencyShell
        {...defaultProps}
        onScenarioSelect={onScenarioSelect}
        onStepSelect={onStepSelect}
      />
    );

    fireEvent.click(screen.getByText("Scenario B"));
    expect(onScenarioSelect).toHaveBeenCalledWith("B");

    fireEvent.click(screen.getByTitle("Jump to Step 4"));
    expect(onStepSelect).toHaveBeenCalledWith(3);
  });

  it("renders code modal when isCodeModalOpen is true and closes on button click", () => {
    const onCloseCodeModal = vi.fn();

    render(
      <OSConcurrencyShell
        {...defaultProps}
        isCodeModalOpen={true}
        onCloseCodeModal={onCloseCodeModal}
        codeModalTitle="producer.c"
        codeModalContent={<pre data-testid="code-body">while (true);</pre>}
      />
    );

    expect(screen.getByText("producer.c")).toBeDefined();
    expect(screen.getByTestId("code-body")).toBeDefined();

    fireEvent.click(screen.getByLabelText("Close code dialog"));
    expect(onCloseCodeModal).toHaveBeenCalledTimes(1);
  });
});
