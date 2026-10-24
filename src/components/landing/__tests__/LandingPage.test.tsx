import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { LandingPage } from "../page-sections";

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

    expect(screen.getByRole("heading", { level: 1, name: /Understand systems from the inside out/i })).toBeDefined();

    const exploreLinks = screen.getAllByRole("link", { name: /Explore 33 Simulations/i });
    expect(exploreLinks.length).toBeGreaterThanOrEqual(1);

    const canvasLinks = screen.getAllByRole("link", { name: /Canvas/i });
    expect(canvasLinks.length).toBeGreaterThanOrEqual(1);
  });

  it("renders all five core disciplines with their links", () => {
    render(<LandingPage />);

    expect(screen.getAllByText("JavaScript Runtimes").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("Operating Systems").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("Java & JVM Architecture").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("Frontend Architecture").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("Backend Internals").length).toBeGreaterThanOrEqual(1);

    // Verify href targets
    const jsLinks = screen.getAllByRole("link", { name: /JavaScript Runtimes/i });
    expect(jsLinks[0].getAttribute("href")).toBe("/javascript");

    const osLinks = screen.getAllByRole("link", { name: /Operating Systems/i });
    expect(osLinks[0].getAttribute("href")).toBe("/operating-systems");

    const javaLinks = screen.getAllByRole("link", { name: /Java & JVM Architecture/i });
    expect(javaLinks[0].getAttribute("href")).toBe("/java");
  });

  it("renders platform metrics and footer", () => {
    render(<LandingPage />);

    expect(screen.getByText("33")).toBeDefined();
    expect(screen.getByText("Interactive Episodes")).toBeDefined();
    expect(screen.getByText("Core Disciplines")).toBeDefined();
    expect(screen.getByText("100%")).toBeDefined();
    expect(screen.getByText("Deterministic Models")).toBeDefined();

    expect(screen.getByText(/Built for deep engineering learning/i)).toBeDefined();
  });
});
