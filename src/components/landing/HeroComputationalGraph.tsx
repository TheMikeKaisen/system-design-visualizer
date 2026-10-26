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

const BOX = 52;
const BR = 10;

/**
 * Canonical 7-node distributed system topology.
 * Positioned in a perimeter-flanking architecture (left edge & right backend tiers),
 * strictly avoiding the central text corridor (x: 200–1080, y: 120–480) for 100% headline legibility.
 */
export const CANONICAL_NODES: ComputationalNode[] = [
  {
    id: "CLIENT",
    name: "Client",
    cx: 80,
    cy: 90,
    iconType: "client",
    colorClass: "text-sky-400 dark:text-sky-300",
  },
  {
    id: "INGRESS",
    name: "Ingress",
    cx: 100,
    cy: 260,
    iconType: "ingress",
    colorClass: "text-teal-400 dark:text-teal-300",
  },
  {
    id: "LOAD_BALANCER",
    name: "Load Balancer",
    cx: 120,
    cy: 430,
    iconType: "loadbalancer",
    colorClass: "text-blue-400 dark:text-blue-300",
  },
  {
    id: "APP_SERVICE_A",
    name: "App Service A",
    cx: 1150,
    cy: 90,
    iconType: "server",
    colorClass: "text-teal-400 dark:text-teal-300",
  },
  {
    id: "APP_SERVICE_B",
    name: "App Service B",
    cx: 1180,
    cy: 230,
    iconType: "server",
    colorClass: "text-teal-400 dark:text-teal-300",
  },
  {
    id: "APP_CACHE",
    name: "Application Cache",
    cx: 1120,
    cy: 380,
    iconType: "cache",
    colorClass: "text-sky-400 dark:text-sky-300",
  },
  {
    id: "DATABASE",
    name: "Database",
    cx: 1180,
    cy: 520,
    iconType: "database",
    colorClass: "text-amber-400 dark:text-amber-300",
  },
];

/**
 * Architecturally accurate distributed system connections:
 * 1. Client -> Ingress (incoming request)
 * 2. Ingress -> Load Balancer (internal traffic forwarding)
 * 3. Load Balancer -> App Service A (dispatch to instance A)
 * 4. Load Balancer -> App Service B (dispatch to instance B)
 * 5. App Service A -> Application Cache (cache lookup / read)
 * 6. App Service B -> Application Cache (cache lookup / read)
 * 7. App Service A -> Database (query on cache miss / persistence, amber)
 * 8. App Service B -> Database (query on cache miss / persistence, amber)
 *
 * Notice:
 * - App Service A and B are parallel instances (NO sequential pipe between A and B).
 * - Cache does NOT directly query the Database (application services coordinate data access).
 * - Directional arrow markers indicate exact request and data flow directions.
 */
const CONNECTIONS: ConnectionDef[] = [
  {
    id: "conn-c01",
    // 1. Client (80, 90) -> Ingress (100, 260)
    d: "M80,116 C80,170 100,190 100,230",
    strokeClass: "stroke-teal-500/35 dark:stroke-teal-400/25",
    packetClass: "fill-teal-400 dark:fill-teal-300",
    dur: "2.5s",
    delay: "0.0s",
    delay2: "1.2s",
    markerId: "hcg-arrow-teal",
  },
  {
    id: "conn-c02",
    // 2. Ingress (100, 260) -> Load Balancer (120, 430)
    d: "M100,286 C100,340 120,360 120,400",
    strokeClass: "stroke-teal-500/35 dark:stroke-teal-400/25",
    packetClass: "fill-teal-400 dark:fill-teal-300",
    dur: "2.5s",
    delay: "0.6s",
    delay2: "1.8s",
    markerId: "hcg-arrow-teal",
  },
  {
    id: "conn-c03",
    // 3. Load Balancer (120, 430) -> High canopy arc -> App Service A (1150, 90)
    d: "M120,404 C160,70 880,18 1120,90",
    strokeClass: "stroke-cyan-500/35 dark:stroke-cyan-400/25",
    packetClass: "fill-cyan-400 dark:fill-cyan-300",
    dur: "3.8s",
    delay: "1.2s",
    delay2: "3.1s",
    markerId: "hcg-arrow-cyan",
  },
  {
    id: "conn-c04",
    // 4. Load Balancer (120, 430) -> Basin perimeter arc -> App Service B (1180, 230)
    d: "M146,430 C340,580 960,560 1154,235",
    strokeClass: "stroke-cyan-500/35 dark:stroke-cyan-400/25",
    packetClass: "fill-cyan-400 dark:fill-cyan-300",
    dur: "3.8s",
    delay: "2.2s",
    delay2: "4.1s",
    markerId: "hcg-arrow-cyan",
  },
  {
    id: "conn-c05",
    // 5. App Service A (1150, 90) -> Application Cache (1120, 380) (cache lookup)
    d: "M1150,116 C1150,200 1120,270 1120,350",
    strokeClass: "stroke-teal-500/35 dark:stroke-teal-400/25",
    packetClass: "fill-teal-400 dark:fill-teal-300",
    dur: "2.4s",
    delay: "1.8s",
    delay2: "3.0s",
    markerId: "hcg-arrow-teal",
  },
  {
    id: "conn-c06",
    // 6. App Service B (1180, 230) -> Application Cache (1120, 380) (cache lookup)
    d: "M1154,240 C1130,270 1125,310 1125,350",
    strokeClass: "stroke-teal-500/35 dark:stroke-teal-400/25",
    packetClass: "fill-teal-400 dark:fill-teal-300",
    dur: "2.4s",
    delay: "2.8s",
    delay2: "4.0s",
    markerId: "hcg-arrow-teal",
  },
  {
    id: "conn-c07",
    // 7. App Service A (1150, 90) -> Database (1180, 520) (query on cache miss / persistence)
    d: "M1166,116 C1220,240 1210,400 1180,490",
    strokeClass: "stroke-amber-400/35 dark:stroke-amber-300/25",
    packetClass: "fill-amber-400 dark:fill-amber-300",
    dur: "3.2s",
    delay: "2.6s",
    delay2: "4.2s",
    markerId: "hcg-arrow-amber",
  },
  {
    id: "conn-c08",
    // 8. App Service B (1180, 230) -> Database (1180, 520) (query on cache miss / persistence)
    d: "M1180,256 C1180,330 1180,420 1180,490",
    strokeClass: "stroke-amber-400/35 dark:stroke-amber-300/25",
    packetClass: "fill-amber-400 dark:fill-amber-300",
    dur: "2.6s",
    delay: "3.4s",
    delay2: "4.8s",
    markerId: "hcg-arrow-amber",
  },
];

const AMBIENT = [
  { id: "a01", cx: 60, cy: 360, r: 2.0, op: 0.25 },
  { id: "a02", cx: 160, cy: 180, r: 1.5, op: 0.2 },
  { id: "a03", cx: 190, cy: 520, r: 2.5, op: 0.18 },
  { id: "a04", cx: 640, cy: 45, r: 1.5, op: 0.22 },
  { id: "a05", cx: 580, cy: 590, r: 2.0, op: 0.2 },
  { id: "a06", cx: 720, cy: 580, r: 1.5, op: 0.16 },
  { id: "a07", cx: 1100, cy: 190, r: 1.8, op: 0.18 },
  { id: "a08", cx: 1220, cy: 340, r: 2.0, op: 0.2 },
  { id: "a09", cx: 1060, cy: 500, r: 1.5, op: 0.15 },
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

export function HeroComputationalGraph() {
  const prefersReducedMotion = useSyncExternalStore(
    subscribeReducedMotion,
    getReducedMotionSnapshot,
    getReducedMotionServerSnapshot
  );

  return (
    <div
      className="absolute inset-0 pointer-events-none select-none overflow-hidden z-0"
      aria-hidden="true"
    >
      <svg
        viewBox="0 0 1280 640"
        className="w-full h-full"
        preserveAspectRatio="xMidYMid slice"
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

        {CANONICAL_NODES.map((node) => (
          <g
            key={node.id}
            transform={`translate(${node.cx}, ${node.cy})`}
            className={`${node.colorClass} transition-opacity duration-300 hidden md:inline`}
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
  );
}
