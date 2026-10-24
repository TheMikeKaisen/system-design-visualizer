import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, act } from "@testing-library/react";
import { HeroRuntimeSandbox } from "../HeroRuntimeSandbox";

describe("HeroRuntimeSandbox", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("renders default JavaScript tab with initial Call Stack state", () => {
    render(<HeroRuntimeSandbox />);

    expect(screen.getByRole("region", { name: /Interactive Multi-Discipline System Simulator Sandbox/i })).toBeDefined();
    expect(screen.getByText("counter.js")).toBeDefined();
    expect(screen.getByText("Call Stack")).toBeDefined();
    expect(screen.getByText(/Engine idle — Stack is empty/i)).toBeDefined();
  });

  it("switches to Operating Systems tab when clicked", () => {
    render(<HeroRuntimeSandbox />);

    const osTab = screen.getByRole("tab", { name: /Operating Systems/i });
    fireEvent.click(osTab);

    expect(screen.getByText("scheduler.c")).toBeDefined();
    expect(screen.getByText("CPU Core (Hardware Execution)")).toBeDefined();
    expect(screen.getByText("Ready Queue (FIFO)")).toBeDefined();
    expect(screen.getByText("P1")).toBeDefined();
  });

  it("switches to Java & JVM tab when clicked", () => {
    render(<HeroRuntimeSandbox />);

    const javaTab = screen.getByRole("tab", { name: /Java & JVM/i });
    fireEvent.click(javaTab);

    expect(screen.getByText("Main.java")).toBeDefined();
    expect(screen.getByText("JVM Thread Stack")).toBeDefined();
    expect(screen.getByText(/Eden Generation/i)).toBeDefined();
  });

  it("advances and steps back through scenario steps", () => {
    render(<HeroRuntimeSandbox />);

    const nextBtn = screen.getByTitle("Next step");
    const prevBtn = screen.getByTitle("Previous step");

    expect(prevBtn).toHaveProperty("disabled", true);

    fireEvent.click(nextBtn);
    expect(screen.getByText(/Creation Phase/i)).toBeDefined();
    expect(prevBtn).toHaveProperty("disabled", false);

    fireEvent.click(prevBtn);
    expect(screen.getByText("Engine Init")).toBeDefined();
    expect(prevBtn).toHaveProperty("disabled", true);
  });

  it("resets step index when reset button is clicked", () => {
    render(<HeroRuntimeSandbox />);

    const nextBtn = screen.getByTitle("Next step");
    fireEvent.click(nextBtn);
    fireEvent.click(nextBtn);

    const resetBtn = screen.getByTitle("Reset simulation to step 1");
    fireEvent.click(resetBtn);

    expect(screen.getByText("Engine Init")).toBeDefined();
  });

  it("toggles play/pause mode", () => {
    render(<HeroRuntimeSandbox />);

    const playBtn = screen.getByTitle("Play simulation");
    fireEvent.click(playBtn);

    expect(screen.getByTitle("Pause simulation")).toBeDefined();

    // Advance timer for one step
    act(() => {
      vi.advanceTimersByTime(2300);
    });

    expect(screen.getByText(/Creation Phase/i)).toBeDefined();
  });

  it("auto-cycles through tabs when idle", () => {
    render(<HeroRuntimeSandbox />);

    expect(screen.getByText("counter.js")).toBeDefined();

    // Advance 8 seconds for idle transition to OS tab
    act(() => {
      vi.advanceTimersByTime(8100);
    });

    expect(screen.getByText("scheduler.c")).toBeDefined();

    // Advance another 8 seconds for idle transition to Java tab
    act(() => {
      vi.advanceTimersByTime(8100);
    });

    expect(screen.getByText("Main.java")).toBeDefined();
  });

  it("pauses idle auto-cycling on hover", () => {
    render(<HeroRuntimeSandbox />);

    const container = screen.getByRole("region", { name: /Interactive Multi-Discipline System Simulator Sandbox/i });
    fireEvent.mouseEnter(container);

    // Advance 9 seconds while hovering
    act(() => {
      vi.advanceTimersByTime(9000);
    });

    // Should still be on JavaScript tab because hover paused auto-cycling
    expect(screen.getByText("counter.js")).toBeDefined();

    fireEvent.mouseLeave(container);
  });
});
