"use client";

import { useCallback, useState, useMemo } from "react";
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
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

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

  const filteredSections = useMemo(() => {
    if (!searchQuery.trim()) return PALETTE_SECTIONS;
    const q = searchQuery.toLowerCase();
    return PALETTE_SECTIONS.map(s => ({
      ...s,
      items: s.items.filter(i => i.label.toLowerCase().includes(q) || i.kind.toLowerCase().includes(q))
    })).filter(s => s.items.length > 0);
  }, [searchQuery]);

  if (sidebarCollapsed) {
    return (
      <aside className="w-14 shrink-0 border-r border-border bg-background flex flex-col items-center py-4 relative z-10 shadow-sm">
        <button
          onClick={() => setSidebarCollapsed(false)}
          className="p-2 hover:bg-accent rounded-xl text-muted-foreground hover:text-foreground transition-colors shadow-sm border border-transparent hover:border-border bg-muted/10"
          title="Expand components"
        >
          <PanelLeftOpenIcon />
        </button>
      </aside>
    );
  }

  return (
    <aside className="w-[260px] shrink-0 border-r border-border bg-background flex flex-col relative overflow-hidden z-10 shadow-[2px_0_12px_rgba(0,0,0,0.02)]">
      {/* Header & Search */}
      <div className="flex flex-col gap-3 p-4 border-b border-border/60 shrink-0 bg-muted/20">
        <div className="flex items-center justify-between">
          <span className="text-sm font-semibold tracking-tight text-foreground">Components</span>
          <button
            onClick={() => setSidebarCollapsed(true)}
            className="p-1.5 hover:bg-accent rounded-lg text-muted-foreground hover:text-foreground transition-colors"
            title="Collapse palette"
          >
            <PanelLeftCloseIcon />
          </button>
        </div>
        <div className="relative group">
          <SearchIcon className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground group-focus-within:text-primary transition-colors" />
          <input
            type="text"
            placeholder="Search components..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 text-xs bg-background/50 border border-border/80 rounded-md
                       focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary focus:bg-background
                       transition-all placeholder:text-muted-foreground/60 shadow-sm"
          />
        </div>
      </div>
      
      <div className="overflow-y-auto flex-1 pb-4 bg-muted/5 custom-scrollbar">
        {filteredSections.length === 0 ? (
           <div className="flex flex-col items-center justify-center p-8 gap-2 text-center mt-4">
             <div className="w-10 h-10 rounded-full bg-muted/50 border border-border flex items-center justify-center text-muted-foreground mb-2">
               <SearchIcon />
             </div>
             <p className="text-xs font-medium text-foreground">No matches found</p>
             <p className="text-[10px] text-muted-foreground">Try a different search term</p>
           </div>
        ) : (
          filteredSections.map((section) => {
            const isCollapsed = collapsed.has(section.id);
            return (
              <div key={section.id} className="mt-2">
                {/* Section header */}
                <button
                  onClick={() => toggleSection(section.id)}
                  className="w-full flex items-center justify-between px-5 py-2.5
                             hover:bg-accent/40 transition-colors group"
                >
                  <span className={`text-[10px] font-bold uppercase tracking-widest ${section.color}`}>
                    {section.label}
                  </span>
                  <ChevronIcon collapsed={isCollapsed} />
                </button>

                {/* Items Grid */}
                <div className={`grid grid-cols-2 gap-2.5 px-4 pb-3 pt-1 overflow-hidden transition-all duration-300 origin-top
                                ${isCollapsed ? "h-0 opacity-0 pb-0 pt-0 scale-y-95 pointer-events-none" : "opacity-100 scale-y-100"}`}>
                  {section.items.map((item) => (
                    <div
                      key={item.kind}
                      draggable
                      onDragStart={(e) => onDragStart(e, item.kind)}
                      className="flex flex-col items-center justify-center gap-2 p-3 rounded-xl
                                 border border-border/40 bg-background/60 shadow-sm
                                 hover:bg-accent/80 hover:border-border/80 hover:shadow-md
                                 cursor-grab active:cursor-grabbing transition-all duration-200 select-none group/item"
                      role="button"
                      aria-label={`Drag ${item.label} to canvas`}
                    >
                      <div className={`p-2.5 rounded-[10px] bg-background shadow-sm border border-border/30
                                      group-hover/item:scale-110 group-active/item:scale-95 transition-transform duration-200 ${section.color}`}>
                        {item.icon}
                      </div>
                      <span className="text-[10px] font-medium text-muted-foreground group-hover/item:text-foreground text-center line-clamp-1 w-full px-1">
                        {item.label}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })
        )}
      </div>
    </aside>
  );
}

function ChevronIcon({ collapsed }: { collapsed: boolean }) {
  return (
    <svg
      width="12" height="12" viewBox="0 0 12 12" fill="none"
      stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"
      className={`text-muted-foreground/60 group-hover:text-foreground transition-transform duration-200 ${collapsed ? "-rotate-90" : "rotate-0"}`}
    >
      <path d="M3 4l3 3 3-3" />
    </svg>
  );
}

function SearchIcon({ className }: { className?: string }) {
  return (
    <svg className={className} width="16" height="16" viewBox="0 0 24 24" fill="none"
         stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8" />
      <path d="m21 21-4.3-4.3" />
    </svg>
  );
}

function PanelLeftCloseIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
         stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect width="18" height="18" x="3" y="3" rx="2" ry="2" />
      <path d="M9 3v18M15 15l-3-3 3-3" />
    </svg>
  );
}

function PanelLeftOpenIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
         stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect width="18" height="18" x="3" y="3" rx="2" ry="2" />
      <path d="M9 3v18M14 9l3 3-3 3" />
    </svg>
  );
}