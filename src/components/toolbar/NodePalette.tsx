"use client";

import { useCallback } from "react";
import type { NodeKind } from "@/types";

interface PaletteItem {
  kind: NodeKind;
  label: string;
  description: string;
  icon: React.ReactNode;
  color: string;
}

const PALETTE_ITEMS: PaletteItem[] = [
  {
    kind: "service",
    label: "Service",
    description: "Generic microservice",
    icon: <ServiceIcon />,
    color: "text-blue-500",
  },
  {
    kind: "loadBalancer",
    label: "Load balancer",
    description: "Distributes traffic",
    icon: <LoadBalancerIcon />,
    color: "text-purple-500",
  },
  {
    kind: "database",
    label: "Database",
    description: "Persistent storage",
    icon: <DatabaseIcon />,
    color: "text-teal-600",
  },
  {
    kind: "cache",
    label: "Cache",
    description: "In-memory store",
    icon: <CacheIcon />,
    color: "text-amber-500",
  },
  {
    kind: "s3Bucket",
    label: "S3 Bucket",
    description: "Object storage",
    icon: <S3Icon />,
    color: "text-orange-500",
  },
  {
    kind: "messageQueue",
    label: "Message queue",
    description: "Async messaging",
    icon: <QueueIcon />,
    color: "text-pink-500",
  },
  {
    kind: "apiGateway",
    label: "API gateway",
    description: "Request routing",
    icon: <GatewayIcon />,
    color: "text-indigo-500",
  },
  {
    kind: "cdn",
    label: "CDN",
    description: "Edge distribution",
    icon: <CdnIcon />,
    color: "text-green-600",
  },
];

export function NodePalette() {
  const onDragStart = useCallback(
    (e: React.DragEvent, kind: NodeKind) => {
      /**
       * React Flow reads this on drop to know which node type to create.
       * The drop handler in CanvasRoot uses screenToFlowPosition to convert
       * the drop coordinates to world-space before calling NodeFactory.createNode().
       */
      e.dataTransfer.setData("application/sysvis-node-kind", kind);
      e.dataTransfer.effectAllowed = "copy";
    },
    []
  );

  return (
    <aside className="w-[220px] shrink-0 border-r border-border bg-background
                      overflow-y-auto flex flex-col">
      <div className="px-3 pt-3 pb-2">
        <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
          Components
        </p>
      </div>

      <div className="flex flex-col gap-0.5 px-2 pb-4">
        {PALETTE_ITEMS.map((item) => (
          <div
            key={item.kind}
            draggable
            onDragStart={(e) => onDragStart(e, item.kind)}
            className="flex items-center gap-2.5 px-2.5 py-2 rounded-lg
                       hover:bg-accent cursor-grab active:cursor-grabbing
                       transition-colors group select-none"
            role="button"
            aria-label={`Drag ${item.label} onto canvas`}
          >
            <span className={`${item.color} shrink-0`}>{item.icon}</span>
            <div className="min-w-0">
              <p className="text-xs font-medium text-foreground truncate">
                {item.label}
              </p>
              <p className="text-[10px] text-muted-foreground truncate">
                {item.description}
              </p>
            </div>
          </div>
        ))}
      </div>
    </aside>
  );
}

// ─── Icons (inline SVG — no external dep) ─────────────────────────────────

function ServiceIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round">
      <rect x="2" y="2" width="12" height="12" rx="2.5" />
      <path d="M8 5v6M5 8h6" />
    </svg>
  );
}
function LoadBalancerIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round">
      <circle cx="8" cy="4" r="2" />
      <circle cx="3" cy="12" r="2" />
      <circle cx="13" cy="12" r="2" />
      <path d="M8 6v2M8 8L3 10M8 8l5 2" />
    </svg>
  );
}
function DatabaseIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round">
      <ellipse cx="8" cy="4.5" rx="5" ry="2" />
      <path d="M3 4.5v7c0 1.1 2.24 2 5 2s5-.9 5-2v-7" />
      <path d="M3 8c0 1.1 2.24 2 5 2s5-.9 5-2" />
    </svg>
  );
}
function CacheIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round">
      <rect x="2" y="3" width="12" height="4" rx="1" />
      <rect x="2" y="9" width="12" height="4" rx="1" />
      <path d="M5 5h.01M5 11h.01" />
    </svg>
  );
}
function S3Icon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round">
      <path d="M8 2L14 5v6L8 14 2 11V5L8 2z" />
      <path d="M8 2v12M2 5l6 3 6-3" />
    </svg>
  );
}
function QueueIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round">
      <path d="M2 4h12M2 8h8M2 12h10" />
    </svg>
  );
}
function GatewayIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round">
      <rect x="1" y="5" width="6" height="6" rx="1.5" />
      <rect x="9" y="5" width="6" height="6" rx="1.5" />
      <path d="M7 8h2" />
    </svg>
  );
}
function CdnIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round">
      <circle cx="8" cy="8" r="6" />
      <path d="M8 2c-2 1.5-3 3.5-3 6s1 4.5 3 6" />
      <path d="M8 2c2 1.5 3 3.5 3 6s-1 4.5-3 6" />
      <path d="M2 8h12" />
    </svg>
  );
}