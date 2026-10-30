import { describe, it, expect, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import HttpLifecycleEpisodePage from "../page";
import { useNetworkSimulationStore } from "@/store/useNetworkSimulationStore";
import { SCENARIO_HTTP_CANONICAL_GET } from "@/lib/network-simulator/http-scenarios";

describe("HttpLifecycleEpisodePage (Episode 4 Integration)", () => {
  beforeEach(() => {
    useNetworkSimulationStore.getState().resetEpisode(SCENARIO_HTTP_CANONICAL_GET);
  });

  it("renders episode header, Episode 4 badge, and HTTP scenario selector", () => {
    render(<HttpLifecycleEpisodePage />);

    expect(screen.getByText("Episode 4")).toBeDefined();
    expect(screen.getByRole("link", { name: /Back/i })).toHaveAttribute(
      "href",
      "/computer-networks"
    );

    const combobox = screen.getByRole("combobox");
    expect(combobox).toBeDefined();
    fireEvent.click(combobox);

    expect(
      screen.getByRole("option", { name: /Canonical GET \/api\/users\/42 \(200 OK\)/i })
    ).toBeDefined();
    expect(
      screen.getByRole("option", {
        name: /Connection Reuse & Keep-Alive \(GET \/api\/users\/42\/posts\)/i,
      })
    ).toBeDefined();
    expect(
      screen.getByRole("option", {
        name: /Resource Creation \(POST \/api\/users, 201 Created\)/i,
      })
    ).toBeDefined();
    expect(
      screen.getByRole("option", {
        name: /Auth & Routing \(401 Unauthorized vs 403 Forbidden vs 404 Not Found\)/i,
      })
    ).toBeDefined();
    expect(
      screen.getByRole("option", {
        name: /Conditional GET & Caching \(ETag, If-None-Match, 304 Not Modified\)/i,
      })
    ).toBeDefined();
    expect(
      screen.getByRole("option", {
        name: /Gateway & Upstream Failures \(502 Bad Gateway vs 504 Gateway Timeout\)/i,
      })
    ).toBeDefined();
    expect(
      screen.getByRole("option", {
        name: /Failure Boundaries \(Transport Error vs Server 500 vs CORS Block vs Preflight OPTIONS\)/i,
      })
    ).toBeDefined();
  });

  it("renders step 1 badge, tripartite glass-box horizons, and telemetry tabs", () => {
    render(<HttpLifecycleEpisodePage defaultTelemetryCollapsed={false} />);

    expect(screen.getByLabelText("Step explanation")).toBeDefined();
    expect(screen.getByText(/Step 1 of/i)).toBeDefined();
    expect(screen.getByText("Client Initiation")).toBeDefined();

    // Verify Topology Canvas Horizons
    expect(screen.getByText("Client Browser Runtime")).toBeDefined();
    expect(screen.getByText("Wire Substrate")).toBeDefined();
    expect(screen.getByText("Backend Infrastructure Stack")).toBeDefined();

    // Verify Telemetry Panel WAI-ARIA tabs
    expect(screen.getByRole("tab", { name: /DevTools Inspector/i })).toBeDefined();
    expect(screen.getByRole("tab", { name: /Waterfall Gantt/i })).toBeDefined();
    expect(screen.getByRole("tab", { name: /Backend Trace/i })).toBeDefined();
  });

  it("advances steps via Next button and renders TTFB headers & JSON body stream", () => {
    render(<HttpLifecycleEpisodePage />);

    const nextBtn = screen.getByRole("button", { name: /Next Step/i });
    expect(nextBtn).toBeDefined();

    // Step 0 -> Step 1 (Transport Setup)
    fireEvent.click(nextBtn);
    expect(screen.getByText("Connection Handshake")).toBeDefined();

    // Advance to Step 6 (Final step of Canonical GET)
    fireEvent.click(nextBtn); // Step 2
    fireEvent.click(nextBtn); // Step 3
    fireEvent.click(nextBtn); // Step 4
    fireEvent.click(nextBtn); // Step 5 (TTFB Complete)
    expect(screen.getByText("TTFB Complete")).toBeDefined();

    fireEvent.click(nextBtn); // Step 6 (Body parsed)
    expect(screen.getByText("Payload Streaming & UI Paint")).toBeDefined();

    // Verify DevTools displays 200 OK headers and parsed JSON body
    expect(screen.getAllByText(/200 OK/i).length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText(/Alice Cooper/i).length).toBeGreaterThanOrEqual(1);
  });

  it("switches telemetry tabs with proper WAI-ARIA semantics", () => {
    render(<HttpLifecycleEpisodePage defaultTelemetryCollapsed={false} />);

    const waterfallTab = screen.getByRole("tab", { name: /Waterfall Gantt/i });
    const backendTab = screen.getByRole("tab", { name: /Backend Trace/i });
    const devtoolsTab = screen.getByRole("tab", { name: /DevTools Inspector/i });

    // Switch to Waterfall Gantt
    fireEvent.click(waterfallTab);
    expect(waterfallTab).toHaveAttribute("aria-selected", "true");
    expect(devtoolsTab).toHaveAttribute("aria-selected", "false");
    expect(screen.getByRole("tabpanel", { name: /Waterfall Gantt/i })).toBeDefined();
    expect(screen.getByText("DNS Lookup")).toBeDefined();

    // Switch to Backend Trace
    fireEvent.click(backendTab);
    expect(backendTab).toHaveAttribute("aria-selected", "true");
    expect(screen.getByRole("tabpanel", { name: /Backend Trace/i })).toBeDefined();
    expect(screen.getByText("Express Middleware Pipeline Trace")).toBeDefined();
  });

  it("toggles Raw CRLF wire view in DevTools Inspector", () => {
    render(<HttpLifecycleEpisodePage defaultTelemetryCollapsed={false} />);

    const toggleRawBtn = screen.getByRole("button", { name: /Show Raw CRLF/i });
    expect(toggleRawBtn).toBeDefined();

    fireEvent.click(toggleRawBtn);
    expect(screen.getByText(/Raw Request Wire Stream/i)).toBeDefined();
    expect(screen.getByRole("button", { name: /Show Formatted/i })).toBeDefined();
  });

  it("supports keyboard navigation on telemetry tabs (Home/End) without capturing Arrow keys", () => {
    render(<HttpLifecycleEpisodePage defaultTelemetryCollapsed={false} />);

    const devtoolsTab = screen.getByRole("tab", { name: /DevTools Inspector/i });
    devtoolsTab.focus();

    // ArrowRight is NOT captured by tabs (reserved globally for step navigation)
    fireEvent.keyDown(devtoolsTab, { key: "ArrowRight" });
    expect(devtoolsTab).toHaveAttribute("aria-selected", "true");

    // End navigates to Backend Trace
    fireEvent.keyDown(devtoolsTab, { key: "End" });
    const backendTab = screen.getByRole("tab", { name: /Backend Trace/i });
    expect(backendTab).toHaveAttribute("aria-selected", "true");

    // Home navigates back to DevTools
    fireEvent.keyDown(backendTab, { key: "Home" });
    expect(devtoolsTab).toHaveAttribute("aria-selected", "true");
  });

  it("clicking in-flight packet on canvas auto-switches active telemetry tab to DevTools Inspector", () => {
    render(<HttpLifecycleEpisodePage defaultTelemetryCollapsed={false} />);

    // Step forward to Step 1 (Transport handshake packet in flight)
    const nextBtn = screen.getByRole("button", { name: /Next Step/i });
    fireEvent.click(nextBtn);

    // Switch tab away from DevTools to Waterfall Gantt
    const waterfallTab = screen.getByRole("tab", { name: /Waterfall Gantt/i });
    const devtoolsTab = screen.getByRole("tab", { name: /DevTools Inspector/i });
    fireEvent.click(waterfallTab);
    expect(waterfallTab).toHaveAttribute("aria-selected", "true");
    expect(devtoolsTab).toHaveAttribute("aria-selected", "false");

    // Click in-flight packet button in canvas
    const packetBtn = screen.getByRole("button", { name: /Inspect in-flight packet/i });
    expect(packetBtn).toBeDefined();
    fireEvent.click(packetBtn);

    // Telemetry tab should now be auto-switched back to DevTools
    expect(devtoolsTab).toHaveAttribute("aria-selected", "true");
    expect(waterfallTab).toHaveAttribute("aria-selected", "false");
  });

  it("renders complete HTTP request headers and authentic CRLF badges in raw mode", () => {
    render(<HttpLifecycleEpisodePage defaultTelemetryCollapsed={false} />);

    const toggleRawBtn = screen.getByRole("button", { name: /Show Raw CRLF/i });
    fireEvent.click(toggleRawBtn);

    // Raw stream must include full request headers formatted via formatRawHttpRequest
    const rawContainer = screen.getByText(/Raw Request Wire Stream/i).closest("div");
    expect(rawContainer).toBeDefined();
    expect(screen.getByText(/Host: api.example.com/i)).toBeDefined();
    expect(screen.getByText(/Accept: application\/json/i)).toBeDefined();
  });

  it("maximizes a horizon on demand and restores it on toggle or Esc", () => {
    render(<HttpLifecycleEpisodePage />);

    // Initially all 3 horizons are visible
    expect(screen.getByText("Client Browser Runtime")).toBeDefined();
    expect(screen.getByText("Wire Substrate")).toBeDefined();
    expect(screen.getByText("Backend Infrastructure Stack")).toBeDefined();

    // Maximize Client Horizon
    const maximizeClientBtn = screen.getByRole("button", { name: /Maximize Client Horizon/i });
    fireEvent.click(maximizeClientBtn);

    // Header now offers restore
    const restoreClientBtn = screen.getByRole("button", { name: /Restore Horizon Layout/i });
    expect(restoreClientBtn).toBeDefined();

    // Restore on Esc
    fireEvent.keyDown(window, { key: "Escape" });
    expect(screen.getByRole("button", { name: /Maximize Client Horizon/i })).toBeDefined();
  });

  it("opens and closes the centered React Live Preview modal", () => {
    render(<HttpLifecycleEpisodePage />);

    // Open modal via expand button
    const expandPreviewBtn = screen.getByRole("button", {
      name: /Expand React Live Preview/i,
    });
    fireEvent.click(expandPreviewBtn);

    // Modal dialog is present in document body with proper ARIA accessibility
    const dialog = screen.getByRole("dialog", {
      name: /React Live Preview & Parsed Response/i,
    });
    expect(dialog).toBeDefined();
    expect(screen.getByText("DOM Rendered Presentation")).toBeDefined();
    expect(screen.getByText("Complete Parsed JSON Response")).toBeDefined();

    // Close via close button
    const closeBtn = screen.getByRole("button", { name: /Close dialog/i });
    fireEvent.click(closeBtn);
    expect(screen.queryByRole("dialog", { name: /React Live Preview/i })).toBeNull();
  });

  it("opens and closes the centered Wire Substrate framing modal and verifies byte sizes", () => {
    render(<HttpLifecycleEpisodePage />);

    // Open modal via Wire header inspect button
    const inspectWireBtn = screen.getByRole("button", {
      name: /Inspect Wire Framing & Packets/i,
    });
    fireEvent.click(inspectWireBtn);

    const dialog = screen.getByRole("dialog", {
      name: /Wire Substrate & TCP\/IP Packet Framing/i,
    });
    expect(dialog).toBeDefined();
    expect(screen.getByText("Layer Encapsulation & Protocol Framing")).toBeDefined();

    // Verify explicit byte sizes telemetry
    expect(screen.getByText("Wire Stream Size:")).toBeDefined();
    expect(screen.getByText("Payload Size:")).toBeDefined();
    expect(screen.getAllByText(/bytes/i).length).toBeGreaterThanOrEqual(2);

    // Close via Escape key
    fireEvent.keyDown(window, { key: "Escape" });
    expect(screen.queryByRole("dialog", { name: /Wire Substrate/i })).toBeNull();
  });

  it("auto-dismisses active modal on step navigation (Rule #7)", () => {
    render(<HttpLifecycleEpisodePage />);

    // Open React Live Preview modal
    const expandPreviewBtn = screen.getByRole("button", {
      name: /Expand React Live Preview/i,
    });
    fireEvent.click(expandPreviewBtn);
    expect(
      screen.getByRole("dialog", { name: /React Live Preview & Parsed Response/i })
    ).toBeDefined();

    // Advance step via Next button
    const nextBtn = screen.getByRole("button", { name: /Next Step/i });
    fireEvent.click(nextBtn);

    // Modal should auto-dismiss on step navigation
    expect(
      screen.queryByRole("dialog", { name: /React Live Preview & Parsed Response/i })
    ).toBeNull();
  });

  it("renders token-based syntax highlighting in code panel", () => {
    render(<HttpLifecycleEpisodePage />);

    // UserProfile.tsx code panel renders token spans
    const fetchTokens = screen.getAllByText("fetch");
    expect(fetchTokens.some((el) => el.className.includes("text-blue-400"))).toBe(true);

    const constTokens = screen.getAllByText("const");
    expect(constTokens.some((el) => el.className.includes("text-purple-400"))).toBe(true);

    const stringTokens = screen.getAllByText((content) =>
      content.includes("https://api.example.com/api/users/42")
    );
    expect(stringTokens.some((el) => el.className.includes("text-emerald-400"))).toBe(true);
  });

  it("progressively ghosts future Waterfall Gantt bars in early steps", () => {
    render(<HttpLifecycleEpisodePage defaultTelemetryCollapsed={false} />);

    // Switch to Waterfall tab
    const waterfallTab = screen.getByRole("tab", { name: /Waterfall Gantt/i });
    fireEvent.click(waterfallTab);

    // On Step 0 (Client Initiation), DNS is active, whereas future bars (TTFB, Download) have "Pending" badges
    const pendingBadges = screen.getAllByText("Pending");
    expect(pendingBadges.length).toBeGreaterThanOrEqual(1);
  });

  it("collapses and restores HTTP telemetry panel giving full width to canvas", () => {
    render(<HttpLifecycleEpisodePage />);

    // Docked rail is visible by default with status badges (Pattern A)
    expect(screen.getByLabelText("Telemetry Docked Rail")).toBeDefined();
    expect(screen.getByRole("button", { name: /Expand DevTools Inspector/i })).toBeDefined();
    expect(screen.getByRole("button", { name: /Expand Waterfall Gantt/i })).toBeDefined();
    expect(screen.getByRole("button", { name: /Expand Backend Trace/i })).toBeDefined();

    // Click rail expand button
    const railExpandBtn = screen.getByRole("button", { name: "Expand Telemetry Panel" });
    fireEvent.click(railExpandBtn);

    // Full telemetry panel is restored with tablist
    expect(screen.queryByLabelText("Telemetry Docked Rail")).toBeNull();
    expect(screen.getByRole("tablist", { name: /HTTP Telemetry Views/i })).toBeDefined();

    // Click collapse button in HttpTelemetryPanel header
    const collapseBtn = screen.getByRole("button", { name: "Collapse Telemetry Panel" });
    fireEvent.click(collapseBtn);

    // Docked rail is visible again
    expect(screen.getByLabelText("Telemetry Docked Rail")).toBeDefined();
  });
});

