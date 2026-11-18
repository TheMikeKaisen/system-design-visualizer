import React from "react";
import { describe, it, expect, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { PolicyInspectorPanel } from "../PolicyInspectorPanel";
import { useCloudSimulationStore } from "@/store/useCloudSimulationStore";

describe("PolicyInspectorPanel (Dual-Mode Inspector & Telemetry)", () => {
  beforeEach(() => {
    useCloudSimulationStore.getState().resetEpisode();
  });

  it("renders accessible WAI-ARIA tablist with all 4 tabs", () => {
    render(<PolicyInspectorPanel />);

    const tablist = screen.getByRole("tablist", { name: /Cloud telemetry tabs/i });
    expect(tablist).toBeInTheDocument();

    expect(screen.getByRole("tab", { name: /Policy JSON/i })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: /Decision Trace/i })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: /Permission Matrix/i })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: /Token Vault/i })).toBeInTheDocument();
  });

  it("switches tabs when tab buttons are clicked", () => {
    render(<PolicyInspectorPanel />);

    const traceTab = screen.getByRole("tab", { name: /Decision Trace/i });
    fireEvent.click(traceTab);

    expect(useCloudSimulationStore.getState().activeTab).toBe("decision_trace");
    expect(screen.getByText(/5-Stage Evaluation Pipeline/i)).toBeInTheDocument();
  });

  it("renders interactive statement toggles in Mode 2 and allows flipping statements", () => {
    // Select Scenario 2 Step 3 (Explicit Deny)
    useCloudSimulationStore.getState().selectScenario("explicit-deny-override");
    useCloudSimulationStore.getState().setStepIndex(3);

    render(<PolicyInspectorPanel />);

    // Toggle button for DenyDeleteBucket
    const toggleButton = screen.getByRole("button", {
      name: /Toggle statement DenyDeleteBucket/i,
    });
    expect(toggleButton).toBeInTheDocument();

    fireEvent.click(toggleButton);

    expect(useCloudSimulationStore.getState().hasOverrides).toBe(true);
    expect(screen.getByText(/Sandbox Override Active/i)).toBeInTheDocument();
  });

  it("renders the Permission Matrix panel with principal comparison", () => {
    useCloudSimulationStore.getState().setActiveTab("permission_matrix");
    render(<PolicyInspectorPanel />);

    expect(screen.getByText(/Effective Permissions Matrix/i)).toBeInTheDocument();
    expect(screen.getByText("s3:GetObject")).toBeInTheDocument();
    expect(screen.getByText("s3:DeleteBucket")).toBeInTheDocument();
  });

  it("renders the Token Vault panel displaying credentials breakdown", () => {
    useCloudSimulationStore.getState().setActiveTab("token_vault");
    render(<PolicyInspectorPanel />);

    expect(screen.getByText(/AWS Credentials & Token Vault/i)).toBeInTheDocument();
    expect(screen.getByText(/Static Access Key \(AKIA\)/i)).toBeInTheDocument();
    expect(screen.getByText(/STS Session Token \(ASIA\)/i)).toBeInTheDocument();
  });

  it("renders both identity and resource-based policies in Scenario 4 step 4", () => {
    useCloudSimulationStore.getState().selectScenario("cross-account-resource-policy");
    useCloudSimulationStore.getState().setStepIndex(4);

    render(<PolicyInspectorPanel />);

    // Identity policy OutboundPartnerS3Access must be present
    expect(screen.getByText("OutboundPartnerS3Access")).toBeInTheDocument();
    // Resource policy PartnerBucketTrustPolicy attached to bucket must also be present
    expect(screen.getByText("PartnerBucketTrustPolicy")).toBeInTheDocument();
    // Statement TrustAliceAccount must be toggleable
    const trustToggle = screen.getByRole("button", {
      name: /Toggle statement TrustAliceAccount/i,
    });
    expect(trustToggle).toBeInTheDocument();

    fireEvent.click(trustToggle);
    expect(useCloudSimulationStore.getState().hasOverrides).toBe(true);
  });
});
