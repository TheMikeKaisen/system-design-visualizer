import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { DisciplineCard, DISCIPLINES } from "../DisciplineCard";

describe("DisciplineCard", () => {
  it("renders discipline card with title, badge, description, topics, and cta", () => {
    const jsDiscipline = DISCIPLINES[0];
    render(<DisciplineCard discipline={jsDiscipline} />);

    expect(screen.getByText("JavaScript")).toBeDefined();
    expect(screen.getByText("Runtime Engine")).toBeDefined();
    expect(screen.getByText(/Follow the call stack/i)).toBeDefined();
    expect(screen.getByText("Call Stack")).toBeDefined();
    expect(screen.getByText("Scope Chains")).toBeDefined();
    expect(screen.getByText("Closures")).toBeDefined();
    expect(screen.getByText("Event Loop")).toBeDefined();
    expect(screen.getByText("Explore JavaScript")).toBeDefined();

    const link = screen.getByRole("link");
    expect(link.getAttribute("href")).toBe("/javascript");
  });

  it("renders all core disciplines correctly", () => {
    const { container } = render(
      <div>
        {DISCIPLINES.map((d) => (
          <DisciplineCard key={d.id} discipline={d} />
        ))}
      </div>
    );

    expect(screen.getByText("JavaScript")).toBeDefined();
    expect(screen.getByText("Operating Systems")).toBeDefined();
    expect(screen.getByText("Computer Networks")).toBeDefined();
    expect(screen.getByText("Java & JVM Architecture")).toBeDefined();
    expect(screen.getByText("Frontend Architecture")).toBeDefined();
    expect(screen.getByText("Backend Internals")).toBeDefined();

    const links = container.querySelectorAll("a");
    expect(links.length).toBe(6);
  });
});
