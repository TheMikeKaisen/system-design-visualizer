import React from "react";
import { describe, it, expect, beforeEach } from "vitest";
import { render, screen, fireEvent, act } from "@testing-library/react";
import { EC2EpisodeShell } from "../EC2EpisodeShell";
import { useEC2SimulationStore } from "@/store/useEC2SimulationStore";

describe("EC2EpisodeShell", () => {
  beforeEach(() => {
    act(() => {
      useEC2SimulationStore.getState().resetEpisode();
    });
  });

  it("renders header, episode title, back button, and scenario dropdown", () => {
    render(<EC2EpisodeShell />);

    expect(screen.getByText(/Back to Cloud Engineering/i)).toBeInTheDocument();
    expect(screen.getByText(/Amazon EC2: The Invisible Handshake/i)).toBeInTheDocument();
    expect(
      screen.getByRole("combobox", { name: /Select EC2 Simulation Scenario/i })
    ).toBeInTheDocument();
  });

  it("renders mobile tab switcher with 3 tabs", () => {
    render(<EC2EpisodeShell />);

    expect(screen.getByRole("button", { name: /1\. Network/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /2\. Keys/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /3\. Terminal/i })).toBeInTheDocument();
  });

  it("switches mobile tabs on click", () => {
    render(<EC2EpisodeShell />);

    const keysTab = screen.getByRole("button", { name: /2\. Keys/i });
    fireEvent.click(keysTab);

    expect(keysTab.className).toContain("text-amber-300");

    const terminalTab = screen.getByRole("button", { name: /3\. Terminal/i });
    fireEvent.click(terminalTab);

    expect(terminalTab.className).toContain("text-amber-300");
  });

  it("renders the explanation bar with initial step title", () => {
    render(<EC2EpisodeShell />);

    expect(screen.getByText(/Client Initiates Connection/i)).toBeInTheDocument();
  });

  it("advances and steps back through playback controls", () => {
    render(<EC2EpisodeShell />);

    const nextButton = screen.getByTitle(/Next step/i);
    fireEvent.click(nextButton);

    expect(useEC2SimulationStore.getState().currentStepIndex).toBe(1);

    const prevButton = screen.getByTitle(/Previous step/i);
    fireEvent.click(prevButton);

    expect(useEC2SimulationStore.getState().currentStepIndex).toBe(0);
  });

  it("opens .pem file modal when inspect button is clicked", () => {
    render(<EC2EpisodeShell />);

    const inspectButtons = screen.getAllByRole("button", { name: /Inspect \.pem/i });
    fireEvent.click(inspectButtons[0]);

    expect(screen.getByText(/-----BEGIN RSA PRIVATE KEY-----/i)).toBeInTheDocument();
    expect(screen.getByText(/Why AWS never keeps a copy/i)).toBeInTheDocument();

    const closeButton = screen.getByRole("button", { name: /Close Inspector/i });
    fireEvent.click(closeButton);

    expect(screen.queryByText(/-----BEGIN RSA PRIVATE KEY-----/i)).not.toBeInTheDocument();
  });

  it("cleans up store state on unmount", () => {
    const { unmount } = render(<EC2EpisodeShell />);
    act(() => {
      useEC2SimulationStore.getState().setStepIndex(2);
    });
    expect(useEC2SimulationStore.getState().currentStepIndex).toBe(2);

    unmount();
    expect(useEC2SimulationStore.getState().currentStepIndex).toBe(0);
    expect(useEC2SimulationStore.getState().activeScenarioId).toBe("happy_path");
  });
});
