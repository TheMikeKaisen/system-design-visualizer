"use client";

import React, { useEffect, useRef } from "react";
import {
  Key,
  Lock,
  FileCode,
  Eye,
  X,
  AlertTriangle,
  Info,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import { useEC2SimulationStore } from "@/store/useEC2SimulationStore";

export function LockAndVaultInspector() {
  const currentStep = useEC2SimulationStore((s) => s.getCurrentStep());
  const isPemModalOpen = useEC2SimulationStore((s) => s.isPemModalOpen);
  const setPemModalOpen = useEC2SimulationStore((s) => s.setPemModalOpen);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  const { crypto } = currentStep;
  const isVerified = crypto.signatureVerified === true;
  const isFailed = crypto.signatureVerified === false;

  // Dismiss modal on Escape key & auto-focus close button on modal open (WCAG 2.1 AA)
  useEffect(() => {
    if (!isPemModalOpen) return;
    closeButtonRef.current?.focus();

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setPemModalOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isPemModalOpen, setPemModalOpen]);

  return (
    <div className="flex flex-col bg-[#07090e] border border-white/[0.08] rounded-lg overflow-hidden">
      {/* ── Header ── */}
      <div className="px-3.5 sm:px-4 py-2.5 sm:py-3 bg-[#0d1117] border-b border-white/[0.08] flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <Key className="w-4 h-4 text-amber-400 shrink-0" />
          <h2 className="text-xs font-semibold text-zinc-200 tracking-wide truncate">
            Asymmetric Key Pair: Lock & Vault
          </h2>
        </div>
        <button
          type="button"
          onClick={() => setPemModalOpen(true)}
          className="text-[11px] font-mono px-2.5 py-1.5 rounded bg-amber-500/15 border border-amber-500/30 text-amber-300 hover:bg-amber-500/25 active:scale-95 transition-all flex items-center gap-1.5 focus:outline-none focus-visible:ring-1 focus-visible:ring-amber-400 min-h-[38px] sm:min-h-[32px] touch-manipulation shrink-0"
        >
          <Eye className="w-3.5 h-3.5" />
          <span>Inspect .pem</span>
        </button>
      </div>

      {/* ── Key Cards Grid ── */}
      <div className="p-3.5 sm:p-4 grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
        {/* Left: Local Laptop (The Secret Key Vault) */}
        <div className="bg-[#0b0e14] border border-white/[0.06] rounded-md p-3 sm:p-3.5 flex flex-col justify-between gap-2.5 sm:gap-3">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
                <Key className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-bold text-zinc-100">{crypto.clientKeyName}</p>
                <p className="text-[10px] text-amber-400/90 font-mono">PRIVATE KEY (STAYS LOCAL)</p>
              </div>
            </div>
            <span className="text-[10px] font-mono bg-zinc-800 text-zinc-300 px-1.5 py-0.5 rounded">
              chmod 400
            </span>
          </div>

          <div className="space-y-1 text-[11px] font-mono text-zinc-400 bg-[#07090e] p-2.5 rounded border border-white/[0.04]">
            <div className="flex justify-between">
              <span>Fingerprint:</span>
              <span className="text-zinc-200 truncate max-w-[130px]">
                {crypto.clientKeyFingerprint}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Storage:</span>
              <span className="text-zinc-300">~/Downloads</span>
            </div>
            <div className="flex justify-between">
              <span>Transmitted?</span>
              <span className="text-emerald-400 font-bold">NEVER (0 Bytes)</span>
            </div>
          </div>

          <p className="text-[10px] text-zinc-500 leading-tight">
            Signs the random server challenge locally. The secret never traverses the network.
          </p>
        </div>

        {/* Right: EC2 Instance (The Shareable Padlock) */}
        <div className="bg-[#0b0e14] border border-white/[0.06] rounded-md p-3 sm:p-3.5 flex flex-col justify-between gap-2.5 sm:gap-3">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400">
                <Lock className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-bold text-zinc-100">~/.ssh/authorized_keys</p>
                <p className="text-[10px] text-blue-400/90 font-mono">PUBLIC KEY (SHAREABLE)</p>
              </div>
            </div>
            {isVerified ? (
              <span className="text-[10px] font-mono bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 px-1.5 py-0.5 rounded flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" /> MATCH
              </span>
            ) : isFailed ? (
              <span className="text-[10px] font-mono bg-rose-500/15 text-rose-300 border border-rose-500/30 px-1.5 py-0.5 rounded flex items-center gap-1">
                <XCircle className="w-3 h-3" /> NO MATCH
              </span>
            ) : (
              <span className="text-[10px] font-mono bg-zinc-800 text-zinc-400 px-1.5 py-0.5 rounded">
                Awaiting Check
              </span>
            )}
          </div>

          <div className="space-y-1 text-[11px] font-mono text-zinc-400 bg-[#07090e] p-2.5 rounded border border-white/[0.04]">
            <div className="flex justify-between">
              <span>Authorized Key:</span>
              <span className="text-zinc-200 truncate max-w-[130px]">
                {crypto.ec2AuthorizedKeys[0] ?? "None configured"}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Injected By:</span>
              <span className="text-zinc-300">AWS cloud-init</span>
            </div>
            <div className="flex justify-between">
              <span>Linux User:</span>
              <span className="text-blue-300 font-bold">ubuntu</span>
            </div>
          </div>

          <p className="text-[10px] text-zinc-500 leading-tight">
            Shareable padlock on EC2 used by the SSH daemon to verify signatures.
          </p>
        </div>
      </div>

      {/* ── Inspect .pem File Modal ── */}
      {isPemModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="pem-modal-title"
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-150"
          onClick={() => setPemModalOpen(false)}
        >
          <div
            className="bg-[#0b0e14] border border-zinc-700/80 rounded-lg max-w-lg w-full max-h-[85vh] overflow-y-auto p-4 sm:p-5 space-y-3.5 shadow-2xl relative"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-white/[0.08] pb-2.5">
              <div className="flex items-center gap-2">
                <FileCode className="w-4 h-4 text-amber-400" />
                <h3 id="pem-modal-title" className="text-xs sm:text-sm font-bold text-zinc-100">
                  Inside {crypto.clientKeyName} (PEM Container)
                </h3>
              </div>
              <button
                ref={closeButtonRef}
                type="button"
                onClick={() => setPemModalOpen(false)}
                className="text-zinc-400 hover:text-zinc-100 p-2 rounded focus:outline-none focus-visible:ring-1 focus-visible:ring-zinc-400 min-h-[44px] min-w-[44px] flex items-center justify-center touch-manipulation"
                aria-label="Close modal"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Base64 PEM Code Viewer */}
            <div className="bg-[#050608] border border-white/[0.06] rounded p-3 font-mono text-[11px] text-zinc-300 leading-relaxed overflow-x-auto selection:bg-amber-500/30">
              <p className="text-amber-400 font-bold">-----BEGIN RSA PRIVATE KEY-----</p>
              <p className="text-zinc-500">MIIEowIBAAKCAQEA3a9k... [Base64 Encoded Exponent]</p>
              <p className="text-zinc-500">8dK2jL91mQxP7vT2... [Prime Modulus n, Private Exponent d]</p>
              <p className="text-zinc-500">Kx901mBqZa... [CRT Coefficients]</p>
              <p className="text-amber-400 font-bold">-----END RSA PRIVATE KEY-----</p>
            </div>

            {/* Crucial Explanations */}
            <div className="space-y-2 text-xs text-zinc-300">
              <div className="flex items-start gap-2 bg-amber-500/10 border border-amber-500/20 p-2.5 rounded">
                <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <p className="leading-snug">
                  <strong className="text-amber-200">Why AWS never keeps a copy:</strong> When you generate a key pair in AWS, AWS streams the private key to your download once and discards its memory buffer. AWS cannot recover this file.
                </p>
              </div>

              <div className="flex items-start gap-2 bg-blue-500/10 border border-blue-500/20 p-2.5 rounded">
                <Info className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
                <p className="leading-snug">
                  <strong className="text-blue-200">What PEM means:</strong> Privacy-Enhanced Mail. A text container format using Base64 encoding with armor headers.
                </p>
              </div>
            </div>

            {/* Close Button */}
            <div className="flex justify-end pt-1">
              <button
                type="button"
                onClick={() => setPemModalOpen(false)}
                className="px-4 py-2 rounded text-xs font-medium bg-zinc-800 hover:bg-zinc-700 text-zinc-100 transition-colors min-h-[44px] touch-manipulation"
              >
                Close Inspector
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
