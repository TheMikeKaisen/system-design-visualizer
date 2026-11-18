"use client";

import React from "react";
import {
  Laptop,
  Globe,
  Shield,
  Server,
  RotateCw,
  Zap,
  ArrowDown,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useEC2SimulationStore } from "@/store/useEC2SimulationStore";

export function DualWorldNetworkCanvas() {
  const currentStep = useEC2SimulationStore((s) => s.getCurrentStep());
  const isRebooting = useEC2SimulationStore((s) => s.isRebooting);
  const hasElasticIp = useEC2SimulationStore((s) => s.hasElasticIp);
  const manualPublicIp = useEC2SimulationStore((s) => s.manualPublicIp);
  const toggleElasticIp = useEC2SimulationStore((s) => s.toggleElasticIp);
  const simulateReboot = useEC2SimulationStore((s) => s.simulateReboot);

  const { network } = currentStep;

  // Resolved public IP (manual override takes precedence if user pressed reboot)
  const displayPublicIp = manualPublicIp ?? network.targetPublicIp;
  const isSgOpen = network.securityGroupPort22 === "open";
  const isBlocked = network.status === "blocked";
  const isConnected = network.status === "connected";

  return (
    <div className="flex flex-col h-full bg-[#07090e] border border-white/[0.08] rounded-lg overflow-hidden">
      {/* ── Panel Header ── */}
      <div className="px-3.5 sm:px-4 py-2.5 sm:py-3 bg-[#0d1117] border-b border-white/[0.08] flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Globe className="w-4 h-4 text-emerald-400" />
          <h2 className="text-xs font-semibold text-zinc-200 tracking-wide">
            Network Topology & Boundary Control
          </h2>
        </div>
        <span
          className={cn(
            "text-[10px] font-mono font-medium px-2 py-0.5 rounded-full border",
            isConnected
              ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
              : isBlocked
              ? "bg-rose-500/10 text-rose-400 border-rose-500/30"
              : "bg-amber-500/10 text-amber-400 border-amber-500/30"
          )}
        >
          {isConnected ? "Tunnel Active" : isBlocked ? "Dropped" : "Routing"}
        </span>
      </div>

      {/* ── Main Canvas Graphic Area ── */}
      <div className="p-3.5 sm:p-4 flex-1 flex flex-col justify-between gap-3 sm:gap-4 overflow-y-auto">
        {/* Node Pipeline Flow: Vertical Connected on Mobile, Horizontal on Desktop */}
        <div className="flex flex-col sm:grid sm:grid-cols-4 gap-2 sm:gap-3 items-stretch sm:items-center">
          {/* Node 1: Client Laptop */}
          <div
            className={cn(
              "p-3 rounded-md border flex flex-col gap-1 transition-colors",
              currentStep.activeLayer === "client"
                ? "bg-[#111622] border-blue-500/40 ring-1 ring-blue-500/30"
                : "bg-[#0b0e14] border-white/[0.06]"
            )}
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase font-mono text-zinc-500">1. Local Host</span>
              <Laptop className="w-3.5 h-3.5 text-blue-400" />
            </div>
            <p className="text-xs font-mono font-bold text-zinc-200">{network.clientIp}</p>
            <p className="text-[10px] text-zinc-400">Client Public IPv4</p>
          </div>

          {/* Downward Connector for Mobile */}
          <div className="sm:hidden flex items-center justify-center py-0.5" aria-hidden="true">
            <ArrowDown className="w-3.5 h-3.5 text-zinc-600" />
          </div>

          {/* Node 2: Internet Gateway (IGW) */}
          <div
            className={cn(
              "p-3 rounded-md border flex flex-col gap-1 transition-colors",
              currentStep.activeLayer === "gateway" || network.packetStage === "igw"
                ? "bg-[#111622] border-amber-500/40 ring-1 ring-amber-500/30"
                : "bg-[#0b0e14] border-white/[0.06]"
            )}
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase font-mono text-zinc-500">2. Internet Gateway</span>
              <Globe className="w-3.5 h-3.5 text-amber-400" />
            </div>
            <p className="text-xs font-mono font-bold text-zinc-200 truncate">{displayPublicIp}</p>
            <p className="text-[10px] text-zinc-400">1:1 NAT Translation</p>
          </div>

          {/* Downward Connector for Mobile */}
          <div className="sm:hidden flex items-center justify-center py-0.5" aria-hidden="true">
            <ArrowDown className="w-3.5 h-3.5 text-zinc-600" />
          </div>

          {/* Node 3: Security Group Bouncer */}
          <div
            className={cn(
              "p-3 rounded-md border flex flex-col gap-1 transition-colors",
              currentStep.activeLayer === "security_group" || network.packetStage === "sg"
                ? isSgOpen
                  ? "bg-emerald-950/20 border-emerald-500/40 ring-1 ring-emerald-500/30"
                  : "bg-rose-950/20 border-rose-500/40 ring-1 ring-rose-500/30"
                : "bg-[#0b0e14] border-white/[0.06]"
            )}
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase font-mono text-zinc-500">3. Security Group</span>
              <Shield
                className={cn(
                  "w-3.5 h-3.5",
                  isSgOpen ? "text-emerald-400" : "text-rose-400"
                )}
              />
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-mono font-bold text-zinc-200">Port 22</span>
              {isSgOpen ? (
                <span className="text-[9px] font-mono px-1 py-0.2 rounded bg-emerald-500/20 text-emerald-300">
                  ALLOW
                </span>
              ) : (
                <span className="text-[9px] font-mono px-1 py-0.2 rounded bg-rose-500/20 text-rose-300">
                  DROP
                </span>
              )}
            </div>
            <p className="text-[10px] text-zinc-400">Stateful Firewall</p>
          </div>

          {/* Downward Connector for Mobile */}
          <div className="sm:hidden flex items-center justify-center py-0.5" aria-hidden="true">
            <ArrowDown className="w-3.5 h-3.5 text-zinc-600" />
          </div>

          {/* Node 4: Ubuntu EC2 Instance */}
          <div
            className={cn(
              "p-3 rounded-md border flex flex-col gap-1 transition-colors",
              currentStep.activeLayer === "instance" || isConnected
                ? "bg-[#111622] border-emerald-500/40 ring-1 ring-emerald-500/30"
                : "bg-[#0b0e14] border-white/[0.06]"
            )}
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase font-mono text-zinc-500">4. EC2 in VPC</span>
              <Server className="w-3.5 h-3.5 text-emerald-400" />
            </div>
            <p className="text-xs font-mono font-bold text-zinc-200">{network.targetPrivateIp}</p>
            <p className="text-[10px] text-zinc-400">Internal RFC 1918</p>
          </div>
        </div>

        {/* ── Packet Progression Bar ── */}
        <div className="bg-[#0b0e14] border border-white/[0.06] rounded-md p-3">
          <div className="flex items-center justify-between text-[11px] font-mono mb-2">
            <span className="text-zinc-400">Transit Stage:</span>
            <span className="font-bold text-amber-300 uppercase">{network.packetStage}</span>
          </div>

          <div className="w-full h-1.5 bg-zinc-800 rounded-full overflow-hidden flex">
            <div
              className={cn(
                "h-full transition-all duration-300",
                isBlocked
                  ? "bg-rose-500 w-3/4"
                  : isConnected
                  ? "bg-emerald-400 w-full"
                  : network.packetStage === "client"
                  ? "bg-blue-400 w-1/4"
                  : network.packetStage === "igw"
                  ? "bg-amber-400 w-2/4"
                  : "bg-emerald-400 w-3/4"
              )}
            />
          </div>

          <div className="flex justify-between items-center text-[10px] font-mono text-zinc-500 mt-2">
            <span>Client</span>
            <span>Gateway</span>
            <span>Firewall</span>
            <span>Instance</span>
          </div>
        </div>

        {/* ── IP Volatility & Elastic IP Interactive Sandbox ── */}
        <div className="bg-[#090c12] border border-white/[0.06] rounded-md p-3 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="flex flex-col gap-0.5">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-zinc-200">
                IP Persistence Sandbox
              </span>
              <span className="text-[10px] font-mono text-zinc-400">
                (Simulate Reboot)
              </span>
            </div>
            <p className="text-[11px] text-zinc-400 leading-snug">
              Compare Ephemeral Public IP vs. Static Elastic IP across stop/start cycles.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 shrink-0">
            {/* Toggle Elastic IP */}
            <button
              type="button"
              onClick={toggleElasticIp}
              className={cn(
                "px-3 py-2 sm:py-1.5 rounded text-xs font-mono border transition-all flex items-center justify-center gap-1.5 min-h-[44px] sm:min-h-[34px] touch-manipulation active:scale-95",
                hasElasticIp
                  ? "bg-emerald-500/15 border-emerald-500/40 text-emerald-300"
                  : "bg-zinc-800/60 border-zinc-700 text-zinc-400 hover:text-zinc-200"
              )}
            >
              <Zap className="w-3.5 h-3.5" />
              <span>{hasElasticIp ? "Elastic IP Attached" : "Attach Elastic IP"}</span>
            </button>

            {/* Reboot Instance Button */}
            <button
              type="button"
              disabled={isRebooting}
              onClick={simulateReboot}
              className="px-3 py-2 sm:py-1.5 rounded text-xs font-mono font-medium bg-amber-500/15 border border-amber-500/30 text-amber-300 hover:bg-amber-500/25 active:scale-95 transition-all flex items-center justify-center gap-1.5 disabled:opacity-50 min-h-[44px] sm:min-h-[34px] touch-manipulation"
            >
              <RotateCw className={cn("w-3.5 h-3.5", isRebooting && "animate-spin")} />
              <span>{isRebooting ? "Rebooting..." : "Reboot EC2"}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
