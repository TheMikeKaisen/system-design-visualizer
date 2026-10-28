"use client";

import React from "react";
import type { TcpStepData, TcpSegment, TcpSocketState } from "@/lib/network-simulator/tcp-engine";
import {
  Laptop,
  Server,
  ArrowRight,
  ArrowLeft,
  ShieldAlert,
  CheckCircle2,
  Clock,
  Activity,
  Radio,
  AlertOctagon,
} from "lucide-react";

interface TcpTopologyCanvasProps {
  tcpData: TcpStepData;
  onSelectSegment?: (segment: TcpSegment | null) => void;
}

export function TcpTopologyCanvas({ tcpData, onSelectSegment }: TcpTopologyCanvasProps) {
  const { client, server, wire, sequenceArithmetic } = tcpData;

  const getStateBadgeStyle = (state: TcpSocketState) => {
    switch (state) {
      case "ESTABLISHED":
        return "text-emerald-400 bg-emerald-950/60 border-emerald-500/40 shadow-[0_0_12px_rgba(16,185,129,0.25)]";
      case "SYN_SENT":
      case "SYN_RCVD":
        return "text-amber-400 bg-amber-950/60 border-amber-500/40 animate-pulse";
      case "LISTEN":
        return "text-sky-400 bg-sky-950/60 border-sky-500/40";
      case "FIN_WAIT_1":
      case "FIN_WAIT_2":
        return "text-cyan-400 bg-cyan-950/60 border-cyan-500/40";
      case "CLOSE_WAIT":
        return "text-orange-400 bg-orange-950/60 border-orange-500/40";
      case "TIME_WAIT":
        return "text-yellow-400 bg-yellow-950/60 border-yellow-500/40";
      case "LAST_ACK":
      case "CLOSING":
        return "text-purple-400 bg-purple-950/60 border-purple-500/40";
      case "CLOSED":
      default:
        return "text-zinc-500 bg-zinc-900 border-zinc-800";
    }
  };

  const getFlagsLabel = (segment: TcpSegment) => {
    const flags = segment.flags;
    const parts: string[] = [];
    if (flags.cwr) parts.push("CWR");
    if (flags.ece) parts.push("ECE");
    if (flags.urg) parts.push("URG");
    if (flags.ack) parts.push("ACK");
    if (flags.psh) parts.push("PSH");
    if (flags.rst) parts.push("RST");
    if (flags.syn) parts.push("SYN");
    if (flags.fin) parts.push("FIN");
    return parts.join(", ") || "NONE";
  };

  return (
    <div className="h-full w-full rounded-xl bg-[#06080d] border border-border/60 p-3 sm:p-5 flex flex-col justify-between overflow-y-auto select-none relative font-sans shadow-sm">
      {/* ── Top Header: 4-Tuple and Status Bar ── */}
      <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-border/40 font-mono text-xs">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-teal-400 animate-pulse" />
          <span className="text-zinc-300 font-semibold uppercase tracking-wider text-[11px]">
            TCP Connection Topology
          </span>
          <span className="text-zinc-600 hidden sm:inline">|</span>
          <span className="text-zinc-400 text-[11px] truncate">
            4-Tuple:{" "}
            <code className="text-teal-300 font-semibold">
              {client.ip}:{client.port} &harr; {server.ip}:{server.port}
            </code>
          </span>
        </div>

        <div className="flex items-center gap-2">
          {server.backlog.synCookiesActive && (
            <span className="flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/30">
              <ShieldAlert className="w-3 h-3 text-amber-400" />
              SYN Cookies Active
            </span>
          )}
          <span
            className={`px-2.5 py-0.5 rounded text-[11px] font-semibold border ${getStateBadgeStyle(
              client.state
            )}`}
          >
            Client: {client.state}
          </span>
          <span
            className={`px-2.5 py-0.5 rounded text-[11px] font-semibold border ${getStateBadgeStyle(
              server.childSockets.length > 0
                ? server.childSockets[0].state
                : server.listenState
            )}`}
          >
            Server:{" "}
            {server.childSockets.length > 0
              ? server.childSockets[0].state
              : server.listenState}
          </span>
        </div>
      </div>

      {/* ── Main Dual-Horizon Canvas Grid ── */}
      <div className="my-4 grid grid-cols-1 lg:grid-cols-12 gap-3 items-center min-h-[300px]">
        {/* ── Left Host Card: Client Machine ── */}
        <div className="lg:col-span-4 rounded-lg bg-zinc-950/80 border border-zinc-800 p-3.5 flex flex-col gap-2.5 shadow-sm">
          <div className="flex items-center justify-between pb-2 border-b border-zinc-800/80">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-md bg-zinc-900 text-teal-400">
                <Laptop className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-xs font-semibold text-zinc-200">Client Workstation</h3>
                <p className="text-[10px] font-mono text-zinc-400">{client.ip}</p>
              </div>
            </div>
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-zinc-400">
              eth0
            </span>
          </div>

          {/* Active Syscall Callout */}
          <div className="flex items-center justify-between px-2.5 py-1.5 rounded bg-zinc-900/90 border border-zinc-800 font-mono text-[11px]">
            <span className="text-zinc-500">Syscall:</span>
            <span className="text-teal-300 font-medium truncate max-w-[170px]" title={client.activeSyscall}>
              {client.activeSyscall}
            </span>
          </div>

          {/* Ephemeral Socket Box */}
          <div className="p-2.5 rounded border border-zinc-800/90 bg-zinc-900/50 flex flex-col gap-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-zinc-400 font-mono">Port :{client.port}</span>
              <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold border ${getStateBadgeStyle(client.state)}`}>
                {client.state}
              </span>
            </div>

            {/* Sequence Counters */}
            <div className="grid grid-cols-2 gap-1.5 text-[11px] font-mono pt-1 border-t border-zinc-800/50">
              <div className="flex flex-col">
                <span className="text-zinc-500 text-[10px]">Client ISN</span>
                <span className="text-zinc-300 font-semibold">{sequenceArithmetic.clientISN}</span>
              </div>
              <div className="flex flex-col">
                <span className="text-zinc-500 text-[10px]">Next Expected Seq</span>
                <span className="text-teal-300 font-semibold">{sequenceArithmetic.clientNextSeq}</span>
              </div>
            </div>

            {/* RTO Timer Countdown if Active */}
            {client.rtoTimer && client.rtoTimer.running && (
              <div className="mt-1 pt-1.5 border-t border-zinc-800/60 flex flex-col gap-1">
                <div className="flex items-center justify-between text-[10px] font-mono">
                  <span className="text-amber-400 flex items-center gap-1">
                    <Clock className="w-3 h-3 animate-spin" />
                    RTO Timer (Retries: {client.rtoTimer.retransmissions})
                  </span>
                  <span className="text-amber-300 font-semibold">{client.rtoTimer.currentMs}ms / {client.rtoTimer.timeoutMs}ms</span>
                </div>
                <div className="w-full bg-zinc-800 h-1.5 rounded-full overflow-hidden">
                  <div
                    className="bg-amber-400 h-full transition-all duration-300 ease-out"
                    style={{
                      width: `${Math.min(
                        100,
                        Math.max(
                          5,
                          client.rtoTimer.timeoutMs > 0
                            ? (client.rtoTimer.currentMs / client.rtoTimer.timeoutMs) * 100
                            : 0
                        )
                      )}%`,
                    }}
                  />
                </div>
              </div>
            )}

            {/* Send & Recv Buffers */}
            <div className="grid grid-cols-2 gap-2 text-[10px] font-mono pt-1">
              <div>
                <div className="flex justify-between text-zinc-500 pb-0.5">
                  <span>Send-Q</span>
                  <span>{client.sendBuffer.bytes} B</span>
                </div>
                <div className="w-full bg-zinc-800 h-1 rounded-full overflow-hidden">
                  <div
                    className="bg-teal-400 h-full"
                    style={{
                      width: `${Math.min(100, (client.sendBuffer.bytes / (client.sendBuffer.max || 1)) * 100)}%`,
                    }}
                  />
                </div>
              </div>
              <div>
                <div className="flex justify-between text-zinc-500 pb-0.5">
                  <span>Recv-Q</span>
                  <span>{client.recvBuffer.bytes} B</span>
                </div>
                <div className="w-full bg-zinc-800 h-1 rounded-full overflow-hidden">
                  <div
                    className="bg-teal-400 h-full"
                    style={{
                      width: `${Math.min(100, (client.recvBuffer.bytes / (client.recvBuffer.max || 1)) * 100)}%`,
                    }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── Middle: Wire Substrate & In-Flight Packet Segment ── */}
        <div className="lg:col-span-4 flex flex-col items-center justify-center p-2 relative">
          {/* Wire Backbone Graphic with directional travel rail */}
          <div className="w-full relative flex items-center justify-center py-6 px-2">
            {/* Cable Base Line */}
            <div className="absolute inset-x-2 h-1 bg-zinc-800 rounded-full overflow-hidden relative">
              {/* Directional Wave Pulse on Active Transmission */}
              {wire.activeSegment && !wire.dropped && (
                <div
                  className={`absolute top-0 bottom-0 w-1/3 bg-gradient-to-r rounded-full ${
                    wire.activeSegment.direction === "client-to-server"
                      ? "from-transparent via-teal-400 to-transparent animate-pulse"
                      : "from-transparent via-sky-400 to-transparent animate-pulse"
                  }`}
                  style={{
                    left: `${
                      wire.activeSegment.direction === "client-to-server"
                        ? Math.max(0, Math.min(67, (wire.progress ?? 0.5) * 67))
                        : Math.max(0, Math.min(67, (1 - (wire.progress ?? 0.5)) * 67))
                    }%`,
                    transition: "left 400ms ease-out",
                  }}
                />
              )}
            </div>

            {/* Dropped Wire Breakdown Indicator */}
            {wire.dropped && (
              <div className="absolute inset-x-12 h-1 bg-rose-500/80 animate-ping rounded-full" />
            )}
            
            {/* Packet Segment Pill with tactile touch feedback */}
            {wire.activeSegment ? (
              <button
                type="button"
                onClick={() => onSelectSegment?.(wire.activeSegment)}
                className={`relative z-10 min-h-[44px] px-3.5 py-2 rounded-lg border flex flex-col gap-1 items-center transition-all hover:scale-[1.03] active:scale-[0.97] touch-manipulation cursor-pointer shadow-lg max-w-full ${
                  wire.dropped
                    ? "bg-rose-950/90 border-rose-500/70 text-rose-200 shadow-[0_0_18px_rgba(244,63,94,0.35)] animate-pulse"
                    : wire.activeSegment.flags.rst
                    ? "bg-rose-950/80 border-rose-500/50 text-rose-300"
                    : wire.activeSegment.flags.syn && wire.activeSegment.flags.ack
                    ? "bg-teal-950/90 border-teal-500/60 text-teal-200 shadow-[0_0_14px_rgba(20,184,166,0.25)]"
                    : wire.activeSegment.flags.syn
                    ? "bg-amber-950/90 border-amber-500/60 text-amber-200 shadow-[0_0_14px_rgba(245,158,11,0.25)]"
                    : wire.activeSegment.flags.fin
                    ? "bg-cyan-950/90 border-cyan-500/60 text-cyan-200"
                    : "bg-zinc-900 border-zinc-700 text-zinc-200"
                }`}
                aria-label={`Inspect TCP Segment: ${getFlagsLabel(wire.activeSegment)}`}
              >
                {/* Flow Direction & Flags Badge */}
                <div className="flex items-center gap-1.5 font-mono text-[11px] font-bold">
                  {wire.activeSegment.direction === "client-to-server" ? (
                    <ArrowRight className="w-3.5 h-3.5 text-teal-400 shrink-0" />
                  ) : (
                    <ArrowLeft className="w-3.5 h-3.5 text-sky-400 shrink-0" />
                  )}
                  <span className="uppercase tracking-wide">
                    [{getFlagsLabel(wire.activeSegment)}]
                  </span>
                  {wire.dropped && (
                    <span className="flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-rose-500 text-white text-[9px] uppercase font-bold tracking-wider">
                      <AlertOctagon className="w-3 h-3" />
                      DROPPED
                    </span>
                  )}
                </div>

                {/* Packet Numbers */}
                <div className="flex items-center gap-2 font-mono text-[10px] text-zinc-300">
                  <span>Seq={wire.activeSegment.seqNumber}</span>
                  {wire.activeSegment.ackNumber !== null && (
                    <span>Ack={wire.activeSegment.ackNumber}</span>
                  )}
                  {wire.activeSegment.payloadLength > 0 && (
                    <span className="text-teal-300 font-bold">
                      Len={wire.activeSegment.payloadLength}B
                    </span>
                  )}
                </div>

                {wire.dropped && wire.activeSegment.dropReason && (
                  <span className="text-[9px] font-mono text-rose-300/90 text-center">
                    {wire.activeSegment.dropReason}
                  </span>
                )}

                <span className="text-[9px] text-zinc-400 underline font-sans pt-0.5">
                  Click to inspect header
                </span>
              </button>
            ) : (
              <div className="relative z-10 px-3 py-1.5 rounded-full bg-zinc-900 border border-zinc-800 text-zinc-500 font-mono text-[10px]">
                Wire Idle (No In-Flight Segment)
              </div>
            )}
          </div>
        </div>

        {/* ── Right Host Card: Server Machine ── */}
        <div className="lg:col-span-4 rounded-lg bg-zinc-950/80 border border-zinc-800 p-3.5 flex flex-col gap-2.5 shadow-sm">
          <div className="flex items-center justify-between pb-2 border-b border-zinc-800/80">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-md bg-zinc-900 text-sky-400">
                <Server className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-xs font-semibold text-zinc-200">Server Host</h3>
                <p className="text-[10px] font-mono text-zinc-400">{server.ip}</p>
              </div>
            </div>
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-zinc-400">
              eth0
            </span>
          </div>

          {/* Active Syscall Callout */}
          <div className="flex items-center justify-between px-2.5 py-1.5 rounded bg-zinc-900/90 border border-zinc-800 font-mono text-[11px]">
            <span className="text-zinc-500">Syscall:</span>
            <span className="text-sky-300 font-medium truncate max-w-[170px]" title={server.activeSyscall}>
              {server.activeSyscall}
            </span>
          </div>

          {/* Persistent Listening Parent Socket */}
          <div className="p-2.5 rounded border border-zinc-800/90 bg-zinc-900/50 flex flex-col gap-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-zinc-300 font-mono font-medium">*:80 [LISTEN]</span>
              <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold border ${getStateBadgeStyle(server.listenState)}`}>
                {server.listenState}
              </span>
            </div>

            {/* Server Sequence Counters */}
            <div className="grid grid-cols-2 gap-1.5 text-[11px] font-mono pt-1 border-t border-zinc-800/50">
              <div className="flex flex-col">
                <span className="text-zinc-500 text-[10px]">Server ISN</span>
                <span className="text-zinc-300 font-semibold">{sequenceArithmetic.serverISN}</span>
              </div>
              <div className="flex flex-col">
                <span className="text-zinc-500 text-[10px]">Next Expected Seq</span>
                <span className="text-sky-300 font-semibold">{sequenceArithmetic.serverNextSeq}</span>
              </div>
            </div>

            {/* Dual Backlog Capacity Meters */}
            <div className="space-y-1.5 pt-1 border-t border-zinc-800/50">
              {/* 1. SYN Backlog (SYN_RCVD) */}
              <div>
                <div className="flex justify-between items-center text-[10px] font-mono pb-0.5">
                  <span className="text-zinc-400 flex items-center gap-1">
                    <Radio className="w-2.5 h-2.5 text-amber-400" />
                    SYN Backlog (Half-Open):
                  </span>
                  <span
                    className={
                      server.backlog.synBacklog.current >= server.backlog.synBacklog.max
                        ? "text-rose-400 font-bold"
                        : "text-amber-300 font-semibold"
                    }
                  >
                    {server.backlog.synBacklog.current} / {server.backlog.synBacklog.max}
                  </span>
                </div>
                <div className="w-full bg-zinc-800 h-1.5 rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all duration-300 ease-out ${
                      server.backlog.synBacklog.current >= server.backlog.synBacklog.max
                        ? "bg-rose-500 animate-pulse"
                        : "bg-amber-400"
                    }`}
                    style={{
                      width: `${Math.min(
                        100,
                        (server.backlog.synBacklog.current / (server.backlog.synBacklog.max || 1)) * 100
                      )}%`,
                    }}
                  />
                </div>
              </div>

              {/* 2. Accept Queue (ESTABLISHED) */}
              <div>
                <div className="flex justify-between items-center text-[10px] font-mono pb-0.5">
                  <span className="text-zinc-400 flex items-center gap-1">
                    <CheckCircle2 className="w-2.5 h-2.5 text-emerald-400" />
                    Accept Queue (Ready):
                  </span>
                  <span className="text-emerald-300 font-semibold">
                    {server.backlog.acceptQueue.current} / {server.backlog.acceptQueue.max}
                  </span>
                </div>
                <div className="w-full bg-zinc-800 h-1.5 rounded-full overflow-hidden">
                  <div
                    className="bg-emerald-400 h-full transition-all duration-300 ease-out"
                    style={{
                      width: `${Math.min(
                        100,
                        (server.backlog.acceptQueue.current / (server.backlog.acceptQueue.max || 1)) * 100
                      )}%`,
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Spawned Child Socket (if any) */}
            {server.childSockets.length > 0 && (
              <div className="mt-1 p-2 rounded bg-emerald-950/30 border border-emerald-500/30 flex flex-col gap-1 text-[10px] font-mono">
                <div className="flex items-center justify-between text-emerald-400 font-bold">
                  <span>Spawned Connection</span>
                  <span className="px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300">
                    {server.childSockets[0].state}
                  </span>
                </div>
                <span className="text-zinc-300 text-[9px] truncate">
                  {server.childSockets[0].localAddr} &harr; {server.childSockets[0].peerAddr}
                </span>
                <span className="text-zinc-400 text-[9px]">
                  Worker: {server.childSockets[0].process}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Bottom Callout: Sequence Arithmetic & Byte Math Breakdown ── */}
      <div className="mt-2 pt-2.5 border-t border-border/40 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 font-mono text-xs bg-zinc-950/60 p-2.5 rounded-lg border border-zinc-800">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-teal-400 shrink-0" />
          <span className="text-zinc-400 text-[11px] font-sans">
            Sequence Math:
          </span>
          <span className="text-teal-300 font-semibold text-[11px]">
            {sequenceArithmetic.formulaCallout || "Handshake Sequence Arithmetic Active"}
          </span>
        </div>

        {sequenceArithmetic.explanation && (
          <p className="text-[11px] font-sans text-zinc-400 sm:text-right max-w-md">
            {sequenceArithmetic.explanation}
          </p>
        )}
      </div>
    </div>
  );
}
