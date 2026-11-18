import { describe, it, expect } from "vitest";
import {
  IAM_SCENARIOS,
  AWS_IAM_GLOSSARY,
  AWS_TERM_PATTERNS,
} from "../scenarios";
import { evaluateIAMRequest } from "../engine";

describe("Cloud Simulator Scenarios & Glossary", () => {
  it("contains exactly 5 curated scenarios with unique IDs", () => {
    expect(IAM_SCENARIOS).toHaveLength(5);
    const ids = IAM_SCENARIOS.map((s) => s.id);
    const uniqueIds = new Set(ids);
    expect(uniqueIds.size).toBe(5);
  });

  it("verifies every scenario has non-empty steps with required fields", () => {
    IAM_SCENARIOS.forEach((scenario) => {
      expect(scenario.steps.length).toBeGreaterThanOrEqual(4);
      expect(scenario.defaultPrincipalId).toBeTruthy();

      scenario.steps.forEach((step, idx) => {
        expect(step.id).toBeTruthy();
        expect(step.stepNumber).toBe(idx);
        expect(step.badge).toBeTruthy();
        expect(step.title.trim().length).toBeGreaterThan(0);
        expect(step.explanation.trim().length).toBeGreaterThan(0);
        expect(step.request.action).toMatch(/^[a-z0-9]+:[a-zA-Z0-9*]+$/i);
        expect(step.request.resourceArn).toMatch(/^arn:aws:[a-z0-9-]+:[a-z0-9-]*:[0-9]*:.+$/);
        expect(step.principals.length).toBeGreaterThan(0);
        expect(step.resources.length).toBeGreaterThan(0);
      });
    });
  });

  it("verifies Scenario 1 step progression (least privilege: deny -> allow)", () => {
    const sc1 = IAM_SCENARIOS[0];
    expect(sc1.id).toBe("least-privilege-default-deny");

    // Step 2 is Default Deny
    const step2 = sc1.steps[2];
    const alicePrincipal = step2.principals.find((p) => p.id === "alice")!;
    const verdict2 = evaluateIAMRequest(
      step2.request,
      alicePrincipal,
      step2.policies,
      step2.resources
    );
    expect(verdict2.decision).toBe("DEFAULT_DENY");
    expect(verdict2.httpStatusCode).toBe(403);

    // Step 4 is Access Granted
    const step4 = sc1.steps[4];
    const alicePrincipal4 = step4.principals.find((p) => p.id === "alice")!;
    const verdict4 = evaluateIAMRequest(
      step4.request,
      alicePrincipal4,
      step4.policies,
      step4.resources
    );
    expect(verdict4.decision).toBe("ALLOW");
    expect(verdict4.httpStatusCode).toBe(200);
  });

  it("verifies Scenario 2 step progression (explicit deny circuit breaker overrides allow)", () => {
    const sc2 = IAM_SCENARIOS[1];
    expect(sc2.id).toBe("explicit-deny-override");

    // Step 3 trips circuit breaker
    const step3 = sc2.steps[3];
    const bobPrincipal = step3.principals.find((p) => p.id === "bob")!;
    const verdict3 = evaluateIAMRequest(
      step3.request,
      bobPrincipal,
      step3.policies,
      step3.resources
    );
    expect(verdict3.decision).toBe("EXPLICIT_DENY");
    expect(verdict3.isCircuitBreakerTripped).toBe(true);
    expect(verdict3.httpStatusCode).toBe(403);
  });

  it("verifies Scenario 5 contains IMDSv2 metadata and temporary STS tokens", () => {
    const sc5 = IAM_SCENARIOS[4];
    expect(sc5.id).toBe("ec2-instance-profile-sts");

    const step3 = sc5.steps[3];
    const ec2Principal = step3.principals.find((p) => p.id === "ec2-workload")!;
    expect(ec2Principal.credentialsType).toBe("temporary_sts");
    expect(ec2Principal.accessKeyId).toMatch(/^ASIA/);
    expect(ec2Principal.sessionTokenMasked).toBeDefined();
  });

  it("verifies AWS Glossary covers essential IAM concepts with valid command examples", () => {
    expect(Object.keys(AWS_IAM_GLOSSARY).length).toBeGreaterThanOrEqual(15);
    expect(AWS_IAM_GLOSSARY["explicit deny"]).toBeDefined();
    expect(AWS_IAM_GLOSSARY["explicit deny"].commandExample?.command).toContain("simulate-principal-policy");
    expect(AWS_IAM_GLOSSARY["sts token"]).toBeDefined();
    expect(AWS_IAM_GLOSSARY["imdsv2"]).toBeDefined();
    expect(AWS_IAM_GLOSSARY["imdsv2"].commandExample?.command).toContain("169.254.169.254");
  });

  it("verifies AWS Term Patterns list has valid non-empty entries", () => {
    expect(AWS_TERM_PATTERNS.length).toBeGreaterThanOrEqual(15);
    AWS_TERM_PATTERNS.forEach((pattern) => {
      expect(pattern.trim().length).toBeGreaterThan(0);
    });
  });
});
