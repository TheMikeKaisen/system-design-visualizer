import { describe, it, expect } from "vitest";
import {
  matchesAction,
  matchesResourceArn,
  evaluateIAMRequest,
  formatPolicyJSON,
} from "../engine";
import type {
  IAMPolicy,
  IAMPrincipal,
  AWSResource,
  IAMActionRequest,
} from "../types";

describe("AWS IAM Evaluation Engine", () => {
  describe("matchesAction pattern matcher", () => {
    it("matches exact action name case-insensitively", () => {
      expect(matchesAction("s3:GetObject", "s3:GetObject")).toBe(true);
      expect(matchesAction("s3:getobject", "s3:GetObject")).toBe(true);
      expect(matchesAction("S3:GETOBJECT", "s3:GetObject")).toBe(true);
      expect(matchesAction("s3:PutObject", "s3:GetObject")).toBe(false);
    });

    it("matches wildcards in action patterns", () => {
      expect(matchesAction("*", "s3:GetObject")).toBe(true);
      expect(matchesAction("s3:*", "s3:GetObject")).toBe(true);
      expect(matchesAction("s3:*", "s3:DeleteBucket")).toBe(true);
      expect(matchesAction("s3:*", "dynamodb:GetItem")).toBe(false);
      expect(matchesAction("dynamodb:Get*", "dynamodb:GetItem")).toBe(true);
      expect(matchesAction("dynamodb:Get*", "dynamodb:Query")).toBe(false);
      expect(matchesAction("*:*Bucket", "s3:CreateBucket")).toBe(true);
      expect(matchesAction("s3:GetObjec?", "s3:GetObject")).toBe(true);
      expect(matchesAction("s3:GetObjec?", "s3:GetObjects")).toBe(false);
    });
  });

  describe("matchesResourceArn pattern matcher", () => {
    it("matches exact ARNs", () => {
      const arn = "arn:aws:s3:::company-data";
      expect(matchesResourceArn(arn, arn)).toBe(true);
      expect(matchesResourceArn(arn, "arn:aws:s3:::other-bucket")).toBe(false);
    });

    it("matches wildcard ARNs", () => {
      expect(matchesResourceArn("*", "arn:aws:s3:::company-data/q3.pdf")).toBe(true);
      expect(
        matchesResourceArn(
          "arn:aws:s3:::company-data/*",
          "arn:aws:s3:::company-data/reports/q3.pdf"
        )
      ).toBe(true);
      expect(
        matchesResourceArn(
          "arn:aws:s3:::company-data/*",
          "arn:aws:s3:::company-data"
        )
      ).toBe(false);
      expect(
        matchesResourceArn(
          "arn:aws:s3:::company-data*",
          "arn:aws:s3:::company-data"
        )
      ).toBe(true);
      expect(
        matchesResourceArn(
          "arn:aws:s3:::company-data*",
          "arn:aws:s3:::company-data/file.txt"
        )
      ).toBe(true);
      expect(
        matchesResourceArn(
          "arn:aws:s3:::company-data/report?.pdf",
          "arn:aws:s3:::company-data/report1.pdf"
        )
      ).toBe(true);
      expect(
        matchesResourceArn(
          "arn:aws:s3:::company-data/report?.pdf",
          "arn:aws:s3:::company-data/report12.pdf"
        )
      ).toBe(false);
    });
  });

  describe("evaluateIAMRequest decision tree", () => {
    const alicePrincipal: IAMPrincipal = {
      id: "alice",
      name: "Alice (Backend Dev)",
      arn: "arn:aws:iam::123456789012:user/Alice",
      type: "user",
      account: "123456789012",
      credentialsType: "static_key",
      accessKeyId: "AKIAIOSFODNN7EXAMPLE",
      attachedPolicies: ["policy-s3-readonly"],
    };

    const s3Resource: AWSResource = {
      id: "company-data",
      name: "company-data",
      arn: "arn:aws:s3:::company-data/reports/q3.pdf",
      type: "s3_bucket",
      account: "123456789012",
      status: "ready",
    };

    it("evaluates default deny when no policies are attached", () => {
      const barePrincipal: IAMPrincipal = {
        ...alicePrincipal,
        attachedPolicies: [],
      };
      const req: IAMActionRequest = {
        principalId: "alice",
        action: "s3:GetObject",
        resourceArn: "arn:aws:s3:::company-data/reports/q3.pdf",
      };

      const verdict = evaluateIAMRequest(req, barePrincipal, [], [s3Resource]);
      expect(verdict.decision).toBe("DEFAULT_DENY");
      expect(verdict.httpStatusCode).toBe(403);
      expect(verdict.code).toBe("AccessDeniedException");
      expect(verdict.isCircuitBreakerTripped).toBe(false);
      expect(verdict.trace.some((t) => t.title.includes("Implicit Deny"))).toBe(true);
    });

    it("evaluates allow when matching policy grants action and resource", () => {
      const allowPolicy: IAMPolicy = {
        id: "policy-s3-readonly",
        name: "S3ReadOnlyAccess",
        type: "identity",
        version: "2012-10-17",
        statements: [
          {
            sid: "AllowS3Read",
            effect: "Allow",
            actions: ["s3:GetObject", "s3:ListBucket"],
            resources: ["arn:aws:s3:::company-data/*"],
          },
        ],
      };

      const req: IAMActionRequest = {
        principalId: "alice",
        action: "s3:GetObject",
        resourceArn: "arn:aws:s3:::company-data/reports/q3.pdf",
      };

      const verdict = evaluateIAMRequest(req, alicePrincipal, [allowPolicy], [s3Resource]);
      expect(verdict.decision).toBe("ALLOW");
      expect(verdict.httpStatusCode).toBe(200);
      expect(verdict.code).toBe("OK");
      expect(verdict.isCircuitBreakerTripped).toBe(false);
      expect(verdict.matchedStatement?.sid).toBe("AllowS3Read");
    });

    it("trips circuit breaker on Explicit Deny even if AdministratorAccess is present", () => {
      const bobPrincipal: IAMPrincipal = {
        id: "bob",
        name: "Bob (DevOps)",
        arn: "arn:aws:iam::123456789012:user/Bob",
        type: "user",
        account: "123456789012",
        credentialsType: "static_key",
        attachedPolicies: ["policy-admin", "policy-deny-prod-delete"],
      };

      const adminPolicy: IAMPolicy = {
        id: "policy-admin",
        name: "AdministratorAccess",
        type: "identity",
        version: "2012-10-17",
        statements: [
          {
            sid: "FullAccess",
            effect: "Allow",
            actions: ["*"],
            resources: ["*"],
          },
        ],
      };

      const denyPolicy: IAMPolicy = {
        id: "policy-deny-prod-delete",
        name: "BlockProductionDeletes",
        type: "identity",
        version: "2012-10-17",
        statements: [
          {
            sid: "DenyDeleteBucket",
            effect: "Deny",
            actions: ["s3:DeleteBucket", "s3:DeleteObject*"],
            resources: ["arn:aws:s3:::company-data*"],
          },
        ],
      };

      const req: IAMActionRequest = {
        principalId: "bob",
        action: "s3:DeleteBucket",
        resourceArn: "arn:aws:s3:::company-data",
      };

      const verdict = evaluateIAMRequest(
        req,
        bobPrincipal,
        [adminPolicy, denyPolicy],
        [s3Resource]
      );

      expect(verdict.decision).toBe("EXPLICIT_DENY");
      expect(verdict.httpStatusCode).toBe(403);
      expect(verdict.isCircuitBreakerTripped).toBe(true);
      expect(verdict.matchedStatement?.sid).toBe("DenyDeleteBucket");
      expect(verdict.matchedPolicy?.name).toBe("BlockProductionDeletes");
    });

    it("respects statement toggling (disabled: true statement is bypassed)", () => {
      const bobPrincipal: IAMPrincipal = {
        id: "bob",
        name: "Bob (DevOps)",
        arn: "arn:aws:iam::123456789012:user/Bob",
        type: "user",
        account: "123456789012",
        credentialsType: "static_key",
        attachedPolicies: ["policy-admin", "policy-deny-prod-delete"],
      };

      const adminPolicy: IAMPolicy = {
        id: "policy-admin",
        name: "AdministratorAccess",
        type: "identity",
        version: "2012-10-17",
        statements: [
          {
            sid: "FullAccess",
            effect: "Allow",
            actions: ["*"],
            resources: ["*"],
          },
        ],
      };

      const denyPolicyToggledOff: IAMPolicy = {
        id: "policy-deny-prod-delete",
        name: "BlockProductionDeletes",
        type: "identity",
        version: "2012-10-17",
        statements: [
          {
            sid: "DenyDeleteBucket",
            effect: "Deny",
            actions: ["s3:DeleteBucket", "s3:DeleteObject*"],
            resources: ["arn:aws:s3:::company-data*"],
            disabled: true, // User flipped toggle in Mode 2!
          },
        ],
      };

      const req: IAMActionRequest = {
        principalId: "bob",
        action: "s3:DeleteBucket",
        resourceArn: "arn:aws:s3:::company-data",
      };

      const verdict = evaluateIAMRequest(
        req,
        bobPrincipal,
        [adminPolicy, denyPolicyToggledOff],
        [s3Resource]
      );

      // Now FullAccess Allow takes effect because Explicit Deny is disabled!
      expect(verdict.decision).toBe("ALLOW");
      expect(verdict.httpStatusCode).toBe(200);
      expect(verdict.isCircuitBreakerTripped).toBe(false);
    });

    it("evaluates cross-account boundary correctly (requires resource policy allow)", () => {
      const alicePrincipalCross: IAMPrincipal = {
        ...alicePrincipal,
        account: "111122223333",
        arn: "arn:aws:iam::111122223333:user/Alice",
        attachedPolicies: ["policy-outbound-s3"],
      };

      const partnerS3: AWSResource = {
        id: "partner-bucket",
        name: "partner-bucket",
        arn: "arn:aws:s3:::partner-bucket/data.csv",
        type: "s3_bucket",
        account: "444455556666", // Different AWS Account!
        status: "locked",
      };

      const outboundAllowPolicy: IAMPolicy = {
        id: "policy-outbound-s3",
        name: "OutboundS3Access",
        type: "identity",
        version: "2012-10-17",
        statements: [
          {
            sid: "AllowOutbound",
            effect: "Allow",
            actions: ["s3:GetObject"],
            resources: ["arn:aws:s3:::partner-bucket/*"],
          },
        ],
      };

      const req: IAMActionRequest = {
        principalId: "alice",
        action: "s3:GetObject",
        resourceArn: "arn:aws:s3:::partner-bucket/data.csv",
      };

      // 1. Without resource policy granting trust -> Rejected across boundary
      const verdictBlocked = evaluateIAMRequest(
        req,
        alicePrincipalCross,
        [outboundAllowPolicy],
        [partnerS3]
      );
      expect(verdictBlocked.decision).toBe("DEFAULT_DENY");
      expect(verdictBlocked.message).toContain("Cross-account");

      // 2. With resource policy attached allowing Alice's account -> Allowed
      const partnerS3WithPolicy: AWSResource = {
        ...partnerS3,
        resourcePolicy: {
          id: "policy-bucket-trust",
          name: "PartnerBucketPolicy",
          type: "resource",
          version: "2012-10-17",
          statements: [
            {
              sid: "TrustAliceAccount",
              effect: "Allow",
              actions: ["s3:GetObject"],
              resources: ["arn:aws:s3:::partner-bucket/*"],
            },
          ],
        },
      };

      const verdictAllowed = evaluateIAMRequest(
        req,
        alicePrincipalCross,
        [outboundAllowPolicy],
        [partnerS3WithPolicy]
      );
      expect(verdictAllowed.decision).toBe("ALLOW");
      expect(verdictAllowed.httpStatusCode).toBe(200);
    });

    it("evaluates same-account resource policy allow when principal has zero identity policies", () => {
      const barePrincipalSameAccount: IAMPrincipal = {
        ...alicePrincipal,
        attachedPolicies: [],
        account: "123456789012",
      };

      const sameAccountS3WithPolicy: AWSResource = {
        ...s3Resource,
        account: "123456789012",
        resourcePolicy: {
          id: "policy-bucket-same-account-allow",
          name: "SameAccountBucketPolicy",
          type: "resource",
          version: "2012-10-17",
          statements: [
            {
              sid: "AllowSameAccountRead",
              effect: "Allow",
              actions: ["s3:GetObject"],
              resources: ["arn:aws:s3:::company-data/*"],
            },
          ],
        },
      };

      const req: IAMActionRequest = {
        principalId: "alice",
        action: "s3:GetObject",
        resourceArn: "arn:aws:s3:::company-data/reports/q3.pdf",
      };

      const verdict = evaluateIAMRequest(
        req,
        barePrincipalSameAccount,
        [],
        [sameAccountS3WithPolicy]
      );

      expect(verdict.decision).toBe("ALLOW");
      expect(verdict.httpStatusCode).toBe(200);
      expect(verdict.matchedStatement?.sid).toBe("AllowSameAccountRead");
      expect(verdict.matchedPolicy?.name).toBe("SameAccountBucketPolicy");
    });
  });

  describe("formatPolicyJSON", () => {
    it("formats policy into clean, valid indented JSON AST", () => {
      const policy: IAMPolicy = {
        id: "policy-test",
        name: "TestPolicy",
        type: "identity",
        version: "2012-10-17",
        statements: [
          {
            sid: "Stmt1",
            effect: "Allow",
            actions: ["s3:ListBucket"],
            resources: ["*"],
          },
        ],
      };

      const jsonStr = formatPolicyJSON(policy);
      const parsed = JSON.parse(jsonStr);
      expect(parsed.Version).toBe("2012-10-17");
      expect(parsed.Statement[0].Sid).toBe("Stmt1");
      expect(parsed.Statement[0].Effect).toBe("Allow");
    });
  });
});
