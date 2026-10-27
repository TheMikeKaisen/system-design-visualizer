"use client";

import React, { useState } from "react";
import type { DnsStepData, DnsWirePacket, DnsCacheEntry } from "@/lib/network-simulator/dns-engine";
import { Database, FileCode } from "lucide-react";

interface DnsTelemetryPanelProps {
  dnsData: DnsStepData;
  activePacketOverride?: DnsWirePacket | null;
}

export function DnsTelemetryPanel({ dnsData, activePacketOverride }: DnsTelemetryPanelProps) {
  const [activeTab, setActiveTab] = useState<"caches" | "wire">("caches");

  const packet = activePacketOverride ?? dnsData.activeDnsPacket;
  const caches = dnsData.caches ?? [];

  const browserCaches = caches.filter((c) => c.tier === "browser");
  const osCaches = caches.filter((c) => c.tier === "os");
  const resolverCaches = caches.filter((c) => c.tier === "resolver");

  const flags = packet?.message.flags;

  return (
    <div className="h-full flex flex-col min-h-0 select-none font-sans">
      {/* ── Top Tabs (WAI-ARIA compliant) ── */}
      <div
        role="tablist"
        aria-label="DNS Telemetry Navigation"
        className="flex items-center gap-1 mb-2 bg-zinc-900/60 p-1 rounded-lg border border-border/60 shrink-0 font-mono text-xs"
      >
        <button
          type="button"
          role="tab"
          id="tab-dns-caches"
          aria-selected={activeTab === "caches"}
          aria-controls="panel-dns-caches"
          onClick={() => setActiveTab("caches")}
          className={`flex-1 py-1.5 px-3 rounded-md font-medium text-xs flex items-center justify-center gap-1.5 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-400 ${
            activeTab === "caches"
              ? "bg-zinc-800 text-teal-300 shadow-sm border border-zinc-700/60"
              : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/40"
          }`}
        >
          <Database className="w-3.5 h-3.5 text-teal-400 shrink-0" />
          <span className="truncate">DNS Caches ({caches.length})</span>
        </button>

        <button
          type="button"
          role="tab"
          id="tab-dns-wire"
          aria-selected={activeTab === "wire"}
          aria-controls="panel-dns-wire"
          onClick={() => setActiveTab("wire")}
          className={`flex-1 py-1.5 px-3 rounded-md font-medium text-xs flex items-center justify-center gap-1.5 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-400 ${
            activeTab === "wire"
              ? "bg-zinc-800 text-teal-300 shadow-sm border border-zinc-700/60"
              : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/40"
          }`}
        >
          <FileCode className="w-3.5 h-3.5 text-teal-400 shrink-0" />
          <span className="truncate">Wire Packet {packet ? "•" : ""}</span>
        </button>
      </div>

      {/* ── Tab Content ── */}
      <div className="flex-1 min-h-0 bg-[#08090d] rounded-xl border border-border/60 p-3 overflow-y-auto">
        {activeTab === "caches" ? (
          <div
            id="panel-dns-caches"
            role="tabpanel"
            aria-labelledby="tab-dns-caches"
            tabIndex={0}
            className="flex flex-col gap-3.5 focus:outline-none"
          >
            {/* Cache Tier 1: Browser */}
            <div className="rounded-lg border border-border/40 bg-zinc-950/60 p-2.5">
              <div className="flex items-center justify-between pb-1.5 mb-2 border-b border-border/40 font-mono text-xs">
                <span className="text-zinc-300 font-semibold flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-teal-400" />
                  Tier 1: Browser Cache (In-Memory)
                </span>
                <span className="text-zinc-500 text-[11px]">{browserCaches.length} entries</span>
              </div>
              <CacheTable entries={browserCaches} emptyLabel="No cached records in Browser memory" />
            </div>

            {/* Cache Tier 2: OS Stub Resolver */}
            <div className="rounded-lg border border-border/40 bg-zinc-950/60 p-2.5">
              <div className="flex items-center justify-between pb-1.5 mb-2 border-b border-border/40 font-mono text-xs">
                <span className="text-zinc-300 font-semibold flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-sky-400" />
                  Tier 2: OS Stub Resolver (systemd-resolved)
                </span>
                <span className="text-zinc-500 text-[11px]">{osCaches.length} entries</span>
              </div>
              <CacheTable entries={osCaches} emptyLabel="No cached records in OS daemon table" />
            </div>

            {/* Cache Tier 3: Resolver Cache */}
            <div className="rounded-lg border border-border/40 bg-zinc-950/60 p-2.5">
              <div className="flex items-center justify-between pb-1.5 mb-2 border-b border-border/40 font-mono text-xs">
                <span className="text-zinc-300 font-semibold flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-amber-400" />
                  Tier 3: Recursive Resolver Cache (1.1.1.1)
                </span>
                <span className="text-zinc-500 text-[11px]">{resolverCaches.length} entries</span>
              </div>
              <CacheTable entries={resolverCaches} emptyLabel="No cached NS referrals or A records in resolver" />
            </div>
          </div>
        ) : (
          <div
            id="panel-dns-wire"
            role="tabpanel"
            aria-labelledby="tab-dns-wire"
            tabIndex={0}
            className="flex flex-col gap-3 focus:outline-none"
          >
            {packet ? (
              <>
                {/* ── Transaction ID & Metadata ── */}
                <div className="flex items-center justify-between p-2.5 rounded-lg bg-zinc-950 border border-zinc-800 font-mono text-xs">
                  <div>
                    <span className="text-zinc-500">Transaction ID: </span>
                    <span className="text-teal-400 font-bold">{packet.message.transactionId}</span>
                  </div>
                  <div>
                    <span className="text-zinc-500">Protocol: </span>
                    <span className="text-zinc-300 font-semibold">{packet.protocol}</span>
                  </div>
                  <div>
                    <span className="text-zinc-500">Type: </span>
                    <span className="text-amber-400 font-semibold">{packet.type}</span>
                  </div>
                </div>

                {/* ── 16-Bit RFC 1035 Header Flags Register ── */}
                <div className="p-2.5 rounded-lg bg-zinc-950 border border-zinc-800">
                  <div className="text-[11px] font-mono text-zinc-400 uppercase font-semibold mb-1.5 flex items-center justify-between">
                    <span>RFC 1035 16-Bit Header Flags Register</span>
                    <span className="text-[10px] text-zinc-500">Section 4.1.1</span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 font-mono text-xs">
                    {/* QR Flag */}
                    <div
                      className={`p-1.5 rounded border text-center ${
                        flags?.qr.includes("1")
                          ? "bg-emerald-500/15 border-emerald-500/40 text-emerald-300 font-bold"
                          : "bg-teal-500/10 border-teal-500/30 text-teal-300 font-bold"
                      }`}
                    >
                      <div className="text-[9px] uppercase opacity-70">QR (Query/Resp)</div>
                      <div>{flags?.qr.includes("1") ? "1 (Resp)" : "0 (Query)"}</div>
                    </div>

                    {/* AA Flag */}
                    <div
                      className={`p-1.5 rounded border text-center ${
                        flags?.aa
                          ? "bg-emerald-500/20 border-emerald-500/60 text-emerald-300 font-bold"
                          : "bg-zinc-900 border-zinc-800 text-zinc-500"
                      }`}
                    >
                      <div className="text-[9px] uppercase opacity-70">AA (Auth Answer)</div>
                      <div>{flags?.aa ? "1 (TRUE)" : "0 (FALSE)"}</div>
                    </div>

                    {/* RD Flag */}
                    <div
                      className={`p-1.5 rounded border text-center ${
                        flags?.rd
                          ? "bg-teal-500/20 border-teal-500/60 text-teal-300 font-bold"
                          : "bg-zinc-900 border-zinc-800 text-zinc-500"
                      }`}
                    >
                      <div className="text-[9px] uppercase opacity-70">RD (Recursion Des)</div>
                      <div>{flags?.rd ? "1 (TRUE)" : "0 (FALSE)"}</div>
                    </div>

                    {/* RA Flag */}
                    <div
                      className={`p-1.5 rounded border text-center ${
                        flags?.ra
                          ? "bg-teal-500/20 border-teal-500/60 text-teal-300 font-bold"
                          : "bg-zinc-900 border-zinc-800 text-zinc-500"
                      }`}
                    >
                      <div className="text-[9px] uppercase opacity-70">RA (Recursion Avail)</div>
                      <div>{flags?.ra ? "1 (TRUE)" : "0 (FALSE)"}</div>
                    </div>

                    {/* TC Flag */}
                    <div
                      className={`p-1.5 rounded border text-center ${
                        flags?.tc
                          ? "bg-rose-500/20 border-rose-500/60 text-rose-300 font-bold"
                          : "bg-zinc-900 border-zinc-800 text-zinc-500"
                      }`}
                    >
                      <div className="text-[9px] uppercase opacity-70">TC (Truncation)</div>
                      <div>{flags?.tc ? "1 (TCP Fallback)" : "0 (FALSE)"}</div>
                    </div>

                    {/* RCODE */}
                    <div
                      className={`p-1.5 rounded border text-center col-span-3 ${
                        flags?.rcode.includes("NXDOMAIN")
                          ? "bg-rose-500/20 border-rose-500/60 text-rose-300 font-bold"
                          : "bg-zinc-900 border-zinc-800 text-zinc-300"
                      }`}
                    >
                      <div className="text-[9px] uppercase opacity-70">RCODE (Response Code)</div>
                      <div>{flags?.rcode}</div>
                    </div>
                  </div>
                </div>

                {/* ── 4 Message Sections ── */}
                <div className="flex flex-col gap-2 font-mono text-xs">
                  {/* 1. Question Section */}
                  <div className="p-2 rounded-lg bg-zinc-950 border border-zinc-800">
                    <div className="text-[10px] uppercase text-zinc-500 font-bold mb-1 flex items-center justify-between">
                      <span>Question Section ({packet.message.qdCount})</span>
                      <span className="text-zinc-600">IN (0x0001)</span>
                    </div>
                    <div className="text-zinc-200">
                      <span className="text-teal-400 font-bold">{packet.message.question.name}</span>{" "}
                      <span className="text-zinc-500">TYPE:</span>{" "}
                      <span className="text-amber-300 font-semibold">{packet.message.question.type}</span>
                    </div>
                  </div>

                  {/* 2. Answer Section */}
                  <div className="p-2 rounded-lg bg-zinc-950 border border-zinc-800">
                    <div className="text-[10px] uppercase text-zinc-500 font-bold mb-1 flex items-center justify-between">
                      <span>Answer Section ({packet.message.anCount})</span>
                    </div>
                    {packet.message.answers.length > 0 ? (
                      <div className="flex flex-col gap-1">
                        {packet.message.answers.map((ans, idx) => (
                          <div key={idx} className="p-1.5 rounded bg-zinc-900/80 text-[11px] text-zinc-300 flex items-center justify-between">
                            <div>
                              <span className="text-teal-300 font-semibold">{ans.name}</span>{" "}
                              <span className="text-zinc-500">{ans.type}</span>{" "}
                              <span className="text-emerald-400 font-bold">{ans.data}</span>
                            </div>
                            <span className="text-zinc-500 text-[10px]">TTL {ans.ttl}s</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-zinc-600 text-[11px] italic">No records in Answer section</div>
                    )}
                  </div>

                  {/* 3. Authority Section */}
                  <div className="p-2 rounded-lg bg-zinc-950 border border-zinc-800">
                    <div className="text-[10px] uppercase text-zinc-500 font-bold mb-1 flex items-center justify-between">
                      <span>Authority Section ({packet.message.nsCount})</span>
                    </div>
                    {packet.message.authorities.length > 0 ? (
                      <div className="flex flex-col gap-1">
                        {packet.message.authorities.map((auth, idx) => (
                          <div key={idx} className="p-1.5 rounded bg-zinc-900/80 text-[11px] text-zinc-300 flex items-center justify-between">
                            <div>
                              <span className="text-amber-300 font-semibold">{auth.name}</span>{" "}
                              <span className="text-zinc-500">{auth.type}</span>{" "}
                              <span className="text-zinc-200">{auth.data}</span>
                            </div>
                            <span className="text-zinc-500 text-[10px]">TTL {auth.ttl}s</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-zinc-600 text-[11px] italic">No records in Authority section</div>
                    )}
                  </div>

                  {/* 4. Additional Section (Glue Records) */}
                  <div className="p-2 rounded-lg bg-zinc-950 border border-zinc-800">
                    <div className="text-[10px] uppercase text-zinc-500 font-bold mb-1 flex items-center justify-between">
                      <span className="text-teal-400 font-bold">Additional Section / Glue Records ({packet.message.arCount})</span>
                    </div>
                    {packet.message.additionals.length > 0 ? (
                      <div className="flex flex-col gap-1">
                        {packet.message.additionals.map((add, idx) => (
                          <div key={idx} className="p-1.5 rounded bg-teal-950/40 border border-teal-500/30 text-[11px] text-zinc-300 flex items-center justify-between">
                            <div>
                              <span className="text-teal-300 font-semibold">{add.name}</span>{" "}
                              <span className="text-zinc-500">{add.type}</span>{" "}
                              <span className="text-teal-200 font-bold">{add.data}</span>
                            </div>
                            <span className="text-zinc-400 text-[10px]">Glue TTL {add.ttl}s</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-zinc-600 text-[11px] italic">No Glue records required for this message</div>
                    )}
                  </div>
                </div>
              </>
            ) : (
              <div className="text-center py-10 text-zinc-500 font-mono text-xs">
                No active DNS wire packet in flight for this step.
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function CacheTable({ entries, emptyLabel }: { entries: DnsCacheEntry[]; emptyLabel: string }) {
  if (entries.length === 0) {
    return <div className="text-zinc-600 font-mono text-[11px] italic py-1">{emptyLabel}</div>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left font-mono text-[11px]">
        <thead>
          <tr className="text-zinc-500 border-b border-border/40 text-[10px] uppercase">
            <th className="pb-1 font-semibold">Domain</th>
            <th className="pb-1 font-semibold">Type</th>
            <th className="pb-1 font-semibold">Value</th>
            <th className="pb-1 font-semibold text-right">TTL</th>
            <th className="pb-1 font-semibold text-right">Status</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border/20 text-zinc-300">
          {entries.map((entry) => (
            <tr key={entry.id} className="hover:bg-zinc-900/40">
              <td className="py-1 text-teal-300 font-medium truncate max-w-[120px]">{entry.domain}</td>
              <td className="py-1 text-zinc-400">{entry.recordType}</td>
              <td className="py-1 text-zinc-200 font-semibold truncate max-w-[140px]">{entry.value}</td>
              <td className="py-1 text-right text-zinc-400">{entry.ttlRemaining}s</td>
              <td className="py-1 text-right">
                <span
                  className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase border ${
                    entry.status === "VALID"
                      ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                      : entry.status === "NEGATIVE"
                      ? "bg-rose-500/10 text-rose-400 border-rose-500/30"
                      : "bg-zinc-800 text-zinc-400 border-zinc-700"
                  }`}
                >
                  {entry.status}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
