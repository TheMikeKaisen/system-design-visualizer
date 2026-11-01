"use client";

import React, { useState } from "react";
import type { HttpStepData } from "@/lib/network-simulator/http-engine";
import {
  formatRawHttpRequest,
  formatRawHttpResponse,
} from "@/lib/network-simulator/http-engine";
import {
  FileText,
  BarChart3,
  Server,
  Clock,
  CheckCircle2,
  XCircle,
  Code,
  PanelRightClose,
  PanelRightOpen,
} from "lucide-react";

interface HttpTelemetryPanelProps {
  httpData: HttpStepData;
  activeTabOverride?: "devtools" | "waterfall" | "backend";
  onTabChange?: (tab: "devtools" | "waterfall" | "backend") => void;
  onToggleCollapse?: () => void;
  isCollapsed?: boolean;
}

type WaterfallPhase = "dns" | "tcp" | "tls" | "req" | "ttfb" | "download";
type PhaseState = "completed" | "active" | "future";

function getWaterfallPhaseState(
  phase: WaterfallPhase,
  httpData: HttpStepData
): PhaseState {
  const { client, wire, backend, waterfall } = httpData;

  // If disk cache hit: entire network pipeline was bypassed
  if (waterfall.cacheStatus === "hit") {
    return "completed";
  }

  const isReused = Boolean(waterfall.isReusedConnection);
  const fetchPhase = client.fetchPhase;
  const inFlightType = wire.inFlightPacket?.type;

  // Final step: payload parsed and UI rendered, or fetch terminated in error without packet
  if (fetchPhase === "body_parsed" || (fetchPhase === "error" && !inFlightType)) {
    return "completed";
  }

  // Response payload downloading/streaming
  if (
    fetchPhase === "streaming_body" ||
    fetchPhase === "headers_received" ||
    inFlightType === "HTTP_RESP_BODY"
  ) {
    if (phase === "download") return "active";
    return "completed";
  }

  // Server TTFB waiting / backend middleware pipeline executing
  if (
    fetchPhase === "waiting_ttfb" ||
    inFlightType === "HTTP_RESP_HEADERS" ||
    backend.edgeNginx.status === "proxying_upstream" ||
    backend.edgeNginx.status === "routing" ||
    (backend.middlewarePipeline.length > 0 &&
      backend.middlewarePipeline.some(
        (m) => m.status === "executing" || m.status === "passed"
      )) ||
    backend.databaseQuery?.status === "executing" ||
    backend.databaseQuery?.status === "hit"
  ) {
    if (phase === "ttfb") return "active";
    if (phase === "download") return "future";
    return "completed";
  }

  // Client sending request headers & body
  if (
    fetchPhase === "sending_headers" ||
    inFlightType === "HTTP_REQ" ||
    inFlightType === "OPTIONS_PREFLIGHT"
  ) {
    if (phase === "req") return "active";
    if (phase === "ttfb" || phase === "download") return "future";
    return "completed";
  }

  // TLS Handshake
  if (
    inFlightType === "TLS_HANDSHAKE" ||
    client.activeSocket.tlsVersion.includes("Handshaking")
  ) {
    if (phase === "tls") return "active";
    if (phase === "dns" || phase === "tcp") return "completed";
    return "future";
  }

  // TCP Handshake
  if (inFlightType === "TCP_SYN" || inFlightType === "TCP_RST") {
    if (phase === "tcp") return "active";
    if (phase === "dns") return "completed";
    return "future";
  }

  // DNS Lookup
  if (fetchPhase === "initiating" || inFlightType === "DNS") {
    if (phase === "dns") return isReused ? "completed" : "active";
    return "future";
  }

  if (fetchPhase === "idle") {
    return "future";
  }

  if (httpData.response) {
    if (phase === "download") return "active";
    return "completed";
  }

  return "future";
}

export function HttpTelemetryPanel({
  httpData,
  activeTabOverride,
  onTabChange,
  onToggleCollapse,
  isCollapsed = false,
}: HttpTelemetryPanelProps) {
  const [activeTab, setActiveTab] = useState<"devtools" | "waterfall" | "backend">(
    activeTabOverride ?? "devtools"
  );
  const [prevOverride, setPrevOverride] = useState(activeTabOverride);
  const [viewMode, setViewMode] = useState<"formatted" | "raw">("formatted");

  if (activeTabOverride !== undefined && activeTabOverride !== prevOverride) {
    setPrevOverride(activeTabOverride);
    setActiveTab(activeTabOverride);
  }

  const handleSelectTab = (tab: "devtools" | "waterfall" | "backend") => {
    setActiveTab(tab);
    onTabChange?.(tab);
  };

  const { request, response, waterfall, backend, client } = httpData;

  // ArrowLeft and ArrowRight are NOT captured here, reserving them globally
  // for useNetworkKeyboardShortcuts simulation navigation. Only Home and End are handled.
  const handleTabKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Home") {
      e.preventDefault();
      handleSelectTab("devtools");
      document.getElementById("tab-http-devtools")?.focus();
    } else if (e.key === "End") {
      e.preventDefault();
      handleSelectTab("backend");
      document.getElementById("tab-http-backend")?.focus();
    }
  };

  const getStatusColor = (code?: number) => {
    if (!code) return "bg-zinc-800 text-zinc-400 border-zinc-700";
    if (code >= 200 && code < 300)
      return "bg-emerald-500/15 text-emerald-300 border-emerald-500/40";
    if (code >= 300 && code < 400)
      return "bg-sky-500/15 text-sky-300 border-sky-500/40";
    if (code >= 400 && code < 500)
      return "bg-amber-500/15 text-amber-300 border-amber-500/40";
    return "bg-rose-500/15 text-rose-300 border-rose-500/40";
  };

  // Helper to render Raw ASCII text with highlighted CRLF delimiters
  const renderRawWithCrlf = (text: string) => {
    const parts = text.split(/(\\r\\n|\r\n)/g);
    return parts.map((part, i) => {
      if (part === "\\r\\n" || part === "\r\n") {
        return (
          <React.Fragment key={i}>
            <span
              className="text-amber-400/90 font-bold bg-amber-500/10 px-0.5 rounded select-all"
              title="CRLF Line Break (0x0D 0x0A)"
            >
              \r\n
            </span>
            {"\n"}
          </React.Fragment>
        );
      }
      return <span key={i}>{part}</span>;
    });
  };

  /* ──────────────── PATTERN A: Sleek Docked Micro-Rail with Status Badges ──────────────── */
  if (isCollapsed) {
    return (
      <aside
        aria-label="Telemetry Docked Rail"
        className="hidden lg:flex h-full w-full rounded-xl bg-[#080a0f] border border-border/60 flex-col items-center justify-start p-1.5 sm:p-2 gap-2 select-none font-mono shadow-sm transition-all duration-350 ease-[cubic-bezier(0.23,1,0.32,1)]"
      >
        {/* Top: Expand Toggle Button */}
        {onToggleCollapse && (
          <button
            type="button"
            onClick={onToggleCollapse}
            aria-label="Expand Telemetry Panel"
            title="Expand Telemetry Panel (T)"
            className="p-2 rounded-lg bg-zinc-900/90 hover:bg-zinc-800 active:scale-95 text-teal-400 border border-teal-500/30 hover:border-teal-500/60 transition-all focus:outline-none focus-visible:ring-1 focus-visible:ring-teal-400 touch-manipulation shrink-0"
          >
            <PanelRightOpen className="w-4 h-4" />
          </button>
        )}

        <div className="w-px h-6 lg:w-8 lg:h-px bg-zinc-800 shrink-0" />

        {/* Tab 1: DevTools */}
        <button
          type="button"
          onClick={() => {
            handleSelectTab("devtools");
            onToggleCollapse?.();
          }}
          aria-label="Expand DevTools Inspector"
          title={`DevTools Inspector (${response ? `${response.statusCode} OK` : "Pending"}) — Click to expand`}
          className={`flex flex-col items-center justify-center p-1.5 rounded-lg transition-all active:scale-95 focus:outline-none focus-visible:ring-1 focus-visible:ring-teal-400 touch-manipulation group ${
            activeTab === "devtools"
              ? "bg-zinc-800/90 text-teal-300 border border-teal-500/40 shadow-xs"
              : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/40"
          }`}
        >
          <FileText className="w-4 h-4 text-teal-400 shrink-0 group-hover:scale-110 transition-transform" />
          <span
            className={`text-[9px] font-bold mt-1 px-1 py-0.5 rounded border leading-none ${getStatusColor(
              response?.statusCode
            )}`}
          >
            {response ? response.statusCode : "REQ"}
          </span>
        </button>

        {/* Tab 2: Waterfall */}
        <button
          type="button"
          onClick={() => {
            handleSelectTab("waterfall");
            onToggleCollapse?.();
          }}
          aria-label="Expand Waterfall Gantt"
          title={`Waterfall Gantt (${waterfall.totalMs}ms) — Click to expand`}
          className={`flex flex-col items-center justify-center p-1.5 rounded-lg transition-all active:scale-95 focus:outline-none focus-visible:ring-1 focus-visible:ring-sky-400 touch-manipulation group ${
            activeTab === "waterfall"
              ? "bg-zinc-800/90 text-sky-300 border border-sky-500/40 shadow-xs"
              : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/40"
          }`}
        >
          <BarChart3 className="w-4 h-4 text-sky-400 shrink-0 group-hover:scale-110 transition-transform" />
          <span className="text-[9px] font-mono mt-1 px-1 py-0.5 rounded bg-zinc-900 text-sky-300 border border-sky-500/30 leading-none">
            {waterfall.totalMs}ms
          </span>
        </button>

        {/* Tab 3: Backend */}
        <button
          type="button"
          onClick={() => {
            handleSelectTab("backend");
            onToggleCollapse?.();
          }}
          aria-label="Expand Backend Trace"
          title={`Backend Trace (${backend.middlewarePipeline.length} gates) — Click to expand`}
          className={`flex flex-col items-center justify-center p-1.5 rounded-lg transition-all active:scale-95 focus:outline-none focus-visible:ring-1 focus-visible:ring-emerald-400 touch-manipulation group ${
            activeTab === "backend"
              ? "bg-zinc-800/90 text-emerald-300 border border-emerald-500/40 shadow-xs"
              : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/40"
          }`}
        >
          <Server className="w-4 h-4 text-emerald-400 shrink-0 group-hover:scale-110 transition-transform" />
          <span className="text-[9px] font-mono mt-1 px-1 py-0.5 rounded bg-zinc-900 text-emerald-300 border border-emerald-500/30 leading-none">
            {backend.middlewarePipeline.length}gt
          </span>
        </button>
      </aside>
    );
  }

  return (
    <div className="h-full w-full rounded-xl bg-[#080a0f] border border-border/60 flex flex-col overflow-hidden select-none font-sans shadow-sm">
      {/* ── Toolbar Header Container ── */}
      <div className="flex items-center justify-between border-b border-border/60 bg-[#0c0f17] px-2 pt-1.5 shrink-0 gap-1 overflow-x-auto">
        {/* Strictly contains role="tab" elements to comply with W3C WAI-ARIA APG */}
        <div
          role="tablist"
          aria-label="HTTP Telemetry Views"
          className="flex items-center gap-1 min-w-0 shrink-0"
        >
          {/* Tab 1: DevTools Inspector (3-Line Centered) */}
          <button
            type="button"
            id="tab-http-devtools"
            role="tab"
            aria-label="DevTools Inspector"
            aria-selected={activeTab === "devtools"}
            aria-controls="panel-http-devtools"
            tabIndex={activeTab === "devtools" ? 0 : -1}
            onClick={() => handleSelectTab("devtools")}
            onKeyDown={handleTabKeyDown}
            className={`flex flex-col items-center justify-center text-center px-2 sm:px-3 py-1.5 text-xs font-mono font-medium rounded-t-lg transition-all border-t border-x focus:outline-none focus-visible:ring-1 focus-visible:ring-teal-400 touch-manipulation shrink-0 ${
              activeTab === "devtools"
                ? "bg-[#080a0f] text-teal-300 border-border/70 border-b-transparent shadow-sm"
                : "text-zinc-400 hover:text-zinc-200 border-transparent hover:bg-zinc-800/40"
            }`}
          >
            {/* Line 1: Title */}
            <span className="flex items-center gap-1 text-[11px] font-semibold leading-tight">
              <FileText className="w-3 h-3 text-teal-400 shrink-0" />
              <span>DevTools</span>
            </span>
            {/* Line 2: Subtitle */}
            <span className="text-[10px] text-zinc-400 leading-tight">
              Inspector
            </span>
            {/* Line 3: Dedicated Status Card */}
            <span className="flex items-center justify-center mt-1">
              {response ? (
                <span
                  className={`text-[9px] font-bold px-1.5 py-0.5 rounded border ${getStatusColor(
                    response.statusCode
                  )} shadow-xs`}
                >
                  {response.statusCode} {response.statusCode === 200 ? "OK" : response.statusCode === 201 ? "Created" : response.statusCode === 304 ? "304" : ""}
                </span>
              ) : (
                <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-zinc-900 text-zinc-400 border border-zinc-800">
                  Pending
                </span>
              )}
            </span>
          </button>

          {/* Tab 2: Waterfall Gantt (3-Line Centered) */}
          <button
            type="button"
            id="tab-http-waterfall"
            role="tab"
            aria-label="Waterfall Gantt"
            aria-selected={activeTab === "waterfall"}
            aria-controls="panel-http-waterfall"
            tabIndex={activeTab === "waterfall" ? 0 : -1}
            onClick={() => handleSelectTab("waterfall")}
            onKeyDown={handleTabKeyDown}
            className={`flex flex-col items-center justify-center text-center px-2 sm:px-3 py-1.5 text-xs font-mono font-medium rounded-t-lg transition-all border-t border-x focus:outline-none focus-visible:ring-1 focus-visible:ring-teal-400 touch-manipulation shrink-0 ${
              activeTab === "waterfall"
                ? "bg-[#080a0f] text-teal-300 border-border/70 border-b-transparent shadow-sm"
                : "text-zinc-400 hover:text-zinc-200 border-transparent hover:bg-zinc-800/40"
            }`}
          >
            {/* Line 1: Title */}
            <span className="flex items-center gap-1 text-[11px] font-semibold leading-tight">
              <BarChart3 className="w-3 h-3 text-sky-400 shrink-0" />
              <span>Waterfall</span>
            </span>
            {/* Line 2: Subtitle */}
            <span className="text-[10px] text-zinc-400 leading-tight">
              Gantt
            </span>
            {/* Line 3: Dedicated Millisecond Card */}
            <span className="flex items-center justify-center mt-1">
              <span className="text-[9px] font-mono font-medium px-1.5 py-0.5 rounded bg-zinc-900 text-sky-300 border border-sky-500/30 shadow-xs flex items-center gap-1">
                <Clock className="w-2.5 h-2.5 text-sky-400 shrink-0" />
                <span>{waterfall.totalMs}ms</span>
              </span>
            </span>
          </button>

          {/* Tab 3: Backend Trace (3-Line Centered) */}
          <button
            type="button"
            id="tab-http-backend"
            role="tab"
            aria-label="Backend Trace"
            aria-selected={activeTab === "backend"}
            aria-controls="panel-http-backend"
            tabIndex={activeTab === "backend" ? 0 : -1}
            onClick={() => handleSelectTab("backend")}
            onKeyDown={handleTabKeyDown}
            className={`flex flex-col items-center justify-center text-center px-2 sm:px-3 py-1.5 text-xs font-mono font-medium rounded-t-lg transition-all border-t border-x focus:outline-none focus-visible:ring-1 focus-visible:ring-teal-400 touch-manipulation shrink-0 ${
              activeTab === "backend"
                ? "bg-[#080a0f] text-teal-300 border-border/70 border-b-transparent shadow-sm"
                : "text-zinc-400 hover:text-zinc-200 border-transparent hover:bg-zinc-800/40"
            }`}
          >
            {/* Line 1: Title */}
            <span className="flex items-center gap-1 text-[11px] font-semibold leading-tight">
              <Server className="w-3 h-3 text-emerald-400 shrink-0" />
              <span>Backend</span>
            </span>
            {/* Line 2: Subtitle */}
            <span className="text-[10px] text-zinc-400 leading-tight">
              Trace
            </span>
            {/* Line 3: Dedicated Gates Card */}
            <span className="flex items-center justify-center mt-1">
              <span className="text-[9px] font-mono font-medium px-1.5 py-0.5 rounded bg-zinc-900 text-emerald-300 border border-emerald-500/30 shadow-xs flex items-center gap-1">
                <Server className="w-2.5 h-2.5 text-emerald-400 shrink-0" />
                <span>{backend.middlewarePipeline.length} gates</span>
              </span>
            </span>
          </button>
        </div>

        {/* Actions outside role="tablist" to comply with WAI-ARIA APG */}
        <div className="flex items-center gap-1.5 pb-1 shrink-0">
          {activeTab === "devtools" && (
            <button
              type="button"
              onClick={() =>
                setViewMode(viewMode === "formatted" ? "raw" : "formatted")
              }
              aria-label={
                viewMode === "formatted" ? "Show Raw CRLF" : "Show Formatted"
              }
              title={
                viewMode === "formatted"
                  ? "Switch to Raw Wire CRLF View"
                  : "Switch to Formatted Table View"
              }
              className="text-[11px] font-mono px-2 py-0.5 rounded bg-zinc-900 hover:bg-zinc-800 active:scale-95 text-amber-300 border border-zinc-700/80 transition-all flex items-center gap-1 touch-manipulation"
            >
              <Code className="w-3 h-3 text-amber-400 shrink-0" />
              <span>
                {viewMode === "formatted" ? "Show Raw CRLF" : "Show Formatted"}
              </span>
            </button>
          )}

          {onToggleCollapse && (
            <button
              type="button"
              onClick={onToggleCollapse}
              aria-label="Collapse Telemetry Panel"
              title="Collapse Telemetry Panel (T)"
              className="p-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 active:scale-95 text-zinc-400 hover:text-teal-300 border border-border/60 transition-colors focus:outline-none focus-visible:ring-1 focus-visible:ring-teal-400 touch-manipulation shrink-0"
            >
              <PanelRightClose className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* ── Tab Content Panels ── */}
      <div className="flex-1 overflow-y-auto p-3 sm:p-4 font-mono text-xs">
        {/* ──────────────── TAB 1: Chrome DevTools HTTP Inspector ──────────────── */}
        {activeTab === "devtools" && (
          <div
            id="panel-http-devtools"
            role="tabpanel"
            aria-labelledby="tab-http-devtools"
            className="space-y-4"
          >
            {viewMode === "formatted" ? (
              <>
                {/* General Section */}
                <div className="rounded-lg bg-[#0e121b] border border-zinc-800 p-3 space-y-2">
                  <div className="text-[11px] font-bold text-teal-300 uppercase tracking-wider pb-1 border-b border-zinc-800 flex items-center justify-between">
                    <span>General</span>
                    <span className="text-[11px] text-zinc-400 font-normal">
                      HTTP/1.1 RFC 7230
                    </span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1 text-[11px]">
                    <div>
                      <span className="text-zinc-400">Request URL: </span>
                      <span className="text-zinc-200">{request.url}</span>
                    </div>
                    <div>
                      <span className="text-zinc-400">Request Method: </span>
                      <span className="text-teal-300 font-bold">
                        {request.method}
                      </span>
                    </div>
                    <div>
                      <span className="text-zinc-400">Status Code: </span>
                      {response ? (
                        <span
                          className={`font-bold px-1.5 py-0.5 rounded border text-[11px] ${getStatusColor(
                            response.statusCode
                          )}`}
                        >
                          {response.statusCode} {response.statusText}
                        </span>
                      ) : (
                        <span className="text-zinc-400 italic">
                          Pending response...
                        </span>
                      )}
                    </div>
                    <div>
                      <span className="text-zinc-400">Remote Address: </span>
                      <span className="text-zinc-300">198.51.100.1:443</span>
                    </div>
                    <div>
                      <span className="text-zinc-400">Referrer Policy: </span>
                      <span className="text-zinc-300">
                        strict-origin-when-cross-origin
                      </span>
                    </div>
                    <div>
                      <span className="text-zinc-400">TLS Session: </span>
                      <span className="text-emerald-400">
                        {client.activeSocket.tlsVersion}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Response Headers */}
                {response && (
                  <div className="rounded-lg bg-[#0e121b] border border-zinc-800 p-3 space-y-2">
                    <div className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider pb-1 border-b border-zinc-800 flex items-center justify-between">
                      <span>
                        Response Headers ({Object.keys(response.headers).length})
                      </span>
                      <span className="text-[11px] text-zinc-400 font-normal">
                        HTTP/1.1 {response.statusCode}
                      </span>
                    </div>
                    <div className="space-y-1">
                      {Object.entries(response.headers).map(([key, val]) => (
                        <div
                          key={key}
                          className="flex items-start justify-between py-0.5 border-b border-zinc-900/60 text-[11px]"
                        >
                          <span className="text-zinc-400 font-semibold">
                            {key}:
                          </span>
                          <span className="text-zinc-200 text-right truncate max-w-xs">
                            {val}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Request Headers */}
                <div className="rounded-lg bg-[#0e121b] border border-zinc-800 p-3 space-y-2">
                  <div className="text-[11px] font-bold text-sky-400 uppercase tracking-wider pb-1 border-b border-zinc-800 flex items-center justify-between">
                    <span>
                      Request Headers ({Object.keys(request.headers).length})
                    </span>
                    <span className="text-[11px] text-zinc-400 font-normal">
                      {request.method} {request.path}
                    </span>
                  </div>
                  <div className="space-y-1">
                    {Object.entries(request.headers).map(([key, val]) => (
                      <div
                        key={key}
                        className="flex items-start justify-between py-0.5 border-b border-zinc-900/60 text-[11px]"
                      >
                        <span className="text-zinc-400 font-semibold">
                          {key}:
                        </span>
                        <span className="text-zinc-200 text-right truncate max-w-xs">
                          {val}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Request Payload (if POST/PUT) */}
                {request.body && (
                  <div className="rounded-lg bg-[#0e121b] border border-zinc-800 p-3 space-y-1.5">
                    <span className="text-[11px] font-bold text-amber-400 uppercase tracking-wider block">
                      Request Payload (Body)
                    </span>
                    <pre className="text-[11px] font-mono text-zinc-300 bg-black/60 p-2.5 rounded border border-zinc-900 overflow-x-auto whitespace-pre-wrap">
                      {request.body}
                    </pre>
                  </div>
                )}

                {/* Response Body Payload */}
                <div className="rounded-lg bg-[#0e121b] border border-zinc-800 p-3 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider">
                      Response Payload (Body)
                    </span>
                    {response?.headers["Content-Length"] && (
                      <span className="text-[11px] text-zinc-400">
                        {response.headers["Content-Length"]} bytes
                      </span>
                    )}
                  </div>
                  {response?.body ? (
                    <pre className="text-[11px] font-mono text-zinc-200 bg-black/60 p-2.5 rounded border border-zinc-900 overflow-x-auto whitespace-pre-wrap leading-relaxed">
                      {response.body}
                    </pre>
                  ) : response?.statusCode === 304 ? (
                    <div className="p-3 rounded bg-sky-950/20 border border-sky-500/30 text-sky-300 text-[11px] font-sans flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-sky-400 shrink-0" />
                      <span>
                        <strong>304 Not Modified:</strong> Zero body bytes
                        transmitted over the network. Browser rehydrated payload
                        from local disk cache!
                      </span>
                    </div>
                  ) : (
                    <div className="p-3 rounded bg-zinc-900/50 border border-zinc-800 text-zinc-400 text-[11px] italic">
                      No response payload received yet for this step.
                    </div>
                  )}
                </div>
              </>
            ) : (
              /* Raw ASCII Mode with CRLF highlights */
              <div className="space-y-4">
                <div className="rounded-lg bg-[#0b0c10] border border-zinc-800 p-3 space-y-2">
                  <div className="flex items-center justify-between pb-1 border-b border-zinc-800">
                    <span className="text-xs font-bold text-sky-300 uppercase">
                      Raw Request Wire Stream
                    </span>
                    <span className="text-[11px] text-zinc-400 font-mono">
                      CRLF highlighted as{" "}
                      <span className="text-amber-400 font-bold">\r\n</span>
                    </span>
                  </div>
                  <pre className="text-[11px] font-mono text-zinc-300 bg-black/70 p-3 rounded border border-zinc-900 whitespace-pre-wrap leading-relaxed">
                    {renderRawWithCrlf(
                      request.rawAscii ?? formatRawHttpRequest(request)
                    )}
                  </pre>
                </div>

                {response && (
                  <div className="rounded-lg bg-[#0b0c10] border border-zinc-800 p-3 space-y-2">
                    <div className="flex items-center justify-between pb-1 border-b border-zinc-800">
                      <span className="text-xs font-bold text-emerald-300 uppercase">
                        Raw Response Wire Stream
                      </span>
                      <span className="text-[11px] text-zinc-400 font-mono">
                        Double{" "}
                        <span className="text-amber-400 font-bold">
                          \r\n\r\n
                        </span>{" "}
                        terminates headers
                      </span>
                    </div>
                    <pre className="text-[11px] font-mono text-zinc-300 bg-black/70 p-3 rounded border border-zinc-900 whitespace-pre-wrap leading-relaxed">
                      {renderRawWithCrlf(
                        response.rawAscii ?? formatRawHttpResponse(response)
                      )}
                    </pre>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* ──────────────── TAB 2: Request Lifecycle Waterfall Gantt ──────────────── */}
        {activeTab === "waterfall" && (
          <div
            id="panel-http-waterfall"
            role="tabpanel"
            aria-labelledby="tab-http-waterfall"
            className="space-y-4"
          >
            {/* Waterfall Summary Banner */}
            <div className="rounded-lg bg-[#0e121b] border border-zinc-800 p-3 flex flex-wrap items-center justify-between gap-2">
              <div>
                <span className="text-xs font-bold text-zinc-200">
                  Request Lifecycle Breakdown
                </span>
                <span className="text-[11px] text-zinc-400 block font-sans">
                  Total Duration:{" "}
                  <strong className="text-teal-300">
                    {waterfall.totalMs}ms
                  </strong>
                </span>
              </div>
              {waterfall.isReusedConnection && (
                <div className="px-2.5 py-1 rounded bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-[11px] font-mono">
                  ⚡ Persistent Keep-Alive connection saved ~67ms across 3 RTTs!
                </div>
              )}
              {waterfall.cacheStatus === "revalidated_304" && (
                <div className="px-2.5 py-1 rounded bg-sky-500/15 border border-sky-500/30 text-sky-300 text-[11px] font-mono">
                  📦 304 Not Modified: Body retrieved from browser cache (0 bytes
                  wire transfer)
                </div>
              )}
              {waterfall.cacheStatus === "hit" && (
                <div className="px-2.5 py-1 rounded bg-sky-500/15 border border-sky-500/30 text-sky-300 text-[11px] font-mono">
                  ⚡ Disk Cache Hit: Network dispatch bypassed entirely
                </div>
              )}
            </div>

            {/* Gantt Bar Rows with Progressive Dimming / Ghosting for Future Steps */}
            {(() => {
              const total = waterfall.totalMs > 0 ? waterfall.totalMs : 1;
              const toPct = (ms: number) =>
                Math.max(0, Math.min(100, (ms / total) * 100));

              const dnsOffset = 0;
              const dnsWidth = Math.min(100 - dnsOffset, toPct(waterfall.dnsMs));

              const tcpOffset = toPct(waterfall.dnsMs);
              const tcpWidth = Math.min(100 - tcpOffset, toPct(waterfall.tcpMs));

              const tlsOffset = toPct(waterfall.dnsMs + waterfall.tcpMs);
              const tlsWidth = Math.min(100 - tlsOffset, toPct(waterfall.tlsMs));

              const reqOffset = toPct(
                waterfall.dnsMs + waterfall.tcpMs + waterfall.tlsMs
              );
              const reqWidth = Math.min(
                100 - reqOffset,
                toPct(waterfall.requestSentMs)
              );

              const ttfbOffset = toPct(
                waterfall.dnsMs +
                  waterfall.tcpMs +
                  waterfall.tlsMs +
                  waterfall.requestSentMs
              );
              const ttfbWidth = Math.min(
                100 - ttfbOffset,
                toPct(waterfall.ttfbMs)
              );

              const dlOffset = toPct(
                waterfall.dnsMs +
                  waterfall.tcpMs +
                  waterfall.tlsMs +
                  waterfall.requestSentMs +
                  waterfall.ttfbMs
              );
              const dlWidth = Math.min(
                100 - dlOffset,
                toPct(waterfall.contentDownloadMs)
              );

              const renderGanttRow = (
                title: string,
                phaseKey: WaterfallPhase,
                ms: number,
                barColor: string,
                dotColor: string,
                offsetPct: number,
                widthPct: number,
                subtitle?: string
              ) => {
                const state = getWaterfallPhaseState(phaseKey, httpData);
                const isFuture = state === "future";
                const isActive = state === "active";

                return (
                  <div
                    className={`space-y-1 transition-all duration-300 ${
                      isFuture ? "opacity-35" : "opacity-100"
                    }`}
                  >
                    <div className="flex items-center justify-between text-[11px] font-mono">
                      <span
                        className={`font-semibold flex items-center gap-1.5 ${
                          isFuture ? "text-zinc-500" : "text-zinc-200"
                        }`}
                      >
                        <span
                          className={`w-2 h-2 rounded-full ${
                            isFuture ? "bg-zinc-700" : dotColor
                          }`}
                        />
                        <span
                          className={isFuture ? "text-zinc-500" : "text-zinc-300"}
                        >
                          {title}
                        </span>
                        {subtitle && (
                          <span className="text-[10px] text-zinc-500 hidden sm:inline">
                            ({subtitle})
                          </span>
                        )}
                        {isActive && (
                          <span className="text-[9px] font-mono px-1 py-0.5 rounded bg-teal-500/20 text-teal-300 border border-teal-500/40 animate-pulse ml-1">
                            Active
                          </span>
                        )}
                        {isFuture && (
                          <span className="text-[9px] font-mono px-1 py-0.5 rounded bg-zinc-900 text-zinc-600 border border-zinc-800 ml-1">
                            Pending
                          </span>
                        )}
                      </span>
                      <span
                        className={isFuture ? "text-zinc-600" : "text-zinc-300"}
                      >
                        {isFuture ? "—" : `${ms}ms`}
                      </span>
                    </div>
                    <div className="w-full h-3 bg-zinc-900 rounded-full overflow-hidden flex relative">
                      <div
                        className={`h-full rounded-full transition-all duration-300 ${
                          isFuture
                            ? "bg-zinc-800 border border-dashed border-zinc-700"
                            : barColor
                        } ${
                          isActive
                            ? "shadow-[0_0_10px_rgba(20,184,166,0.6)]"
                            : ""
                        }`}
                        style={{
                          marginLeft: `${offsetPct}%`,
                          width: `${Math.max(widthPct, 2)}%`,
                        }}
                      />
                    </div>
                  </div>
                );
              };

              return (
                <div className="rounded-lg bg-[#0b0d14] border border-zinc-800/90 p-3 space-y-3">
                  {/* Row 1: DNS Lookup */}
                  {renderGanttRow(
                    "DNS Lookup",
                    "dns",
                    waterfall.dnsMs,
                    "bg-sky-500",
                    "bg-sky-400",
                    dnsOffset,
                    dnsWidth
                  )}

                  {/* Row 2: Initial TCP Connection */}
                  {renderGanttRow(
                    "Initial TCP Connection",
                    "tcp",
                    waterfall.tcpMs,
                    "bg-amber-500",
                    "bg-amber-400",
                    tcpOffset,
                    tcpWidth,
                    "SYN/ACK"
                  )}

                  {/* Row 3: SSL / TLS 1.3 Key Exchange */}
                  {renderGanttRow(
                    "SSL / TLS 1.3 Key Exchange",
                    "tls",
                    waterfall.tlsMs,
                    "bg-purple-500",
                    "bg-purple-400",
                    tlsOffset,
                    tlsWidth
                  )}

                  {/* Row 4: Request Sent */}
                  {renderGanttRow(
                    "Request Sent",
                    "req",
                    waterfall.requestSentMs,
                    "bg-teal-500",
                    "bg-teal-400",
                    reqOffset,
                    reqWidth,
                    "Serialization & Wire"
                  )}

                  {/* Row 5: TTFB (Waiting for server response) */}
                  {renderGanttRow(
                    "Waiting for Server Response",
                    "ttfb",
                    waterfall.ttfbMs,
                    "bg-emerald-500",
                    "bg-emerald-400",
                    ttfbOffset,
                    ttfbWidth,
                    "TTFB"
                  )}

                  {/* Row 6: Content Download */}
                  {renderGanttRow(
                    "Content Download",
                    "download",
                    waterfall.contentDownloadMs,
                    "bg-cyan-500",
                    "bg-cyan-400",
                    dlOffset,
                    dlWidth,
                    "Body Payload Stream"
                  )}
                </div>
              );
            })()}
          </div>
        )}

        {/* ──────────────── TAB 3: Backend Middleware & DB Execution Trace ──────────────── */}
        {activeTab === "backend" && (
          <div
            id="panel-http-backend"
            role="tabpanel"
            aria-labelledby="tab-http-backend"
            className="space-y-4"
          >
            {/* Middleware Pipeline Execution Table */}
            <div className="rounded-lg bg-[#0e121b] border border-zinc-800 p-3 space-y-2">
              <div className="text-[11px] font-bold text-teal-300 uppercase tracking-wider pb-1 border-b border-zinc-800 flex items-center justify-between">
                <span>Express Middleware Pipeline Trace</span>
                <span className="text-[11px] text-zinc-400">
                  Order of Execution
                </span>
              </div>
              <div className="space-y-1.5">
                {backend.middlewarePipeline.map((m, index) => (
                  <div
                    key={m.name}
                    className="p-2 rounded bg-black/40 border border-zinc-800/80 flex items-center justify-between text-[11px]"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-zinc-400 text-[11px] w-4">
                        {index + 1}.
                      </span>
                      {m.status === "passed" && (
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                      )}
                      {m.status === "executing" && (
                        <Clock className="w-3.5 h-3.5 text-amber-400 animate-spin" />
                      )}
                      {m.status === "rejected" && (
                        <XCircle className="w-3.5 h-3.5 text-rose-400" />
                      )}
                      {m.status === "pending" && (
                        <span className="w-3.5 h-3.5 rounded-full border border-zinc-700" />
                      )}
                      <span className="font-semibold text-zinc-200">
                        {m.name}
                      </span>
                      <span className="text-[10px] px-1 py-0.5 rounded bg-zinc-800 text-zinc-400">
                        {m.role}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-zinc-400 text-[11px]">
                        {m.logMessage ?? m.status}
                      </span>
                      {m.durationMs !== undefined && (
                        <span className="text-zinc-400 text-[10px] ml-2">
                          ({m.durationMs}ms)
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Database Query Telemetry */}
            {backend.databaseQuery && (
              <div className="rounded-lg bg-[#0e121b] border border-zinc-800 p-3 space-y-2">
                <div className="text-[11px] font-bold text-sky-300 uppercase tracking-wider pb-1 border-b border-zinc-800 flex items-center justify-between">
                  <span>Database Query Execution</span>
                  <span className="text-[11px] text-zinc-400">
                    PostgreSQL v16
                  </span>
                </div>
                <div className="space-y-1 text-[11px]">
                  <div className="text-zinc-400">Query SQL:</div>
                  <pre className="text-emerald-300 bg-black/50 p-2 rounded border border-zinc-900 text-[11px] overflow-x-auto whitespace-pre-wrap">
                    {backend.databaseQuery.query}
                  </pre>
                  <div className="flex items-center justify-between pt-1 text-[11px] text-zinc-400">
                    <span>
                      Status:{" "}
                      <strong className="text-teal-300">
                        {backend.databaseQuery.status}
                      </strong>
                    </span>
                    <span>
                      Duration:{" "}
                      <strong className="text-zinc-200">
                        {backend.databaseQuery.durationMs}ms
                      </strong>
                    </span>
                  </div>
                  {backend.databaseQuery.resultPreview && (
                    <div className="pt-1">
                      <span className="text-zinc-400 text-[11px]">Result: </span>
                      <code className="text-zinc-300 text-[11px] bg-zinc-900 px-1 py-0.5 rounded">
                        {backend.databaseQuery.resultPreview}
                      </code>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Edge Nginx Diagnostic State */}
            <div className="rounded-lg bg-[#0e121b] border border-zinc-800 p-3 space-y-2">
              <div className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider pb-1 border-b border-zinc-800 flex items-center justify-between">
                <span>Nginx Reverse Proxy Diagnostics</span>
                <span className="text-[11px] text-zinc-400">Nginx 1.25.4</span>
              </div>
              <div className="text-[11px] space-y-1 text-zinc-300">
                <div className="flex items-center justify-between">
                  <span className="text-zinc-400">Proxy Status:</span>
                  <span className="font-semibold text-teal-300">
                    {backend.edgeNginx.status}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-zinc-400">Upstream Destination:</span>
                  <span>
                    {backend.edgeNginx.upstreamTarget ??
                      "http://127.0.0.1:3000"}
                  </span>
                </div>
                {backend.edgeNginx.proxyConfig && (
                  <pre className="text-[11px] font-mono text-zinc-400 bg-black/50 p-2 rounded border border-zinc-900 whitespace-pre-wrap">
                    {backend.edgeNginx.proxyConfig}
                  </pre>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
