"use client";

import React, { useMemo } from "react";
import { KeyRound, ShieldCheck, Clock, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
import { useCloudSimulationStore } from "@/store/useCloudSimulationStore";
import { IAM_SCENARIOS } from "@/lib/cloud-simulator/scenarios";

export function TokenVaultPanel() {
  const activeScenarioId = useCloudSimulationStore((s) => s.activeScenarioId);
  const currentStepIndex = useCloudSimulationStore((s) => s.currentStepIndex);
  const selectedPrincipalId = useCloudSimulationStore((s) => s.selectedPrincipalId);

  const scenario = useMemo(() => {
    return IAM_SCENARIOS.find((s) => s.id === activeScenarioId) ?? IAM_SCENARIOS[0];
  }, [activeScenarioId]);

  const currentStep = useMemo(() => {
    const safeIndex = Math.max(0, Math.min(currentStepIndex, scenario.steps.length - 1));
    return scenario.steps[safeIndex] ?? scenario.steps[0];
  }, [scenario, currentStepIndex]);

  const activePrincipal = useMemo(() => {
    return (
      currentStep.principals.find((p) => p.id === selectedPrincipalId) ??
      currentStep.principals[0]
    );
  }, [currentStep.principals, selectedPrincipalId]);

  const isSts = activePrincipal.credentialsType === "temporary_sts";

  return (
    <div className="flex flex-col h-full space-y-4 font-mono text-xs text-zinc-300">
      <div className="flex items-center justify-between pb-2 border-b border-zinc-800/80">
        <div>
          <h4 className="font-bold text-zinc-100 flex items-center gap-1.5 font-sans text-sm">
            <KeyRound className="w-4 h-4 text-orange-400" />
            AWS Credentials & Token Vault
          </h4>
          <span className="text-[10px] text-zinc-500 font-mono">
            Static Keys (AKIA...) vs. Short-Lived STS Credentials (ASIA...)
          </span>
        </div>
      </div>

      {/* Active Principal Credential Card */}
      <div
        className={cn(
          "p-3.5 rounded-xl border transition-all",
          isSts
            ? "bg-amber-500/10 border-amber-500/40 shadow-[0_0_16px_rgba(245,158,11,0.15)]"
            : "bg-zinc-900/80 border-zinc-800"
        )}
      >
        <div className="flex items-center justify-between mb-2">
          <span className="font-bold text-zinc-100 text-sm font-sans">{activePrincipal.name}</span>
          <span
            className={cn(
              "text-[9px] uppercase font-mono px-2 py-0.5 rounded-full border",
              isSts
                ? "bg-amber-500/20 text-amber-300 border-amber-500/40"
                : "bg-zinc-800 text-zinc-400 border-zinc-700"
            )}
          >
            {isSts ? "Temporary STS Session" : "Static Long-Term Key"}
          </span>
        </div>

        <div className="space-y-2 text-xs">
          <div>
            <span className="text-[10px] text-zinc-500 block">Access Key ID:</span>
            <span className="font-bold text-orange-300">
              {activePrincipal.accessKeyId ?? "None"}
            </span>
          </div>

          <div>
            <span className="text-[10px] text-zinc-500 block">Secret Access Key:</span>
            <span className="text-zinc-400 truncate block">
              {activePrincipal.secretAccessKeyMasked ?? "None"}
            </span>
          </div>

          {activePrincipal.sessionTokenMasked && (
            <div>
              <span className="text-[10px] text-zinc-500 block">
                Session Token (X-Amz-Security-Token):
              </span>
              <span className="text-zinc-400 text-[10px] break-all block">
                {activePrincipal.sessionTokenMasked}
              </span>
            </div>
          )}

          <div className="flex items-center gap-1.5 pt-1 text-[11px]">
            <Clock className="w-3.5 h-3.5 text-zinc-500" />
            <span className="text-zinc-400">
              Expiration: {activePrincipal.tokenExpiration ?? "Permanent (Never Expires)"}
            </span>
          </div>
        </div>
      </div>

      {/* Comparison Grid: Static vs Temporary */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs pt-1">
        {/* AKIA Static Card */}
        <div className="p-3 rounded-lg border border-red-500/20 bg-red-950/20 space-y-1.5">
          <div className="flex items-center gap-1.5 font-bold text-red-400">
            <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
            <span>Static Access Key (AKIA)</span>
          </div>
          <ul className="text-[11px] text-zinc-400 space-y-1 list-disc pl-4 font-sans">
            <li>Permanent credentials created in IAM console.</li>
            <li>Stored on disk or environment variables.</li>
            <li>No expiration; vulnerable if repository leaked.</li>
          </ul>
        </div>

        {/* ASIA Temporary STS Card */}
        <div className="p-3 rounded-lg border border-emerald-500/20 bg-emerald-950/20 space-y-1.5">
          <div className="flex items-center gap-1.5 font-bold text-emerald-400">
            <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
            <span>STS Session Token (ASIA)</span>
          </div>
          <ul className="text-[11px] text-zinc-400 space-y-1 list-disc pl-4 font-sans">
            <li>Dynamically minted via IMDSv2 or sts:AssumeRole.</li>
            <li>Expires automatically (15m - 36h, typically 1h).</li>
            <li>Zero permanent secrets stored on compute instance.</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
