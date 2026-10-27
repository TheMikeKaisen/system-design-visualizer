import React from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

export interface EditorialDisciplineProps {
  id: string;
  title: string;
  eyebrow: string;
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
  className?: string;
}

export function EditorialDisciplineCard({
  title,
  eyebrow,
  badge,
  description,
  topics,
  icon: Icon,
  accentColor,
  accentBg,
  accentBorder,
  accentText,
  ctaText,
  href,
  className,
}: EditorialDisciplineProps) {
  return (
    <Link
      href={href}
      className={cn(
        "group relative flex flex-col justify-between p-6 sm:p-7 rounded-2xl border bg-white dark:bg-zinc-900/70 backdrop-blur-sm transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] hover:-translate-y-0.5 hover:shadow-xl hover:shadow-black/10 dark:hover:shadow-black/40 overflow-hidden shadow-[0_2px_10px_rgba(0,0,0,0.03)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 dark:focus-visible:ring-offset-zinc-950",
        accentBorder,
        className
      )}
    >
      {/* Top hairline highlight on hover */}
      <div
        className="absolute top-0 left-6 right-6 h-[1.5px] opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
        style={{
          background: `linear-gradient(90deg, transparent, ${accentColor}, transparent)`,
        }}
        aria-hidden="true"
      />

      <div>
        {/* Top Row: Icon + Eyebrow + Badge */}
        <div className="flex items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-3">
            <div
              className={cn(
                "w-10 h-10 rounded-xl flex items-center justify-center transition-transform group-hover:scale-105 duration-300 border border-current/20 shadow-sm shrink-0",
                accentBg,
                accentText
              )}
            >
              <Icon className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[11px] font-mono uppercase tracking-wider text-zinc-500 dark:text-zinc-400 block font-semibold">
                {eyebrow}
              </span>
              <h3 className="text-lg sm:text-xl font-bold text-foreground group-hover:text-primary transition-colors tracking-tight">
                {title}
              </h3>
            </div>
          </div>

          <span className="text-xs font-mono font-medium px-2.5 py-1 rounded-full bg-zinc-100 dark:bg-muted/60 text-zinc-700 dark:text-zinc-300 border border-zinc-200/80 dark:border-border/40 shrink-0">
            {badge.includes("Episode") ? badge : `${badge} ${badge === "1" ? "Episode" : "Episodes"}`}
          </span>
        </div>

        {/* Description (concise, active voice) */}
        <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed mb-6 font-normal">
          {description}
        </p>
      </div>

      <div>
        {/* Curated high-signal domain topics */}
        <div className="flex flex-wrap gap-1.5 mb-5">
          {topics.map((t) => (
            <span
              key={t}
              className="text-[11px] font-mono px-2 py-0.5 rounded bg-zinc-100/90 dark:bg-muted/50 border border-zinc-200/80 dark:border-border/40 text-zinc-600 dark:text-zinc-300 group-hover:border-zinc-300 dark:group-hover:border-border/80 transition-colors"
            >
              {t}
            </span>
          ))}
        </div>

        {/* CTA */}
        <div
          className={cn(
            "flex items-center gap-1.5 text-xs sm:text-sm font-semibold pt-3 border-t border-border/40",
            accentText
          )}
        >
          <span>{ctaText}</span>
          <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
        </div>
      </div>
    </Link>
  );
}
