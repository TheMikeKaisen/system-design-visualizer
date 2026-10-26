import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { AppNavbar } from "../AppNavbar";

describe("AppNavbar", () => {
  it("renders brand logo and canonical System Simulator identity", () => {
    render(<AppNavbar />);

    expect(screen.getByRole("navigation", { name: /Main navigation/i })).toBeDefined();
    expect(screen.getByLabelText("System Simulator home")).toHaveAttribute("href", "/");
    expect(screen.getByText("System Simulator")).toBeDefined();
  });

  it("renders default Canvas Studio CTA button", () => {
    render(<AppNavbar />);

    const canvasLink = screen.getByRole("link", { name: /Canvas Studio/i });
    expect(canvasLink).toHaveAttribute("href", "/canvas");
  });

  it("can hide Canvas Studio CTA when showCanvasCta is false", () => {
    render(<AppNavbar showCanvasCta={false} />);

    expect(screen.queryByRole("link", { name: /Canvas Studio/i })).toBeNull();
  });

  // it("renders optional back breadcrumb link", () => {
  //   render(
  //     <AppNavbar />
  //   );

  //   const backLink = screen.getByRole("link", { name: /All Tracks/i });
  //   expect(backLink).toHaveAttribute("href", "/learning-paths");
  // });

  it("renders optional center navigation content", () => {
    render(
      <AppNavbar
        centerContent={<span data-testid="custom-nav-links">Custom Links</span>}
      />
    );

    expect(screen.getByTestId("custom-nav-links")).toBeDefined();
  });
});
