import { create } from "zustand";
import type {
  CloudSimulationScenario,
  CloudSimulationStep,
  IAMPrincipal,
  IAMPolicy,
  AWSResource,
  EvaluationVerdict,
} from "@/lib/cloud-simulator/types";
import { IAM_SCENARIOS } from "@/lib/cloud-simulator/scenarios";
import { evaluateIAMRequest } from "@/lib/cloud-simulator/engine";

export type CloudInspectorTab =
  | "policy_ast"
  | "decision_trace"
  | "permission_matrix"
  | "token_vault";

export interface CloudSimulationState {
  activeScenarioId: string;
  currentStepIndex: number;
  isPlaying: boolean;
  playbackSpeed: number;
  selectedPrincipalId: string | null;
  selectedStatementSid: string | null;
  activeTab: CloudInspectorTab;
  isTelemetryExpanded: boolean;
  statementOverrides: Record<string, boolean>; // key: `${policyId}:${sid}` -> disabled (boolean)
  hasOverrides: boolean;

  // Actions
  selectScenario: (scenarioId: string) => void;
  setStepIndex: (index: number) => void;
  nextStep: () => void;
  prevStep: () => void;
  resetStep: () => void;
  play: () => void;
  pause: () => void;
  togglePlay: () => void;
  setPlaybackSpeed: (speed: number) => void;
  setSelectedPrincipalId: (id: string) => void;
  setSelectedStatementSid: (sid: string | null) => void;
  setActiveTab: (tab: CloudInspectorTab) => void;
  toggleTelemetry: () => void;
  setTelemetryExpanded: (expanded: boolean) => void;
  toggleStatement: (policyId: string, sid: string) => void;
  clearOverrides: () => void;
  resetEpisode: (defaultScenarioId?: string) => void;

  // Selectors / Getters
  getCurrentScenario: () => CloudSimulationScenario;
  getCurrentStep: () => CloudSimulationStep;
  getCurrentPrincipal: () => IAMPrincipal;
  getCurrentPolicies: () => IAMPolicy[];
  getCurrentAllPolicies: () => IAMPolicy[];
  getCurrentResources: () => AWSResource[];
  getCurrentVerdict: () => EvaluationVerdict;
}

let playbackTimer: NodeJS.Timeout | null = null;

function clearPlaybackTimer() {
  if (playbackTimer !== null) {
    clearInterval(playbackTimer);
    playbackTimer = null;
  }
}

function resolveSelectedPrincipal(
  stepPrincipals: IAMPrincipal[] = [],
  currentSelectedId: string | null,
  fallbackId?: string
): string {
  if (currentSelectedId && stepPrincipals.some((p) => p.id === currentSelectedId)) {
    return currentSelectedId;
  }
  if (fallbackId && stepPrincipals.some((p) => p.id === fallbackId)) {
    return fallbackId;
  }
  return stepPrincipals[0]?.id ?? "alice";
}

export function getAllStepPolicies(step?: CloudSimulationStep): IAMPolicy[] {
  if (!step) return [];
  const resourcePolicies = step.resources
    .map((r) => r.resourcePolicy)
    .filter((p): p is IAMPolicy => Boolean(p));
  return [...step.policies, ...resourcePolicies];
}

export function resolveSelectedStatement(
  policies: IAMPolicy[] = [],
  currentSid: string | null,
  stepDefaultSid?: string
): string | null {
  const allSids = policies.flatMap((p) => p.statements.map((s) => s.sid));
  if (stepDefaultSid && allSids.includes(stepDefaultSid)) {
    return stepDefaultSid;
  }
  if (currentSid && allSids.includes(currentSid)) {
    return currentSid;
  }
  return allSids[0] ?? null;
}

export function applyStatementOverrides(
  policies: IAMPolicy[],
  statementOverrides: Record<string, boolean>
): IAMPolicy[] {
  if (Object.keys(statementOverrides).length === 0) {
    return policies;
  }
  return policies.map((policy) => {
    return {
      ...policy,
      statements: policy.statements.map((stmt) => {
        const key = `${policy.id}:${stmt.sid}`;
        if (key in statementOverrides) {
          return { ...stmt, disabled: statementOverrides[key] };
        }
        return stmt;
      }),
    };
  });
}

export function applyResourceOverrides(
  resources: AWSResource[],
  statementOverrides: Record<string, boolean>
): AWSResource[] {
  if (Object.keys(statementOverrides).length === 0) {
    return resources;
  }
  return resources.map((res) => {
    if (!res.resourcePolicy) return res;
    const [overriddenPolicy] = applyStatementOverrides([res.resourcePolicy], statementOverrides);
    return {
      ...res,
      resourcePolicy: overriddenPolicy,
    };
  });
}

export const useCloudSimulationStore = create<CloudSimulationState>((set, get) => {
  function startPlaybackTimer() {
    clearPlaybackTimer();
    const speed = get().playbackSpeed;
    const baseInterval = 2500;
    const intervalMs = Math.max(300, Math.round(baseInterval / speed));

    playbackTimer = setInterval(() => {
      const { currentStepIndex, getCurrentScenario } = get();
      const steps = getCurrentScenario().steps;
      if (currentStepIndex < steps.length - 1) {
        get().nextStep();
      } else {
        get().pause();
      }
    }, intervalMs);
  }

  return {
    activeScenarioId: IAM_SCENARIOS[0].id,
    currentStepIndex: 0,
    isPlaying: false,
    playbackSpeed: 1.0,
    selectedPrincipalId: IAM_SCENARIOS[0].defaultPrincipalId,
    selectedStatementSid: null,
    activeTab: "policy_ast",
    isTelemetryExpanded: false,
    statementOverrides: {},
    hasOverrides: false,

    getCurrentScenario: () => {
      const { activeScenarioId } = get();
      return IAM_SCENARIOS.find((s) => s.id === activeScenarioId) ?? IAM_SCENARIOS[0];
    },

    getCurrentStep: () => {
      const scenario = get().getCurrentScenario();
      const { currentStepIndex } = get();
      const safeIndex = Math.max(0, Math.min(currentStepIndex, scenario.steps.length - 1));
      return scenario.steps[safeIndex] ?? scenario.steps[0];
    },

    getCurrentPrincipal: () => {
      const step = get().getCurrentStep();
      const { selectedPrincipalId } = get();
      return (
        step.principals.find((p) => p.id === selectedPrincipalId) ??
        step.principals[0] ?? {
          id: "alice",
          name: "Alice",
          arn: "arn:aws:iam::123456789012:user/Alice",
          type: "user",
          account: "123456789012",
          credentialsType: "none",
          attachedPolicies: [],
        }
      );
    },

    getCurrentPolicies: () => {
      const step = get().getCurrentStep();
      const { statementOverrides } = get();
      return applyStatementOverrides(step.policies, statementOverrides);
    },

    getCurrentAllPolicies: () => {
      const step = get().getCurrentStep();
      const { statementOverrides } = get();
      return applyStatementOverrides(getAllStepPolicies(step), statementOverrides);
    },

    getCurrentResources: () => {
      const step = get().getCurrentStep();
      const { statementOverrides } = get();
      return applyResourceOverrides(step.resources, statementOverrides);
    },

    getCurrentVerdict: () => {
      const step = get().getCurrentStep();
      const principal = get().getCurrentPrincipal();
      const policies = get().getCurrentPolicies();
      const resources = get().getCurrentResources();
      return evaluateIAMRequest(step.request, principal, policies, resources);
    },

    selectScenario: (scenarioId: string) => {
      clearPlaybackTimer();
      const scenario = IAM_SCENARIOS.find((s) => s.id === scenarioId) ?? IAM_SCENARIOS[0];
      const firstStep = scenario.steps[0];
      const allFirstStepPolicies = getAllStepPolicies(firstStep);
      const initialSid = resolveSelectedStatement(
        allFirstStepPolicies,
        null,
        firstStep?.activeStatementSid
      );
      set({
        activeScenarioId: scenario.id,
        currentStepIndex: 0,
        isPlaying: false,
        selectedPrincipalId: scenario.defaultPrincipalId,
        selectedStatementSid: initialSid,
        statementOverrides: {},
        hasOverrides: false,
      });
    },

    setStepIndex: (index: number) => {
      const scenario = get().getCurrentScenario();
      const safeIndex = Math.max(0, Math.min(index, scenario.steps.length - 1));
      const targetStep = scenario.steps[safeIndex];
      const nextPrincipalId = resolveSelectedPrincipal(
        targetStep?.principals,
        get().selectedPrincipalId,
        scenario.defaultPrincipalId
      );
      const allTargetPolicies = getAllStepPolicies(targetStep);
      const nextSid = resolveSelectedStatement(
        allTargetPolicies,
        get().selectedStatementSid,
        targetStep?.activeStatementSid
      );

      // Statement overrides reset on step navigation to align narrative
      set({
        currentStepIndex: safeIndex,
        selectedPrincipalId: nextPrincipalId,
        selectedStatementSid: nextSid,
        statementOverrides: {},
        hasOverrides: false,
      });
    },

    nextStep: () => {
      const { currentStepIndex, getCurrentScenario } = get();
      const scenario = getCurrentScenario();
      if (currentStepIndex < scenario.steps.length - 1) {
        get().setStepIndex(currentStepIndex + 1);
      } else {
        get().pause();
      }
    },

    prevStep: () => {
      const { currentStepIndex } = get();
      if (currentStepIndex > 0) {
        get().setStepIndex(currentStepIndex - 1);
      }
    },

    resetStep: () => {
      get().setStepIndex(0);
    },

    play: () => {
      set({ isPlaying: true });
      startPlaybackTimer();
    },

    pause: () => {
      clearPlaybackTimer();
      set({ isPlaying: false });
    },

    togglePlay: () => {
      const { isPlaying } = get();
      if (isPlaying) {
        get().pause();
      } else {
        get().play();
      }
    },

    setPlaybackSpeed: (speed: number) => {
      set({ playbackSpeed: speed });
      if (get().isPlaying) {
        startPlaybackTimer();
      }
    },

    setSelectedPrincipalId: (id: string) => {
      set({ selectedPrincipalId: id });
    },

    setSelectedStatementSid: (sid: string | null) => {
      set({ selectedStatementSid: sid });
    },

    setActiveTab: (tab: CloudInspectorTab) => {
      set({ activeTab: tab });
    },

    toggleTelemetry: () => {
      set((state) => ({ isTelemetryExpanded: !state.isTelemetryExpanded }));
    },

    setTelemetryExpanded: (expanded: boolean) => {
      set({ isTelemetryExpanded: expanded });
    },

    toggleStatement: (policyId: string, sid: string) => {
      const { statementOverrides } = get();
      const key = `${policyId}:${sid}`;
      const currentVal = statementOverrides[key] ?? false;
      const nextOverrides = {
        ...statementOverrides,
        [key]: !currentVal,
      };

      // Determine whether any overrides remain active
      const hasAny = Object.values(nextOverrides).some((v) => v === true);

      set({
        statementOverrides: nextOverrides,
        hasOverrides: hasAny,
        selectedStatementSid: sid,
      });
    },

    clearOverrides: () => {
      set({
        statementOverrides: {},
        hasOverrides: false,
      });
    },

    resetEpisode: (defaultScenarioId?: string) => {
      clearPlaybackTimer();
      const targetScenario = defaultScenarioId
        ? IAM_SCENARIOS.find((s) => s.id === defaultScenarioId) ?? IAM_SCENARIOS[0]
        : IAM_SCENARIOS[0];

      const firstStep = targetScenario.steps[0];
      const initialSid = resolveSelectedStatement(
        getAllStepPolicies(firstStep),
        null,
        firstStep?.activeStatementSid
      );

      set({
        activeScenarioId: targetScenario.id,
        currentStepIndex: 0,
        isPlaying: false,
        playbackSpeed: 1.0,
        selectedPrincipalId: targetScenario.defaultPrincipalId,
        selectedStatementSid: initialSid,
        activeTab: "policy_ast",
        isTelemetryExpanded: false,
        statementOverrides: {},
        hasOverrides: false,
      });
    },
  };
});
