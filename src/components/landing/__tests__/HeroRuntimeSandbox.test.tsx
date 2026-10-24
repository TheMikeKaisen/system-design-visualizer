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
    expect(screen.getAllByText(/Call Stack/i).length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText(/Engine idle — Stack is empty/i)).toBeDefined();
  });

  it("switches to Operating Systems tab when clicked", () => {
    render(<HeroRuntimeSandbox />);

    const osTab = screen.getByRole("tab", { name: /Operating Systems/i });
    fireEvent.click(osTab);

    expect(screen.getByText("scheduler.c")).toBeDefined();
    expect(screen.getByText(/CPU Core/i)).toBeDefined();
    expect(screen.getByText(/Ready Queue/i)).toBeDefined();
    expect(screen.getByText("P1")).toBeDefined();
  });

  it("switches to Java & JVM tab when clicked", () => {
    render(<HeroRuntimeSandbox />);

    const javaTab = screen.getByRole("tab", { name: /Java & JVM/i });
    fireEvent.click(javaTab);

    expect(screen.getByText("Main.java")).toBeDefined();
    expect(screen.getByText(/JVM Thread Stack/i)).toBeDefined();
    expect(screen.getByText(/Eden Generation/i)).toBeDefined();
  });

  it("advances and steps back through scenario steps manually", () => {
    render(<HeroRuntimeSandbox />);

    const nextBtn = screen.getByTitle("Next step");
    const prevBtn = screen.getByTitle("Previous step");

    expect(prevBtn).toHaveProperty("disabled", true);

    fireEvent.click(nextBtn);
    expect(screen.getByText("Declaration")).toBeDefined();
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

  it("toggles pause and play mode", () => {
    render(<HeroRuntimeSandbox />);

    // Starts in auto-running mode, so button offers Pause
    const pauseBtn = screen.getByTitle("Pause simulation");
    fireEvent.click(pauseBtn);

    // Now paused, button offers Play
    const playBtn = screen.getByTitle("Play simulation");
    expect(playBtn).toBeDefined();

    fireEvent.click(playBtn);
    expect(screen.getByTitle("Pause simulation")).toBeDefined();
  });

  it("completes subject visualization then advances to next discipline", () => {
    render(<HeroRuntimeSandbox />);

    expect(screen.getByText("counter.js")).toBeDefined();

    // Step through the chained timer cycles to complete JS scenario and transition to OS
    for (let i = 0; i < 7; i++) {
      act(() => {
        vi.advanceTimersByTime(2500);
      });
    }

    expect(screen.getByText("scheduler.c")).toBeDefined();

    // Step through OS scenario and transition to Java
    for (let i = 0; i < 7; i++) {
      act(() => {
        vi.advanceTimersByTime(2500);
      });
    }

    expect(screen.getByText("Main.java")).toBeDefined();
  });
});
