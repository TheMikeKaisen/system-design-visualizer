"use client";

import { useCallback, useState } from "react";
import type { SystemNode, NodeKind } from "@/types";
import { UpdateNodeDataCommand } from "@/lib/patterns/commands/UpdateNodeDataCommand";
import { commandInvoker } from "@/lib/store/useHistoryStore";
import { Select } from "@/components/ui/Select";
import { Input } from "@/components/ui/Input";

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

export const FIELDS: Partial<Record<NodeKind, FieldDef[]>> = {
  awsEc2: [
    { key: "instanceType",  label: "Instance type", type: "select",
      options: ["t3.micro","t3.small","t3.medium","t3.large","m5.large","m5.xlarge","c5.xlarge"] },
    { key: "region",  label: "Region", type: "select",
      options: ["us-east-1","us-west-2","eu-west-1","ap-southeast-1","ap-northeast-1"] },
    { key: "ami",     label: "AMI",    type: "text" },
    { key: "weight",  label: "Routing Weight", type: "number", min: 1, max: 100 },
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
    { key: "weight",   label: "Routing Weight", type: "number", min: 1, max: 100 },
  ],
  service: [
    { key: "weight", label: "Routing Weight", type: "number", min: 1, max: 100 },
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
    { key: "weight",       label: "Routing Weight", type: "number", min: 1, max: 100 },
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
    { key: "weight",   label: "Routing Weight", type: "number", min: 1, max: 100 },
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
  loadBalancer: [
    { key: "algorithm", label: "Routing Strategy", type: "select", options: ["roundRobin", "leastConnections", "weighted"] },
    { key: "weightingType", label: "Weighting Type", type: "select", options: ["static", "capacity"] }
  ],
};

// ─── Component ────────────────────────────────────────────────────────

export function CloudMetadataPanel({ node }: { node: SystemNode }) {
  const fields = FIELDS[node.data.kind] ?? [];
  const [localValues, setLocalValues] = useState<Record<string, string>>({});

  const getValue = (key: string): string =>
    localValues[key] ?? String(node.data.metadata[key] ?? "");

  const getCapValue = (key: keyof import("@/types").NodeCapacity): string =>
    localValues[`cap_${key}`] ?? String(node.data.capacity?.[key] ?? "");

  const commit = useCallback(
    (key: string, value: string | number) => {
      setLocalValues((p) => ({ ...p, [key]: String(value) }));
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

  const commitCap = useCallback(
    (key: keyof import("@/types").NodeCapacity, value: string) => {
      if (!node.data.capacity) return;
      setLocalValues((p) => ({ ...p, [`cap_${key}`]: value }));
      
      const parsed = parseFloat(value);
      if (isNaN(parsed)) return;

      commandInvoker.execute(
        new UpdateNodeDataCommand(
          node.id,
          { capacity: { ...node.data.capacity } },
          { capacity: { ...node.data.capacity, [key]: parsed } }
        )
      );
    },
    [node.id, node.data.capacity]
  );

  if (fields.length === 0 && !node.data.capacity) return null;

  return (
    <div className="flex flex-col gap-4 px-4 py-4 border-t border-white/10">
      <div className="flex flex-col gap-3 bg-white/5 p-3.5 rounded-xl border border-white/5 shadow-sm">
        <p className="text-[11px] font-semibold text-zinc-300 uppercase tracking-widest flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-primary/80"></span>
          Configuration
        </p>

        {fields.map((field) => (
          <div key={field.key} className="flex flex-col gap-1.5">
            <label className="text-[10px] font-medium text-muted-foreground">{field.label}</label>

            {field.type === "select" ? (
              <Select
                value={getValue(field.key)}
                onChange={(e) => commit(field.key, e.target.value)}
              >
                {field.options!.map((opt) => (
                  <option key={opt} value={opt} className="bg-zinc-900 text-zinc-100">{opt}</option>
                ))}
              </Select>
            ) : field.type === "number" ? (
              <Input
                type="number"
                min={field.min}
                max={field.max}
                value={getValue(field.key)}
                onChange={(e) => {
                  const val = parseFloat(e.target.value);
                  commit(field.key, isNaN(val) ? e.target.value : val);
                }}
              />
            ) : (
              <Input
                type="text"
                value={getValue(field.key)}
                onChange={(e) => setLocalValues((p) => ({ ...p, [field.key]: e.target.value }))}
                onBlur={(e) => commit(field.key, e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && commit(field.key, (e.target as HTMLInputElement).value)}
              />
            )}
          </div>
        ))}
      </div>

      {node.data.capacity && (
        <div className="flex flex-col gap-3 bg-white/5 p-3.5 rounded-xl border border-white/5 shadow-sm">
          <p className="text-[11px] font-semibold text-zinc-300 uppercase tracking-widest flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500/80"></span>
            Capacity & Limits
          </p>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-medium text-muted-foreground">CPU Cores</label>
              <Input
                type="number" min="1" max="64"
                value={getCapValue("cpuCores")}
                onChange={(e) => commitCap("cpuCores", e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-medium text-muted-foreground">Memory (MB)</label>
              <Select
                value={getCapValue("memoryMB")}
                onChange={(e) => commitCap("memoryMB", e.target.value)}
              >
                <option value="512" className="bg-zinc-900 text-zinc-100">512 MB</option>
                <option value="1024" className="bg-zinc-900 text-zinc-100">1 GB</option>
                <option value="2048" className="bg-zinc-900 text-zinc-100">2 GB</option>
                <option value="4096" className="bg-zinc-900 text-zinc-100">4 GB</option>
                <option value="8192" className="bg-zinc-900 text-zinc-100">8 GB</option>
                <option value="16384" className="bg-zinc-900 text-zinc-100">16 GB</option>
                <option value="32768" className="bg-zinc-900 text-zinc-100">32 GB</option>
              </Select>
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-medium text-muted-foreground">Max Concurrent Requests</label>
            <Input
              type="number" min="1" max="100000"
              value={getCapValue("maxConcurrent")}
              onChange={(e) => commitCap("maxConcurrent", e.target.value)}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-medium text-muted-foreground">Queue Limit</label>
            <Input
              type="number" min="0" max="1000000"
              value={getCapValue("queueLimit")}
              onChange={(e) => commitCap("queueLimit", e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-medium text-muted-foreground">Process Time (ms)</label>
              <Input
                type="number" min="1" max="10000"
                value={getCapValue("processingTimeMs")}
                onChange={(e) => commitCap("processingTimeMs", e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-medium text-muted-foreground">Mem / Req (MB)</label>
              <Input
                type="number" min="0.1" max="1024" step="0.1"
                value={getCapValue("memoryPerRequestMB")}
                onChange={(e) => commitCap("memoryPerRequestMB", e.target.value)}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
