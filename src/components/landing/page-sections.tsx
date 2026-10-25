"use client";

import React, { useEffect, useRef } from "react";
import Link from "next/link";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Logo } from "@/components/ui/Logo";
import { HeroRuntimeSandbox } from "./HeroRuntimeSandbox";
import { MiniDistributedCanvas } from "./MiniDistributedCanvas";
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
  GitBranch,
  Eye,
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
    <div
      ref={containerRef}
      className="min-h-screen bg-background text-foreground overflow-x-hidden selection:bg-amber-500/20 selection:text-amber-300"
    >
      <Nav />
      <main className="pt-16">
        <HeroSection />
        <DisciplinesSection />
        <SimulationEngineSection />
        <CanvasStudioSection />
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
        <div className="hidden md:flex items-center gap-7 text-xs font-medium text-muted-foreground">
          <a href="#disciplines" className="hover:text-foreground transition-colors">
            Disciplines
          </a>
          <a href="#how-it-works" className="hover:text-foreground transition-colors">
            How It Works
          </a>
          <a href="#canvas-studio" className="hover:text-foreground transition-colors">
            Canvas Studio
          </a>
          <Link href="/learning-paths" className="hover:text-foreground transition-colors flex items-center gap-1.5">
            <span>All Modules</span>
            {/* <span className="px-1.5 py-0.5 rounded-full bg-amber-500/10 text-amber-500 dark:text-amber-400 text-[10px] font-semibold">
              Interactive
            </span> */}
          </Link>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-3">
          <ThemeToggle />

          <Link
            href="/learning-paths"
            className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-medium text-foreground border border-border/60 rounded-xl hover:bg-muted/50 transition-colors"
          >
            Explore Simulations
          </Link>

          <Link
            href="/canvas"
            className="inline-flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold text-primary-foreground bg-primary rounded-xl hover:opacity-90 shadow-sm transition-all focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
          >
            <span>Open Canvas Studio</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    </nav>
  );
}

/* ═══════════════════════════════════════════════════════════════
   2. Hero Section (Option 1: Centered Viewport-Calibrated Layout)
   ═══════════════════════════════════════════════════════════════ */
function HeroSection() {
  return (
    <section className="relative pt-6 sm:pt-8 md:pt-10 pb-4 sm:pb-6 overflow-hidden flex flex-col justify-center min-h-[calc(100vh-4rem)]">
      {/* Editorial ambient light with restrained, calibrated luminescence */}
      <div
        className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[860px] h-[480px] rounded-full pointer-events-none opacity-25 blur-3xl"
        style={{
          background:
            "radial-gradient(circle at center, rgba(245, 158, 11, 0.08) 0%, rgba(14, 165, 233, 0.04) 50%, transparent 80%)",
        }}
        aria-hidden="true"
      />

      <div className="relative mx-auto max-w-6xl px-4 sm:px-6 w-full flex flex-col items-center">
        {/* Centered Editorial Header: Kicker, Headline, Supporting Copy & CTAs */}
        <div className="max-w-3xl mx-auto text-center shrink-0">
          {/* Kicker badge with animated active pulse */}
          <div className="hero-fade-in inline-flex items-center gap-2 px-2.5 py-0.5 sm:px-3 sm:py-1 mb-2 sm:mb-2.5 rounded-full border border-border/70 bg-muted/40 text-[11px] sm:text-xs font-medium text-muted-foreground backdrop-blur-md shadow-[inset_0_1px_0_0_rgba(255,255,255,0.05)]">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
            <span>Interactive Runtime Engineering</span>
          </div>

          <h1 className="hero-fade-in text-xl sm:text-2xl md:text-3xl lg:text-[36px] xl:text-[40px] font-extrabold tracking-tight leading-[1.14] text-foreground">
            Don&apos;t just use software.{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-500 via-sky-500 to-emerald-500">
              Understand how it works.
            </span>
          </h1>

          <p className="hero-fade-in-delayed mt-2 sm:mt-2.5 text-xs sm:text-sm md:text-base leading-relaxed text-muted-foreground max-w-2xl mx-auto line-clamp-3 sm:line-clamp-none">
            Explore what happens beneath the abstractions — from JavaScript execution and memory allocation to operating system scheduling and distributed systems. Run interactive simulations. Inspect internal state. Learn by experimenting.
          </p>

          {/* Action CTAs */}
          <div className="hero-fade-in-delayed mt-3 sm:mt-3.5 flex flex-wrap items-center justify-center gap-2.5 sm:gap-3">
            <Link
              href="/learning-paths"
              className="inline-flex items-center gap-2 px-4 py-1.5 sm:px-5 sm:py-2 text-xs sm:text-sm font-semibold text-primary-foreground bg-primary rounded-xl hover:opacity-95 shadow-md hover:shadow-lg transition-all group active:scale-[0.98]"
            >
              <span>Explore Simulations</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
            </Link>

            <Link
              href="/canvas"
              className="inline-flex items-center gap-2 px-3.5 py-1.5 sm:px-4 sm:py-2 text-xs sm:text-sm font-medium text-foreground border border-border/70 rounded-xl hover:bg-muted/40 transition-colors active:scale-[0.98]"
            >
              <span>Open Canvas Studio</span>
              <ExternalLink className="w-3.5 h-3.5 text-muted-foreground" />
            </Link>
          </div>
        </div>

        {/* Centered HeroRuntimeSandbox Container: Strictly fits in 100vh on initial load */}
        <div className="hero-fade-in-delayed mt-3 sm:mt-4 w-full max-w-5xl mx-auto">
          <HeroRuntimeSandbox />
        </div>
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════════════════════════
   3. The Discipline Cards (Go beyond the abstractions)
   ═══════════════════════════════════════════════════════════════ */
interface DisciplineItem {
  id: string;
  title: string;
  badge: string;
  description: string;
  topics: string[];
  icon: React.ComponentType<{ className?: string }>;
  accentColor: string;
  accentBg: string;
  accentBorder: string;
  accentText: string;
  ctaText: string;
  href: string;
}

const DISCIPLINES: DisciplineItem[] = [
  {
    id: "javascript",
    title: "JavaScript Runtimes",
    badge: "Runtime Engine",
    description: "Follow the call stack, scope, closures, and event loop as your code executes, one step at a time.",
    topics: ["Call Stack", "Scope Chains", "Closures", "Event Loop"],
    icon: Terminal,
    accentColor: "#f59e0b",
    accentBg: "bg-amber-500/10",
    accentBorder: "border-amber-500/30 group-hover:border-amber-500/70",
    accentText: "text-amber-500 dark:text-amber-400",
    ctaText: "Explore JavaScript",
    href: "/javascript",
  },
  {
    id: "operating-systems",
    title: "Operating Systems",
    badge: "Kernel & Hardware",
    description: "Explore how schedulers allocate CPU time, processes compete for resources, and threads coordinate their work.",
    topics: ["CPU Schedulers", "Process States", "Mutex Synchronization", "Interrupts"],
    icon: Cpu,
    accentColor: "#0ea5e9",
    accentBg: "bg-sky-500/10",
    accentBorder: "border-sky-500/30 group-hover:border-sky-500/70",
    accentText: "text-sky-500 dark:text-sky-400",
    ctaText: "Explore Operating Systems",
    href: "/operating-systems",
  },
  {
    id: "java",
    title: "Java & JVM Architecture",
    badge: "Virtual Machine",
    description: "Trace the journey from class loading and bytecode verification to runtime memory and execution.",
    topics: ["Class Loading", "Stack & Heap", "Bytecode", "Garbage Collection"],
    icon: Database,
    accentColor: "#10b981",
    accentBg: "bg-emerald-500/10",
    accentBorder: "border-emerald-500/30 group-hover:border-emerald-500/70",
    accentText: "text-emerald-500 dark:text-emerald-400",
    ctaText: "Explore Java & JVM",
    href: "/java",
  },
  {
    id: "frontend",
    title: "Frontend Architecture",
    badge: "Browser Internals",
    description: "Understand reconciliation, rendering, state updates, and the mechanisms behind modern UI frameworks.",
    topics: ["Reconciliation", "Fiber Trees", "Hydration", "DOM Pipeline"],
    icon: Layers,
    accentColor: "#8b5cf6",
    accentBg: "bg-violet-500/10",
    accentBorder: "border-violet-500/30 group-hover:border-violet-500/70",
    accentText: "text-violet-500 dark:text-violet-400",
    ctaText: "Explore Frontend Systems",
    href: "/frontend",
  },
  {
    id: "backend",
    title: "Backend Internals",
    badge: "Distributed Systems",
    description: "Investigate database indexing, connection pools, message brokers, and the mechanics behind reliable backend services.",
    topics: ["B-Tree Indexing", "Connection Pools", "Message Brokers", "Caching"],
    icon: Server,
    accentColor: "#3b82f6",
    accentBg: "bg-blue-500/10",
    accentBorder: "border-blue-500/30 group-hover:border-blue-500/70",
    accentText: "text-blue-500 dark:text-blue-400",
    ctaText: "Explore Backend Systems",
    href: "/backend",
  },
];

function DisciplinesSection() {
  return (
    <section id="disciplines" className="scroll-mt-16 py-20 sm:py-28 border-t border-border/40 bg-zinc-950/20" aria-labelledby="disciplines-heading">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        {/* Section Header */}
        <div className="landing-reveal max-w-2xl mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 mb-3 rounded-full border border-border/60 bg-muted/40 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Core Disciplines
          </div>
          <h2 id="disciplines-heading" className="text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground">
            Go beyond the abstractions.
          </h2>
          <p className="mt-4 text-base sm:text-lg text-muted-foreground leading-relaxed">
            Every module makes the invisible visible. Step through execution, inspect state transitions, and see how the underlying mechanics shape the software you build.
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
                className={`group relative flex flex-col justify-between p-6 rounded-2xl border border-border/60 bg-card/90 dark:bg-zinc-900/60 backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-black/25 ${disc.accentBorder} shadow-[inset_0_1px_0_0_rgba(255,255,255,0.05)] overflow-hidden`}
              >
                {/* Subtle top hairline highlight on hover */}
                <div
                  className="absolute top-0 left-4 right-4 h-[1px] opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                  style={{
                    background: `linear-gradient(90deg, transparent, ${disc.accentColor}, transparent)`,
                  }}
                  aria-hidden="true"
                />

                <div>
                  {/* Top Row: Icon + Badge */}
                  <div className="flex items-center justify-between mb-5">
                    <div className={`w-11 h-11 rounded-xl ${disc.accentBg} ${disc.accentText} flex items-center justify-center transition-transform group-hover:scale-105 duration-300 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.1)]`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <span className="text-xs font-mono font-medium px-2.5 py-1 rounded-full bg-muted/60 text-muted-foreground border border-border/40">
                      {disc.badge}
                    </span>
                  </div>

                  <h3 className="text-lg font-bold text-foreground mb-2 group-hover:text-primary transition-colors tracking-tight">
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
                        className="text-[11px] font-mono px-2 py-0.5 rounded bg-muted/50 border border-border/40 text-muted-foreground group-hover:border-border/80 transition-colors"
                      >
                        {t}
                      </span>
                    ))}
                  </div>

                  <div className={`flex items-center gap-1.5 text-xs font-semibold ${disc.accentText}`}>
                    <span>{disc.ctaText}</span>
                    <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              </Link>
            );
          })}

          {/* 6th Card: All Modules Directory */}
          <Link
            href="/learning-paths"
            className="group relative flex flex-col justify-between p-6 rounded-2xl border border-border/60 bg-gradient-to-br from-card/95 via-card/80 to-muted/20 dark:from-zinc-900/80 dark:to-zinc-950/40 backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:border-primary/50 hover:shadow-xl hover:shadow-black/25 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.05)] overflow-hidden"
          >
            <div
              className="absolute top-0 left-4 right-4 h-[1px] opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-gradient-to-r from-transparent via-primary to-transparent"
              aria-hidden="true"
            />

            <div>
              <div className="flex items-center justify-between mb-5">
                <div className="w-11 h-11 rounded-xl bg-primary/10 text-primary flex items-center justify-center transition-transform group-hover:scale-105 duration-300 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.1)]">
                  <Play className="w-5 h-5 fill-current" />
                </div>
                <span className="text-xs font-mono font-semibold px-2.5 py-1 rounded-full bg-primary/10 text-primary border border-primary/20">
                  All Modules
                </span>
              </div>

              <h3 className="text-lg font-bold text-foreground mb-2 group-hover:text-primary transition-colors tracking-tight">
                Browse All Modules
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed mb-6">
                Explore the complete interactive curriculum across all disciplines. Filter by track, inspect prerequisites, and launch simulators directly.
              </p>
            </div>

            <div className="flex items-center gap-1.5 text-xs font-semibold text-primary">
              <span>Explore discipline modules</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </div>
          </Link>
        </div>
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════════════════════════
   4. How It Works: Simulation Mechanics (Every step has a reason)
   ═══════════════════════════════════════════════════════════════ */
function SimulationEngineSection() {
  return (
    <section id="how-it-works" className="scroll-mt-16 py-20 sm:py-28 border-t border-border/40" aria-labelledby="engine-heading">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="grid lg:grid-cols-[1fr_1.3fr] gap-12 lg:gap-16 items-start">
          {/* Left copy */}
          <div className="landing-reveal max-w-md">
            <div className="inline-flex items-center gap-2 px-3 py-1 mb-3 rounded-full border border-border/60 bg-muted/40 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              How It Works
            </div>
            <h2 id="engine-heading" className="text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground leading-tight">
              Every step has a reason.
            </h2>
            <p className="mt-4 text-base sm:text-lg text-muted-foreground leading-relaxed">
              These aren&apos;t prerecorded animations. Explore computational models that expose how state changes, operations execute, and systems respond to each action.
            </p>
            <div className="mt-8 flex items-center gap-4 text-xs font-mono text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-500" /> Transparent rules
              </span>
              <span className="flex items-center gap-1.5">
                <Zap className="w-4 h-4 text-amber-500" /> Observable state
              </span>
            </div>
          </div>

          {/* Right feature cards */}
          <div className="landing-reveal-stagger grid sm:grid-cols-2 gap-4">
            <div className="p-5 rounded-xl border border-border/60 bg-card/90 dark:bg-zinc-900/50 backdrop-blur-sm shadow-[inset_0_1px_0_0_rgba(255,255,255,0.04)] hover:border-border/90 transition-all duration-200">
              <div className="w-9 h-9 rounded-lg bg-amber-500/10 text-amber-500 flex items-center justify-center mb-4">
                <GitBranch className="w-4 h-4" />
              </div>
              <h3 className="text-sm font-semibold text-foreground mb-1.5">
                Explicit state transitions
              </h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Inspect what changes at each step. Track mutations, variable assignments, and queue states in real time.
              </p>
            </div>

            <div className="p-5 rounded-xl border border-border/60 bg-card/90 dark:bg-zinc-900/50 backdrop-blur-sm shadow-[inset_0_1px_0_0_rgba(255,255,255,0.04)] hover:border-border/90 transition-all duration-200">
              <div className="w-9 h-9 rounded-lg bg-sky-500/10 text-sky-500 flex items-center justify-center mb-4">
                <Eye className="w-4 h-4" />
              </div>
              <h3 className="text-sm font-semibold text-foreground mb-1.5">
                Inspectable internals
              </h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Follow the state that drives the simulation. Peek inside call stacks, registers, heap blocks, and PCB records.
              </p>
            </div>

            <div className="p-5 rounded-xl border border-border/60 bg-card/90 dark:bg-zinc-900/50 backdrop-blur-sm shadow-[inset_0_1px_0_0_rgba(255,255,255,0.04)] hover:border-border/90 transition-all duration-200">
              <div className="w-9 h-9 rounded-lg bg-emerald-500/10 text-emerald-500 flex items-center justify-center mb-4">
                <Activity className="w-4 h-4" />
              </div>
              <h3 className="text-sm font-semibold text-foreground mb-1.5">
                Deterministic execution
              </h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Reproduce the same sequence under the same initial conditions and inputs, where supported.
              </p>
            </div>

            <div className="p-5 rounded-xl border border-border/60 bg-card/90 dark:bg-zinc-900/50 backdrop-blur-sm shadow-[inset_0_1px_0_0_rgba(255,255,255,0.04)] hover:border-border/90 transition-all duration-200">
              <div className="w-9 h-9 rounded-lg bg-violet-500/10 text-violet-500 flex items-center justify-center mb-4">
                <Database className="w-4 h-4" />
              </div>
              <h3 className="text-sm font-semibold text-foreground mb-1.5">
                Transparent models
              </h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Understand the rules behind the output. No magical shortcuts—pure computer science mechanics.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════════════════════════
   5. Canvas Studio (From a single function to a distributed system)
   ═══════════════════════════════════════════════════════════════ */
function CanvasStudioSection() {
  return (
    <section id="canvas-studio" className="scroll-mt-16 py-20 sm:py-28 border-t border-border/40 bg-zinc-950/40 relative overflow-hidden" aria-labelledby="canvas-heading">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        {/* Header copy */}
        <div className="max-w-3xl mb-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 mb-3 rounded-full border border-border/70 bg-muted/40 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Canvas Studio
          </div>

          <h2 id="canvas-heading" className="text-3xl sm:text-5xl font-extrabold tracking-tight text-foreground leading-[1.1]">
            From a single function to a distributed system.
          </h2>

          <p className="mt-4 text-base sm:text-lg text-muted-foreground leading-relaxed">
            Start with the mechanics of a single execution environment. Then explore how services communicate, requests move through a system, and distributed architectures behave under load.
          </p>

          <div className="mt-6 flex flex-wrap items-center gap-3">
            <Link
              href="/canvas"
              className="inline-flex items-center gap-2 px-6 py-3 text-sm font-semibold text-primary-foreground bg-primary rounded-xl hover:opacity-95 shadow-md transition-all group"
            >
              <span>Build a System</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
            </Link>

            <span className="text-xs text-muted-foreground font-mono">
              No sign-up required
            </span>
          </div>
        </div>

        {/* ── Miniature Distributed Architecture Visual Centerpiece ── */}
        <div className="w-full">
          <MiniDistributedCanvas />
        </div>
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════════════════════════
   6. Final Call to Action
   ═══════════════════════════════════════════════════════════════ */
function FinalCTASection() {
  return (
    <section className="py-20 sm:py-28 border-t border-border/40">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 text-center">
        <div className="landing-reveal">
          <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-foreground">
            Curiosity is the starting point. Understanding is the goal.
          </h2>
          <p className="mt-4 text-base sm:text-lg text-muted-foreground leading-relaxed max-w-xl mx-auto">
            Pick a concept, run an experiment, and see what happens beneath the surface.
          </p>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
            <Link
              href="/learning-paths"
              className="inline-flex items-center gap-2 px-7 py-3.5 text-sm font-semibold text-primary-foreground bg-primary rounded-xl hover:opacity-95 shadow-md transition-all group"
            >
              <span>Browse All Modules</span>
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
   7. Footer
   ═══════════════════════════════════════════════════════════════ */
function Footer() {
  return (
    <footer className="border-t border-border/40 py-12 bg-card/20">
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
              All Modules
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
            {/* <span className="text-muted-foreground/60 text-[11px] mt-2">
              Deployed at systemsimulator.vercel.app
            </span> */}
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
