export type PrincipalType = "user" | "role" | "group";

export type CredentialsType = "static_key" | "temporary_sts" | "none";

export interface IAMPrincipal {
  id: string;
  name: string;
  arn: string;
  type: PrincipalType;
  account: string;
  roleName?: string;
  credentialsType: CredentialsType;
  accessKeyId?: string;
  secretAccessKeyMasked?: string;
  sessionTokenMasked?: string;
  tokenExpiration?: string;
  attachedPolicies: string[];
  groups?: string[];
  avatarColor?: string;
}

export type IAMEffect = "Allow" | "Deny";

export interface IAMStatement {
  sid: string;
  effect: IAMEffect;
  actions: string[];
  resources: string[];
  condition?: Record<string, unknown>;
  disabled?: boolean;
}

export type IAMPolicyType = "identity" | "group" | "resource" | "boundary";

export interface IAMPolicy {
  id: string;
  name: string;
  type: IAMPolicyType;
  version: string;
  statements: IAMStatement[];
  attachedTo?: string; // Principal ARN, Group ID, or Resource ARN
}

export type ResourceType = "s3_bucket" | "dynamodb_table" | "imds_v2" | "iam_role";

export interface AWSResource {
  id: string;
  name: string;
  arn: string;
  type: ResourceType;
  account: string;
  resourcePolicy?: IAMPolicy;
  status: "ready" | "locked" | "accessed" | "blocked";
}

export interface IAMActionRequest {
  principalId: string;
  action: string;
  resourceArn: string;
  context?: Record<string, unknown>;
}

export type EvaluationDecision = "ALLOW" | "EXPLICIT_DENY" | "DEFAULT_DENY";

export interface EvaluationTraceStep {
  order: number;
  title: string;
  description: string;
  matched: boolean;
  status: "pending" | "passed" | "tripped" | "neutral";
  policyId?: string;
  statementSid?: string;
}

export interface EvaluationVerdict {
  decision: EvaluationDecision;
  httpStatusCode: number;
  code: string;
  message: string;
  matchedStatement?: IAMStatement;
  matchedPolicy?: IAMPolicy;
  trace: EvaluationTraceStep[];
  isCircuitBreakerTripped: boolean;
}

export interface CommandSnippet {
  platform: "Linux / POSIX" | "macOS" | "macOS / Linux" | "Windows" | "Universal";
  command: string;
  purpose: string;
  output?: string;
}

export interface DetailedConceptNote {
  title: string;
  body: string;
  commandExample?: CommandSnippet;
}

export type TokenStagePosition = "principal" | "bus" | "pdp_gate" | "target" | "rejected";

export interface CloudSimulationStep {
  id: string;
  stepNumber: number;
  badge: string;
  title: string;
  explanation: string;
  request: IAMActionRequest;
  principals: IAMPrincipal[];
  policies: IAMPolicy[];
  resources: AWSResource[];
  tokenPosition?: TokenStagePosition;
  activeStatementSid?: string;
  overrideVerdict?: EvaluationVerdict;
  detailedNotes?: DetailedConceptNote[];
}

export interface CloudSimulationScenario {
  id: string;
  title: string;
  description: string;
  badge: string;
  defaultPrincipalId: string;
  steps: CloudSimulationStep[];
}
