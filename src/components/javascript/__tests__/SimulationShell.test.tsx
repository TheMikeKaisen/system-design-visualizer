import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, act } from "@testing-library/react";
import { SimulationShell } from "../SimulationShell";
import { useJSSimulationStore } from "@/store/useJSSimulationStore";
import { SimulationScenario } from "@/lib/js-simulator/engine";

const MOCK_SCENARIO_1: SimulationScenario = {
  id: "test-scenario-1",
  title: "Test Scenario 1",
  code: "let x = 1;\nlet y = 2;\nx = x + y;",
  steps: [
    {
      currentLine: 1,
      explanation: "Step 1: Declaration of x",
      callStack: [
        {
          id: "ctx-1",
          name: "Global",
          phase: "Execution Phase",
          variables: [{ name: "x", value: "undefined" }],
          outerEnvironment: null,
        },
      ],
    },
    {
      currentLine: 2,
      explanation: "Step 2: Declaration of y",
      callStack: [
        {
          id: "ctx-1",
          name: "Global",
          phase: "Execution Phase",
          variables: [
            { name: "x", value: "1" },
            { name: "y", value: "undefined" },
          ],
          outerEnvironment: null,
        },
      ],
      visualEffect: {
        action: "variable_search",
        target: "y",
        context: "Global Scope",
      },
    },
    {
      currentLine: 3,
      explanation: "Step 3: Assignment x = x + y",
      callStack: [
        {
          id: "ctx-1",
          name: "Global",
          phase: "Execution Phase",
          variables: [
            { name: "x", value: "3" },
            { name: "y", value: "2" },
          ],
          outerEnvironment: null,
        },
      ],
      scopeLookup: {
        status: "found",
        targetVariable: "x",
        activeContextId: "ctx-1",
        checkedContextIds: ["ctx-1"],
        traceLog: ["🔍 Searching in Global", "✅ Found x: 1"],
      },
    },
  ],
};

const MOCK_SCENARIO_2: SimulationScenario = {
  id: "test-scenario-2",
  title: "Test Scenario 2",
  code: "console.log('hello');",
  steps: [
    {
      currentLine: 1,
      explanation: "Step 1 of Scenario 2",
      callStack: [
        {
          id: "ctx-2",
          name: "Global",
          phase: "Execution Phase",
          variables: [],
          outerEnvironment: null,
        },
      ],
    },
  ],
};

describe("SimulationShell", () => {
  beforeEach(() => {
    useJSSimulationStore.getState().reset();
    useJSSimulationStore.getState().setScenario(MOCK_SCENARIO_1);
  });

  afterEach(() => {
    useJSSimulationStore.getState().reset();
  });

  it("renders single scenario title and child components", () => {
    render(
      <SimulationShell scenarios={[MOCK_SCENARIO_1]}>
        <div data-testid="child-content">Child Sandbox Panels</div>
      </SimulationShell>
    );

    expect(screen.getByText("Test Scenario 1")).toBeDefined();
    expect(screen.getByTestId("child-content")).toBeDefined();
    expect(screen.getByRole("link", { name: /Back to JS/i })).toBeDefined();
    expect(screen.getByLabelText("Restart simulation")).toBeDefined();
    expect(screen.getByLabelText("Play simulation")).toBeDefined();
  });

  it("renders dropdown and switches scenario when multiple scenarios exist", () => {
    render(
      <SimulationShell scenarios={[MOCK_SCENARIO_1, MOCK_SCENARIO_2]}>
        <div data-testid="child-content">Panels</div>
      </SimulationShell>
    );

    const dropdownTrigger = screen.getByRole("button", {
      name: /Select scenario, current: Test Scenario 1/i,
    });
    expect(dropdownTrigger).toBeDefined();

    // Open dropdown
    act(() => {
      fireEvent.click(dropdownTrigger);
    });

    // Click second scenario
    const option2 = screen.getByRole("option", { name: /Test Scenario 2/i });
    expect(option2).toBeDefined();
    act(() => {
      fireEvent.click(option2);
    });

    expect(useJSSimulationStore.getState().scenario.id).toBe("test-scenario-2");
  });

  it("advances steps, steps back, restarts, and toggles play with button controls", () => {
    render(
      <SimulationShell scenarios={[MOCK_SCENARIO_1]}>
        <div>Panels</div>
      </SimulationShell>
    );

    expect(useJSSimulationStore.getState().currentStepIndex).toBe(0);

    // Next step
    act(() => {
      fireEvent.click(screen.getByLabelText("Next Step"));
    });
    expect(useJSSimulationStore.getState().currentStepIndex).toBe(1);

    // Previous step
    act(() => {
      fireEvent.click(screen.getByLabelText("Previous Step"));
    });
    expect(useJSSimulationStore.getState().currentStepIndex).toBe(0);

    // Play / Pause toggle
    act(() => {
      fireEvent.click(screen.getByLabelText("Play simulation"));
    });
    expect(useJSSimulationStore.getState().isPlaying).toBe(true);

    act(() => {
      fireEvent.click(screen.getByLabelText("Pause simulation"));
    });
    expect(useJSSimulationStore.getState().isPlaying).toBe(false);

    // Advance and restart
    act(() => {
      fireEvent.click(screen.getByLabelText("Next Step"));
    });
    expect(useJSSimulationStore.getState().currentStepIndex).toBe(1);

    act(() => {
      fireEvent.click(screen.getByLabelText("Restart simulation"));
    });
    expect(useJSSimulationStore.getState().currentStepIndex).toBe(0);
  });

  it("supports keyboard shortcuts: Space (play/pause), ArrowRight (next), ArrowLeft (prev), R (reset)", () => {
    render(
      <SimulationShell scenarios={[MOCK_SCENARIO_1]}>
        <div>Panels</div>
      </SimulationShell>
    );

    // ArrowRight -> Next Step
    act(() => {
      fireEvent.keyDown(window, { code: "ArrowRight" });
    });
    expect(useJSSimulationStore.getState().currentStepIndex).toBe(1);

    // ArrowLeft -> Previous Step
    act(() => {
      fireEvent.keyDown(window, { code: "ArrowLeft" });
    });
    expect(useJSSimulationStore.getState().currentStepIndex).toBe(0);

    // Space -> Toggle Play
    act(() => {
      fireEvent.keyDown(window, { code: "Space" });
    });
    expect(useJSSimulationStore.getState().isPlaying).toBe(true);

    act(() => {
      fireEvent.keyDown(window, { code: "Space" });
    });
    expect(useJSSimulationStore.getState().isPlaying).toBe(false);

    // Advance to step 2 and press KeyR
    act(() => {
      useJSSimulationStore.getState().setStep(2);
    });
    expect(useJSSimulationStore.getState().currentStepIndex).toBe(2);

    act(() => {
      fireEvent.keyDown(window, { code: "KeyR", key: "r" });
    });
    expect(useJSSimulationStore.getState().currentStepIndex).toBe(0);
  });

  it("renders visualEffect and scopeLookup overlays when triggered by active step", () => {
    render(
      <SimulationShell scenarios={[MOCK_SCENARIO_1]}>
        <div>Panels</div>
      </SimulationShell>
    );

    // On Step 0, neither overlay is visible
    expect(screen.queryByText(/Looking for/i)).toBeNull();
    expect(screen.queryByText("Resolution Trace")).toBeNull();

    // Step 1: visualEffect
    act(() => {
      useJSSimulationStore.getState().setStep(1);
    });
    expect(screen.getByText(/Looking for/i)).toBeDefined();
    expect(screen.getByText("y")).toBeDefined();

    // Step 2: scopeLookup
    act(() => {
      useJSSimulationStore.getState().setStep(2);
    });
    expect(screen.getByText("Resolution Trace")).toBeDefined();
    expect(screen.getByText("✅ Found x: 1")).toBeDefined();
  });
});
