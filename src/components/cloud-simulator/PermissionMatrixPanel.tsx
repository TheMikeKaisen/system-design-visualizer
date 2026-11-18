"use client";

import React, { useMemo } from "react";
import { Check, X, ShieldAlert } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  useCloudSimulationStore,
  applyStatementOverrides,
  applyResourceOverrides,
} from "@/store/useCloudSimulationStore";
import { IAM_SCENARIOS } from "@/lib/cloud-simulator/scenarios";
import { evaluateIAMRequest } from "@/lib/cloud-simulator/engine";
import type { IAMPrincipal } from "@/lib/cloud-simulator/types";

const EVALUATION_ACTIONS = [
  { action: "s3:GetObject", label: "s3:GetObject", res: "arn:aws:s3:::company-data/reports/q3.pdf" },
  { action: "s3:DeleteBucket", label: "s3:DeleteBucket", res: "arn:aws:s3:::company-data" },
  { action: "dynamodb:GetItem", label: "dynamodb:GetItem", res: "arn:aws:dynamodb:us-east-1:123456789012:table/Employees" },
  { action: "iam:CreateUser", label: "iam:CreateUser", res: "arn:aws:iam::123456789012:user/David" },
];

export function PermissionMatrixPanel() {
  const activeScenarioId = useCloudSimulationStore((s) => s.activeScenarioId);
  const currentStepIndex = useCloudSimulationStore((s) => s.currentStepIndex);
  const statementOverrides = useCloudSimulationStore((s) => s.statementOverrides);
  const selectedPrincipalId = useCloudSimulationStore((s) => s.selectedPrincipalId);
  const setSelectedPrincipalId = useCloudSimulationStore((s) => s.setSelectedPrincipalId);

  const scenario = useMemo(() => {
    return IAM_SCENARIOS.find((s) => s.id === activeScenarioId) ?? IAM_SCENARIOS[0];
  }, [activeScenarioId]);

  const currentStep = useMemo(() => {
    const safeIndex = Math.max(0, Math.min(currentStepIndex, scenario.steps.length - 1));
    return scenario.steps[safeIndex] ?? scenario.steps[0];
  }, [scenario, currentStepIndex]);

  const effectivePolicies = useMemo(() => {
    return applyStatementOverrides(currentStep.policies, statementOverrides);
  }, [currentStep.policies, statementOverrides]);

  const effectiveResources = useMemo(() => {
    return applyResourceOverrides(currentStep.resources, statementOverrides);
  }, [currentStep.resources, statementOverrides]);

  return (
    <div className="flex flex-col h-full space-y-4 font-mono text-xs text-zinc-300">
      <div className="flex items-center justify-between pb-2 border-b border-zinc-800/80">
        <div>
          <h4 className="font-bold text-zinc-100 flex items-center gap-1.5 font-sans text-sm">
            <ShieldAlert className="w-4 h-4 text-orange-400" />
            Effective Permissions Matrix
          </h4>
          <span className="text-[10px] text-zinc-500 font-mono">
            Principals × AWS API Actions under Current Step Policies
          </span>
        </div>
      </div>

      <div className="overflow-x-auto rounded-lg border border-zinc-800 bg-[#090b10]">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-zinc-800 bg-zinc-900/80 text-[10px] uppercase tracking-wider text-zinc-400">
              <th className="p-2.5">Principal</th>
              <th className="p-2.5">Type</th>
              {EVALUATION_ACTIONS.map((item) => (
                <th key={item.action} className="p-2.5 text-center whitespace-nowrap">
                  {item.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800/60 text-xs">
            {currentStep.principals.map((principal: IAMPrincipal) => {
              const isSelected = principal.id === selectedPrincipalId;
              return (
                <tr
                  key={principal.id}
                  onClick={() => setSelectedPrincipalId(principal.id)}
                  className={cn(
                    "cursor-pointer transition-colors",
                    isSelected ? "bg-orange-500/10" : "hover:bg-zinc-900/50"
                  )}
                >
                  <td className="p-2.5 font-semibold text-zinc-200 truncate max-w-[120px]">
                    {principal.name}
                  </td>
                  <td className="p-2.5 text-[10px] uppercase text-zinc-500">{principal.type}</td>
                  {EVALUATION_ACTIONS.map((item) => {
                    const verdict = evaluateIAMRequest(
                      {
                        principalId: principal.id,
                        action: item.action,
                        resourceArn: item.res,
                      },
                      principal,
                      effectivePolicies,
                      effectiveResources
                    );
                    const isGranted = verdict.decision === "ALLOW";
                    const isExplicitDeny = verdict.decision === "EXPLICIT_DENY";

                    return (
                      <td key={item.action} className="p-2.5 text-center">
                        {isGranted ? (
                          <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400">
                            <Check className="w-3.5 h-3.5" />
                          </span>
                        ) : isExplicitDeny ? (
                          <span
                            title="Explicit Deny (Circuit Breaker Tripped)"
                            className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-red-500/20 text-red-400 font-bold"
                          >
                            ⚡
                          </span>
                        ) : (
                          <span
                            title="Default Implicit Deny"
                            className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-zinc-800 text-zinc-500"
                          >
                            <X className="w-3.5 h-3.5" />
                          </span>
                        )}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="flex flex-wrap items-center gap-4 text-[11px] text-zinc-400 pt-1">
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-[9px]">
            ✓
          </span>
          <span>Allow</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full bg-red-500/20 text-red-400 flex items-center justify-center text-[9px] font-bold">
            ⚡
          </span>
          <span>Explicit Deny</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full bg-zinc-800 text-zinc-500 flex items-center justify-center text-[9px]">
            ✕
          </span>
          <span>Default Implicit Deny</span>
        </div>
      </div>
    </div>
  );
}
