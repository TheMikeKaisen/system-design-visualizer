import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { MobileTabbedPanels } from "../MobileTabbedPanels";
import { CallStackPanel } from "../CallStackPanel";
import { ExecutionContextPanel } from "../ExecutionContextPanel";
import { ConsolePanel } from "../ConsolePanel";
import { WebAPIsPanel } from "../WebAPIsPanel";
import { MicrotaskQueuePanel } from "../MicrotaskQueuePanel";
import { CallbackQueuePanel } from "../CallbackQueuePanel";
import { EventLoopIndicator } from "../EventLoopIndicator";
import { TaskQueuePanel } from "../TaskQueuePanel";
import { EventLoopMobilePanels } from "../EventLoopMobilePanels";
import { CodePanel } from "../CodePanel";
import { StepExplanationBar } from "../StepExplanationBar";
import { JSSimulationProvider } from "@/context/JSSimulationContext";
import { useJSSimulationStore } from "@/store/useJSSimulationStore";

vi.mock("@/store/useJSSimulationStore");

describe("Defensive Panels & Crash Prevention", () => {
  beforeEach(() => {
    vi.mocked(useJSSimulationStore).mockReturnValue({
      scenario: {
        id: "test-scenario",
        title: "Test Scenario",
        code: "const a = 1;",
        steps: [
          {
            currentLine: 1,
            explanation: "Step 1",
            callStack: [
              {
                id: "global",
                name: "Global Execution Context",
                phase: "Execution Phase",
                variables: [{ name: "a", value: "1" }],
              },
            ],
            consoleOutput: ["Hello World"],
            webAPIs: [{ id: "timer-1", type: "timer", label: "setTimeout", delay: "1000ms", callback: "() => {}", status: "running" }],
            microtaskQueue: [{ id: "m-1", label: "Promise.then", callback: "() => {}", source: "Promise" }],
            callbackQueue: [{ id: "c-1", label: "setTimeout", callback: "() => {}", source: "setTimeout" }],
            eventLoop: { phase: "idle", message: "Event Loop is idle" },
            taskQueue: [{ id: "t-1", name: "setTimeout", timeout: "1000ms", callback: "() => {}" }],
          },
        ],
      },
      currentStepIndex: 0,
      isPlaying: false,
    } as unknown as ReturnType<typeof useJSSimulationStore>);
  });

  it("handles out-of-bounds step index without crashing across panels", () => {
    vi.mocked(useJSSimulationStore).mockReturnValue({
      scenario: {
        id: "test-scenario",
        title: "Test Scenario",
        code: "const a = 1;",
        steps: [
          {
            currentLine: 1,
            explanation: "Only step",
            callStack: [
              {
                id: "global",
                name: "Global Execution Context",
                phase: "Execution Phase",
                variables: [{ name: "a", value: "1" }],
              },
            ],
          },
        ],
      },
      currentStepIndex: 99,
      isPlaying: false,
    } as unknown as ReturnType<typeof useJSSimulationStore>);

    expect(() => render(<CallStackPanel />)).not.toThrow();
    expect(() => render(<ExecutionContextPanel />)).not.toThrow();
    expect(() => render(<ConsolePanel />)).not.toThrow();
    expect(() => render(<WebAPIsPanel />)).not.toThrow();
    expect(() => render(<MicrotaskQueuePanel />)).not.toThrow();
    expect(() => render(<CallbackQueuePanel />)).not.toThrow();
    expect(() => render(<EventLoopIndicator />)).not.toThrow();
    expect(() => render(<TaskQueuePanel />)).not.toThrow();
    expect(() => render(<MobileTabbedPanels />)).not.toThrow();
    expect(() => render(<EventLoopMobilePanels />)).not.toThrow();
    expect(() => render(<CodePanel />)).not.toThrow();
    expect(() => render(<StepExplanationBar />)).not.toThrow();
  });

  it("handles empty steps gracefully without throwing", () => {
    vi.mocked(useJSSimulationStore).mockReturnValue({
      scenario: {
        id: "empty-scenario",
        title: "Empty Scenario",
        code: "",
        steps: [],
      },
      currentStepIndex: 0,
      isPlaying: false,
    } as unknown as ReturnType<typeof useJSSimulationStore>);

    const { container: c1 } = render(<CallStackPanel />);
    expect(c1.firstChild).toBeNull();

    const { container: c2 } = render(<ExecutionContextPanel />);
    expect(c2.firstChild).toBeNull();

    const { container: c3 } = render(<MobileTabbedPanels />);
    expect(c3.firstChild).toBeNull();

    const { container: c4 } = render(<CodePanel />);
    expect(c4.firstChild).toBeNull();

    const { container: c5 } = render(<StepExplanationBar />);
    expect(c5.firstChild).toBeNull();
  });

  it("MobileTabbedPanels gracefully switches from queue tab when hasTaskQueue is false using derived state", () => {
    // Scenario without taskQueue
    vi.mocked(useJSSimulationStore).mockReturnValue({
      scenario: {
        id: "no-queue-scenario",
        title: "No Queue",
        code: "const x = 5;",
        steps: [
          {
            currentLine: 1,
            explanation: "No queue step",
            callStack: [],
            // taskQueue is undefined
          },
        ],
      },
      currentStepIndex: 0,
      isPlaying: false,
    } as unknown as ReturnType<typeof useJSSimulationStore>);

    render(<MobileTabbedPanels />);
    // Call Stack tab button is present
    expect(screen.getByRole("button", { name: /call stack/i })).toBeInTheDocument();
    // Queue tab button should not be present
    expect(screen.queryByRole("button", { name: /queue/i })).not.toBeInTheDocument();
  });

  it("allows JSSimulationProvider to override store state immediately without 1-frame flash", () => {
    // Store has Hoisting scenario
    vi.mocked(useJSSimulationStore).mockReturnValue({
      scenario: {
        id: "hoisting-var",
        title: "Variable Hoisting",
        code: "console.log(a); var a = 10;",
        steps: [
          {
            currentLine: 1,
            explanation: "Hoisting step",
            callStack: [],
          },
        ],
      },
      currentStepIndex: 0,
      isPlaying: false,
    } as unknown as ReturnType<typeof useJSSimulationStore>);

    // Page provides Call Stack scenario override
    const callStackScenario = {
      id: "greet-context",
      title: "Call Stack Simulator",
      code: "function greet() { return 'hello'; }",
      steps: [
        {
          currentLine: 1,
          explanation: "Call stack step 1",
          callStack: [
            {
              id: "global",
              name: "Global Execution Context",
              phase: "Execution Phase" as const,
              variables: [],
              outerEnvironment: null,
            },
          ],
        },
      ],
    };

    render(
      <JSSimulationProvider scenario={callStackScenario} currentStepIndex={0}>
        <CodePanel />
        <StepExplanationBar />
        <CallStackPanel />
      </JSSimulationProvider>
    );

    // CodePanel and StepExplanationBar render Call Stack, NOT Hoisting
    expect(screen.getByText("Call stack step 1")).toBeInTheDocument();
    expect(screen.queryByText("Hoisting step")).not.toBeInTheDocument();
  });
});
