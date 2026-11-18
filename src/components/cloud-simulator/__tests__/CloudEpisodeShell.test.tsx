import React from "react";
import { describe, it, expect, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { CloudEpisodeShell } from "../CloudEpisodeShell";
import { useCloudSimulationStore } from "@/store/useCloudSimulationStore";

describe("CloudEpisodeShell", () => {
  beforeEach(() => {
    useCloudSimulationStore.getState().resetEpisode();
  });

  it("renders header, episode title, back button, and scenario dropdown", () => {
    render(<CloudEpisodeShell />);

    expect(screen.getByText(/Cloud Engineering/i)).toBeInTheDocument();
    expect(screen.getByText(/AWS IAM: Who Gets Access to What\?/i)).toBeInTheDocument();
    expect(
      screen.getByRole("combobox", { name: /Select simulation scenario/i })
    ).toBeInTheDocument();
  });

  it("renders the docked InteractiveExplanationBar with step details and AWS glossary", () => {
    render(<CloudEpisodeShell />);

    expect(screen.getByLabelText(/Step explanation/i)).toBeInTheDocument();
    expect(screen.getByText(/Principal & Target Initialization/i)).toBeInTheDocument();
  });

  it("advances and steps back through playback controls", () => {
    render(<CloudEpisodeShell />);

    const nextButton = screen.getByRole("button", { name: /Next step/i });
    fireEvent.click(nextButton);

    expect(useCloudSimulationStore.getState().currentStepIndex).toBe(1);

    const prevButton = screen.getByRole("button", { name: /Previous step/i });
    fireEvent.click(prevButton);

    expect(useCloudSimulationStore.getState().currentStepIndex).toBe(0);
  });

  it("switches scenario via dropdown", () => {
    render(<CloudEpisodeShell />);

    const dropdownTrigger = screen.getByRole("combobox", {
      name: /Select simulation scenario/i,
    });
    fireEvent.click(dropdownTrigger);

    const scenarioOption = screen.getByText(/The Golden Rule: Explicit Deny Overrides Allow/i);
    fireEvent.click(scenarioOption);

    expect(useCloudSimulationStore.getState().activeScenarioId).toBe("explicit-deny-override");
  });

  it("cleans up store on unmount (Decision Record 002)", () => {
    const { unmount } = render(<CloudEpisodeShell />);
    useCloudSimulationStore.getState().setStepIndex(3);

    unmount();

    expect(useCloudSimulationStore.getState().currentStepIndex).toBe(0);
    expect(useCloudSimulationStore.getState().isPlaying).toBe(false);
  });
});
