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
  CheckCircle2,
  Activity,
} from "lucide-react";

interface CanvasNode {
  id: string;
  label: string;
  sublabel: string;
  role: string;
  icon: React.ComponentType<{ className?: string }>;
  accentColor: string;
  accentBg: string;
  accentBorder: string;
  stats: Record<string, string>;
}

const NODES: CanvasNode[] = [
  {
    id: "client",
    label: "Client App",
    sublabel: "React / Mobile",
    role: "User-facing edge originating HTTP/3 requests",
    icon: Globe,
    accentColor: "#38bdf8",
    accentBg: "bg-sky-500/10",
    accentBorder: "border-sky-500/30",
    stats: { Protocol: "HTTP/3", Requests: "Active", Region: "Global Edge" },
  },
  {
    id: "lb",
    label: "Load Balancer",
    sublabel: "NGINX / Envoy",
    role: "SSL termination, health checks & round-robin routing",
    icon: Network,
    accentColor: "#a855f7",
    accentBg: "bg-purple-500/10",
    accentBorder: "border-purple-500/30",
    stats: { Algorithm: "Round Robin", Health: "100%", TLS: "v1.3 TLS" },
  },
  {
    id: "service",
    label: "API Service",
    sublabel: "Order Engine",
    role: "Stateless microservice container handling order transactions",
    icon: Server,
    accentColor: "#f59e0b",
    accentBg: "bg-amber-500/10",
    accentBorder: "border-amber-500/30",
    stats: { Replicas: "3 pods", CPU: "18%", p99: "12ms" },
  },
  {
    id: "cache",
    label: "Redis Cache",
    sublabel: "In-Memory Store",
    role: "Sub-millisecond read layer absorbing high-frequency queries",
    icon: Zap,
    accentColor: "#ef4444",
    accentBg: "bg-rose-500/10",
    accentBorder: "border-rose-500/30",
    stats: { HitRatio: "94.2%", Latency: "0.8ms", Keys: "12.4k" },
  },
  {
    id: "queue",
    label: "Event Queue",
    sublabel: "Kafka Stream",
    role: "Asynchronous log partition decoupling order processing",
    icon: Layers,
    accentColor: "#06b6d4",
    accentBg: "bg-cyan-500/10",
    accentBorder: "border-cyan-500/30",
    stats: { Partitions: "4", Lag: "0 msgs", Retention: "7 days" },
  },
  {
    id: "db",
    label: "PostgreSQL",
    sublabel: "Primary Cluster",
    role: "ACID transactional database with write-ahead replication",
    icon: Database,
    accentColor: "#10b981",
    accentBg: "bg-emerald-500/10",
    accentBorder: "border-emerald-500/30",
    stats: { Mode: "ACID Primary", Conn: "24/100", Storage: "Encrypted" },
  },
];

type PacketPhase = "idle" | "client-to-lb" | "lb-to-service" | "service-to-cache" | "service-to-db" | "complete";

export function MiniDistributedCanvas() {
  const [activePacketPhase, setActivePacketPhase] = useState<PacketPhase>("idle");
  const [isTrafficSimulating, setIsTrafficSimulating] = useState(false);
  const [selectedNodeId, setSelectedNodeId] = useState<string>("service");
  const [requestCount, setRequestCount] = useState(148);
  const [lastLatency, setLastLatency] = useState(19);

  const animationTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Trigger one discrete simulated request cycle
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

  const selectedNode = NODES.find((n) => n.id === selectedNodeId) ?? NODES[2];

  return (
    <div
      className="w-full rounded-2xl bg-[#0d0e12] border border-zinc-800 shadow-2xl overflow-hidden flex flex-col text-zinc-100"
      role="region"
      aria-label="Miniature Distributed Architecture Canvas Preview"
    >
      {/* ── Top Control & Telemetry Bar ── */}
      <div className="border-b border-zinc-800/80 bg-[#121318] px-4 py-3 flex flex-wrap items-center justify-between gap-3">
        {/* Left Telemetry HUD */}
        <div className="flex items-center gap-4 text-xs font-mono">
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
        </div>

        {/* Right Action Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={sendRequest}
            disabled={activePacketPhase !== "idle" && activePacketPhase !== "complete"}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-zinc-800 hover:bg-zinc-700 disabled:opacity-50 text-zinc-100 transition-colors shadow-sm"
          >
            <Play className="w-3 h-3 text-amber-400" />
            <span>Send Request</span>
          </button>

          <button
            onClick={() => setIsTrafficSimulating((prev) => !prev)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              isTrafficSimulating
                ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                : "bg-zinc-800/80 hover:bg-zinc-700 text-zinc-300"
            }`}
          >
            <Activity className="w-3 h-3 text-emerald-400" />
            <span>{isTrafficSimulating ? "Simulating Traffic" : "Simulate Stream"}</span>
          </button>
        </div>
      </div>

      {/* ── Main Canvas Stage: Visual Distributed Topology ── */}
      <div className="p-5 sm:p-7 relative min-h-[380px] flex flex-col justify-between select-none bg-[radial-gradient(#27272a_1px,transparent_1px)] [background-size:20px_20px] bg-opacity-30">
        {/* Topology Nodes Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative z-10">
          {/* Column 1: Edge & Ingress */}
          <div className="flex flex-col gap-4">
            <div className="text-[10px] font-mono uppercase tracking-wider text-zinc-500 mb-1 flex items-center gap-1.5">
              <span>Ingress Tier</span>
            </div>

            {/* Client Node */}
            <button
              onClick={() => setSelectedNodeId("client")}
              className={`p-3.5 rounded-xl border text-left transition-all ${
                selectedNodeId === "client"
                  ? "border-sky-500/70 bg-sky-500/10 shadow-lg shadow-sky-500/5"
                  : "border-zinc-800 bg-zinc-900/80 hover:border-zinc-700"
              }`}
            >
              <div className="flex items-center gap-2.5 mb-1.5">
                <div className="w-7 h-7 rounded-lg bg-sky-500/20 text-sky-400 flex items-center justify-center">
                  <Globe className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-xs font-bold text-zinc-200 block">Web Client</span>
                  <span className="text-[10px] font-mono text-zinc-500">HTTP/3 Edge</span>
                </div>
              </div>
              {activePacketPhase === "client-to-lb" && (
                <div className="mt-2 text-[10px] font-mono text-sky-300 bg-sky-950/80 px-2 py-0.5 rounded border border-sky-500/30 flex items-center gap-1 animate-pulse">
                  <span>DISPATCH: GET /orders</span>
                </div>
              )}
            </button>

            {/* Load Balancer Node */}
            <button
              onClick={() => setSelectedNodeId("lb")}
              className={`p-3.5 rounded-xl border text-left transition-all ${
                selectedNodeId === "lb"
                  ? "border-purple-500/70 bg-purple-500/10 shadow-lg shadow-purple-500/5"
                  : "border-zinc-800 bg-zinc-900/80 hover:border-zinc-700"
              }`}
            >
              <div className="flex items-center gap-2.5 mb-1.5">
                <div className="w-7 h-7 rounded-lg bg-purple-500/20 text-purple-400 flex items-center justify-center">
                  <Network className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-xs font-bold text-zinc-200 block">Load Balancer</span>
                  <span className="text-[10px] font-mono text-zinc-500">Envoy / NGINX</span>
                </div>
              </div>
              {activePacketPhase === "lb-to-service" && (
                <div className="mt-2 text-[10px] font-mono text-purple-300 bg-purple-950/80 px-2 py-0.5 rounded border border-purple-500/30 flex items-center gap-1 animate-pulse">
                  <span>ROUTING: Round-Robin</span>
                </div>
              )}
            </button>
          </div>

          {/* Column 2: Application Services */}
          <div className="flex flex-col gap-4">
            <div className="text-[10px] font-mono uppercase tracking-wider text-zinc-500 mb-1 flex items-center gap-1.5">
              <span>Compute Tier</span>
            </div>

            {/* API Service Node */}
            <button
              onClick={() => setSelectedNodeId("service")}
              className={`p-3.5 rounded-xl border text-left transition-all ${
                selectedNodeId === "service"
                  ? "border-amber-500/70 bg-amber-500/10 shadow-lg shadow-amber-500/5"
                  : "border-zinc-800 bg-zinc-900/80 hover:border-zinc-700"
              }`}
            >
              <div className="flex items-center gap-2.5 mb-1.5">
                <div className="w-7 h-7 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center">
                  <Server className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-xs font-bold text-zinc-200 block">Order Service</span>
                  <span className="text-[10px] font-mono text-zinc-500">Node / Go Container</span>
                </div>
              </div>
              {(activePacketPhase === "service-to-cache" || activePacketPhase === "service-to-db") && (
                <div className="mt-2 text-[10px] font-mono text-amber-300 bg-amber-950/80 px-2 py-0.5 rounded border border-amber-500/30 flex items-center gap-1 animate-pulse">
                  <span>PROCESSING: Checking Cache & DB</span>
                </div>
              )}
            </button>

            {/* Kafka Stream Node */}
            <button
              onClick={() => setSelectedNodeId("queue")}
              className={`p-3.5 rounded-xl border text-left transition-all ${
                selectedNodeId === "queue"
                  ? "border-cyan-500/70 bg-cyan-500/10 shadow-lg shadow-cyan-500/5"
                  : "border-zinc-800 bg-zinc-900/80 hover:border-zinc-700"
              }`}
            >
              <div className="flex items-center gap-2.5 mb-1.5">
                <div className="w-7 h-7 rounded-lg bg-cyan-500/20 text-cyan-400 flex items-center justify-center">
                  <Layers className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-xs font-bold text-zinc-200 block">Kafka Event Stream</span>
                  <span className="text-[10px] font-mono text-zinc-500">OrderCreated Topic</span>
                </div>
              </div>
              {activePacketPhase === "complete" && (
                <div className="mt-2 text-[10px] font-mono text-cyan-300 bg-cyan-950/80 px-2 py-0.5 rounded border border-cyan-500/30 flex items-center gap-1">
                  <span>PUBLISHED: Event Ack</span>
                </div>
              )}
            </button>
          </div>

          {/* Column 3: Persistence & Cache Tier */}
          <div className="flex flex-col gap-4">
            <div className="text-[10px] font-mono uppercase tracking-wider text-zinc-500 mb-1 flex items-center gap-1.5">
              <span>Data Tier</span>
            </div>

            {/* Redis Cache Node */}
            <button
              onClick={() => setSelectedNodeId("cache")}
              className={`p-3.5 rounded-xl border text-left transition-all ${
                selectedNodeId === "cache"
                  ? "border-rose-500/70 bg-rose-500/10 shadow-lg shadow-rose-500/5"
                  : "border-zinc-800 bg-zinc-900/80 hover:border-zinc-700"
              }`}
            >
              <div className="flex items-center gap-2.5 mb-1.5">
                <div className="w-7 h-7 rounded-lg bg-rose-500/20 text-rose-400 flex items-center justify-center">
                  <Zap className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-xs font-bold text-zinc-200 block">Redis Cache</span>
                  <span className="text-[10px] font-mono text-zinc-500">Cluster 0.8ms</span>
                </div>
              </div>
              {activePacketPhase === "service-to-cache" && (
                <div className="mt-2 text-[10px] font-mono text-rose-300 bg-rose-950/80 px-2 py-0.5 rounded border border-rose-500/30 flex items-center gap-1 animate-pulse">
                  <span>CACHE LOOKUP: Key orders:active</span>
                </div>
              )}
            </button>

            {/* PostgreSQL DB Node */}
            <button
              onClick={() => setSelectedNodeId("db")}
              className={`p-3.5 rounded-xl border text-left transition-all ${
                selectedNodeId === "db"
                  ? "border-emerald-500/70 bg-emerald-500/10 shadow-lg shadow-emerald-500/5"
                  : "border-zinc-800 bg-zinc-900/80 hover:border-zinc-700"
              }`}
            >
              <div className="flex items-center gap-2.5 mb-1.5">
                <div className="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                  <Database className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-xs font-bold text-zinc-200 block">PostgreSQL Primary</span>
                  <span className="text-[10px] font-mono text-zinc-500">ACID Relational</span>
                </div>
              </div>
              {activePacketPhase === "service-to-db" && (
                <div className="mt-2 text-[10px] font-mono text-emerald-300 bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-500/30 flex items-center gap-1 animate-pulse">
                  <span>SQL: COMMIT TRANSACTION</span>
                </div>
              )}
            </button>
          </div>
        </div>

        {/* ── Active Node Inspector Strip ── */}
        <div className="mt-6 border border-zinc-800/80 rounded-xl bg-zinc-900/90 p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className={`w-9 h-9 rounded-lg ${selectedNode.accentBg} flex items-center justify-center`} style={{ color: selectedNode.accentColor }}>
              <selectedNode.icon className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-zinc-200">{selectedNode.label}</span>
                <span className="text-[10px] font-mono text-zinc-500">({selectedNode.sublabel})</span>
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

      {/* ── Bottom Banner Link to Full Canvas ── */}
      <div className="border-t border-zinc-800/80 bg-[#121318] px-4 py-3 flex flex-wrap items-center justify-between gap-3 text-xs">
        <span className="text-zinc-400 flex items-center gap-2">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
          <span>Interactive preview: drag, wire, and simulate complete topologies in Canvas Studio.</span>
        </span>

        <Link
          href="/canvas"
          className="flex items-center gap-1.5 font-semibold text-primary hover:text-primary/90 transition-colors group"
        >
          <span>Build a System in Canvas Studio</span>
          <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
        </Link>
      </div>
    </div>
  );
}
