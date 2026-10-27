import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { Cpu, Terminal } from "lucide-react";
import { EditorialDisciplineCard } from "../EditorialDisciplineCard";

describe("EditorialDisciplineCard", () => {
  it("renders a distilled card correctly with topics and metadata", () => {
    render(
      <EditorialDisciplineCard
        id="test-card"
        title="Test Discipline"
        eyebrow="Category // Subcategory"
        badge="5 Episodes"
        description="A concise test description of this discipline."
        topics={["Topic Alpha", "Topic Beta"]}
        icon={Cpu}
        accentColor="#0ea5e9"
        accentBg="bg-sky-500/10"
        accentBorder="border-sky-500/50"
        accentText="text-sky-500"
        ctaText="Explore Discipline"
        href="/test-path"
      />
    );

    expect(screen.getByText("Test Discipline")).toBeDefined();
    expect(screen.getByText("Category // Subcategory")).toBeDefined();
    expect(screen.getByText("5 Episodes")).toBeDefined();
    expect(screen.getByText("A concise test description of this discipline.")).toBeDefined();
    expect(screen.getByText("Topic Alpha")).toBeDefined();
    expect(screen.getByText("Topic Beta")).toBeDefined();
    expect(screen.getByText("Explore Discipline")).toBeDefined();

    const link = screen.getByRole("link");
    expect(link.getAttribute("href")).toBe("/test-path");
  });

  it("renders runtime card with terminal icon and accessible link", () => {
    render(
      <EditorialDisciplineCard
        id="runtime-card"
        title="JavaScript Engine"
        eyebrow="Runtime // V8"
        badge="7 Episodes"
        description="Execute code one discrete step at a time."
        topics={["Call Stack", "Event Loop"]}
        icon={Terminal}
        accentColor="#f59e0b"
        accentBg="bg-amber-500/10"
        accentBorder="border-amber-500/50"
        accentText="text-amber-500"
        ctaText="Explore Runtime"
        href="/javascript"
      />
    );

    expect(screen.getByText("JavaScript Engine")).toBeDefined();
    expect(screen.getByText("Call Stack")).toBeDefined();
    expect(screen.getByText("Event Loop")).toBeDefined();
    expect(screen.getByRole("link").getAttribute("href")).toBe("/javascript");
  });
});
