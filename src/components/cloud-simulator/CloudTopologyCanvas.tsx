"use client";

import React, { useMemo } from "react";
import {
  User,
  Server,
  Database,
  HardDrive,
  ShieldAlert,
  ShieldCheck,
  Zap,
  Lock,
  Unlock,
  KeyRound,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useCloudSimulationStore, applyStatementOverrides, applyResourceOverrides } from "@/store/useCloudSimulationStore";
import { IAM_SCENARIOS } from "@/lib/cloud-simulator/scenarios";
import { evaluateIAMRequest, matchesResourceArn } from "@/lib/cloud-simulator/engine";
import type { IAMPrincipal, AWSResource, TokenStagePosition } from "@/lib/cloud-simulator/types";

export function CloudTopologyCanvas() {
  const activeScenarioId = useCloudSimulationStore((s) => s.activeScenarioId);
  const currentStepIndex = useCloudSimulationStore((s) => s.currentStepIndex);
  const selectedPrincipalId = useCloudSimulationStore((s) => s.selectedPrincipalId);
  const statementOverrides = useCloudSimulationStore((s) => s.statementOverrides);
  const setSelectedPrincipalId = useCloudSimulationStore((s) => s.setSelectedPrincipalId);

  const scenario = useMemo(() => {
    return IAM_SCENARIOS.find((s) => s.id === activeScenarioId) ?? IAM_SCENARIOS[0];
  }, [activeScenarioId]);

  const currentStep = useMemo(() => {
    const safeIndex = Math.max(0, Math.min(currentStepIndex, scenario.steps.length - 1));
    return scenario.steps[safeIndex] ?? scenario.steps[0];
  }, [scenario, currentStepIndex]);

  const principals = currentStep.principals;
  const resources = currentStep.resources;
  const request = currentStep.request;

  const activePrincipal = useMemo(() => {
    return principals.find((p) => p.id === selectedPrincipalId) ?? principals[0];
  }, [principals, selectedPrincipalId]);

  const effectivePolicies = useMemo(() => {
    return applyStatementOverrides(currentStep.policies, statementOverrides);
  }, [currentStep.policies, statementOverrides]);

  const effectiveResources = useMemo(() => {
    return applyResourceOverrides(resources, statementOverrides);
  }, [resources, statementOverrides]);

  const verdict = useMemo(() => {
    return evaluateIAMRequest(request, activePrincipal, effectivePolicies, effectiveResources);
  }, [request, activePrincipal, effectivePolicies, effectiveResources]);

  const tokenPosition: TokenStagePosition = currentStep.tokenPosition ?? "bus";
  const isCircuitBreakerTripped = verdict.isCircuitBreakerTripped;
  const isAllow = verdict.decision === "ALLOW";

  return (
    <div
      className="relative w-full rounded-2xl bg-[#050608] border border-white/[0.08] overflow-hidden p-4 sm:p-6 text-zinc-200 select-none font-sans"
      style={{
        backgroundImage:
          "radial-gradient(circle at 50% 0%, rgba(249,115,22,0.06), transparent 50%), linear-gradient(to right, rgba(255,255,255,0.02) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.02) 1px, transparent 1px)",
        backgroundSize: "100% 100%, 24px 24px, 24px 24px",
      }}
      aria-label="AWS Cloud IAM Architecture Stage"
    >
      {/* ── Top Header / Stage Metadata ── */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-4 mb-4 border-b border-white/[0.06]">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-orange-500 shadow-[0_0_8px_rgba(249,115,22,0.6)]" />
          <span className="text-xs font-mono font-semibold uppercase tracking-wider text-orange-400">
            AWS Architecture Flow
          </span>
          <span className="text-xs font-mono text-zinc-400 border-l border-zinc-800 pl-2">
            Account: {activePrincipal.account}
          </span>
        </div>

        {/* Global Verdict Pill */}
        <div
          className={cn(
            "flex items-center gap-2 px-3 py-1 rounded-full text-xs font-mono font-semibold border transition-all duration-300",
            isCircuitBreakerTripped
              ? "bg-red-500/10 text-red-400 border-red-500/40 shadow-[0_0_16px_rgba(239,68,68,0.3)] animate-pulse"
              : isAllow
              ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/40 shadow-[0_0_16px_rgba(16,185,129,0.3)]"
              : "bg-zinc-800/80 text-zinc-400 border-zinc-700/60"
          )}
        >
          {isCircuitBreakerTripped ? (
            <>
              <Zap className="w-3.5 h-3.5 fill-current" />
              <span>CIRCUIT BREAKER TRIPPED (403)</span>
            </>
          ) : isAllow ? (
            <>
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>AUTHORIZATION GRANTED (200 OK)</span>
            </>
          ) : (
            <>
              <Lock className="w-3.5 h-3.5" />
              <span>IMPLICIT DENY (403)</span>
            </>
          )}
        </div>
      </div>

      {/* ── 3-Zone Stage Layout ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-stretch">
        {/* ========================================================================= */}
        {/* ZONE 1: IAM PRINCIPALS (3 Cols)                                          */}
        {/* ========================================================================= */}
        <section
          aria-label="Zone 1: IAM Principals"
          className="lg:col-span-3 flex flex-col justify-between rounded-xl bg-[#090b10] border border-white/[0.08] p-3.5 shadow-sm"
        >
          <div>
            <div className="flex items-center justify-between pb-2 mb-3 border-b border-zinc-800/60">
              <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-orange-400" />
                IAM Principals
              </span>
              <span className="text-[10px] font-mono text-zinc-500">Zone 1</span>
            </div>

            <div className="space-y-2">
              {principals.map((principal: IAMPrincipal) => {
                const isSelected = principal.id === activePrincipal.id;
                return (
                  <button
                    type="button"
                    key={principal.id}
                    onClick={() => setSelectedPrincipalId(principal.id)}
                    aria-label={`Inspect principal ${principal.name}`}
                    aria-pressed={isSelected}
                    className={cn(
                      "w-full text-left p-2.5 rounded-lg border transition-all text-xs touch-manipulation focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-400 active:scale-[0.98]",
                      isSelected
                        ? "bg-orange-500/10 border-orange-500/50 text-zinc-100 shadow-[0_0_12px_rgba(249,115,22,0.15)]"
                        : "bg-zinc-900/60 border-zinc-800/80 text-zinc-400 hover:text-zinc-200 hover:border-zinc-700"
                    )}
                  >
                    <div className="flex items-center justify-between gap-1 mb-1">
                      <span className="font-semibold truncate">{principal.name}</span>
                      <span
                        className={cn(
                          "text-[9px] uppercase font-mono px-1.5 py-0.2 rounded-full border",
                          principal.type === "role"
                            ? "bg-amber-500/10 text-amber-300 border-amber-500/30"
                            : "bg-blue-500/10 text-blue-300 border-blue-500/30"
                        )}
                      >
                        {principal.type}
                      </span>
                    </div>

                    <div className="text-[10px] font-mono text-zinc-500 truncate mb-1.5">
                      {principal.arn}
                    </div>

                    {/* Credential Badge */}
                    <div className="flex items-center gap-1 text-[10px] font-mono">
                      <KeyRound className="w-3 h-3 text-orange-400 shrink-0" />
                      <span className="truncate text-zinc-400">
                        {principal.accessKeyId ?? "No Static Key"}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Active Request Indicator at Principal Foot */}
          <div className="mt-4 pt-3 border-t border-zinc-800/60 text-[11px] font-mono">
            <span className="text-[10px] uppercase tracking-wider text-zinc-500 block mb-1">
              Active API Dispatch
            </span>
            <div className="flex items-center gap-1.5 px-2 py-1 rounded bg-zinc-900 border border-zinc-800 text-orange-300">
              <span className="font-bold">{request.action}</span>
            </div>
          </div>
        </section>

        {/* ========================================================================= */}
        {/* ZONE 2: IAM POLICY DECISION POINT (PDP) & CIRCUIT BREAKER (6 Cols)        */}
        {/* ========================================================================= */}
        <section
          aria-label="Zone 2: IAM PDP Gateway"
          className="lg:col-span-6 flex flex-col justify-between rounded-xl bg-[#090b10] border border-white/[0.08] p-3.5 shadow-sm relative overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-2 mb-3 border-b border-zinc-800/60">
            <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
              <ShieldAlert className="w-3.5 h-3.5 text-orange-400" />
              IAM Policy Decision Point (PDP)
            </span>
            <span className="text-[10px] font-mono text-zinc-500">Zone 2</span>
          </div>

          {/* ── In-Flight Request Token Track ── */}
          <div className="mb-4 p-3 rounded-lg bg-zinc-950/70 border border-zinc-800/80">
            <div className="flex items-center justify-between text-[10px] font-mono text-zinc-500 mb-2">
              <span>API Gateway Bus</span>
              <span>Stage: {tokenPosition}</span>
            </div>

            {/* In-Flight Token Capsule */}
            <div
              className={cn(
                "p-2.5 rounded-lg border flex flex-col gap-1 transition-all duration-300 ease-out",
                tokenPosition === "principal" && "border-zinc-700 bg-zinc-900/80",
                tokenPosition === "bus" &&
                  "border-amber-500/60 bg-amber-500/10 shadow-[0_0_16px_rgba(245,158,11,0.2)]",
                tokenPosition === "pdp_gate" &&
                  "border-orange-500/80 bg-orange-500/15 shadow-[0_0_20px_rgba(249,115,22,0.3)]",
                tokenPosition === "target" &&
                  "border-emerald-500/80 bg-emerald-500/15 shadow-[0_0_20px_rgba(16,185,129,0.3)]",
                tokenPosition === "rejected" &&
                  "border-red-500/80 bg-red-500/15 shadow-[0_0_20px_rgba(239,68,68,0.3)]"
              )}
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5 font-mono text-xs font-bold text-zinc-100">
                  <span className="px-1.5 py-0.5 rounded bg-zinc-800 text-[10px] font-semibold text-orange-400">
                    HTTP Request
                  </span>
                  <span>{request.action}</span>
                </div>
                <span className="text-[10px] font-mono text-zinc-400 truncate max-w-[140px]">
                  {request.resourceArn.split(":::")[1] || request.resourceArn.split("/").pop()}
                </span>
              </div>
            </div>
          </div>

          {/* ── The PDP Decision Engine Circuit ── */}
          <div
            className={cn(
              "p-4 rounded-xl border transition-all duration-300 relative",
              isCircuitBreakerTripped
                ? "border-red-500/80 bg-red-950/30 shadow-[0_0_24px_rgba(239,68,68,0.35)]"
                : isAllow
                ? "border-emerald-500/80 bg-emerald-950/20 shadow-[0_0_24px_rgba(16,185,129,0.3)]"
                : "border-zinc-800 bg-zinc-950/60"
            )}
          >
            {/* Background shockwave glow when tripped */}
            {isCircuitBreakerTripped && (
              <div
                className="absolute inset-0 bg-red-500/10 rounded-xl pointer-events-none motion-reduce:hidden animate-pulse"
                aria-hidden="true"
              />
            )}

            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-zinc-300 flex items-center gap-2">
                {isCircuitBreakerTripped ? (
                  <Lock className="w-4 h-4 text-red-400" />
                ) : isAllow ? (
                  <Unlock className="w-4 h-4 text-emerald-400" />
                ) : (
                  <Lock className="w-4 h-4 text-zinc-400" />
                )}
                Authorization Evaluation Pipeline
              </span>

              {isCircuitBreakerTripped && (
                <span className="text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded-full bg-red-500/20 text-red-300 border border-red-500/40">
                  ⚡ Short-Circuited
                </span>
              )}
            </div>

            {/* 3 Step Evaluation Rows */}
            <div className="space-y-2 text-xs font-mono">
              {/* Step 1: Baseline */}
              <div className="flex items-center justify-between p-2 rounded bg-zinc-900/80 border border-zinc-800">
                <span className="text-zinc-400">1. Implicit Deny Baseline</span>
                <span className="text-zinc-500 text-[11px]">Denied by Default</span>
              </div>

              {/* Step 2: Explicit Deny Scan */}
              <div
                className={cn(
                  "flex items-center justify-between p-2 rounded border transition-all",
                  isCircuitBreakerTripped
                    ? "bg-red-500/20 border-red-500/60 text-red-200 font-bold shadow-sm"
                    : "bg-zinc-900/80 border-zinc-800 text-zinc-400"
                )}
              >
                <div className="flex items-center gap-1.5">
                  {isCircuitBreakerTripped ? (
                    <Zap className="w-3.5 h-3.5 text-red-400 fill-current" />
                  ) : (
                    <span className="w-3.5 h-3.5 text-center text-zinc-600">✓</span>
                  )}
                  <span>2. Explicit Deny Scan</span>
                </div>
                <span
                  className={cn(
                    "text-[11px]",
                    isCircuitBreakerTripped ? "text-red-300 font-bold" : "text-emerald-400"
                  )}
                >
                  {isCircuitBreakerTripped ? "⚡ Tripped (Deny Matched)" : "Passed (No Deny)"}
                </span>
              </div>

              {/* Step 3: Allow Evaluation */}
              <div
                className={cn(
                  "flex items-center justify-between p-2 rounded border transition-all",
                  isCircuitBreakerTripped
                    ? "opacity-25 border-zinc-800 text-zinc-600 pointer-events-none"
                    : isAllow
                    ? "bg-emerald-500/20 border-emerald-500/60 text-emerald-200 font-bold shadow-sm"
                    : "bg-zinc-900/80 border-zinc-800 text-zinc-400"
                )}
              >
                <div className="flex items-center gap-1.5">
                  {isAllow ? (
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                  ) : (
                    <span className="w-3.5 h-3.5 text-center text-zinc-600">○</span>
                  )}
                  <span>3. Allow Statement Scan</span>
                </div>
                <span
                  className={cn(
                    "text-[11px]",
                    isCircuitBreakerTripped
                      ? "text-zinc-600"
                      : isAllow
                      ? "text-emerald-300 font-bold"
                      : "text-zinc-500"
                  )}
                >
                  {isCircuitBreakerTripped
                    ? "Bypassed"
                    : isAllow
                    ? "✓ Matching Allow Found"
                    : "No Allow Found"}
                </span>
              </div>
            </div>
          </div>

          {/* Verdict Banner */}
          <div className="mt-3 p-2.5 rounded-lg bg-zinc-950 border border-zinc-800/80 text-[11px] font-mono leading-relaxed">
            <span className="text-zinc-500 block mb-0.5">Verdict Reason:</span>
            <p
              className={cn(
                isCircuitBreakerTripped
                  ? "text-red-300"
                  : isAllow
                  ? "text-emerald-300"
                  : "text-zinc-300"
              )}
            >
              {verdict.message}
            </p>
          </div>
        </section>

        {/* ========================================================================= */}
        {/* ZONE 3: TARGET AWS RESOURCES (3 Cols)                                     */}
        {/* ========================================================================= */}
        <section
          aria-label="Zone 3: Target AWS Resources"
          className="lg:col-span-3 flex flex-col justify-between rounded-xl bg-[#090b10] border border-white/[0.08] p-3.5 shadow-sm"
        >
          <div>
            <div className="flex items-center justify-between pb-2 mb-3 border-b border-zinc-800/60">
              <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
                <Database className="w-3.5 h-3.5 text-orange-400" />
                Target AWS Resources
              </span>
              <span className="text-[10px] font-mono text-zinc-500">Zone 3</span>
            </div>

            <div className="space-y-2">
              {resources.map((resource: AWSResource) => {
                const isTarget =
                  request.resourceArn === resource.arn ||
                  matchesResourceArn(resource.arn, request.resourceArn) ||
                  matchesResourceArn(request.resourceArn, resource.arn);

                return (
                  <div
                    key={resource.id}
                    className={cn(
                      "p-2.5 rounded-lg border transition-all text-xs",
                      resource.status === "accessed" &&
                        "bg-emerald-500/10 border-emerald-500/50 shadow-[0_0_12px_rgba(16,185,129,0.15)]",
                      resource.status === "blocked" &&
                        "bg-red-500/10 border-red-500/50 shadow-[0_0_12px_rgba(239,68,68,0.15)]",
                      resource.status === "ready" &&
                        isTarget &&
                        "bg-zinc-900 border-orange-500/40 text-zinc-200",
                      resource.status === "locked" && "bg-zinc-900/60 border-zinc-800/80 text-zinc-400"
                    )}
                  >
                    <div className="flex items-center justify-between gap-1 mb-1">
                      <div className="flex items-center gap-1.5 font-semibold text-zinc-100 truncate">
                        {resource.type === "s3_bucket" && (
                          <HardDrive className="w-3.5 h-3.5 text-orange-400 shrink-0" />
                        )}
                        {resource.type === "dynamodb_table" && (
                          <Database className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                        )}
                        {resource.type === "imds_v2" && (
                          <Server className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                        )}
                        <span className="truncate">{resource.name}</span>
                      </div>

                      <span
                        className={cn(
                          "text-[9px] uppercase font-mono px-1.5 py-0.2 rounded-full border",
                          resource.status === "accessed" &&
                            "bg-emerald-500/20 text-emerald-300 border-emerald-500/40",
                          resource.status === "blocked" &&
                            "bg-red-500/20 text-red-300 border-red-500/40",
                          resource.status === "locked" &&
                            "bg-zinc-800 text-zinc-400 border-zinc-700/60",
                          resource.status === "ready" &&
                            "bg-zinc-800 text-zinc-300 border-zinc-700"
                        )}
                      >
                        {resource.status}
                      </span>
                    </div>

                    <div className="text-[10px] font-mono text-zinc-500 truncate mb-1">
                      {resource.arn}
                    </div>

                    <div className="text-[10px] font-mono text-zinc-400">
                      Account: {resource.account}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Resource Boundary Callout */}
          <div className="mt-4 pt-3 border-t border-zinc-800/60 text-[10px] font-mono text-zinc-500">
            <span>Security Perimeter: AWS IAM SigV4 Verified</span>
          </div>
        </section>
      </div>
    </div>
  );
}
