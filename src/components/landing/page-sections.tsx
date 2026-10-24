"use client";

import React, { useEffect, useRef } from "react";
import Link from "next/link";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Logo } from "@/components/ui/Logo";
import { HeroRuntimeSandbox } from "./HeroRuntimeSandbox";
import {
  Terminal,
  Cpu,
  Database,
  Layers,
  Server,
  ArrowRight,
  ExternalLink,
  ShieldCheck,
  Zap,
  Activity,
  Play,
} from "lucide-react";
import "./landing.css";

/* ═══════════════════════════════════════════════════════════════
   Scroll-reveal hook (Intersection Observer)
   ═══════════════════════════════════════════════════════════════ */
function useScrollReveal() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReducedMotion) {
      container.querySelectorAll(".landing-reveal").forEach((el) => {
        el.classList.add("visible");
      });
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("visible");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -40px 0px" }
    );

    container.querySelectorAll(".landing-reveal").forEach((el) => {
      observer.observe(el);
    });

    return () => observer.disconnect();
  }, []);

  return containerRef;
}

/* ═══════════════════════════════════════════════════════════════
   Landing Page Root
   ═══════════════════════════════════════════════════════════════ */
export function LandingPage() {
  const containerRef = useScrollReveal();

  return (
    <div ref={containerRef} className="min-h-screen bg-background text-foreground overflow-x-hidden selection:bg-amber-500/20 selection:text-amber-300">
      <Nav />
      <main>
        <HeroSection />
        <DisciplinesSection />
        <SimulationEngineSection />
        <CanvasStudioSection />
        <MetricsQuoteSection />
        <FinalCTASection />
      </main>
      <Footer />
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   1. Navigation
   ═══════════════════════════════════════════════════════════════ */
function Nav() {
  return (
    <nav
      className="fixed top-0 left-0 right-0 z-50 border-b border-border/40 bg-background/80 backdrop-blur-xl transition-all"
      aria-label="Main navigation"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 h-16 flex items-center justify-between">
        {/* Brand */}
        <Link href="/" className="flex items-center gap-2.5 group" aria-label="System Simulator home">
          <Logo size={28} />
          <span className="text-base font-semibold tracking-tight text-foreground group-hover:text-primary transition-colors">
            System Simulator
          </span>
        </Link>

        {/* Center Nav Links */}
        <div className="hidden md:flex items-center gap-6 text-xs font-medium text-muted-foreground">
          <a href="#disciplines" className="hover:text-foreground transition-colors">
            Disciplines
          </a>
          <a href="#how-it-works" className="hover:text-foreground transition-colors">
            Simulation Mechanics
          </a>
          <a href="#canvas-studio" className="hover:text-foreground transition-colors">
            Canvas Studio
          </a>
          <Link href="/learning-paths" className="hover:text-foreground transition-colors flex items-center gap-1.5">
            <span>33 Episodes</span>
            <span className="px-1.5 py-0.5 rounded-full bg-amber-500/10 text-amber-500 dark:text-amber-400 text-[10px] font-semibold">
              All Tracks
            </span>
          </Link>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-3">
          <ThemeToggle />

          <Link
            href="/learning-paths"
            className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-medium text-foreground border border-border/60 rounded-xl hover:bg-muted/50 transition-colors"
          >
            Learning Paths
          </Link>

          <Link
            href="/canvas"
            className="inline-flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold text-primary-foreground bg-primary rounded-xl hover:opacity-90 shadow-sm transition-all focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
          >
            <span>Open Canvas</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    </nav>
  );
}

/* ═══════════════════════════════════════════════════════════════
   2. Hero Section
   ═══════════════════════════════════════════════════════════════ */
function HeroSection() {
  return (
    <section className="relative pt-28 sm:pt-36 pb-20 sm:pb-28 overflow-hidden">
      {/* Editorial ambient light */}
      <div
        className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[720px] h-[480px] rounded-full pointer-events-none opacity-40 blur-3xl"
        style={{
          background: "radial-gradient(circle at center, rgba(245, 158, 11, 0.08) 0%, rgba(14, 165, 233, 0.04) 50%, transparent 80%)",
        }}
        aria-hidden="true"
      />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6">
        {/* Header copy */}
        <div className="max-w-3xl mx-auto text-center mb-10 sm:mb-12">
          {/* Kicker badge */}
          <div className="hero-fade-in inline-flex items-center gap-2 px-3 py-1 mb-5 rounded-full border border-border/70 bg-muted/40 text-xs font-medium text-muted-foreground backdrop-blur-md">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
            <span>Interactive Runtime Engineering • 33 Modular Simulations</span>
          </div>

          <h1 className="hero-fade-in text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-[1.08] text-foreground">
            Understand systems from the{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-500 via-sky-500 to-emerald-500">
              inside out.
            </span>
          </h1>

          <p className="hero-fade-in-delayed mt-5 text-base sm:text-lg leading-relaxed text-muted-foreground max-w-2xl mx-auto">
            Step inside execution engines, memory allocators, OS kernel schedulers, and distributed topologies. No passive videos or static slide decks—tactile, deterministic simulations.
          </p>

          {/* Action CTAs */}
          <div className="hero-fade-in-delayed mt-8 flex flex-wrap items-center justify-center gap-3.5">
            <Link
              href="/learning-paths"
              className="inline-flex items-center gap-2 px-6 py-3 text-sm font-semibold text-primary-foreground bg-primary rounded-xl hover:opacity-95 shadow-md hover:shadow-lg transition-all group"
            >
              <span>Explore 33 Simulations</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
            </Link>

            <Link
              href="/canvas"
              className="inline-flex items-center gap-2 px-5 py-3 text-sm font-medium text-foreground border border-border/70 rounded-xl hover:bg-muted/40 transition-colors"
            >
              <span>Launch Canvas Studio</span>
              <ExternalLink className="w-3.5 h-3.5 text-muted-foreground" />
            </Link>
          </div>
        </div>

        {/* ── Interactive Hero Runtime Sandbox Component ── */}
        <div className="hero-fade-in-delayed mt-6 max-w-5xl mx-auto">
          <HeroRuntimeSandbox />
          <p className="mt-3 text-center text-xs text-muted-foreground/80 flex items-center justify-center gap-2">
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-zinc-500/80" />
            <span>Live interactive sandbox auto-cycles every 8 seconds when idle • Hover to pause and step manually</span>
          </p>
        </div>
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════════════════════════
   3. The 5 Core Disciplines
   ═══════════════════════════════════════════════════════════════ */
interface DisciplineItem {
  id: string;
  title: string;
  episodesCount: number;
  description: string;
  topics: string[];
  icon: React.ComponentType<{ className?: string }>;
  accentColor: string;
  accentBg: string;
  accentBorder: string;
  accentText: string;
  href: string;
}

const DISCIPLINES: DisciplineItem[] = [
  {
    id: "javascript",
    title: "JavaScript Runtimes",
    episodesCount: 7,
    description:
      "Inspect execution contexts, the temporal dead zone, variable environments, closure lexical scope, and the event loop microtask queue.",
    topics: ["Call Stack", "Hoisting & TDZ", "Scope Chain", "Closures", "Event Loop"],
    icon: Terminal,
    accentColor: "#f59e0b",
    accentBg: "bg-amber-500/10",
    accentBorder: "border-amber-500/30 group-hover:border-amber-500/70",
    accentText: "text-amber-500 dark:text-amber-400",
    href: "/javascript",
  },
  {
    id: "operating-systems",
    title: "Operating Systems",
    episodesCount: 7,
    description:
      "Follow kernel thread scheduling, hardware timer interrupts, context switching, process control blocks, and mutex race condition synchronization.",
    topics: ["Process States", "Round-Robin CPU", "FCFS", "Mutex Locks", "Producer-Consumer"],
    icon: Cpu,
    accentColor: "#0ea5e9",
    accentBg: "bg-sky-500/10",
    accentBorder: "border-sky-500/30 group-hover:border-sky-500/70",
    accentText: "text-sky-500 dark:text-sky-400",
    href: "/operating-systems",
  },
  {
    id: "java",
    title: "Java & JVM Architecture",
    episodesCount: 9,
    description:
      "Trace classloader hierarchies, bytecode execution, thread stack frames, OOP memory layout, and generational garbage collection.",
    topics: ["Class Loading", "Memory Management", "Stack & Heap", "Bytecode", "OOP Internals"],
    icon: Database,
    accentColor: "#10b981",
    accentBg: "bg-emerald-500/10",
    accentBorder: "border-emerald-500/30 group-hover:border-emerald-500/70",
    accentText: "text-emerald-500 dark:text-emerald-400",
    href: "/java",
  },
  {
    id: "frontend",
    title: "Frontend Architecture",
    episodesCount: 7,
    description:
      "Understand the mechanics beneath modern frameworks: Virtual DOM diffing, Fiber tree reconcilers, hydration lifecycles, and layout/paint pipelines.",
    topics: ["VDOM Reconciliation", "Fiber Trees", "Hydration", "Layout & Paint", "Event Delegation"],
    icon: Layers,
    accentColor: "#8b5cf6",
    accentBg: "bg-violet-500/10",
    accentBorder: "border-violet-500/30 group-hover:border-violet-500/70",
    accentText: "text-violet-500 dark:text-violet-400",
    href: "/frontend",
  },
  {
    id: "backend",
    title: "Backend Internals",
    episodesCount: 3,
    description:
      "Deep dive into persistent systems: database indexing structures, cache invalidation strategies, connection pooling, and message broker partitions.",
    topics: ["B-Tree Indexing", "Cache Invalidation", "Message Brokers", "Connection Pools"],
    icon: Server,
    accentColor: "#3b82f6",
    accentBg: "bg-blue-500/10",
    accentBorder: "border-blue-500/30 group-hover:border-blue-500/70",
    accentText: "text-blue-500 dark:text-blue-400",
    href: "/backend",
  },
];

function DisciplinesSection() {
  return (
    <section id="disciplines" className="py-24 sm:py-32 border-t border-border/40" aria-labelledby="disciplines-heading">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        {/* Section Header */}
        <div className="landing-reveal max-w-2xl mb-14">
          <div className="inline-flex items-center gap-2 px-3 py-1 mb-4 rounded-full border border-border/60 bg-muted/40 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Core Tracks
          </div>
          <h2 id="disciplines-heading" className="text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground">
            Five Runtimes. Zero Black Boxes.
          </h2>
          <p className="mt-4 text-base sm:text-lg text-muted-foreground leading-relaxed">
            Every simulation is built with authentic computational models—not video clips. Choose a discipline to inspect memory, register states, and queues.
          </p>
        </div>

        {/* Discipline Cards Grid */}
        <div className="landing-reveal-stagger grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {DISCIPLINES.map((disc) => {
            const Icon = disc.icon;
            return (
              <Link
                key={disc.id}
                href={disc.href}
                className="group relative flex flex-col justify-between p-6 rounded-2xl border border-border/60 bg-card hover:border-border/90 hover:shadow-xl transition-all duration-300"
              >
                <div>
                  {/* Top Row: Icon + Count */}
                  <div className="flex items-center justify-between mb-5">
                    <div className={`w-11 h-11 rounded-xl ${disc.accentBg} ${disc.accentText} flex items-center justify-center transition-transform group-hover:scale-105 duration-300`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-muted/70 text-muted-foreground">
                      {disc.episodesCount} Episodes
                    </span>
                  </div>

                  <h3 className="text-lg font-bold text-foreground mb-2 group-hover:text-primary transition-colors">
                    {disc.title}
                  </h3>
                  <p className="text-sm text-muted-foreground leading-relaxed mb-6">
                    {disc.description}
                  </p>
                </div>

                {/* Bottom Row: Topics & Link */}
                <div>
                  <div className="flex flex-wrap gap-1.5 mb-5">
                    {disc.topics.map((t) => (
                      <span
                        key={t}
                        className="text-[11px] font-mono px-2 py-0.5 rounded bg-muted/60 text-muted-foreground"
                      >
                        {t}
                      </span>
                    ))}
                  </div>

                  <div className={`flex items-center gap-1.5 text-xs font-semibold ${disc.accentText}`}>
                    <span>Launch track</span>
                    <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              </Link>
            );
          })}

          {/* 6th Card: All 33 Episodes Overview */}
          <Link
            href="/learning-paths"
            className="group relative flex flex-col justify-between p-6 rounded-2xl border border-border/60 bg-gradient-to-br from-card via-card to-muted/20 hover:border-border/90 hover:shadow-xl transition-all duration-300"
          >
            <div>
              <div className="flex items-center justify-between mb-5">
                <div className="w-11 h-11 rounded-xl bg-primary/10 text-primary flex items-center justify-center transition-transform group-hover:scale-105 duration-300">
                  <Play className="w-5 h-5 fill-current" />
                </div>
                <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-primary/10 text-primary">
                  Master Directory
                </span>
              </div>

              <h3 className="text-lg font-bold text-foreground mb-2 group-hover:text-primary transition-colors">
                All 33 Learning Modules
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed mb-6">
                Browse our complete, unrolled syllabus across all 5 tracks. Compare difficulty ratings, prerequisite paths, and simulation objectives.
              </p>
            </div>

            <div className="flex items-center gap-1.5 text-xs font-semibold text-primary">
              <span>View full syllabus</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </div>
          </Link>
        </div>
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════════════════════════
   4. How We Simulate (The Engine Principles)
   ═══════════════════════════════════════════════════════════════ */
function SimulationEngineSection() {
  return (
    <section id="how-it-works" className="py-24 sm:py-32 border-t border-border/40" aria-labelledby="engine-heading">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="grid lg:grid-cols-[1fr_1.3fr] gap-12 lg:gap-16 items-start">
          {/* Left copy */}
          <div className="landing-reveal max-w-md">
            <div className="inline-flex items-center gap-2 px-3 py-1 mb-4 rounded-full border border-border/60 bg-muted/40 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Simulation Mechanics
            </div>
            <h2 id="engine-heading" className="text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground leading-tight">
              Engineered with Mathematical Precision
            </h2>
            <p className="mt-5 text-base sm:text-lg text-muted-foreground leading-relaxed">
              Most online tutorials rely on hand-waving animations or pre-rendered GIFs. System Simulator models actual runtime memory, hardware registers, and queuing mathematics.
            </p>
            <div className="mt-8 flex items-center gap-4 text-xs font-mono text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-500" /> No mock assumptions
              </span>
              <span className="flex items-center gap-1.5">
                <Zap className="w-4 h-4 text-amber-500" /> Discrete step state
              </span>
            </div>
          </div>

          {/* Right feature cards */}
          <div className="landing-reveal-stagger grid sm:grid-cols-2 gap-4">
            <div className="p-5 rounded-xl border border-border/60 bg-card">
              <div className="w-9 h-9 rounded-lg bg-amber-500/10 text-amber-500 flex items-center justify-center mb-4">
                <Terminal className="w-4 h-4" />
              </div>
              <h3 className="text-sm font-semibold text-foreground mb-1.5">
                Strict Two-Phase Execution
              </h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Every context push passes through discrete creation (TDZ & hoisting) before execution assignments parse.
              </p>
            </div>

            <div className="p-5 rounded-xl border border-border/60 bg-card">
              <div className="w-9 h-9 rounded-lg bg-sky-500/10 text-sky-500 flex items-center justify-center mb-4">
                <Cpu className="w-4 h-4" />
              </div>
              <h3 className="text-sm font-semibold text-foreground mb-1.5">
                Transparent Abstractions
              </h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Background frames and suspended processes remain visible in dimmed states—never omitted or hidden away.
              </p>
            </div>

            <div className="p-5 rounded-xl border border-border/60 bg-card">
              <div className="w-9 h-9 rounded-lg bg-emerald-500/10 text-emerald-500 flex items-center justify-center mb-4">
                <Database className="w-4 h-4" />
              </div>
              <h3 className="text-sm font-semibold text-foreground mb-1.5">
                Live Memory Pointers
              </h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Stack frame references directly connect to heap object allocations with real memory addresses and GC reachability.
              </p>
            </div>

            <div className="p-5 rounded-xl border border-border/60 bg-card">
              <div className="w-9 h-9 rounded-lg bg-violet-500/10 text-violet-500 flex items-center justify-center mb-4">
                <Activity className="w-4 h-4" />
              </div>
              <h3 className="text-sm font-semibold text-foreground mb-1.5">
                Hardware Interrupt Modeling
              </h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Experience timer interrupts, scheduler preemption, and thread synchronization barriers firsthand.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════════════════════════
   5. Architectural Capstone: System Design Canvas Studio
   ═══════════════════════════════════════════════════════════════ */
function CanvasStudioSection() {
  return (
    <section id="canvas-studio" className="py-24 sm:py-32 border-t border-border/40 relative overflow-hidden" aria-labelledby="canvas-heading">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="rounded-3xl border border-border/80 bg-gradient-to-b from-card/80 to-card/40 p-8 sm:p-12 lg:p-16 backdrop-blur-xl relative">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 mb-5 rounded-full border border-border/70 bg-muted/40 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Architectural Capstone
            </div>

            <h2 id="canvas-heading" className="text-3xl sm:text-5xl font-extrabold tracking-tight text-foreground leading-[1.1]">
              From Language Internals to Distributed Systems at Scale
            </h2>

            <p className="mt-5 text-base sm:text-lg text-muted-foreground leading-relaxed">
              Once you master how individual processes, stacks, and threads behave, step into our full <strong>System Design Canvas Studio</strong>. Assemble distributed topologies, simulate request packet flows, and stress-test architecture under load.
            </p>

            {/* Canvas capabilities grid */}
            <div className="mt-10 grid grid-cols-2 sm:grid-cols-3 gap-6 font-mono text-xs">
              <div>
                <span className="text-foreground font-bold block mb-1">20+ Cloud Node Types</span>
                <span className="text-muted-foreground">Gateways, Caches, Kafka, DBs, Microservices</span>
              </div>
              <div>
                <span className="text-foreground font-bold block mb-1">Traffic & Rate Limiting</span>
                <span className="text-muted-foreground">Token Bucket & Circuit Breaker State Machines</span>
              </div>
              <div>
                <span className="text-foreground font-bold block mb-1">Multiplayer Collaboration</span>
                <span className="text-muted-foreground">Zero-latency collaborative rooms via Yjs</span>
              </div>
            </div>

            {/* Direct Launch CTA */}
            <div className="mt-10 flex flex-wrap items-center gap-4">
              <Link
                href="/canvas"
                className="inline-flex items-center gap-2 px-7 py-3.5 text-sm font-semibold text-primary-foreground bg-primary rounded-xl hover:opacity-95 shadow-lg transition-all group"
              >
                <span>Launch Canvas Studio</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
              </Link>

              <span className="text-xs text-muted-foreground font-mono">
                No sign-in required • Runs 100% in your browser
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════════════════════════
   6. Metrics & Perspective Quote
   ═══════════════════════════════════════════════════════════════ */
function MetricsQuoteSection() {
  return (
    <section className="py-20 border-t border-border/40">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 text-center">
          <div className="p-6 rounded-2xl border border-border/40 bg-card/40">
            <span className="block text-4xl sm:text-5xl font-extrabold text-foreground tracking-tight">
              33
            </span>
            <span className="mt-2 block text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Interactive Episodes
            </span>
          </div>

          <div className="p-6 rounded-2xl border border-border/40 bg-card/40">
            <span className="block text-4xl sm:text-5xl font-extrabold text-foreground tracking-tight">
              5
            </span>
            <span className="mt-2 block text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Core Disciplines
            </span>
          </div>

          <div className="p-6 rounded-2xl border border-border/40 bg-card/40">
            <span className="block text-4xl sm:text-5xl font-extrabold text-foreground tracking-tight">
              0
            </span>
            <span className="mt-2 block text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Passive Slide Decks
            </span>
          </div>

          <div className="p-6 rounded-2xl border border-border/40 bg-card/40">
            <span className="block text-4xl sm:text-5xl font-extrabold text-foreground tracking-tight">
              100%
            </span>
            <span className="mt-2 block text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Deterministic Models
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════════════════════════
   7. Final Call to Action
   ═══════════════════════════════════════════════════════════════ */
function FinalCTASection() {
  return (
    <section className="py-24 sm:py-32 border-t border-border/40">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 text-center">
        <div className="landing-reveal">
          <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-foreground">
            Start mastering computational runtimes today.
          </h2>
          <p className="mt-5 text-base sm:text-lg text-muted-foreground leading-relaxed max-w-xl mx-auto">
            Choose an interactive module or dive straight into the distributed system canvas.
          </p>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
            <Link
              href="/learning-paths"
              className="inline-flex items-center gap-2 px-7 py-3.5 text-sm font-semibold text-primary-foreground bg-primary rounded-xl hover:opacity-95 shadow-md transition-all group"
            >
              <span>Explore All Modules</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
            </Link>

            <Link
              href="/canvas"
              className="inline-flex items-center gap-2 px-6 py-3.5 text-sm font-medium text-foreground border border-border/70 rounded-xl hover:bg-muted/40 transition-colors"
            >
              <span>Open Canvas Studio</span>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════════════════════════
   8. Footer
   ═══════════════════════════════════════════════════════════════ */
function Footer() {
  return (
    <footer className="border-t border-border/40 py-12 bg-card/30">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 pb-10 border-b border-border/40">
          {/* Brand Col */}
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-2.5">
              <Logo size={24} />
              <span className="text-sm font-bold tracking-tight text-foreground">
                System Simulator
              </span>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Interactive runtime engineering and distributed system simulation platform.
            </p>
          </div>

          {/* Disciplines */}
          <div className="flex flex-col gap-2 text-xs">
            <span className="font-semibold text-foreground mb-1">Disciplines</span>
            <Link href="/javascript" className="text-muted-foreground hover:text-foreground transition-colors">
              JavaScript Runtimes
            </Link>
            <Link href="/operating-systems" className="text-muted-foreground hover:text-foreground transition-colors">
              Operating Systems
            </Link>
            <Link href="/java" className="text-muted-foreground hover:text-foreground transition-colors">
              Java & JVM Architecture
            </Link>
            <Link href="/frontend" className="text-muted-foreground hover:text-foreground transition-colors">
              Frontend Architecture
            </Link>
            <Link href="/backend" className="text-muted-foreground hover:text-foreground transition-colors">
              Backend Internals
            </Link>
          </div>

          {/* Platform */}
          <div className="flex flex-col gap-2 text-xs">
            <span className="font-semibold text-foreground mb-1">Platform</span>
            <Link href="/learning-paths" className="text-muted-foreground hover:text-foreground transition-colors">
              All 33 Episodes
            </Link>
            <Link href="/canvas" className="text-muted-foreground hover:text-foreground transition-colors">
              Canvas Studio
            </Link>
            <Link href="/auth/sign-in" className="text-muted-foreground hover:text-foreground transition-colors">
              Sign In
            </Link>
          </div>

          {/* External */}
          <div className="flex flex-col gap-2 text-xs">
            <span className="font-semibold text-foreground mb-1">Open Source & Community</span>
            <a
              href="https://github.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1.5"
            >
              <span>GitHub Repository</span>
              <ExternalLink className="w-3 h-3" />
            </a>
            <span className="text-muted-foreground/60 text-[11px] mt-2">
              Deployed at systemsimulator.vercel.app
            </span>
          </div>
        </div>

        {/* Bottom copyright */}
        <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-muted-foreground">
          <p>© {new Date().getFullYear()} System Simulator. Built for deep engineering learning.</p>
          <div className="flex items-center gap-4 text-[11px]">
            <span>Deterministic Runtimes</span>
            <span>•</span>
            <span>Client-Side Execution</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
