"use client";

import React, { useState } from "react";
import type { TcpStepData, TcpSegment, TcpSocketState } from "@/lib/network-simulator/tcp-engine";
import {
  FileCode,
  TableProperties,
  Network,
  ArrowRight,
  Info,
  Terminal,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

interface TcpTelemetryPanelProps {
  tcpData: TcpStepData;
  activeSegmentOverride?: TcpSegment | null;
}

export function TcpTelemetryPanel({
  tcpData,
  activeSegmentOverride,
}: TcpTelemetryPanelProps) {
  const [activeTab, setActiveTab] = useState<"wire" | "sockets" | "fsm">("wire");
  const [selectedSocketId, setSelectedSocketId] = useState<string | null>(null);
  const [selectedFsmState, setSelectedFsmState] = useState<TcpSocketState | null>(null);
  const [showAdvancedHeaders, setShowAdvancedHeaders] = useState(false);
  const [prevOverride, setPrevOverride] = useState<TcpSegment | null | undefined>(activeSegmentOverride);

  // Auto-switch to wire tab during render when user clicks a packet on canvas
  if (prevOverride !== activeSegmentOverride) {
    setPrevOverride(activeSegmentOverride);
    if (activeSegmentOverride) {
      setActiveTab("wire");
    }
  }

  const segment = activeSegmentOverride ?? tcpData.wire.activeSegment;
  const { client, server, fsmTransition } = tcpData;

  const handleTabKeyDown = (e: React.KeyboardEvent, currentTab: "wire" | "sockets" | "fsm") => {
    const tabs: Array<"wire" | "sockets" | "fsm"> = ["wire", "sockets", "fsm"];
    const currentIndex = tabs.indexOf(currentTab);
    if (e.key === "ArrowRight") {
      e.preventDefault();
      const nextTab = tabs[(currentIndex + 1) % tabs.length];
      setActiveTab(nextTab);
      document.getElementById(`tab-tcp-${nextTab}`)?.focus();
    } else if (e.key === "ArrowLeft") {
      e.preventDefault();
      const prevTab = tabs[(currentIndex - 1 + tabs.length) % tabs.length];
      setActiveTab(prevTab);
      document.getElementById(`tab-tcp-${prevTab}`)?.focus();
    } else if (e.key === "Home") {
      e.preventDefault();
      setActiveTab("wire");
      document.getElementById("tab-tcp-wire")?.focus();
    } else if (e.key === "End") {
      e.preventDefault();
      setActiveTab("fsm");
      document.getElementById("tab-tcp-fsm")?.focus();
    }
  };

  // Build unified kernel socket rows for `ss -tan`
  const socketRows: Array<{
    id: string;
    endpoint: "Client" | "Server";
    state: TcpSocketState;
    recvQ: number;
    sendQ: number;
    local: string;
    peer: string;
    process: string;
  }> = [];

  // Server Listen Socket
  if (server.listenState === "LISTEN") {
    socketRows.push({
      id: "srv-listen",
      endpoint: "Server",
      state: "LISTEN",
      recvQ: server.backlog.acceptQueue.current,
      sendQ: server.backlog.acceptQueue.max,
      local: `0.0.0.0:${server.port}`,
      peer: "0.0.0.0:*",
      process: "nginx (listener)",
    });
  }

  // Server SYN Backlog half-open entries
  if (server.backlog.synBacklog.current > 0) {
    socketRows.push({
      id: "srv-syn-rcvd",
      endpoint: "Server",
      state: "SYN_RCVD",
      recvQ: 0,
      sendQ: 0,
      local: `${server.ip}:${server.port}`,
      peer: `${client.ip}:${client.port}`,
      process: "kernel (syn-backlog)",
    });
  }

  // Server child sockets
  server.childSockets.forEach((cs) => {
    socketRows.push({
      id: cs.id,
      endpoint: "Server",
      state: cs.state,
      recvQ: cs.recvQueueBytes,
      sendQ: cs.sendQueueBytes,
      local: cs.localAddr,
      peer: cs.peerAddr,
      process: cs.process,
    });
  });

  // Client socket
  if (client.state !== "CLOSED" || socketRows.length === 0) {
    socketRows.push({
      id: "cli-sock",
      endpoint: "Client",
      state: client.state,
      recvQ: client.recvBuffer.bytes,
      sendQ: client.sendBuffer.bytes,
      local: `${client.ip}:${client.port}`,
      peer: client.state === "CLOSED" ? "*:*" : `${server.ip}:${server.port}`,
      process: "curl (pid 4892)",
    });
  }

  const selectedSocket =
    socketRows.find((s) => s.id === selectedSocketId) ?? socketRows[0];

  const isArcActive = (
    from: TcpSocketState,
    to: TcpSocketState,
    preferredEndpoint: "client" | "server"
  ) => {
    if (fsmTransition) {
      const endpointMatches =
        fsmTransition.endpoint === "both" || fsmTransition.endpoint === preferredEndpoint;
      if (endpointMatches && fsmTransition.from === from && fsmTransition.to === to) {
        return true;
      }
      return false;
    }
    if (preferredEndpoint === "client") {
      return client.state === to;
    }
    const srvState =
      server.childSockets.length > 0 ? server.childSockets[0].state : server.listenState;
    return srvState === to;
  };

  const CLIENT_FSM_PATH: TcpSocketState[] = [
    "CLOSED",
    "SYN_SENT",
    "ESTABLISHED",
    "FIN_WAIT_1",
    "FIN_WAIT_2",
    "TIME_WAIT",
    "CLOSED",
  ];

  const SERVER_FSM_PATH: TcpSocketState[] = [
    "CLOSED",
    "LISTEN",
    "SYN_RCVD",
    "ESTABLISHED",
    "CLOSE_WAIT",
    "LAST_ACK",
    "CLOSED",
  ];

  const getFsmStateExplanation = (state: TcpSocketState) => {
    switch (state) {
      case "CLOSED":
        return "Socket is completely dormant; no connection exists and all OS resources are released.";
      case "LISTEN":
        return "Server is passively waiting for connection requests from any remote client (passive open).";
      case "SYN_SENT":
        return "Client has transmitted a SYN packet and is awaiting a SYN-ACK acknowledgment.";
      case "SYN_RCVD":
        return "Server received SYN and replied with SYN-ACK; awaiting client's final ACK in SYN Backlog.";
      case "ESTABLISHED":
        return "3-Way Handshake is complete! Both directions are open for full-duplex data transmission.";
      case "FIN_WAIT_1":
        return "Endpoint actively called close(); transmitted FIN and is awaiting peer's ACK or FIN.";
      case "FIN_WAIT_2":
        return "Endpoint's FIN was acknowledged; waiting for remote peer's application to send its own FIN.";
      case "CLOSE_WAIT":
        return "Remote client closed its sending side. Local app must flush remaining data and call close().";
      case "LAST_ACK":
        return "Passive closer sent its FIN and is awaiting the final ACK from the active close initiator.";
      case "TIME_WAIT":
        return "Active closer sent final ACK; waiting 2*MSL (60s) to prevent ghost socket reincarnations.";
      case "CLOSING":
        return "Both endpoints called close() simultaneously; crossing FINs acknowledged concurrently.";
      default:
        return "Standard RFC 793 finite state machine condition.";
    }
  };

  return (
    <div className="h-full flex flex-col min-h-0 select-none font-sans">
      {/* ── Top WAI-ARIA Tablist with Roving Arrow Navigation ── */}
      <div
        role="tablist"
        aria-label="TCP Telemetry Navigation"
        className="flex items-center gap-1 mb-2 bg-zinc-900/60 p-1 rounded-lg border border-border/60 shrink-0 font-mono text-xs"
      >
        <button
          type="button"
          role="tab"
          id="tab-tcp-wire"
          aria-selected={activeTab === "wire"}
          aria-controls="panel-tcp-wire"
          tabIndex={activeTab === "wire" ? 0 : -1}
          onClick={() => setActiveTab("wire")}
          onKeyDown={(e) => handleTabKeyDown(e, "wire")}
          className={`flex-1 min-h-[44px] py-1.5 px-3 rounded-md font-medium text-xs flex items-center justify-center gap-1.5 transition-all active:scale-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-400 touch-manipulation ${
            activeTab === "wire"
              ? "bg-zinc-800 text-teal-300 shadow-sm border border-zinc-700/60"
              : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/40"
          }`}
        >
          <FileCode className="w-3.5 h-3.5 text-teal-400 shrink-0" />
          <span className="truncate">Wire Segment {segment ? "•" : ""}</span>
        </button>

        <button
          type="button"
          role="tab"
          id="tab-tcp-sockets"
          aria-selected={activeTab === "sockets"}
          aria-controls="panel-tcp-sockets"
          tabIndex={activeTab === "sockets" ? 0 : -1}
          onClick={() => setActiveTab("sockets")}
          onKeyDown={(e) => handleTabKeyDown(e, "sockets")}
          className={`flex-1 min-h-[44px] py-1.5 px-3 rounded-md font-medium text-xs flex items-center justify-center gap-1.5 transition-all active:scale-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-400 touch-manipulation ${
            activeTab === "sockets"
              ? "bg-zinc-800 text-teal-300 shadow-sm border border-zinc-700/60"
              : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/40"
          }`}
        >
          <TableProperties className="w-3.5 h-3.5 text-teal-400 shrink-0" />
          <span className="truncate">Sockets Table ({socketRows.length})</span>
        </button>

        <button
          type="button"
          role="tab"
          id="tab-tcp-fsm"
          aria-selected={activeTab === "fsm"}
          aria-controls="panel-tcp-fsm"
          tabIndex={activeTab === "fsm" ? 0 : -1}
          onClick={() => setActiveTab("fsm")}
          onKeyDown={(e) => handleTabKeyDown(e, "fsm")}
          className={`flex-1 min-h-[44px] py-1.5 px-3 rounded-md font-medium text-xs flex items-center justify-center gap-1.5 transition-all active:scale-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-400 touch-manipulation ${
            activeTab === "fsm"
              ? "bg-zinc-800 text-teal-300 shadow-sm border border-zinc-700/60"
              : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/40"
          }`}
        >
          <Network className="w-3.5 h-3.5 text-teal-400 shrink-0" />
          <span className="truncate">TCP FSM</span>
        </button>
      </div>

      {/* ── Tab Content Container ── */}
      <div className="flex-1 min-h-0 bg-[#08090d] rounded-xl border border-border/60 p-3 overflow-y-auto">
        {/* ─────────────────────────────────────────────────────────────
            Tab 1: Wire Segment Header & TCP Options Inspector
           ───────────────────────────────────────────────────────────── */}
        {activeTab === "wire" && (
          <div
            id="panel-tcp-wire"
            role="tabpanel"
            aria-labelledby="tab-tcp-wire"
            tabIndex={0}
            className="flex flex-col gap-3 focus:outline-none"
          >
            {segment ? (
              <>
                {/* Segment Meta Banner */}
                <div className="flex flex-wrap items-center justify-between gap-2 p-2.5 rounded-lg bg-zinc-950/70 border border-border/40 font-mono text-xs">
                  <div className="flex items-center gap-2">
                    <span className="text-zinc-200 font-bold">
                      {segment.explanationTitle || "RFC 793 Segment Header"}
                    </span>
                    <span className="text-zinc-500">|</span>
                    <span className="text-teal-300 text-xs">
                      {segment.direction === "client-to-server"
                        ? "Client → Server"
                        : "Server → Client"}
                    </span>
                  </div>
                  <span className="px-2 py-0.5 rounded text-[11px] bg-zinc-900 border border-zinc-700/80 text-zinc-300">
                    Offset: {segment.dataOffset} words ({segment.dataOffset * 4}B)
                  </span>
                </div>

                {/* RFC 793 8-Bit Flags Register */}
                <div className="rounded-lg border border-border/40 bg-zinc-950/60 p-2.5">
                  <div className="flex items-center justify-between pb-1.5 mb-2 border-b border-border/40 font-mono text-xs">
                    <span className="text-zinc-200 font-semibold flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-teal-400 shadow-[0_0_8px_rgba(20,184,166,0.6)]" />
                      RFC 793 8-Bit Control Flags Register
                    </span>
                    <span className="text-zinc-400 text-[11px]">Active bit illumination</span>
                  </div>

                  <div className="grid grid-cols-4 sm:grid-cols-8 gap-1.5 font-mono text-center">
                    {[
                      { key: "cwr", name: "CWR", active: !!segment.flags.cwr, desc: "Congestion Reduced" },
                      { key: "ece", name: "ECE", active: !!segment.flags.ece, desc: "ECN-Echo" },
                      { key: "urg", name: "URG", active: !!segment.flags.urg, desc: "Urgent Ptr" },
                      { key: "ack", name: "ACK", active: !!segment.flags.ack, desc: "Ack Valid" },
                      { key: "psh", name: "PSH", active: !!segment.flags.psh, desc: "Push Data" },
                      { key: "rst", name: "RST", active: !!segment.flags.rst, desc: "Reset Abort" },
                      { key: "syn", name: "SYN", active: !!segment.flags.syn, desc: "Synchronize" },
                      { key: "fin", name: "FIN", active: !!segment.flags.fin, desc: "Teardown" },
                    ].map((flag) => (
                      <div
                        key={flag.key}
                        className={`p-1.5 rounded border transition-all ${
                          flag.active
                            ? flag.key === "rst"
                              ? "bg-rose-950/80 border-rose-500/60 text-rose-300 shadow-[0_0_8px_rgba(244,63,94,0.3)]"
                              : flag.key === "syn"
                              ? "bg-amber-950/80 border-amber-500/60 text-amber-200 shadow-[0_0_8px_rgba(245,158,11,0.3)]"
                              : flag.key === "fin"
                              ? "bg-cyan-950/80 border-cyan-500/60 text-cyan-200"
                              : "bg-teal-950/80 border-teal-500/60 text-teal-300 shadow-[0_0_8px_rgba(20,184,166,0.3)]"
                            : "bg-zinc-900/60 border-zinc-800 text-zinc-400"
                        }`}
                      >
                        <div className="text-[11px] font-bold">{flag.name}</div>
                        <div className={`text-xs font-mono font-bold mt-0.5 ${flag.active ? "" : "text-zinc-500"}`}>
                          {flag.active ? "1" : "0"}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Core Header Fields Grid */}
                <div className="rounded-lg border border-border/40 bg-zinc-950/60 p-2.5 font-mono text-xs">
                  <div className="flex justify-between items-center pb-1.5 mb-2 border-b border-border/40">
                    <span className="text-zinc-200 font-semibold">Header Fields</span>
                    <button
                      type="button"
                      onClick={() => setShowAdvancedHeaders(!showAdvancedHeaders)}
                      className="text-[11px] text-zinc-400 hover:text-teal-300 flex items-center gap-1 transition-colors focus:outline-none focus-visible:ring-1 focus-visible:ring-teal-400 rounded px-1 py-0.5"
                      aria-expanded={showAdvancedHeaders}
                      aria-label="Toggle extended header fields (Checksum, Urgent Pointer)"
                    >
                      <span>{showAdvancedHeaders ? "Hide Extended Fields" : "Show Extended Fields"}</span>
                      {showAdvancedHeaders ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="p-2 rounded bg-zinc-900/70 border border-zinc-800">
                      <span className="text-zinc-400 text-[11px] block">Source Port</span>
                      <span className="text-teal-300 font-semibold">{segment.srcPort}</span>
                    </div>

                    <div className="p-2 rounded bg-zinc-900/70 border border-zinc-800">
                      <span className="text-zinc-400 text-[11px] block">Destination Port</span>
                      <span className="text-teal-300 font-semibold">{segment.dstPort}</span>
                    </div>

                    <div className="p-2 rounded bg-zinc-900/70 border border-zinc-800 col-span-2">
                      <div className="flex justify-between items-center">
                        <span className="text-zinc-400 text-[11px]">Sequence Number (Raw)</span>
                        <span className="text-zinc-400 text-[11px]">32-Bit Offset</span>
                      </div>
                      <span className="text-zinc-100 font-bold text-sm block mt-0.5">
                        {segment.seqNumber}
                      </span>
                    </div>

                    <div className="p-2 rounded bg-zinc-900/70 border border-zinc-800 col-span-2">
                      <div className="flex justify-between items-center">
                        <span className="text-zinc-400 text-[11px]">Acknowledgment Number</span>
                        <span className="text-zinc-400 text-[11px]">
                          {segment.ackNumber !== null ? "Valid (ACK=1)" : "Invalid (ACK=0)"}
                        </span>
                      </div>
                      <span className="text-zinc-100 font-bold text-sm block mt-0.5">
                        {segment.ackNumber !== null ? segment.ackNumber : "— (ACK bit not set)"}
                      </span>
                    </div>

                    <div className="p-2 rounded bg-zinc-900/70 border border-zinc-800 col-span-2 sm:col-span-1">
                      <span className="text-zinc-400 text-[11px] block">Receive Window (rwnd)</span>
                      <span className="text-zinc-200 font-semibold">
                        {segment.windowSize.toLocaleString()} bytes
                      </span>
                    </div>

                    <div className="p-2 rounded bg-zinc-900/70 border border-zinc-800 col-span-2 sm:col-span-1">
                      <span className="text-zinc-400 text-[11px] block">Checksum</span>
                      <span className="text-emerald-400 font-semibold">
                        {segment.checksum ?? "0xa4c1 [Verified]"}
                      </span>
                    </div>

                    {/* Extended Header Fields via Progressive Disclosure */}
                    {showAdvancedHeaders && (
                      <div className="p-2 rounded bg-zinc-900/70 border border-zinc-800 col-span-2 flex flex-col gap-1.5 animate-in fade-in duration-150">
                        <div className="flex justify-between items-center text-[11px]">
                          <span className="text-zinc-400">Urgent Pointer & Data Offset</span>
                          <span className="text-zinc-300">Offset: {segment.dataOffset} words ({segment.dataOffset * 4}B)</span>
                        </div>
                        <span className="text-zinc-200 text-xs block font-mono">
                          Urgent Pointer: {segment.urgentPointer ?? 0} (URG bit {segment.flags.urg ? "SET" : "NOT SET"})
                        </span>
                        <span className="text-[10px] text-zinc-400 block pt-1 border-t border-zinc-800">
                          RFC 793 Checksum covers TCP segment + 12B IPv4 Pseudo-Header.
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* TCP Options Block */}
                {segment.options && (
                  <div className="rounded-lg border border-border/40 bg-zinc-950/60 p-2.5 font-mono text-xs">
                    <div className="text-zinc-200 font-semibold pb-1.5 mb-2 border-b border-border/40 flex justify-between items-center">
                      <span>TCP Options (Negotiated During SYN)</span>
                      <span className="text-zinc-400 text-[11px]">RFC 7323 / 2018</span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs">
                      {segment.options.mss !== undefined && (
                        <div className="p-2 rounded bg-zinc-900/80 border border-zinc-800">
                          <span className="text-zinc-400 text-[11px] block">Maximum Segment Size (MSS)</span>
                          <span className="text-teal-300 font-bold">{segment.options.mss} bytes</span>
                        </div>
                      )}

                      {segment.options.windowScale !== undefined && (
                        <div className="p-2 rounded bg-zinc-900/80 border border-zinc-800">
                          <span className="text-zinc-400 text-[11px] block">Window Scale Factor (WS)</span>
                          <span className="text-teal-300 font-bold">
                            Shift {segment.options.windowScale} (&times;{1 << segment.options.windowScale})
                          </span>
                        </div>
                      )}

                      {segment.options.sackPermitted && (
                        <div className="p-2 rounded bg-zinc-900/80 border border-zinc-800">
                          <span className="text-zinc-400 text-[11px] block">SACK Permitted</span>
                          <span className="text-emerald-400 font-bold">Enabled (RFC 2018)</span>
                        </div>
                      )}

                      {segment.options.timestamps && (
                        <div className="p-2 rounded bg-zinc-900/80 border border-zinc-800 col-span-2">
                          <span className="text-zinc-400 text-[11px] block">TCP Timestamps Option (TSopt / RFC 7323)</span>
                          <span className="text-teal-300 font-bold">
                            TSval: {segment.options.timestamps.tsVal} | TSecr: {segment.options.timestamps.tsEcho}
                          </span>
                        </div>
                      )}

                      {segment.options.synCookie && (
                        <div className="p-2 rounded bg-amber-950/30 border border-amber-500/40 col-span-2">
                          <span className="text-amber-300 text-[11px] block font-semibold">Stateless SYN Cookie</span>
                          <span className="text-amber-200 font-bold">Encoded in ISN (Cryptographic Hash)</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Application Payload Preview */}
                {segment.payloadLength > 0 && (
                  <div className="rounded-lg border border-border/40 bg-zinc-950/60 p-2.5 font-mono text-xs">
                    <div className="flex justify-between items-center pb-1.5 mb-2 border-b border-border/40">
                      <span className="text-zinc-200 font-semibold">Application Payload</span>
                      <span className="text-teal-400 font-bold">{segment.payloadLength} Bytes</span>
                    </div>
                    <pre className="p-2 rounded bg-black/80 border border-zinc-800 text-teal-300/90 text-xs whitespace-pre-wrap break-all font-mono">
                      {segment.payloadPreview ?? "Payload bytes transmitted"}
                    </pre>
                  </div>
                )}
              </>
            ) : (
              <div className="flex flex-col items-center justify-center p-8 text-center text-zinc-400">
                <FileCode className="w-8 h-8 mb-2 text-zinc-500" />
                <p className="text-xs font-mono font-medium">Wire Idle in this step</p>
                <p className="text-xs text-zinc-300 mt-1 max-w-xs font-sans">
                  No active packet in flight. Advance to a handshake or data step to inspect RFC 793 header fields.
                </p>
              </div>
            )}
          </div>
        )}

        {/* ─────────────────────────────────────────────────────────────
            Tab 2: Kernel Sockets Table (`ss -tan`)
           ───────────────────────────────────────────────────────────── */}
        {activeTab === "sockets" && (
          <div
            id="panel-tcp-sockets"
            role="tabpanel"
            aria-labelledby="tab-tcp-sockets"
            tabIndex={0}
            className="flex flex-col gap-3 focus:outline-none"
          >
            {/* Terminal Command Header */}
            <div className="flex items-center justify-between p-2.5 rounded-lg bg-zinc-950/80 border border-border/40 font-mono text-xs">
              <div className="flex items-center gap-2">
                <Terminal className="w-4 h-4 text-teal-400" />
                <code className="text-teal-300 font-semibold">ss -tan</code>
              </div>
              <span className="text-zinc-400 text-xs">{socketRows.length} active sockets</span>
            </div>

            {/* Socket Table */}
            <div className="rounded-lg border border-border/40 overflow-hidden bg-zinc-950/50">
              <table className="w-full text-left font-mono text-xs border-collapse">
                <thead>
                  <tr className="border-b border-zinc-800 bg-zinc-900/80 text-zinc-300 text-[11px] uppercase">
                    <th className="py-2.5 px-3">State</th>
                    <th className="py-2.5 px-2.5">Recv-Q</th>
                    <th className="py-2.5 px-2.5">Send-Q</th>
                    <th className="py-2.5 px-3">Local Address:Port</th>
                    <th className="py-2.5 px-3">Peer Address:Port</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/60">
                  {socketRows.map((sock) => {
                    const isSelected = selectedSocket?.id === sock.id;
                    return (
                      <tr
                        key={sock.id}
                        tabIndex={0}
                        aria-selected={isSelected}
                        aria-label={`Socket ${sock.local} ${sock.state}, Recv-Q ${sock.recvQ}, Send-Q ${sock.sendQ}`}
                        onClick={() => setSelectedSocketId(sock.id)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault();
                            setSelectedSocketId(sock.id);
                          }
                        }}
                        className={`cursor-pointer transition-colors min-h-[44px] touch-manipulation focus:outline-none focus-visible:ring-1 focus-visible:ring-teal-400 ${
                          isSelected
                            ? "bg-teal-500/15 text-teal-200"
                            : "hover:bg-zinc-900/60 text-zinc-200"
                        }`}
                      >
                        <td className="py-2.5 px-3 font-bold">
                          <span
                            className={`px-2 py-0.5 rounded text-[11px] ${
                              sock.state === "ESTABLISHED"
                                ? "text-emerald-400 bg-emerald-500/10 border border-emerald-500/20"
                                : sock.state === "LISTEN"
                                ? "text-sky-400 bg-sky-500/10 border border-sky-500/20"
                                : sock.state === "SYN_SENT" || sock.state === "SYN_RCVD"
                                ? "text-amber-400 bg-amber-500/10 border border-amber-500/20"
                                : sock.state === "TIME_WAIT"
                                ? "text-yellow-400 bg-yellow-500/10 border border-yellow-500/20"
                                : "text-zinc-300 bg-zinc-800/90 border border-zinc-700/80"
                            }`}
                          >
                            {sock.state}
                          </span>
                        </td>
                        <td className="py-2.5 px-2.5 text-zinc-300">{sock.recvQ}</td>
                        <td className="py-2.5 px-2.5 text-zinc-300">{sock.sendQ}</td>
                        <td className="py-2.5 px-3 text-zinc-200 truncate max-w-[120px]" title={sock.local}>
                          {sock.local}
                        </td>
                        <td className="py-2.5 px-3 text-zinc-300 truncate max-w-[120px]" title={sock.peer}>
                          {sock.peer}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Selected Socket Detail Box */}
            {selectedSocket && (
              <div className="p-3 rounded-lg border border-border/40 bg-zinc-950/70 font-mono text-xs flex flex-col gap-2">
                <div className="flex justify-between items-center text-zinc-200 font-semibold border-b border-zinc-800 pb-1.5">
                  <span className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-teal-400 shadow-[0_0_8px_rgba(20,184,166,0.6)]" />
                    Selected Socket Detail ({selectedSocket.endpoint})
                  </span>
                  <span className="text-teal-300 text-xs font-bold">
                    {selectedSocket.state}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-zinc-400 text-[11px] block">Process / PID</span>
                    <span className="text-zinc-200 font-medium">{selectedSocket.process}</span>
                  </div>
                  <div>
                    <span className="text-zinc-400 text-[11px] block">Queue Status</span>
                    <span className="text-zinc-200">
                      Recv-Q: {selectedSocket.recvQ}B | Send-Q: {selectedSocket.sendQ}B
                    </span>
                  </div>
                  <div className="col-span-2">
                    <span className="text-zinc-400 text-[11px] block">4-Tuple Connection</span>
                    <code className="text-teal-300 text-xs">
                      {selectedSocket.local} &harr; {selectedSocket.peer}
                    </code>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ─────────────────────────────────────────────────────────────
            Tab 3: Responsive Dual-View TCP Finite State Machine (FSM)
           ───────────────────────────────────────────────────────────── */}
        {activeTab === "fsm" && (
          <div
            id="panel-tcp-fsm"
            role="tabpanel"
            aria-labelledby="tab-tcp-fsm"
            tabIndex={0}
            className="flex flex-col gap-3.5 focus:outline-none"
          >
            {/* Active Transition Callout */}
            {fsmTransition && (
              <div className="p-2.5 rounded-lg bg-teal-950/30 border border-teal-500/30 font-mono text-xs">
                <div className="flex items-center justify-between text-teal-300 font-bold mb-1">
                  <span>Current FSM Transition</span>
                  <span className="uppercase text-[11px] px-1.5 py-0.5 rounded bg-teal-500/20 font-bold">
                    {fsmTransition.endpoint}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-zinc-200 text-xs">
                  <span className="px-2 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-zinc-300 font-bold">
                    {fsmTransition.from}
                  </span>
                  <ArrowRight className="w-3.5 h-3.5 text-teal-400 shrink-0" />
                  <span className="px-2 py-0.5 rounded bg-teal-500/20 border border-teal-500/40 text-teal-300 font-bold">
                    {fsmTransition.to}
                  </span>
                </div>
                <p className="text-xs font-sans text-zinc-300 mt-1.5">
                  Trigger: {fsmTransition.trigger}
                </p>
              </div>
            )}

            {/* Desktop View (sm:): Full RFC 793 Interactive Directed Graph */}
            <div className="hidden sm:block rounded-lg border border-border/40 bg-zinc-950/70 p-3">
              <div className="flex justify-between items-center pb-2 border-b border-border/40 font-mono text-xs mb-2">
                <span className="text-zinc-200 font-bold flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-teal-400 shadow-[0_0_8px_rgba(20,184,166,0.6)]" />
                  RFC 793 TCP Finite State Machine (Interactive Graph)
                </span>
                <div className="flex items-center gap-3 text-xs">
                  <span className="flex items-center gap-1 text-teal-300 font-semibold">
                    <span className="w-2 h-2 rounded-full bg-teal-400" />
                    Client: {client.state}
                  </span>
                  <span className="flex items-center gap-1 text-sky-300 font-semibold">
                    <span className="w-2 h-2 rounded-full bg-sky-400" />
                    Server: {server.childSockets.length > 0 ? server.childSockets[0].state : server.listenState}
                  </span>
                </div>
              </div>

              <div className="w-full overflow-x-auto flex justify-center py-1">
                <svg
                  viewBox="0 0 540 370"
                  className="w-full max-w-[540px] h-auto select-none font-mono text-xs"
                  role="img"
                  aria-label="TCP Finite State Machine Directed Graph"
                >
                  <defs>
                    <marker
                      id="fsm-arrow"
                      viewBox="0 0 10 10"
                      refX="7"
                      refY="5"
                      markerWidth="5"
                      markerHeight="5"
                      orient="auto-start-reverse"
                    >
                      <path d="M 0 1 L 8 5 L 0 9 z" fill="#71717a" />
                    </marker>
                    <marker
                      id="fsm-arrow-teal"
                      viewBox="0 0 10 10"
                      refX="7"
                      refY="5"
                      markerWidth="6"
                      markerHeight="6"
                      orient="auto-start-reverse"
                    >
                      <path d="M 0 1 L 8 5 L 0 9 z" fill="#14b8a6" />
                    </marker>
                    <marker
                      id="fsm-arrow-sky"
                      viewBox="0 0 10 10"
                      refX="7"
                      refY="5"
                      markerWidth="6"
                      markerHeight="6"
                      orient="auto-start-reverse"
                    >
                      <path d="M 0 1 L 8 5 L 0 9 z" fill="#38bdf8" />
                    </marker>
                  </defs>

                  {/* Transition Arcs */}
                  {/* CLOSED -> SYN_SENT (Active Open) */}
                  <path
                    d="M 220 30 C 130 35 90 55 90 80"
                    fill="none"
                    stroke={isArcActive("CLOSED", "SYN_SENT", "client") ? "#14b8a6" : "#3f3f46"}
                    strokeWidth={isArcActive("CLOSED", "SYN_SENT", "client") ? "2" : "1.2"}
                    markerEnd={isArcActive("CLOSED", "SYN_SENT", "client") ? "url(#fsm-arrow-teal)" : "url(#fsm-arrow)"}
                  />
                  {/* CLOSED -> LISTEN (Passive Open) */}
                  <path
                    d="M 315 30 L 410 30"
                    fill="none"
                    stroke={isArcActive("CLOSED", "LISTEN", "server") ? "#38bdf8" : "#3f3f46"}
                    strokeWidth={isArcActive("CLOSED", "LISTEN", "server") ? "2" : "1.2"}
                    markerEnd={isArcActive("CLOSED", "LISTEN", "server") ? "url(#fsm-arrow-sky)" : "url(#fsm-arrow)"}
                  />
                  {/* LISTEN -> SYN_RCVD */}
                  <path
                    d="M 455 45 L 455 80"
                    fill="none"
                    stroke={isArcActive("LISTEN", "SYN_RCVD", "server") ? "#38bdf8" : "#3f3f46"}
                    strokeWidth={isArcActive("LISTEN", "SYN_RCVD", "server") ? "2" : "1.2"}
                    markerEnd={isArcActive("LISTEN", "SYN_RCVD", "server") ? "url(#fsm-arrow-sky)" : "url(#fsm-arrow)"}
                  />
                  {/* SYN_SENT -> SYN_RCVD (Simultaneous Open) */}
                  <path
                    d="M 145 94 L 410 94"
                    fill="none"
                    stroke={isArcActive("SYN_SENT", "SYN_RCVD", "client") ? "#14b8a6" : "#3f3f46"}
                    strokeWidth={isArcActive("SYN_SENT", "SYN_RCVD", "client") ? "2" : "1.2"}
                    strokeDasharray="3 3"
                    markerEnd={isArcActive("SYN_SENT", "SYN_RCVD", "client") ? "url(#fsm-arrow-teal)" : "url(#fsm-arrow)"}
                  />
                  {/* SYN_SENT -> ESTABLISHED */}
                  <path
                    d="M 95 110 C 110 135 155 155 205 160"
                    fill="none"
                    stroke={isArcActive("SYN_SENT", "ESTABLISHED", "client") ? "#14b8a6" : "#3f3f46"}
                    strokeWidth={isArcActive("SYN_SENT", "ESTABLISHED", "client") ? "2" : "1.2"}
                    markerEnd={isArcActive("SYN_SENT", "ESTABLISHED", "client") ? "url(#fsm-arrow-teal)" : "url(#fsm-arrow)"}
                  />
                  {/* SYN_RCVD -> ESTABLISHED */}
                  <path
                    d="M 455 110 C 430 135 385 155 330 160"
                    fill="none"
                    stroke={isArcActive("SYN_RCVD", "ESTABLISHED", "server") ? "#38bdf8" : "#3f3f46"}
                    strokeWidth={isArcActive("SYN_RCVD", "ESTABLISHED", "server") ? "2" : "1.2"}
                    markerEnd={isArcActive("SYN_RCVD", "ESTABLISHED", "server") ? "url(#fsm-arrow-sky)" : "url(#fsm-arrow)"}
                  />
                  {/* ESTABLISHED -> FIN_WAIT_1 (Active Close) */}
                  <path
                    d="M 215 178 C 160 195 120 205 95 215"
                    fill="none"
                    stroke={isArcActive("ESTABLISHED", "FIN_WAIT_1", "client") ? "#14b8a6" : "#3f3f46"}
                    strokeWidth={isArcActive("ESTABLISHED", "FIN_WAIT_1", "client") ? "2" : "1.2"}
                    markerEnd={isArcActive("ESTABLISHED", "FIN_WAIT_1", "client") ? "url(#fsm-arrow-teal)" : "url(#fsm-arrow)"}
                  />
                  {/* ESTABLISHED -> CLOSE_WAIT (Passive Close) */}
                  <path
                    d="M 320 178 C 375 195 415 205 440 215"
                    fill="none"
                    stroke={isArcActive("ESTABLISHED", "CLOSE_WAIT", "server") ? "#38bdf8" : "#3f3f46"}
                    strokeWidth={isArcActive("ESTABLISHED", "CLOSE_WAIT", "server") ? "2" : "1.2"}
                    markerEnd={isArcActive("ESTABLISHED", "CLOSE_WAIT", "server") ? "url(#fsm-arrow-sky)" : "url(#fsm-arrow)"}
                  />
                  {/* FIN_WAIT_1 -> FIN_WAIT_2 */}
                  <path
                    d="M 90 245 L 90 280"
                    fill="none"
                    stroke={isArcActive("FIN_WAIT_1", "FIN_WAIT_2", "client") ? "#14b8a6" : "#3f3f46"}
                    strokeWidth={isArcActive("FIN_WAIT_1", "FIN_WAIT_2", "client") ? "2" : "1.2"}
                    markerEnd={isArcActive("FIN_WAIT_1", "FIN_WAIT_2", "client") ? "url(#fsm-arrow-teal)" : "url(#fsm-arrow)"}
                  />
                  {/* FIN_WAIT_1 -> CLOSING */}
                  <path
                    d="M 140 235 L 180 250"
                    fill="none"
                    stroke={isArcActive("FIN_WAIT_1", "CLOSING", "client") ? "#14b8a6" : "#3f3f46"}
                    strokeWidth={isArcActive("FIN_WAIT_1", "CLOSING", "client") ? "2" : "1.2"}
                    markerEnd={isArcActive("FIN_WAIT_1", "CLOSING", "client") ? "url(#fsm-arrow-teal)" : "url(#fsm-arrow)"}
                  />
                  {/* FIN_WAIT_2 -> TIME_WAIT */}
                  <path
                    d="M 140 295 C 160 305 170 315 185 325"
                    fill="none"
                    stroke={isArcActive("FIN_WAIT_2", "TIME_WAIT", "client") ? "#14b8a6" : "#3f3f46"}
                    strokeWidth={isArcActive("FIN_WAIT_2", "TIME_WAIT", "client") ? "2" : "1.2"}
                    markerEnd={isArcActive("FIN_WAIT_2", "TIME_WAIT", "client") ? "url(#fsm-arrow-teal)" : "url(#fsm-arrow)"}
                  />
                  {/* CLOSING -> TIME_WAIT */}
                  <path
                    d="M 225 275 L 225 315"
                    fill="none"
                    stroke={isArcActive("CLOSING", "TIME_WAIT", "client") ? "#14b8a6" : "#3f3f46"}
                    strokeWidth={isArcActive("CLOSING", "TIME_WAIT", "client") ? "2" : "1.2"}
                    markerEnd={isArcActive("CLOSING", "TIME_WAIT", "client") ? "url(#fsm-arrow-teal)" : "url(#fsm-arrow)"}
                  />
                  {/* TIME_WAIT -> CLOSED (2*MSL timeout) */}
                  <path
                    d="M 235 315 C 270 240 260 100 265 48"
                    fill="none"
                    stroke={isArcActive("TIME_WAIT", "CLOSED", "client") ? "#14b8a6" : "#3f3f46"}
                    strokeWidth={isArcActive("TIME_WAIT", "CLOSED", "client") ? "2" : "1.2"}
                    strokeDasharray="3 3"
                    markerEnd={isArcActive("TIME_WAIT", "CLOSED", "client") ? "url(#fsm-arrow-teal)" : "url(#fsm-arrow)"}
                  />
                  {/* CLOSE_WAIT -> LAST_ACK */}
                  <path
                    d="M 460 245 L 460 280"
                    fill="none"
                    stroke={isArcActive("CLOSE_WAIT", "LAST_ACK", "server") ? "#38bdf8" : "#3f3f46"}
                    strokeWidth={isArcActive("CLOSE_WAIT", "LAST_ACK", "server") ? "2" : "1.2"}
                    markerEnd={isArcActive("CLOSE_WAIT", "LAST_ACK", "server") ? "url(#fsm-arrow-sky)" : "url(#fsm-arrow)"}
                  />
                  {/* LAST_ACK -> CLOSED */}
                  <path
                    d="M 460 310 C 510 240 500 50 315 25"
                    fill="none"
                    stroke={isArcActive("LAST_ACK", "CLOSED", "server") ? "#38bdf8" : "#3f3f46"}
                    strokeWidth={isArcActive("LAST_ACK", "CLOSED", "server") ? "2" : "1.2"}
                    strokeDasharray="3 3"
                    markerEnd={isArcActive("LAST_ACK", "CLOSED", "server") ? "url(#fsm-arrow-sky)" : "url(#fsm-arrow)"}
                  />

                  {/* State Nodes */}
                  {[
                    { state: "CLOSED" as TcpSocketState, x: 220, y: 15, w: 95, h: 30 },
                    { state: "LISTEN" as TcpSocketState, x: 410, y: 15, w: 90, h: 30 },
                    { state: "SYN_SENT" as TcpSocketState, x: 45, y: 80, w: 95, h: 30 },
                    { state: "SYN_RCVD" as TcpSocketState, x: 410, y: 80, w: 95, h: 30 },
                    { state: "ESTABLISHED" as TcpSocketState, x: 205, y: 145, w: 125, h: 34 },
                    { state: "FIN_WAIT_1" as TcpSocketState, x: 40, y: 215, w: 100, h: 30 },
                    { state: "FIN_WAIT_2" as TcpSocketState, x: 40, y: 280, w: 100, h: 30 },
                    { state: "CLOSING" as TcpSocketState, x: 180, y: 245, w: 90, h: 30 },
                    { state: "TIME_WAIT" as TcpSocketState, x: 175, y: 315, w: 100, h: 30 },
                    { state: "CLOSE_WAIT" as TcpSocketState, x: 410, y: 215, w: 100, h: 30 },
                    { state: "LAST_ACK" as TcpSocketState, x: 410, y: 280, w: 95, h: 30 },
                  ].map((node) => {
                    const serverState = server.childSockets.length > 0 ? server.childSockets[0].state : server.listenState;
                    const isClient = client.state === node.state;
                    const isServer = serverState === node.state;
                    const isSelected = (selectedFsmState ?? client.state) === node.state;

                    return (
                      <g
                        key={`svg-fsm-${node.state}`}
                        onClick={() => setSelectedFsmState(node.state)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault();
                            setSelectedFsmState(node.state);
                          }
                        }}
                        tabIndex={0}
                        role="button"
                        aria-pressed={isSelected}
                        aria-current={isClient || isServer ? "true" : undefined}
                        aria-label={`TCP State ${node.state}${isClient ? ", Active Client" : ""}${isServer ? ", Active Server" : ""}`}
                        className="cursor-pointer transition-all hover:opacity-90 focus:outline-none focus-visible:ring-1 focus-visible:ring-teal-400"
                      >
                        <rect
                          x={node.x}
                          y={node.y}
                          width={node.w}
                          height={node.h}
                          rx="6"
                          className={`transition-all duration-200 ${
                            isClient && isServer
                              ? "fill-teal-950/90 stroke-teal-400 stroke-2"
                              : isClient
                              ? "fill-teal-950/80 stroke-teal-400 stroke-2"
                              : isServer
                              ? "fill-sky-950/80 stroke-sky-400 stroke-2"
                              : isSelected
                              ? "fill-zinc-800 stroke-zinc-400 stroke-2"
                              : "fill-zinc-900/90 stroke-zinc-700/80 stroke-[1]"
                          }`}
                        />
                        <text
                          x={node.x + node.w / 2}
                          y={node.y + (isClient || isServer ? 16 : 19)}
                          textAnchor="middle"
                          className={`font-mono font-bold text-[11px] ${
                            isClient
                              ? "fill-teal-200"
                              : isServer
                              ? "fill-sky-200"
                              : isSelected
                              ? "fill-zinc-100"
                              : "fill-zinc-300"
                          }`}
                        >
                          {node.state}
                        </text>

                        {/* Active Pills on Node */}
                        {(isClient || isServer) && (
                          <g>
                            <text
                              x={node.x + node.w / 2}
                              y={node.y + 26}
                              textAnchor="middle"
                              className="font-mono text-[9px] font-semibold tracking-wider uppercase fill-zinc-200"
                            >
                              {isClient && isServer
                                ? "● Client & Server"
                                : isClient
                                ? "● Client"
                                : "● Server"}
                            </text>
                          </g>
                        )}
                      </g>
                    );
                  })}
                </svg>
              </div>
            </div>

            {/* Mobile View (< sm): Linear Stepper Flow */}
            <div className="block sm:hidden flex flex-col gap-3">
              {/* Client FSM Sequence */}
              <div className="rounded-lg border border-border/40 bg-zinc-950/60 p-3">
                <div className="flex justify-between items-center pb-2 border-b border-border/40 font-mono text-xs mb-2.5">
                  <span className="text-zinc-200 font-bold flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-teal-400" />
                    Client Machine Lifecycle
                  </span>
                  <span className="text-teal-400 text-xs font-semibold">
                    Active: {client.state}
                  </span>
                </div>

                {/* State badges flow */}
                <div className="flex flex-wrap items-center gap-1.5 font-mono text-xs">
                  {CLIENT_FSM_PATH.map((st, idx) => {
                    const isActive = client.state === st;
                    return (
                      <React.Fragment key={`cli-fsm-mob-${st}-${idx}`}>
                        <button
                          type="button"
                          onClick={() => setSelectedFsmState(st)}
                          className={`min-h-[44px] px-3 py-1.5 rounded text-[11px] font-bold border transition-transform active:scale-95 touch-manipulation cursor-pointer ${
                            isActive
                              ? "bg-teal-500/20 text-teal-200 border-teal-400 shadow-[0_0_10px_rgba(20,184,166,0.3)]"
                              : "bg-zinc-900/60 text-zinc-300 border-zinc-800 hover:text-zinc-100 hover:border-zinc-700"
                          }`}
                        >
                          {st}
                        </button>
                        {idx < CLIENT_FSM_PATH.length - 1 && (
                          <ArrowRight className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
                        )}
                      </React.Fragment>
                    );
                  })}
                </div>
              </div>

              {/* Server FSM Sequence */}
              <div className="rounded-lg border border-border/40 bg-zinc-950/60 p-3">
                <div className="flex justify-between items-center pb-2 border-b border-border/40 font-mono text-xs mb-2.5">
                  <span className="text-zinc-200 font-bold flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-sky-400" />
                    Server Machine Lifecycle
                  </span>
                  <span className="text-sky-400 text-xs font-semibold">
                    Active:{" "}
                    {server.childSockets.length > 0
                      ? server.childSockets[0].state
                      : server.listenState}
                  </span>
                </div>

                {/* State badges flow */}
                <div className="flex flex-wrap items-center gap-1.5 font-mono text-xs">
                  {SERVER_FSM_PATH.map((st, idx) => {
                    const currentServerState =
                      server.childSockets.length > 0
                        ? server.childSockets[0].state
                        : server.listenState;
                    const isActive = currentServerState === st;
                    return (
                      <React.Fragment key={`srv-fsm-mob-${st}-${idx}`}>
                        <button
                          type="button"
                          onClick={() => setSelectedFsmState(st)}
                          className={`min-h-[44px] px-3 py-1.5 rounded text-[11px] font-bold border transition-transform active:scale-95 touch-manipulation cursor-pointer ${
                            isActive
                              ? "bg-sky-500/20 text-sky-200 border-sky-400 shadow-[0_0_10px_rgba(56,189,248,0.3)]"
                              : "bg-zinc-900/60 text-zinc-300 border-zinc-800 hover:text-zinc-100 hover:border-zinc-700"
                          }`}
                        >
                          {st}
                        </button>
                        {idx < SERVER_FSM_PATH.length - 1 && (
                          <ArrowRight className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
                        )}
                      </React.Fragment>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* FSM State Explainer Drawer */}
            <div className="p-3 rounded-lg border border-border/40 bg-zinc-950/70 font-mono text-xs">
              <div className="flex items-center gap-1.5 text-zinc-200 font-semibold mb-1">
                <Info className="w-4 h-4 text-teal-400" />
                <span>
                  {selectedFsmState
                    ? `RFC 793 State: ${selectedFsmState}`
                    : `Active State: ${client.state}`}
                </span>
              </div>
              <p className="font-sans text-xs text-zinc-300 leading-relaxed">
                {getFsmStateExplanation(selectedFsmState ?? client.state)}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
