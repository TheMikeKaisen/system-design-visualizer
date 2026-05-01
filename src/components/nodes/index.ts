import { SimulationEdge } from "../edges/SimulationEdge";
import { CacheNode } from "./CacheNode";
import { DatabaseNode } from "./DatabaseNode";
import { LoadBalancerNode } from "./LoadBalancerNode";
import { MessageQueueNode } from "./MessageQueueNode";
import { S3BucketNode } from "./S3BucketNode";
import { ServiceNode } from "./ServiceNode";

export const nodeTypes = {
  service:      ServiceNode,
  loadBalancer: LoadBalancerNode,
  database:     DatabaseNode,
  s3Bucket:     S3BucketNode,
  cache:        CacheNode,
  messageQueue: MessageQueueNode,
} as const;

export const edgeTypes = {
  simulationEdge: SimulationEdge,
} as const;