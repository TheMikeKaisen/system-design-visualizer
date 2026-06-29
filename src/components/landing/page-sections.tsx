"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Logo } from "@/components/ui/Logo";
import { HeroVisual } from "./hero-visual";
import "./landing.css";

/* ═══════════════════════════════════════════════════════════════
   Scroll-reveal hook (Intersection Observer)
   ═══════════════════════════════════════════════════════════════ */

function useScrollReveal() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Respect reduced-motion
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
      { threshold: 0.15, rootMargin: "0px 0px -40px 0px" }
    );

    container.querySelectorAll(".landing-reveal").forEach((el) => {
      observer.observe(el);
    });

    return () => observer.disconnect();
  }, []);

  return containerRef;
}

/* ═══════════════════════════════════════════════════════════════
   Section icons (inline SVG, consistent with NodePalette style)
   ═══════════════════════════════════════════════════════════════ */

function BlocksIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="7" rx="1.5" />
      <rect x="14" y="3" width="7" height="7" rx="1.5" />
      <rect x="3" y="14" width="7" height="7" rx="1.5" />
      <rect x="14" y="14" width="7" height="7" rx="1.5" />
    </svg>
  );
}

function FlowIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="5" cy="12" r="2.5" />
      <circle cx="19" cy="6" r="2.5" />
      <circle cx="19" cy="18" r="2.5" />
      <path d="M7.5 11L16.5 7" />
      <path d="M7.5 13L16.5 17" />
    </svg>
  );
}

function LayersIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 3L2 9l10 6 10-6-10-6z" />
      <path d="M2 15l10 6 10-6" />
      <path d="M2 12l10 6 10-6" />
    </svg>
  );
}

function SimulateIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="5,3 19,12 5,21" />
    </svg>
  );
}

function RouteIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 17h2a4 4 0 0 0 4-4V7a4 4 0 0 1 4-4h2" />
      <path d="M21 7h-2a4 4 0 0 0-4 4v6a4 4 0 0 1-4 4H9" />
      <circle cx="5" cy="17" r="2" />
      <circle cx="19" cy="7" r="2" />
    </svg>
  );
}

function MetricsIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="12" width="4" height="9" rx="1" />
      <rect x="10" y="7" width="4" height="14" rx="1" />
      <rect x="17" y="3" width="4" height="18" rx="1" />
    </svg>
  );
}

function BookIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
      <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
    </svg>
  );
}

/* ═══════════════════════════════════════════════════════════════
   Landing Page Component
   ═══════════════════════════════════════════════════════════════ */

export function LandingPage() {
  const containerRef = useScrollReveal();

  return (
    <div ref={containerRef} className="min-h-screen bg-background text-foreground overflow-x-hidden">
      {/* ── Navigation ──────────────────────────────────── */}
      <Nav />

      <main>
        {/* ── Hero ────────────────────────────────────────── */}
        <HeroSection />

        {/* ── Learn by Building ───────────────────────────── */}
        <LearnByBuildingSection />

        {/* ── Interactive Simulations ─────────────────────── */}
        <SimulationsSection />

        {/* ── Guided Learning (Coming Soon) ───────────────── */}
        <GuidedLearningSection />

        {/* ── Final CTA ───────────────────────────────────── */}
        <FinalCTASection />
      </main>

      {/* ── Footer ──────────────────────────────────────── */}
      <Footer />
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   Navigation
   ═══════════════════════════════════════════════════════════════ */

function Nav() {
  const [isVisible, setIsVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      if (currentScrollY > lastScrollY && currentScrollY > 64) {
        setIsVisible(false);
      } else {
        setIsVisible(true);
      }
      setLastScrollY(currentScrollY);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [lastScrollY]);

  return (
    <nav
      className={`landing-nav fixed top-0 left-0 right-0 z-50 border-b border-border/50 bg-background/80 transition-transform duration-300 ${
        isVisible ? "translate-y-0" : "-translate-y-full"
      }`}
      aria-label="Main navigation"
    >
      <div className="mx-auto max-w-6xl px-6 h-16 flex items-center justify-between">
        {/* Logo + wordmark */}
        <Link href="/" className="flex items-center gap-2.5 group" aria-label="System Simulator home">
          <Logo size={28} />
          <span className="text-sm font-semibold tracking-tight text-foreground">
            System Simulator
          </span>
        </Link>

        {/* Right side */}
        <div className="flex items-center gap-3">
          <ThemeToggle />

          {/* Guided Learning — disabled */}
          <button
            disabled
            className="hidden sm:inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-muted-foreground/60 border border-border/50 rounded-lg cursor-not-allowed select-none"
            aria-label="Guided Learning — coming soon"
          >
            Guided Learning
            <span className="inline-flex items-center px-1.5 py-0.5 text-[10px] font-semibold tracking-wider uppercase bg-muted text-muted-foreground rounded">
              Soon
            </span>
          </button>

          {/* Open Canvas — primary */}
          <Link
            href="/canvas"
            className="inline-flex items-center px-4 py-2 text-sm font-medium text-primary-foreground bg-primary rounded-lg hover:opacity-90 transition-opacity focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
          >
            Open Canvas
          </Link>
        </div>
      </div>
    </nav>
  );
}

/* ═══════════════════════════════════════════════════════════════
   Hero Section
   ═══════════════════════════════════════════════════════════════ */

function HeroSection() {
  return (
    <section className="relative pt-32 sm:pt-40 pb-20 sm:pb-28 overflow-hidden">
      {/* Subtle radial glow */}
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[600px] rounded-full pointer-events-none"
        style={{
          background: "radial-gradient(ellipse at center, oklch(0.55 0.08 260 / 0.04) 0%, transparent 70%)",
        }}
        aria-hidden="true"
      />

      <div className="relative mx-auto max-w-6xl px-6">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Text column */}
          <div className="max-w-xl">
            <h1 className="hero-fade-in text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight leading-[1.1] text-foreground">
              Design.
              <br />
              Simulate.
              <br />
              <span style={{ color: "oklch(0.55 0.12 260)" }}>Understand.</span>
            </h1>

            <p className="hero-fade-in-delayed mt-6 text-lg sm:text-xl leading-relaxed text-muted-foreground max-w-[520px]">
              Build distributed systems visually. Drag servers, databases, and load balancers onto a canvas — then simulate real request flows to see how your architecture behaves.
            </p>

            <div className="hero-fade-in-delayed-2 mt-10 flex flex-wrap items-center gap-4">
              {/* Primary CTA */}
              <Link
                href="/canvas"
                className="inline-flex items-center gap-2 px-6 py-3 text-base font-semibold text-primary-foreground bg-primary rounded-xl hover:opacity-90 transition-all hover:shadow-lg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
                id="hero-cta-canvas"
              >
                Open Canvas
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 8h10M9 4l4 4-4 4" />
                </svg>
              </Link>

              {/* Secondary CTA — disabled */}
              <button
                disabled
                className="group inline-flex items-center gap-2 px-6 py-3 text-base font-semibold text-muted-foreground/50 border border-border/60 rounded-xl cursor-not-allowed select-none"
                aria-label="Guided Learning — coming soon"
                id="hero-cta-guided"
              >
                Guided Learning
                <span className="inline-flex items-center px-2 py-0.5 text-[10px] font-bold tracking-wider uppercase bg-muted text-muted-foreground/60 rounded-md">
                  Coming Soon
                </span>
              </button>
            </div>
          </div>

          {/* Hero visual */}
          <div className="hero-fade-in-delayed-3 lg:pl-4">
            <HeroVisual className="w-full max-w-lg mx-auto lg:max-w-none" />
          </div>
        </div>
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════════════════════════
   Learn by Building
   ═══════════════════════════════════════════════════════════════ */

function LearnByBuildingSection() {
  return (
    <section className="py-24 sm:py-32 border-t border-border/40" aria-labelledby="learn-heading">
      <div className="mx-auto max-w-6xl px-6">
        <div className="grid lg:grid-cols-[1fr_1.2fr] gap-16 items-start">
          {/* Left: copy */}
          <div className="landing-reveal max-w-md">
            <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-4">
              A different approach
            </p>
            <h2 id="learn-heading" className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground leading-tight">
              Learn by Building
            </h2>
            <p className="mt-5 text-base sm:text-lg leading-relaxed text-muted-foreground">
              Stop memorizing architecture diagrams. Build real systems on a visual canvas, configure each component, and simulate how requests flow. Understanding comes from experimentation, not reading.
            </p>
          </div>

          {/* Right: feature cards */}
          <div className="landing-reveal-stagger grid sm:grid-cols-2 gap-4">
            <FeatureCard
              icon={<BlocksIcon />}
              title="Drag & Drop Components"
              description="Servers, databases, load balancers, caches, message queues, CDNs — everything you need."
            />
            <FeatureCard
              icon={<FlowIcon />}
              title="Connect & Configure"
              description="Wire components together. Set protocols, latency, error rates, and throughput limits."
            />
            <FeatureCard
              icon={<LayersIcon />}
              title="Cloud Provider Nodes"
              description="AWS, GCP, and Azure components with accurate representations and behaviors."
            />
            <FeatureCard
              icon={<SimulateIcon />}
              title="Run Simulations"
              description="Hit play and watch requests flow through your system in real time."
            />
          </div>
        </div>
      </div>
    </section>
  );
}

function FeatureCard({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) {
  return (
    <div className="landing-reveal group p-5 rounded-xl border border-border/50 bg-card hover:border-border hover:shadow-sm transition-all duration-300">
      <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center text-foreground mb-4 group-hover:scale-105 transition-transform duration-300">
        {icon}
      </div>
      <h3 className="text-sm font-semibold text-foreground mb-1.5">{title}</h3>
      <p className="text-sm leading-relaxed text-muted-foreground">{description}</p>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   Interactive Simulations
   ═══════════════════════════════════════════════════════════════ */

function SimulationsSection() {
  return (
    <section className="py-24 sm:py-32 border-t border-border/40" aria-labelledby="simulations-heading">
      <div className="mx-auto max-w-6xl px-6">
        <div className="landing-reveal text-center max-w-2xl mx-auto mb-16">
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-4">
            See it in action
          </p>
          <h2 id="simulations-heading" className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground">
            Interactive Simulations
          </h2>
          <p className="mt-5 text-base sm:text-lg leading-relaxed text-muted-foreground">
            Watch packets traverse your architecture in real time. Observe bottlenecks form, queues fill, and caches warm — all in a visual, interactive environment.
          </p>
        </div>

        <div className="landing-reveal-stagger grid sm:grid-cols-3 gap-6">
          <SimFeatureCard
            icon={<RouteIcon />}
            title="Visual Packet Flow"
            description="Animated packets travel along your connections, showing exactly how requests propagate through the system."
          />
          <SimFeatureCard
            icon={<MetricsIcon />}
            title="Real-Time Metrics"
            description="Monitor throughput, latency, queue depth, and error rates as your simulation runs."
          />
          <SimFeatureCard
            icon={<FlowIcon />}
            title="Load & Stress Testing"
            description="Configure request volume and patterns to observe how your system handles real-world conditions."
          />
        </div>
      </div>
    </section>
  );
}

function SimFeatureCard({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) {
  return (
    <div className="landing-reveal group relative p-6 sm:p-8 rounded-2xl border border-border/50 bg-card hover:border-border transition-all duration-300">
      <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center text-foreground mb-5 group-hover:scale-105 transition-transform duration-300">
        {icon}
      </div>
      <h3 className="text-base font-semibold text-foreground mb-2">{title}</h3>
      <p className="text-sm leading-relaxed text-muted-foreground">{description}</p>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   Guided Learning (Coming Soon)
   ═══════════════════════════════════════════════════════════════ */

function GuidedLearningSection() {
  return (
    <section className="py-24 sm:py-32 border-t border-border/40" aria-labelledby="guided-heading">
      <div className="mx-auto max-w-6xl px-6">
        <div className="landing-reveal text-center max-w-2xl mx-auto mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 mb-5 text-xs font-semibold uppercase tracking-wider bg-muted text-muted-foreground rounded-full">
            <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/50" />
            Coming Soon
          </div>
          <h2 id="guided-heading" className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground">
            Guided Learning Paths
          </h2>
          <p className="mt-5 text-base sm:text-lg leading-relaxed text-muted-foreground">
            Structured lessons that walk you through fundamental system design concepts. Each lesson builds on the canvas, guiding you step by step.
          </p>
        </div>

        {/* Lesson preview cards — muted/locked state */}
        <div className="landing-reveal-stagger grid sm:grid-cols-2 lg:grid-cols-3 gap-4 max-w-4xl mx-auto">
          <LessonPreviewCard
            number={1}
            title="Client-Server Basics"
            topics={["Request/Response", "HTTP Protocol", "Latency"]}
          />
          <LessonPreviewCard
            number={2}
            title="Load Balancing"
            topics={["Round Robin", "Horizontal Scaling", "Health Checks"]}
          />
          <LessonPreviewCard
            number={3}
            title="Caching Strategies"
            topics={["Cache Aside", "Write-Through", "TTL & Eviction"]}
          />
        </div>
      </div>
    </section>
  );
}

function LessonPreviewCard({ number, title, topics }: { number: number; title: string; topics: string[] }) {
  return (
    <div className="landing-reveal relative p-5 rounded-xl border border-border/40 bg-card/50 opacity-70 select-none">
      {/* Lock overlay */}
      <div className="absolute top-4 right-4">
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" className="text-muted-foreground/40">
          <rect x="3" y="7" width="10" height="7" rx="1.5" />
          <path d="M5 7V5a3 3 0 0 1 6 0v2" />
        </svg>
      </div>
      <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center text-xs font-bold text-muted-foreground mb-3">
        {number}
      </div>
      <h3 className="text-sm font-semibold text-foreground/70 mb-2">{title}</h3>
      <div className="flex flex-wrap gap-1.5">
        {topics.map((topic) => (
          <span key={topic} className="inline-block px-2 py-0.5 text-[11px] font-medium bg-muted/60 text-muted-foreground/50 rounded">
            {topic}
          </span>
        ))}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   Final CTA
   ═══════════════════════════════════════════════════════════════ */

function FinalCTASection() {
  return (
    <section className="py-24 sm:py-32 border-t border-border/40">
      <div className="mx-auto max-w-6xl px-6 text-center">
        <div className="landing-reveal max-w-xl mx-auto">
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground">
            Ready to build?
          </h2>
          <p className="mt-4 text-lg leading-relaxed text-muted-foreground">
            Open the canvas and start designing your first distributed system.
          </p>
          <div className="mt-8">
            <Link
              href="/canvas"
              className="inline-flex items-center gap-2 px-8 py-3.5 text-base font-semibold text-primary-foreground bg-primary rounded-xl hover:opacity-90 transition-all hover:shadow-lg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
              id="final-cta-canvas"
            >
              Open Canvas
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 8h10M9 4l4 4-4 4" />
              </svg>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════════════════════════
   Footer
   ═══════════════════════════════════════════════════════════════ */

function Footer() {
  return (
    <footer className="border-t border-border/40 py-8">
      <div className="mx-auto max-w-6xl px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Logo size={20} />
          <span className="text-xs font-medium">System Simulator</span>
        </div>
        <p className="text-xs text-muted-foreground/60">
          © {new Date().getFullYear()} System Simulator. Built for learning.
        </p>
      </div>
    </footer>
  );
}
