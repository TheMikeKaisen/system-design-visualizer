import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { Logo } from "../Logo";

describe("Logo Component", () => {
  it("renders with default size 28 and proper SVG structure", () => {
    const { container } = render(<Logo />);
    const svg = container.querySelector("svg");
    expect(svg).toBeDefined();
    expect(svg?.getAttribute("width")).toBe("28");
    expect(svg?.getAttribute("height")).toBe("28");
    expect(svg?.getAttribute("viewBox")).toBe("0 0 32 32");
    expect(svg?.getAttribute("aria-hidden")).toBe("true");
  });

  it("applies custom size and className props", () => {
    const { container } = render(<Logo size={48} className="custom-logo-class" />);
    const svg = container.querySelector("svg");
    expect(svg?.getAttribute("width")).toBe("48");
    expect(svg?.getAttribute("height")).toBe("48");
    expect(svg?.classList.contains("custom-logo-class")).toBe(true);
  });

  it("contains the amber execution core elements", () => {
    const { container } = render(<Logo />);
    const polygon = container.querySelector("polygon");
    const circle = container.querySelector("circle");
    
    expect(polygon).toBeDefined();
    expect(polygon?.getAttribute("points")).toBe("16,6.25 21,9.5 16,12.75 11,9.5");
    expect(circle).toBeDefined();
    expect(circle?.getAttribute("cx")).toBe("16");
    expect(circle?.getAttribute("cy")).toBe("9.5");
  });
});
