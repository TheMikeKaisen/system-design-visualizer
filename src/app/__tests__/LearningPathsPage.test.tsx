import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import LearningPathsPage from "../learning-paths/page";

describe("LearningPathsPage", () => {
  it("renders System Simulator branding and learning tracks heading", () => {
    render(<LearningPathsPage />);

    expect(screen.getByText("System Simulator")).toBeDefined();
    expect(screen.getByRole("heading", { level: 1, name: /Master Systems from the Inside Out/i })).toBeDefined();
  });

  it("renders all five core disciplines using unified DisciplineCard and Canvas Studio", () => {
    render(<LearningPathsPage />);

    // 5 Core Disciplines
    expect(screen.getByText("JavaScript")).toBeDefined();
    expect(screen.getByText("Operating Systems")).toBeDefined();
    expect(screen.getByText("Java & JVM Architecture")).toBeDefined();
    expect(screen.getByText("Frontend Architecture")).toBeDefined();
    expect(screen.getByText("Backend Internals")).toBeDefined();

    // Verify explicit card action CTAs
    expect(screen.getByText("Explore JavaScript")).toBeDefined();
    expect(screen.getByText("Explore Operating Systems")).toBeDefined();
    expect(screen.getByText("Explore Java & JVM")).toBeDefined();
    expect(screen.getByText("Explore Frontend Systems")).toBeDefined();
    expect(screen.getByText("Explore Backend Systems")).toBeDefined();

    // 6th Card: Canvas Studio
    expect(screen.getByText("Canvas Studio")).toBeDefined();
    expect(screen.getByText("Launch Canvas Studio")).toBeDefined();
  });
});
