import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { LandingPage } from "../page-sections";

// Mock child visualizers so their internal timers do not interfere with page tests
vi.mock("../HeroRuntimeSandbox", () => ({
  HeroRuntimeSandbox: () => <div data-testid="mock-hero-runtime-sandbox">Mock Sandbox</div>,
}));

vi.mock("../MiniDistributedCanvas", () => ({
  MiniDistributedCanvas: () => <div data-testid="mock-mini-distributed-canvas">Mock Canvas</div>,
}));

// Mock intersection observer for jsdom
class MockIntersectionObserver {
  observe = vi.fn();
  unobserve = vi.fn();
  disconnect = vi.fn();
}

beforeEach(() => {
  window.IntersectionObserver = MockIntersectionObserver as unknown as typeof IntersectionObserver;
});

describe("LandingPage", () => {
  it("renders main navigation with System Simulator branding", () => {
    render(<LandingPage />);

    expect(screen.getByRole("navigation", { name: /Main navigation/i })).toBeDefined();
    const brandElements = screen.getAllByText("System Simulator");
    expect(brandElements.length).toBeGreaterThanOrEqual(1);
  });

  it("renders hero headline and key call to action links", () => {
    render(<LandingPage />);

    expect(
      screen.getByRole("heading", {
        level: 1,
        name: /Don't just use software\. Understand how it works\./i,
      })
    ).toBeDefined();

    const exploreLinks = screen.getAllByRole("link", { name: /Explore Learning Paths/i });
    expect(exploreLinks.length).toBeGreaterThanOrEqual(1);

    const canvasLinks = screen.getAllByRole("link", { name: /Open Canvas Studio/i });
    expect(canvasLinks.length).toBeGreaterThanOrEqual(1);
  });

  it("renders dedicated interactive sandbox stage with heading and visualizer", () => {
    render(<LandingPage />);

    expect(
      screen.getByRole("heading", {
        level: 2,
        name: /See what happens beneath the surface\./i,
      })
    ).toBeDefined();

    expect(
      screen.getByText(
        /Explore how code executes, memory is allocated, processes are scheduled, and systems communicate\./i
      )
    ).toBeDefined();

    expect(screen.getByTestId("mock-hero-runtime-sandbox")).toBeDefined();
  });

  it("renders all five core disciplines with their links", () => {
    render(<LandingPage />);

    expect(screen.getByRole("heading", { name: /Go beyond the abstractions\./i })).toBeDefined();

    expect(screen.getAllByText("JavaScript").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("Operating Systems").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("Java & JVM Architecture").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("Frontend Architecture").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("Backend Internals").length).toBeGreaterThanOrEqual(1);

    // Verify explicit CTA text inside the cards
    expect(screen.getByText("Explore JavaScript")).toBeDefined();
    expect(screen.getByText("Explore Operating Systems")).toBeDefined();
    expect(screen.getByText("Explore Java & JVM")).toBeDefined();
    expect(screen.getByText("Explore Frontend Systems")).toBeDefined();
    expect(screen.getByText("Explore Backend Systems")).toBeDefined();

    // Verify card navigation links exist
    expect(screen.getAllByRole("link", { name: /JavaScript/i }).length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByRole("link", { name: /Operating Systems/i }).length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByRole("link", { name: /Java & JVM Architecture/i }).length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByRole("link", { name: /Frontend Architecture/i }).length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByRole("link", { name: /Backend Internals/i }).length).toBeGreaterThanOrEqual(1);
  });

  it("renders simulation mechanics, canvas studio, and final CTA sections", () => {
    render(<LandingPage />);

    expect(screen.getByRole("heading", { name: /Every step has a reason\./i })).toBeDefined();
    expect(screen.getByText("Explicit state transitions")).toBeDefined();
    expect(screen.getByText("Inspectable internals")).toBeDefined();
    expect(screen.getByText("Deterministic execution")).toBeDefined();
    expect(screen.getByText("Transparent models")).toBeDefined();

    expect(screen.getByRole("heading", { name: /From a single function to a distributed system\./i })).toBeDefined();
    expect(screen.getByRole("link", { name: /Build a System/i })).toBeDefined();

    expect(
      screen.getByRole("heading", {
        name: /Curiosity is the starting point\. Understanding is the goal\./i,
      })
    ).toBeDefined();
    expect(screen.getAllByRole("link", { name: /Browse All Modules/i }).length).toBeGreaterThanOrEqual(1);

    expect(screen.getByText(/Built for deep engineering learning/i)).toBeDefined();
  });
});
