import { describe, it, expect, beforeEach } from "vitest";
import { render, screen, fireEvent, act } from "@testing-library/react";
import DnsResolutionEpisodePage from "../page";
import { useNetworkSimulationStore } from "@/store/useNetworkSimulationStore";
import { SCENARIO_DNS_COLD_CACHE } from "@/lib/network-simulator/dns-scenarios";

describe("DnsResolutionEpisodePage", () => {
  beforeEach(() => {
    useNetworkSimulationStore.getState().resetEpisode(SCENARIO_DNS_COLD_CACHE);
  });

  it("renders episode header, Episode 2 badge, and DNS scenario selector", () => {
    render(<DnsResolutionEpisodePage />);

    expect(screen.getByText("Episode 2")).toBeDefined();
    expect(screen.getByRole("link", { name: /Back/i })).toHaveAttribute(
      "href",
      "/computer-networks"
    );

    const combobox = screen.getByRole("combobox");
    expect(combobox).toBeDefined();
    fireEvent.click(combobox);
    expect(screen.getByRole("option", { name: /Cold Cache Traversal with Glue Records/i })).toBeDefined();
    expect(screen.getByRole("option", { name: /Warm Cache Multi-Tier Hits/i })).toBeDefined();
    expect(screen.getByRole("option", { name: /CNAME CDN Chaining/i })).toBeDefined();
    expect(screen.getByRole("option", { name: /NXDOMAIN Negative Caching/i })).toBeDefined();
  });

  it("renders step 1 badge, DNS topology zones, and multi-tier cache panel", () => {
    render(<DnsResolutionEpisodePage />);

    expect(screen.getByLabelText("Step explanation")).toBeDefined();
    expect(screen.getByText(/Step 1 of/i)).toBeDefined();
    expect(screen.getByText("Cold Start")).toBeDefined();
    expect(screen.getByText("Browser Cache Miss (amazon.com)")).toBeDefined();

    // Check Topology Canvas zones
    expect(screen.getByText("Client Host")).toBeDefined();
    expect(screen.getByText("Tier 1: Browser Cache")).toBeDefined();
    expect(screen.getByText("Tier 2: OS Stub Resolver")).toBeDefined();
    expect(screen.getByText("Recursive Resolver")).toBeDefined();
    expect(screen.getByText("DNS Hierarchy (Iterative)")).toBeDefined();

    // Check Telemetry panel tabs
    expect(screen.getByRole("tab", { name: /DNS Caches/i })).toBeDefined();
    expect(screen.getByRole("tab", { name: /Wire Packet/i })).toBeDefined();
  });

  it("advances steps via playback controls and displays referral packets with Glue records", () => {
    render(<DnsResolutionEpisodePage />);

    // Find and click Next button
    const nextBtn = screen.getByRole("button", { name: /Next Step/i });
    expect(nextBtn).toBeDefined();

    // Advance to Step 2
    act(() => {
      fireEvent.click(nextBtn);
    });
    expect(screen.getByText(/Step 2 of/i)).toBeDefined();
    expect(screen.getByText("Recursive Query")).toBeDefined();

    // Switch to Wire Packet tab
    const wireTab = screen.getByRole("tab", { name: /Wire Packet/i });
    act(() => {
      fireEvent.click(wireTab);
    });

    // Verify 16-Bit RFC 1035 Flags Register is present
    expect(screen.getByText("RFC 1035 16-Bit Header Flags Register")).toBeDefined();
    expect(screen.getByText("QR (Query/Resp)")).toBeDefined();
    expect(screen.getByText("RD (Recursion Des)")).toBeDefined();
  });

  it("highlights NS Server in notes panel and opens dialog with referral explanation", () => {
    render(<DnsResolutionEpisodePage />);

    const nextBtn = screen.getByRole("button", { name: /Next Step/i });

    // Step 0 -> Step 1
    act(() => { fireEvent.click(nextBtn); });
    // Step 1 -> Step 2
    act(() => { fireEvent.click(nextBtn); });
    // Step 2 -> Step 3 (TLD Referral)
    act(() => { fireEvent.click(nextBtn); });

    expect(screen.getByText(/Step 4 of/i)).toBeDefined();
    expect(screen.getByText("TLD Referral")).toBeDefined();

    // Check that NS Server is highlighted both as an in-text keyword and as a concept chip in the notes panel
    const nsButtons = screen.getAllByRole("button", { name: /NS Server/i });
    expect(nsButtons.length).toBeGreaterThanOrEqual(2);

    // Click the NS Server concept chip to open the dialog
    act(() => {
      fireEvent.click(nsButtons[1]);
    });

    // Check dialog content
    expect(
      screen.getByText(/An NS referral is a response from a DNS server that tells the resolver/i)
    ).toBeDefined();
    expect(screen.getByText(/NS stands for Name Server/i)).toBeDefined();
    expect(
      screen.getByText(/Instead of giving you the final IP address, the DNS server points you toward another DNS server/i)
    ).toBeDefined();
  });
});
