import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import LearningPathsPage from "../learning-paths/page";

describe("LearningPathsPage", () => {
  it("renders System Simulator branding and refined editorial heading", () => {
    render(<LearningPathsPage />);

    expect(screen.getByText("System Simulator")).toBeDefined();
    expect(
      screen.getByRole("heading", { level: 1, name: /Understand systems\.\s+From the inside out\./i })
    ).toBeDefined();

    // Verify Back to Home link exists and points to root
    const backToHome = screen.getByRole("link", { name: /Back to Home/i });
    expect(backToHome).toBeDefined();
    expect(backToHome.getAttribute("href")).toBe("/");
  });

  it("renders the three computational strata and Distributed Systems Studio", () => {
    render(<LearningPathsPage />);

    // Conceptual Strata Section Headings
    expect(screen.getByRole("heading", { level: 2, name: /Foundations/i })).toBeDefined();
    expect(screen.getByRole("heading", { level: 2, name: /Runtimes/i })).toBeDefined();
    expect(screen.getByRole("heading", { level: 2, name: /Application Architecture/i })).toBeDefined();
    expect(screen.getByRole("heading", { level: 2, name: /Distributed Systems Studio/i })).toBeDefined();
  });

  it("renders all six core disciplines with verified links and distilled metadata", () => {
    render(<LearningPathsPage />);

    // 6 Core Disciplines
    expect(screen.getByText("Operating Systems")).toBeDefined();
    expect(screen.getByText("Computer Networks")).toBeDefined();
    expect(screen.getByText("JavaScript")).toBeDefined();
    expect(screen.getByText("Java & JVM Architecture")).toBeDefined();
    expect(screen.getByText("Frontend Architecture")).toBeDefined();
    expect(screen.getByText("Backend Internals")).toBeDefined();

    // Verify verified episode badges are displayed
    expect(screen.getAllByText(/Episode/i).length).toBeGreaterThanOrEqual(6);

    // Verify CTAs
    expect(screen.getByText("Explore Operating Systems")).toBeDefined();
    expect(screen.getByText("Explore Computer Networks")).toBeDefined();
    expect(screen.getByText("Explore JavaScript Runtime")).toBeDefined();
    expect(screen.getByText("Explore Java & JVM")).toBeDefined();
    expect(screen.getByText("Explore Frontend Architecture")).toBeDefined();
    expect(screen.getByText("Explore Backend Internals")).toBeDefined();

    // Studio action
    expect(screen.getAllByText("Canvas Studio").length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText("Launch Canvas Studio")).toBeDefined();
  });

  it("maintains streamlined card layout without bloated preview widgets, nested buttons, or eyebrows", () => {
    const { container } = render(<LearningPathsPage />);

    // Confirms no nested interactive buttons inside cards
    const buttonsInsideLinks = container.querySelectorAll("a button");
    expect(buttonsInsideLinks.length).toBe(0);

    // Confirms no card eyebrows or header kicker eyebrows render
    expect(screen.queryByText("Foundations // Kernel Architecture")).toBeNull();
    expect(screen.queryByText("Foundations // Network Substrate")).toBeNull();
    expect(screen.queryByText("Runtime // V8 Engine")).toBeNull();
    expect(screen.queryByText("LEARNING PATHS")).toBeNull();

    // Confirms clean topic tags render
    expect(screen.getByText("CPU Scheduling")).toBeDefined();
    expect(screen.getByText("Socket 4-Tuples")).toBeDefined();
    expect(screen.getByText("Call Stack")).toBeDefined();
    expect(screen.getByText("Bytecode Execution")).toBeDefined();
    expect(screen.getByText("Virtual DOM Diffing")).toBeDefined();
    expect(screen.getByText("Node.js Architecture")).toBeDefined();
  });
});
