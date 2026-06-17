import type { SystemNode, NodeKind } from "@/types";

const counters = new Map<NodeKind, number>();

export function syncCountersFromNodes(nodes: SystemNode[]): void {
  for (const node of nodes) {
    const kind  = node.data.kind;
    const match = node.id.match(/-(\d+)$/);
    if (!match) continue;
    const num     = parseInt(match[1], 10);
    const current = counters.get(kind) ?? 0;
    if (num > current) counters.set(kind, num);
  }
}

const KIND_PREFIX: Record<NodeKind, string> = {
  // General
  service:       "svc",   loadBalancer: "lb",   database:  "db",
  s3Bucket:      "s3",    cache:        "cache", messageQueue: "mq",
  cdn:           "cdn",   apiGateway:   "apigw",
  // AWS
  awsEc2:        "ec2",   awsRds:       "rds",  awsElastiCache: "ecache",
  awsCloudFront: "cf",    awsLambda:    "fn",   awsSqs:         "sqs",
  // GCP
  gcpCloudRun:   "run",   gcpCloudSql:  "csql", gcpCloudStorage: "gcs",
  gcpPubSub:     "pub",   gcpCloudCdn:  "gcdn", gcpCloudFunction: "gcfn",
  // Azure
  azureVm:       "avm",   azureSql:     "asql", azureBlobStorage: "blob",
  azureServiceBus:"asb",  azureCdn:     "acdn", azureFunction:    "afn",
};

const KIND_DEFAULTS: Record<NodeKind, { label: string; metadata: SystemNode["data"]["metadata"] }> = {
  // General
  service:           { label: "Service",            metadata: { replicas: 1 } },
  loadBalancer:      { label: "Load balancer",       metadata: { algorithm: "round-robin" } },
  database:          { label: "Database",            metadata: { engine: "postgres" } },
  s3Bucket:          { label: "S3 Bucket",           metadata: { region: "us-east-1" } },
  cache:             { label: "Cache",               metadata: { engine: "redis" } },
  messageQueue:      { label: "Message queue",       metadata: { engine: "rabbitmq" } },
  cdn:               { label: "CDN",                 metadata: { provider: "cloudfront" } },
  apiGateway:        { label: "API Gateway",         metadata: { type: "REST", throttle: 10000, cacheEnabled: "false", middlewareChain: "[]" } },
  // AWS
  awsEc2:            { label: "EC2 Instance",        metadata: { instanceType: "t3.medium",  region: "us-east-1", ami: "ami-0abcdef1234567890" } },
  awsRds:            { label: "RDS Database",        metadata: { engine: "postgres",  instanceClass: "db.t3.medium",    multiAz: "false" } },
  awsElastiCache:    { label: "ElastiCache",         metadata: { engine: "redis",     nodeType: "cache.t3.micro",       nodes: 1 } },
  awsCloudFront:     { label: "CloudFront",          metadata: { priceClass: "PriceClass_100", httpVersion: "http2" } },
  awsLambda:         { label: "Lambda",              metadata: { runtime: "node20.x", memoryMb: 512, timeoutS: 30 } },
  awsSqs:            { label: "SQS Queue",           metadata: { type: "Standard", visibilityTimeout: 30, retentionPeriod: 4 } },
  // GCP
  gcpCloudRun:       { label: "Cloud Run",           metadata: { region: "us-central1", minInstances: 0, maxInstances: 10, memoryMb: 512 } },
  gcpCloudSql:       { label: "Cloud SQL",           metadata: { engine: "postgres15", tier: "db-f1-micro", region: "us-central1", highAvailability: "false" } },
  gcpCloudStorage:   { label: "Cloud Storage",       metadata: { storageClass: "STANDARD", location: "US", publicAccess: "false" } },
  gcpPubSub:         { label: "Pub/Sub",             metadata: { subscriptions: 1, messageRetention: 7 } },
  gcpCloudCdn:       { label: "Cloud CDN",           metadata: { cacheMode: "CACHE_ALL_STATIC" } },
  gcpCloudFunction:  { label: "Cloud Function",      metadata: { runtime: "nodejs20", memoryMb: 256 } },
  // Azure
  azureVm:           { label: "Azure VM",            metadata: { size: "Standard_B2s", region: "eastus", os: "Ubuntu 22.04" } },
  azureSql:          { label: "Azure SQL",           metadata: { tier: "GeneralPurpose", dtu: "100", region: "eastus" } },
  azureBlobStorage:  { label: "Blob Storage",        metadata: { accessTier: "Hot", redundancy: "LRS", region: "eastus" } },
  azureServiceBus:   { label: "Service Bus",         metadata: { tier: "Standard", queues: 1, topics: 0 } },
  azureCdn:          { label: "Azure CDN",           metadata: { sku: "Standard_Microsoft" } },
  azureFunction:     { label: "Azure Function",      metadata: { runtime: "node18", plan: "Consumption" } },
};

interface CreateNodeOptions {
  kind:      NodeKind;
  label?:    string;
  position?: { x: number; y: number };
  forceId?:  string;
}

export function createNode({ kind, label, position = { x: 100, y: 100 }, forceId }: CreateNodeOptions): SystemNode {
  const defaults = KIND_DEFAULTS[kind];
  const prefix   = KIND_PREFIX[kind];
  const count    = (counters.get(kind) ?? 0) + 1;
  counters.set(kind, count);

  return {
    id:       forceId ?? `${prefix}-${count}`,
    type:     kind,
    position,
    data: {
      kind,
      label:             label ?? defaults.label,
      activeConnections: 0,
      load:              0,
      metadata:          { ...defaults.metadata },
      securityPolicies:  [],
    },
    measured: undefined,
  };
}