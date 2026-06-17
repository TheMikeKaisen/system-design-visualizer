import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { CloudMetadataPanel } from "../CloudMetadataPanel";
import { commandInvoker } from "@/lib/store/useHistoryStore";
import { createNode } from "@/components/nodes/NodeFactory";

vi.mock("@/lib/store/useHistoryStore", () => ({
  commandInvoker: { execute: vi.fn() },
}));

beforeEach(() => vi.mocked(commandInvoker.execute).mockClear());

describe("CloudMetadataPanel", () => {
  it("renders fields for awsEc2 node", () => {
    const node = createNode({ kind: "awsEc2" });
    render(<CloudMetadataPanel node={node} />);
    expect(screen.getByText("Instance type")).toBeInTheDocument();
    expect(screen.getByText("Region")).toBeInTheDocument();
  });

  it("renders fields for gcpCloudRun node", () => {
    const node = createNode({ kind: "gcpCloudRun" });
    render(<CloudMetadataPanel node={node} />);
    expect(screen.getByText("Min instances")).toBeInTheDocument();
    expect(screen.getByText("Max instances")).toBeInTheDocument();
  });

  it("renders fields for apiGateway node", () => {
    const node = createNode({ kind: "apiGateway" });
    render(<CloudMetadataPanel node={node} />);
    expect(screen.getByText("API type")).toBeInTheDocument();
    expect(screen.getByText("Throttle (req/s)")).toBeInTheDocument();
  });

  it("fires UpdateNodeDataCommand on select change", () => {
    const node = createNode({ kind: "awsEc2" });
    render(<CloudMetadataPanel node={node} />);
    const select = screen.getAllByRole("combobox")[0];
    fireEvent.change(select, { target: { value: "m5.large" } });
    expect(commandInvoker.execute).toHaveBeenCalledOnce();
  });

  it("renders nothing for general nodes with no cloud metadata", () => {
    const node = createNode({ kind: "service" });
    const { container } = render(<CloudMetadataPanel node={node} />);
    expect(container.firstChild).toBeNull();
  });
});
