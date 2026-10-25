import React from "react";
import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { QueuePanel } from "../QueuePanel";
import { useActiveSimulation } from "@/context/JSSimulationContext";

vi.mock("@/context/JSSimulationContext");

describe("QueuePanel Component", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders microtask queue variant with priority badge and items", () => {
    vi.mocked(useActiveSimulation).mockReturnValue({
      scenario: {
        id: "test-event-loop",
        title: "Test Event Loop",
        code: "Promise.resolve().then(() => {});",
        steps: [
          {
            currentLine: 1,
            explanation: "Promise callback queued",
            callStack: [],
            microtaskQueue: [
              { id: "m-1", label: "Promise.then", callback: "() => {}", source: "Promise" },
            ],
            callbackQueue: [],
            eventLoop: { phase: "checking_microtasks", message: "Checking microtasks" },
          },
        ],
      },
      currentStepIndex: 0,
      isPlaying: false,
    } as unknown as ReturnType<typeof useActiveSimulation>);

    const { container } = render(<QueuePanel variant="microtask" />);

    expect(screen.getByText("Microtask Queue")).toBeInTheDocument();
    expect(screen.getByText("⚡ Higher Priority")).toBeInTheDocument();
    expect(screen.getByText("Promise.then")).toBeInTheDocument();
    expect(screen.getByText("() => {}")).toBeInTheDocument();
    expect(screen.getByText("from Promise")).toBeInTheDocument();

    // Check active ring styling for microtasks
    expect(container.firstChild).toHaveClass("border-fuchsia-500");
  });

  it("renders callback queue variant with macrotask subtitle and items", () => {
    vi.mocked(useActiveSimulation).mockReturnValue({
      scenario: {
        id: "test-event-loop",
        title: "Test Event Loop",
        code: "setTimeout(() => {}, 0);",
        steps: [
          {
            currentLine: 1,
            explanation: "Timeout callback queued",
            callStack: [],
            microtaskQueue: [],
            callbackQueue: [
              { id: "c-1", label: "setTimeout()", callback: "console.log('Done')", source: "setTimeout" },
            ],
            eventLoop: { phase: "checking_callbacks", message: "Checking callback queue" },
          },
        ],
      },
      currentStepIndex: 0,
      isPlaying: false,
    } as unknown as ReturnType<typeof useActiveSimulation>);

    const { container } = render(<QueuePanel variant="callback" />);

    expect(screen.getByText(/Callback Queue/)).toBeInTheDocument();
    expect(screen.getByText("(Macrotasks)")).toBeInTheDocument();
    expect(screen.getByText("setTimeout()")).toBeInTheDocument();
    expect(screen.getByText("console.log('Done')")).toBeInTheDocument();
    expect(screen.getByText("from setTimeout")).toBeInTheDocument();

    // Check active ring styling for callback queue
    expect(container.firstChild).toHaveClass("border-amber-500");
  });

  it("renders empty queue message when no items are present", () => {
    vi.mocked(useActiveSimulation).mockReturnValue({
      scenario: {
        id: "test-empty",
        title: "Empty Queue",
        code: "let a = 1;",
        steps: [
          {
            currentLine: 1,
            explanation: "Idle",
            callStack: [],
            microtaskQueue: [],
            callbackQueue: [],
            eventLoop: { phase: "idle", message: "Idle" },
          },
        ],
      },
      currentStepIndex: 0,
      isPlaying: false,
    } as unknown as ReturnType<typeof useActiveSimulation>);

    render(<QueuePanel variant="microtask" />);
    expect(screen.getByText("Queue is empty")).toBeInTheDocument();
  });
});
