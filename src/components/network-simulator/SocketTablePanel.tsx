"use client";

import React from "react";
import type { SocketEntry } from "@/lib/network-simulator/engine";
import { Network, Radio, CheckCircle2, Clock, AlertTriangle, Disc } from "lucide-react";

interface SocketTablePanelProps {
  sockets: SocketEntry[];
  selectedSocket: SocketEntry | null;
  onSelectSocket: (socket: SocketEntry) => void;
}

export function SocketTablePanel({
  sockets,
  selectedSocket,
  onSelectSocket,
}: SocketTablePanelProps) {
  const getStatusBadge = (state: SocketEntry["state"]) => {
    switch (state) {
      case "ESTABLISHED":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-teal-500/15 text-teal-400 border border-teal-500/30">
            <CheckCircle2 className="w-3 h-3 text-teal-400" />
            ESTABLISHED
          </span>
        );
      case "SYN_SENT":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/15 text-amber-400 border border-amber-500/30">
            <Clock className="w-3 h-3 text-amber-400 animate-spin" />
            SYN_SENT
          </span>
        );
      case "SYN_RECEIVED":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-sky-500/15 text-sky-400 border border-sky-500/30">
            <Radio className="w-3 h-3 text-sky-400" />
            SYN_RCVD
          </span>
        );
      case "LISTEN":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-zinc-800/80 text-zinc-400 border border-zinc-700/60">
            <Disc className="w-3 h-3 text-zinc-400" />
            LISTEN
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/15 text-rose-400 border border-rose-500/30">
            <AlertTriangle className="w-3 h-3 text-rose-400" />
            {state}
          </span>
        );
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#0a0c10] border border-border/60 rounded-xl overflow-hidden shadow-sm font-mono text-xs">
      {/* Panel Header */}
      <div className="px-4 py-3 border-b border-border/60 bg-zinc-900/60 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Network className="w-4 h-4 text-teal-400" />
          <h3 className="font-semibold text-zinc-200">Kernel Socket Table</h3>
          <span className="text-[10px] font-sans px-2 py-0.5 rounded bg-zinc-800 text-zinc-400 border border-zinc-700/50">
            netstat / ss
          </span>
        </div>
        <span className="text-[11px] text-zinc-500">
          {sockets.length} {sockets.length === 1 ? "Socket" : "Sockets"} Active
        </span>
      </div>

      {/* Sockets Listbox (WAI-ARIA compliant) */}
      <div
        role="listbox"
        aria-label="Active kernel sockets"
        className="flex-1 overflow-y-auto p-3 space-y-2"
      >
        {sockets.length === 0 ? (
          <div className="text-center py-8 text-zinc-500 font-sans">
            No active sockets in current step.
          </div>
        ) : (
          sockets.map((sock) => {
            const isSelected = selectedSocket?.id === sock.id;
            const isListening = sock.isListening;

            return (
              <button
                type="button"
                key={sock.id}
                role="option"
                aria-selected={isSelected}
                onClick={() => onSelectSocket(sock)}
                className={`w-full text-left p-3 rounded-lg border transition-all duration-200 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-400 ${
                  isSelected
                    ? "bg-teal-950/30 border-teal-500/60 shadow-[0_0_12px_rgba(20,184,166,0.15)] ring-1 ring-teal-500/40"
                    : isListening
                    ? "bg-zinc-950/40 border-zinc-800/60 hover:border-zinc-700/80 opacity-75 hover:opacity-100"
                    : "bg-zinc-950/70 border-zinc-800/80 hover:border-teal-500/40"
                }`}
              >
                {/* Top row: Process & State */}
                <div className="flex items-center justify-between mb-2">
                  <span className="font-bold text-zinc-200 truncate max-w-[180px]">
                    {sock.processName}
                  </span>
                  {getStatusBadge(sock.state)}
                </div>

                {/* 4-Tuple Demux Display */}
                <div className="grid grid-cols-2 gap-2 text-[11px] bg-zinc-900/60 p-2 rounded border border-zinc-800/60 mb-2">
                  <div>
                    <span className="text-zinc-500 text-[10px] block uppercase font-sans">Local Endpoint</span>
                    <span className="text-teal-300 font-semibold truncate block">
                      {sock.localIp}:{sock.localPort}
                    </span>
                  </div>
                  <div>
                    <span className="text-zinc-500 text-[10px] block uppercase font-sans">Remote Endpoint</span>
                    <span className="text-zinc-300 truncate block">
                      {sock.remoteIp === "*" ? "*:*" : `${sock.remoteIp}:${sock.remotePort}`}
                    </span>
                  </div>
                </div>

                {/* Buffer & Protocol Telemetry */}
                <div className="flex items-center justify-between text-[10px] text-zinc-400 font-sans pt-1">
                  <span>Proto: <strong className="text-zinc-300 font-mono">{sock.protocol}</strong></span>
                  <div className="flex items-center gap-3 font-mono">
                    <span>Send-Q: <strong className="text-zinc-200">{sock.sendBufferBytes}B</strong></span>
                    <span>Recv-Q: <strong className="text-zinc-200">{sock.recvBufferBytes}B</strong></span>
                  </div>
                </div>
              </button>
            );
          })
        )}
      </div>

      {/* Explanatory Footer */}
      <div className="p-2.5 px-3 bg-zinc-950/80 border-t border-border/40 text-[11px] text-zinc-400 font-sans leading-normal">
        <strong className="text-zinc-300">Rule:</strong> Sockets are indexed by the 4-tuple. Multiple established connections can bind the same server port if remote endpoints differ.
      </div>
    </div>
  );
}
