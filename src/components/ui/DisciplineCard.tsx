import React from "react";
import Link from "next/link";
import { Terminal, Cpu, Database, Layers, Server, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

export interface DisciplineItem {
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

export const DISCIPLINES: DisciplineItem[] = [
  {
    id: "javascript",
    title: "JavaScript",
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

export interface DisciplineCardProps {
  discipline: DisciplineItem;
  className?: string;
}

export function DisciplineCard({ discipline, className }: DisciplineCardProps) {
  const Icon = discipline.icon;

  return (
    <Link
      href={discipline.href}
      className={cn(
        "group relative flex flex-col justify-between p-6 rounded-2xl border bg-white dark:bg-zinc-900/70 backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-black/10 dark:hover:shadow-black/40 overflow-hidden shadow-[0_2px_10px_rgba(0,0,0,0.03)]",
        discipline.accentBorder,
        className
      )}
    >
      {/* Subtle top hairline highlight on hover */}
      <div
        className="absolute top-0 left-4 right-4 h-[1px] opacity-0 group-hover:opacity-100 transition-opacity duration-300"
        style={{
          background: `linear-gradient(90deg, transparent, ${discipline.accentColor}, transparent)`,
        }}
        aria-hidden="true"
      />

      <div>
        {/* Top Row: Icon + Badge */}
        <div className="flex items-center justify-between mb-5">
          <div
            className={cn(
              "w-11 h-11 rounded-xl flex items-center justify-center transition-transform group-hover:scale-105 duration-300 border border-current/20 shadow-sm",
              discipline.accentBg,
              discipline.accentText
            )}
          >
            <Icon className="w-5 h-5" />
          </div>
          <span className="text-xs font-mono font-medium px-2.5 py-1 rounded-full bg-zinc-100 dark:bg-muted/60 text-zinc-700 dark:text-muted-foreground border border-zinc-200/80 dark:border-border/40">
            {discipline.badge}
          </span>
        </div>

        <h3 className="text-lg font-bold text-foreground mb-2 group-hover:text-primary transition-colors tracking-tight">
          {discipline.title}
        </h3>

        <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed mb-6 font-normal">
          {discipline.description}
        </p>
      </div>

      {/* Bottom Row: Topics & Link */}
      <div>
        <div className="flex flex-wrap gap-1.5 mb-5">
          {discipline.topics.map((t) => (
            <span
              key={t}
              className="text-[11px] font-mono px-2 py-0.5 rounded bg-zinc-100/90 dark:bg-muted/50 border border-zinc-200/80 dark:border-border/40 text-zinc-600 dark:text-muted-foreground group-hover:border-zinc-300 dark:group-hover:border-border/80 transition-colors"
            >
              {t}
            </span>
          ))}
        </div>

        <div
          className={cn(
            "flex items-center gap-1.5 text-xs font-semibold",
            discipline.accentText
          )}
        >
          <span>{discipline.ctaText}</span>
          <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
        </div>
      </div>
    </Link>
  );
}
