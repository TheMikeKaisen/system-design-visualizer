"use client";

import React, { useState } from "react";
import type { WirePacket, SocketEntry } from "@/lib/network-simulator/engine";
import { Layers, FileCode, ShieldCheck, Radio } from "lucide-react";

interface PacketInspectorPanelProps {
  packet: WirePacket | null;
  scenarioId?: string;
  stepBadge?: string;
  stepIndex?: number;
  selectedSocket?: SocketEntry | null;
  highlightedElement?: {
    type: "host" | "socket" | "packet" | "port";
    id: string;
  };
}

export function PacketInspectorPanel({
  packet,
  scenarioId,
  stepBadge,
  selectedSocket,
}: PacketInspectorPanelProps) {
  const [activeTab, setActiveTab] = useState<"all" | "l2" | "l3" | "l4" | "l7">("all");

  if (!packet) {
    return (
      <div className="flex flex-col items-center justify-center h-full bg-[#0a0c10] border border-border/60 rounded-xl p-6 text-center font-mono text-xs">
        <div className="w-10 h-10 rounded-full bg-zinc-900 flex items-center justify-center text-zinc-500 mb-3 border border-zinc-800">
          <Layers className="w-5 h-5" />
        </div>
        <h4 className="font-semibold text-zinc-300 mb-1">No Packet on Wire</h4>
        <p className="text-zinc-500 font-sans max-w-xs text-[11px] leading-relaxed">
          Step forward or click a step where a packet is in transit between client and server to inspect wire protocol headers.
        </p>
      </div>
    );
  }

  const { ethernet, ip, transport, payload } = packet.headerData;
  const isWireDissection =
    scenarioId === "wire-dissection" ||
    ethernet.srcMac.includes("Pending") ||
    ip.version.includes("Pending") ||
    transport.flagsStr.includes("Pending");

  // Determine active encapsulation layer in wire-dissection
  const isL7Active = isWireDissection && stepBadge?.includes("Layer 7");
  const isL4Active = isWireDissection && stepBadge?.includes("Layer 4");
  const isL3Active = isWireDissection && stepBadge?.includes("Layer 3");
  const isL2Active = isWireDissection && stepBadge?.includes("Layer 2");

  const isL2Pending = isWireDissection && ethernet.srcMac.includes("Pending");
  const isL3Pending = isWireDissection && ip.version.includes("Pending");
  const isL4Pending = isWireDissection && transport.flagsStr.includes("Pending");

  // 8-bit TCP control flags breakdown
  const isSyn = Boolean(packet.flags.syn || transport.flagsStr.includes("SYN"));
  const isAck = Boolean(packet.flags.ack || transport.flagsStr.includes("ACK"));
  const isFin = Boolean(packet.flags.fin || transport.flagsStr.includes("FIN"));
  const isPsh = Boolean(packet.flags.psh || transport.flagsStr.includes("PSH"));
  const isRst = Boolean(packet.flags.rst || transport.flagsStr.includes("RST"));

  const tcpFlagBits = [
    { name: "CWR", bit: 7, val: 0, desc: "Congestion Window Reduced" },
    { name: "ECE", bit: 6, val: 0, desc: "ECN-Echo" },
    { name: "URG", bit: 5, val: 0, desc: "Urgent Pointer" },
    { name: "ACK", bit: 4, val: isAck ? 1 : 0, desc: "Acknowledgment" },
    { name: "PSH", bit: 3, val: isPsh ? 1 : 0, desc: "Push Data" },
    { name: "RST", bit: 2, val: isRst ? 1 : 0, desc: "Reset Connection" },
    { name: "SYN", bit: 1, val: isSyn ? 1 : 0, desc: "Synchronize Sequence Numbers" },
    { name: "FIN", bit: 0, val: isFin ? 1 : 0, desc: "Finish / Terminate" },
  ];

  return (
    <div className="flex flex-col h-full bg-[#0a0c10] border border-border/60 rounded-xl overflow-hidden shadow-sm font-mono text-xs">
      {/* Header bar */}
      <div className="px-4 py-3 border-b border-border/60 bg-zinc-900/60 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FileCode className="w-4 h-4 text-teal-400" />
          <h3 className="font-semibold text-zinc-200">Wire Packet Inspector</h3>
          <span className="text-[10px] font-sans px-2 py-0.5 rounded bg-teal-500/10 text-teal-400 border border-teal-500/30">
            {packet.label}
          </span>
        </div>
        {isWireDissection && (
          <span className="text-[10px] font-sans px-2 py-0.5 rounded bg-sky-500/10 text-sky-400 border border-sky-500/25">
            Encapsulation Dissection
          </span>
        )}
      </div>

      {/* Layer Filter Pills (WAI-ARIA compliant) */}
      <div
        role="tablist"
        aria-label="Packet protocol layers"
        className="flex items-center gap-1.5 px-3 py-2 border-b border-border/40 bg-zinc-950/80 text-[11px] overflow-x-auto"
      >
        {(
          [
            { id: "all", label: "Full Stack" },
            { id: "l2", label: "L2 Eth" },
            { id: "l3", label: "L3 IP" },
            { id: "l4", label: "L4 TCP" },
            { id: "l7", label: "L7 App" },
          ] as const
        ).map((tab) => (
          <button
            key={tab.id}
            type="button"
            role="tab"
            id={`packet-tab-${tab.id}`}
            aria-selected={activeTab === tab.id}
            aria-controls={`packet-panel-${tab.id}`}
            onClick={() => setActiveTab(tab.id)}
            className={`px-2.5 py-1 rounded text-[10px] font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-400 ${
              activeTab === tab.id
                ? "bg-teal-500/20 text-teal-300 border border-teal-500/50 shadow-sm"
                : "bg-zinc-900 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Stack Encapsulation View */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {/* Multi-Client / 4-Tuple Demux Correlation Banner */}
        {scenarioId === "multi-client-demux" && (
          <div className="p-2.5 rounded-lg bg-zinc-900/90 border border-teal-500/30 text-[11px] shadow-sm">
            <div className="flex items-center justify-between text-zinc-400 font-sans text-[10px] mb-1.5">
              <span className="font-bold text-teal-300 flex items-center gap-1.5 font-mono">
                <Radio className="w-3 h-3 text-teal-400" />
                4-Tuple Demultiplexing Key
              </span>
              <span className="text-[10px] text-zinc-400 font-mono">
                Target: {packet.targetHostId}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2 bg-[#07080b] p-2 rounded border border-zinc-800">
              <div>
                <span className="text-zinc-500 text-[10px] block font-sans">Packet Source</span>
                <span className="text-sky-300 font-bold block truncate">
                  {ip.srcIp}:{transport.srcPort}
                </span>
                <span className="text-[9px] text-zinc-500 font-sans">
                  Origin: {packet.sourceHostId}
                </span>
              </div>
              <div>
                <span className="text-zinc-500 text-[10px] block font-sans">Packet Destination</span>
                <span className="text-emerald-300 font-bold block truncate">
                  {ip.dstIp}:{transport.dstPort}
                </span>
                <span className="text-[9px] text-zinc-500 font-sans">
                  Server Listener: :443
                </span>
              </div>
            </div>
            {selectedSocket && (
              <div className="mt-1.5 text-[10px] text-zinc-400 font-sans flex items-center justify-between">
                <span>Selected Table Socket:</span>
                <span className="font-mono text-teal-300 font-semibold">{selectedSocket.id}</span>
              </div>
            )}
          </div>
        )}

        {/* ── Layer 2: Ethernet Frame ── */}
        {(activeTab === "all" || activeTab === "l2") && (
          <div
            id="packet-panel-l2"
            role="tabpanel"
            aria-labelledby="packet-tab-l2"
            tabIndex={0}
            className={`rounded-lg p-3 transition-all ${
              isL2Pending
                ? "border border-dashed border-zinc-800 bg-zinc-950/30 opacity-40"
                : isL2Active
                ? "border-2 border-sky-500/80 bg-sky-950/25 ring-2 ring-sky-500/40 shadow-[0_0_15px_rgba(14,165,233,0.15)]"
                : "border border-zinc-800/80 bg-zinc-950/60"
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] uppercase font-bold text-sky-400 tracking-wider flex items-center gap-1.5">
                Layer 2 · Data Link (Ethernet Frame)
                {isL2Active && (
                  <span className="px-1.5 py-0.5 rounded text-[9px] font-sans font-bold bg-sky-500/20 text-sky-300 border border-sky-500/40">
                    Active Layer
                  </span>
                )}
                {isL2Pending && (
                  <span className="px-1.5 py-0.5 rounded text-[9px] font-sans text-zinc-500 bg-zinc-900 border border-zinc-800">
                    Pending Encapsulation
                  </span>
                )}
              </span>
              <span className="text-[10px] text-zinc-500">Hardware Hop</span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-[11px] bg-zinc-900/60 p-2 rounded">
              <div>
                <span className="text-zinc-500 text-[10px] block font-sans">Source MAC</span>
                <span className="text-zinc-200">{ethernet.srcMac}</span>
              </div>
              <div>
                <span className="text-zinc-500 text-[10px] block font-sans">Destination MAC</span>
                <span className="text-zinc-200">{ethernet.dstMac}</span>
              </div>
            </div>
            <div className="mt-1.5 text-[10px] text-zinc-500 flex justify-between font-sans">
              <span>EtherType: <strong className="font-mono text-zinc-400">{ethernet.etherType}</strong></span>
              <span>Scope: Local LAN Link</span>
            </div>
          </div>
        )}

        {/* ── Layer 3: Network (IP Packet) ── */}
        {(activeTab === "all" || activeTab === "l3") && (
          <div
            id="packet-panel-l3"
            role="tabpanel"
            aria-labelledby="packet-tab-l3"
            tabIndex={0}
            className={`rounded-lg p-3 transition-all ${
              isL3Pending
                ? "border border-dashed border-zinc-800 bg-zinc-950/30 opacity-40"
                : isL3Active
                ? "border-2 border-teal-500/80 bg-teal-950/25 ring-2 ring-teal-500/40 shadow-[0_0_15px_rgba(20,184,166,0.15)]"
                : "border border-teal-500/30 bg-teal-950/15"
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] uppercase font-bold text-teal-400 tracking-wider flex items-center gap-1.5">
                Layer 3 · Network (IP Packet)
                {isL3Active && (
                  <span className="px-1.5 py-0.5 rounded text-[9px] font-sans font-bold bg-teal-500/20 text-teal-300 border border-teal-500/40">
                    Active Layer
                  </span>
                )}
                {isL3Pending && (
                  <span className="px-1.5 py-0.5 rounded text-[9px] font-sans text-zinc-500 bg-zinc-900 border border-zinc-800">
                    Pending Encapsulation
                  </span>
                )}
              </span>
              <span className="text-[10px] text-teal-400/80 font-sans">End-to-End Routing</span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-[11px] bg-zinc-900/70 p-2 rounded border border-teal-500/20">
              <div>
                <span className="text-zinc-500 text-[10px] block font-sans">Source IP</span>
                <span className="text-teal-300 font-bold">{ip.srcIp}</span>
              </div>
              <div>
                <span className="text-zinc-500 text-[10px] block font-sans">Destination IP</span>
                <span className="text-teal-300 font-bold">{ip.dstIp}</span>
              </div>
            </div>
            <div className="mt-2 flex items-center justify-between text-[10px] text-zinc-400 font-sans">
              <span>Version: <strong className="font-mono text-zinc-200">{ip.version}</strong></span>
              <span>TTL: <strong className="font-mono text-zinc-200">{ip.ttl}</strong></span>
              <span>Protocol: <strong className="font-mono text-zinc-200">{ip.protocolNum} (TCP)</strong></span>
            </div>
          </div>
        )}

        {/* ── Layer 4: Transport (TCP Segment) ── */}
        {(activeTab === "all" || activeTab === "l4") && (
          <div
            id="packet-panel-l4"
            role="tabpanel"
            aria-labelledby="packet-tab-l4"
            tabIndex={0}
            className={`rounded-lg p-3 transition-all ${
              isL4Pending
                ? "border border-dashed border-zinc-800 bg-zinc-950/30 opacity-40"
                : isL4Active
                ? "border-2 border-amber-500/80 bg-amber-950/25 ring-2 ring-amber-500/40 shadow-[0_0_15px_rgba(245,158,11,0.15)]"
                : "border border-amber-500/30 bg-amber-950/15"
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] uppercase font-bold text-amber-400 tracking-wider flex items-center gap-1.5">
                Layer 4 · Transport (TCP Segment)
                {isL4Active && (
                  <span className="px-1.5 py-0.5 rounded text-[9px] font-sans font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">
                    Active Layer
                  </span>
                )}
                {isL4Pending && (
                  <span className="px-1.5 py-0.5 rounded text-[9px] font-sans text-zinc-500 bg-zinc-900 border border-zinc-800">
                    Pending Encapsulation
                  </span>
                )}
              </span>
              <span className="text-[10px] text-amber-400/80 font-sans">Port Demultiplexing</span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-[11px] bg-zinc-900/70 p-2 rounded border border-amber-500/20">
              <div>
                <span className="text-zinc-500 text-[10px] block font-sans">Source Port</span>
                <span className="text-amber-300 font-bold">:{transport.srcPort}</span>
              </div>
              <div>
                <span className="text-zinc-500 text-[10px] block font-sans">Destination Port</span>
                <span className="text-amber-300 font-bold">:{transport.dstPort}</span>
              </div>
            </div>

            {/* Beginner-friendly flags summary + sequence metrics */}
            <div className="mt-2 space-y-1 text-[10px] text-zinc-300 font-sans">
              <div className="flex items-center justify-between">
                <span className="text-zinc-400">Control Flags:</span>
                <span className="font-mono font-bold text-amber-300 px-1.5 py-0.5 rounded bg-amber-500/10 border border-amber-500/30">
                  [{transport.flagsStr}]
                </span>
              </div>
              {transport.seqNumber !== undefined && (
                <div className="flex justify-between font-mono">
                  <span className="text-zinc-400 font-sans">Seq Number:</span>
                  <span className="text-zinc-200">{transport.seqNumber}</span>
                </div>
              )}
              {transport.ackNumber !== undefined && (
                <div className="flex justify-between font-mono">
                  <span className="text-zinc-400 font-sans">Ack Number:</span>
                  <span className="text-zinc-200">{transport.ackNumber}</span>
                </div>
              )}
              <div className="flex justify-between font-mono">
                <span className="text-zinc-400 font-sans">Window Size:</span>
                <span className="text-zinc-200">{transport.windowSize} bytes</span>
              </div>
            </div>

            {/* Compact 8-Bit TCP Control Flags Register */}
            {!isL4Pending && (
              <div className="mt-2.5 pt-2 border-t border-zinc-800/80">
                <div className="flex items-center justify-between text-[10px] text-zinc-400 font-sans mb-1.5">
                  <span className="font-semibold text-zinc-300">8-Bit TCP Flag Register:</span>
                  <span className="font-mono text-zinc-500 text-[9px]">Byte 13 (RFC 793)</span>
                </div>
                <div
                  className="grid grid-cols-8 gap-1 text-center font-mono"
                  role="group"
                  aria-label="8-bit TCP control flags register"
                >
                  {tcpFlagBits.map((item) => (
                    <div key={item.name} className="flex flex-col items-center">
                      <span className="text-[9px] text-zinc-500 font-bold mb-0.5">
                        {item.name}
                      </span>
                      <div
                        className={`w-full py-0.5 rounded text-[10px] font-bold border transition-colors ${
                          item.val === 1
                            ? "bg-teal-500/20 text-teal-300 border-teal-500/50 shadow-sm"
                            : "bg-zinc-900/60 text-zinc-600 border-zinc-800/80"
                        }`}
                        title={`${item.name} (${item.desc}) = ${item.val}`}
                      >
                        {item.val}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── Layer 7: Application Payload ── */}
        {(activeTab === "all" || activeTab === "l7") && (
          <div
            id="packet-panel-l7"
            role="tabpanel"
            aria-labelledby="packet-tab-l7"
            tabIndex={0}
            className={`rounded-lg p-3 transition-all ${
              isL7Active
                ? "border-2 border-violet-500/80 bg-violet-950/25 ring-2 ring-violet-500/40 shadow-[0_0_15px_rgba(139,92,246,0.15)]"
                : "border border-zinc-800/80 bg-zinc-950/70"
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] uppercase font-bold text-violet-400 tracking-wider flex items-center gap-1.5">
                Layer 7 · Application Payload
                {isL7Active && (
                  <span className="px-1.5 py-0.5 rounded text-[9px] font-sans font-bold bg-violet-500/20 text-violet-300 border border-violet-500/40">
                    Active Layer
                  </span>
                )}
              </span>
              <span className="text-[10px] text-zinc-500">{payload.appProtocol}</span>
            </div>
            <div className="bg-zinc-900/90 rounded p-2 border border-zinc-800 font-mono text-[11px] text-zinc-200 whitespace-pre-wrap break-all select-all">
              {payload.rawData}
            </div>
            <div className="mt-1.5 flex items-center justify-between text-[10px] text-zinc-500 font-sans">
              <span>Payload Size: <strong className="font-mono text-zinc-300">{payload.sizeBytes} bytes</strong></span>
              {payload.isEncrypted && (
                <span className="text-emerald-400 flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3" /> TLS Protected
                </span>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
