"use client";

import React, { useMemo } from "react";
import type { NetworkHost, WirePacket, SocketEntry } from "@/lib/network-simulator/engine";
import {
  Monitor,
  Server,
  ArrowRight,
  ArrowLeft,
  Radio,
  AlertCircle,
  CheckCircle2,
  Network,
} from "lucide-react";

interface NetworkTopologyCanvasProps {
  hosts: NetworkHost[];
  activePacket: WirePacket | null;
  activeSockets: SocketEntry[];
  onSelectPacket?: (packet: WirePacket) => void;
}

export function NetworkTopologyCanvas({
  hosts,
  activePacket,
  activeSockets,
  onSelectPacket,
}: NetworkTopologyCanvasProps) {
  const clientHosts = useMemo(() => hosts.filter((h) => h.role === "client"), [hosts]);
  const serverHosts = useMemo(() => hosts.filter((h) => h.role === "server"), [hosts]);

  // Determine if single-host collision mode
  const isPortConflictMode = hosts.length === 1 && hosts[0]?.id === "dev-server";

  if (isPortConflictMode) {
    const devHost = hosts[0];
    return (
      <div className="flex flex-col h-full bg-[#07080b] border border-border/60 rounded-xl p-5 overflow-y-auto select-none font-mono">
        {/* Canvas Header */}
        <div className="flex items-center justify-between pb-3 mb-5 border-b border-zinc-800/80">
          <div className="flex items-center gap-2">
            <Radio className="w-4 h-4 text-teal-400" />
            <span className="font-semibold text-zinc-200">Local Loopback Binding Canvas</span>
            <span className="text-[11px] text-zinc-500 font-sans">Single Host (127.0.0.1)</span>
          </div>
          <span className="text-xs px-2.5 py-0.5 rounded-full bg-zinc-800 text-zinc-400 border border-zinc-700/60 font-sans">
            Syscall: bind() & listen()
          </span>
        </div>

        {/* Dev Host Big Box */}
        <div className="flex-1 flex flex-col justify-center max-w-2xl mx-auto w-full">
          <div className="rounded-xl border border-zinc-700/80 bg-zinc-900/60 p-5 shadow-lg">
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-zinc-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-teal-500/10 border border-teal-500/25 flex items-center justify-center text-teal-400">
                  <Monitor className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-zinc-100">{devHost.name}</h4>
                  <div className="text-[11px] text-zinc-400 flex items-center gap-2 font-sans">
                    <span>
                      IP: <strong className="font-mono text-teal-300">{devHost.ip}</strong>
                    </span>
                    <span>•</span>
                    <span>
                      Interface: <strong className="font-mono text-zinc-300">{devHost.interfaceName}</strong>
                    </span>
                  </div>
                </div>
              </div>
              <span className="text-[10px] font-sans px-2 py-0.5 rounded bg-zinc-800 text-zinc-400 border border-zinc-700/60">
                Linux / POSIX Kernel
              </span>
            </div>

            {/* Applications & Port Binding Matrix */}
            <div className="space-y-3">
              <span className="text-[11px] uppercase tracking-wider text-zinc-500 font-semibold block">
                Running Processes & Bound Endpoints
              </span>

              {devHost.applications.map((app) => {
                const isConflict = app.status === "conflict";
                const isListening = app.status === "listening";

                return (
                  <div
                    key={app.id}
                    className={`p-3.5 rounded-lg border transition-all ${
                      isConflict
                        ? "bg-rose-950/25 border-rose-500/70 shadow-[0_0_15px_rgba(244,63,94,0.15)] ring-1 ring-rose-500/40"
                        : isListening
                        ? "bg-zinc-950/70 border-teal-500/40 shadow-sm"
                        : "bg-zinc-950/40 border-zinc-800"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <span className="text-zinc-200 font-bold">{app.name}</span>
                        <span className="text-[10px] text-zinc-500 font-sans">PID {app.pid}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-teal-300">
                          :{app.port}
                        </span>
                        {isConflict ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-rose-400 px-2 py-0.5 rounded bg-rose-500/10 border border-rose-500/30">
                            <AlertCircle className="w-3 h-3 text-rose-400" />
                            EADDRINUSE
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-teal-400 px-2 py-0.5 rounded bg-teal-500/10 border border-teal-500/30">
                            <CheckCircle2 className="w-3 h-3 text-teal-400" />
                            LISTENING
                          </span>
                        )}
                      </div>
                    </div>

                    {isConflict && (
                      <div className="mt-2 text-[11px] text-rose-300 font-sans leading-normal bg-rose-950/40 p-2 rounded border border-rose-900/40">
                        <strong>Kernel Rejection:</strong> Port {app.port} is already bound by another process without SO_REUSEPORT.
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-[#07080b] border border-border/60 rounded-xl p-4 sm:p-5 overflow-hidden select-none font-mono">
      {/* Topology Canvas Header */}
      <div className="flex items-center justify-between pb-3 mb-4 border-b border-zinc-800/80">
        <div className="flex items-center gap-2">
          <Network className="w-4 h-4 text-teal-400" />
          <span className="font-semibold text-zinc-200">Network Bus Topology</span>
          <span className="text-[11px] text-zinc-500 font-sans">Host Endpoints & In-Flight Frame</span>
        </div>
        <span className="text-xs px-2.5 py-0.5 rounded-full bg-zinc-800 text-zinc-400 border border-zinc-700/60 font-sans">
          Ethernet / IP Substrate
        </span>
      </div>

      {/* Main Grid: Clients (Left) | Wire (Center) | Server (Right) */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-4 items-center min-h-[340px]">
        {/* ── Left Column: Client Machine(s) ── */}
        <div className="lg:col-span-4 flex flex-col gap-3 justify-center">
          {clientHosts.map((client) => {
            const hasMultipleClients = clientHosts.length > 1;
            const isActivePeer =
              activePacket &&
              (client.id === activePacket.sourceHostId || client.id === activePacket.targetHostId);

            return (
              <div
                key={client.id}
                className={`rounded-xl border p-3.5 shadow-sm transition-all duration-200 ${
                  isActivePeer
                    ? "border-teal-500/80 bg-zinc-950 ring-1 ring-teal-500/50 shadow-[0_0_15px_rgba(20,184,166,0.15)]"
                    : hasMultipleClients && activePacket
                    ? "border-zinc-800/80 bg-zinc-950/60 opacity-70 hover:opacity-100"
                    : "border-zinc-800 bg-zinc-950/80 hover:border-zinc-700"
                }`}
              >
                {/* Host Title Bar */}
                <div className="flex items-center justify-between pb-2 mb-2.5 border-b border-zinc-800/60">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-teal-500/10 flex items-center justify-center text-teal-400 shrink-0">
                      <Monitor className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <h4 className="font-bold text-zinc-200 text-xs truncate">{client.name}</h4>
                        {isActivePeer && (
                          <span className="px-1.5 py-0.2 rounded text-[9px] font-sans font-bold bg-teal-500/20 text-teal-300 border border-teal-500/40 shrink-0">
                            Active Peer
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] text-teal-400/90">{client.ip}</span>
                    </div>
                  </div>
                  <span className="text-[10px] font-sans text-zinc-500 shrink-0">{client.interfaceName}</span>
                </div>

                {/* All Client Applications (Simulation Rule #2 - Transparency Rendering) */}
                <div className="space-y-2">
                  {client.applications.map((app) => {
                    const isConnected = app.status === "connected";
                    const isConnecting = app.status === "connecting";

                    return (
                      <div
                        key={app.id}
                        className="p-2.5 rounded-lg bg-zinc-900/60 border border-zinc-800/80 text-[11px]"
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-zinc-300 font-medium">{app.name}</span>
                          <span className="text-[10px] text-zinc-500 font-sans">PID {app.pid}</span>
                        </div>
                        <div className="flex items-center justify-between text-[10px]">
                          <span className="text-zinc-400">
                            Local Port: <strong className="font-mono text-teal-300">:{app.port}</strong>
                          </span>
                          <span
                            className={`px-1.5 py-0.5 rounded font-bold ${
                              isConnected
                                ? "bg-teal-500/20 text-teal-300 border border-teal-500/40"
                                : isConnecting
                                ? "bg-amber-500/20 text-amber-300 border border-amber-500/40"
                                : "bg-zinc-800 text-zinc-500"
                            }`}
                          >
                            {isConnected ? "CONNECTED" : isConnecting ? "SYN_SENT" : "IDLE"}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        {/* ── Center Column: Wire / Packet Transit ── */}
        <div className="lg:col-span-4 flex flex-col items-center justify-center py-4 relative">
          {/* Wire Background Rail */}
          <div className="w-full h-1 bg-zinc-800 rounded-full relative overflow-visible">
            {/* Active connection pulse line */}
            {activeSockets.some((s) => s.state === "ESTABLISHED") && (
              <div className="absolute inset-0 bg-gradient-to-r from-teal-500/30 via-teal-400/50 to-teal-500/30 rounded-full" />
            )}
          </div>

          {/* In-Transit Packet Card (Accessible native button) */}
          {activePacket ? (
            <button
              type="button"
              onClick={() => onSelectPacket?.(activePacket)}
              className="mt-3 cursor-pointer group focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-400 rounded-lg text-left"
              title="Click to view full protocol headers in inspector"
              aria-label={`Inspect in-transit packet: ${activePacket.label}`}
            >
              <div
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg bg-teal-500/20 border border-teal-400/50 text-teal-200 text-xs font-bold shadow-[0_0_15px_rgba(20,184,166,0.3)] transition-all duration-300 group-hover:scale-105 active:scale-95 motion-reduce:transform-none ${
                  activePacket.direction === "client-to-server"
                    ? "translate-x-1"
                    : "-translate-x-1"
                }`}
              >
                {activePacket.direction === "client-to-server" ? (
                  <ArrowRight className="w-3.5 h-3.5 text-teal-400 animate-pulse motion-reduce:animate-none" />
                ) : (
                  <ArrowLeft className="w-3.5 h-3.5 text-teal-400 animate-pulse motion-reduce:animate-none" />
                )}
                <span>{activePacket.label}</span>
              </div>
              <span className="text-[10px] text-zinc-500 block text-center mt-1 font-sans group-hover:text-teal-400 transition-colors">
                Inspect Packet ▾
              </span>
            </button>
          ) : (
            <div className="mt-3 text-[11px] text-zinc-600 font-sans italic">
              Idle Wire Bus
            </div>
          )}
        </div>

        {/* ── Right Column: Server Machine(s) ── */}
        <div className="lg:col-span-4 flex flex-col gap-3 justify-center">
          {serverHosts.map((server) => {
            const hasEstablishedConn = activeSockets.some(
              (s) => s.hostId === server.id && s.state === "ESTABLISHED"
            );

            return (
              <div
                key={server.id}
                className="rounded-xl border border-zinc-800 bg-zinc-950/80 p-3.5 shadow-sm transition-all hover:border-zinc-700"
              >
                {/* Host Title Bar */}
                <div className="flex items-center justify-between pb-2 mb-2.5 border-b border-zinc-800/60">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-teal-500/10 flex items-center justify-center text-teal-400 shrink-0">
                      <Server className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="font-bold text-zinc-200 text-xs">{server.name}</h4>
                      <span className="text-[10px] text-teal-400/90">{server.ip}</span>
                    </div>
                  </div>
                  <span className="text-[10px] font-sans text-zinc-500">{server.interfaceName}</span>
                </div>

                {/* Applications & Listening Sockets */}
                <div className="space-y-2">
                  {server.applications.map((app) => (
                    <div
                      key={app.id}
                      className="p-2.5 rounded-lg bg-zinc-900/60 border border-zinc-800/80 text-[11px]"
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-zinc-300 font-medium">{app.name}</span>
                        <span className="text-[10px] text-zinc-500 font-sans">PID {app.pid}</span>
                      </div>
                      <div className="flex items-center justify-between text-[10px]">
                        <span className="text-zinc-400">
                          Bound Port: <strong className="font-mono text-teal-300">:{app.port}</strong>
                        </span>
                        <span className="px-1.5 py-0.5 rounded font-bold bg-zinc-800 text-zinc-400 border border-zinc-700/60">
                          {hasEstablishedConn ? "SERVING" : "LISTENING"}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
