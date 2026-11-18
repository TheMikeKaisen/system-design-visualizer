import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import { useCloudSimulationStore } from "../useCloudSimulationStore";
import { IAM_SCENARIOS } from "@/lib/cloud-simulator/scenarios";

describe("useCloudSimulationStore (Zustand Discrete Simulation Store)", () => {
  beforeEach(() => {
    useCloudSimulationStore.getState().resetEpisode();
  });

  afterEach(() => {
    useCloudSimulationStore.getState().pause();
  });

  it("initializes with default scenario and step 0", () => {
    const state = useCloudSimulationStore.getState();
    expect(state.activeScenarioId).toBe(IAM_SCENARIOS[0].id);
    expect(state.currentStepIndex).toBe(0);
    expect(state.isPlaying).toBe(false);
    expect(state.playbackSpeed).toBe(1.0);
    expect(state.hasOverrides).toBe(false);
  });

  it("advances and steps backward with bounds clamping", () => {
    const store = useCloudSimulationStore.getState();
    const scenario = IAM_SCENARIOS[0];
    const totalSteps = scenario.steps.length;

    // Step forward
    store.nextStep();
    expect(useCloudSimulationStore.getState().currentStepIndex).toBe(1);

    // Step beyond last step clamps to totalSteps - 1
    for (let i = 0; i < totalSteps + 5; i++) {
      useCloudSimulationStore.getState().nextStep();
    }
    expect(useCloudSimulationStore.getState().currentStepIndex).toBe(totalSteps - 1);

    // Step backward
    useCloudSimulationStore.getState().prevStep();
    expect(useCloudSimulationStore.getState().currentStepIndex).toBe(totalSteps - 2);

    // Step before 0 clamps to 0
    for (let i = 0; i < totalSteps + 5; i++) {
      useCloudSimulationStore.getState().prevStep();
    }
    expect(useCloudSimulationStore.getState().currentStepIndex).toBe(0);
  });

  it("defensively retains selectedPrincipalId across steps when principal exists", () => {
    // Switch to Scenario 3 (Charlie, but multiple principals can exist)
    useCloudSimulationStore.getState().selectScenario("group-policy-inheritance");
    useCloudSimulationStore.getState().setSelectedPrincipalId("charlie");

    // Advance step
    useCloudSimulationStore.getState().nextStep();
    expect(useCloudSimulationStore.getState().selectedPrincipalId).toBe("charlie");
  });

  it("falls back gracefully when retained principal does not exist in next step", () => {
    useCloudSimulationStore.getState().setSelectedPrincipalId("non-existent-id");
    const currentPrincipal = useCloudSimulationStore.getState().getCurrentPrincipal();
    expect(currentPrincipal).toBeDefined();
    expect(currentPrincipal.id).toBe("alice");
  });

  it("resets statement overrides on step navigation to preserve narrative alignment", () => {
    // Go to Scenario 2 (Explicit Deny) step 3
    useCloudSimulationStore.getState().selectScenario("explicit-deny-override");
    useCloudSimulationStore.getState().setStepIndex(3);

    // Toggle Explicit Deny statement to disabled
    useCloudSimulationStore
      .getState()
      .toggleStatement("policy-deny-prod-delete", "DenyDeleteBucket");

    expect(useCloudSimulationStore.getState().hasOverrides).toBe(true);

    // Navigating to step 2 or 4 resets overrides
    useCloudSimulationStore.getState().prevStep();
    expect(useCloudSimulationStore.getState().hasOverrides).toBe(false);
  });

  it("recalculates live evaluation verdict when statement is toggled (Mode 2)", () => {
    // Select Scenario 2, Step 3 (Explicit Deny trips circuit breaker)
    useCloudSimulationStore.getState().selectScenario("explicit-deny-override");
    useCloudSimulationStore.getState().setStepIndex(3);

    let verdict = useCloudSimulationStore.getState().getCurrentVerdict();
    expect(verdict.decision).toBe("EXPLICIT_DENY");
    expect(verdict.isCircuitBreakerTripped).toBe(true);

    // Toggle off the Deny statement!
    useCloudSimulationStore
      .getState()
      .toggleStatement("policy-deny-prod-delete", "DenyDeleteBucket");

    verdict = useCloudSimulationStore.getState().getCurrentVerdict();
    // With Deny statement bypassed, AdministratorAccess's FullAccess statement allows!
    expect(verdict.decision).toBe("ALLOW");
    expect(verdict.isCircuitBreakerTripped).toBe(false);
  });

  it("handles auto-play toggle and speeds", () => {
    vi.useFakeTimers();
    useCloudSimulationStore.getState().play();
    expect(useCloudSimulationStore.getState().isPlaying).toBe(true);

    // Advance timer at 1.0x (2500ms default interval)
    vi.advanceTimersByTime(2600);
    expect(useCloudSimulationStore.getState().currentStepIndex).toBe(1);

    // Pause
    useCloudSimulationStore.getState().pause();
    expect(useCloudSimulationStore.getState().isPlaying).toBe(false);

    // Change speed
    useCloudSimulationStore.getState().setPlaybackSpeed(2.0);
    expect(useCloudSimulationStore.getState().playbackSpeed).toBe(2.0);

    vi.useRealTimers();
  });

  it("cleans up state and auto-play on resetEpisode (Decision Record 002 & Rule #8.4)", () => {
    useCloudSimulationStore.getState().play();
    useCloudSimulationStore.getState().setStepIndex(4);
    useCloudSimulationStore.getState().toggleStatement("policy-test", "stmt-1");

    // Perform unmount teardown
    useCloudSimulationStore.getState().resetEpisode();

    const state = useCloudSimulationStore.getState();
    expect(state.isPlaying).toBe(false);
    expect(state.currentStepIndex).toBe(0);
    expect(state.hasOverrides).toBe(false);
    expect(state.statementOverrides).toEqual({});
  });

  it("resolves active statement from resourcePolicy in Scenario 4 step 4", () => {
    useCloudSimulationStore.getState().selectScenario("cross-account-resource-policy");
    useCloudSimulationStore.getState().setStepIndex(4);

    expect(useCloudSimulationStore.getState().currentStepIndex).toBe(4);
    // In step 4, the activeStatementSid is 'TrustAliceAccount' located inside partner-bucket's resourcePolicy
    expect(useCloudSimulationStore.getState().selectedStatementSid).toBe("TrustAliceAccount");

    // All step policies must include the resource policy
    const allPolicies = useCloudSimulationStore.getState().getCurrentAllPolicies();
    expect(allPolicies.some((p) => p.id === "policy-partner-bucket-trust")).toBe(true);
  });

  it("applies statement overrides to resourcePolicy and recalculates verdict", () => {
    useCloudSimulationStore.getState().selectScenario("cross-account-resource-policy");
    useCloudSimulationStore.getState().setStepIndex(4);

    // Initial state: both identity policy and bucket resource policy allow -> ALLOW
    let verdict = useCloudSimulationStore.getState().getCurrentVerdict();
    expect(verdict.decision).toBe("ALLOW");
    expect(verdict.httpStatusCode).toBe(200);

    // Toggle off the trust statement in the bucket's resource policy!
    useCloudSimulationStore
      .getState()
      .toggleStatement("policy-partner-bucket-trust", "TrustAliceAccount");

    expect(useCloudSimulationStore.getState().hasOverrides).toBe(true);

    // With the bucket policy bypassed, the cross-account call fails dual-allow requirement
    verdict = useCloudSimulationStore.getState().getCurrentVerdict();
    expect(verdict.decision).toBe("DEFAULT_DENY");
    expect(verdict.message).toContain("Cross-account");

    const resources = useCloudSimulationStore.getState().getCurrentResources();
    expect(resources[0].resourcePolicy?.statements[0].disabled).toBe(true);
  });
});
