import { describe, it, expect, beforeEach } from "vitest";
import { render, screen, fireEvent, act } from "@testing-library/react";
import TcpConnectionsEpisodePage from "../page";
import { useNetworkSimulationStore } from "@/store/useNetworkSimulationStore";
import { SCENARIO_TCP_HANDSHAKE } from "@/lib/network-simulator/tcp-scenarios";

describe("TcpConnectionsEpisodePage (Episode 3 Smoke Test)", () => {
  beforeEach(() => {
    useNetworkSimulationStore.getState().resetEpisode(SCENARIO_TCP_HANDSHAKE);
  });

  it("renders episode header, Episode 3 badge, and TCP scenario selector", () => {
    render(<TcpConnectionsEpisodePage />);

    expect(screen.getByText("Episode 3")).toBeDefined();
    expect(screen.getByRole("link", { name: /Back/i })).toHaveAttribute(
      "href",
      "/computer-networks"
    );

    const combobox = screen.getByRole("combobox");
    expect(combobox).toBeDefined();
    fireEvent.click(combobox);
    expect(
      screen.getByRole("option", { name: /Canonical 3-Way Handshake & First Data Segment/i })
    ).toBeDefined();
    expect(
      screen.getByRole("option", { name: /SYN Packet Loss, RTO Expiration & Exponential Backoff/i })
    ).toBeDefined();
    expect(
      screen.getByRole("option", { name: /Connection Refused: Unbound Port & The RST Flag/i })
    ).toBeDefined();
    expect(
      screen.getByRole("option", {
        name: /Graceful 4-Way Teardown & The TIME_WAIT \/ CLOSE_WAIT Lifecycle/i,
      })
    ).toBeDefined();
    expect(
      screen.getByRole("option", {
        name: /SYN Flood Attack, Backlog Saturation & Stateless SYN Cookies Defense/i,
      })
    ).toBeDefined();
    expect(
      screen.getByRole("option", { name: /Simultaneous Active Open \(P2P NAT Hole Punching\)/i })
    ).toBeDefined();
  });

  it("renders step 1 badge, TCP topology dual-horizon machines, and telemetry tabs", () => {
    render(<TcpConnectionsEpisodePage />);

    expect(screen.getByLabelText("Step explanation")).toBeDefined();
    expect(screen.getByText(/Step 1 of/i)).toBeDefined();
    expect(screen.getByText("Pre-Flight")).toBeDefined();
    expect(
      screen.getByText("Initial Conditions: Server in LISTEN, Client in CLOSED")
    ).toBeDefined();

    // Verify Topology Canvas zones
    expect(screen.getByText("Client Workstation")).toBeDefined();
    expect(screen.getByText("Server Host")).toBeDefined();
    expect(screen.getByText("SYN Backlog (Half-Open):")).toBeDefined();
    expect(screen.getByText("Accept Queue (Ready):")).toBeDefined();

    // Verify Telemetry Panel WAI-ARIA tabs
    expect(screen.getByRole("tab", { name: /Wire Segment/i })).toBeDefined();
    expect(screen.getByRole("tab", { name: /Sockets Table/i })).toBeDefined();
    expect(screen.getByRole("tab", { name: /TCP FSM/i })).toBeDefined();
  });

  it("advances step via Next button, renders SYN segment with 8-bit flags register", () => {
    render(<TcpConnectionsEpisodePage />);

    const nextBtn = screen.getByRole("button", { name: /Next Step/i });
    expect(nextBtn).toBeDefined();

    // Advance to Step 2 (Client sends SYN)
    act(() => {
      fireEvent.click(nextBtn);
    });

    expect(screen.getByText(/Step 2 of/i)).toBeDefined();
    expect(screen.getByText("Handshake Step 1")).toBeDefined();

    // Wire Segment tab is active by default; check 8-bit flag register
    expect(screen.getByText("RFC 793 8-Bit Control Flags Register")).toBeDefined();
    expect(screen.getAllByText("SYN").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("ACK").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("FIN").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("RST").length).toBeGreaterThanOrEqual(1);

    // Verify TCP Options
    expect(screen.getByText("Maximum Segment Size (MSS)")).toBeDefined();
    expect(screen.getByText("1460 bytes")).toBeDefined();
  });

  it("switches telemetry tabs to Sockets Table and TCP FSM with proper ARIA semantics and renders Desktop SVG directed graph", () => {
    render(<TcpConnectionsEpisodePage />);

    // Switch to Sockets Table tab
    const socketsTab = screen.getByRole("tab", { name: /Sockets Table/i });
    act(() => {
      fireEvent.click(socketsTab);
    });
    expect(socketsTab.getAttribute("aria-selected")).toBe("true");
    expect(screen.getByText("ss -tan")).toBeDefined();
    expect(screen.getAllByText("LISTEN").length).toBeGreaterThanOrEqual(1);

    // Switch to TCP FSM tab
    const fsmTab = screen.getByRole("tab", { name: /TCP FSM/i });
    act(() => {
      fireEvent.click(fsmTab);
    });
    expect(fsmTab.getAttribute("aria-selected")).toBe("true");
    // Verify SVG directed graph is rendered
    expect(screen.getByLabelText("TCP Finite State Machine Directed Graph")).toBeDefined();
    expect(screen.getAllByText("CLOSED").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("ESTABLISHED").length).toBeGreaterThanOrEqual(1);
  });

  it("clicking packet pill on canvas auto-switches active telemetry tab to Wire Segment", () => {
    render(<TcpConnectionsEpisodePage />);

    // First switch to Sockets Table tab
    const socketsTab = screen.getByRole("tab", { name: /Sockets Table/i });
    act(() => {
      fireEvent.click(socketsTab);
    });
    expect(socketsTab.getAttribute("aria-selected")).toBe("true");

    // Advance to Step 2 (SYN segment active on wire)
    const nextBtn = screen.getByRole("button", { name: /Next Step/i });
    act(() => {
      fireEvent.click(nextBtn);
    });

    // Click on the wire packet pill button
    const packetPill = screen.getByRole("button", { name: /Inspect TCP Segment/i });
    act(() => {
      fireEvent.click(packetPill);
    });

    // Verify Wire Segment tab was auto-activated
    const wireTab = screen.getByRole("tab", { name: /Wire Segment/i });
    expect(wireTab.getAttribute("aria-selected")).toBe("true");
    expect(screen.getByText("RFC 793 8-Bit Control Flags Register")).toBeDefined();
  });

  it("interacts with highlighted concept chips in the explanation bar without term shadowing", () => {
    render(<TcpConnectionsEpisodePage />);

    const nextBtn = screen.getByRole("button", { name: /Next Step/i });
    act(() => {
      fireEvent.click(nextBtn);
    });

    // On Step 2 (SYN), SYN keyword is present
    const synButtons = screen.getAllByRole("button", { name: /SYN/i });
    expect(synButtons.length).toBeGreaterThanOrEqual(1);

    // Click to open concept dialog
    act(() => {
      fireEvent.click(synButtons[0]);
    });

    // Check dialog content
    expect(screen.getByRole("dialog")).toBeDefined();
    expect(screen.getByText("SYN (Synchronize Sequence Numbers)")).toBeDefined();

    // Advance to Step 3 (SYN-ACK)
    act(() => {
      fireEvent.click(nextBtn);
    });

    // Find and click SYN-ACK button
    const synAckButtons = screen.getAllByRole("button", { name: /SYN-ACK/i });
    expect(synAckButtons.length).toBeGreaterThanOrEqual(1);
    act(() => {
      fireEvent.click(synAckButtons[0]);
    });

    // Verify dialogue opens specifically for SYN-ACK and was NOT shadowed by SYN
    expect(screen.getByText("SYN-ACK (Synchronize & Acknowledge)")).toBeDefined();
  });

  it("renders Client: CLOSED with closed badge style and does not style client as LISTEN on step 0", () => {
    render(<TcpConnectionsEpisodePage />);

    const clientBadge = screen.getByText("Client: CLOSED");
    expect(clientBadge).toBeDefined();
    // Verify it has the zinc (closed) classes, NOT sky-400 (LISTEN)
    expect(clientBadge.className).toContain("text-zinc-500");
    expect(clientBadge.className).not.toContain("text-sky-400");
  });

  it("retains socket selection by ID across step navigation (Rule #8 item 3)", () => {
    render(<TcpConnectionsEpisodePage />);

    // Switch to Sockets Table
    const socketsTab = screen.getByRole("tab", { name: /Sockets Table/i });
    act(() => {
      fireEvent.click(socketsTab);
    });

    // Advance to Step 2 (where both srv-listen and cli-sock exist)
    const nextBtn = screen.getByRole("button", { name: /Next Step/i });
    act(() => {
      fireEvent.click(nextBtn);
    });

    // Select the client socket row by its local endpoint
    const cliRow = screen.getByText("192.168.1.10:51000");
    expect(cliRow).toBeDefined();
    act(() => {
      fireEvent.click(cliRow);
    });

    // Verify client socket detail is selected
    expect(screen.getByText("Selected Socket Detail (Client)")).toBeDefined();

    // Advance to Step 3 (SYN-ACK)
    act(() => {
      fireEvent.click(nextBtn);
    });

    // Selection must remain on the Client socket!
    expect(screen.getByText("Selected Socket Detail (Client)")).toBeDefined();
  });

  it("supports keyboard navigation on SVG FSM nodes to update the explainer drawer", () => {
    render(<TcpConnectionsEpisodePage />);

    // Switch to TCP FSM tab
    const fsmTab = screen.getByRole("tab", { name: /TCP FSM/i });
    act(() => {
      fireEvent.click(fsmTab);
    });

    const timeWaitNode = screen.getByRole("button", { name: "TCP State TIME_WAIT" });
    expect(timeWaitNode).toBeDefined();

    // Trigger keyboard Enter
    act(() => {
      fireEvent.keyDown(timeWaitNode, { key: "Enter" });
    });

    // Verify explainer drawer updated to TIME_WAIT
    expect(screen.getByText("RFC 793 State: TIME_WAIT")).toBeDefined();
    expect(
      screen.getByText(/waiting 2\*MSL \(60s\) to prevent ghost socket reincarnations/i)
    ).toBeDefined();
  });
});
