import type { SystemNode, NodeKind } from "@/types";

// ─────────────────────────────────────────────
// Monotonic counter per session
// ─────────────────────────────────────────────

const counters = new Map<NodeKind, number>();

function nextId(kind: NodeKind): string {
  const prefix = KIND_PREFIX[kind] ?? "node";
  const count = (counters.get(kind) ?? 0) + 1;
  counters.set(kind, count);
  return `${prefix}-${count}`;
}

/**
 * When loading a saved diagram, call this to restore the counter so
 * newly created nodes never collide with loaded ones.
 */
export function syncCountersFromNodes(nodes: SystemNode[]): void {
  for (const node of nodes) {
    const kind = node.data.kind;
    const match = node.id.match(/-(\d+)$/);
    if (!match) continue;
    const num = parseInt(match[1], 10);
    const current = counters.get(kind) ?? 0;
    if (num > current) counters.set(kind, num);
  }
}

// ─────────────────────────────────────────────
// Per-kind defaults
// ─────────────────────────────────────────────

const KIND_PREFIX: Record<NodeKind, string> = {
  service:               "svc",
  loadBalancer:          "lb",
  database:              "db",
  s3Bucket:              "s3",
  cache:                 "cache",
  messageQueue:          "mq",
  cdn:                   "cdn",
  ec2Instance:           "ec2",
  rdsCluster:            "rds",
  elasticacheCluster:    "elasticache",
  cloudfrontDistribution:"cf",
  apiGateway:            "apigw",
};

const KIND_DEFAULTS: Record<
  NodeKind,
  { label: string; metadata: SystemNode["data"]["metadata"] }
> = {
  service:               { label: "Service",         metadata: { replicas: 1 } },
  loadBalancer:          { label: "Load Balancer",   metadata: { algorithm: "round-robin" } },
  database:              { label: "Database",        metadata: { engine: "postgres" } },
  s3Bucket:              { label: "S3 Bucket",       metadata: { region: "us-east-1" } },
  cache:                 { label: "Cache",           metadata: { engine: "redis" } },
  messageQueue:          { label: "Message Queue",   metadata: { engine: "rabbitmq" } },
  cdn:                   { label: "CDN",             metadata: { provider: "cloudfront" } },
  ec2Instance:           { label: "EC2 Instance",    metadata: { instanceType: "t3.medium" } },
  rdsCluster:            { label: "RDS Cluster",     metadata: { engine: "aurora-postgres" } },
  elasticacheCluster:    { label: "ElastiCache",     metadata: { engine: "redis" } },
  cloudfrontDistribution:{ label: "CloudFront",      metadata: { priceClass: "PriceClass_100" } },
  apiGateway:            { label: "API Gateway",     metadata: { type: "REST" } },
};

// ─────────────────────────────────────────────
// Factory
// ─────────────────────────────────────────────

interface CreateNodeOptions {
  kind: NodeKind;
  label?: string;
  position?: { x: number; y: number };
  /** Force a specific ID — used when replaying a remote AddNodeCommand */
  forceId?: string;
}

export function createNode({
  kind,
  label,
  position = { x: 100, y: 100 },
  forceId,
}: CreateNodeOptions): SystemNode {
  const defaults = KIND_DEFAULTS[kind];
  return {
    id: forceId ?? nextId(kind),
    type: kind,
    position,
    data: {
      kind,
      label: label ?? defaults.label,
      activeConnections: 0,
      load: 0,
      metadata: { ...defaults.metadata },
      securityPolicies: [],   // empty = no enforcement
    },
    measured: undefined,
  };
}