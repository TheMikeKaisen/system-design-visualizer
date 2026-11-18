"use client";

import React, { useMemo } from "react";
import {
  FileCode,
  GitCommit,
  Grid3X3,
  KeyRound,
  RotateCcw,
  ToggleLeft,
  ToggleRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  useCloudSimulationStore,
  getAllStepPolicies,
  applyStatementOverrides,
  applyResourceOverrides,
} from "@/store/useCloudSimulationStore";
import { IAM_SCENARIOS } from "@/lib/cloud-simulator/scenarios";
import { formatPolicyJSON, evaluateIAMRequest } from "@/lib/cloud-simulator/engine";
import { PermissionMatrixPanel } from "./PermissionMatrixPanel";
import { TokenVaultPanel } from "./TokenVaultPanel";
import type { CloudInspectorTab } from "@/store/useCloudSimulationStore";
import type { IAMPolicy, IAMStatement } from "@/lib/cloud-simulator/types";

export function PolicyInspectorPanel() {
  const activeScenarioId = useCloudSimulationStore((s) => s.activeScenarioId);
  const currentStepIndex = useCloudSimulationStore((s) => s.currentStepIndex);
  const selectedPrincipalId = useCloudSimulationStore((s) => s.selectedPrincipalId);
  const statementOverrides = useCloudSimulationStore((s) => s.statementOverrides);
  const hasOverrides = useCloudSimulationStore((s) => s.hasOverrides);
  const activeTab = useCloudSimulationStore((s) => s.activeTab);
  const setActiveTab = useCloudSimulationStore((s) => s.setActiveTab);
  const toggleStatement = useCloudSimulationStore((s) => s.toggleStatement);
  const clearOverrides = useCloudSimulationStore((s) => s.clearOverrides);

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

  const allStepPolicies = useMemo(() => {
    return getAllStepPolicies(currentStep);
  }, [currentStep]);

  const effectivePolicies = useMemo(() => {
    return applyStatementOverrides(allStepPolicies, statementOverrides);
  }, [allStepPolicies, statementOverrides]);

  const effectiveResources = useMemo(() => {
    return applyResourceOverrides(currentStep.resources, statementOverrides);
  }, [currentStep.resources, statementOverrides]);

  const verdict = useMemo(() => {
    return evaluateIAMRequest(
      currentStep.request,
      activePrincipal,
      effectivePolicies,
      effectiveResources
    );
  }, [currentStep.request, activePrincipal, effectivePolicies, effectiveResources]);

  const tabs: Array<{ id: CloudInspectorTab; label: string; icon: React.ReactNode }> = [
    { id: "policy_ast", label: "Policy JSON", icon: <FileCode className="w-3.5 h-3.5" /> },
    { id: "decision_trace", label: "Decision Trace", icon: <GitCommit className="w-3.5 h-3.5" /> },
    { id: "permission_matrix", label: "Permission Matrix", icon: <Grid3X3 className="w-3.5 h-3.5" /> },
    { id: "token_vault", label: "Token Vault", icon: <KeyRound className="w-3.5 h-3.5" /> },
  ];

  return (
    <div className="flex flex-col h-full rounded-2xl bg-[#090b10] border border-white/[0.08] overflow-hidden text-zinc-200 font-sans shadow-md">
      {/* ── Tab Navigation Bar ── */}
      <div
        role="tablist"
        aria-label="Cloud telemetry tabs"
        className="flex items-center justify-between border-b border-zinc-800/80 bg-zinc-950/70 px-3 pt-2 shrink-0 overflow-x-auto gap-1"
      >
        <div className="flex items-center gap-1">
          {tabs.map((tab) => {
            const isSelected = activeTab === tab.id;
            return (
              <button
                type="button"
                key={tab.id}
                role="tab"
                id={`tab-${tab.id}`}
                aria-selected={isSelected}
                aria-controls={`panel-${tab.id}`}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-2 rounded-t-lg text-xs font-mono font-medium transition-all border-b-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-400 touch-manipulation active:scale-[0.98]",
                  isSelected
                    ? "bg-[#090b10] text-orange-300 border-orange-500 shadow-sm"
                    : "text-zinc-500 hover:text-zinc-300 border-transparent hover:bg-zinc-900/50"
                )}
              >
                {tab.icon}
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Sandbox Override Status Pill */}
        {hasOverrides && (
          <div className="flex items-center gap-1.5 pb-1 shrink-0">
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40">
              Sandbox Override Active
            </span>
            <button
              type="button"
              onClick={clearOverrides}
              title="Reset statement overrides to step defaults"
              className="p-1 rounded text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 transition-colors"
            >
              <RotateCcw className="w-3 h-3" />
            </button>
          </div>
        )}
      </div>

      {/* ── Tab Panels Container ── */}
      <div className="flex-1 p-4 overflow-y-auto custom-scrollbar">
        {/* ========================================================================= */}
        {/* TAB 1: POLICY JSON AST & INTERACTIVE STATEMENT TOGGLES                    */}
        {/* ========================================================================= */}
        {activeTab === "policy_ast" && (
          <div
            id="panel-policy_ast"
            role="tabpanel"
            aria-labelledby="tab-policy_ast"
            className="space-y-4"
          >
            <div className="flex items-center justify-between pb-2 border-b border-zinc-800/80">
              <div>
                <h4 className="text-sm font-bold text-zinc-100 flex items-center gap-1.5 font-sans">
                  <FileCode className="w-4 h-4 text-orange-400" />
                  Attached IAM Policies (Mode 2 Live Evaluator)
                </h4>
                <span className="text-[10px] font-mono text-zinc-500">
                  Toggle statements below to recalculate authorization in real time
                </span>
              </div>
            </div>

            {effectivePolicies.length === 0 ? (
              <div className="p-6 text-center border border-dashed border-zinc-800 rounded-xl text-zinc-500 font-mono text-xs">
                <span>Zero policies attached to principal {activePrincipal.name}.</span>
                <span className="block mt-1 text-[11px] text-zinc-600">
                  Requests evaluate to Default Implicit Deny.
                </span>
              </div>
            ) : (
              effectivePolicies.map((policy: IAMPolicy) => (
                <div
                  key={policy.id}
                  className="rounded-xl border border-zinc-800 bg-zinc-950/60 p-3.5 space-y-3"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-zinc-100 text-xs font-mono">
                        {policy.name}
                      </span>
                      <span className="text-[9px] uppercase font-mono px-1.5 py-0.2 rounded-full border border-zinc-700 bg-zinc-800 text-zinc-400">
                        {policy.type}
                      </span>
                    </div>
                    <span className="text-[10px] font-mono text-zinc-500">
                      Version: {policy.version}
                    </span>
                  </div>

                  {/* Interactive Statements List */}
                  <div className="space-y-2">
                    {policy.statements.map((stmt: IAMStatement) => {
                      const isDisabled = stmt.disabled ?? false;
                      const isAllowEffect = stmt.effect === "Allow";

                      return (
                        <div
                          key={stmt.sid}
                          className={cn(
                            "p-2.5 rounded-lg border transition-all text-xs font-mono",
                            isDisabled
                              ? "bg-zinc-900/40 border-zinc-800/50 opacity-40"
                              : isAllowEffect
                              ? "bg-emerald-500/10 border-emerald-500/30"
                              : "bg-red-500/10 border-red-500/30"
                          )}
                        >
                          <div className="flex items-center justify-between gap-2 mb-1.5">
                            <div className="flex items-center gap-1.5">
                              <span
                                className={cn(
                                  "px-1.5 py-0.2 rounded-full text-[9px] font-bold uppercase border",
                                  isAllowEffect
                                    ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/40"
                                    : "bg-red-500/20 text-red-300 border-red-500/40"
                                )}
                              >
                                {stmt.effect}
                              </span>
                              <span className="font-semibold text-zinc-200">{stmt.sid}</span>
                            </div>

                            {/* Mode 2 Interactive Toggle Button */}
                            <button
                              type="button"
                              onClick={() => toggleStatement(policy.id, stmt.sid)}
                              aria-label={`Toggle statement ${stmt.sid}`}
                              className="flex items-center gap-1 text-[11px] px-2 py-0.5 rounded border border-zinc-700 hover:border-zinc-500 bg-zinc-900 transition-colors text-zinc-300 touch-manipulation focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-400"
                            >
                              {isDisabled ? (
                                <>
                                  <ToggleLeft className="w-4 h-4 text-zinc-500" />
                                  <span className="text-zinc-500">Bypassed</span>
                                </>
                              ) : (
                                <>
                                  <ToggleRight className="w-4 h-4 text-orange-400" />
                                  <span className="text-orange-400">Active</span>
                                </>
                              )}
                            </button>
                          </div>

                          <div className="text-[11px] text-zinc-400 space-y-0.5">
                            <div>
                              <span className="text-zinc-500">Action: </span>
                              <span className="text-zinc-300">{stmt.actions.join(", ")}</span>
                            </div>
                            <div>
                              <span className="text-zinc-500">Resource: </span>
                              <span className="text-zinc-300 truncate block">
                                {stmt.resources.join(", ")}
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Formatted JSON AST Accordion / Box */}
                  <details className="pt-1 text-xs font-mono group">
                    <summary className="cursor-pointer text-zinc-500 hover:text-zinc-300 transition-colors select-none">
                      ▶ View Syntax-Highlighted Policy JSON AST
                    </summary>
                    <pre className="mt-2 p-3 rounded-lg bg-[#050608] border border-zinc-800 text-[11px] text-zinc-300 overflow-x-auto leading-relaxed custom-scrollbar">
                      <code>{formatPolicyJSON(policy)}</code>
                    </pre>
                  </details>
                </div>
              ))
            )}
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 2: 5-STAGE EVALUATION DECISION TRACE                                  */}
        {/* ========================================================================= */}
        {activeTab === "decision_trace" && (
          <div
            id="panel-decision_trace"
            role="tabpanel"
            aria-labelledby="tab-decision_trace"
            className="space-y-4"
          >
            <div className="flex items-center justify-between pb-2 border-b border-zinc-800/80">
              <div>
                <h4 className="text-sm font-bold text-zinc-100 flex items-center gap-1.5 font-sans">
                  <GitCommit className="w-4 h-4 text-orange-400" />
                  5-Stage Evaluation Pipeline Trace
                </h4>
                <span className="text-[10px] font-mono text-zinc-500">
                  Sequential AWS IAM Policy Decision Point evaluation steps
                </span>
              </div>
            </div>

            <div className="space-y-2.5 font-mono text-xs">
              {verdict.trace.map((step) => {
                const isTripped = step.status === "tripped";
                const isPassed = step.status === "passed";
                const isPending = step.status === "pending";

                return (
                  <div
                    key={step.order}
                    className={cn(
                      "p-3 rounded-xl border transition-all",
                      isTripped && "bg-red-500/10 border-red-500/40 shadow-sm",
                      isPassed && "bg-emerald-500/10 border-emerald-500/40 shadow-sm",
                      isPending && "bg-zinc-950/40 border-zinc-900 opacity-40",
                      step.status === "neutral" && "bg-zinc-900/60 border-zinc-800"
                    )}
                  >
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <span className="font-bold text-zinc-100">{step.title}</span>
                      <span
                        className={cn(
                          "text-[9px] uppercase font-mono px-1.5 py-0.2 rounded-full border",
                          isTripped && "bg-red-500/20 text-red-300 border-red-500/40",
                          isPassed && "bg-emerald-500/20 text-emerald-300 border-emerald-500/40",
                          isPending && "bg-zinc-800 text-zinc-500 border-zinc-700",
                          step.status === "neutral" && "bg-zinc-800 text-zinc-400 border-zinc-700"
                        )}
                      >
                        {step.status}
                      </span>
                    </div>
                    <p className="text-[11px] text-zinc-400 leading-relaxed font-sans">
                      {step.description}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 3: EFFECTIVE PERMISSIONS MATRIX                                       */}
        {/* ========================================================================= */}
        {activeTab === "permission_matrix" && (
          <div
            id="panel-permission_matrix"
            role="tabpanel"
            aria-labelledby="tab-permission_matrix"
          >
            <PermissionMatrixPanel />
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 4: TOKEN VAULT                                                        */}
        {/* ========================================================================= */}
        {activeTab === "token_vault" && (
          <div id="panel-token_vault" role="tabpanel" aria-labelledby="tab-token_vault">
            <TokenVaultPanel />
          </div>
        )}
      </div>
    </div>
  );
}
