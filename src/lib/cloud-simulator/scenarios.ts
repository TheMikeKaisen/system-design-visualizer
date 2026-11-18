import type { ConceptDefinition } from "@/components/network-simulator/InteractiveExplanationBar";
import type {
  CloudSimulationScenario,
  IAMPrincipal,
  AWSResource,
} from "./types";

// ============================================================================
// 1. Reusable Base Principals & AWS Target Resources
// ============================================================================

const ALICE_BASE: IAMPrincipal = {
  id: "alice",
  name: "Alice (Backend Dev)",
  arn: "arn:aws:iam::123456789012:user/Alice",
  type: "user",
  account: "123456789012",
  credentialsType: "static_key",
  accessKeyId: "AKIAIOSFODNN7EXAMPLE",
  secretAccessKeyMasked: "wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY",
  attachedPolicies: [],
  avatarColor: "bg-blue-500/20 text-blue-400 border-blue-500/40",
};

const BOB_BASE: IAMPrincipal = {
  id: "bob",
  name: "Bob (DevOps Admin)",
  arn: "arn:aws:iam::123456789012:user/Bob",
  type: "user",
  account: "123456789012",
  credentialsType: "static_key",
  accessKeyId: "AKIA2EXAMPLEBOBKEYID",
  secretAccessKeyMasked: "je7MtGbClwBF/2Zp9Utk/h3yCXYZEXAMPLEKEY",
  attachedPolicies: ["policy-admin"],
  avatarColor: "bg-purple-500/20 text-purple-400 border-purple-500/40",
};

const CHARLIE_BASE: IAMPrincipal = {
  id: "charlie",
  name: "Charlie (Intern)",
  arn: "arn:aws:iam::123456789012:user/Charlie",
  type: "user",
  account: "123456789012",
  credentialsType: "static_key",
  accessKeyId: "AKIA3INTERNCHARLIEKEY",
  secretAccessKeyMasked: "uP4r7ZkL9M1oQ3sT5vW7yA1bCEXAMPLEKEY",
  attachedPolicies: ["policy-intern-s3"],
  groups: [],
  avatarColor: "bg-emerald-500/20 text-emerald-400 border-emerald-500/40",
};

const EC2_WORKLOAD_BASE: IAMPrincipal = {
  id: "ec2-workload",
  name: "EC2 WebServer (i-0a1b2c3d4e5f)",
  arn: "arn:aws:iam::123456789012:role/WebServerRole",
  type: "role",
  roleName: "WebServerRole",
  account: "123456789012",
  credentialsType: "temporary_sts",
  accessKeyId: "ASIAV3T2N7EXAMPLEKEY",
  secretAccessKeyMasked: "sEcReT/kEy/TeMpOrArY/StS/ToKeN/ExAmPlE",
  sessionTokenMasked: "IQoJb3JpZ2luX2VjEEXAMPLE...TokenSessionLength3600s",
  tokenExpiration: "2026-11-15T18:00:00Z (Valid for 1 Hour)",
  attachedPolicies: ["policy-webserver-s3"],
  avatarColor: "bg-amber-500/20 text-amber-400 border-amber-500/40",
};

const S3_COMPANY_DATA: AWSResource = {
  id: "res-s3-company-data",
  name: "company-data",
  arn: "arn:aws:s3:::company-data/reports/q3.pdf",
  type: "s3_bucket",
  account: "123456789012",
  status: "locked",
};

const DYNAMODB_EMPLOYEES: AWSResource = {
  id: "res-dynamodb-employees",
  name: "Employees",
  arn: "arn:aws:dynamodb:us-east-1:123456789012:table/Employees",
  type: "dynamodb_table",
  account: "123456789012",
  status: "locked",
};

const IMDSV2_ENDPOINT: AWSResource = {
  id: "res-imds-v2",
  name: "IMDSv2 Security Token Service",
  arn: "arn:aws:iam::123456789012:instance-profile/WebServerProfile",
  type: "imds_v2",
  account: "123456789012",
  status: "ready",
};

// ============================================================================
// 2. Curated IAM Scenarios
// ============================================================================

export const IAM_SCENARIOS: CloudSimulationScenario[] = [
  // ── Scenario 1: Least Privilege & Default Deny ──
  {
    id: "least-privilege-default-deny",
    title: "Least Privilege & The Default Deny Baseline",
    badge: "Scenario 1",
    description:
      "Explore the foundational principle of AWS IAM: requests start in an implicit deny state. Zero access is granted until an explicit Allow statement is attached.",
    defaultPrincipalId: "alice",
    steps: [
      {
        id: "s1-step-0",
        stepNumber: 0,
        badge: "Initialization",
        title: "Principal & Target Initialization",
        explanation:
          "Alice is initialized as an IAM User in AWS Account 123456789012 with zero attached IAM policies. Target Amazon S3 bucket company-data sits locked.",
        request: {
          principalId: "alice",
          action: "s3:GetObject",
          resourceArn: "arn:aws:s3:::company-data/reports/q3.pdf",
        },
        principals: [{ ...ALICE_BASE, attachedPolicies: [] }],
        policies: [],
        resources: [{ ...S3_COMPANY_DATA, status: "locked" }],
        tokenPosition: "principal",
        detailedNotes: [
          {
            title: "Implicit Deny",
            body: "AWS IAM evaluates all requests as denied by default until explicitly permitted by an attached policy.",
          },
          {
            title: "Least Privilege",
            body: "The security paradigm of granting identities strictly the minimal permissions necessary to perform their job duties.",
          },
        ],
      },
      {
        id: "s1-step-1",
        stepNumber: 1,
        badge: "API Request Dispatch",
        title: "Alice Dispatches s3:GetObject API Call",
        explanation:
          "Alice calls AWS API Gateway requesting s3:GetObject on arn:aws:s3:::company-data/reports/q3.pdf signed with static access key AKIAIOSFODNN7EXAMPLE.",
        request: {
          principalId: "alice",
          action: "s3:GetObject",
          resourceArn: "arn:aws:s3:::company-data/reports/q3.pdf",
        },
        principals: [{ ...ALICE_BASE, attachedPolicies: [] }],
        policies: [],
        resources: [{ ...S3_COMPANY_DATA, status: "locked" }],
        tokenPosition: "bus",
        detailedNotes: [
          {
            title: "Action",
            body: "The AWS API operation requested by the principal, formatted as service:operation (e.g. s3:GetObject, dynamodb:GetItem).",
          },
          {
            title: "Resource",
            body: "The target AWS object identified uniquely via an Amazon Resource Name (ARN).",
          },
        ],
      },
      {
        id: "s1-step-2",
        stepNumber: 2,
        badge: "PDP Evaluation",
        title: "IAM Evaluator Evaluates Default Deny",
        explanation:
          "The IAM Policy Decision Point (PDP) scans attached policies. Finding zero matching Allow statements, the engine halts at Default Implicit Deny resulting in HTTP 403 AccessDeniedException.",
        request: {
          principalId: "alice",
          action: "s3:GetObject",
          resourceArn: "arn:aws:s3:::company-data/reports/q3.pdf",
        },
        principals: [{ ...ALICE_BASE, attachedPolicies: [] }],
        policies: [],
        resources: [{ ...S3_COMPANY_DATA, status: "locked" }],
        tokenPosition: "pdp_gate",
        detailedNotes: [
          {
            title: "Implicit Deny",
            body: "Without an explicit Allow statement in any attached policy, the PDP halts evaluation with AccessDeniedException (HTTP 403).",
            commandExample: {
              platform: "Universal",
              command:
                "aws iam simulate-principal-policy --policy-source-arn arn:aws:iam::123456789012:user/Alice --action-names s3:GetObject --resource-arns arn:aws:s3:::company-data/reports/q3.pdf",
              purpose: "Simulate policy evaluation for Alice on target S3 bucket object",
              output: '{\n  "EvaluationResults": [\n    {\n      "EvalActionName": "s3:GetObject",\n      "EvalDecision": "implicitDeny"\n    }\n  ]\n}',
            },
          },
        ],
      },
      {
        id: "s1-step-3",
        stepNumber: 3,
        badge: "Policy Attachment",
        title: "Security Admin Attaches S3ReadOnlyAccess Policy",
        explanation:
          "The security administrator attaches an identity policy S3ReadOnlyAccess containing statement AllowS3Read granting Allow on s3:GetObject and s3:ListBucket.",
        request: {
          principalId: "alice",
          action: "s3:GetObject",
          resourceArn: "arn:aws:s3:::company-data/reports/q3.pdf",
        },
        principals: [{ ...ALICE_BASE, attachedPolicies: ["policy-s3-readonly"] }],
        policies: [
          {
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
          },
        ],
        resources: [{ ...S3_COMPANY_DATA, status: "ready" }],
        tokenPosition: "bus",
        activeStatementSid: "AllowS3Read",
        detailedNotes: [
          {
            title: "Effect",
            body: "The core outcome declared by an IAM statement: Allow or Deny.",
          },
          {
            title: "Policy Attachment",
            body: "Associating an AWS IAM managed or inline policy with a specific IAM identity (user, group, or role).",
            commandExample: {
              platform: "Universal",
              command:
                "aws iam attach-user-policy --user-name Alice --policy-arn arn:aws:iam::123456789012:policy/S3ReadOnlyAccess",
              purpose: "Attach read-only policy to Alice's IAM user identity",
            },
          },
        ],
      },
      {
        id: "s1-step-4",
        stepNumber: 4,
        badge: "Authorization Granted",
        title: "Alice Retries Request — Access Granted",
        explanation:
          "Alice resends s3:GetObject. The PDP gate matches statement AllowS3Read, illuminates emerald, and passes the request token to Amazon S3 returning HTTP 200 OK.",
        request: {
          principalId: "alice",
          action: "s3:GetObject",
          resourceArn: "arn:aws:s3:::company-data/reports/q3.pdf",
        },
        principals: [{ ...ALICE_BASE, attachedPolicies: ["policy-s3-readonly"] }],
        policies: [
          {
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
          },
        ],
        resources: [{ ...S3_COMPANY_DATA, status: "accessed" }],
        tokenPosition: "target",
        activeStatementSid: "AllowS3Read",
        detailedNotes: [
          {
            title: "Authorization Granted",
            body: "The IAM PDP successfully verified an explicit Allow without any matching Explicit Deny.",
          },
        ],
      },
    ],
  },

  // ── Scenario 2: Explicit Deny Overrides Allow ──
  {
    id: "explicit-deny-override",
    title: "The Golden Rule: Explicit Deny Overrides Allow",
    badge: "Scenario 2",
    description:
      "Witness AWS IAM's most critical evaluation precedence rule: an explicit Deny statement acts as a circuit breaker, overriding all matching Allow statements.",
    defaultPrincipalId: "bob",
    steps: [
      {
        id: "s2-step-0",
        stepNumber: 0,
        badge: "Full Access Baseline",
        title: "Bob with AdministratorAccess Policy",
        explanation:
          "Bob holds AdministratorAccess granting Allow on all actions (*) for all resources (*). He operates with full administrative authority across the account.",
        request: {
          principalId: "bob",
          action: "s3:DeleteBucket",
          resourceArn: "arn:aws:s3:::company-data",
        },
        principals: [{ ...BOB_BASE, attachedPolicies: ["policy-admin"] }],
        policies: [
          {
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
          },
        ],
        resources: [{ ...S3_COMPANY_DATA, status: "ready" }],
        tokenPosition: "principal",
        activeStatementSid: "FullAccess",
        detailedNotes: [
          {
            title: "AdministratorAccess",
            body: "AWS managed policy providing unrestricted access to all AWS services and resources via wildcard Action:* and Resource:*.",
          },
        ],
      },
      {
        id: "s2-step-1",
        stepNumber: 1,
        badge: "Critical Request",
        title: "Bob Issues s3:DeleteBucket API Call",
        explanation:
          "Bob attempts to execute s3:DeleteBucket on production storage arn:aws:s3:::company-data. An API request token traverses toward the PDP Gateway.",
        request: {
          principalId: "bob",
          action: "s3:DeleteBucket",
          resourceArn: "arn:aws:s3:::company-data",
        },
        principals: [{ ...BOB_BASE, attachedPolicies: ["policy-admin"] }],
        policies: [
          {
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
          },
        ],
        resources: [{ ...S3_COMPANY_DATA, status: "locked" }],
        tokenPosition: "bus",
        activeStatementSid: "FullAccess",
        detailedNotes: [
          {
            title: "Action",
            body: "s3:DeleteBucket permanently destroys an S3 bucket container and all its configuration metadata.",
          },
        ],
      },
      {
        id: "s2-step-2",
        stepNumber: 2,
        badge: "Deny Guardrail Attached",
        title: "Security Compliance Attaches BlockProductionDeletes",
        explanation:
          "The security compliance team attaches an inline guardrail policy BlockProductionDeletes containing an explicit Deny statement on s3:Delete* for production buckets.",
        request: {
          principalId: "bob",
          action: "s3:DeleteBucket",
          resourceArn: "arn:aws:s3:::company-data",
        },
        principals: [
          {
            ...BOB_BASE,
            attachedPolicies: ["policy-admin", "policy-deny-prod-delete"],
          },
        ],
        policies: [
          {
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
          },
          {
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
          },
        ],
        resources: [{ ...S3_COMPANY_DATA, status: "locked" }],
        tokenPosition: "bus",
        activeStatementSid: "DenyDeleteBucket",
        detailedNotes: [
          {
            title: "Explicit Deny",
            body: "A statement with Effect: Deny. In AWS IAM evaluation logic, any matching Explicit Deny instantly halts evaluation and denies access, overriding all Allows.",
          },
        ],
      },
      {
        id: "s2-step-3",
        stepNumber: 3,
        badge: "Circuit Breaker Tripped",
        title: "IAM Evaluator Circuit Breaker Trips!",
        explanation:
          "The IAM PDP scans attached policies. The moment statement DenyDeleteBucket matches s3:DeleteBucket, the Circuit Breaker snaps shut! All Allow checks are short-circuited.",
        request: {
          principalId: "bob",
          action: "s3:DeleteBucket",
          resourceArn: "arn:aws:s3:::company-data",
        },
        principals: [
          {
            ...BOB_BASE,
            attachedPolicies: ["policy-admin", "policy-deny-prod-delete"],
          },
        ],
        policies: [
          {
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
          },
          {
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
          },
        ],
        resources: [{ ...S3_COMPANY_DATA, status: "blocked" }],
        tokenPosition: "pdp_gate",
        activeStatementSid: "DenyDeleteBucket",
        detailedNotes: [
          {
            title: "Circuit Breaker",
            body: "The IAM evaluation short-circuit mechanism where an Explicit Deny immediately locks the gate, refusing to evaluate further Allow rules.",
            commandExample: {
              platform: "Universal",
              command:
                "aws iam simulate-principal-policy --policy-source-arn arn:aws:iam::123456789012:user/Bob --action-names s3:DeleteBucket --resource-arns arn:aws:s3:::company-data",
              purpose: "Simulate Bob deleting company-data with attached Deny policy",
              output: '{\n  "EvaluationResults": [\n    {\n      "EvalActionName": "s3:DeleteBucket",\n      "EvalDecision": "explicitDeny",\n      "MatchedStatements": [\n        {\n          "SourcePolicyId": "BlockProductionDeletes"\n        }\n      ]\n    }\n  ]\n}',
            },
          },
        ],
      },
      {
        id: "s2-step-4",
        stepNumber: 4,
        badge: "Production Protected",
        title: "Access Denied: Production Storage Protected",
        explanation:
          "The PDP deflects Bob's request token with a ruby crimson halo, returning HTTP 403 Forbidden with AccessDeniedException. The production bucket remains protected.",
        request: {
          principalId: "bob",
          action: "s3:DeleteBucket",
          resourceArn: "arn:aws:s3:::company-data",
        },
        principals: [
          {
            ...BOB_BASE,
            attachedPolicies: ["policy-admin", "policy-deny-prod-delete"],
          },
        ],
        policies: [
          {
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
          },
          {
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
          },
        ],
        resources: [{ ...S3_COMPANY_DATA, status: "blocked" }],
        tokenPosition: "rejected",
        activeStatementSid: "DenyDeleteBucket",
        detailedNotes: [
          {
            title: "AccessDeniedException",
            body: "Standard AWS API error returned when an identity attempts an unauthorized action or is blocked by an explicit deny.",
          },
        ],
      },
    ],
  },

  // ── Scenario 3: Group Inheritance & Multi-Policy Merge ──
  {
    id: "group-policy-inheritance",
    title: "Group Inheritance & Multi-Policy Merge",
    badge: "Scenario 3",
    description:
      "Explore how IAM calculates an identity's effective permissions by unioning user-attached policies with policies inherited from IAM Groups.",
    defaultPrincipalId: "charlie",
    steps: [
      {
        id: "s3-step-0",
        stepNumber: 0,
        badge: "User Policy Baseline",
        title: "Charlie (Intern) Joins Engineering",
        explanation:
          "Charlie has a single user policy InternS3Access granting Allow on s3:GetObject for public-assets. He has no access to company databases.",
        request: {
          principalId: "charlie",
          action: "s3:GetObject",
          resourceArn: "arn:aws:s3:::company-data/public-assets/logo.png",
        },
        principals: [{ ...CHARLIE_BASE, attachedPolicies: ["policy-intern-s3"], groups: [] }],
        policies: [
          {
            id: "policy-intern-s3",
            name: "InternS3Access",
            type: "identity",
            version: "2012-10-17",
            statements: [
              {
                sid: "AllowPublicS3",
                effect: "Allow",
                actions: ["s3:GetObject"],
                resources: ["arn:aws:s3:::company-data/public-assets/*"],
              },
            ],
          },
        ],
        resources: [{ ...S3_COMPANY_DATA, status: "ready" }, { ...DYNAMODB_EMPLOYEES, status: "locked" }],
        tokenPosition: "principal",
        activeStatementSid: "AllowPublicS3",
        detailedNotes: [
          {
            title: "IAM User",
            body: "An entity created in AWS representing a specific human or workload needing direct credentials and permissions.",
          },
        ],
      },
      {
        id: "s3-step-1",
        stepNumber: 1,
        badge: "Group Membership",
        title: "Charlie Added to Developers IAM Group",
        explanation:
          "Charlie is added to the Developers IAM group. The group has an attached policy DevelopersDynamoDBAccess granting Allow on dynamodb:GetItem and dynamodb:Query.",
        request: {
          principalId: "charlie",
          action: "dynamodb:GetItem",
          resourceArn: "arn:aws:dynamodb:us-east-1:123456789012:table/Employees",
        },
        principals: [
          {
            ...CHARLIE_BASE,
            attachedPolicies: ["policy-intern-s3", "policy-group-dynamo"],
            groups: ["Developers"],
          },
        ],
        policies: [
          {
            id: "policy-intern-s3",
            name: "InternS3Access",
            type: "identity",
            version: "2012-10-17",
            statements: [
              {
                sid: "AllowPublicS3",
                effect: "Allow",
                actions: ["s3:GetObject"],
                resources: ["arn:aws:s3:::company-data/public-assets/*"],
              },
            ],
          },
          {
            id: "policy-group-dynamo",
            name: "DevelopersDynamoDBAccess",
            type: "group",
            version: "2012-10-17",
            statements: [
              {
                sid: "AllowDynamoDBRead",
                effect: "Allow",
                actions: ["dynamodb:GetItem", "dynamodb:Query"],
                resources: ["arn:aws:dynamodb:us-east-1:123456789012:table/Employees"],
              },
            ],
          },
        ],
        resources: [{ ...S3_COMPANY_DATA, status: "ready" }, { ...DYNAMODB_EMPLOYEES, status: "ready" }],
        tokenPosition: "bus",
        activeStatementSid: "AllowDynamoDBRead",
        detailedNotes: [
          {
            title: "IAM Group",
            body: "A collection of IAM users. Permissions attached to a group are automatically inherited by all member users.",
            commandExample: {
              platform: "Universal",
              command:
                "aws iam add-user-to-group --group-name Developers --user-name Charlie",
              purpose: "Add Charlie to Developers group to inherit DynamoDB permissions",
            },
          },
        ],
      },
      {
        id: "s3-step-2",
        stepNumber: 2,
        badge: "Effective Policy Merge",
        title: "Charlie Requests dynamodb:GetItem Record",
        explanation:
          "Charlie issues a read request for employee ID 4021 in table/Employees. The PDP combines Charlie's user policies and group policies into an effective permission set.",
        request: {
          principalId: "charlie",
          action: "dynamodb:GetItem",
          resourceArn: "arn:aws:dynamodb:us-east-1:123456789012:table/Employees",
        },
        principals: [
          {
            ...CHARLIE_BASE,
            attachedPolicies: ["policy-intern-s3", "policy-group-dynamo"],
            groups: ["Developers"],
          },
        ],
        policies: [
          {
            id: "policy-intern-s3",
            name: "InternS3Access",
            type: "identity",
            version: "2012-10-17",
            statements: [
              {
                sid: "AllowPublicS3",
                effect: "Allow",
                actions: ["s3:GetObject"],
                resources: ["arn:aws:s3:::company-data/public-assets/*"],
              },
            ],
          },
          {
            id: "policy-group-dynamo",
            name: "DevelopersDynamoDBAccess",
            type: "group",
            version: "2012-10-17",
            statements: [
              {
                sid: "AllowDynamoDBRead",
                effect: "Allow",
                actions: ["dynamodb:GetItem", "dynamodb:Query"],
                resources: ["arn:aws:dynamodb:us-east-1:123456789012:table/Employees"],
              },
            ],
          },
        ],
        resources: [{ ...S3_COMPANY_DATA, status: "ready" }, { ...DYNAMODB_EMPLOYEES, status: "ready" }],
        tokenPosition: "pdp_gate",
        activeStatementSid: "AllowDynamoDBRead",
        detailedNotes: [
          {
            title: "Policy Union",
            body: "The combination of all attached inline and managed policies across an identity and its groups.",
          },
        ],
      },
      {
        id: "s3-step-3",
        stepNumber: 3,
        badge: "DynamoDB Access Granted",
        title: "Evaluation Engine Grants DynamoDB Read",
        explanation:
          "The engine evaluates statement AllowDynamoDBRead inherited via Developers group, finds a matching Allow, and returns HTTP 200 OK with the employee record payload.",
        request: {
          principalId: "charlie",
          action: "dynamodb:GetItem",
          resourceArn: "arn:aws:dynamodb:us-east-1:123456789012:table/Employees",
        },
        principals: [
          {
            ...CHARLIE_BASE,
            attachedPolicies: ["policy-intern-s3", "policy-group-dynamo"],
            groups: ["Developers"],
          },
        ],
        policies: [
          {
            id: "policy-intern-s3",
            name: "InternS3Access",
            type: "identity",
            version: "2012-10-17",
            statements: [
              {
                sid: "AllowPublicS3",
                effect: "Allow",
                actions: ["s3:GetObject"],
                resources: ["arn:aws:s3:::company-data/public-assets/*"],
              },
            ],
          },
          {
            id: "policy-group-dynamo",
            name: "DevelopersDynamoDBAccess",
            type: "group",
            version: "2012-10-17",
            statements: [
              {
                sid: "AllowDynamoDBRead",
                effect: "Allow",
                actions: ["dynamodb:GetItem", "dynamodb:Query"],
                resources: ["arn:aws:dynamodb:us-east-1:123456789012:table/Employees"],
              },
            ],
          },
        ],
        resources: [{ ...S3_COMPANY_DATA, status: "ready" }, { ...DYNAMODB_EMPLOYEES, status: "accessed" }],
        tokenPosition: "target",
        activeStatementSid: "AllowDynamoDBRead",
        detailedNotes: [
          {
            title: "dynamodb:GetItem",
            body: "Retrieves a set of attributes for an item in a DynamoDB table with a primary key.",
          },
        ],
      },
      {
        id: "s3-step-4",
        stepNumber: 4,
        badge: "Default Deny Boundary",
        title: "Charlie Attempts Unauthorized iam:CreateUser",
        explanation:
          "Charlie attempts iam:CreateUser to add a new account. Since iam:CreateUser is not in the union of his policies, evaluation falls through to Implicit Deny.",
        request: {
          principalId: "charlie",
          action: "iam:CreateUser",
          resourceArn: "arn:aws:iam::123456789012:user/David",
        },
        principals: [
          {
            ...CHARLIE_BASE,
            attachedPolicies: ["policy-intern-s3", "policy-group-dynamo"],
            groups: ["Developers"],
          },
        ],
        policies: [
          {
            id: "policy-intern-s3",
            name: "InternS3Access",
            type: "identity",
            version: "2012-10-17",
            statements: [
              {
                sid: "AllowPublicS3",
                effect: "Allow",
                actions: ["s3:GetObject"],
                resources: ["arn:aws:s3:::company-data/public-assets/*"],
              },
            ],
          },
          {
            id: "policy-group-dynamo",
            name: "DevelopersDynamoDBAccess",
            type: "group",
            version: "2012-10-17",
            statements: [
              {
                sid: "AllowDynamoDBRead",
                effect: "Allow",
                actions: ["dynamodb:GetItem", "dynamodb:Query"],
                resources: ["arn:aws:dynamodb:us-east-1:123456789012:table/Employees"],
              },
            ],
          },
        ],
        resources: [{ ...S3_COMPANY_DATA, status: "ready" }, { ...DYNAMODB_EMPLOYEES, status: "ready" }],
        tokenPosition: "rejected",
        detailedNotes: [
          {
            title: "Privilege Escalation",
            body: "Restricting iam:CreateUser prevents non-administrative identities from minting new administrative users or credentials.",
          },
        ],
      },
    ],
  },

  // ── Scenario 4: Resource-Based Policies vs Identity Policies ──
  {
    id: "cross-account-resource-policy",
    title: "Resource-Based Policies vs. Identity Policies",
    badge: "Scenario 4",
    description:
      "Understand cross-account IAM boundaries: in cross-account calls, both the caller's Identity Policy AND the destination's Resource Policy must explicitly allow access.",
    defaultPrincipalId: "alice",
    steps: [
      {
        id: "s4-step-0",
        stepNumber: 0,
        badge: "Cross-Account Setup",
        title: "Cross-Account Boundary Setup",
        explanation:
          "Alice in Account 111122223333 requests financial records stored in Amazon S3 bucket partner-bucket inside Partner Account 444455556666.",
        request: {
          principalId: "alice",
          action: "s3:GetObject",
          resourceArn: "arn:aws:s3:::partner-bucket/financials/2026.csv",
        },
        principals: [
          {
            ...ALICE_BASE,
            account: "111122223333",
            arn: "arn:aws:iam::111122223333:user/Alice",
            attachedPolicies: ["policy-outbound-s3"],
          },
        ],
        policies: [
          {
            id: "policy-outbound-s3",
            name: "OutboundPartnerS3Access",
            type: "identity",
            version: "2012-10-17",
            statements: [
              {
                sid: "AllowOutboundPartnerRead",
                effect: "Allow",
                actions: ["s3:GetObject"],
                resources: ["arn:aws:s3:::partner-bucket/*"],
              },
            ],
          },
        ],
        resources: [
          {
            id: "res-partner-bucket",
            name: "partner-bucket",
            arn: "arn:aws:s3:::partner-bucket/financials/2026.csv",
            type: "s3_bucket",
            account: "444455556666",
            status: "locked",
          },
        ],
        tokenPosition: "principal",
        activeStatementSid: "AllowOutboundPartnerRead",
        detailedNotes: [
          {
            title: "Cross-Account IAM",
            body: "Communication between distinct AWS accounts. Requires trust delegation from both caller and recipient accounts.",
          },
        ],
      },
      {
        id: "s4-step-1",
        stepNumber: 1,
        badge: "Identity Policy Check",
        title: "Identity Policy Evaluates Outbound Allow",
        explanation:
          "Alice's local account evaluates OutboundPartnerS3Access. It finds statement AllowOutboundPartnerRead and permits the request to exit Account 111122223333.",
        request: {
          principalId: "alice",
          action: "s3:GetObject",
          resourceArn: "arn:aws:s3:::partner-bucket/financials/2026.csv",
        },
        principals: [
          {
            ...ALICE_BASE,
            account: "111122223333",
            arn: "arn:aws:iam::111122223333:user/Alice",
            attachedPolicies: ["policy-outbound-s3"],
          },
        ],
        policies: [
          {
            id: "policy-outbound-s3",
            name: "OutboundPartnerS3Access",
            type: "identity",
            version: "2012-10-17",
            statements: [
              {
                sid: "AllowOutboundPartnerRead",
                effect: "Allow",
                actions: ["s3:GetObject"],
                resources: ["arn:aws:s3:::partner-bucket/*"],
              },
            ],
          },
        ],
        resources: [
          {
            id: "res-partner-bucket",
            name: "partner-bucket",
            arn: "arn:aws:s3:::partner-bucket/financials/2026.csv",
            type: "s3_bucket",
            account: "444455556666",
            status: "locked",
          },
        ],
        tokenPosition: "bus",
        activeStatementSid: "AllowOutboundPartnerRead",
        detailedNotes: [
          {
            title: "Identity Policy",
            body: "A policy attached directly to an IAM user, group, or role defining what that identity can perform.",
          },
        ],
      },
      {
        id: "s4-step-2",
        stepNumber: 2,
        badge: "Boundary Traversal",
        title: "Cross-Account Request Traverses Boundary",
        explanation:
          "The token reaches the boundary of Partner Account 444455556666. In cross-account calls, an identity policy is NOT sufficient: the target resource must also grant permission.",
        request: {
          principalId: "alice",
          action: "s3:GetObject",
          resourceArn: "arn:aws:s3:::partner-bucket/financials/2026.csv",
        },
        principals: [
          {
            ...ALICE_BASE,
            account: "111122223333",
            arn: "arn:aws:iam::111122223333:user/Alice",
            attachedPolicies: ["policy-outbound-s3"],
          },
        ],
        policies: [
          {
            id: "policy-outbound-s3",
            name: "OutboundPartnerS3Access",
            type: "identity",
            version: "2012-10-17",
            statements: [
              {
                sid: "AllowOutboundPartnerRead",
                effect: "Allow",
                actions: ["s3:GetObject"],
                resources: ["arn:aws:s3:::partner-bucket/*"],
              },
            ],
          },
        ],
        resources: [
          {
            id: "res-partner-bucket",
            name: "partner-bucket",
            arn: "arn:aws:s3:::partner-bucket/financials/2026.csv",
            type: "s3_bucket",
            account: "444455556666",
            status: "locked",
          },
        ],
        tokenPosition: "pdp_gate",
        activeStatementSid: "AllowOutboundPartnerRead",
        detailedNotes: [
          {
            title: "Dual-Allow Requirement",
            body: "The core rule of cross-account IAM: both the identity's account and the resource's account must allow the request.",
          },
        ],
      },
      {
        id: "s4-step-3",
        stepNumber: 3,
        badge: "Bucket Policy Rejection",
        title: "S3 Bucket Policy Rejection at Destination",
        explanation:
          "partner-bucket currently has no resource policy trusting Account 111122223333. The PDP halts evaluation and rejects the request with HTTP 403 Forbidden.",
        request: {
          principalId: "alice",
          action: "s3:GetObject",
          resourceArn: "arn:aws:s3:::partner-bucket/financials/2026.csv",
        },
        principals: [
          {
            ...ALICE_BASE,
            account: "111122223333",
            arn: "arn:aws:iam::111122223333:user/Alice",
            attachedPolicies: ["policy-outbound-s3"],
          },
        ],
        policies: [
          {
            id: "policy-outbound-s3",
            name: "OutboundPartnerS3Access",
            type: "identity",
            version: "2012-10-17",
            statements: [
              {
                sid: "AllowOutboundPartnerRead",
                effect: "Allow",
                actions: ["s3:GetObject"],
                resources: ["arn:aws:s3:::partner-bucket/*"],
              },
            ],
          },
        ],
        resources: [
          {
            id: "res-partner-bucket",
            name: "partner-bucket",
            arn: "arn:aws:s3:::partner-bucket/financials/2026.csv",
            type: "s3_bucket",
            account: "444455556666",
            status: "blocked",
          },
        ],
        tokenPosition: "rejected",
        detailedNotes: [
          {
            title: "Resource Policy",
            body: "A policy attached directly to a resource (such as an S3 bucket or KMS key) specifying who can access it.",
            commandExample: {
              platform: "Universal",
              command:
                "aws s3api get-bucket-policy --bucket partner-bucket",
              purpose: "Inspect whether a resource policy exists on partner-bucket",
              output: '{\n  "Error": {\n    "Code": "NoSuchBucketPolicy",\n    "Message": "The bucket policy does not exist"\n  }\n}',
            },
          },
        ],
      },
      {
        id: "s4-step-4",
        stepNumber: 4,
        badge: "Dual Trust Established",
        title: "Bucket Policy Updated — Handshake Verified",
        explanation:
          "Partner Account 444455556666 attaches a bucket policy trusting Account 111122223333. Both sides allow access, and Alice's request returns HTTP 200 OK.",
        request: {
          principalId: "alice",
          action: "s3:GetObject",
          resourceArn: "arn:aws:s3:::partner-bucket/financials/2026.csv",
        },
        principals: [
          {
            ...ALICE_BASE,
            account: "111122223333",
            arn: "arn:aws:iam::111122223333:user/Alice",
            attachedPolicies: ["policy-outbound-s3"],
          },
        ],
        policies: [
          {
            id: "policy-outbound-s3",
            name: "OutboundPartnerS3Access",
            type: "identity",
            version: "2012-10-17",
            statements: [
              {
                sid: "AllowOutboundPartnerRead",
                effect: "Allow",
                actions: ["s3:GetObject"],
                resources: ["arn:aws:s3:::partner-bucket/*"],
              },
            ],
          },
        ],
        resources: [
          {
            id: "res-partner-bucket",
            name: "partner-bucket",
            arn: "arn:aws:s3:::partner-bucket/financials/2026.csv",
            type: "s3_bucket",
            account: "444455556666",
            status: "accessed",
            resourcePolicy: {
              id: "policy-partner-bucket-trust",
              name: "PartnerBucketTrustPolicy",
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
          },
        ],
        tokenPosition: "target",
        activeStatementSid: "TrustAliceAccount",
        detailedNotes: [
          {
            title: "Trust Handshake",
            body: "With both identity policy in caller account and resource policy in target account granting Allow, cross-account evaluation succeeds.",
          },
        ],
      },
    ],
  },

  // ── Scenario 5: Workload Identity: EC2 Role & Temporary STS Credentials ──
  {
    id: "ec2-instance-profile-sts",
    title: "Workload Identity: EC2 Role & Temporary STS Credentials",
    badge: "Scenario 5",
    description:
      "Eliminate hardcoded static credentials. Watch an EC2 workload assume an IAM Role via IMDSv2, receive temporary ASIA... credentials from STS, and sign API calls safely.",
    defaultPrincipalId: "ec2-workload",
    steps: [
      {
        id: "s5-step-0",
        stepNumber: 0,
        badge: "Static Key Anti-Pattern",
        title: "The Static Key Anti-Pattern",
        explanation:
          "Traditional workloads often embed permanent static access keys (AKIA...) in server config files. If the EC2 instance is breached, attackers gain permanent account access.",
        request: {
          principalId: "ec2-workload",
          action: "s3:GetObject",
          resourceArn: "arn:aws:s3:::company-data/config/app.json",
        },
        principals: [
          {
            ...EC2_WORKLOAD_BASE,
            credentialsType: "static_key",
            accessKeyId: "AKIA_DANGEROUS_HARDCODED_KEY",
            sessionTokenMasked: undefined,
            tokenExpiration: "Never (Dangerous Permanent Key)",
          },
        ],
        policies: [],
        resources: [{ ...IMDSV2_ENDPOINT }, { ...S3_COMPANY_DATA, status: "locked" }],
        tokenPosition: "principal",
        detailedNotes: [
          {
            title: "Access Key ID",
            body: "A 20-character identifier starting with AKIA for long-term root/user keys or ASIA for short-lived temporary STS credentials.",
          },
          {
            title: "Hardcoded Secrets Risk",
            body: "Embedding static keys in source code or server images creates severe blast-radius vulnerabilities when instances are compromised.",
          },
        ],
      },
      {
        id: "s5-step-1",
        stepNumber: 1,
        badge: "EC2 Instance Profile",
        title: "Attaching IAM Instance Profile to EC2",
        explanation:
          "The engineer attaches an IAM Instance Profile WebServerProfile to EC2. The profile grants the EC2 instance permission to assume WebServerRole.",
        request: {
          principalId: "ec2-workload",
          action: "sts:AssumeRole",
          resourceArn: "arn:aws:iam::123456789012:role/WebServerRole",
        },
        principals: [
          {
            ...EC2_WORKLOAD_BASE,
            credentialsType: "temporary_sts",
            accessKeyId: "Acquiring...",
            sessionTokenMasked: undefined,
            tokenExpiration: "Pending IMDSv2 Call",
          },
        ],
        policies: [],
        resources: [{ ...IMDSV2_ENDPOINT, status: "ready" }, { ...S3_COMPANY_DATA, status: "locked" }],
        tokenPosition: "bus",
        detailedNotes: [
          {
            title: "IAM Role",
            body: "An identity with permission policies that determine what the role can and cannot do in AWS, but without permanent credentials.",
          },
          {
            title: "Instance Profile",
            body: "A container for an IAM role that you use to pass role information to an EC2 instance when the instance starts.",
          },
        ],
      },
      {
        id: "s5-step-2",
        stepNumber: 2,
        badge: "IMDSv2 Token Request",
        title: "EC2 Queries Instance Metadata Service (IMDSv2)",
        explanation:
          "The EC2 instance queries the local link-local address http://169.254.169.254/latest/meta-data/iam/security-credentials/WebServerRole using a session-oriented PUT token.",
        request: {
          principalId: "ec2-workload",
          action: "sts:AssumeRole",
          resourceArn: "arn:aws:iam::123456789012:role/WebServerRole",
        },
        principals: [
          {
            ...EC2_WORKLOAD_BASE,
            credentialsType: "temporary_sts",
            accessKeyId: "Acquiring...",
          },
        ],
        policies: [],
        resources: [{ ...IMDSV2_ENDPOINT, status: "ready" }, { ...S3_COMPANY_DATA, status: "locked" }],
        tokenPosition: "bus",
        detailedNotes: [
          {
            title: "IMDSv2",
            body: "Instance Metadata Service Version 2. Uses session-oriented requests (HTTP PUT with TTL header) to prevent SSRF credential theft.",
            commandExample: {
              platform: "Linux / POSIX",
              command:
                'TOKEN=$(curl -s -X PUT "http://169.254.169.254/latest/api/token" -H "X-aws-ec2-metadata-token-ttl-seconds: 21600") && curl -s -H "X-aws-ec2-metadata-token: $TOKEN" http://169.254.169.254/latest/meta-data/iam/security-credentials/WebServerRole',
              purpose: "Query EC2 IMDSv2 for temporary STS security credentials",
              output: '{\n  "Code": "Success",\n  "Type": "AWS-HMAC",\n  "AccessKeyId": "ASIAV3T2N7EXAMPLEKEY",\n  "SecretAccessKey": "sEcReT/kEy...",\n  "Token": "IQoJb3JpZ2lu...",\n  "Expiration": "2026-11-15T18:00:00Z"\n}',
            },
          },
        ],
      },
      {
        id: "s5-step-3",
        stepNumber: 3,
        badge: "Temporary STS Credentials",
        title: "AWS STS Mints Temporary ASIA Credentials",
        explanation:
          "AWS Security Token Service (STS) mints short-lived credentials starting with ASIA, paired with a cryptographically signed Session Token valid for 1 hour.",
        request: {
          principalId: "ec2-workload",
          action: "s3:GetObject",
          resourceArn: "arn:aws:s3:::company-data/config/app.json",
        },
        principals: [
          {
            ...EC2_WORKLOAD_BASE,
            credentialsType: "temporary_sts",
            accessKeyId: "ASIAV3T2N7EXAMPLEKEY",
            sessionTokenMasked: "IQoJb3JpZ2luX2VjEEXAMPLE...TokenSessionLength3600s",
            tokenExpiration: "2026-11-15T18:00:00Z (Valid for 1 Hour)",
          },
        ],
        policies: [
          {
            id: "policy-webserver-s3",
            name: "WebServerS3ReadPolicy",
            type: "identity",
            version: "2012-10-17",
            statements: [
              {
                sid: "AllowConfigRead",
                effect: "Allow",
                actions: ["s3:GetObject"],
                resources: ["arn:aws:s3:::company-data/config/*"],
              },
            ],
          },
        ],
        resources: [{ ...IMDSV2_ENDPOINT, status: "ready" }, { ...S3_COMPANY_DATA, status: "ready" }],
        tokenPosition: "pdp_gate",
        activeStatementSid: "AllowConfigRead",
        detailedNotes: [
          {
            title: "STS Token",
            body: "AWS Security Token Service mints temporary credentials (AccessKeyId starting with ASIA, SecretAccessKey, and SessionToken).",
            commandExample: {
              platform: "Universal",
              command: "aws sts get-caller-identity",
              purpose: "Inspect assumed role identity and ARN in active session",
              output: '{\n  "UserId": "AROA1234567890EXAMPLE:i-0a1b2c3d4e5f",\n  "Account": "123456789012",\n  "Arn": "arn:aws:sts::123456789012:assumed-role/WebServerRole/i-0a1b2c3d4e5f"\n}',
            },
          },
        ],
      },
      {
        id: "s5-step-4",
        stepNumber: 4,
        badge: "SigV4 Authorized API Call",
        title: "Signed V4 API Call with Temporary Token",
        explanation:
          "The AWS SDK signs the s3:GetObject API call using AWS Signature Version 4 including the temporary X-Amz-Security-Token header. S3 responds with HTTP 200 OK.",
        request: {
          principalId: "ec2-workload",
          action: "s3:GetObject",
          resourceArn: "arn:aws:s3:::company-data/config/app.json",
        },
        principals: [
          {
            ...EC2_WORKLOAD_BASE,
            credentialsType: "temporary_sts",
            accessKeyId: "ASIAV3T2N7EXAMPLEKEY",
            sessionTokenMasked: "IQoJb3JpZ2luX2VjEEXAMPLE...TokenSessionLength3600s",
            tokenExpiration: "2026-11-15T18:00:00Z (Valid for 1 Hour)",
          },
        ],
        policies: [
          {
            id: "policy-webserver-s3",
            name: "WebServerS3ReadPolicy",
            type: "identity",
            version: "2012-10-17",
            statements: [
              {
                sid: "AllowConfigRead",
                effect: "Allow",
                actions: ["s3:GetObject"],
                resources: ["arn:aws:s3:::company-data/config/*"],
              },
            ],
          },
        ],
        resources: [{ ...IMDSV2_ENDPOINT, status: "ready" }, { ...S3_COMPANY_DATA, status: "accessed" }],
        tokenPosition: "target",
        activeStatementSid: "AllowConfigRead",
        detailedNotes: [
          {
            title: "Signature Version 4",
            body: "The AWS signing protocol that uses HMAC-SHA256 to sign HTTP requests with secret keys without exposing the secret over the wire.",
          },
          {
            title: "Zero Permanent Secrets",
            body: "Temporary credentials rotate automatically every hour. If an instance shuts down or is destroyed, the credentials expire harmlessly.",
          },
        ],
      },
    ],
  },
];

// ============================================================================
// 3. AWS IAM Technical Glossary (InteractiveExplanationBar)
// ============================================================================

export const AWS_IAM_GLOSSARY: Record<string, ConceptDefinition> = {
  principal: {
    term: "IAM Principal",
    category: "Identity & Access",
    title: "IAM Principal",
    explanation:
      "A human user or workload identity (user, group, role) that makes a request for an action or operation on an AWS resource.",
    commandExample: {
      platform: "Universal",
      command: "aws sts get-caller-identity",
      purpose: "Inspect the active caller's IAM ARN, account ID, and principal identity",
      output: '{\n  "UserId": "AIDA1234567890EXAMPLE",\n  "Account": "123456789012",\n  "Arn": "arn:aws:iam::123456789012:user/Alice"\n}',
    },
  },
  action: {
    term: "IAM Action",
    category: "Policy Grammar",
    title: "IAM Action",
    explanation:
      "The specific operation or API call being performed on a service, written in the format service:operation (e.g. s3:GetObject, ec2:StartInstances).",
    commandExample: {
      platform: "Universal",
      command: "aws iam get-account-authorization-details --filter LocalManagedPolicies",
      purpose: "List active actions and policy attachments across the account",
    },
  },
  resource: {
    term: "AWS Resource",
    category: "Infrastructure",
    title: "AWS Resource",
    explanation:
      "An object in an AWS service that you work with, uniquely identified by an Amazon Resource Name (ARN) such as arn:aws:s3:::company-data.",
  },
  effect: {
    term: "Statement Effect",
    category: "Policy Grammar",
    title: "Statement Effect (Allow vs. Deny)",
    explanation:
      "The primary outcome specified by an IAM policy statement: either 'Allow' to grant access or 'Deny' to explicitly forbid access.",
  },
  "explicit deny": {
    term: "Explicit Deny",
    category: "Evaluation Precedence",
    title: "Explicit Deny Precedence",
    explanation:
      "A statement that explicitly sets Effect: Deny. In AWS IAM evaluation, an explicit Deny ALWAYS overrides any and all Allow statements, acting as an instant circuit breaker.",
    commandExample: {
      platform: "Universal",
      command:
        "aws iam simulate-principal-policy --policy-source-arn arn:aws:iam::123456789012:user/Bob --action-names s3:DeleteBucket",
      purpose: "Verify whether an explicit Deny policy blocks an administrative user",
    },
  },
  "implicit deny": {
    term: "Implicit Deny",
    category: "Evaluation Precedence",
    title: "Default Implicit Deny",
    explanation:
      "AWS IAM starts with the default baseline that all requests are denied. Unless a matching policy statement explicitly allows an action, access is refused.",
  },
  "least privilege": {
    term: "Principle of Least Privilege",
    category: "Security Best Practice",
    title: "Principle of Least Privilege",
    explanation:
      "The fundamental security principle of granting users, roles, and workloads only the minimal set of permissions required to complete their designated tasks.",
  },
  arn: {
    term: "Amazon Resource Name (ARN)",
    category: "AWS Addressing",
    title: "Amazon Resource Name (ARN)",
    explanation:
      "The canonical unique identifier for any AWS resource, formatted as arn:partition:service:region:account-id:resource-type/resource-id.",
  },
  "sts token": {
    term: "AWS STS Temporary Token",
    category: "Security Token Service",
    title: "Temporary Security Token",
    explanation:
      "Short-lived credentials minted dynamically by AWS Security Token Service. Consists of an Access Key ID starting with ASIA, a secret key, and a cryptographically signed session token.",
    commandExample: {
      platform: "Universal",
      command:
        "aws sts assume-role --role-arn arn:aws:iam::123456789012:role/WebServerRole --role-session-name AppSession",
      purpose: "Mint temporary 1-hour credentials for an application workload",
    },
  },
  "instance profile": {
    term: "EC2 Instance Profile",
    category: "Compute Identity",
    title: "EC2 Instance Profile",
    explanation:
      "A logical bridge that attaches an IAM Role to an Amazon EC2 instance, enabling applications running on the virtual machine to securely receive credentials via IMDS without static keys.",
  },
  imdsv2: {
    term: "IMDSv2 (Instance Metadata Service v2)",
    category: "Compute Security",
    title: "IMDSv2 Security Metadata Service",
    explanation:
      "A session-oriented HTTP endpoint at link-local 169.254.169.254 that protects EC2 instances from SSRF attacks by requiring an HTTP PUT session token before vending credentials.",
    commandExample: {
      platform: "Linux / POSIX",
      command:
        'curl -s -X PUT "http://169.254.169.254/latest/api/token" -H "X-aws-ec2-metadata-token-ttl-seconds: 21600"',
      purpose: "Fetch a secure session token for IMDSv2 metadata requests",
    },
  },
  "cross-account": {
    term: "Cross-Account IAM Access",
    category: "Multi-Account Architecture",
    title: "Cross-Account IAM Access",
    explanation:
      "When a principal in AWS Account A accesses a resource in AWS Account B, IAM requires BOTH an identity policy allowing outbound access AND a resource policy in the destination account trusting the principal.",
  },
  "resource policy": {
    term: "Resource-Based Policy",
    category: "Resource Security",
    title: "Resource-Based Policy",
    explanation:
      "A JSON policy attached directly to a resource (such as an S3 Bucket Policy, SQS Queue Policy, or KMS Key Policy), specifying which principals can perform actions on that resource.",
    commandExample: {
      platform: "Universal",
      command: "aws s3api get-bucket-policy --bucket company-data",
      purpose: "Retrieve the JSON resource policy attached to an S3 bucket",
    },
  },
  "assume-role": {
    term: "AssumeRole API",
    category: "Security Token Service",
    title: "sts:AssumeRole",
    explanation:
      "An AWS STS API operation that returns temporary security credentials for an IAM role. Used by workloads, cross-account delegates, and federated identities.",
  },
  sigv4: {
    term: "AWS Signature Version 4 (SigV4)",
    category: "Authentication Protocol",
    title: "AWS Signature Version 4",
    explanation:
      "The cryptographic HMAC-SHA256 signature protocol added to HTTP requests sent to AWS APIs. Authenticates the caller without transmitting the secret access key over the wire.",
  },
  "circuit breaker": {
    term: "IAM Circuit Breaker",
    category: "Evaluation Precedence",
    title: "IAM PDP Circuit Breaker",
    explanation:
      "The evaluation short-circuit that trips the moment an Explicit Deny statement is matched. It immediately halts further evaluation and short-circuits all Allow checks.",
  },
  "access key id": {
    term: "Access Key ID",
    category: "Authentication",
    title: "Access Key ID",
    explanation:
      "A 20-character alphanumeric identifier. Keys starting with AKIA represent long-term static credentials; keys starting with ASIA represent temporary STS credentials.",
  },
  "session token": {
    term: "Session Token",
    category: "Authentication",
    title: "AWS Session Token",
    explanation:
      "A cryptographically signed string provided alongside temporary ASIA credentials, passed in the X-Amz-Security-Token header to prove validity of the session.",
  },
  "s3:getobject": {
    term: "s3:GetObject",
    category: "S3 Actions",
    title: "s3:GetObject Action",
    explanation:
      "Retrieves an object from an Amazon S3 bucket. Requires read permission on the specific object ARN.",
  },
  "s3:deletebucket": {
    term: "s3:DeleteBucket",
    category: "S3 Actions",
    title: "s3:DeleteBucket Action",
    explanation:
      "Permanently deletes an Amazon S3 bucket. A high-risk administrative action typically guarded with explicit deny compliance policies.",
  },
  "dynamodb:getitem": {
    term: "dynamodb:GetItem",
    category: "DynamoDB Actions",
    title: "dynamodb:GetItem Action",
    explanation:
      "Fetches a single item from an Amazon DynamoDB table by matching its primary partition key.",
  },
  "iam:createuser": {
    term: "iam:CreateUser",
    category: "IAM Actions",
    title: "iam:CreateUser Action",
    explanation:
      "Creates a new IAM user for the AWS account. A privileged operation restricted to administrators to prevent privilege escalation.",
  },
};

// ============================================================================
// 4. AWS Term Patterns for Highlighting in InteractiveExplanationBar
// ============================================================================

export const AWS_TERM_PATTERNS = [
  "s3:GetObject",
  "s3:DeleteBucket",
  "dynamodb:GetItem",
  "iam:CreateUser",
  "sts:AssumeRole",
  "s3:ListBucket",
  "AdministratorAccess",
  "S3ReadOnlyAccess",
  "BlockProductionDeletes",
  "Explicit Deny",
  "Implicit Deny",
  "Least Privilege",
  "IAM User",
  "IAM Group",
  "IAM Role",
  "Instance Profile",
  "IMDSv2",
  "STS Token",
  "AccessDeniedException",
  "Circuit Breaker",
  "Signature Version 4",
  "Resource Policy",
  "Cross-Account",
  "AKIAIOSFODNN7EXAMPLE",
  "ASIAV3T2N7EXAMPLEKEY",
  "company-data",
  "partner-bucket",
  "Developers",
  "Alice",
  "Bob",
  "Charlie",
];
