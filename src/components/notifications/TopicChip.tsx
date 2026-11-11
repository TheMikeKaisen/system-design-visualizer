"use client";

import React from "react";
import {
  Terminal,
  Cpu,
  Database,
  Layers,
  Server,
  Network,
  Sparkles,
  Check,
} from "lucide-react";
import { cn } from "@/lib/utils";

export type SubjectChannel =
  | "ALL"
  | "JAVASCRIPT"
  | "OPERATING_SYSTEMS"
  | "JAVA"
  | "COMPUTER_NETWORKS"
  | "BACKEND"
  | "FRONTEND";

export const SubjectChannel = {
  ALL: "ALL",
  JAVASCRIPT: "JAVASCRIPT",
  OPERATING_SYSTEMS: "OPERATING_SYSTEMS",
  JAVA: "JAVA",
  COMPUTER_NETWORKS: "COMPUTER_NETWORKS",
  BACKEND: "BACKEND",
  FRONTEND: "FRONTEND",
} as const;

export interface SubjectMetadata {
  channel: SubjectChannel;
  title: string;
  subtitle: string;
  icon: React.ComponentType<{ className?: string }>;
  accentColor: string;
  activeBorder: string;
  activeBg: string;
  activeText: string;
  checkBg: string;
}

export const SUBJECT_METADATA_MAP: Record<SubjectChannel, SubjectMetadata> = {
  ALL: {
    channel: "ALL",
    title: "All Disciplines",
    subtitle: "Complete Curriculum",
    icon: Sparkles,
    accentColor: "#6366f1",
    activeBorder: "border-indigo-500/70 dark:border-indigo-500/80 shadow-indigo-500/10",
    activeBg: "bg-indigo-500/10 dark:bg-indigo-500/20",
    activeText: "text-indigo-600 dark:text-indigo-400 font-semibold",
    checkBg: "bg-indigo-600 text-white",
  },
  JAVASCRIPT: {
    channel: "JAVASCRIPT",
    title: "JavaScript",
    subtitle: "Runtime Engine",
    icon: Terminal,
    accentColor: "#f59e0b",
    activeBorder: "border-amber-500/70 dark:border-amber-500/80 shadow-amber-500/10",
    activeBg: "bg-amber-500/10 dark:bg-amber-500/20",
    activeText: "text-amber-600 dark:text-amber-400 font-semibold",
    checkBg: "bg-amber-500 text-zinc-950",
  },
  OPERATING_SYSTEMS: {
    channel: "OPERATING_SYSTEMS",
    title: "Operating Systems",
    subtitle: "Kernel & CPU",
    icon: Cpu,
    accentColor: "#0ea5e9",
    activeBorder: "border-sky-500/70 dark:border-sky-500/80 shadow-sky-500/10",
    activeBg: "bg-sky-500/10 dark:bg-sky-500/20",
    activeText: "text-sky-600 dark:text-sky-400 font-semibold",
    checkBg: "bg-sky-500 text-zinc-950",
  },
  JAVA: {
    channel: "JAVA",
    title: "Java & JVM",
    subtitle: "Virtual Machine",
    icon: Database,
    accentColor: "#10b981",
    activeBorder: "border-emerald-500/70 dark:border-emerald-500/80 shadow-emerald-500/10",
    activeBg: "bg-emerald-500/10 dark:bg-emerald-500/20",
    activeText: "text-emerald-600 dark:text-emerald-400 font-semibold",
    checkBg: "bg-emerald-500 text-zinc-950",
  },
  FRONTEND: {
    channel: "FRONTEND",
    title: "Frontend Systems",
    subtitle: "Browser Internals",
    icon: Layers,
    accentColor: "#8b5cf6",
    activeBorder: "border-violet-500/70 dark:border-violet-500/80 shadow-violet-500/10",
    activeBg: "bg-violet-500/10 dark:bg-violet-500/20",
    activeText: "text-violet-600 dark:text-violet-400 font-semibold",
    checkBg: "bg-violet-600 text-white",
  },
  BACKEND: {
    channel: "BACKEND",
    title: "Backend Internals",
    subtitle: "Distributed Systems",
    icon: Server,
    accentColor: "#3b82f6",
    activeBorder: "border-blue-500/70 dark:border-blue-500/80 shadow-blue-500/10",
    activeBg: "bg-blue-500/10 dark:bg-blue-500/20",
    activeText: "text-blue-600 dark:text-blue-400 font-semibold",
    checkBg: "bg-blue-600 text-white",
  },
  COMPUTER_NETWORKS: {
    channel: "COMPUTER_NETWORKS",
    title: "Computer Networks",
    subtitle: "Protocols & Wire",
    icon: Network,
    accentColor: "#14b8a6",
    activeBorder: "border-teal-500/70 dark:border-teal-500/80 shadow-teal-500/10",
    activeBg: "bg-teal-500/10 dark:bg-teal-500/20",
    activeText: "text-teal-600 dark:text-teal-400 font-semibold",
    checkBg: "bg-teal-500 text-zinc-950",
  },
};

export interface TopicChipProps {
  subject: SubjectChannel;
  selected: boolean;
  onToggle: (subject: SubjectChannel) => void;
  disabled?: boolean;
  className?: string;
  isFullWidth?: boolean;
}

export function TopicChip({
  subject,
  selected,
  onToggle,
  disabled = false,
  className,
  isFullWidth = false,
}: TopicChipProps) {
  const meta = SUBJECT_METADATA_MAP[subject];
  const Icon = meta.icon;

  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={selected}
      aria-disabled={disabled}
      aria-label={`${meta.title} (${meta.subtitle})`}
      disabled={disabled}
      onClick={() => onToggle(subject)}
      className={cn(
        // Base ergonomics: minimum 44px touch target, tactile feedback
        "min-h-[44px] min-w-[44px] px-3.5 py-2.5 rounded-xl border text-left flex items-center justify-between gap-3",
        "touch-manipulation select-none transition-all duration-200",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-primary",
        "active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50",
        isFullWidth ? "w-full" : "w-full",
        selected
          ? cn("shadow-sm", meta.activeBg, meta.activeBorder, meta.activeText)
          : "bg-zinc-100/70 dark:bg-zinc-800/40 border-zinc-200/80 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200/60 dark:hover:bg-zinc-800/80 hover:border-zinc-300 dark:hover:border-zinc-700",
        className
      )}
    >
      <div className="flex items-center gap-2.5 min-w-0">
        <div
          className={cn(
            "w-7 h-7 rounded-lg flex items-center justify-center shrink-0 border transition-colors",
            selected
              ? "bg-white/60 dark:bg-zinc-900/60 border-current/30 text-current"
              : "bg-zinc-200/60 dark:bg-zinc-700/50 border-transparent text-zinc-500 dark:text-zinc-400"
          )}
        >
          <Icon className="w-3.5 h-3.5" />
        </div>
        <div className="flex flex-col truncate">
          <span className="text-xs font-medium tracking-tight truncate leading-tight">
            {meta.title}
          </span>
          <span className="text-[10px] text-muted-foreground truncate leading-tight">
            {meta.subtitle}
          </span>
        </div>
      </div>

      <div
        className={cn(
          "w-5 h-5 rounded-md flex items-center justify-center shrink-0 border transition-all duration-200",
          selected
            ? cn("border-transparent", meta.checkBg)
            : "border-zinc-300 dark:border-zinc-700 bg-transparent"
        )}
      >
        {selected && <Check className="w-3 h-3 stroke-[3]" data-testid="chip-check-icon" />}
      </div>
    </button>
  );
}
