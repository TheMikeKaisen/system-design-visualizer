"use client";

import React from "react";
import {
  ShieldCheck,
  KeyRound,
  FileCheck2,
  Lock,
  Unlock,
  Cpu,
  ArrowDown,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useEC2SimulationStore } from "@/store/useEC2SimulationStore";

export function HandshakeCorridor() {
  const currentStep = useEC2SimulationStore((s) => s.getCurrentStep());
  const { crypto } = currentStep;

  const hasNonce = !!crypto.nonceChallenge;
  const hasSignature = !!crypto.signedDigest;
  const isVerified = crypto.signatureVerified === true;
  const isFailed = crypto.signatureVerified === false;
  const isSessionActive = crypto.sessionCipher === "aes-256-gcm";

  return (
    <div className="flex flex-col bg-[#07090e] border border-white/[0.08] rounded-lg overflow-hidden">
      {/* ── Corridor Header ── */}
      <div className="px-3.5 sm:px-4 py-2.5 sm:py-3 bg-[#0d1117] border-b border-white/[0.08] flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <ShieldCheck className="w-4 h-4 text-cyan-400 shrink-0" />
          <h2 className="text-xs font-semibold text-zinc-200 tracking-wide truncate">
            Challenge-Response Handshake
          </h2>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          <span className="text-[10px] font-mono text-zinc-400 hidden xs:inline">Cipher:</span>
          <span
            className={cn(
              "text-[10px] font-mono px-2 py-0.5 rounded border font-semibold uppercase",
              isSessionActive
                ? "bg-emerald-500/15 border-emerald-500/40 text-emerald-300"
                : crypto.sessionCipher === "negotiating"
                ? "bg-amber-500/15 border-amber-500/40 text-amber-300"
                : "bg-zinc-800 border-zinc-700 text-zinc-500"
            )}
          >
            {crypto.sessionCipher}
          </span>
        </div>
      </div>

      {/* ── Visual Handshake Exchange Corridor ── */}
      <div className="p-3.5 sm:p-4 flex flex-col gap-3 sm:gap-4">
        {/* Responsive layout: Vertical on mobile, 3-col on desktop */}
        <div className="flex flex-col sm:grid sm:grid-cols-3 gap-2 sm:gap-3 items-stretch sm:items-center">
          {/* Step A: Server generates Nonce */}
          <div
            className={cn(
              "p-3 rounded border flex flex-col gap-1 transition-all duration-200",
              hasNonce
                ? "bg-[#111827] border-cyan-500/40 ring-1 ring-cyan-500/20"
                : "bg-[#0b0e14] border-white/[0.06] opacity-60"
            )}
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono text-cyan-400 font-bold uppercase">
                1. Server Challenge
              </span>
              <Cpu className="w-3.5 h-3.5 text-cyan-400" />
            </div>
            <p className="text-xs font-mono font-bold text-zinc-100 truncate">
              {crypto.nonceChallenge ?? "Waiting for step..."}
            </p>
            <p className="text-[10px] text-zinc-400 leading-tight">
              Server issues random nonce puzzle to client.
            </p>
          </div>

          {/* Downward Connector on mobile */}
          <div className="sm:hidden flex items-center justify-center py-0.5" aria-hidden="true">
            <ArrowDown className="w-3.5 h-3.5 text-zinc-600" />
          </div>

          {/* Step B: Client signs locally */}
          <div
            className={cn(
              "p-3 rounded border flex flex-col gap-1 transition-all duration-200",
              hasSignature
                ? "bg-[#111827] border-amber-500/40 ring-1 ring-amber-500/20"
                : "bg-[#0b0e14] border-white/[0.06] opacity-60"
            )}
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono text-amber-400 font-bold uppercase">
                2. Client Proof
              </span>
              <KeyRound className="w-3.5 h-3.5 text-amber-400" />
            </div>
            <p className="text-xs font-mono font-bold text-zinc-100 truncate">
              {crypto.signedDigest ?? "Not signed yet"}
            </p>
            <p className="text-[10px] text-zinc-400 leading-tight">
              Signs nonce with local .pem. Secret never sent.
            </p>
          </div>

          {/* Downward Connector on mobile */}
          <div className="sm:hidden flex items-center justify-center py-0.5" aria-hidden="true">
            <ArrowDown className="w-3.5 h-3.5 text-zinc-600" />
          </div>

          {/* Step C: Server verifies match */}
          <div
            className={cn(
              "p-3 rounded border flex flex-col gap-1 transition-all duration-200",
              isVerified
                ? "bg-emerald-950/20 border-emerald-500/40 ring-1 ring-emerald-500/30"
                : isFailed
                ? "bg-rose-950/20 border-rose-500/40 ring-1 ring-rose-500/30"
                : "bg-[#0b0e14] border-white/[0.06] opacity-60"
            )}
          >
            <div className="flex items-center justify-between">
              <span
                className={cn(
                  "text-[10px] font-mono font-bold uppercase",
                  isVerified
                    ? "text-emerald-400"
                    : isFailed
                    ? "text-rose-400"
                    : "text-zinc-500"
                )}
              >
                3. Verification
              </span>
              <FileCheck2
                className={cn(
                  "w-3.5 h-3.5",
                  isVerified
                    ? "text-emerald-400"
                    : isFailed
                    ? "text-rose-400"
                    : "text-zinc-500"
                )}
              />
            </div>
            <p className="text-xs font-mono font-bold text-zinc-100">
              {isVerified
                ? "Signature Confirmed"
                : isFailed
                ? "Signature Failed"
                : "Awaiting Verification"}
            </p>
            <p className="text-[10px] text-zinc-400 leading-tight">
              Verified with authorized_keys public key.
            </p>
          </div>
        </div>

        {/* ── Active Session Tunnel Callout ── */}
        <div
          className={cn(
            "p-3 rounded-md border flex items-center justify-between gap-3 transition-colors",
            isSessionActive
              ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-200"
              : "bg-[#090b10] border-white/[0.06] text-zinc-400"
          )}
        >
          <div className="flex items-center gap-2.5">
            {isSessionActive ? (
              <Lock className="w-4 h-4 text-emerald-400 shrink-0" />
            ) : (
              <Unlock className="w-4 h-4 text-zinc-500 shrink-0" />
            )}
            <div className="flex flex-col">
              <span className="text-xs font-bold text-zinc-100">
                {isSessionActive
                  ? "Encrypted Tunnel Active (AES-256-GCM)"
                  : "Handshake in Progress"}
              </span>
              <span className="text-[10px] text-zinc-400 leading-tight">
                {isSessionActive
                  ? "Asymmetric keys retire. Keystrokes stream over hardware-accelerated symmetric AES."
                  : "Establishing zero-knowledge identity proof over port 22."}
              </span>
            </div>
          </div>
          {isSessionActive && (
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 shrink-0">
              OPEN
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
