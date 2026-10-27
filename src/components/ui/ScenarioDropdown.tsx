"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, Check } from "lucide-react";
import { cn } from "@/lib/utils";

export interface ScenarioOption {
  id: string;
  title: string;
  description?: string;
  badge?: string;
}

export interface ScenarioDropdownProps<T extends ScenarioOption = ScenarioOption> {
  scenarios: T[];
  activeScenarioId: string;
  onSelect: (scenario: T) => void;
  label?: string;
  className?: string;
  triggerClassName?: string;
  menuClassName?: string;
  accentColor?: "teal" | "amber" | "sky" | "emerald" | "violet" | "blue";
  ariaLabel?: string;
}

const ACCENT_STYLES = {
  teal: {
    ring: "focus-visible:ring-teal-400 focus:ring-teal-400",
    borderActive: "border-teal-500/50",
    textActive: "text-teal-300",
    bgActive: "bg-teal-500/10",
    indicator: "bg-teal-400",
  },
  amber: {
    ring: "focus-visible:ring-amber-400 focus:ring-amber-400",
    borderActive: "border-amber-500/50",
    textActive: "text-amber-300",
    bgActive: "bg-amber-500/10",
    indicator: "bg-amber-400",
  },
  sky: {
    ring: "focus-visible:ring-sky-400 focus:ring-sky-400",
    borderActive: "border-sky-500/50",
    textActive: "text-sky-300",
    bgActive: "bg-sky-500/10",
    indicator: "bg-sky-400",
  },
  emerald: {
    ring: "focus-visible:ring-emerald-400 focus:ring-emerald-400",
    borderActive: "border-emerald-500/50",
    textActive: "text-emerald-300",
    bgActive: "bg-emerald-500/10",
    indicator: "bg-emerald-400",
  },
  violet: {
    ring: "focus-visible:ring-violet-400 focus:ring-violet-400",
    borderActive: "border-violet-500/50",
    textActive: "text-violet-300",
    bgActive: "bg-violet-500/10",
    indicator: "bg-violet-400",
  },
  blue: {
    ring: "focus-visible:ring-blue-400 focus:ring-blue-400",
    borderActive: "border-blue-500/50",
    textActive: "text-blue-300",
    bgActive: "bg-blue-500/10",
    indicator: "bg-blue-400",
  },
};

export function ScenarioDropdown<T extends ScenarioOption = ScenarioOption>({
  scenarios,
  activeScenarioId,
  onSelect,
  label = "Scenario:",
  className,
  triggerClassName,
  menuClassName,
  accentColor = "teal",
  ariaLabel = "Select simulation scenario",
}: ScenarioDropdownProps<T>) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  const activeScenario = scenarios.find((s) => s.id === activeScenarioId) ?? scenarios[0];
  const accent = ACCENT_STYLES[accentColor] ?? ACCENT_STYLES.teal;

  // Close on outside click
  const handleOutsideClick = useCallback((e: MouseEvent | TouchEvent) => {
    if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
      setIsOpen(false);
    }
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    document.addEventListener("mousedown", handleOutsideClick);
    document.addEventListener("touchstart", handleOutsideClick);
    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
      document.removeEventListener("touchstart", handleOutsideClick);
    };
  }, [isOpen, handleOutsideClick]);

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      setIsOpen(false);
      triggerRef.current?.focus();
      return;
    }

    if (e.key === "ArrowDown" && !isOpen) {
      e.preventDefault();
      setIsOpen(true);
      return;
    }

    if (isOpen && (e.key === "ArrowDown" || e.key === "ArrowUp")) {
      e.preventDefault();
      const currentIndex = scenarios.findIndex((s) => s.id === activeScenarioId);
      const nextIndex =
        e.key === "ArrowDown"
          ? (currentIndex + 1) % scenarios.length
          : (currentIndex - 1 + scenarios.length) % scenarios.length;
      const target = scenarios[nextIndex];
      if (target) {
        onSelect(target);
      }
    }
  };

  return (
    <div
      ref={containerRef}
      onKeyDown={handleKeyDown}
      className={cn("relative inline-flex items-center text-xs font-mono", className)}
    >
      {label && (
        <span className="text-zinc-500 text-[11px] font-sans mr-2 hidden md:inline select-none">
          {label}
        </span>
      )}

      {/* Trigger Button */}
      <button
        ref={triggerRef}
        type="button"
        role="combobox"
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-controls="scenario-listbox-menu"
        aria-label={ariaLabel}
        onClick={() => setIsOpen((prev) => !prev)}
        className={cn(
          "flex items-center justify-between gap-2 px-2.5 sm:px-3 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800/90 border transition-all text-left",
          "focus:outline-none focus-visible:ring-2",
          "active:scale-[0.98] transition-transform duration-100",
          "max-w-[190px] xs:max-w-[240px] sm:max-w-[320px] md:max-w-md",
          "touch-manipulation",
          isOpen
            ? cn("border-zinc-600 bg-zinc-800 text-zinc-100 shadow-sm", accent.ring)
            : "border-zinc-700/80 text-zinc-200 hover:border-zinc-600",
          triggerClassName
        )}
      >
        <span className="truncate font-sans font-medium text-xs">
          {activeScenario?.title ?? "Choose Scenario"}
        </span>

        <ChevronDown
          className={cn(
            "w-3.5 h-3.5 text-zinc-400 shrink-0 transition-transform duration-200",
            isOpen && "rotate-180 text-zinc-200"
          )}
          aria-hidden="true"
        />
      </button>

      {/* Dropdown Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.97 }}
            transition={{ duration: 0.14, ease: [0.16, 1, 0.3, 1] }}
            role="listbox"
            id="scenario-listbox-menu"
            aria-label={ariaLabel}
            className={cn(
              "absolute top-[calc(100%+6px)] right-0 z-50",
              "w-[calc(100vw-2rem)] max-w-sm sm:w-80",
              "bg-[#090b10] border border-zinc-700/80 rounded-xl shadow-[0_16px_40px_rgba(0,0,0,0.7)]",
              "p-1.5 backdrop-blur-xl overflow-hidden font-sans",
              menuClassName
            )}
          >
            {/* Header info bar */}
            <div className="flex items-center justify-between px-2.5 py-1.5 mb-1 border-b border-zinc-800/80 text-[10px] font-mono uppercase tracking-wider text-zinc-400 select-none">
              <span>Simulation Scenarios</span>
              <span className="text-zinc-500">{scenarios.length} available</span>
            </div>

            {/* Scenario Options List */}
            <div className="max-h-[60vh] sm:max-h-72 overflow-y-auto space-y-1 custom-scrollbar">
              {scenarios.map((s) => {
                const isSelected = s.id === activeScenarioId;

                return (
                  <button
                    key={s.id}
                    type="button"
                    role="option"
                    aria-selected={isSelected}
                    onClick={() => {
                      onSelect(s);
                      setIsOpen(false);
                      triggerRef.current?.focus();
                    }}
                    className={cn(
                      "w-full text-left px-3 py-2.5 rounded-lg transition-all flex items-start gap-2.5 group",
                      "touch-manipulation",
                      isSelected
                        ? cn(accent.bgActive, accent.textActive, "font-semibold border border-current/20")
                        : "text-zinc-300 hover:bg-zinc-800/80 hover:text-zinc-100 border border-transparent"
                    )}
                  >
                    <div className="pt-0.5 shrink-0">
                      {isSelected ? (
                        <div className={cn("w-4 h-4 rounded-full flex items-center justify-center", accent.bgActive)}>
                          <Check className="w-3 h-3 text-current" />
                        </div>
                      ) : (
                        <div className="w-4 h-4 rounded-full border border-zinc-700 group-hover:border-zinc-500" />
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-medium truncate block leading-snug">
                          {s.title}
                        </span>
                        {s.badge && (
                          <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-400 border border-zinc-700/60 shrink-0">
                            {s.badge}
                          </span>
                        )}
                      </div>

                      {s.description && (
                        <p className="text-[11px] text-zinc-400 leading-tight mt-0.5 line-clamp-2 font-normal">
                          {s.description}
                        </p>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
