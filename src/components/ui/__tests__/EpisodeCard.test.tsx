import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { EpisodeCard, type EpisodeMetadata } from "../EpisodeCard";

describe("EpisodeCard Component", () => {
  const mockEpisode: EpisodeMetadata = {
    id: "test-ep",
    episodeNumber: 1,
    title: "Execution Contexts & Call Stack",
    description: "Watch how JavaScript executes code in real-time.",
    date: "13 July 2026",
    href: "/javascript/simulator/call-stack",
    icon: <span data-testid="test-icon">ICON</span>,
  };

  it("renders episode card with title, description, date, and episode number", () => {
    render(<EpisodeCard episode={mockEpisode} />);

    expect(screen.getByText("Execution Contexts & Call Stack")).toBeInTheDocument();
    expect(screen.getByText("Watch how JavaScript executes code in real-time.")).toBeInTheDocument();
    expect(screen.getByText("13 July 2026")).toBeInTheDocument();
    // Episode number appears in both desktop and mobile layouts
    const episodeBadges = screen.getAllByText("Episode 1");
    expect(episodeBadges.length).toBeGreaterThanOrEqual(1);
    expect(screen.getByTestId("test-icon")).toBeInTheDocument();
  });

  it("links to the correct href and sets accessible aria-label", () => {
    render(<EpisodeCard episode={mockEpisode} />);

    const link = screen.getByRole("link", { name: "Episode 1: Execution Contexts & Call Stack" });
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute("href", "/javascript/simulator/call-stack");
  });

  it("applies default amber accent classes when no accent is passed", () => {
    const { container } = render(<EpisodeCard episode={mockEpisode} />);

    const card = container.querySelector(".border-border");
    expect(card?.className).toContain("hover:border-[#F7DF1E]/50");
    expect(card?.className).toContain("hover:shadow-[0_0_30px_-5px_rgba(247,223,30,0.2)]");

    const title = screen.getByText("Execution Contexts & Call Stack");
    expect(title.className).toContain("group-hover:text-amber-500");

    const launchBtn = screen.getByText(/Launch/);
    expect(launchBtn.className).toContain("text-amber-500");
    expect(launchBtn.className).toContain("bg-amber-500/10");
  });

  it("applies accent preset classes for teal, blue, green, pink, cyan, and orange", () => {
    const { rerender, container } = render(
      <EpisodeCard episode={{ ...mockEpisode, accent: "teal" }} />
    );

    let card = container.querySelector(".border-border");
    expect(card?.className).toContain("hover:border-teal-500/50");
    expect(card?.className).toContain("hover:shadow-[0_0_30px_-5px_rgba(6,182,212,0.2)]");

    rerender(<EpisodeCard episode={{ ...mockEpisode, accent: "blue" }} />);
    card = container.querySelector(".border-border");
    expect(card?.className).toContain("hover:border-blue-500/50");

    rerender(<EpisodeCard episode={{ ...mockEpisode, accent: "pink" }} />);
    card = container.querySelector(".border-border");
    expect(card?.className).toContain("hover:border-pink-500/50");

    rerender(<EpisodeCard episode={{ ...mockEpisode, accent: "green" }} />);
    card = container.querySelector(".border-border");
    expect(card?.className).toContain("hover:border-green-500/50");

    rerender(<EpisodeCard episode={{ ...mockEpisode, accent: "cyan" }} />);
    card = container.querySelector(".border-border");
    expect(card?.className).toContain("hover:border-cyan-500/50");
    expect(card?.className).toContain("hover:shadow-[0_0_30px_-5px_rgba(6,182,212,0.2)]");

    rerender(<EpisodeCard episode={{ ...mockEpisode, accent: "orange" }} />);
    card = container.querySelector(".border-border");
    expect(card?.className).toContain("hover:border-orange-500/50");
    expect(card?.className).toContain("hover:shadow-[0_0_30px_-5px_rgba(249,115,22,0.2)]");
  });

  it("renders optional badge when provided", () => {
    render(
      <EpisodeCard episode={{ ...mockEpisode, badge: "Interactive" }} />
    );

    const badges = screen.getAllByText("Interactive");
    expect(badges.length).toBeGreaterThanOrEqual(1);
  });

  it("supports passing data directly as flat props instead of episode object", () => {
    render(
      <EpisodeCard
        episodeNumber={2}
        title="Direct Props Title"
        description="Direct props description"
        date="14 July 2026"
        href="/direct-props"
        icon={<span>ICON</span>}
        accent="purple"
      />
    );

    expect(screen.getByText("Direct Props Title")).toBeInTheDocument();
    expect(screen.getByText("Direct props description")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Episode 2: Direct Props Title" })).toHaveAttribute(
      "href",
      "/direct-props"
    );
  });

  it("handles string numeric episodeNumber and prefixes with Episode", () => {
    render(
      <EpisodeCard
        episode={{
          ...mockEpisode,
          episodeNumber: "5",
          title: "String Numeric Ep",
        }}
      />
    );

    const badges = screen.getAllByText("Episode 5");
    expect(badges.length).toBeGreaterThanOrEqual(1);
    expect(screen.getByRole("link", { name: "Episode 5: String Numeric Ep" })).toBeInTheDocument();
  });

  it("handles already-prefixed string episodeNumber without duplicating prefix", () => {
    render(
      <EpisodeCard
        episode={{
          ...mockEpisode,
          episodeNumber: "Episode 6",
          title: "Pre-prefixed Ep",
        }}
      />
    );

    const badges = screen.getAllByText("Episode 6");
    expect(badges.length).toBeGreaterThanOrEqual(1);
    expect(screen.getByRole("link", { name: "Episode 6: Pre-prefixed Ep" })).toBeInTheDocument();
  });

  it("renders custom launchLabel when provided", () => {
    render(
      <EpisodeCard
        episode={{
          ...mockEpisode,
          launchLabel: "Explore Simulator",
        }}
      />
    );

    expect(screen.getByText(/Explore Simulator/)).toBeInTheDocument();
  });

  it("constructs accessible aria-label without trailing colon when episodeNumber or title is missing", () => {
    const { rerender } = render(
      <EpisodeCard
        title="No Episode Number"
        description="Description"
        href="/test"
        icon={<span>ICON</span>}
      />
    );

    expect(screen.getByRole("link", { name: "No Episode Number" })).toBeInTheDocument();

    rerender(
      <EpisodeCard
        episodeNumber={7}
        title=""
        description="Description"
        href="/test"
        icon={<span>ICON</span>}
      />
    );

    expect(screen.getByRole("link", { name: "Episode 7" })).toBeInTheDocument();
  });
});
