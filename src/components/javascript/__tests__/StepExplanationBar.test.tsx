import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { StepExplanationBar } from "../StepExplanationBar";
import { useJSSimulationStore } from "@/store/useJSSimulationStore";

vi.mock("@/store/useJSSimulationStore");

describe("StepExplanationBar", () => {
  beforeEach(() => {
    vi.mocked(useJSSimulationStore).mockReturnValue({
      scenario: {
        id: "test-scenario",
        title: "Test Scenario",
        code: "const x = 1;",
        steps: [
          {
            currentLine: 1,
            explanation: "First step: declaring constant x.",
            callStack: [],
          },
          {
            currentLine: 2,
            explanation: "Second step: executing next line.",
            callStack: [],
          },
        ],
      },
      currentStepIndex: 0,
      isPlaying: false,
    } as unknown as ReturnType<typeof useJSSimulationStore>);
  });

  it("renders the explanation and step pill badge correctly", () => {
    render(<StepExplanationBar />);
    expect(screen.getByText("Step 1")).toBeInTheDocument();
    expect(screen.getByText("First step: declaring constant x.")).toBeInTheDocument();
  });

  it("updates when moving to the second step", () => {
    vi.mocked(useJSSimulationStore).mockReturnValue({
      scenario: {
        id: "test-scenario",
        title: "Test Scenario",
        code: "const x = 1;",
        steps: [
          {
            currentLine: 1,
            explanation: "First step: declaring constant x.",
            callStack: [],
          },
          {
            currentLine: 2,
            explanation: "Second step: executing next line.",
            callStack: [],
          },
        ],
      },
      currentStepIndex: 1,
      isPlaying: false,
    } as unknown as ReturnType<typeof useJSSimulationStore>);

    render(<StepExplanationBar />);
    expect(screen.getByText("Step 2")).toBeInTheDocument();
    expect(screen.getByText("Second step: executing next line.")).toBeInTheDocument();
  });

  it("handles out-of-bounds currentStepIndex defensively without crashing", () => {
    vi.mocked(useJSSimulationStore).mockReturnValue({
      scenario: {
        id: "test-scenario",
        title: "Test Scenario",
        code: "const x = 1;",
        steps: [
          {
            currentLine: 1,
            explanation: "First step fallback.",
            callStack: [],
          },
        ],
      },
      currentStepIndex: 99,
      isPlaying: false,
    } as unknown as ReturnType<typeof useJSSimulationStore>);

    render(<StepExplanationBar />);
    // Should fall back to step 0 explanation safely
    expect(screen.getByText("First step fallback.")).toBeInTheDocument();
    expect(screen.getByText("Step 100")).toBeInTheDocument();
  });

  it("renders null if scenario is null or steps are empty", () => {
    vi.mocked(useJSSimulationStore).mockReturnValue({
      scenario: null,
      currentStepIndex: 0,
      isPlaying: false,
    } as unknown as ReturnType<typeof useJSSimulationStore>);

    const { container } = render(<StepExplanationBar />);
    expect(container.firstChild).toBeNull();
  });

  it("has accessible aside landmark with aria-label", () => {
    render(<StepExplanationBar />);
    const aside = screen.getByRole("complementary", { name: /step explanation/i });
    expect(aside).toBeInTheDocument();
  });
});
