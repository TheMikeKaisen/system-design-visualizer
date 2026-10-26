import React from "react";
import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { ExecutionContextPanel } from "../ExecutionContextPanel";
import { useActiveSimulation } from "@/context/JSSimulationContext";

vi.mock("@/context/JSSimulationContext");

describe("ExecutionContextPanel Component", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders empty state when call stack is empty", () => {
    vi.mocked(useActiveSimulation).mockReturnValue({
      scenario: {
        id: "empty-test",
        title: "Empty Test",
        code: "",
        steps: [
          {
            currentLine: null,
            explanation: "Call stack empty",
            callStack: [],
          },
        ],
      },
      currentStepIndex: 0,
      isPlaying: false,
    } as unknown as ReturnType<typeof useActiveSimulation>);

    render(<ExecutionContextPanel />);
    expect(screen.getByText("No active execution context.")).toBeInTheDocument();
  });

  it("renders global execution context and variable records", () => {
    vi.mocked(useActiveSimulation).mockReturnValue({
      scenario: {
        id: "global-test",
        title: "Global Test",
        code: "var x = 10;",
        steps: [
          {
            currentLine: 1,
            explanation: "x assigned to 10",
            callStack: [
              {
                id: "global",
                name: "Global Execution Context",
                phase: "Execution Phase",
                variables: [{ name: "x", value: "10" }],
                outerEnvironment: null,
              },
            ],
          },
        ],
      },
      currentStepIndex: 0,
      isPlaying: false,
    } as unknown as ReturnType<typeof useActiveSimulation>);

    render(<ExecutionContextPanel />);
    expect(screen.getByText("Global Execution Context")).toBeInTheDocument();
    expect(screen.getByText("x")).toBeInTheDocument();
    expect(screen.getByText("10")).toBeInTheDocument();
  });

  it("renders closure memory with explicit lexical parent scope badge and preserved heap link", () => {
    vi.mocked(useActiveSimulation).mockReturnValue({
      scenario: {
        id: "closure-test",
        title: "Closure Test",
        code: "function outer() { let a = 1; return () => a; }",
        steps: [
          {
            currentLine: 1,
            explanation: "Closure created in heap",
            callStack: [
              {
                id: "closure_outer_1",
                name: "Closure (outer)",
                phase: "Execution Phase",
                variables: [{ name: "a", value: "1" }],
                outerEnvironment: "Global Execution Context",
                isClosure: true,
              },
              {
                id: "global",
                name: "Global Execution Context",
                phase: "Execution Phase",
                variables: [{ name: "outer", value: "Function Object" }],
                outerEnvironment: null,
              },
            ],
          },
        ],
      },
      currentStepIndex: 0,
      isPlaying: false,
    } as unknown as ReturnType<typeof useActiveSimulation>);

    render(<ExecutionContextPanel />);

    // Assert closure context name
    expect(screen.getByText("Closure (outer)")).toBeInTheDocument();

    // Assert header badges
    expect(screen.getByText("Closure Memory")).toBeInTheDocument();
    expect(screen.getByText("Lexical Parent ➔ Global Execution Context")).toBeInTheDocument();

    // Assert internal retained lexical scope section
    expect(screen.getByText("Retained Lexical Scope")).toBeInTheDocument();
    expect(screen.getByText("Preserved in Heap")).toBeInTheDocument();
    expect(screen.getAllByText("Global Execution Context").length).toBeGreaterThanOrEqual(1);

    // Assert closure variable
    expect(screen.getByText("a")).toBeInTheDocument();
    expect(screen.getByText("1")).toBeInTheDocument();
  });

  it("renders nested block scope inside parent execution context", () => {
    vi.mocked(useActiveSimulation).mockReturnValue({
      scenario: {
        id: "block-test",
        title: "Block Scope Test",
        code: "if (true) { let b = 2; }",
        steps: [
          {
            currentLine: 1,
            explanation: "Entering block",
            callStack: [
              {
                id: "block_1",
                name: "Block Scope",
                phase: "Execution Phase",
                variables: [{ name: "b", value: "2" }],
                outerEnvironment: "Global Execution Context",
                isBlockScope: true,
              },
              {
                id: "global",
                name: "Global Execution Context",
                phase: "Execution Phase",
                variables: [],
                outerEnvironment: null,
              },
            ],
          },
        ],
      },
      currentStepIndex: 0,
      isPlaying: false,
    } as unknown as ReturnType<typeof useActiveSimulation>);

    render(<ExecutionContextPanel />);

    expect(screen.getByText("Block Scope")).toBeInTheDocument();
    expect(screen.getAllByText("Global Execution Context").length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText("b")).toBeInTheDocument();
    expect(screen.getByText("2")).toBeInTheDocument();
  });
});
