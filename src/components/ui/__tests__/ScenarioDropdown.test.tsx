import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { ScenarioDropdown } from "../ScenarioDropdown";

const MOCK_SCENARIOS = [
  { id: "scenario-1", title: "Scenario One", description: "First test scenario", badge: "6 Steps" },
  { id: "scenario-2", title: "Scenario Two", description: "Second test scenario", badge: "8 Steps" },
  { id: "scenario-3", title: "Scenario Three", description: "Third test scenario", badge: "4 Steps" },
];

describe("ScenarioDropdown", () => {
  it("renders trigger button with active scenario title", () => {
    const handleSelect = vi.fn();
    render(
      <ScenarioDropdown
        scenarios={MOCK_SCENARIOS}
        activeScenarioId="scenario-1"
        onSelect={handleSelect}
      />
    );

    expect(screen.getByRole("combobox")).toBeDefined();
    expect(screen.getByText("Scenario One")).toBeDefined();
  });

  it("opens menu on click and selects a new scenario", () => {
    const handleSelect = vi.fn();
    render(
      <ScenarioDropdown
        scenarios={MOCK_SCENARIOS}
        activeScenarioId="scenario-1"
        onSelect={handleSelect}
      />
    );

    const trigger = screen.getByRole("combobox");
    expect(trigger.getAttribute("aria-expanded")).toBe("false");

    fireEvent.click(trigger);
    expect(trigger.getAttribute("aria-expanded")).toBe("true");
    expect(screen.getByRole("listbox")).toBeDefined();
    expect(screen.getByText("Simulation Scenarios")).toBeDefined();

    const optionTwo = screen.getByText("Scenario Two");
    fireEvent.click(optionTwo);

    expect(handleSelect).toHaveBeenCalledWith(MOCK_SCENARIOS[1]);
  });

  it("closes when Escape key is pressed", () => {
    const handleSelect = vi.fn();
    render(
      <ScenarioDropdown
        scenarios={MOCK_SCENARIOS}
        activeScenarioId="scenario-1"
        onSelect={handleSelect}
      />
    );

    const trigger = screen.getByRole("combobox");
    fireEvent.click(trigger);
    expect(trigger.getAttribute("aria-expanded")).toBe("true");

    fireEvent.keyDown(trigger, { key: "Escape" });
    expect(trigger.getAttribute("aria-expanded")).toBe("false");
  });
});
