import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { ReactFlowProvider } from "@xyflow/react";
import { CloudNodeBase } from "../cloud/CloudNodeBase";
import type { SystemNodeData } from "@/types";

const mockData: SystemNodeData = {
  kind: "awsEc2", label: "Web Server", activeConnections: 3,
  load: 0.6, metadata: { instanceType: "t3.medium" }, securityPolicies: [],
};

function wrap(ui: React.ReactElement) {
  return render(<ReactFlowProvider>{ui}</ReactFlowProvider>);
}

describe("CloudNodeBase", () => {
  it("renders the node label", () => {
    wrap(<CloudNodeBase data={mockData} selected={false} provider="aws" icon={<span>icon</span>} />);
    expect(screen.getByText("Web Server")).toBeInTheDocument();
  });

  it("renders the AWS badge", () => {
    wrap(<CloudNodeBase data={mockData} selected={false} provider="aws" icon={<span />} />);
    expect(screen.getByText("AWS")).toBeInTheDocument();
  });

  it("renders GCP badge for gcp provider", () => {
    wrap(<CloudNodeBase data={{ ...mockData, kind: "gcpCloudRun" }} selected={false} provider="gcp" icon={<span />} />);
    expect(screen.getByText("GCP")).toBeInTheDocument();
  });

  it("renders Azure badge for azure provider", () => {
    wrap(<CloudNodeBase data={{ ...mockData, kind: "azureVm" }} selected={false} provider="azure" icon={<span />} />);
    expect(screen.getByText("Azure")).toBeInTheDocument();
  });

  it("renders subtitle when provided", () => {
    wrap(<CloudNodeBase data={mockData} selected={false} provider="aws" icon={<span />} subtitle="t3.medium" />);
    expect(screen.getByText("t3.medium")).toBeInTheDocument();
  });

  it("renders connection count", () => {
    wrap(<CloudNodeBase data={mockData} selected={false} provider="aws" icon={<span />} />);
    expect(screen.getByText("3 connections")).toBeInTheDocument();
  });
});
