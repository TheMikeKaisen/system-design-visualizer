"use client";

import React, { useSyncExternalStore } from "react";

type IconType =
  | "client"
  | "ingress"
  | "loadbalancer"
  | "server"
  | "cache"
  | "database";

export interface ComputationalNode {
  id: string;
  name: string;
  cx: number;
  cy: number;
  iconType: IconType;
  colorClass: string;
}

interface ConnectionDef {
  id: string;
  d: string;
  strokeClass: string;
  packetClass: string;
  dur: string;
  delay: string;
  delay2: string;
  markerId?: string;
}

interface TierEnclosure {
  id: string;
  name: string;
  x: number;
  y: number;
  width: number;
  height: number;
  strokeClass: string;
  labelClass: string;
}

const BOX = 52;
const BR = 10;

/**
 * Three architectural tier enclosures framing the distributed system:
 * 1. Edge & Ingress (Left Flank, flows DOWN from Client to Load Balancer)
 * 2. Compute Cluster (Lower Right Flank, receives load-balanced dispatches)
 * 3. Persistence Tier (Upper Right Flank, data access flows UPWARD from compute instances)
 */
export const ARCHITECTURAL_TIERS: TierEnclosure[] = [
  {
    id: "tier-edge",
    name: "Edge & Ingress",
    x: 42,
    y: 35,
    width: 130,
    height: 540,
    strokeClass: "stroke-zinc-800/80 dark:stroke-zinc-800/60",
    labelClass: "fill-zinc-400 dark:fill-zinc-500",
  },
  {
    id: "tier-compute",
    name: "Compute Cluster",
    x: 1060,
    y: 330,
    width: 175,
    height: 275,
    strokeClass: "stroke-teal-500/25 dark:stroke-teal-500/20",
    labelClass: "fill-teal-500/80 dark:fill-teal-400/70",
  },
  {
    id: "tier-storage",
    name: "Persistence Tier",
    x: 1060,
    y: 35,
    width: 175,
    height: 275,
    strokeClass: "stroke-amber-500/25 dark:stroke-amber-500/20",
    labelClass: "fill-amber-500/80 dark:fill-amber-400/70",
  },
];

/**
 * Canonical 7-node distributed system topology.
 * Left Flank: Client (top) -> Ingress (mid) -> Load Balancer (bottom)
 * Right Flank: Compute Cluster (bottom) -> Persistence Tier (top)
 */
export const CANONICAL_NODES: ComputationalNode[] = [
  {
    id: "CLIENT",
    name: "Client",
    cx: 106,
    cy: 110,
    iconType: "client",
    colorClass: "text-sky-400 dark:text-sky-300",
  },
  {
    id: "INGRESS",
    name: "Ingress",
    cx: 106,
    cy: 275,
    iconType: "ingress",
    colorClass: "text-teal-400 dark:text-teal-300",
  },
  {
    id: "LOAD_BALANCER",
    name: "Load Balancer",
    cx: 106,
    cy: 440,
    iconType: "loadbalancer",
    colorClass: "text-blue-400 dark:text-blue-300",
  },
  {
    id: "APP_SERVICE_A",
    name: "App Service A",
    cx: 1148,
    cy: 405,
    iconType: "server",
    colorClass: "text-teal-400 dark:text-teal-300",
  },
  {
    id: "APP_SERVICE_B",
    name: "App Service B",
    cx: 1148,
    cy: 525,
    iconType: "server",
    colorClass: "text-teal-400 dark:text-teal-300",
  },
  {
    id: "APP_CACHE",
    name: "Application Cache",
    cx: 1148,
    cy: 235,
    iconType: "cache",
    colorClass: "text-sky-400 dark:text-sky-300",
  },
  {
    id: "DATABASE",
    name: "Database",
    cx: 1148,
    cy: 110,
    iconType: "database",
    colorClass: "text-amber-400 dark:text-amber-300",
  },
];

/**
 * Circuit Bus Connections:
 * Flow sequence:
 * 1. Client (top left) -> flows DOWN -> Ingress (mid left)
 * 2. Ingress (mid left) -> flows DOWN -> Load Balancer (bottom left)
 * 3. Load Balancer (bottom left) -> lower basin bus -> App Service A & B (bottom right)
 * 4. App Services -> data access flow UPWARD -> Cache (RAM) & Database (Disk)
 */
const CONNECTIONS: ConnectionDef[] = [
  {
    id: "conn-c01",
    // 1. Client (106, 110) -> flows DOWN -> Ingress (106, 275)
    d: "M106,136 L106,245",
    strokeClass: "stroke-teal-500/35 dark:stroke-teal-400/25",
    packetClass: "fill-teal-400 dark:fill-teal-300",
    dur: "2.4s",
    delay: "0.0s",
    delay2: "1.2s",
    markerId: "hcg-arrow-teal",
  },
  {
    id: "conn-c02",
    // 2. Ingress (106, 275) -> flows DOWN -> Load Balancer (106, 440)
    d: "M106,301 L106,410",
    strokeClass: "stroke-teal-500/35 dark:stroke-teal-400/25",
    packetClass: "fill-teal-400 dark:fill-teal-300",
    dur: "2.4s",
    delay: "0.5s",
    delay2: "1.7s",
    markerId: "hcg-arrow-teal",
  },
  {
    id: "conn-c03",
    // 3. Load Balancer (106, 440) -> Lower Basin Bus -> App Service A (1148, 405)
    d: "M132,436 C320,560 900,560 1118,405",
    strokeClass: "stroke-cyan-500/35 dark:stroke-cyan-400/25",
    packetClass: "fill-cyan-400 dark:fill-cyan-300",
    dur: "3.6s",
    delay: "1.0s",
    delay2: "2.8s",
    markerId: "hcg-arrow-cyan",
  },
  {
    id: "conn-c04",
    // 4. Load Balancer (106, 440) -> Parallel Basin Bus -> App Service B (1148, 525)
    d: "M132,444 C340,580 940,580 1118,525",
    strokeClass: "stroke-cyan-500/35 dark:stroke-cyan-400/25",
    packetClass: "fill-cyan-400 dark:fill-cyan-300",
    dur: "3.6s",
    delay: "1.8s",
    delay2: "3.6s",
    markerId: "hcg-arrow-cyan",
  },
  {
    id: "conn-c05",
    // 5. App Service A (1148, 405) -> flows UP -> Application Cache (1148, 235) (cache lookup)
    d: "M1148,379 L1148,265",
    strokeClass: "stroke-teal-500/35 dark:stroke-teal-400/25",
    packetClass: "fill-teal-400 dark:fill-teal-300",
    dur: "2.2s",
    delay: "1.6s",
    delay2: "2.7s",
    markerId: "hcg-arrow-teal",
  },
  {
    id: "conn-c06",
    // 6. App Service B (1148, 525) -> flows UP -> Application Cache (1148, 235) (cache lookup)
    d: "M1122,510 C1090,440 1090,320 1135,265",
    strokeClass: "stroke-teal-500/35 dark:stroke-teal-400/25",
    packetClass: "fill-teal-400 dark:fill-teal-300",
    dur: "2.4s",
    delay: "2.4s",
    delay2: "3.5s",
    markerId: "hcg-arrow-teal",
  },
  {
    id: "conn-c07",
    // 7. App Service A (1148, 405) -> flows UP -> Database (1148, 110) (amber persistence query)
    d: "M1174,395 C1210,310 1210,180 1178,135",
    strokeClass: "stroke-amber-400/35 dark:stroke-amber-300/25",
    packetClass: "fill-amber-400 dark:fill-amber-300",
    dur: "3.0s",
    delay: "2.2s",
    delay2: "3.7s",
    markerId: "hcg-arrow-amber",
  },
  {
    id: "conn-c08",
    // 8. App Service B (1148, 525) -> flows UP -> Database (1148, 110) (amber persistence query)
    d: "M1174,515 C1225,410 1225,200 1165,138",
    strokeClass: "stroke-amber-400/35 dark:stroke-amber-300/25",
    packetClass: "fill-amber-400 dark:fill-amber-300",
    dur: "2.8s",
    delay: "3.0s",
    delay2: "4.3s",
    markerId: "hcg-arrow-amber",
  },
];

const AMBIENT = [
  { id: "a01", cx: 60, cy: 360, r: 2.0, op: 0.25 },
  { id: "a02", cx: 160, cy: 180, r: 1.5, op: 0.2 },
  { id: "a03", cx: 190, cy: 520, r: 2.5, op: 0.18 },
  { id: "a04", cx: 640, cy: 48, r: 1.5, op: 0.22 },
  { id: "a05", cx: 580, cy: 590, r: 2.0, op: 0.2 },
  { id: "a06", cx: 720, cy: 580, r: 1.5, op: 0.16 },
  { id: "a07", cx: 1040, cy: 190, r: 1.8, op: 0.18 },
  { id: "a08", cx: 1220, cy: 340, r: 2.0, op: 0.2 },
  { id: "a09", cx: 1040, cy: 500, r: 1.5, op: 0.15 },
  { id: "a10", cx: 1240, cy: 120, r: 2.0, op: 0.18 },
];

function IconClient() {
  return (
    <>
      <circle cx="0" cy="-7" r="5.5" fill="currentColor" />
      <path d="M-9,12 C-9,-1.5 9,-1.5 9,12 Z" fill="currentColor" />
    </>
  );
}

function IconIngress() {
  return (
    <g fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
      <circle cx="0" cy="0" r="3.5" fill="currentColor" stroke="none" />
      <line x1="-11" y1="0" x2="-5" y2="0" />
      <line x1="5" y1="0" x2="11" y2="0" />
      <line x1="-5.5" y1="-9.5" x2="-2" y2="-3.5" />
      <line x1="2" y1="3.5" x2="5.5" y2="9.5" />
      <line x1="5.5" y1="-9.5" x2="2" y2="-3.5" />
      <line x1="-2" y1="3.5" x2="-5.5" y2="9.5" />
    </g>
  );
}

function IconLoadBalancer() {
  return (
    <>
      <rect x="-12" y="-1.5" width="24" height="3" rx="1.5" fill="currentColor" />
      <circle cx="-11" cy="-7" r="4.5" fill="currentColor" opacity={0.9} />
      <circle cx="11" cy="-7" r="4.5" fill="currentColor" opacity={0.7} />
      <rect x="-1.5" y="-1.5" width="3" height="13" rx="1.5" fill="currentColor" opacity={0.75} />
      <path d="M-6,11 L0,4.5 L6,11 Z" fill="currentColor" opacity={0.6} />
    </>
  );
}

function IconServer() {
  return (
    <>
      <rect x="-11" y="-12" width="22" height="7" rx="2" fill="currentColor" opacity={0.9} />
      <rect x="-11" y="-2" width="22" height="7" rx="2" fill="currentColor" opacity={0.75} />
      <rect x="-11" y="8" width="22" height="7" rx="2" fill="currentColor" opacity={0.6} />
      <circle cx="7" cy="-8.5" r="1.8" fill="white" fillOpacity={0.5} />
      <circle cx="7" cy="1.5" r="1.8" fill="white" fillOpacity={0.5} />
      <circle cx="7" cy="11.5" r="1.8" fill="white" fillOpacity={0.5} />
    </>
  );
}

function IconCache() {
  return (
    <>
      <rect x="-10" y="-9" width="20" height="18" rx="3" fill="currentColor" opacity={0.7} />
      <line x1="-10" y1="-1" x2="10" y2="-1" stroke="white" strokeWidth="0.8" strokeOpacity={0.25} />
    </>
  );
}

function IconDatabase() {
  return (
    <>
      <rect x="-10" y="-10" width="20" height="22" rx="4" fill="currentColor" opacity={0.65} />
      <line x1="-10" y1="-3" x2="10" y2="-3" stroke="white" strokeWidth="0.8" strokeOpacity={0.25} />
      <line x1="-10" y1="4" x2="10" y2="4" stroke="white" strokeWidth="0.8" strokeOpacity={0.25} />
    </>
  );
}

function NodeIcon({ type }: { type: IconType }) {
  switch (type) {
    case "client":
      return <IconClient />;
    case "ingress":
      return <IconIngress />;
    case "loadbalancer":
      return <IconLoadBalancer />;
    case "server":
      return <IconServer />;
    case "cache":
      return <IconCache />;
    case "database":
      return <IconDatabase />;
  }
}

function subscribeReducedMotion(cb: () => void) {
  if (typeof window === "undefined" || !window.matchMedia) return () => {};
  const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
  mq.addEventListener?.("change", cb);
  return () => mq.removeEventListener?.("change", cb);
}

function getReducedMotionSnapshot() {
  if (typeof window === "undefined" || !window.matchMedia) return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function getReducedMotionServerSnapshot() {
  return false;
}

const MOBILE_BOX = 36;
const MOBILE_BR = 8;

interface MobileConnectionDef {
  id: string;
  d: string;
  strokeClass: string;
  packetClass: string;
  dur: string;
  delay: string;
  delay2: string;
  markerId?: string;
}

const MOBILE_NODE_COORDS: Record<string, { cx: number; cy: number }> = {
  CLIENT: { cx: 62, cy: 46 },
  INGRESS: { cx: 195, cy: 46 },
  LOAD_BALANCER: { cx: 328, cy: 46 },
  APP_SERVICE_A: { cx: 62, cy: 585 },
  APP_SERVICE_B: { cx: 152, cy: 585 },
  APP_CACHE: { cx: 242, cy: 585 },
  DATABASE: { cx: 328, cy: 585 },
};

const MOBILE_CONNECTIONS: MobileConnectionDef[] = [
  {
    id: "m-conn-01",
    // Client (62, 46) -> Ingress (195, 46)
    d: "M82,46 L175,46",
    strokeClass: "stroke-teal-500/40 dark:stroke-teal-400/30",
    packetClass: "fill-teal-400 dark:fill-teal-300",
    dur: "2.0s",
    delay: "0.0s",
    delay2: "1.0s",
    markerId: "hcg-arrow-teal-m",
  },
  {
    id: "m-conn-02",
    // Ingress (195, 46) -> Load Balancer (328, 46)
    d: "M215,46 L308,46",
    strokeClass: "stroke-teal-500/40 dark:stroke-teal-400/30",
    packetClass: "fill-teal-400 dark:fill-teal-300",
    dur: "2.0s",
    delay: "0.5s",
    delay2: "1.5s",
    markerId: "hcg-arrow-teal-m",
  },
  {
    id: "m-conn-03",
    // Load Balancer (328, 46) -> curves down right margin to App Services
    d: "M336,66 C378,130 378,490 172,575",
    strokeClass: "stroke-cyan-500/35 dark:stroke-cyan-400/25",
    packetClass: "fill-cyan-400 dark:fill-cyan-300",
    dur: "3.2s",
    delay: "1.0s",
    delay2: "2.6s",
  },
  {
    id: "m-conn-04",
    // Client (62, 46) -> traces down left margin to App Service A
    d: "M54,66 C14,130 14,490 54,565",
    strokeClass: "stroke-sky-500/30 dark:stroke-sky-400/20",
    packetClass: "fill-sky-400 dark:fill-sky-300",
    dur: "3.2s",
    delay: "0.8s",
    delay2: "2.4s",
  },
  {
    id: "m-conn-05",
    // App Service B (152, 585) -> Cache (242, 585)
    d: "M172,585 L222,585",
    strokeClass: "stroke-teal-500/40 dark:stroke-teal-400/30",
    packetClass: "fill-teal-400 dark:fill-teal-300",
    dur: "1.8s",
    delay: "1.5s",
    delay2: "2.4s",
    markerId: "hcg-arrow-teal-m",
  },
  {
    id: "m-conn-06",
    // App Service B (152, 585) -> Database (328, 585) amber query
    d: "M160,567 C200,535 285,535 316,570",
    strokeClass: "stroke-amber-400/40 dark:stroke-amber-300/30",
    packetClass: "fill-amber-400 dark:fill-amber-300",
    dur: "2.4s",
    delay: "2.0s",
    delay2: "3.2s",
    markerId: "hcg-arrow-amber-m",
  },
];

export function HeroComputationalGraph() {
  const prefersReducedMotion = useSyncExternalStore(
    subscribeReducedMotion,
    getReducedMotionSnapshot,
    getReducedMotionServerSnapshot
  );

  return (
    <div
      className="absolute inset-0 pointer-events-none select-none overflow-hidden z-0 flex items-center justify-center"
      aria-hidden="true"
    >
      {/* ── Desktop Architecture Stage (hidden on mobile, centered max-w-7xl) ── */}
      <div className="hidden md:block w-full max-w-7xl h-full relative">
        <svg
          viewBox="0 0 1280 640"
          className="w-full h-full"
          preserveAspectRatio="xMidYMid meet"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <filter id="hcg-node-glow" x="-60%" y="-60%" width="220%" height="220%">
              <feGaussianBlur stdDeviation="5" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
            <filter id="hcg-packet-glow" x="-150%" y="-150%" width="400%" height="400%">
              <feGaussianBlur stdDeviation="2.5" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>

            {/* Directional arrow markers showing request and data routing */}
            <marker
              id="hcg-arrow-teal"
              viewBox="0 0 8 8"
              refX="6"
              refY="4"
              markerWidth="5"
              markerHeight="5"
              orient="auto"
            >
              <path
                d="M1,1 L7,4 L1,7"
                fill="none"
                stroke="#2dd4bf"
                strokeWidth="1.6"
                strokeLinecap="round"
                strokeLinejoin="round"
                opacity="0.75"
              />
            </marker>

            <marker
              id="hcg-arrow-cyan"
              viewBox="0 0 8 8"
              refX="6"
              refY="4"
              markerWidth="5"
              markerHeight="5"
              orient="auto"
            >
              <path
                d="M1,1 L7,4 L1,7"
                fill="none"
                stroke="#22d3ee"
                strokeWidth="1.6"
                strokeLinecap="round"
                strokeLinejoin="round"
                opacity="0.75"
              />
            </marker>

            <marker
              id="hcg-arrow-amber"
              viewBox="0 0 8 8"
              refX="6"
              refY="4"
              markerWidth="5"
              markerHeight="5"
              orient="auto"
            >
              <path
                d="M1,1 L7,4 L1,7"
                fill="none"
                stroke="#fbbf24"
                strokeWidth="1.6"
                strokeLinecap="round"
                strokeLinejoin="round"
                opacity="0.75"
              />
            </marker>
          </defs>

          {/* Ambient Particles */}
          {AMBIENT.map((p) => (
            <circle
              key={p.id}
              cx={p.cx}
              cy={p.cy}
              r={p.r}
              className="fill-cyan-400 dark:fill-cyan-300"
              opacity={p.op}
            />
          ))}

          {/* Cloud Architecture Tier Enclosures */}
          {ARCHITECTURAL_TIERS.map((tier) => (
            <g key={tier.id}>
              <rect
                x={tier.x}
                y={tier.y}
                width={tier.width}
                height={tier.height}
                rx={14}
                fill="none"
                className={tier.strokeClass}
                strokeWidth="1"
                strokeDasharray="4 4"
              />
              <text
                x={tier.x + 12}
                y={tier.y + 18}
                className={`${tier.labelClass} hidden lg:inline`}
                fontSize="9"
                fontFamily="ui-monospace, SFMono-Regular, Menlo, monospace"
                fontWeight="600"
                letterSpacing="0.08em"
              >
                {tier.name.toUpperCase()}
              </text>
            </g>
          ))}

          {/* Connections & Animated Packets */}
          {CONNECTIONS.map((c) => (
            <g key={c.id}>
              <path
                id={c.id}
                d={c.d}
                fill="none"
                className={c.strokeClass}
                strokeWidth="1.2"
                markerEnd={c.markerId ? `url(#${c.markerId})` : undefined}
              />
              {!prefersReducedMotion && (
                <>
                  <circle
                    r="3"
                    className={c.packetClass}
                    filter="url(#hcg-packet-glow)"
                  >
                    <animateMotion dur={c.dur} begin={c.delay} repeatCount="indefinite">
                      <mpath href={`#${c.id}`} />
                    </animateMotion>
                  </circle>
                  <circle r="1.8" className={c.packetClass} opacity={0.45}>
                    <animateMotion dur={c.dur} begin={c.delay2} repeatCount="indefinite">
                      <mpath href={`#${c.id}`} />
                    </animateMotion>
                  </circle>
                </>
              )}
            </g>
          ))}

          {/* Canonical 7 Node Cards */}
          {CANONICAL_NODES.map((node) => (
            <g
              key={node.id}
              transform={`translate(${node.cx}, ${node.cy})`}
              className={`${node.colorClass} transition-opacity duration-300`}
              data-node-id={node.id}
            >
              <rect
                x={-BOX / 2 - 4}
                y={-BOX / 2 - 4}
                width={BOX + 8}
                height={BOX + 8}
                rx={BR + 3}
                fill="none"
                stroke="currentColor"
                strokeWidth="1"
                opacity={0.18}
                filter="url(#hcg-node-glow)"
              />
              <rect
                x={-BOX / 2}
                y={-BOX / 2}
                width={BOX}
                height={BOX}
                rx={BR}
                className="fill-white dark:fill-zinc-950"
                stroke="currentColor"
                strokeWidth="0.8"
                strokeOpacity={0.35}
              />
              <NodeIcon type={node.iconType} />
              <text
                y={BOX / 2 + 16}
                textAnchor="middle"
                className="fill-zinc-500 dark:fill-zinc-400 hidden lg:inline"
                fontSize="11"
                fontFamily="Inter, system-ui, sans-serif"
                fontWeight="500"
              >
                {node.name}
              </text>
            </g>
          ))}
        </svg>
      </div>

      {/* ── Mobile-Optimized Architecture Stage (portrait layout: 390x680) ── */}
      <div className="block md:hidden w-full h-full relative">
        <svg
          viewBox="0 0 390 680"
          className="w-full h-full"
          preserveAspectRatio="xMidYMid meet"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <filter id="hcg-node-glow-m" x="-60%" y="-60%" width="220%" height="220%">
              <feGaussianBlur stdDeviation="3.5" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
            <filter id="hcg-packet-glow-m" x="-150%" y="-150%" width="400%" height="400%">
              <feGaussianBlur stdDeviation="2" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
            <marker
              id="hcg-arrow-teal-m"
              viewBox="0 0 8 8"
              refX="6"
              refY="4"
              markerWidth="4"
              markerHeight="4"
              orient="auto"
            >
              <path
                d="M1,1 L7,4 L1,7"
                fill="none"
                stroke="#2dd4bf"
                strokeWidth="1.6"
                strokeLinecap="round"
                strokeLinejoin="round"
                opacity="0.8"
              />
            </marker>
            <marker
              id="hcg-arrow-amber-m"
              viewBox="0 0 8 8"
              refX="6"
              refY="4"
              markerWidth="4"
              markerHeight="4"
              orient="auto"
            >
              <path
                d="M1,1 L7,4 L1,7"
                fill="none"
                stroke="#fbbf24"
                strokeWidth="1.6"
                strokeLinecap="round"
                strokeLinejoin="round"
                opacity="0.8"
              />
            </marker>
          </defs>

          {/* Mobile Ambient Dust */}
          <circle cx={40} cy={160} r={1.5} className="fill-cyan-400 dark:fill-cyan-300" opacity={0.2} />
          <circle cx={350} cy={200} r={1.8} className="fill-cyan-400 dark:fill-cyan-300" opacity={0.18} />
          <circle cx={30} cy={450} r={1.5} className="fill-teal-400 dark:fill-teal-300" opacity={0.2} />
          <circle cx={360} cy={430} r={1.8} className="fill-amber-400 dark:fill-amber-300" opacity={0.16} />

          {/* Mobile Connections & Data Packets */}
          {MOBILE_CONNECTIONS.map((c) => (
            <g key={c.id}>
              <path
                id={c.id}
                d={c.d}
                fill="none"
                className={c.strokeClass}
                strokeWidth="1.2"
                markerEnd={c.markerId ? `url(#${c.markerId})` : undefined}
              />
              {!prefersReducedMotion && (
                <>
                  <circle
                    r="2.5"
                    className={c.packetClass}
                    filter="url(#hcg-packet-glow-m)"
                  >
                    <animateMotion dur={c.dur} begin={c.delay} repeatCount="indefinite">
                      <mpath href={`#${c.id}`} />
                    </animateMotion>
                  </circle>
                  <circle r="1.5" className={c.packetClass} opacity={0.4}>
                    <animateMotion dur={c.dur} begin={c.delay2} repeatCount="indefinite">
                      <mpath href={`#${c.id}`} />
                    </animateMotion>
                  </circle>
                </>
              )}
            </g>
          ))}

          {/* Mobile Canonical 7 Node Badges */}
          {CANONICAL_NODES.map((node) => {
            const coords = MOBILE_NODE_COORDS[node.id];
            if (!coords) return null;
            return (
              <g
                key={`m-${node.id}`}
                transform={`translate(${coords.cx}, ${coords.cy})`}
                className={`${node.colorClass} transition-opacity duration-300`}
                data-mobile-node-id={node.id}
              >
                <title>{node.name}</title>
                <rect
                  x={-MOBILE_BOX / 2 - 3}
                  y={-MOBILE_BOX / 2 - 3}
                  width={MOBILE_BOX + 6}
                  height={MOBILE_BOX + 6}
                  rx={MOBILE_BR + 2}
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1"
                  opacity={0.2}
                  filter="url(#hcg-node-glow-m)"
                />
                <rect
                  x={-MOBILE_BOX / 2}
                  y={-MOBILE_BOX / 2}
                  width={MOBILE_BOX}
                  height={MOBILE_BOX}
                  rx={MOBILE_BR}
                  className="fill-white dark:fill-zinc-950"
                  stroke="currentColor"
                  strokeWidth="0.8"
                  strokeOpacity={0.35}
                />
                <g transform="scale(0.85)">
                  <NodeIcon type={node.iconType} />
                </g>
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
}
