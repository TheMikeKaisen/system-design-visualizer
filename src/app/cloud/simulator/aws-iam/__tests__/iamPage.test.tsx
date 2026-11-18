import React from "react";
import { describe, it, expect, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import AwsIamSimulatorPage, { metadata } from "../page";
import { useCloudSimulationStore } from "@/store/useCloudSimulationStore";

describe("AWS IAM Simulator Route Page (/cloud/simulator/aws-iam)", () => {
  beforeEach(() => {
    useCloudSimulationStore.getState().resetEpisode();
  });

  it("exports correct page metadata", () => {
    expect(metadata.title).toContain("AWS IAM");
  });

  it("mounts CloudEpisodeShell with episode title and canvas", () => {
    render(<AwsIamSimulatorPage />);

    expect(
      screen.getByText(/AWS IAM: Who Gets Access to What\?/i)
    ).toBeInTheDocument();
    expect(
      screen.getByText(/AWS Architecture Flow/i)
    ).toBeInTheDocument();
  });
});
