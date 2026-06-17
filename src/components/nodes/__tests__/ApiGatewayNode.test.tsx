import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { ReactFlowProvider } from "@xyflow/react";
import { ApiGatewayNode } from "../ApiGatewayNode";
import { commandInvoker } from "@/lib/store/useHistoryStore";
import type { SystemNodeData } from "@/types";

vi.mock("@/lib/store/useHistoryStore", () => ({
  commandInvoker: { execute: vi.fn() },
}));

const defaultData: SystemNodeData = {
  kind: "apiGateway", label: "Main Gateway",
  activeConnections: 0, load: 0,
  metadata: { type: "REST", middlewareChain: "[]" },
  securityPolicies: [],
};

function wrap(data = defaultData) {
  return render(
    <ReactFlowProvider>
      <ApiGatewayNode
        id="apigw-1" data={data} selected={false}
        type="apiGateway" dragging={false} zIndex={1}
        isConnectable={true} positionAbsoluteX={0} positionAbsoluteY={0}
        {...({} as any)}
      />
    </ReactFlowProvider>
  );
}

describe("ApiGatewayNode", () => {
  beforeEach(() => vi.mocked(commandInvoker.execute).mockClear());

  it("renders node label", () => {
    wrap();
    expect(screen.getByText("Main Gateway")).toBeInTheDocument();
  });

  it("shows empty state when no middleware", () => {
    wrap();
    expect(screen.getByText(/No middleware/)).toBeInTheDocument();
  });

  it("renders middleware pills from chain", () => {
    const chain = JSON.stringify([
      { id: "s1", type: "rateLimit", enabled: true, label: "Rate limit", config: {} },
      { id: "s2", type: "auth",      enabled: true, label: "Auth",       config: {} },
    ]);
    wrap({ ...defaultData, metadata: { ...defaultData.metadata, middlewareChain: chain } });
    expect(screen.getByText("Rate limit")).toBeInTheDocument();
    expect(screen.getByText("Auth")).toBeInTheDocument();
  });

  it("calls commandInvoker.execute when adding a step", () => {
    wrap();
    const addBtn = screen.getByText("+ Rate limit");
    fireEvent.click(addBtn);
    expect(commandInvoker.execute).toHaveBeenCalledOnce();
  });

  it("shows add buttons for all unused step types", () => {
    wrap();
    expect(screen.getByText("+ Rate limit")).toBeInTheDocument();
    expect(screen.getByText("+ Auth")).toBeInTheDocument();
    expect(screen.getByText("+ Transform")).toBeInTheDocument();
  });

  it("hides add button for already-added step type", () => {
    const chain = JSON.stringify([
      { id: "s1", type: "auth", enabled: true, label: "Auth", config: {} },
    ]);
    wrap({ ...defaultData, metadata: { ...defaultData.metadata, middlewareChain: chain } });
    expect(screen.queryByText("+ Auth")).not.toBeInTheDocument();
    expect(screen.getByText("+ Rate limit")).toBeInTheDocument();
  });
});
