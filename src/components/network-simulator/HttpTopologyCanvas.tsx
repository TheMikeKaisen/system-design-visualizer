"use client";

import React, { useState, useEffect, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import type { HttpStepData } from "@/lib/network-simulator/http-engine";
import {
  formatRawHttpRequest,
  formatRawHttpResponse,
} from "@/lib/network-simulator/http-engine";
import {
  Globe,
  Lock,
  Unlock,
  Server,
  Database,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  XCircle,
  Code2,
  Cpu,
  Layers,
  Radio,
  Maximize2,
  Minimize2,
  X,
  Zap,
  User,
} from "lucide-react";

interface HttpTopologyCanvasProps {
  httpData: HttpStepData;
  onSelectPacket?: () => void;
}

// ─────────────────────────────────────────────────────────────
// Token-Based Syntax Highlighter for Code Panel
// ─────────────────────────────────────────────────────────────
function highlightCodeLine(line: string) {
  const trimmed = line.trim();
  if (trimmed.startsWith("//")) {
    return <span className="text-zinc-500 italic">{line}</span>;
  }

  // Tokens:
  // 1: trailing comment (//...)
  // 2: strings ('...' | "..." | `...`)
  // 3: keywords (const, await, import, return, function, etc.)
  // 4: function & method invocations (fetch, res.json, setUser, setPosts, etc.)
  // 5: numbers
  // 6: identifiers
  // 7: punctuation & whitespace
  const tokenRegex =
    /(\/\/.*$)|('(?:[^'\\]|\\.)*'|"(?:[^"\\]|\\.)*"|`(?:[^`\\]|\\.)*`)|(\b(?:const|let|var|await|async|import|from|export|return|function|try|catch|if|else|new|typeof|default)\b)|(\b(?:fetch|res\.json|setUser|setError|setPost|setPosts|headers|json|then|catch|finally)\b|\b[a-zA-Z_$][a-zA-Z0-9_$]*(?=\s*\())|(\b\d+\b)|([a-zA-Z_$][a-zA-Z0-9_$]*)|([^\s\w'"`]+|\s+|['"`])/g;

  const elements: React.ReactNode[] = [];
  let match: RegExpExecArray | null;
  let idx = 0;

  while ((match = tokenRegex.exec(line)) !== null) {
    const [, comment, str, keyword, fn, num, id, punct] = match;
    const key = `tok-${idx++}-${match.index}`;

    if (comment) {
      elements.push(
        <span key={key} className="text-zinc-500 italic">
          {comment}
        </span>
      );
    } else if (str) {
      elements.push(
        <span key={key} className="text-emerald-400 font-medium">
          {str}
        </span>
      );
    } else if (keyword) {
      elements.push(
        <span key={key} className="text-purple-400 font-semibold">
          {keyword}
        </span>
      );
    } else if (fn) {
      elements.push(
        <span key={key} className="text-blue-400 font-medium">
          {fn}
        </span>
      );
    } else if (num) {
      elements.push(
        <span key={key} className="text-amber-300">
          {num}
        </span>
      );
    } else if (id) {
      elements.push(
        <span key={key} className="text-zinc-200">
          {id}
        </span>
      );
    } else if (punct) {
      elements.push(
        <span key={key} className="text-zinc-400">
          {punct}
        </span>
      );
    }
  }

  return elements.length > 0 ? elements : line;
}

// ─────────────────────────────────────────────────────────────
// JSON Syntax Highlighter for Modal Dialog
// ─────────────────────────────────────────────────────────────
function highlightJson(jsonStr: string) {
  const regex =
    /("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+-]?\d+)?)/g;

  const parts: React.ReactNode[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  let keyIdx = 0;

  while ((match = regex.exec(jsonStr)) !== null) {
    const matchIndex = match.index;
    if (matchIndex > lastIndex) {
      parts.push(
        <span key={`txt-${keyIdx++}`} className="text-zinc-400">
          {jsonStr.substring(lastIndex, matchIndex)}
        </span>
      );
    }
    const token = match[0];
    if (/^"/.test(token)) {
      if (/:$/.test(token)) {
        parts.push(
          <span key={`k-${keyIdx++}`} className="text-cyan-300 font-semibold">
            {token}
          </span>
        );
      } else {
        parts.push(
          <span key={`s-${keyIdx++}`} className="text-emerald-400">
            {token}
          </span>
        );
      }
    } else if (/true|false/.test(token)) {
      parts.push(
        <span key={`b-${keyIdx++}`} className="text-purple-400 font-semibold">
          {token}
        </span>
      );
    } else if (/null/.test(token)) {
      parts.push(
        <span key={`n-${keyIdx++}`} className="text-rose-400 italic">
          {token}
        </span>
      );
    } else {
      parts.push(
        <span key={`num-${keyIdx++}`} className="text-amber-300 font-medium">
          {token}
        </span>
      );
    }
    lastIndex = regex.lastIndex;
  }

  if (lastIndex < jsonStr.length) {
    parts.push(
      <span key={`end-${keyIdx}`} className="text-zinc-400">
        {jsonStr.substring(lastIndex)}
      </span>
    );
  }

  return parts;
}

export function HttpTopologyCanvas({ httpData, onSelectPacket }: HttpTopologyCanvasProps) {
  const { client, wire, backend, request, response, activeRegion } = httpData;

  const isClient = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );
  const [maximizedHorizon, setMaximizedHorizon] = useState<
    "client" | "wire" | "backend" | null
  >(null);
  const [activeModal, setActiveModal] = useState<"react-preview" | "wire-substrate" | null>(
    null
  );

  // Auto-dismiss modal on step transition (Rule #7)
  const [prevHttpData, setPrevHttpData] = useState(httpData);
  if (httpData !== prevHttpData) {
    setPrevHttpData(httpData);
    setActiveModal(null);
  }

  // Escape key handler for both modal dialogs and horizon maximization
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (activeModal) {
          setActiveModal(null);
        } else if (maximizedHorizon) {
          setMaximizedHorizon(null);
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [activeModal, maximizedHorizon]);

  // Dynamic proportional flex weighting (Option A with balanced minimums)
  const getHorizonWeights = () => {
    switch (activeRegion) {
      case "client":
        return { client: 46, wire: 22, backend: 32 };
      case "wire":
        return { client: 28, wire: 44, backend: 28 };
      case "backend":
      case "proxy":
        return { client: 26, wire: 22, backend: 52 };
      case "all":
      default:
        return { client: 38, wire: 24, backend: 38 };
    }
  };

  const weights = getHorizonWeights();

  const getMethodBadgeColor = (method: string) => {
    switch (method) {
      case "GET":
        return "bg-sky-500/20 text-sky-400 border-sky-500/40";
      case "POST":
        return "bg-emerald-500/20 text-emerald-400 border-emerald-500/40";
      case "PUT":
        return "bg-amber-500/20 text-amber-400 border-amber-500/40";
      case "DELETE":
        return "bg-rose-500/20 text-rose-400 border-rose-500/40";
      case "OPTIONS":
        return "bg-purple-500/20 text-purple-400 border-purple-500/40";
      default:
        return "bg-zinc-800 text-zinc-300 border-zinc-700";
    }
  };

  const getRegionCardGlow = (region: "client" | "wire" | "proxy" | "backend") => {
    if (activeRegion === "all" || activeRegion === region) {
      return "ring-1 ring-teal-500/40 shadow-[0_0_15px_rgba(20,184,166,0.15)]";
    }
    return "opacity-90 hover:opacity-100 transition-opacity";
  };

  const isWireActive = Boolean(wire.inFlightPacket);

  // Formatted JSON string for response payload inspection
  let formattedJsonPayload = response?.body;
  if (response?.body) {
    try {
      formattedJsonPayload = JSON.stringify(JSON.parse(response.body), null, 2);
    } catch {
      // Keep as-is if not valid JSON
    }
  }

  // Exact wire frame byte size telemetry for Wire Substrate Modal & inspection
  const activeWireAscii =
    wire.inFlightPacket?.direction.includes("server-to-client") && response
      ? response.rawAscii ?? formatRawHttpResponse(response)
      : request.rawAscii ?? formatRawHttpRequest(request);
  const activeWireStreamBytes = new TextEncoder().encode(activeWireAscii).length;
  const activePayloadBytes =
    wire.inFlightPacket?.direction.includes("server-to-client") && response?.body
      ? new TextEncoder().encode(response.body).length
      : request.body
      ? new TextEncoder().encode(request.body).length
      : 0;
  const activeHeaderBytes = Math.max(0, activeWireStreamBytes - activePayloadBytes);

  return (
    <div className="h-full w-full rounded-xl bg-[#06080d] border border-border/60 p-3 sm:p-4 flex flex-col justify-between overflow-y-auto overflow-x-hidden select-none relative font-sans shadow-sm gap-3">
      {/* ── Top Bar: 4-Tuple and Region Context ── */}
      <div className="flex flex-wrap items-center justify-between gap-2 pb-2.5 border-b border-border/40 font-mono text-xs shrink-0">
        <div className="flex items-center gap-2 min-w-0">
          <span className="w-2 h-2 rounded-full bg-teal-400 shadow-[0_0_8px_rgba(20,184,166,0.6)] shrink-0" />
          <span className="text-zinc-200 font-semibold uppercase tracking-wider text-[11px] sm:text-xs truncate">
            HTTP Lifecycle Glass-Box
          </span>
          <span className="text-zinc-400 hidden sm:inline">|</span>
          <span className="text-zinc-400 text-[11px] sm:text-xs truncate">
            {client.activeSocket.localPort} ↔ 198.51.100.1:443
          </span>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {wire.connectionReuse ? (
            <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              Keep-Alive Reused
            </span>
          ) : (
            <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-400 border border-zinc-700/60">
              Cold Connection
            </span>
          )}
          <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-zinc-900 text-teal-400 border border-teal-500/30">
            {client.activeSocket.tlsVersion}
          </span>
        </div>
      </div>

      {/* ── Main Stage: 3 Dynamic Horizons (Client, Wire, Backend) ── */}
      <div className="grid grid-cols-1 lg:flex gap-3 flex-1 items-stretch min-h-0 w-full overflow-hidden">
        {/* ──────────────── Horizon 1: Client Browser Runtime ──────────────── */}
        <div
          style={{
            flex:
              maximizedHorizon === "client"
                ? "1 1 100%"
                : `${weights.client} 1 0%`,
          }}
          className={`w-full min-w-0 rounded-lg bg-[#0b0d14] border border-zinc-800/80 p-3 sm:p-3.5 flex flex-col justify-between gap-2.5 transition-all duration-300 ease-out ${
            maximizedHorizon !== null && maximizedHorizon !== "client"
              ? "hidden"
              : ""
          } ${getRegionCardGlow("client")}`}
        >
          {/* Client Header (2-Row Layout to prevent host IP overflow) */}
          <div className="flex flex-col gap-1 pb-2 border-b border-zinc-800/60 shrink-0">
            <div className="flex items-center justify-between gap-1.5 min-w-0">
              <div className="flex items-center gap-2 min-w-0">
                <Globe className="w-4 h-4 text-sky-400 shrink-0" />
                <span className="text-xs font-bold text-zinc-200 font-mono truncate">
                  Client Browser Runtime
                </span>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <button
                  type="button"
                  onClick={() =>
                    setMaximizedHorizon(
                      maximizedHorizon === "client" ? null : "client"
                    )
                  }
                  aria-label={
                    maximizedHorizon === "client"
                      ? "Restore Horizon Layout"
                      : "Maximize Client Horizon"
                  }
                  title={
                    maximizedHorizon === "client"
                      ? "Restore 3-horizon layout (Esc)"
                      : "Maximize Client Horizon"
                  }
                  className="p-1 rounded text-zinc-400 hover:text-teal-300 hover:bg-zinc-800 transition-colors focus:outline-none focus-visible:ring-1 focus-visible:ring-teal-400 touch-manipulation"
                >
                  {maximizedHorizon === "client" ? (
                    <Minimize2 className="w-3.5 h-3.5" />
                  ) : (
                    <Maximize2 className="w-3.5 h-3.5" />
                  )}
                </button>
              </div>
            </div>
            <div className="flex items-center justify-between text-[10px] font-mono text-zinc-400 min-w-0">
              <span className="text-zinc-500">Interface</span>
              <span className="px-1.5 py-0.5 rounded bg-zinc-900 text-sky-300 border border-zinc-800 shrink-0 font-medium">
                en0: 192.168.1.10
              </span>
            </div>
          </div>

          {/* Mock Browser URL Bar */}
          <div className="rounded-md bg-zinc-950 p-2 border border-zinc-800/90 flex items-center gap-2 text-xs font-mono">
            {client.activeSocket.tlsVersion.includes("TLS") ? (
              <Lock className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            ) : (
              <Unlock className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
            )}
            <span
              className={`text-[11px] uppercase font-bold px-1.5 py-0.5 rounded border shrink-0 ${getMethodBadgeColor(
                request.method
              )}`}
            >
              {request.method}
            </span>
            <span className="text-zinc-300 truncate text-[11px]">{client.url}</span>
          </div>

          {/* 2-Phase Fetch Status Badge */}
          <div className="rounded-md bg-[#0e121b] p-2 border border-zinc-800 flex flex-col gap-1">
            <div className="flex items-center justify-between text-[11px] font-mono">
              <span className="text-zinc-400 uppercase tracking-wider font-semibold">
                Fetch API Lifecycle
              </span>
              <span
                className={`px-1.5 py-0.5 rounded font-bold uppercase text-[11px] ${
                  client.fetchPhase === "error"
                    ? "bg-rose-500/20 text-rose-400 border border-rose-500/30"
                    : client.fetchPhase === "body_parsed"
                    ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                    : "bg-teal-500/20 text-teal-300 border border-teal-500/30"
                }`}
              >
                {client.fetchPhase.replace("_", " ")}
              </span>
            </div>
            <p className="text-[11px] text-zinc-300 font-sans leading-tight">
              {client.phaseDescription ?? "Awaiting network dispatch..."}
            </p>
          </div>

          {/* Code Spotlight: Client fetch() with token-based syntax highlighting */}
          <div className="rounded-md bg-black/60 p-2.5 border border-zinc-800/90 font-mono text-[11px] overflow-hidden">
            <div className="flex items-center justify-between text-zinc-400 pb-1 mb-1 border-b border-zinc-800/50 text-[11px]">
              <span className="flex items-center gap-1.5 font-semibold text-teal-300">
                <Code2 className="w-3.5 h-3.5 text-teal-400" />
                {client.reactState.componentName}.tsx
              </span>
              <span className="text-zinc-400">JavaScript Runtime</span>
            </div>
            <div className="text-zinc-300 leading-relaxed font-mono text-[11px] overflow-x-auto">
              {client.reactState.codeSnippet.split("\n").map((line, idx) => {
                const lineNum = idx + 1;
                const isHighlighted = client.reactState.highlightedLine === lineNum;
                return (
                  <div
                    key={lineNum}
                    className={`flex items-center gap-2 px-1.5 py-0.5 rounded transition-colors whitespace-pre font-mono ${
                      isHighlighted
                        ? "bg-teal-500/20 text-teal-200 border-l-2 border-teal-400 font-semibold"
                        : "hover:bg-zinc-900/40"
                    }`}
                  >
                    <span className="text-zinc-500 select-none text-[11px] w-4 text-right font-mono shrink-0">
                      {lineNum}
                    </span>
                    <span className="whitespace-pre font-mono text-[11px]">{highlightCodeLine(line)}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* React Component Live Preview with Centered Modal Trigger */}
          <div className="rounded-md bg-zinc-950/80 p-2.5 border border-zinc-800/90 flex flex-col gap-2">
            <div className="flex items-center justify-between text-[11px] font-mono text-zinc-400">
              <span className="font-semibold text-zinc-300">React Live Preview</span>
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] font-mono text-teal-400">
                  &lt;{client.reactState.componentName} /&gt;
                </span>
                <button
                  type="button"
                  onClick={() => setActiveModal("react-preview")}
                  aria-label="Expand React Live Preview & JSON Response"
                  title="Open Centered Modal with Full JSON Response & DOM Preview"
                  aria-haspopup="dialog"
                  aria-expanded={activeModal === "react-preview"}
                  className="p-1 rounded text-zinc-400 hover:text-teal-300 hover:bg-zinc-800 transition-colors focus:outline-none focus-visible:ring-1 focus-visible:ring-teal-400 touch-manipulation"
                >
                  <Maximize2 className="w-3 h-3" />
                </button>
              </div>
            </div>

            {/* Reactive State Badge */}
            <div className="flex items-center justify-between text-[10px] font-mono px-2 py-1 rounded bg-black/50 border border-zinc-800/70">
              <span className="text-zinc-500">React State</span>
              <span className="text-teal-300 font-medium">
                &#123; loading: {client.reactState.componentState === "loading" ? "true" : "false"}, user:{" "}
                {client.reactState.componentState === "success" ? "Object" : "null"} &#125;
              </span>
            </div>

            {client.reactState.componentState === "loading" && (
              <div className="space-y-2 py-0.5">
                {/* Realistic DOM Skeleton Card */}
                <div className="flex items-center gap-2.5 p-2 rounded bg-zinc-900/60 border border-zinc-800/80">
                  <div className="w-7 h-7 rounded-full bg-zinc-800 border border-zinc-700/60 animate-pulse shrink-0 flex items-center justify-center">
                    <User className="w-3.5 h-3.5 text-zinc-600" />
                  </div>
                  <div className="flex-1 space-y-1.5 min-w-0">
                    <div className="h-2.5 w-24 bg-zinc-800 rounded animate-pulse" />
                    <div className="h-2 w-32 bg-zinc-800/60 rounded animate-pulse" />
                  </div>
                </div>
                {/* Executed Code Feedback */}
                <div className="p-1.5 rounded bg-black/60 border border-zinc-800/90 font-mono text-[10px] text-zinc-400 overflow-x-auto whitespace-pre">
                  <span className="text-purple-400 font-semibold">if</span> (loading) <span className="text-purple-400 font-semibold">return</span> &lt;<span className="text-sky-300">SkeletonLoader</span> <span className="text-teal-300">status</span>=<span className="text-emerald-400">&quot;Streaming...&quot;</span> /&gt;;
                </div>
                <span className="text-[10px] text-zinc-400 font-mono flex items-center gap-1.5">
                  <Radio className="w-2.5 h-2.5 text-teal-400 animate-spin" />
                  <span>Streaming response...</span>
                </span>
              </div>
            )}

            {client.reactState.componentState === "success" && (
              <div className="space-y-2 py-0.5">
                {/* Rendered DOM Profile Card */}
                <div className="flex items-center gap-2.5 p-2 rounded bg-emerald-950/20 border border-emerald-500/30">
                  <div className="w-7 h-7 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 font-bold text-xs flex items-center justify-center shrink-0">
                    AC
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-emerald-200 text-xs truncate">
                        Alice Cooper
                      </span>
                      <span className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-mono">
                        200 OK
                      </span>
                    </div>
                    <div className="text-[10px] text-zinc-300 truncate font-mono">
                      Component Rendered: {client.reactState.dataPreview ?? "Payload rendered into DOM"}
                    </div>
                  </div>
                </div>
                {/* Executed Code Feedback */}
                <div className="p-1.5 rounded bg-black/60 border border-zinc-800/90 font-mono text-[10px] text-zinc-400 overflow-x-auto whitespace-pre">
                  <span className="text-purple-400 font-semibold">return</span> &lt;<span className="text-sky-300">UserProfileCard</span> <span className="text-teal-300">user</span>=&#123;user&#125; /&gt;;
                </div>
              </div>
            )}

            {client.reactState.componentState === "error" && (
              <div className="space-y-2 py-0.5">
                <div className="flex items-center gap-2.5 p-2 rounded bg-rose-950/20 border border-rose-500/30">
                  <div className="w-7 h-7 rounded-full bg-rose-500/20 border border-rose-500/40 text-rose-300 font-bold text-xs flex items-center justify-center shrink-0">
                    <XCircle className="w-4 h-4 text-rose-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="font-semibold text-rose-200 text-xs block">
                      Component Error State:
                    </span>
                    <span className="text-[10px] text-zinc-300 truncate font-mono">
                      {client.reactState.errorPreview ?? "Fetch rejected or failed"}
                    </span>
                  </div>
                </div>
                {/* Executed Code Feedback */}
                <div className="p-1.5 rounded bg-black/60 border border-zinc-800/90 font-mono text-[10px] text-zinc-400 overflow-x-auto whitespace-pre">
                  <span className="text-purple-400 font-semibold">return</span> &lt;<span className="text-rose-300">ErrorAlert</span> <span className="text-teal-300">msg</span>=&#123;err&#125; /&gt;;
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ──────────────── Horizon 2: Network Wire Conduit ──────────────── */}
        <div
          style={{
            flex:
              maximizedHorizon === "wire"
                ? "1 1 100%"
                : `${weights.wire} 1 0%`,
          }}
          className={`w-full min-w-0 rounded-lg bg-[#080b12] border border-zinc-800/80 p-2.5 flex flex-col justify-between gap-2 transition-all duration-300 ease-out ${
            maximizedHorizon !== null && maximizedHorizon !== "wire"
              ? "hidden"
              : ""
          } ${getRegionCardGlow("wire")}`}
        >
          {/* Wire Header (2-Row Layout to prevent host IP/port overflow) */}
          <div className="flex flex-col gap-1 pb-1.5 border-b border-zinc-800/60 shrink-0">
            <div className="flex items-center justify-between gap-1 min-w-0">
              <div className="flex items-center gap-1.5 min-w-0">
                <Layers className="w-3.5 h-3.5 text-teal-400 shrink-0" />
                <span className="text-[11px] font-bold text-zinc-200 font-mono truncate">
                  Wire Substrate
                </span>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <button
                  type="button"
                  onClick={() => setActiveModal("wire-substrate")}
                  aria-label="Inspect Wire Framing & Packets"
                  title="Inspect Wire Substrate & TCP/IP Framing"
                  aria-haspopup="dialog"
                  aria-expanded={activeModal === "wire-substrate"}
                  className="p-1 rounded text-zinc-400 hover:text-teal-300 hover:bg-zinc-800 transition-colors focus:outline-none focus-visible:ring-1 focus-visible:ring-teal-400 touch-manipulation"
                >
                  <Layers className="w-3 h-3" />
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setMaximizedHorizon(maximizedHorizon === "wire" ? null : "wire")
                  }
                  aria-label={
                    maximizedHorizon === "wire"
                      ? "Restore Horizon Layout"
                      : "Maximize Wire Horizon"
                  }
                  title={
                    maximizedHorizon === "wire"
                      ? "Restore 3-horizon layout (Esc)"
                      : "Maximize Wire Horizon"
                  }
                  className="p-1 rounded text-zinc-400 hover:text-teal-300 hover:bg-zinc-800 transition-colors focus:outline-none focus-visible:ring-1 focus-visible:ring-teal-400 touch-manipulation"
                >
                  {maximizedHorizon === "wire" ? (
                    <Minimize2 className="w-3.5 h-3.5" />
                  ) : (
                    <Maximize2 className="w-3.5 h-3.5" />
                  )}
                </button>
              </div>
            </div>
            <div className="flex items-center justify-between text-[10px] font-mono text-zinc-400 min-w-0">
              <span className="text-zinc-500">Conduit</span>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-zinc-900 text-teal-300 border border-zinc-800 shrink-0 font-medium">
                TCP 443
              </span>
            </div>
          </div>

          {/* Wire Conduit & Active In-Flight Packet (GPU-Composited scaleX) */}
          <div className="flex-1 flex flex-col items-center justify-center p-2 rounded bg-black/40 border border-zinc-900 relative min-h-[140px]">
            {/* Horizontal transit bus line with GPU transform */}
            <div className="w-full h-0.5 bg-zinc-800 absolute top-1/2 -translate-y-1/2 left-0 right-0 z-0 overflow-hidden">
              <div
                className={`h-full w-full transition-transform duration-300 ease-out will-change-transform ${
                  isWireActive
                    ? "bg-teal-500 shadow-[0_0_10px_rgba(20,184,166,0.8)]"
                    : "bg-transparent"
                }`}
                style={{
                  transform: `scaleX(${
                    isWireActive
                      ? (wire.inFlightPacket?.progressPct ?? 50) / 100
                      : 0
                  })`,
                  transformOrigin: "left",
                }}
              />
            </div>

            {wire.inFlightPacket ? (
              <button
                type="button"
                onClick={() => {
                  onSelectPacket?.();
                  setActiveModal("wire-substrate");
                }}
                className="z-10 w-full p-2.5 rounded-lg bg-zinc-900/95 border border-teal-500/50 shadow-[0_4px_20px_rgba(0,0,0,0.8)] hover:border-teal-400 hover:scale-[1.02] active:scale-[0.98] transition-all text-left flex flex-col gap-1 focus:outline-none focus-visible:ring-1 focus-visible:ring-teal-400 touch-manipulation"
                aria-label={`Inspect in-flight packet ${wire.inFlightPacket.label}`}
                aria-haspopup="dialog"
                aria-expanded={activeModal === "wire-substrate"}
              >
                <div className="flex items-center justify-between text-[11px] font-mono">
                  <span className="flex items-center gap-1 text-teal-300 font-semibold truncate">
                    {wire.inFlightPacket.direction.includes("client-to") ? (
                      <ArrowRight className="w-3 h-3 text-teal-400 shrink-0" />
                    ) : (
                      <ArrowLeft className="w-3 h-3 text-teal-400 shrink-0" />
                    )}
                    {wire.inFlightPacket.protocol}
                  </span>
                  <div className="flex items-center gap-1.5 shrink-0">
                    {wire.inFlightPacket.isEncrypted && (
                      <span className="text-[10px] text-emerald-400 font-mono flex items-center gap-0.5">
                        <Lock className="w-2.5 h-2.5" />
                        TLS
                      </span>
                    )}
                    <Maximize2 className="w-3 h-3 text-zinc-400" />
                  </div>
                </div>
                <div className="text-[11px] font-mono font-semibold text-zinc-100 truncate">
                  {wire.inFlightPacket.label}
                </div>
                <div className="text-[11px] text-zinc-300 font-sans line-clamp-2">
                  {wire.inFlightPacket.summary}
                </div>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setActiveModal("wire-substrate")}
                className="z-10 text-center text-zinc-400 hover:text-teal-300 text-[11px] font-mono p-2 rounded hover:bg-zinc-900/40 transition-colors focus:outline-none focus-visible:ring-1 focus-visible:ring-teal-400"
                aria-label="Inspect Wire Framing"
                aria-haspopup="dialog"
                aria-expanded={activeModal === "wire-substrate"}
              >
                [ Wire Idle — Click to Inspect Framing ]
              </button>
            )}
          </div>

          {/* Wire Encapsulation Info */}
          <div className="rounded bg-zinc-950/70 p-2 border border-zinc-900 text-[11px] font-mono space-y-1">
            <div className="flex items-center justify-between text-zinc-400">
              <span>Stack:</span>
              <span className="text-teal-300">TCP &gt; TLS &gt; HTTP</span>
            </div>
            <div className="flex items-center justify-between text-zinc-400">
              <span>CRLF:</span>
              <span className="text-amber-300">\r\n\r\n</span>
            </div>
          </div>
        </div>

        {/* ──────────────── Horizon 3: Backend Infrastructure Stack ──────────────── */}
        <div
          style={{
            flex:
              maximizedHorizon === "backend"
                ? "1 1 100%"
                : `${weights.backend} 1 0%`,
          }}
          className={`w-full min-w-0 rounded-lg bg-[#0b0d14] border border-zinc-800/80 p-3 sm:p-3.5 flex flex-col justify-between gap-2.5 transition-all duration-300 ease-out ${
            maximizedHorizon !== null && maximizedHorizon !== "backend"
              ? "hidden"
              : ""
          } ${getRegionCardGlow("backend")}`}
        >
          {/* Backend Stack Header (2-Row Layout to prevent host IP overflow) */}
          <div className="flex flex-col gap-1 pb-2 border-b border-zinc-800/60 shrink-0">
            <div className="flex items-center justify-between gap-1.5 min-w-0">
              <div className="flex items-center gap-1.5 min-w-0">
                <Server className="w-4 h-4 text-emerald-400 shrink-0" />
                <span className="text-xs font-bold text-zinc-200 font-mono truncate">
                  Backend Infrastructure Stack
                </span>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <button
                  type="button"
                  onClick={() =>
                    setMaximizedHorizon(
                      maximizedHorizon === "backend" ? null : "backend"
                    )
                  }
                  aria-label={
                    maximizedHorizon === "backend"
                      ? "Restore Horizon Layout"
                      : "Maximize Backend Horizon"
                  }
                  title={
                    maximizedHorizon === "backend"
                      ? "Restore 3-horizon layout (Esc)"
                      : "Maximize Backend Horizon"
                  }
                  className="p-1 rounded text-zinc-400 hover:text-teal-300 hover:bg-zinc-800 transition-colors focus:outline-none focus-visible:ring-1 focus-visible:ring-teal-400 touch-manipulation"
                >
                  {maximizedHorizon === "backend" ? (
                    <Minimize2 className="w-3.5 h-3.5" />
                  ) : (
                    <Maximize2 className="w-3.5 h-3.5" />
                  )}
                </button>
              </div>
            </div>
            <div className="flex items-center justify-between text-[10px] font-mono text-zinc-400 min-w-0">
              <span className="text-zinc-500">Origin Host</span>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-zinc-900 text-emerald-300 border border-zinc-800 truncate shrink-0 font-medium">
                Host: 198.51.100.1
              </span>
            </div>
          </div>

          {/* Edge Nginx Reverse Proxy Card */}
          <div className="rounded-md bg-zinc-950 p-2 border border-zinc-800/90 flex flex-col gap-1">
            <div className="flex items-center justify-between text-[11px] font-mono">
              <span className="text-emerald-400 font-semibold flex items-center gap-1">
                <Cpu className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                Edge Nginx Proxy (:443)
              </span>
              <span
                className={`text-[11px] px-1.5 py-0.5 rounded font-bold uppercase ${
                  backend.edgeNginx.status.includes("error") ||
                  backend.edgeNginx.status.includes("timeout")
                    ? "bg-rose-500/20 text-rose-300 border border-rose-500/30"
                    : backend.edgeNginx.status === "proxying_upstream"
                    ? "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                    : "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                }`}
              >
                {backend.edgeNginx.status.replace("_", " ")}
              </span>
            </div>
            <div className="text-[11px] font-mono text-zinc-400 flex flex-wrap items-center justify-between gap-1 min-w-0">
              <span className="truncate">
                proxy_pass: {backend.edgeNginx.upstreamTarget ?? "http://127.0.0.1:3000"}
              </span>
              <span className="text-zinc-400 shrink-0">SSL Terminated</span>
            </div>
            {backend.edgeNginx.proxyConfig && (
              <pre className="text-[11px] font-mono text-zinc-400 bg-black/50 p-1 rounded overflow-x-auto whitespace-pre-wrap">
                {backend.edgeNginx.proxyConfig}
              </pre>
            )}
          </div>

          {/* Express Middleware Gate Pipeline */}
          <div className="rounded-md bg-[#090b10] p-2 border border-zinc-800 flex flex-col gap-1.5">
            <div className="flex items-center justify-between text-[11px] font-mono text-zinc-400">
              <span className="font-semibold text-zinc-300">
                Express App Server (:3000) Pipeline:
              </span>
              <span>Node.js v20</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {backend.middlewarePipeline.map((m) => {
                let badgeColor = "bg-zinc-800/80 text-zinc-400 border-zinc-700/50";
                let icon = <span className="w-1.5 h-1.5 rounded-full bg-zinc-500" />;
                if (m.status === "executing") {
                  badgeColor =
                    "bg-amber-500/20 text-amber-300 border-amber-500/40 animate-pulse";
                  icon = <Radio className="w-2.5 h-2.5 text-amber-400 animate-spin" />;
                } else if (m.status === "passed") {
                  badgeColor = "bg-emerald-500/15 text-emerald-300 border-emerald-500/30";
                  icon = <CheckCircle2 className="w-2.5 h-2.5 text-emerald-400" />;
                } else if (m.status === "rejected") {
                  badgeColor = "bg-rose-500/20 text-rose-300 border-rose-500/40";
                  icon = <XCircle className="w-2.5 h-2.5 text-rose-400" />;
                }

                return (
                  <div
                    key={m.name}
                    className={`text-[11px] font-mono px-2 py-0.5 rounded border flex items-center gap-1 ${badgeColor}`}
                    title={m.logMessage}
                  >
                    {icon}
                    <span>{m.name}</span>
                    {m.durationMs !== undefined && (
                      <span className="text-[10px] text-zinc-400">{m.durationMs}ms</span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Database Query Card */}
          {backend.databaseQuery ? (
            <div className="rounded-md bg-zinc-950 p-2 border border-zinc-800/90 flex flex-col gap-1">
              <div className="flex flex-wrap items-center justify-between gap-1 text-[11px] font-mono">
                <span className="text-sky-400 font-semibold flex items-center gap-1 shrink-0">
                  <Database className="w-3.5 h-3.5 text-sky-400" />
                  PostgreSQL (:5432)
                </span>
                <span
                  className={`text-[11px] px-1.5 py-0.5 rounded font-mono shrink-0 ${
                    backend.databaseQuery.status === "hit"
                      ? "bg-emerald-500/20 text-emerald-300"
                      : backend.databaseQuery.status === "timeout"
                      ? "bg-rose-500/20 text-rose-300"
                      : "bg-amber-500/20 text-amber-300"
                  }`}
                >
                  {backend.databaseQuery.status} ({backend.databaseQuery.durationMs}ms)
                </span>
              </div>
              <code className="text-[11px] font-mono text-zinc-300 bg-black/40 p-1 rounded truncate">
                {backend.databaseQuery.query}
              </code>
            </div>
          ) : (
            <div className="rounded-md bg-zinc-950/60 p-2 border border-zinc-800/60 flex flex-wrap items-center justify-between gap-1 text-[11px] font-mono text-zinc-400">
              <span className="flex items-center gap-1 text-zinc-300 shrink-0">
                <Database className="w-3.5 h-3.5 text-zinc-400" />
                PostgreSQL (:5432)
              </span>
              <span className="text-[11px] text-zinc-400 truncate">Pool Idle / Awaiting Query</span>
            </div>
          )}
        </div>
      </div>

      {/* ──────────────── Centered Floating Modal: React Live Preview & Full JSON ──────────────── */}
      {isClient &&
        activeModal === "react-preview" &&
        createPortal(
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-md p-4 animate-in fade-in-0 duration-150"
            onClick={() => setActiveModal(null)}
          >
            <div
              role="dialog"
              aria-modal="true"
              aria-labelledby="react-live-preview-title"
              className="bg-[#0b0e17] border border-teal-500/40 rounded-xl shadow-[0_20px_60px_rgba(0,0,0,0.85)] max-w-2xl w-full max-h-[85vh] flex flex-col overflow-hidden text-zinc-200 animate-in zoom-in-95 duration-150 font-sans"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between px-5 py-3.5 border-b border-zinc-800/80 bg-zinc-900/60">
                <div className="flex items-center gap-2">
                  <Code2 className="w-4 h-4 text-teal-400 shrink-0" />
                  <div>
                    <h3
                      id="react-live-preview-title"
                      className="text-sm font-bold font-mono text-zinc-100 flex items-center gap-2"
                    >
                      <span>React Live Preview & Parsed Response</span>
                    </h3>
                    <p className="text-[11px] font-mono text-zinc-400">
                      Component: &lt;{client.reactState.componentName} /&gt; (Phase:{" "}
                      <span className="text-teal-300 font-semibold">{client.fetchPhase}</span>)
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveModal(null)}
                  className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 transition-colors focus:outline-none focus-visible:ring-1 focus-visible:ring-teal-400 touch-manipulation"
                  aria-label="Close dialog"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Modal Body */}
              <div className="p-5 overflow-y-auto space-y-4 custom-scrollbar text-xs">
                {/* DOM Preview Section */}
                <div className="rounded-lg bg-zinc-950 p-3.5 border border-zinc-800 space-y-2">
                  <div className="flex items-center justify-between text-[11px] font-mono text-zinc-400 pb-1 border-b border-zinc-800/60">
                    <span className="font-semibold text-teal-300 uppercase tracking-wider">
                      DOM Rendered Presentation
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded font-bold uppercase text-[10px] ${
                        client.reactState.componentState === "success"
                          ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                          : client.reactState.componentState === "error"
                          ? "bg-rose-500/20 text-rose-300 border border-rose-500/30"
                          : "bg-teal-500/20 text-teal-300 border border-teal-500/30"
                      }`}
                    >
                      {client.reactState.componentState}
                    </span>
                  </div>

                  {client.reactState.componentState === "loading" && (
                    <div className="p-4 rounded bg-zinc-900/60 space-y-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-zinc-800 border border-zinc-700/60 animate-pulse shrink-0 flex items-center justify-center">
                          <User className="w-5 h-5 text-zinc-600" />
                        </div>
                        <div className="flex-1 space-y-2">
                          <div className="h-3 w-1/3 bg-zinc-800 rounded animate-pulse" />
                          <div className="h-2.5 w-1/2 bg-zinc-800/70 rounded animate-pulse" />
                        </div>
                      </div>
                      <div className="p-2 rounded bg-black/60 border border-zinc-800 font-mono text-[11px] text-zinc-400">
                        <span className="text-zinc-500 block text-[10px] pb-1 uppercase tracking-wider font-semibold">Active React JSX Output:</span>
                        <span className="text-purple-400 font-semibold">if</span> (loading) <span className="text-purple-400 font-semibold">return</span> &lt;<span className="text-sky-300">SkeletonLoader</span> <span className="text-teal-300">state</span>=<span className="text-emerald-400">&quot;awaiting_network&quot;</span> /&gt;;
                      </div>
                      <div className="flex items-center gap-2 pt-1 text-[11px] font-mono text-teal-400">
                        <Radio className="w-3 h-3 animate-spin" />
                        <span>Awaiting network stream chunks... (Phase: {client.fetchPhase})</span>
                      </div>
                    </div>
                  )}

                  {client.reactState.componentState === "success" && (
                    <div className="p-4 rounded bg-emerald-950/20 border border-emerald-500/30 space-y-2">
                      <div className="flex items-center gap-2 text-emerald-300 font-semibold text-xs">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                        <span>Component Painted to Screen</span>
                      </div>
                      <div className="text-[11px] font-mono text-zinc-200 bg-black/50 p-2.5 rounded border border-zinc-800">
                        {client.reactState.dataPreview ?? "Payload successfully parsed."}
                      </div>
                    </div>
                  )}

                  {client.reactState.componentState === "error" && (
                    <div className="p-4 rounded bg-rose-950/20 border border-rose-500/30 space-y-2">
                      <div className="flex items-center gap-2 text-rose-300 font-semibold text-xs">
                        <XCircle className="w-4 h-4 text-rose-400 shrink-0" />
                        <span>Error State Rendered</span>
                      </div>
                      <div className="text-[11px] font-mono text-rose-200 bg-black/50 p-2.5 rounded border border-zinc-800">
                        {client.reactState.errorPreview ?? "An error occurred during fetch."}
                      </div>
                    </div>
                  )}
                </div>

                {/* Complete Un-Truncated Formatted JSON Payload */}
                <div className="rounded-lg bg-zinc-950 p-3.5 border border-zinc-800 space-y-2">
                  <div className="flex items-center justify-between text-[11px] font-mono text-zinc-400 pb-1 border-b border-zinc-800/60">
                    <span className="font-semibold text-sky-300 uppercase tracking-wider">
                      Complete Parsed JSON Response
                    </span>
                    {response?.headers["Content-Length"] && (
                      <span className="text-[11px] text-zinc-400 font-mono">
                        {response.headers["Content-Length"]} bytes wire
                      </span>
                    )}
                  </div>

                  {formattedJsonPayload ? (
                    <pre className="p-3 rounded bg-black/80 border border-zinc-800 text-[11px] font-mono overflow-x-auto whitespace-pre-wrap leading-relaxed max-h-56">
                      {highlightJson(formattedJsonPayload)}
                    </pre>
                  ) : response?.statusCode === 304 ? (
                    <div className="p-3 rounded bg-sky-950/20 border border-sky-500/30 text-sky-300 text-[11px] font-mono flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-sky-400 shrink-0" />
                      <span>
                        304 Not Modified: 0 payload bytes transmitted over wire; payload rehydrated from browser disk cache.
                      </span>
                    </div>
                  ) : (
                    <div className="p-3 rounded bg-zinc-900/40 border border-zinc-800 space-y-2">
                      <div className="text-zinc-400 text-[11px] italic font-mono flex items-center gap-1.5">
                        <Radio className="w-3 h-3 text-teal-400 animate-spin" />
                        <span>Awaiting HTTP response chunks over wire (Current Phase: {client.fetchPhase}).</span>
                      </div>
                      <div className="border-t border-zinc-800/80 pt-2">
                        <span className="text-[10px] font-mono text-zinc-500 block uppercase tracking-wider pb-1">
                          Target Endpoint Response Schema ({request.method} {client.url}):
                        </span>
                        <pre className="p-2 rounded bg-black/60 border border-zinc-800 text-[10px] font-mono text-zinc-400 overflow-x-auto">
                          {`// Expected JSON payload contract upon body streaming:\n{\n  "id": 42,\n  "name": "Alice Cooper",\n  "email": "alice@example.com",\n  "role": "admin"\n}`}
                        </pre>
                      </div>
                    </div>
                  )}
                </div>

                {/* Connection & Socket Telemetry */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-[11px] font-mono">
                  <div className="p-2 rounded bg-zinc-900/60 border border-zinc-800">
                    <span className="text-zinc-400 block text-[10px]">Local Socket:</span>
                    <span className="text-zinc-200 font-semibold">{client.activeSocket.localPort}</span>
                  </div>
                  <div className="p-2 rounded bg-zinc-900/60 border border-zinc-800">
                    <span className="text-zinc-400 block text-[10px]">Security:</span>
                    <span className="text-emerald-400 font-semibold">{client.activeSocket.tlsVersion}</span>
                  </div>
                  <div className="p-2 rounded bg-zinc-900/60 border border-zinc-800">
                    <span className="text-zinc-400 block text-[10px]">Keep-Alive:</span>
                    <span className="text-teal-300 font-semibold">
                      {wire.connectionReuse ? "Socket Reused" : "Fresh 3-Way Handshake"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="px-5 py-2.5 border-t border-zinc-800/80 bg-zinc-900/40 flex items-center justify-between text-[11px] font-mono text-zinc-400">
                <span>Press Esc or tap outside to close</span>
                <span className="text-teal-400">React Live Inspector</span>
              </div>
            </div>
          </div>,
          document.body
        )}

      {/* ──────────────── Centered Floating Modal: Wire Substrate Framing ──────────────── */}
      {isClient &&
        activeModal === "wire-substrate" &&
        createPortal(
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-md p-4 animate-in fade-in-0 duration-150"
            onClick={() => setActiveModal(null)}
          >
            <div
              role="dialog"
              aria-modal="true"
              aria-labelledby="wire-substrate-modal-title"
              className="bg-[#080b12] border border-teal-500/40 rounded-xl shadow-[0_20px_60px_rgba(0,0,0,0.85)] max-w-2xl w-full max-h-[85vh] flex flex-col overflow-hidden text-zinc-200 animate-in zoom-in-95 duration-150 font-sans"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between px-5 py-3.5 border-b border-zinc-800/80 bg-zinc-900/60">
                <div className="flex items-center gap-2">
                  <Layers className="w-4 h-4 text-teal-400 shrink-0" />
                  <div>
                    <h3
                      id="wire-substrate-modal-title"
                      className="text-sm font-bold font-mono text-zinc-100 flex items-center gap-2"
                    >
                      <span>Wire Substrate & TCP/IP Packet Framing</span>
                    </h3>
                    <p className="text-[11px] font-mono text-zinc-400">
                      Channel: 192.168.1.10:{client.activeSocket.localPort} ↔ 198.51.100.1:443 (TCP SYN/ACK)
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveModal(null)}
                  className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 transition-colors focus:outline-none focus-visible:ring-1 focus-visible:ring-teal-400 touch-manipulation"
                  aria-label="Close dialog"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Modal Body */}
              <div className="p-5 overflow-y-auto space-y-4 custom-scrollbar text-xs">
                {/* Active In-Flight Packet Card */}
                {wire.inFlightPacket ? (
                  <div className="rounded-lg bg-zinc-950 p-3.5 border border-teal-500/30 space-y-2">
                    <div className="flex items-center justify-between text-[11px] font-mono">
                      <span className="font-semibold text-teal-300 flex items-center gap-1.5">
                        <Zap className="w-3.5 h-3.5 text-teal-400" />
                        In-Flight Wire Packet: {wire.inFlightPacket.label}
                      </span>
                      <span className="px-2 py-0.5 rounded font-mono bg-teal-500/20 text-teal-300 border border-teal-500/40 text-[10px]">
                        Progress: {wire.inFlightPacket.progressPct}%
                      </span>
                    </div>

                    <p className="text-[11px] text-zinc-300 font-sans leading-relaxed">
                      {wire.inFlightPacket.summary}
                    </p>

                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-1 font-mono text-[11px]">
                      <div className="p-1.5 rounded bg-zinc-900 border border-zinc-800">
                        <span className="text-zinc-400 block text-[10px]">Direction:</span>
                        <span className="text-zinc-200 truncate">{wire.inFlightPacket.direction}</span>
                      </div>
                      <div className="p-1.5 rounded bg-zinc-900 border border-zinc-800">
                        <span className="text-zinc-400 block text-[10px]">Protocol:</span>
                        <span className="text-sky-300 font-semibold">{wire.inFlightPacket.protocol}</span>
                      </div>
                      <div className="p-1.5 rounded bg-zinc-900 border border-zinc-800">
                        <span className="text-zinc-400 block text-[10px]">Encryption:</span>
                        <span className="text-emerald-400 flex items-center gap-1 font-semibold">
                          {wire.inFlightPacket.isEncrypted ? (
                            <>
                              <Lock className="w-3 h-3" /> TLS 1.3
                            </>
                          ) : (
                            "Plaintext"
                          )}
                        </span>
                      </div>
                      <div className="p-1.5 rounded bg-zinc-900 border border-zinc-800">
                        <span className="text-zinc-400 block text-[10px]">Reuse:</span>
                        <span className="text-teal-300 font-semibold">
                          {wire.connectionReuse ? "Keep-Alive" : "Cold"}
                        </span>
                      </div>
                      <div className="p-1.5 rounded bg-zinc-900 border border-zinc-800">
                        <span className="text-zinc-400 block text-[10px]">Wire Stream Size:</span>
                        <span className="text-amber-300 font-semibold">
                          {activeWireStreamBytes} bytes
                        </span>
                      </div>
                      <div className="p-1.5 rounded bg-zinc-900 border border-zinc-800">
                        <span className="text-zinc-400 block text-[10px]">Payload Size:</span>
                        <span className="text-cyan-300 font-semibold">
                          {activePayloadBytes > 0 ? `${activePayloadBytes} bytes` : "0 bytes (headers only)"}
                        </span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="p-4 rounded-lg bg-zinc-950 border border-zinc-800 text-center font-mono text-[11px] text-zinc-400 space-y-1">
                    <span className="block text-zinc-300 font-semibold">Wire Substrate Idle</span>
                    <span>No active packet currently traversing the physical link on this step.</span>
                    <div className="text-[10px] text-zinc-400 pt-1">
                      Last wire frame size: {activeWireStreamBytes} bytes | MSS: 1,460 bytes | MTU: 1,500 bytes
                    </div>
                  </div>
                )}

                {/* 4-Layer Encapsulation Hierarchy */}
                <div className="rounded-lg bg-zinc-950 p-3.5 border border-zinc-800 space-y-2.5">
                  <span className="font-semibold text-teal-300 uppercase tracking-wider text-[11px] font-mono block border-b border-zinc-800 pb-1">
                    Layer Encapsulation & Protocol Framing
                  </span>
                  <div className="space-y-2 font-mono text-[11px]">
                    <div className="flex items-start justify-between p-2 rounded bg-zinc-900/70 border border-zinc-800">
                      <div>
                        <span className="text-sky-400 font-semibold block">Layer 4 — Transport (TCP):</span>
                        <span className="text-zinc-300">
                          Src: {client.activeSocket.localPort} ➔ Dst: 443 | MSS: 1,460 bytes | Window: 65,535 bytes | Framing: {activeWireStreamBytes}B ({activeHeaderBytes}B headers + {activePayloadBytes}B body)
                        </span>
                      </div>
                      <span className="text-zinc-400 text-[10px]">RFC 793 / 9293</span>
                    </div>

                    <div className="flex items-start justify-between p-2 rounded bg-zinc-900/70 border border-zinc-800">
                      <div>
                        <span className="text-purple-400 font-semibold block">Layer 5/6 — Session & Security (TLS):</span>
                        <span className="text-zinc-300">
                          Version: {client.activeSocket.tlsVersion} | Cipher: TLS_AES_128_GCM_SHA256
                        </span>
                      </div>
                      <span className="text-zinc-400 text-[10px]">RFC 8446</span>
                    </div>

                    <div className="flex items-start justify-between p-2 rounded bg-zinc-900/70 border border-zinc-800">
                      <div>
                        <span className="text-emerald-400 font-semibold block">Layer 7 — Application (HTTP/1.1):</span>
                        <span className="text-zinc-300">
                          Framing: CRLF (0x0D 0x0A) | Terminating Sequence: \r\n\r\n
                        </span>
                      </div>
                      <span className="text-zinc-400 text-[10px]">RFC 7230 / 9112</span>
                    </div>
                  </div>
                </div>

                {/* Raw ASCII Stream Preview */}
                <div className="rounded-lg bg-zinc-950 p-3.5 border border-zinc-800 space-y-2">
                  <div className="flex items-center justify-between text-[11px] font-mono text-zinc-400 pb-1 border-b border-zinc-800/60">
                    <span className="font-semibold text-amber-300 uppercase tracking-wider">
                      Wire Stream Inspection
                    </span>
                    <span className="text-[11px] text-zinc-400">
                      Stream Size: <strong className="text-amber-300 font-mono">{activeWireStreamBytes} bytes</strong> (CRLF visible)
                    </span>
                  </div>
                  <pre className="p-3 rounded bg-black/80 border border-zinc-800 text-[11px] font-mono overflow-x-auto whitespace-pre-wrap leading-relaxed max-h-48 text-zinc-300">
                    {activeWireAscii}
                  </pre>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="px-5 py-2.5 border-t border-zinc-800/80 bg-zinc-900/40 flex items-center justify-between text-[11px] font-mono text-zinc-400">
                <span>Press Esc or tap outside to close</span>
                <span className="text-teal-400">Substrate Framing Inspector</span>
              </div>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
}
