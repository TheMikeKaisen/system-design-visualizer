import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { ReactFlowProvider } from "@xyflow/react";
import { ApiGatewayNode } from "../ApiGatewayNode";
import { commandInvoker }  from "@/lib/store/useHistoryStore";
import { useSimulationStore } from "@/lib/store/useSimulationStore";
import type { SystemNodeData } from "@/types";

vi.mock("@/lib/store/useHistoryStore", () => ({
  commandInvoker: { execute: vi.fn() },
}));
vi.mock("@/lib/store/useSimulationStore");

const baseData: SystemNodeData = {
  kind: "apiGateway", label: "Test GW",
  activeConnections: 0, load: 0,
  metadata: { type: "REST", middlewareChain: "[]" },
  securityPolicies: [],
};

function wrap(data = baseData) {
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

beforeEach(() => {
  vi.mocked(commandInvoker.execute).mockClear();
  vi.mocked(useSimulationStore).mockReturnValue({
    gatewayStates: {},
  } as any);
});

describe("ApiGatewayNode — middleware integration", () => {
  it("shows circuit breaker badge when gateway state is available", () => {
    vi.mocked(useSimulationStore).mockReturnValue({
      gatewayStates: {
        "apigw-1": {
          gatewayId: "apigw-1", cbState: "OPEN",
          cbFailures: 5, cbShedCount: 12,
          rateLimiterFillPct: 0.3, recentAudit: [],
        },
      },
    } as any);
    wrap();
    expect(screen.getByText("OPEN")).toBeInTheDocument();
  });

  it("shows runtime stats when gateway state exists", () => {
    vi.mocked(useSimulationStore).mockReturnValue({
      gatewayStates: {
        "apigw-1": {
          gatewayId: "apigw-1", cbState: "CLOSED",
          cbFailures: 2, cbShedCount: 7,
          rateLimiterFillPct: 0.8, recentAudit: [],
        },
      },
    } as any);
    wrap();
    expect(screen.getByText("7")).toBeInTheDocument(); // shed count
    expect(screen.getByText("2")).toBeInTheDocument(); // failure count
    expect(screen.getByText("80%")).toBeInTheDocument(); // token fill
  });

  it("calling add step fires UpdateNodeDataCommand", () => {
    wrap();
    fireEvent.click(screen.getByText("+ Rate limit"));
    expect(commandInvoker.execute).toHaveBeenCalledOnce();
  });

  it("does not show add button for already-added step type", () => {
    const chain = JSON.stringify([
      { id: "s1", type: "circuitBreaker", enabled: true, label: "Circuit breaker", config: {} },
    ]);
    wrap({ ...baseData, metadata: { ...baseData.metadata, middlewareChain: chain } });
    expect(screen.queryByText("+ Circuit breaker")).not.toBeInTheDocument();
  });
});
