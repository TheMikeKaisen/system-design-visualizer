import type { SystemNode, NodeKind, NodeCapacity } from "@/types";

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
  cdn:           "cdn",   apiGateway:   "apigw", client:       "client",
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
  client:            { label: "Client",             metadata: { type: "browser" } },
  service:           { label: "Service",            metadata: { replicas: 1 } },
  loadBalancer:      { label: "Load balancer",       metadata: { algorithm: "roundRobin", weightingType: "static" } },
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

// ─── Default capacity per node kind ───────────────────────────────────

const CAP_SERVICE:       NodeCapacity = { maxConcurrent: 100,  queueLimit: 500,  processingTimeMs: 200, cpuCores: 4, memoryMB: 8192,  memoryPerRequestMB: 10 };
const CAP_LB:            NodeCapacity = { maxConcurrent: 1000, queueLimit: 2000, processingTimeMs: 5,   cpuCores: 2, memoryMB: 2048,  memoryPerRequestMB: 1 };
const CAP_DATABASE:      NodeCapacity = { maxConcurrent: 50,   queueLimit: 200,  processingTimeMs: 100, cpuCores: 8, memoryMB: 16384, memoryPerRequestMB: 20 };
const CAP_CACHE:         NodeCapacity = { maxConcurrent: 500,  queueLimit: 1000, processingTimeMs: 10,  cpuCores: 2, memoryMB: 4096,  memoryPerRequestMB: 5 };
const CAP_QUEUE:         NodeCapacity = { maxConcurrent: 200,  queueLimit: 5000, processingTimeMs: 50,  cpuCores: 2, memoryMB: 4096,  memoryPerRequestMB: 2 };
const CAP_GATEWAY:       NodeCapacity = { maxConcurrent: 500,  queueLimit: 1000, processingTimeMs: 15,  cpuCores: 4, memoryMB: 4096,  memoryPerRequestMB: 2 };
const CAP_LAMBDA:        NodeCapacity = { maxConcurrent: 1000, queueLimit: 100,  processingTimeMs: 150, cpuCores: 2, memoryMB: 512,   memoryPerRequestMB: 5 };
const CAP_STORAGE:       NodeCapacity = { maxConcurrent: 5000, queueLimit: 500,  processingTimeMs: 50,  cpuCores: 1, memoryMB: 1024,  memoryPerRequestMB: 1 };

const KIND_CAPACITIES: Record<NodeKind, NodeCapacity | null> = {
  // General
  client:          null,
  service:         CAP_SERVICE,
  loadBalancer:    CAP_LB,
  database:        CAP_DATABASE,
  cache:           CAP_CACHE,
  messageQueue:    CAP_QUEUE,
  cdn:             null,
  s3Bucket:        null,
  apiGateway:      CAP_GATEWAY,
  // AWS
  awsEc2:          CAP_SERVICE,
  awsRds:          CAP_DATABASE,
  awsElastiCache:  CAP_CACHE,
  awsCloudFront:   null,
  awsLambda:       CAP_LAMBDA,
  awsSqs:          CAP_QUEUE,
  // GCP
  gcpCloudRun:     CAP_SERVICE,
  gcpCloudSql:     CAP_DATABASE,
  gcpCloudStorage: CAP_STORAGE,
  gcpPubSub:       CAP_QUEUE,
  gcpCloudCdn:     null,
  gcpCloudFunction:CAP_LAMBDA,
  // Azure
  azureVm:         CAP_SERVICE,
  azureSql:        CAP_DATABASE,
  azureBlobStorage:CAP_STORAGE,
  azureServiceBus: CAP_QUEUE,
  azureCdn:        null,
  azureFunction:   CAP_LAMBDA,
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

  const baseCap = KIND_CAPACITIES[kind];

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
      capacity:          baseCap ? { ...baseCap } : null,
      securityPolicies:  [],
    },
    measured: undefined,
  };
}