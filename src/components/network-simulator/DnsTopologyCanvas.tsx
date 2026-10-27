"use client";

import React from "react";
import type { DnsStepData, DnsWirePacket } from "@/lib/network-simulator/dns-engine";
import { Laptop, Server, Globe, Database, ArrowRight, ShieldAlert, CheckCircle2 } from "lucide-react";

interface DnsTopologyCanvasProps {
  dnsData: DnsStepData;
  onSelectPacket?: (packet: DnsWirePacket | null) => void;
}

export function DnsTopologyCanvas({ dnsData, onSelectPacket }: DnsTopologyCanvasProps) {
  const { client, resolver, hierarchy, activeDnsPacket } = dnsData;

  const getStatusColor = (status: string) => {
    switch (status) {
      case "HIT":
      case "RESOLVED":
      case "authoritative":
        return "text-emerald-400 bg-emerald-500/10 border-emerald-500/30";
      case "MISS":
      case "idle":
        return "text-zinc-400 bg-zinc-900 border-zinc-800";
      case "QUERYING_ROOT":
      case "QUERYING_TLD":
      case "QUERYING_AUTHORITATIVE":
      case "processing":
        return "text-teal-400 bg-teal-500/10 border-teal-500/30";
      case "referral":
        return "text-amber-400 bg-amber-500/10 border-amber-500/30";
      case "NXDOMAIN_CACHED":
      case "nxdomain":
        return "text-rose-400 bg-rose-500/10 border-rose-500/30";
      default:
        return "text-zinc-400 bg-zinc-900 border-zinc-800";
    }
  };

  const getPacketColor = (type: string) => {
    switch (type) {
      case "QUERY":
        return "border-teal-500/50 bg-teal-950/80 text-teal-300 shadow-[0_0_12px_rgba(20,184,166,0.3)]";
      case "REFERRAL":
        return "border-amber-500/50 bg-amber-950/80 text-amber-300 shadow-[0_0_12px_rgba(245,158,11,0.3)]";
      case "RESPONSE":
        return "border-emerald-500/50 bg-emerald-950/80 text-emerald-300 shadow-[0_0_12px_rgba(16,185,129,0.3)]";
      case "ERROR":
        return "border-rose-500/50 bg-rose-950/80 text-rose-300 shadow-[0_0_12px_rgba(244,63,94,0.3)]";
      default:
        return "border-zinc-700 bg-zinc-900 text-zinc-300";
    }
  };

  return (
    <div className="h-full w-full rounded-xl bg-[#07090e] border border-border/60 p-3 sm:p-5 flex flex-col justify-between overflow-y-auto select-none relative font-sans shadow-sm">
      {/* ── Top Header: Canvas Legend & Target URL ── */}
      <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-border/40 font-mono text-xs">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-teal-400 animate-pulse" />
          <span className="text-zinc-300 font-semibold uppercase tracking-wider text-[11px]">
            DNS Topology Workbench
          </span>
          <span className="text-zinc-600 hidden sm:inline">|</span>
          <span className="text-zinc-400 text-[11px] truncate max-w-[200px] sm:max-w-xs">
            Target: <code className="text-teal-300 font-semibold">{client.url}</code>
          </span>
        </div>

        {client.resolvedIp && (
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md border text-[11px] font-mono bg-zinc-900/80 border-border/60">
            {client.resolvedIp.includes("NXDOMAIN") ? (
              <>
                <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />
                <span className="text-rose-400 font-semibold">{client.resolvedIp}</span>
              </>
            ) : (
              <>
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-zinc-400">Resolved:</span>
                <span className="text-emerald-400 font-bold">{client.resolvedIp}</span>
              </>
            )}
          </div>
        )}
      </div>

      {/* ── Middle: 3-Zone Architecture Layout ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3.5 my-auto py-3">
        {/* ── ZONE A: Client Host (Cols 1-4) ── */}
        <div className="lg:col-span-4 flex flex-col gap-2.5 p-3 rounded-lg bg-zinc-950/70 border border-zinc-800/80 shadow-inner">
          <div className="flex items-center justify-between border-b border-zinc-800/60 pb-2">
            <div className="flex items-center gap-2">
              <Laptop className="w-4 h-4 text-teal-400" />
              <span className="font-semibold text-xs text-zinc-200">Client Host</span>
            </div>
            <span className="font-mono text-[10px] text-zinc-500">192.168.1.100</span>
          </div>

          {/* Browser Cache Tier */}
          <div className="p-2.5 rounded-md bg-zinc-900/70 border border-zinc-800 flex items-center justify-between text-xs">
            <div>
              <div className="font-semibold text-zinc-300 text-[11px] flex items-center gap-1.5">
                <Globe className="w-3.5 h-3.5 text-teal-400" />
                <span>Tier 1: Browser Cache</span>
              </div>
              <div className="text-[10px] text-zinc-500 mt-0.5">TTL ~60s • In-memory</div>
            </div>
            <span
              className={`px-2 py-0.5 text-[10px] font-mono font-bold rounded border uppercase ${getStatusColor(
                client.browserCacheStatus
              )}`}
            >
              {client.browserCacheStatus}
            </span>
          </div>

          {/* OS Stub Resolver Tier */}
          <div className="p-2.5 rounded-md bg-zinc-900/70 border border-zinc-800 flex items-center justify-between text-xs">
            <div>
              <div className="font-semibold text-zinc-300 text-[11px] flex items-center gap-1.5">
                <Database className="w-3.5 h-3.5 text-sky-400" />
                <span>Tier 2: OS Stub Resolver</span>
              </div>
              <div className="text-[10px] text-zinc-500 mt-0.5">systemd-resolved • /etc/resolv.conf</div>
            </div>
            <span
              className={`px-2 py-0.5 text-[10px] font-mono font-bold rounded border uppercase ${getStatusColor(
                client.osCacheStatus
              )}`}
            >
              {client.osCacheStatus}
            </span>
          </div>
        </div>

        {/* ── ZONE B: Recursive Resolver (Cols 5-7) ── */}
        <div className="lg:col-span-3 flex flex-col justify-between p-3 rounded-lg bg-zinc-950/70 border border-zinc-800/80 shadow-inner">
          <div>
            <div className="flex items-center justify-between border-b border-zinc-800/60 pb-2 mb-2.5">
              <div className="flex items-center gap-2">
                <Server className="w-4 h-4 text-teal-400" />
                <span className="font-semibold text-xs text-zinc-200">Recursive Resolver</span>
              </div>
              <span className="font-mono text-[10px] text-teal-400 font-bold">{resolver.ip}</span>
            </div>

            <div className="flex flex-col gap-2">
              <div className="p-2 rounded-md bg-zinc-900/70 border border-zinc-800">
                <div className="text-[10px] text-zinc-400 font-mono uppercase mb-1">State & Task</div>
                <div className="text-[11px] font-mono text-zinc-200 font-bold truncate">
                  {resolver.status.replace(/_/g, " ")}
                </div>
              </div>

              <div className="p-2 rounded-md bg-zinc-900/70 border border-zinc-800 flex items-center justify-between">
                <div>
                  <div className="text-[10px] text-zinc-400 font-mono">Tier 3 Cache</div>
                  <div className="text-[10px] text-zinc-500">NS referrals + A answers</div>
                </div>
                <span
                  className={`px-2 py-0.5 text-[10px] font-mono font-bold rounded border uppercase ${getStatusColor(
                    resolver.cacheStatus
                  )}`}
                >
                  {resolver.cacheStatus}
                </span>
              </div>
            </div>
          </div>

          <div className="text-[10px] text-zinc-500 font-mono mt-2 pt-2 border-t border-zinc-900 flex items-center justify-between">
            <span>Query Type:</span>
            <span className="text-zinc-300 font-bold">Iterative Upstream</span>
          </div>
        </div>

        {/* ── ZONE C: DNS Hierarchy (Cols 8-12) ── */}
        <div className="lg:col-span-5 flex flex-col gap-2 p-3 rounded-lg bg-zinc-950/70 border border-zinc-800/80 shadow-inner">
          <div className="flex items-center justify-between border-b border-zinc-800/60 pb-1.5">
            <span className="font-semibold text-xs text-zinc-200">DNS Hierarchy (Iterative)</span>
            <span className="font-mono text-[10px] text-zinc-500">RFC 1035 Delegations</span>
          </div>

          {/* Root Nameserver */}
          <div
            className={`p-2 rounded-md border flex items-center justify-between transition-colors ${
              hierarchy.root.status === "processing" || hierarchy.root.status === "referral"
                ? "bg-teal-500/10 border-teal-500/40"
                : "bg-zinc-900/70 border-zinc-800"
            }`}
          >
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-teal-400" />
              <div>
                <div className="font-mono text-[11px] font-semibold text-zinc-200">{hierarchy.root.name}</div>
                <div className="font-mono text-[10px] text-zinc-500">{hierarchy.root.ip}</div>
              </div>
            </div>
            <span
              className={`px-2 py-0.5 text-[9px] font-mono font-bold rounded uppercase border ${getStatusColor(
                hierarchy.root.status
              )}`}
            >
              {hierarchy.root.status}
            </span>
          </div>

          {/* TLD Nameserver */}
          <div
            className={`p-2 rounded-md border flex items-center justify-between transition-colors ${
              hierarchy.tld.status === "processing" || hierarchy.tld.status === "referral"
                ? "bg-amber-500/10 border-amber-500/40"
                : "bg-zinc-900/70 border-zinc-800"
            }`}
          >
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
              <div>
                <div className="font-mono text-[11px] font-semibold text-zinc-200">{hierarchy.tld.name}</div>
                <div className="font-mono text-[10px] text-zinc-500">{hierarchy.tld.ip}</div>
              </div>
            </div>
            <span
              className={`px-2 py-0.5 text-[9px] font-mono font-bold rounded uppercase border ${getStatusColor(
                hierarchy.tld.status
              )}`}
            >
              {hierarchy.tld.status}
            </span>
          </div>

          {/* Authoritative Nameserver */}
          <div
            className={`p-2 rounded-md border flex items-center justify-between transition-colors ${
              hierarchy.auth.status === "authoritative"
                ? "bg-emerald-500/10 border-emerald-500/40"
                : hierarchy.auth.status === "processing"
                ? "bg-teal-500/10 border-teal-500/40"
                : hierarchy.auth.status === "nxdomain"
                ? "bg-rose-500/10 border-rose-500/40"
                : "bg-zinc-900/70 border-zinc-800"
            }`}
          >
            <div className="flex items-center gap-2">
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  hierarchy.auth.status === "nxdomain" ? "bg-rose-400" : "bg-emerald-400"
                }`}
              />
              <div>
                <div className="font-mono text-[11px] font-semibold text-zinc-200">{hierarchy.auth.name}</div>
                <div className="font-mono text-[10px] text-zinc-500">{hierarchy.auth.ip}</div>
              </div>
            </div>
            <span
              className={`px-2 py-0.5 text-[9px] font-mono font-bold rounded uppercase border ${getStatusColor(
                hierarchy.auth.status
              )}`}
            >
              {hierarchy.auth.status}
            </span>
          </div>
        </div>
      </div>

      {/* ── Bottom: In-Flight Wire Packet Indicator ── */}
      <div className="pt-2 border-t border-border/40 min-h-[46px] flex items-center justify-between">
        {activeDnsPacket ? (
          <button
            type="button"
            onClick={() => onSelectPacket?.(activeDnsPacket)}
            className={`w-full py-2 px-3 rounded-lg border flex items-center justify-between gap-2 cursor-pointer transition-all hover:scale-[1.005] active:scale-[0.995] touch-manipulation ${getPacketColor(
              activeDnsPacket.type
            )}`}
          >
            <div className="flex items-center gap-2 font-mono text-xs truncate">
              <span className="w-2 h-2 rounded-full bg-current animate-ping" />
              <span className="font-bold uppercase tracking-wider text-[10px] px-1.5 py-0.5 rounded bg-black/40">
                {activeDnsPacket.protocol}
              </span>
              <span className="truncate">{activeDnsPacket.label}</span>
            </div>

            <div className="flex items-center gap-1 font-mono text-[11px] shrink-0 opacity-80">
              <span>{activeDnsPacket.fromNode.replace("client-", "")}</span>
              <ArrowRight className="w-3.5 h-3.5" />
              <span>{activeDnsPacket.toNode.replace("-server", "")}</span>
            </div>
          </button>
        ) : (
          <div className="w-full py-2 px-3 rounded-lg border border-dashed border-zinc-800 text-zinc-500 font-mono text-xs flex items-center justify-center gap-2">
            <span>No UDP packet currently in transit (Local execution or Cache evaluation)</span>
          </div>
        )}
      </div>
    </div>
  );
}
