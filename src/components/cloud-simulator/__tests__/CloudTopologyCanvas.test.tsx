import React from "react";
import { describe, it, expect, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { CloudTopologyCanvas } from "../CloudTopologyCanvas";
import { useCloudSimulationStore } from "@/store/useCloudSimulationStore";

describe("CloudTopologyCanvas (3-Zone AWS Stage & PDP Circuit Breaker)", () => {
  beforeEach(() => {
    useCloudSimulationStore.getState().resetEpisode();
  });

  it("renders Zone 1 Principals, Zone 2 PDP Gate, and Zone 3 AWS Resources", () => {
    render(<CloudTopologyCanvas />);

    // Zone 1
    expect(screen.getByText(/IAM Principals/i)).toBeInTheDocument();
    expect(screen.getAllByText(/Alice \(Backend Dev\)/i)[0]).toBeInTheDocument();

    // Zone 2
    expect(screen.getByText(/IAM Policy Decision Point/i)).toBeInTheDocument();
    expect(screen.getByText(/Implicit Deny Baseline/i)).toBeInTheDocument();

    // Zone 3
    expect(screen.getByText(/Target AWS Resources/i)).toBeInTheDocument();
    expect(screen.getAllByText(/company-data/i)[0]).toBeInTheDocument();
  });

  it("renders the in-flight API request token with action and target", () => {
    render(<CloudTopologyCanvas />);
    expect(screen.getAllByText("s3:GetObject").length).toBeGreaterThan(0);
  });

  it("trips circuit breaker with ruby crimson styling when explicit deny matches", () => {
    // Select Scenario 2 Step 3 (Explicit Deny)
    useCloudSimulationStore.getState().selectScenario("explicit-deny-override");
    useCloudSimulationStore.getState().setStepIndex(3);

    render(<CloudTopologyCanvas />);

    expect(screen.getAllByText(/CIRCUIT BREAKER TRIPPED/i)[0]).toBeInTheDocument();
    expect(screen.getAllByText(/Bob \(DevOps Admin\)/i)[0]).toBeInTheDocument();
  });

  it("illuminates emerald when access is granted", () => {
    // Select Scenario 1 Step 4 (Allow)
    useCloudSimulationStore.getState().selectScenario("least-privilege-default-deny");
    useCloudSimulationStore.getState().setStepIndex(4);

    render(<CloudTopologyCanvas />);

    expect(screen.getAllByText(/AUTHORIZATION GRANTED/i)[0]).toBeInTheDocument();
  });

  it("allows selecting a principal on click to update store state", () => {
    // Select Scenario 3 (Charlie)
    useCloudSimulationStore.getState().selectScenario("group-policy-inheritance");
    render(<CloudTopologyCanvas />);

    const charlieButton = screen.getByRole("button", {
      name: /Inspect principal Charlie/i,
    });
    fireEvent.click(charlieButton);

    expect(useCloudSimulationStore.getState().selectedPrincipalId).toBe("charlie");
  });

  it("does not falsely mark non-target S3 resources as active target for DynamoDB requests", () => {
    // Select Scenario 3 Step 3 (dynamodb:GetItem on Employees table)
    useCloudSimulationStore.getState().selectScenario("group-policy-inheritance");
    useCloudSimulationStore.getState().setStepIndex(3);

    render(<CloudTopologyCanvas />);

    const s3Card = screen.getByText("company-data").closest("div[class*='rounded-lg']");
    expect(s3Card?.className).not.toContain("border-orange-500/40");
  });
});
