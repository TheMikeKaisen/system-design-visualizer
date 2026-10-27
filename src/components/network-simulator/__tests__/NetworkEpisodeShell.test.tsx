import { describe, it, expect, beforeEach } from "vitest";
import { render, screen, fireEvent, act } from "@testing-library/react";
import { NetworkEpisodeShell } from "../NetworkEpisodeShell";
import { useNetworkSimulationStore } from "@/store/useNetworkSimulationStore";
import { SCENARIO_HANDSHAKE } from "@/lib/network-simulator/scenarios";

describe("NetworkEpisodeShell", () => {
  beforeEach(() => {
    useNetworkSimulationStore.getState().resetEpisode(SCENARIO_HANDSHAKE);
  });

  it("renders episode header, back link, and scenario selector", () => {
    render(
      <NetworkEpisodeShell
        episodeNumber={1}
        title="IP Addresses, Ports & Sockets — How Network Connections Work"
      />
    );

    expect(screen.getByText("Episode 1")).toBeDefined();
    expect(screen.getByRole("link", { name: /Back/i })).toHaveAttribute(
      "href",
      "/computer-networks"
    );

    const combobox = screen.getByRole("combobox");
    expect(combobox).toBeDefined();
    fireEvent.click(combobox);
    expect(screen.getByRole("option", { name: /Canonical HTTP Request/i })).toBeDefined();
  });

  it("renders step badge, title, and interactive highlighted concepts with hover dialogue", () => {
    render(
      <NetworkEpisodeShell
        episodeNumber={1}
        title="IP Addresses, Ports & Sockets"
      />
    );

    expect(screen.getByLabelText("Step explanation")).toBeDefined();
    expect(screen.getByText(/Step 1 of/i)).toBeDefined();
    expect(screen.getByText("Engine Init")).toBeDefined();
    expect(screen.getByText("Server Bound in LISTEN State")).toBeDefined();

    // Check concept chip button
    const conceptChip = screen.getByRole("button", { name: /Passive Open/i });
    expect(conceptChip).toBeDefined();

    // Click/hover on the concept chip to open the dialogue
    act(() => {
      fireEvent.click(conceptChip);
    });

    const dialog = screen.getByRole("dialog");
    expect(dialog).toBeDefined();
    expect(screen.getByText("POSIX Socket API")).toBeDefined();
    expect(screen.getByText("ss -tulpn | grep :80")).toBeDefined();

    // Close button
    const closeBtn = screen.getByRole("button", { name: /Close dialogue/i });
    act(() => {
      fireEvent.click(closeBtn);
    });
    expect(screen.queryByRole("dialog")).toBeNull();

    // Open dialog again and verify that navigating to next step closes it automatically
    act(() => {
      fireEvent.click(conceptChip);
    });
    expect(screen.getByRole("dialog")).toBeDefined();

    const nextBtn = screen.getByRole("button", { name: /Next step/i });
    act(() => {
      fireEvent.click(nextBtn);
    });
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("advances and steps back through playback controls", () => {
    render(
      <NetworkEpisodeShell
        episodeNumber={1}
        title="IP Addresses, Ports & Sockets"
      />
    );

    const nextBtn = screen.getByRole("button", { name: /Next step/i });
    fireEvent.click(nextBtn);

    expect(useNetworkSimulationStore.getState().currentStepIndex).toBe(1);
    expect(screen.getByText(/Step 2 of/i)).toBeDefined();
    expect(screen.getByText("Handshake 1/3")).toBeDefined();

    const prevBtn = screen.getByRole("button", { name: /Previous step/i });
    fireEvent.click(prevBtn);

    expect(useNetworkSimulationStore.getState().currentStepIndex).toBe(0);
  });

  it("switches inspector tabs between Sockets and Wire Packet with proper ARIA semantics", () => {
    render(
      <NetworkEpisodeShell
        episodeNumber={1}
        title="IP Addresses, Ports & Sockets"
      />
    );

    // Initial tab is Kernel Sockets
    expect(screen.getByText("Kernel Socket Table")).toBeDefined();
    const socketsTab = screen.getByRole("tab", { name: /Sockets/i });
    expect(socketsTab).toHaveAttribute("aria-selected", "true");

    // Switch to Wire Packet tab
    const packetTab = screen.getByRole("tab", { name: /Packet/i });
    expect(packetTab).toHaveAttribute("aria-selected", "false");
    fireEvent.click(packetTab);

    expect(packetTab).toHaveAttribute("aria-selected", "true");
    expect(screen.getByText(/No Packet on Wire/i)).toBeDefined();

    // Advance to Step 1 where a packet is in flight
    fireEvent.click(screen.getByRole("button", { name: /Next step/i }));

    expect(screen.getByText("Wire Packet Inspector")).toBeDefined();
    expect(screen.getByText(/Layer 3 · Network/i)).toBeDefined();
    expect(screen.getByText(/8-Bit TCP Flag Register/i)).toBeDefined();
  });
});
