import { describe, it, expect } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { PacketInspectorPanel } from "../PacketInspectorPanel";
import {
  SCENARIO_HANDSHAKE,
  SCENARIO_MULTI_CLIENT,
  SCENARIO_WIRE_DISSECTION,
} from "@/lib/network-simulator/scenarios";

describe("PacketInspectorPanel", () => {
  it("renders empty state when no packet is on wire", () => {
    render(<PacketInspectorPanel packet={null} />);
    expect(screen.getByText("No Packet on Wire")).toBeDefined();
  });

  it("renders 8-bit TCP control flags register and handles flag bits correctly", () => {
    const synAckPacket = SCENARIO_HANDSHAKE.steps[2].activePacket!;
    render(
      <PacketInspectorPanel
        packet={synAckPacket}
        scenarioId="tcp-handshake"
        stepBadge="Handshake 2/3"
      />
    );

    expect(screen.getByText("Wire Packet Inspector")).toBeDefined();
    expect(screen.getByText(/\[SYN, ACK\]/i)).toBeDefined();

    // 8-bit register check
    const register = screen.getByRole("group", { name: /8-bit TCP control flags register/i });
    expect(register).toBeDefined();

    // Both SYN (bit 1) and ACK (bit 4) should be 1
    expect(screen.getByTitle("SYN (Synchronize Sequence Numbers) = 1")).toBeDefined();
    expect(screen.getByTitle("ACK (Acknowledgment) = 1")).toBeDefined();
    expect(screen.getByTitle("FIN (Finish / Terminate) = 0")).toBeDefined();
  });

  it("highlights active encapsulation layer and marks pending layers in wire-dissection scenario", () => {
    // Step 0: Layer 7 HTTP payload generation (L4, L3, L2 pending)
    const step0Packet = SCENARIO_WIRE_DISSECTION.steps[0].activePacket!;
    const { rerender } = render(
      <PacketInspectorPanel
        packet={step0Packet}
        scenarioId="wire-dissection"
        stepBadge="Layer 7 (HTTP)"
        stepIndex={0}
      />
    );

    expect(screen.getByText("Encapsulation Dissection")).toBeDefined();
    expect(screen.getByText("Active Layer")).toBeDefined(); // On L7
    expect(screen.getAllByText("Pending Encapsulation").length).toBeGreaterThanOrEqual(1);

    // Step 1: Layer 4 Transport encapsulation (TCP Header added)
    const step1Packet = SCENARIO_WIRE_DISSECTION.steps[1].activePacket!;
    rerender(
      <PacketInspectorPanel
        packet={step1Packet}
        scenarioId="wire-dissection"
        stepBadge="Layer 4 (TCP)"
        stepIndex={1}
      />
    );

    expect(screen.getByText("Active Layer")).toBeDefined();
  });

  it("correlates 4-tuple demux key with endpoints in multi-client scenario", () => {
    const multiClientPacket = SCENARIO_MULTI_CLIENT.steps[2].activePacket!;
    const clientBSocket = SCENARIO_MULTI_CLIENT.steps[2].activeSockets.find(
      (s) => s.id === "server-conn-b"
    )!;

    render(
      <PacketInspectorPanel
        packet={multiClientPacket}
        scenarioId="multi-client-demux"
        stepBadge="Socket B Established"
        selectedSocket={clientBSocket}
      />
    );

    expect(screen.getByText("4-Tuple Demultiplexing Key")).toBeDefined();
    expect(screen.getByText("192.168.1.11:51524")).toBeDefined();
    expect(screen.getByText("203.0.113.20:443")).toBeDefined();
    expect(screen.getByText("server-conn-b")).toBeDefined();
  });

  it("filters layers via layer filter tabs with ARIA tab roles", () => {
    const packet = SCENARIO_HANDSHAKE.steps[1].activePacket!;
    render(
      <PacketInspectorPanel
        packet={packet}
        scenarioId="tcp-handshake"
        stepBadge="Handshake 1/3"
      />
    );

    // Click L3 tab
    const l3Tab = screen.getByRole("tab", { name: "L3 IP" });
    fireEvent.click(l3Tab);

    expect(l3Tab).toHaveAttribute("aria-selected", "true");
    expect(screen.getByText(/Layer 3 · Network/i)).toBeDefined();
  });
});
