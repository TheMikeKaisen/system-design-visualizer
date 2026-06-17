// General
export { ServiceNode }      from "./ServiceNode";
export { LoadBalancerNode } from "./LoadBalancerNode";
export { DatabaseNode }     from "./DatabaseNode";
export { S3BucketNode }     from "./S3BucketNode";
export { CacheNode }        from "./CacheNode";
export { MessageQueueNode } from "./MessageQueueNode";
export { ApiGatewayNode }   from "./ApiGatewayNode";
export { CdnNode }          from "./CdnNode";

// AWS
export { AwsEc2Node }        from "./cloud/AwsEc2Node";
export { AwsRdsNode }        from "./cloud/AwsRdsNode";
export { AwsElastiCacheNode } from "./cloud/AwsElastiCacheNode";
export { AwsCloudFrontNode } from "./cloud/AwsCloudFrontNode";
export { AwsLambdaNode }     from "./cloud/AwsLambdaNode";
export { AwsSqsNode }        from "./cloud/AwsSqsNode";

// GCP
export { GcpCloudRunNode }     from "./cloud/GcpCloudRunNode";
export { GcpCloudSqlNode }     from "./cloud/GcpCloudSqlNode";
export { GcpCloudStorageNode } from "./cloud/GcpCloudStorageNode";
export { GcpPubSubNode }       from "./cloud/GcpPubSubNode";
export { GcpCloudCdnNode }     from "./cloud/GcpCloudCdnNode";
export { GcpCloudFunctionNode } from "./cloud/GcpCloudFunctionNode";

// Azure
export { AzureVmNode }           from "./cloud/AzureVmNode";
export { AzureSqlNode }          from "./cloud/AzureSqlNode";
export { AzureBlobStorageNode }  from "./cloud/AzureBlobStorageNode";
export { AzureServiceBusNode }   from "./cloud/AzureServiceBusNode";
export { AzureCdnNode }          from "./cloud/AzureCdnNode";
export { AzureFunctionNode }     from "./cloud/AzureFunctionNode";

// Edge
export { SimulationEdge } from "@/components/edges/SimulationEdge";

import * as Nodes from "./index";
import { SimulationEdge } from "@/components/edges/SimulationEdge";

export const nodeTypes = {
  service:          Nodes.ServiceNode,
  loadBalancer:     Nodes.LoadBalancerNode,
  database:         Nodes.DatabaseNode,
  s3Bucket:         Nodes.S3BucketNode,
  cache:            Nodes.CacheNode,
  messageQueue:     Nodes.MessageQueueNode,
  apiGateway:       Nodes.ApiGatewayNode,
  cdn:              Nodes.CdnNode,
  awsEc2:           Nodes.AwsEc2Node,
  awsRds:           Nodes.AwsRdsNode,
  awsElastiCache:   Nodes.AwsElastiCacheNode,
  awsCloudFront:    Nodes.AwsCloudFrontNode,
  awsLambda:        Nodes.AwsLambdaNode,
  awsSqs:           Nodes.AwsSqsNode,
  gcpCloudRun:      Nodes.GcpCloudRunNode,
  gcpCloudSql:      Nodes.GcpCloudSqlNode,
  gcpCloudStorage:  Nodes.GcpCloudStorageNode,
  gcpPubSub:        Nodes.GcpPubSubNode,
  gcpCloudCdn:      Nodes.GcpCloudCdnNode,
  gcpCloudFunction: Nodes.GcpCloudFunctionNode,
  azureVm:          Nodes.AzureVmNode,
  azureSql:         Nodes.AzureSqlNode,
  azureBlobStorage: Nodes.AzureBlobStorageNode,
  azureServiceBus:  Nodes.AzureServiceBusNode,
  azureCdn:         Nodes.AzureCdnNode,
  azureFunction:    Nodes.AzureFunctionNode,
} as const;

export const edgeTypes = {
  simulationEdge: SimulationEdge,
} as const;