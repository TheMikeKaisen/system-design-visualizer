"use client";

import React, { useEffect, useRef } from "react";
import Link from "next/link";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Logo } from "@/components/ui/Logo";
import { DisciplineCard, DISCIPLINES } from "@/components/ui/DisciplineCard";
import { HeroRuntimeSandbox } from "./HeroRuntimeSandbox";
import { MiniDistributedCanvas } from "./MiniDistributedCanvas";
import { HeroComputationalGraph } from "./HeroComputationalGraph";
import {
  Database,
  ArrowRight,
  ExternalLink,
  ShieldCheck,
  Zap,
  Activity,
  Play,
  GitBranch,
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
        <InteractiveSandboxSection />
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
      className="fixed top-0 left-0 right-0 z-50 border-b border-border/60 bg-[#FAFAF9]/85 dark:bg-[#090a0f]/85 backdrop-blur-xl transition-all"
      aria-label="Main navigation"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 h-16 flex items-center justify-between">
        {/* Brand */}
        <Link href="/" className="flex items-center gap-2.5 group" aria-label="System Simulator home">
          <Logo size={28} />
          <span className="text-base font-semibold tracking-tight text-[#0A0A0A] dark:text-zinc-50 group-hover:text-primary transition-colors">
            System Simulator
          </span>
        </Link>

        {/* Center Nav Links */}
        <div className="hidden md:flex items-center gap-7 text-xs font-medium text-zinc-600 dark:text-zinc-400">
          <a href="#interactive-sandbox" className="hover:text-[#0A0A0A] dark:hover:text-zinc-100 transition-colors">
            Simulator
          </a>
          <a href="#disciplines" className="hover:text-[#0A0A0A] dark:hover:text-zinc-100 transition-colors">
            Disciplines
          </a>
          <a href="#how-it-works" className="hover:text-[#0A0A0A] dark:hover:text-zinc-100 transition-colors">
            How It Works
          </a>
          <a href="#canvas-studio" className="hover:text-[#0A0A0A] dark:hover:text-zinc-100 transition-colors">
            Canvas Studio
          </a>
          <Link href="/learning-paths" className="hover:text-[#0A0A0A] dark:hover:text-zinc-100 transition-colors flex items-center gap-1.5">
            <span>All Modules</span>
          </Link>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-3">
          <ThemeToggle />

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
   2. Hero Section (Raycast Style Focal Point)
   ═══════════════════════════════════════════════════════════════ */
function HeroSection() {
  return (
    <section className="relative min-h-[85vh] sm:min-h-[90vh] flex flex-col justify-between items-center text-center overflow-hidden px-4 sm:px-6 pt-10 sm:pt-14">
      {/* ── Signature Visual Motif: The Graph of Computation ── */}
      <HeroComputationalGraph />

      {/* ── Foreground Hero Content ── */}
      <div className="relative z-10 max-w-4xl mx-auto flex flex-col items-center my-auto">
        {/* Confident, focal headline */}
        <h1 className="hero-fade-in text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight leading-[1.08] text-[#0A0A0A] dark:text-zinc-50 max-w-4xl">
          Don&apos;t just use software.{" "}
          <span className="block mt-1 sm:mt-2 text-transparent bg-clip-text bg-gradient-to-r from-teal-600 via-cyan-600 to-blue-600 dark:from-teal-400 dark:via-cyan-400 dark:to-blue-400 headline-gradient-shimmer">
            Understand how it works.
          </span>
        </h1>

        {/* Supporting copy */}
        <p className="hero-fade-in-delayed mt-6 sm:mt-8 text-base sm:text-lg md:text-xl text-zinc-600 dark:text-zinc-400 max-w-2xl mx-auto leading-relaxed font-normal">
          Explore the inner workings of software through interactive, visual simulations.
        </p>

        {/* Dual CTAs */}
        <div className="hero-fade-in-delayed mt-8 sm:mt-10 flex flex-wrap items-center justify-center gap-3.5 sm:gap-4">
          <Link
            href="/learning-paths"
            className="inline-flex items-center gap-2 px-6 py-3 text-sm sm:text-base font-semibold text-primary-foreground bg-primary rounded-xl hover:opacity-95 shadow-lg hover:shadow-xl transition-all group active:scale-[0.98]"
          >
            <span>Explore Learning Paths</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
          </Link>

          <Link
            href="/canvas"
            className="inline-flex items-center gap-2 px-5 py-3 text-sm sm:text-base font-medium text-zinc-800 dark:text-zinc-200 border border-zinc-300 dark:border-border/70 bg-white/70 dark:bg-muted/40 hover:bg-white dark:hover:bg-muted/60 transition-colors active:scale-[0.98]"
          >
            <span>Open Canvas Studio</span>
            <ExternalLink className="w-4 h-4 text-muted-foreground" />
          </Link>
        </div>
      </div>

      {/* ── Downward Vertical Circuit Bus Bridge into Section 2 ── */}
      <div className="w-full flex justify-center -mb-px z-10 pointer-events-none mt-auto pt-6">
        <div className="w-[1.5px] h-12 sm:h-14 bg-gradient-to-b from-cyan-500/40 via-teal-500/30 to-sky-500/50 relative overflow-hidden">
          <div className="w-1.5 h-3 rounded-full bg-cyan-500 dark:bg-cyan-300 absolute left-1/2 -translate-x-1/2 packet-dot-vertical shadow-[0_0_8px_rgba(6,182,212,0.6)]" />
        </div>
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════════════════════════
   2b. Dedicated Interactive Sandbox Stage (Section 2)
   ═══════════════════════════════════════════════════════════════ */
function InteractiveSandboxSection() {
  return (
    <section
      id="interactive-sandbox"
      className="scroll-mt-16 py-16 sm:py-24 border-t border-b border-border/50 relative bg-[#F5F5F4] dark:bg-[#0c0d12]"
      aria-labelledby="sandbox-heading"
    >
      {/* Top Receiving Bus Trace from Hero */}
      <div className="w-full flex justify-center -mt-16 sm:-mt-24 mb-6 pointer-events-none">
        <div className="w-[1.5px] h-10 sm:h-12 bg-gradient-to-b from-sky-500/50 via-teal-500/30 to-transparent" />
      </div>

      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        {/* Section Heading */}
        <div className="landing-reveal max-w-3xl mx-auto text-center mb-10 sm:mb-12">
          <h2
            id="sandbox-heading"
            className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-[#0A0A0A] dark:text-zinc-50"
          >
            See what happens beneath the surface.
          </h2>
          <p className="mt-4 text-base sm:text-lg text-zinc-600 dark:text-zinc-400 leading-relaxed font-normal">
            Explore how code executes, memory is allocated, processes are scheduled, and systems communicate.
          </p>
        </div>

        {/* Sandbox Stage Embedded with Soft Multi-Layered Atmospheric Shadow */}
        <div className="landing-reveal relative group max-w-6xl mx-auto">
          {/* Ambient multi-spectrum atmospheric back-glow */}
          <div
            className="absolute -inset-2.5 sm:-inset-3.5 rounded-3xl bg-gradient-to-r from-amber-500/12 via-sky-500/12 to-emerald-500/12 blur-2xl opacity-70 dark:opacity-25 pointer-events-none transition-opacity -z-10"
            aria-hidden="true"
          />
          <div className="shadow-[0_24px_60px_-12px_rgba(15,23,42,0.22),0_12px_24px_-8px_rgba(15,23,42,0.12),0_0_0_1px_rgba(15,23,42,0.08)] rounded-2xl">
            <HeroRuntimeSandbox />
          </div>
        </div>
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════════════════════════
   3. The Discipline Cards (Go beyond the abstractions)
   ═══════════════════════════════════════════════════════════════ */
function DisciplinesSection() {
  return (
    <section id="disciplines" className="scroll-mt-16 py-20 sm:py-28 bg-[#FAFAF9] dark:bg-[#090a0f]" aria-labelledby="disciplines-heading">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        {/* Section Header */}
        <div className="landing-reveal max-w-2xl mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 mb-3 rounded-full border border-zinc-200/90 dark:border-border/60 bg-zinc-100 dark:bg-muted/40 text-xs font-semibold uppercase tracking-wider text-zinc-700 dark:text-muted-foreground shadow-xs">
            Core Disciplines
          </div>
          <h2 id="disciplines-heading" className="text-3xl sm:text-4xl font-extrabold tracking-tight text-[#0A0A0A] dark:text-zinc-50">
            Go beyond the abstractions.
          </h2>
          <p className="mt-4 text-base sm:text-lg text-zinc-600 dark:text-zinc-400 leading-relaxed font-normal">
            Every module makes the invisible visible. Step through execution, inspect state transitions, and see how the underlying mechanics shape the software you build.
          </p>
        </div>

        {/* Discipline Cards Grid */}
        <div className="landing-reveal-stagger grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {DISCIPLINES.map((disc) => (
            <DisciplineCard key={disc.id} discipline={disc} />
          ))}

          {/* 6th Card: All Modules Directory */}
          <Link
            href="/learning-paths"
            className="group relative flex flex-col justify-between p-6 rounded-2xl border border-primary/25 hover:border-primary/70 bg-white dark:bg-zinc-900/70 backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-black/10 dark:hover:shadow-black/40 overflow-hidden shadow-[0_2px_10px_rgba(0,0,0,0.03)]"
          >
            <div
              className="absolute top-0 left-4 right-4 h-[1px] opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-gradient-to-r from-transparent via-primary to-transparent"
              aria-hidden="true"
            />

            <div>
              <div className="flex items-center justify-between mb-5">
                <div className="w-11 h-11 rounded-xl bg-primary/10 text-primary flex items-center justify-center transition-transform group-hover:scale-105 duration-300 border border-primary/20 shadow-xs">
                  <Play className="w-5 h-5 fill-current" />
                </div>
                <span className="text-xs font-mono font-semibold px-2.5 py-1 rounded-full bg-primary/10 text-primary border border-primary/20">
                  All Modules
                </span>
              </div>

              <h3 className="text-lg font-bold text-foreground mb-2 group-hover:text-primary transition-colors tracking-tight">
                Browse All Modules
              </h3>
              <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed mb-6 font-normal">
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
    <section id="how-it-works" className="scroll-mt-16 py-20 sm:py-28 border-t border-b border-border/50 bg-[#F5F5F4] dark:bg-[#0c0d12]" aria-labelledby="engine-heading">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="grid lg:grid-cols-[1fr_1.3fr] gap-12 lg:gap-16 items-start">
          {/* Left copy */}
          <div className="landing-reveal max-w-md">
            <div className="inline-flex items-center gap-2 px-3 py-1 mb-3 rounded-full border border-zinc-200/90 dark:border-border/60 bg-zinc-100 dark:bg-muted/40 text-xs font-semibold uppercase tracking-wider text-zinc-700 dark:text-muted-foreground shadow-xs">
              How It Works
            </div>
            <h2 id="engine-heading" className="text-3xl sm:text-4xl font-extrabold tracking-tight text-[#0A0A0A] dark:text-zinc-50 leading-tight">
              Every step has a reason.
            </h2>
            <p className="mt-4 text-base sm:text-lg text-zinc-600 dark:text-zinc-400 leading-relaxed font-normal">
              These aren&apos;t prerecorded animations. Explore computational models that expose how state changes, operations execute, and systems respond to each action.
            </p>
            <div className="mt-8 flex items-center gap-4 text-xs font-mono text-zinc-600 dark:text-zinc-400">
              <span className="flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" /> Transparent rules
              </span>
              <span className="flex items-center gap-1.5">
                <Zap className="w-4 h-4 text-amber-600 dark:text-amber-400" /> Observable state
              </span>
            </div>
          </div>

          {/* Right feature cards */}
          <div className="landing-reveal-stagger grid sm:grid-cols-2 gap-4">
            <div className="p-5 rounded-2xl border border-zinc-200/90 dark:border-border/60 bg-white dark:bg-zinc-900/60 backdrop-blur-sm shadow-[0_2px_8px_rgba(0,0,0,0.03)] hover:shadow-lg hover:border-zinc-300 dark:hover:border-border/90 transition-all duration-200">
              <div className="w-9 h-9 rounded-lg bg-amber-500/10 text-amber-500 flex items-center justify-center mb-4 border border-amber-500/20">
                <GitBranch className="w-4 h-4" />
              </div>
              <h3 className="text-sm font-semibold text-foreground mb-1.5">
                Explicit state transitions
              </h3>
              <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed font-normal">
                Inspect what changes at each step. Track mutations, variable assignments, and queue states in real time.
              </p>
            </div>

            <div className="p-5 rounded-2xl border border-zinc-200/90 dark:border-border/60 bg-white dark:bg-zinc-900/60 backdrop-blur-sm shadow-[0_2px_8px_rgba(0,0,0,0.03)] hover:shadow-lg hover:border-zinc-300 dark:hover:border-border/90 transition-all duration-200">
              <div className="w-9 h-9 rounded-lg bg-sky-500/10 text-sky-500 flex items-center justify-center mb-4 border border-sky-500/20">
                <Activity className="w-4 h-4" />
              </div>
              <h3 className="text-sm font-semibold text-foreground mb-1.5">
                Inspectable internals
              </h3>
              <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed font-normal">
                Follow the state that drives the simulation. Peek inside call stacks, registers, heap blocks, and PCB records.
              </p>
            </div>

            <div className="p-5 rounded-2xl border border-zinc-200/90 dark:border-border/60 bg-white dark:bg-zinc-900/60 backdrop-blur-sm shadow-[0_2px_8px_rgba(0,0,0,0.03)] hover:shadow-lg hover:border-zinc-300 dark:hover:border-border/90 transition-all duration-200">
              <div className="w-9 h-9 rounded-lg bg-emerald-500/10 text-emerald-500 flex items-center justify-center mb-4 border border-emerald-500/20">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <h3 className="text-sm font-semibold text-foreground mb-1.5">
                Deterministic execution
              </h3>
              <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed font-normal">
                Reproduce the same sequence under the same initial conditions and inputs, where supported.
              </p>
            </div>

            <div className="p-5 rounded-2xl border border-zinc-200/90 dark:border-border/60 bg-white dark:bg-zinc-900/60 backdrop-blur-sm shadow-[0_2px_8px_rgba(0,0,0,0.03)] hover:shadow-lg hover:border-zinc-300 dark:hover:border-border/90 transition-all duration-200">
              <div className="w-9 h-9 rounded-lg bg-violet-500/10 text-violet-500 flex items-center justify-center mb-4 border border-violet-500/20">
                <Database className="w-4 h-4" />
              </div>
              <h3 className="text-sm font-semibold text-foreground mb-1.5">
                Transparent models
              </h3>
              <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed font-normal">
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
    <section id="canvas-studio" className="scroll-mt-16 py-20 sm:py-28 bg-[#FAFAF9] dark:bg-[#090a0f] relative overflow-hidden" aria-labelledby="canvas-heading">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        {/* Header copy */}
        <div className="max-w-3xl mb-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 mb-3 rounded-full border border-zinc-200/90 dark:border-border/70 bg-zinc-100 dark:bg-muted/40 text-xs font-semibold uppercase tracking-wider text-zinc-700 dark:text-muted-foreground shadow-xs">
            Canvas Studio
          </div>

          <h2 id="canvas-heading" className="text-3xl sm:text-5xl font-extrabold tracking-tight text-[#0A0A0A] dark:text-zinc-50 leading-[1.1]">
            From a single function to a distributed system.
          </h2>

          <p className="mt-4 text-base sm:text-lg text-zinc-600 dark:text-zinc-400 leading-relaxed font-normal">
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

            <span className="text-xs text-zinc-500 font-mono">
              No sign-up required
            </span>
          </div>
        </div>

        {/* ── Miniature Distributed Architecture Visual Centerpiece with Ambient Shadow ── */}
        <div className="w-full relative group">
          <div
            className="absolute -inset-2.5 sm:-inset-3.5 rounded-3xl bg-gradient-to-r from-sky-500/15 via-blue-500/15 to-violet-500/15 blur-2xl opacity-60 dark:opacity-20 pointer-events-none -z-10"
            aria-hidden="true"
          />
          <div className="shadow-[0_24px_60px_-12px_rgba(15,23,42,0.2),0_12px_24px_-8px_rgba(15,23,42,0.12),0_0_0_1px_rgba(15,23,42,0.08)] rounded-2xl">
            <MiniDistributedCanvas />
          </div>
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
    <section className="py-20 sm:py-28 border-t border-b border-border/50 bg-[#F5F5F4] dark:bg-[#0c0d12]">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 text-center">
        <div className="landing-reveal">
          <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-[#0A0A0A] dark:text-zinc-50">
            Curiosity is the starting point. Understanding is the goal.
          </h2>
          <p className="mt-4 text-base sm:text-lg text-zinc-600 dark:text-zinc-400 leading-relaxed max-w-xl mx-auto font-normal">
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
              className="inline-flex items-center gap-2 px-6 py-3.5 text-sm font-medium text-zinc-800 dark:text-zinc-200 border border-zinc-300 dark:border-border/70 bg-white/70 dark:bg-muted/40 hover:bg-white dark:hover:bg-muted/60 transition-colors"
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
    <footer className="border-t border-border/60 py-12 bg-[#FAFAF9] dark:bg-[#090a0f]">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 pb-10 border-b border-border/40">
          {/* Brand Col */}
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-2.5">
              <Logo size={24} />
              <span className="text-sm font-bold tracking-tight text-[#0A0A0A] dark:text-zinc-50">
                System Simulator
              </span>
            </div>
          </div>

          {/* Disciplines */}
          <div className="flex flex-col gap-2 text-xs">
            <span className="font-semibold text-foreground mb-1">Disciplines</span>
            <Link href="/javascript" className="text-muted-foreground hover:text-foreground transition-colors">
              JavaScript
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
          {/* <div className="flex flex-col gap-2 text-xs">
            <span className="font-semibold text-foreground mb-1">Open Source & Community</span>
            <a
              href="https://github.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1.5"
            >
              <span>GitHub</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div> */}
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
