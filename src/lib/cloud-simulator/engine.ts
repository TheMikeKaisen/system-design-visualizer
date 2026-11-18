import type {
  IAMPolicy,
  IAMPrincipal,
  AWSResource,
  IAMActionRequest,
  EvaluationVerdict,
  EvaluationTraceStep,
  IAMStatement,
} from "./types";

/**
 * Converts a wildcard string pattern (e.g. "s3:Get*", "*", "arn:aws:s3:::bucket/*")
 * into a safe regular expression.
 */
function wildcardToRegExp(pattern: string): RegExp {
  if (pattern === "*") {
    return /^.*$/i;
  }
  // Escape regex specials except '*' and '?'
  const escaped = pattern
    .replace(/[.+^${}()|[\]\\]/g, "\\$&")
    .replace(/\*/g, ".*")
    .replace(/\?/g, ".");
  return new RegExp(`^${escaped}$`, "i");
}

/**
 * Checks whether an IAM action matches an action pattern (e.g., "s3:*" matches "s3:GetObject").
 */
export function matchesAction(pattern: string, actualAction: string): boolean {
  if (pattern === "*") return true;
  return wildcardToRegExp(pattern).test(actualAction);
}

/**
 * Checks whether an AWS resource ARN matches a resource pattern ARN.
 */
export function matchesResourceArn(patternArn: string, actualArn: string): boolean {
  if (patternArn === "*") return true;
  return wildcardToRegExp(patternArn).test(actualArn);
}

/**
 * Finds statements in a policy that match the given action and resource ARN.
 */
function findMatchingStatements(
  policy: IAMPolicy,
  action: string,
  resourceArn: string,
  effectFilter?: "Allow" | "Deny"
): IAMStatement[] {
  return policy.statements.filter((stmt) => {
    if (stmt.disabled) return false;
    if (effectFilter && stmt.effect !== effectFilter) return false;

    const actionMatch = stmt.actions.some((actPattern) => matchesAction(actPattern, action));
    if (!actionMatch) return false;

    const resourceMatch = stmt.resources.some((resPattern) =>
      matchesResourceArn(resPattern, resourceArn)
    );
    return resourceMatch;
  });
}

/**
 * Pure AWS IAM Policy Decision Point (PDP) evaluation engine.
 * Implements the standard 5-step AWS IAM authorization evaluation logic:
 * 1. Default Implicit Deny Baseline
 * 2. Explicit Deny Precedence Scan (Circuit Breaker)
 * 3. Organization SCPs / Permission Boundaries (abstracted)
 * 4. Explicit Allow Scan (+ Cross-Account Resource Policy Handshake)
 * 5. Fallback Default Deny
 */
export function evaluateIAMRequest(
  request: IAMActionRequest,
  principal: IAMPrincipal,
  policies: IAMPolicy[],
  resources: AWSResource[]
): EvaluationVerdict {
  const trace: EvaluationTraceStep[] = [];

  // Step 1: Default Deny Baseline
  trace.push({
    order: 1,
    title: "1. Implicit Deny Baseline",
    description: "AWS IAM evaluates all requests as denied by default until explicitly allowed.",
    matched: true,
    status: "neutral",
  });

  // Collect active identity and group policies attached to this principal
  const attachedPolicies = policies.filter((pol) => {
    return principal.attachedPolicies.includes(pol.id) || pol.attachedTo === principal.arn;
  });

  // Find target resource if defined
  const targetResource =
    resources.find(
      (r) => r.arn === request.resourceArn || matchesResourceArn(r.arn, request.resourceArn)
    ) ?? resources[0];

  // Step 2: Explicit Deny Scan
  let explicitDenyStatement: IAMStatement | undefined;
  let explicitDenyPolicy: IAMPolicy | undefined;

  for (const policy of attachedPolicies) {
    const matchingDenies = findMatchingStatements(policy, request.action, request.resourceArn, "Deny");
    if (matchingDenies.length > 0) {
      explicitDenyStatement = matchingDenies[0];
      explicitDenyPolicy = policy;
      break;
    }
  }

  // Also check resource policy for explicit deny if present
  if (!explicitDenyStatement && targetResource?.resourcePolicy) {
    const matchingDenies = findMatchingStatements(
      targetResource.resourcePolicy,
      request.action,
      request.resourceArn,
      "Deny"
    );
    if (matchingDenies.length > 0) {
      explicitDenyStatement = matchingDenies[0];
      explicitDenyPolicy = targetResource.resourcePolicy;
    }
  }

  if (explicitDenyStatement && explicitDenyPolicy) {
    trace.push({
      order: 2,
      title: "2. Explicit Deny Precedence (Circuit Breaker Tripped)",
      description: `Explicit Deny encountered in '${explicitDenyPolicy.name}' (Statement '${explicitDenyStatement.sid}'). Overrides all allows.`,
      matched: true,
      status: "tripped",
      policyId: explicitDenyPolicy.id,
      statementSid: explicitDenyStatement.sid,
    });

    trace.push({
      order: 3,
      title: "3. Allow Scan (Bypassed)",
      description: "Downstream Allow checks halted due to explicit deny precedence.",
      matched: false,
      status: "pending",
    });

    return {
      decision: "EXPLICIT_DENY",
      httpStatusCode: 403,
      code: "AccessDeniedException",
      message: `User ${principal.name} is not authorized to perform ${request.action} on ${request.resourceArn} because an explicit deny exists in policy '${explicitDenyPolicy.name}'.`,
      matchedStatement: explicitDenyStatement,
      matchedPolicy: explicitDenyPolicy,
      trace,
      isCircuitBreakerTripped: true,
    };
  }

  trace.push({
    order: 2,
    title: "2. Explicit Deny Scan",
    description: "No explicit deny statements found in attached identity or resource policies.",
    matched: false,
    status: "passed",
  });

  // Step 3: Explicit Allow Scan
  let explicitAllowStatement: IAMStatement | undefined;
  let explicitAllowPolicy: IAMPolicy | undefined;

  for (const policy of attachedPolicies) {
    const matchingAllows = findMatchingStatements(
      policy,
      request.action,
      request.resourceArn,
      "Allow"
    );
    if (matchingAllows.length > 0) {
      explicitAllowStatement = matchingAllows[0];
      explicitAllowPolicy = policy;
      break;
    }
  }

  // Check Cross-Account Boundary
  const isCrossAccount =
    targetResource &&
    targetResource.account &&
    principal.account &&
    targetResource.account !== principal.account;

  if (isCrossAccount) {
    if (!explicitAllowStatement) {
      trace.push({
        order: 3,
        title: "3. Allow Scan (Cross-Account)",
        description: `Principal account ${principal.account} has no outbound identity policy allowing ${request.action}.`,
        matched: false,
        status: "tripped",
      });

      return {
        decision: "DEFAULT_DENY",
        httpStatusCode: 403,
        code: "AccessDeniedException",
        message: `User ${principal.name} is not authorized to perform ${request.action} on ${request.resourceArn} (no outbound Allow statement).`,
        trace,
        isCircuitBreakerTripped: false,
      };
    }

    // In cross-account, resource policy must ALSO allow
    let resourcePolicyAllowStatement: IAMStatement | undefined;
    if (targetResource.resourcePolicy) {
      const resourceAllows = findMatchingStatements(
        targetResource.resourcePolicy,
        request.action,
        request.resourceArn,
        "Allow"
      );
      if (resourceAllows.length > 0) {
        resourcePolicyAllowStatement = resourceAllows[0];
      }
    }

    if (!resourcePolicyAllowStatement) {
      trace.push({
        order: 3,
        title: "3. Cross-Account Resource Boundary Rejection",
        description: `Identity policy in Account ${principal.account} allows, but Resource Policy in target Account ${targetResource.account} lacks trust statement.`,
        matched: true,
        status: "tripped",
        policyId: explicitAllowPolicy?.id,
        statementSid: explicitAllowStatement.sid,
      });

      return {
        decision: "DEFAULT_DENY",
        httpStatusCode: 403,
        code: "AccessDeniedException",
        message: `Cross-account request rejected: User ${principal.name} in Account ${principal.account} is allowed outbound, but destination resource ${request.resourceArn} in Account ${targetResource.account} has no matching resource policy granting trust.`,
        matchedStatement: explicitAllowStatement,
        matchedPolicy: explicitAllowPolicy,
        trace,
        isCircuitBreakerTripped: false,
      };
    }

    trace.push({
      order: 3,
      title: "3. Cross-Account Dual-Allow Verified",
      description: `Both identity policy and resource policy grant Allow for ${request.action}.`,
      matched: true,
      status: "passed",
      policyId: explicitAllowPolicy?.id,
      statementSid: explicitAllowStatement.sid,
    });

    return {
      decision: "ALLOW",
      httpStatusCode: 200,
      code: "OK",
      message: `Authorization granted: ${request.action} on ${request.resourceArn} permitted across account boundary.`,
      matchedStatement: explicitAllowStatement,
      matchedPolicy: explicitAllowPolicy,
      trace,
      isCircuitBreakerTripped: false,
    };
  }

  // Same-Account Allow
  // In same-account evaluation, an Allow in EITHER an Identity Policy OR a Resource Policy is sufficient.
  if (!explicitAllowStatement && targetResource?.resourcePolicy) {
    const resourceAllows = findMatchingStatements(
      targetResource.resourcePolicy,
      request.action,
      request.resourceArn,
      "Allow"
    );
    if (resourceAllows.length > 0) {
      explicitAllowStatement = resourceAllows[0];
      explicitAllowPolicy = targetResource.resourcePolicy;
    }
  }

  if (explicitAllowStatement && explicitAllowPolicy) {
    trace.push({
      order: 3,
      title: "3. Allow Scan (Granted)",
      description: `Matching Allow statement '${explicitAllowStatement.sid}' found in ${explicitAllowPolicy.type === "resource" ? "resource" : "policy"} '${explicitAllowPolicy.name}'.`,
      matched: true,
      status: "passed",
      policyId: explicitAllowPolicy.id,
      statementSid: explicitAllowStatement.sid,
    });

    return {
      decision: "ALLOW",
      httpStatusCode: 200,
      code: "OK",
      message: `Authorization granted: ${request.action} on ${request.resourceArn} permitted by statement '${explicitAllowStatement.sid}'.`,
      matchedStatement: explicitAllowStatement,
      matchedPolicy: explicitAllowPolicy,
      trace,
      isCircuitBreakerTripped: false,
    };
  }

  // Step 4: Fallback Default Deny
  trace.push({
    order: 3,
    title: "3. Allow Scan (No Match)",
    description: "Evaluated all attached policies. Zero matching Allow statements found.",
    matched: false,
    status: "tripped",
  });

  trace.push({
    order: 4,
    title: "4. Final Verdict: Implicit Default Deny",
    description: "Request denied by default due to absence of an explicit Allow statement.",
    matched: true,
    status: "tripped",
  });

  return {
    decision: "DEFAULT_DENY",
    httpStatusCode: 403,
    code: "AccessDeniedException",
    message: `User ${principal.name} is not authorized to perform ${request.action} on ${request.resourceArn} (no matching Allow statement found in attached policies).`,
    trace,
    isCircuitBreakerTripped: false,
  };
}

/**
 * Formats an IAMPolicy into standard, syntax-highlightable AWS IAM JSON AST string.
 */
export function formatPolicyJSON(policy: IAMPolicy): string {
  const ast = {
    Version: policy.version || "2012-10-17",
    Statement: policy.statements.map((stmt) => ({
      Sid: stmt.sid,
      Effect: stmt.effect,
      Action: stmt.actions.length === 1 ? stmt.actions[0] : stmt.actions,
      Resource: stmt.resources.length === 1 ? stmt.resources[0] : stmt.resources,
      ...(stmt.condition ? { Condition: stmt.condition } : {}),
    })),
  };
  return JSON.stringify(ast, null, 2);
}
