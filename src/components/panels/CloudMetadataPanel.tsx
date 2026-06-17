"use client";

import { useCallback, useState } from "react";
import type { SystemNode, NodeKind } from "@/types";
import { commandInvoker } from "@/lib/store/useHistoryStore";
import { UpdateNodeDataCommand } from "@/lib/patterns/commands/UpdateNodeDataCommand";

// ─── Field definitions per NodeKind ───────────────────────────────────

type FieldType = "text" | "select" | "number";

interface FieldDef {
  key:      string;
  label:    string;
  type:     FieldType;
  options?: string[];
  min?:     number;
  max?:     number;
}

const FIELDS: Partial<Record<NodeKind, FieldDef[]>> = {
  awsEc2: [
    { key: "instanceType",  label: "Instance type", type: "select",
      options: ["t3.micro","t3.small","t3.medium","t3.large","m5.large","m5.xlarge","c5.xlarge"] },
    { key: "region",  label: "Region", type: "select",
      options: ["us-east-1","us-west-2","eu-west-1","ap-southeast-1","ap-northeast-1"] },
    { key: "ami",     label: "AMI",    type: "text" },
  ],
  awsRds: [
    { key: "engine", label: "Engine", type: "select",
      options: ["aurora-postgres","aurora-mysql","postgres","mysql","mariadb","oracle-ee","sqlserver-ee"] },
    { key: "instanceClass", label: "Instance class", type: "select",
      options: ["db.t3.micro","db.t3.medium","db.r5.large","db.r5.xlarge","db.r5.2xlarge"] },
    { key: "multiAz",       label: "Multi-AZ",       type: "select", options: ["true","false"] },
  ],
  awsElastiCache: [
    { key: "engine",   label: "Engine",    type: "select", options: ["redis","memcached"] },
    { key: "nodeType", label: "Node type", type: "select",
      options: ["cache.t3.micro","cache.t3.small","cache.r6g.large","cache.r6g.xlarge"] },
    { key: "nodes",    label: "Node count", type: "number", min: 1, max: 20 },
  ],
  awsCloudFront: [
    { key: "priceClass", label: "Price class", type: "select",
      options: ["PriceClass_100","PriceClass_200","PriceClass_All"] },
    { key: "httpVersion", label: "HTTP version", type: "select", options: ["http1.1","http2","http2and3","http3"] },
  ],
  awsLambda: [
    { key: "runtime",  label: "Runtime",    type: "select",
      options: ["node20.x","node18.x","python3.12","python3.11","java21","go1.x","dotnet8"] },
    { key: "memoryMb", label: "Memory (MB)", type: "select",
      options: ["128","256","512","1024","2048","3008","10240"] },
    { key: "timeoutS", label: "Timeout (s)", type: "number", min: 1, max: 900 },
  ],
  awsSqs: [
    { key: "type",             label: "Queue type",         type: "select", options: ["Standard","FIFO"] },
    { key: "visibilityTimeout",label: "Visibility timeout", type: "number", min: 0, max: 43200 },
    { key: "retentionPeriod",  label: "Retention (days)",   type: "number", min: 1, max: 14 },
  ],
  gcpCloudRun: [
    { key: "region",   label: "Region", type: "select",
      options: ["us-central1","us-east1","europe-west1","asia-east1","asia-northeast1"] },
    { key: "minInstances", label: "Min instances", type: "number", min: 0, max: 100 },
    { key: "maxInstances", label: "Max instances", type: "number", min: 1, max: 1000 },
    { key: "memoryMb",     label: "Memory (MB)",   type: "select", options: ["128","256","512","1024","2048","4096","8192"] },
  ],
  gcpCloudSql: [
    { key: "engine", label: "Engine", type: "select", options: ["postgres14","postgres15","mysql8","sqlserver2019"] },
    { key: "tier",   label: "Tier",   type: "select",
      options: ["db-f1-micro","db-g1-small","db-n1-standard-1","db-n1-standard-2","db-n1-standard-4"] },
    { key: "region", label: "Region", type: "text" },
    { key: "highAvailability", label: "High availability", type: "select", options: ["true","false"] },
  ],
  gcpCloudStorage: [
    { key: "storageClass", label: "Storage class", type: "select",
      options: ["STANDARD","NEARLINE","COLDLINE","ARCHIVE"] },
    { key: "location", label: "Location", type: "select",
      options: ["US","EU","ASIA","us-central1","europe-west1"] },
    { key: "publicAccess", label: "Public access", type: "select", options: ["false","true"] },
  ],
  gcpPubSub: [
    { key: "subscriptions",    label: "Subscription count", type: "number", min: 0, max: 1000 },
    { key: "messageRetention", label: "Retention (days)",   type: "number", min: 1, max: 7 },
  ],
  azureVm: [
    { key: "size",     label: "VM size",   type: "select",
      options: ["Standard_B1s","Standard_B2s","Standard_D2s_v3","Standard_D4s_v3","Standard_E4s_v3"] },
    { key: "region",   label: "Region",    type: "select",
      options: ["eastus","westus2","westeurope","eastasia","australiaeast"] },
    { key: "os",       label: "OS",        type: "select", options: ["Ubuntu 22.04","Windows Server 2022","RHEL 9"] },
  ],
  azureSql: [
    { key: "tier",     label: "Tier",     type: "select", options: ["Basic","Standard","Premium","GeneralPurpose","BusinessCritical"] },
    { key: "dtu",      label: "DTUs",     type: "select", options: ["5","10","20","50","100","200","400","800"] },
    { key: "region",   label: "Region",   type: "text" },
  ],
  azureBlobStorage: [
    { key: "accessTier",     label: "Access tier",    type: "select", options: ["Hot","Cool","Archive"] },
    { key: "redundancy",     label: "Redundancy",     type: "select", options: ["LRS","GRS","RAGRS","ZRS","GZRS"] },
    { key: "region",         label: "Region",         type: "text" },
  ],
  azureServiceBus: [
    { key: "tier",       label: "Tier",          type: "select", options: ["Basic","Standard","Premium"] },
    { key: "queues",     label: "Queue count",   type: "number", min: 0, max: 10000 },
    { key: "topics",     label: "Topic count",   type: "number", min: 0, max: 10000 },
  ],
  apiGateway: [
    { key: "type",       label: "API type",   type: "select", options: ["REST","HTTP","WebSocket","GraphQL"] },
    { key: "region",     label: "Region",     type: "text" },
    { key: "throttle",   label: "Throttle (req/s)", type: "number", min: 0, max: 100000 },
    { key: "cacheEnabled", label: "Response cache", type: "select", options: ["false","true"] },
  ],
};

// ─── Component ────────────────────────────────────────────────────────

export function CloudMetadataPanel({ node }: { node: SystemNode }) {
  const fields = FIELDS[node.data.kind] ?? [];
  const [localValues, setLocalValues] = useState<Record<string, string>>({});

  const getValue = (key: string): string =>
    localValues[key] ?? String(node.data.metadata[key] ?? "");

  const commit = useCallback(
    (key: string, value: string) => {
      setLocalValues((p) => ({ ...p, [key]: value }));
      commandInvoker.execute(
        new UpdateNodeDataCommand(
          node.id,
          { metadata: { ...node.data.metadata } },
          { metadata: { ...node.data.metadata, [key]: value } }
        )
      );
    },
    [node.id, node.data.metadata]
  );

  if (fields.length === 0) return null;

  return (
    <div className="flex flex-col gap-3 px-4 py-3 border-t border-border">
      <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
        Configuration
      </p>

      {fields.map((field) => (
        <div key={field.key} className="flex flex-col gap-1">
          <label className="text-[10px] text-muted-foreground">{field.label}</label>

          {field.type === "select" ? (
            <select
              value={getValue(field.key)}
              onChange={(e) => commit(field.key, e.target.value)}
              className="text-xs bg-transparent border border-border rounded px-2 py-1.5
                         text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            >
              {field.options!.map((opt) => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
            </select>
          ) : field.type === "number" ? (
            <input
              type="number"
              min={field.min}
              max={field.max}
              value={getValue(field.key)}
              onChange={(e) => commit(field.key, e.target.value)}
              className="text-xs bg-transparent border border-border rounded px-2 py-1.5
                         text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            />
          ) : (
            <input
              type="text"
              value={getValue(field.key)}
              onChange={(e) => setLocalValues((p) => ({ ...p, [field.key]: e.target.value }))}
              onBlur={(e) => commit(field.key, e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && commit(field.key, (e.target as HTMLInputElement).value)}
              className="text-xs bg-transparent border border-border rounded px-2 py-1.5
                         text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            />
          )}
        </div>
      ))}
    </div>
  );
}
