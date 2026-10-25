"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import {
  Globe,
  Network,
  Server,
  Zap,
  Database,
  Layers,
  Play,
  ArrowRight,
  Activity,
  Sparkles,
  ExternalLink,
} from "lucide-react";

/* ═══════════════════════════════════════════════════════════════
   AUTHENTIC SYSTEM DESIGN CANVAS PREVIEW
   Renders genuine system design architectures with ReactFlow-styled
   nodes, SVG orthogonal interconnects, live packet transit telemetry,
   and workbench chrome matching /canvas.
   ═══════════════════════════════════════════════════════════════ */

interface CanvasNode {
  id: string;
  label: string;
  sublabel: string;
  kind: string;
  role: string;
  icon: React.ComponentType<{ className?: string }>;
  accentColor: string;
  accentBg: string;
  accentBorder: string;
  accentText: string;
  stats: Record<string, string>;
  config: Record<string, string>;
  tier: "ingress" | "compute" | "data";
  middleware?: Array<{ label: string; color: string; bg: string }>;
}

interface ArchitectureTemplate {
  id: string;
  name: string;
  description: string;
  endpoint: string;
  protocol: string;
  nodes: CanvasNode[];
}

const TEMPLATES: ArchitectureTemplate[] = [
  {
    id: "ecommerce",
    name: "E-Commerce Order Processing",
    description: "Production checkout cluster with API Gateway rate limiting, cache absorption, and transactional write-ahead logging.",
    endpoint: "POST /api/v1/checkout/orders",
    protocol: "HTTP/3 + gRPC",
    nodes: [
      {
        id: "client",
        label: "Web Client",
        sublabel: "React / Mobile",
        kind: "client",
        role: "User-facing edge originating HTTP/3 requests",
        icon: Globe,
        accentColor: "#38bdf8",
        accentBg: "bg-sky-500/10",
        accentBorder: "border-sky-500/30",
        accentText: "text-sky-400",
        stats: { Protocol: "HTTP/3", Requests: "Active", Region: "Global Edge" },
        config: { "Active Conn": "42 conn", "Max Concurrent": "500", "Timeout": "3000ms" },
        tier: "ingress",
      },
      {
        id: "lb",
        label: "Load Balancer",
        sublabel: "Envoy / NGINX",
        kind: "loadBalancer",
        role: "SSL termination, health checks & round-robin routing",
        icon: Network,
        accentColor: "#a855f7",
        accentBg: "bg-purple-500/10",
        accentBorder: "border-purple-500/30",
        accentText: "text-purple-400",
        stats: { Algorithm: "Round Robin", Health: "100%", TLS: "v1.3 TLS" },
        config: { "Target Nodes": "3 pods", "Health Interval": "5s", "Failover": "Automatic" },
        tier: "ingress",
        middleware: [
          { label: "Rate Limit: 500/s", color: "#ED7100", bg: "#ED710015" },
          { label: "Circuit Breaker [CLOSED]", color: "#10b981", bg: "#10b98115" },
        ],
      },
      {
        id: "service",
        label: "Order Service",
        sublabel: "Node / Go Container",
        kind: "service",
        role: "Stateless microservice container handling order transactions",
        icon: Server,
        accentColor: "#f59e0b",
        accentBg: "bg-amber-500/10",
        accentBorder: "border-amber-500/30",
        accentText: "text-amber-400",
        stats: { Replicas: "3 pods", CPU: "18%", p99: "12ms" },
        config: { "Replicas": "3 Pods", "Memory": "512MB / pod", "Max Queue": "1,000" },
        tier: "compute",
      },
      {
        id: "queue",
        label: "Kafka Event Stream",
        sublabel: "OrderCreated Topic",
        kind: "messageQueue",
        role: "Asynchronous log partition decoupling order processing",
        icon: Layers,
        accentColor: "#06b6d4",
        accentBg: "bg-cyan-500/10",
        accentBorder: "border-cyan-500/30",
        accentText: "text-cyan-400",
        stats: { Partitions: "4", Lag: "0 msgs", Retention: "7 days" },
        config: { "Topic": "orders.v1", "Replication Factor": "3", "Retention": "168h" },
        tier: "compute",
      },
      {
        id: "cache",
        label: "Redis Cache",
        sublabel: "In-Memory Store",
        kind: "cache",
        role: "Sub-millisecond read layer absorbing high-frequency queries",
        icon: Zap,
        accentColor: "#ef4444",
        accentBg: "bg-rose-500/10",
        accentBorder: "border-rose-500/30",
        accentText: "text-rose-400",
        stats: { HitRatio: "94.2%", Latency: "0.8ms", Keys: "12.4k" },
        config: { "Eviction Policy": "allkeys-lru", "Max Memory": "4 GB", "Persistence": "AOF + RDB" },
        tier: "data",
      },
      {
        id: "db",
        label: "PostgreSQL Primary",
        sublabel: "ACID Relational",
        kind: "database",
        role: "ACID transactional database with write-ahead replication",
        icon: Database,
        accentColor: "#10b981",
        accentBg: "bg-emerald-500/10",
        accentBorder: "border-emerald-500/30",
        accentText: "text-emerald-400",
        stats: { Mode: "ACID Primary", Conn: "24/100", Storage: "Encrypted" },
        config: { "Engine": "PostgreSQL 16", "Replication": "Sync Read Replica", "WAL Buffer": "16MB" },
        tier: "data",
      },
    ],
  },
  {
    id: "url-shortener",
    name: "High-Scale URL Shortener",
    description: "Distributed key-value redirection service with LRU edge cache absorbing 95% of redirect queries.",
    endpoint: "GET /{shortCode} -> 302 Redirect",
    protocol: "HTTP/3 + Redis LRU",
    nodes: [
      {
        id: "client",
        label: "Web Client",
        sublabel: "Global Mobile & Browser",
        kind: "client",
        role: "User-facing edge originating HTTP/3 requests",
        icon: Globe,
        accentColor: "#38bdf8",
        accentBg: "bg-sky-500/10",
        accentBorder: "border-sky-500/30",
        accentText: "text-sky-400",
        stats: { Protocol: "HTTP/3", Requests: "Active", Region: "Global Edge" },
        config: { "Active Conn": "98 conn", "Max Concurrent": "1,000", "Timeout": "2000ms" },
        tier: "ingress",
      },
      {
        id: "lb",
        label: "Load Balancer",
        sublabel: "CloudFront / Gateway",
        kind: "loadBalancer",
        role: "SSL termination, health checks & round-robin routing",
        icon: Network,
        accentColor: "#a855f7",
        accentBg: "bg-purple-500/10",
        accentBorder: "border-purple-500/30",
        accentText: "text-purple-400",
        stats: { Algorithm: "Round Robin", Health: "100%", TLS: "v1.3 TLS" },
        config: { "Edge POPs": "240+", "Cache TTL": "86400s", "DDoS Shield": "Enabled" },
        tier: "ingress",
        middleware: [
          { label: "IP Rate Limit", color: "#ED7100", bg: "#ED710015" },
          { label: "Edge Shield", color: "#38bdf8", bg: "#38bdf815" },
        ],
      },
      {
        id: "service",
        label: "Order Service",
        sublabel: "Hash & Redirect Engine",
        kind: "service",
        role: "Stateless microservice container handling order transactions",
        icon: Server,
        accentColor: "#f59e0b",
        accentBg: "bg-amber-500/10",
        accentBorder: "border-amber-500/30",
        accentText: "text-amber-400",
        stats: { Replicas: "3 pods", CPU: "18%", p99: "12ms" },
        config: { "Hash Algo": "Base62 Murmur3", "Collision Check": "Bloom Filter", "Replicas": "4 pods" },
        tier: "compute",
      },
      {
        id: "queue",
        label: "Kafka Event Stream",
        sublabel: "Click Analytics Stream",
        kind: "messageQueue",
        role: "Asynchronous log partition decoupling order processing",
        icon: Layers,
        accentColor: "#06b6d4",
        accentBg: "bg-cyan-500/10",
        accentBorder: "border-cyan-500/30",
        accentText: "text-cyan-400",
        stats: { Partitions: "4", Lag: "0 msgs", Retention: "7 days" },
        config: { "Topic": "clicks.analytics", "Throughput": "12k msgs/s", "Buffer": "1GB" },
        tier: "compute",
      },
      {
        id: "cache",
        label: "Redis Cache",
        sublabel: "Hot Key LRU Cache",
        kind: "cache",
        role: "Sub-millisecond read layer absorbing high-frequency queries",
        icon: Zap,
        accentColor: "#ef4444",
        accentBg: "bg-rose-500/10",
        accentBorder: "border-rose-500/30",
        accentText: "text-rose-400",
        stats: { HitRatio: "94.2%", Latency: "0.8ms", Keys: "12.4k" },
        config: { "Top URLs Cached": "500,000", "Hit Rate": "97.4%", "Sync": "Redis Sentinel" },
        tier: "data",
      },
      {
        id: "db",
        label: "PostgreSQL Primary",
        sublabel: "Distributed Key-Value DB",
        kind: "database",
        role: "ACID transactional database with write-ahead replication",
        icon: Database,
        accentColor: "#10b981",
        accentBg: "bg-emerald-500/10",
        accentBorder: "border-emerald-500/30",
        accentText: "text-emerald-400",
        stats: { Mode: "ACID Primary", Conn: "24/100", Storage: "Encrypted" },
        config: { "Data Size": "1.2 TB", "Index": "B-Tree on short_url", "IOPS": "3,000" },
        tier: "data",
      },
    ],
  },
];

type PacketPhase = "idle" | "client-to-lb" | "lb-to-service" | "service-to-cache" | "service-to-db" | "complete";

export function MiniDistributedCanvas() {
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>("ecommerce");
  const [activePacketPhase, setActivePacketPhase] = useState<PacketPhase>("idle");
  const [isTrafficSimulating, setIsTrafficSimulating] = useState(false);
  const [selectedNodeId, setSelectedNodeId] = useState<string>("service");
  const [requestCount, setRequestCount] = useState(148);
  const [lastLatency, setLastLatency] = useState(19);

  const animationTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const currentTemplate = TEMPLATES.find((t) => t.id === selectedTemplateId) ?? TEMPLATES[0];
  const nodes = currentTemplate.nodes;
  const selectedNode = nodes.find((n) => n.id === selectedNodeId) ?? nodes[2];

  // Trigger one discrete simulated request cycle through the architecture
  const sendRequest = useCallback(() => {
    if (activePacketPhase !== "idle" && activePacketPhase !== "complete") return;

    setActivePacketPhase("client-to-lb");
    setRequestCount((prev) => prev + 1);

    animationTimeoutRef.current = setTimeout(() => {
      setActivePacketPhase("lb-to-service");

      animationTimeoutRef.current = setTimeout(() => {
        setActivePacketPhase("service-to-cache");

        animationTimeoutRef.current = setTimeout(() => {
          setActivePacketPhase("service-to-db");

          animationTimeoutRef.current = setTimeout(() => {
            setActivePacketPhase("complete");
            setLastLatency(Math.floor(16 + Math.random() * 8));

            animationTimeoutRef.current = setTimeout(() => {
              setActivePacketPhase("idle");
            }, 1200);
          }, 600);
        }, 600);
      }, 600);
    }, 600);
  }, [activePacketPhase]);

  // Continuous traffic simulation loop
  useEffect(() => {
    if (!isTrafficSimulating) return;

    const interval = setInterval(() => {
      sendRequest();
    }, 3800);

    return () => clearInterval(interval);
  }, [isTrafficSimulating, sendRequest]);

  // Cleanup timers on unmount
  useEffect(() => {
    return () => {
      if (animationTimeoutRef.current) clearTimeout(animationTimeoutRef.current);
    };
  }, []);

  // Filter nodes by computational tier
  const ingressNodes = nodes.filter((n) => n.tier === "ingress");
  const computeNodes = nodes.filter((n) => n.tier === "compute");
  const dataNodes = nodes.filter((n) => n.tier === "data");

  return (
    <div
      className="w-full rounded-2xl bg-[#090a0f] border border-zinc-800/90 shadow-[0_25px_60px_rgba(0,0,0,0.6),inset_0_1px_0_0_rgba(255,255,255,0.06)] overflow-hidden flex flex-col text-zinc-100"
      role="region"
      aria-label="Miniature Distributed Architecture Canvas Preview"
    >
      {/* ── Studio Top Window Chrome ── */}
      <div className="border-b border-zinc-800/80 bg-[#101117] px-4 py-2.5 flex flex-wrap items-center justify-between gap-3 select-none">
        {/* Left: Window Dots & Breadcrumbs */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 mr-2">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500/80" />
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500/80" />
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/80" />
          </div>

          <div className="flex items-center gap-2 text-xs font-mono text-zinc-400">
            <span className="text-zinc-500">canvas/</span>
            <span className="text-zinc-200 font-semibold">{currentTemplate.id}-topology.diag</span>
          </div>

          {/* Template Switcher Tabs */}
          <div className="hidden lg:flex items-center gap-1 ml-3 p-0.5 bg-zinc-900/90 border border-zinc-800/70 rounded-lg">
            {TEMPLATES.map((tmpl) => (
              <button
                key={tmpl.id}
                onClick={() => {
                  setSelectedTemplateId(tmpl.id);
                  setActivePacketPhase("idle");
                }}
                className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-all ${
                  selectedTemplateId === tmpl.id
                    ? "bg-zinc-800 text-zinc-100 shadow-sm font-semibold"
                    : "text-zinc-400 hover:text-zinc-200"
                }`}
              >
                {tmpl.name}
              </button>
            ))}
          </div>
        </div>

        {/* Right Action Controls */}
        <div className="flex items-center gap-2">
          {/* Send Request Button */}
          <button
            onClick={sendRequest}
            disabled={activePacketPhase !== "idle" && activePacketPhase !== "complete"}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-zinc-800 hover:bg-zinc-700 disabled:opacity-50 text-zinc-100 transition-colors shadow-sm active:scale-95"
          >
            <Play className="w-3 h-3 text-amber-400 fill-amber-400/40" />
            <span>Send Request</span>
          </button>

          {/* Simulate Stream Button */}
          <button
            onClick={() => setIsTrafficSimulating((prev) => !prev)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors active:scale-95 ${
              isTrafficSimulating
                ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                : "bg-zinc-800/80 hover:bg-zinc-700 text-zinc-300"
            }`}
          >
            <Activity className="w-3 h-3 text-emerald-400" />
            <span>{isTrafficSimulating ? "Simulating Traffic" : "Simulate Stream"}</span>
          </button>

          {/* Open Studio Link */}
          <Link
            href="/canvas"
            className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-zinc-300 hover:text-white bg-zinc-800/40 hover:bg-zinc-800/70 border border-zinc-700/60 transition-colors"
          >
            <span>Launch Canvas</span>
            <ExternalLink className="w-3 h-3" />
          </Link>
        </div>
      </div>

      {/* ── Studio Canvas Workbench Body ── */}
      <div className="flex flex-col md:flex-row flex-1 min-h-[460px]">
        {/* Left Toolbar Rail (Authentic Component Palette) */}
        <div className="w-full md:w-44 border-b md:border-b-0 md:border-r border-zinc-800/70 bg-[#0c0d12] p-3 flex flex-row md:flex-col justify-between gap-3 text-xs select-none">
          <div className="flex flex-row md:flex-col gap-2 w-full">
            <div className="text-[10px] font-mono uppercase tracking-wider text-zinc-500 hidden md:block px-1">
              Palette
            </div>

            <div className="flex flex-row md:flex-col gap-1 w-full overflow-x-auto pb-1 md:pb-0">
              <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-zinc-900/60 text-zinc-300 text-[11px] border border-zinc-800/60 shrink-0">
                <Globe className="w-3.5 h-3.5 text-sky-400 shrink-0" />
                <span className="truncate">Client Edge</span>
              </div>
              <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-zinc-900/60 text-zinc-300 text-[11px] border border-zinc-800/60 shrink-0">
                <Network className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                <span className="truncate">Load Balancer</span>
              </div>
              <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-zinc-900/60 text-zinc-300 text-[11px] border border-zinc-800/60 shrink-0">
                <Server className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <span className="truncate">Microservice</span>
              </div>
              <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-zinc-900/60 text-zinc-300 text-[11px] border border-zinc-800/60 shrink-0">
                <Zap className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                <span className="truncate">Redis Cache</span>
              </div>
              <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-zinc-900/60 text-zinc-300 text-[11px] border border-zinc-800/60 shrink-0">
                <Database className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span className="truncate">Postgres DB</span>
              </div>
              <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-zinc-900/60 text-zinc-300 text-[11px] border border-zinc-800/60 shrink-0">
                <Layers className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                <span className="truncate">Kafka Broker</span>
              </div>
            </div>
          </div>

          <div className="hidden md:flex flex-col gap-1 text-[10px] text-zinc-500 font-mono p-2 rounded bg-zinc-900/40 border border-zinc-800/50">
            <span className="text-zinc-400 font-semibold flex items-center gap-1">
              <Sparkles className="w-2.5 h-2.5 text-amber-400" /> Canvas Studio
            </span>
            <span>Drag & connect 20+ cloud primitives in full studio.</span>
          </div>
        </div>

        {/* Center Stage: Authentic Flow Diagram Canvas */}
        <div className="flex-1 p-5 sm:p-7 relative select-none flex flex-col justify-between bg-[radial-gradient(#27272a_1.2px,transparent_1.2px)] [background-size:20px_20px] bg-[#090a0f]">
          {/* Top Stage Endpoint Indicator */}
          <div className="flex items-center justify-between gap-3 text-xs font-mono text-zinc-400 mb-4 pb-2 border-b border-zinc-800/50">
            <div className="flex items-center gap-2">
              <span className="text-zinc-500">Dispatch Endpoint:</span>
              <span className="text-zinc-200 font-semibold bg-zinc-900/90 px-2 py-0.5 rounded border border-zinc-800">
                {currentTemplate.endpoint}
              </span>
            </div>
            <div className="hidden sm:flex items-center gap-2">
              <span className="text-zinc-500">Protocol:</span>
              <span className="text-zinc-300 font-semibold">{currentTemplate.protocol}</span>
            </div>
          </div>

          {/* ── Visual Topology Nodes Stage (3-tier layout) ── */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative z-10 py-2">
            {/* Column 1: Ingress Tier */}
            <div className="flex flex-col gap-5">
              <div className="text-[10px] font-mono uppercase tracking-wider text-zinc-500 flex items-center justify-between">
                <span>Tier 1: Edge & Ingress</span>
                <span className="text-sky-400 font-semibold">2 Nodes</span>
              </div>

              {ingressNodes.map((node) => {
                const Icon = node.icon;
                const isSelected = selectedNodeId === node.id;
                return (
                  <button
                    key={node.id}
                    onClick={() => setSelectedNodeId(node.id)}
                    className={`relative p-3.5 rounded-xl border text-left transition-all group backdrop-blur-md ${
                      isSelected
                        ? "border-sky-500/80 bg-sky-500/10 shadow-lg shadow-sky-500/10 ring-2 ring-sky-500/50"
                        : "border-zinc-800/90 bg-[#111218]/90 hover:border-zinc-700 shadow-md"
                    }`}
                  >
                    {/* Top load indicator line */}
                    <div className="absolute top-0 left-0 right-0 h-0.5 rounded-t-xl overflow-hidden bg-zinc-800">
                      <div
                        className="h-full bg-sky-500 transition-all duration-500"
                        style={{ width: isSelected ? "75%" : "30%" }}
                      />
                    </div>

                    {/* Node Header */}
                    <div className="flex items-center gap-2.5 mb-1.5">
                      <div className={`w-8 h-8 rounded-lg ${node.accentBg} ${node.accentText} flex items-center justify-center shrink-0`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <span className="text-xs font-bold text-zinc-100 block truncate">{node.label}</span>
                        <span className="text-[10px] font-mono text-zinc-500 block truncate">{node.sublabel}</span>
                      </div>
                    </div>

                    {/* Middleware tags for Load Balancer */}
                    {node.middleware && (
                      <div className="mt-2 flex flex-wrap gap-1">
                        {node.middleware.map((mw) => (
                          <span
                            key={mw.label}
                            className="text-[9px] font-mono px-1.5 py-0.5 rounded"
                            style={{ color: mw.color, backgroundColor: mw.bg }}
                          >
                            {mw.label}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Step feedback badges */}
                    {node.id === "client" && activePacketPhase === "client-to-lb" && (
                      <div className="mt-2 text-[10px] font-mono text-sky-300 bg-sky-950/80 px-2 py-0.5 rounded border border-sky-500/40 flex items-center gap-1 animate-pulse">
                        <span>DISPATCH: GET /orders</span>
                      </div>
                    )}
                    {node.id === "lb" && activePacketPhase === "lb-to-service" && (
                      <div className="mt-2 text-[10px] font-mono text-purple-300 bg-purple-950/80 px-2 py-0.5 rounded border border-purple-500/40 flex items-center gap-1 animate-pulse">
                        <span>ROUTING: Round-Robin</span>
                      </div>
                    )}

                    {/* Target and Source Handle Dots */}
                    <div className="absolute left-[-4px] top-1/2 -translate-y-1/2 w-2 h-2 rounded-full border-2 border-background bg-sky-400" />
                    <div className="absolute right-[-4px] top-1/2 -translate-y-1/2 w-2 h-2 rounded-full border-2 border-background bg-sky-400" />
                  </button>
                );
              })}
            </div>

            {/* Column 2: Compute Tier */}
            <div className="flex flex-col gap-5">
              <div className="text-[10px] font-mono uppercase tracking-wider text-zinc-500 flex items-center justify-between">
                <span>Tier 2: Compute & Streaming</span>
                <span className="text-amber-400 font-semibold">2 Nodes</span>
              </div>

              {computeNodes.map((node) => {
                const Icon = node.icon;
                const isSelected = selectedNodeId === node.id;
                return (
                  <button
                    key={node.id}
                    onClick={() => setSelectedNodeId(node.id)}
                    className={`relative p-3.5 rounded-xl border text-left transition-all group backdrop-blur-md ${
                      isSelected
                        ? "border-amber-500/80 bg-amber-500/10 shadow-lg shadow-amber-500/10 ring-2 ring-amber-500/50"
                        : "border-zinc-800/90 bg-[#111218]/90 hover:border-zinc-700 shadow-md"
                    }`}
                  >
                    <div className="absolute top-0 left-0 right-0 h-0.5 rounded-t-xl overflow-hidden bg-zinc-800">
                      <div
                        className="h-full bg-amber-500 transition-all duration-500"
                        style={{ width: isSelected ? "85%" : "40%" }}
                      />
                    </div>

                    <div className="flex items-center gap-2.5 mb-1.5">
                      <div className={`w-8 h-8 rounded-lg ${node.accentBg} ${node.accentText} flex items-center justify-center shrink-0`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <span className="text-xs font-bold text-zinc-100 block truncate">{node.label}</span>
                        <span className="text-[10px] font-mono text-zinc-500 block truncate">{node.sublabel}</span>
                      </div>
                    </div>

                    {/* Step feedback badges */}
                    {node.id === "service" &&
                      (activePacketPhase === "service-to-cache" || activePacketPhase === "service-to-db") && (
                        <div className="mt-2 text-[10px] font-mono text-amber-300 bg-amber-950/80 px-2 py-0.5 rounded border border-amber-500/40 flex items-center gap-1 animate-pulse">
                          <span>PROCESSING: Checking Cache & DB</span>
                        </div>
                      )}
                    {node.id === "queue" && activePacketPhase === "complete" && (
                      <div className="mt-2 text-[10px] font-mono text-cyan-300 bg-cyan-950/80 px-2 py-0.5 rounded border border-cyan-500/40 flex items-center gap-1">
                        <span>PUBLISHED: Event Ack</span>
                      </div>
                    )}

                    <div className="absolute left-[-4px] top-1/2 -translate-y-1/2 w-2 h-2 rounded-full border-2 border-background bg-amber-400" />
                    <div className="absolute right-[-4px] top-1/2 -translate-y-1/2 w-2 h-2 rounded-full border-2 border-background bg-amber-400" />
                  </button>
                );
              })}
            </div>

            {/* Column 3: Data Tier */}
            <div className="flex flex-col gap-5">
              <div className="text-[10px] font-mono uppercase tracking-wider text-zinc-500 flex items-center justify-between">
                <span>Tier 3: Persistence & Cache</span>
                <span className="text-emerald-400 font-semibold">2 Nodes</span>
              </div>

              {dataNodes.map((node) => {
                const Icon = node.icon;
                const isSelected = selectedNodeId === node.id;
                return (
                  <button
                    key={node.id}
                    onClick={() => setSelectedNodeId(node.id)}
                    className={`relative p-3.5 rounded-xl border text-left transition-all group backdrop-blur-md ${
                      isSelected
                        ? "border-emerald-500/80 bg-emerald-500/10 shadow-lg shadow-emerald-500/10 ring-2 ring-emerald-500/50"
                        : "border-zinc-800/90 bg-[#111218]/90 hover:border-zinc-700 shadow-md"
                    }`}
                  >
                    <div className="absolute top-0 left-0 right-0 h-0.5 rounded-t-xl overflow-hidden bg-zinc-800">
                      <div
                        className="h-full bg-emerald-500 transition-all duration-500"
                        style={{ width: isSelected ? "90%" : "35%" }}
                      />
                    </div>

                    <div className="flex items-center gap-2.5 mb-1.5">
                      <div className={`w-8 h-8 rounded-lg ${node.accentBg} ${node.accentText} flex items-center justify-center shrink-0`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <span className="text-xs font-bold text-zinc-100 block truncate">{node.label}</span>
                        <span className="text-[10px] font-mono text-zinc-500 block truncate">{node.sublabel}</span>
                      </div>
                    </div>

                    {/* Step feedback badges */}
                    {node.id === "cache" && activePacketPhase === "service-to-cache" && (
                      <div className="mt-2 text-[10px] font-mono text-rose-300 bg-rose-950/80 px-2 py-0.5 rounded border border-rose-500/40 flex items-center gap-1 animate-pulse">
                        <span>CACHE LOOKUP: Key orders:active</span>
                      </div>
                    )}
                    {node.id === "db" && activePacketPhase === "service-to-db" && (
                      <div className="mt-2 text-[10px] font-mono text-emerald-300 bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-500/40 flex items-center gap-1 animate-pulse">
                        <span>SQL: COMMIT TRANSACTION</span>
                      </div>
                    )}

                    <div className="absolute left-[-4px] top-1/2 -translate-y-1/2 w-2 h-2 rounded-full border-2 border-background bg-emerald-400" />
                    <div className="absolute right-[-4px] top-1/2 -translate-y-1/2 w-2 h-2 rounded-full border-2 border-background bg-emerald-400" />
                  </button>
                );
              })}
            </div>
          </div>

          {/* ── Live Node Inspector Drawer / Strip ── */}
          <div className="mt-5 border border-zinc-800/80 rounded-xl bg-zinc-900/90 p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 backdrop-blur-md shadow-inner">
            <div className="flex items-center gap-3">
              <div
                className={`w-10 h-10 rounded-xl ${selectedNode.accentBg} flex items-center justify-center shrink-0`}
                style={{ color: selectedNode.accentColor }}
              >
                <selectedNode.icon className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-zinc-100">{selectedNode.label}</span>
                  <span className="text-[10px] font-mono text-zinc-400">({selectedNode.sublabel})</span>
                  <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-zinc-800 text-zinc-300 uppercase">
                    {selectedNode.kind}
                  </span>
                </div>
                <p className="text-xs text-zinc-400 line-clamp-1">{selectedNode.role}</p>
              </div>
            </div>

            {/* Telemetry Stats */}
            <div className="flex items-center gap-4 text-xs font-mono">
              {Object.entries(selectedNode.stats).map(([k, v]) => (
                <div key={k} className="flex flex-col">
                  <span className="text-[10px] text-zinc-500 uppercase">{k}</span>
                  <span className="text-zinc-200 font-semibold">{v}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── Floating Simulation Stats HUD (Exact match to canvas HUD) ── */}
      <div className="border-t border-zinc-800/80 bg-[#101117] px-4 py-2.5 flex flex-wrap items-center justify-between gap-3 text-xs font-mono">
        {/* Left Telemetry Cluster Stats */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-zinc-400">Cluster Status:</span>
            <span className="text-emerald-400 font-semibold">Healthy</span>
          </div>

          <div className="hidden sm:flex items-center gap-1.5 text-zinc-400">
            <span>Latency:</span>
            <span className="text-zinc-200 font-semibold">{lastLatency}ms</span>
          </div>

          <div className="hidden md:flex items-center gap-1.5 text-zinc-400">
            <span>Throughput:</span>
            <span className="text-zinc-200 font-semibold">{requestCount} req</span>
          </div>

          <div className="hidden lg:flex items-center gap-1.5 text-zinc-400">
            <span>Drop Rate:</span>
            <span className="text-emerald-400 font-semibold">0.0%</span>
          </div>
        </div>

        {/* Right Direct CTA to Full Studio */}
        <div className="flex items-center gap-2 font-sans">
          <span className="hidden sm:inline text-zinc-500 text-xs">
            Interactive canvas preview:
          </span>
          <Link
            href="/canvas"
            className="flex items-center gap-1.5 text-xs font-semibold text-primary hover:text-primary/90 transition-colors group"
          >
            <span>Build a System in Canvas Studio</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
          </Link>
        </div>
      </div>
    </div>
  );
}
