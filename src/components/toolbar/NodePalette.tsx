"use client";

import { useCallback, useState } from "react";
import type { NodeKind } from "@/types";
import {
  AwsEc2Icon, AwsRdsIcon, AwsElastiCacheIcon, AwsCloudFrontIcon,
  AwsLambdaIcon, AwsSqsIcon,
  GcpCloudRunIcon, GcpCloudSqlIcon, GcpCloudStorageIcon,
  GcpPubSubIcon, GcpCloudCdnIcon, GcpCloudFunctionIcon,
  AzureVmIcon, AzureSqlIcon, AzureBlobIcon, AzureServiceBusIcon,
  AzureCdnIcon, AzureFunctionIcon, ApiGatewayIcon,
} from "@/components/nodes/icons/CloudIcons";

// ─── Palette data ─────────────────────────────────────────────────────

interface PaletteItem { kind: NodeKind; label: string; icon: React.ReactNode }
interface PaletteSection { id: string; label: string; color: string; items: PaletteItem[] }

function ServiceIcon() {
  return <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round"><rect x="2" y="2" width="12" height="12" rx="2.5"/><path d="M8 5v6M5 8h6"/></svg>;
}
function LBIcon() {
  return <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round"><circle cx="8" cy="4" r="2"/><circle cx="3" cy="12" r="2"/><circle cx="13" cy="12" r="2"/><path d="M8 6v2M8 8L3 10M8 8l5 2"/></svg>;
}
function DbIcon() {
  return <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round"><ellipse cx="8" cy="4.5" rx="5" ry="2"/><path d="M3 4.5v7c0 1.1 2.24 2 5 2s5-.9 5-2v-7"/><path d="M3 8c0 1.1 2.24 2 5 2s5-.9 5-2"/></svg>;
}
function CacheIcon() {
  return <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round"><rect x="2" y="3" width="12" height="4" rx="1"/><rect x="2" y="9" width="12" height="4" rx="1"/><path d="M5 5h.01M5 11h.01"/></svg>;
}
function S3Icon() {
  return <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round"><path d="M8 2L14 5v6L8 14 2 11V5L8 2z"/><path d="M8 2v12M2 5l6 3 6-3"/></svg>;
}
function QueueIcon() {
  return <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round"><path d="M2 4h12M2 8h8M2 12h10"/></svg>;
}
function CdnIcon() {
  return <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round"><circle cx="8" cy="8" r="6"/><path d="M8 2c-2 1.5-3 3.5-3 6s1 4.5 3 6"/><path d="M8 2c2 1.5 3 3.5 3 6s-1 4.5-3 6"/><path d="M2 8h12"/></svg>;
}

const PALETTE_SECTIONS: PaletteSection[] = [
  {
    id: "general", label: "General", color: "text-muted-foreground",
    items: [
      { kind: "service",      label: "Service",       icon: <ServiceIcon /> },
      { kind: "loadBalancer", label: "Load balancer", icon: <LBIcon /> },
      { kind: "database",     label: "Database",      icon: <DbIcon /> },
      { kind: "cache",        label: "Cache",         icon: <CacheIcon /> },
      { kind: "s3Bucket",     label: "S3 Bucket",     icon: <S3Icon /> },
      { kind: "messageQueue", label: "Msg queue",     icon: <QueueIcon /> },
      { kind: "cdn",          label: "CDN",           icon: <CdnIcon /> },
      { kind: "apiGateway",   label: "API Gateway",   icon: <ApiGatewayIcon size={16} /> },
    ],
  },
  {
    id: "aws", label: "Amazon Web Services", color: "text-[#FF9900]",
    items: [
      { kind: "awsEc2",        label: "EC2",         icon: <AwsEc2Icon /> },
      { kind: "awsRds",        label: "RDS",         icon: <AwsRdsIcon /> },
      { kind: "awsElastiCache",label: "ElastiCache", icon: <AwsElastiCacheIcon /> },
      { kind: "awsCloudFront", label: "CloudFront",  icon: <AwsCloudFrontIcon /> },
      { kind: "awsLambda",     label: "Lambda",      icon: <AwsLambdaIcon /> },
      { kind: "awsSqs",        label: "SQS",         icon: <AwsSqsIcon /> },
    ],
  },
  {
    id: "gcp", label: "Google Cloud", color: "text-[#4285F4]",
    items: [
      { kind: "gcpCloudRun",     label: "Cloud Run",     icon: <GcpCloudRunIcon /> },
      { kind: "gcpCloudSql",     label: "Cloud SQL",     icon: <GcpCloudSqlIcon /> },
      { kind: "gcpCloudStorage", label: "Cloud Storage", icon: <GcpCloudStorageIcon /> },
      { kind: "gcpPubSub",       label: "Pub/Sub",       icon: <GcpPubSubIcon /> },
      { kind: "gcpCloudCdn",     label: "Cloud CDN",     icon: <GcpCloudCdnIcon /> },
      { kind: "gcpCloudFunction",label: "Cloud Fn",      icon: <GcpCloudFunctionIcon /> },
    ],
  },
  {
    id: "azure", label: "Microsoft Azure", color: "text-[#0078D4]",
    items: [
      { kind: "azureVm",           label: "VM",          icon: <AzureVmIcon /> },
      { kind: "azureSql",          label: "SQL",         icon: <AzureSqlIcon /> },
      { kind: "azureBlobStorage",  label: "Blob Storage",icon: <AzureBlobIcon /> },
      { kind: "azureServiceBus",   label: "Service Bus", icon: <AzureServiceBusIcon /> },
      { kind: "azureCdn",          label: "CDN",         icon: <AzureCdnIcon /> },
      { kind: "azureFunction",     label: "Function",    icon: <AzureFunctionIcon /> },
    ],
  },
];

// ─── Component ─────────────────────────────────────────────────────────

export function NodePalette() {
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());

  const toggleSection = useCallback((id: string) => {
    setCollapsed((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }, []);

  const onDragStart = useCallback((e: React.DragEvent, kind: NodeKind) => {
    e.dataTransfer.setData("application/sysvis-node-kind", kind);
    e.dataTransfer.effectAllowed = "copy";
  }, []);

  return (
    <aside className="w-[220px] shrink-0 border-r border-border bg-background overflow-y-auto flex flex-col">
      {PALETTE_SECTIONS.map((section) => {
        const isCollapsed = collapsed.has(section.id);
        return (
          <div key={section.id}>
            {/* Section header */}
            <button
              onClick={() => toggleSection(section.id)}
              className="w-full flex items-center justify-between px-3 py-2
                         hover:bg-accent/50 transition-colors"
            >
              <span className={`text-[10px] font-semibold uppercase tracking-wider ${section.color}`}>
                {section.label}
              </span>
              <ChevronIcon collapsed={isCollapsed} />
            </button>

            {/* Items */}
            {!isCollapsed && (
              <div className="flex flex-col gap-0.5 px-2 pb-2">
                {section.items.map((item) => (
                  <div
                    key={item.kind}
                    draggable
                    onDragStart={(e) => onDragStart(e, item.kind)}
                    className="flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg
                               hover:bg-accent cursor-grab active:cursor-grabbing
                               transition-colors select-none"
                    role="button"
                    aria-label={`Drag ${item.label} to canvas`}
                  >
                    <span className="shrink-0">{item.icon}</span>
                    <span className="text-xs text-foreground truncate">{item.label}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </aside>
  );
}

function ChevronIcon({ collapsed }: { collapsed: boolean }) {
  return (
    <svg
      width="12" height="12" viewBox="0 0 12 12" fill="none"
      stroke="currentColor" strokeWidth={1.5} strokeLinecap="round"
      className={`text-muted-foreground transition-transform ${collapsed ? "-rotate-90" : ""}`}
    >
      <path d="M2 4l4 4 4-4" />
    </svg>
  );
}