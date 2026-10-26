"use client";

import React from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { Logo } from "@/components/ui/Logo";
import { ThemeToggle } from "@/components/ThemeToggle";
import { cn } from "@/lib/utils";

export interface AppNavbarProps {
  /** Optional back breadcrumb link to render next to theme toggle or brand */
  backLink?: {
    href: string;
    label: string;
  };
  /** Optional center navigation elements (e.g. anchor links or search) */
  centerContent?: React.ReactNode;
  /** Whether to show the primary Canvas Studio CTA button (default: true) */
  showCanvasCta?: boolean;
  className?: string;
}

export function AppNavbar({
  backLink,
  centerContent,
  showCanvasCta = true,
  className,
}: AppNavbarProps) {
  return (
    <nav
      className={cn(
        "fixed top-0 left-0 right-0 z-50 border-b border-border/60 bg-[#FAFAF9]/85 dark:bg-[#090a0f]/85 backdrop-blur-xl transition-all",
        className
      )}
      aria-label="Main navigation"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 h-16 flex items-center justify-between">
        {/* Brand */}
        <Link
          href="/"
          className="flex items-center gap-2.5 group shrink-0"
          aria-label="System Simulator home"
        >
          <Logo size={28} />
          <span className="text-base font-semibold tracking-tight text-[#0A0A0A] dark:text-zinc-50 group-hover:text-primary transition-colors">
            System Simulator
          </span>
        </Link>

        {/* Center Content */}
        {centerContent && (
          <div className="hidden md:flex items-center gap-7 text-xs font-medium text-zinc-600 dark:text-zinc-400">
            {centerContent}
          </div>
        )}

        {/* Right Actions */}
        <div className="flex items-center gap-3">
          {backLink && (
            <Link
              href={backLink.href}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-zinc-600 dark:text-zinc-400 hover:text-foreground transition-colors group"
            >
              <ArrowLeft className="w-3.5 h-3.5 transition-transform group-hover:-translate-x-0.5" />
              <span>{backLink.label}</span>
            </Link>
          )}

          <ThemeToggle />

          {showCanvasCta && (
            <Link
              href="/canvas"
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-primary-foreground bg-primary rounded-xl hover:opacity-90 shadow-sm transition-all focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring active:scale-[0.98]"
            >
              <span>
                <span className="hidden sm:inline">Open </span>Canvas Studio
              </span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}
