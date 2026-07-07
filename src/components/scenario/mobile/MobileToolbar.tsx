"use client";
import Link from "next/link";
import { useState } from "react";
import { MobileMenu } from "./MobileMenu";

interface MobileToolbarProps {
  backHref?: string;
  logoSrc?: string;
  product?: string;
  lesson?: string;
  experiments?: { id: string; label: string; description: string }[];
}

export function MobileToolbar({
  backHref,
  logoSrc,
  product,
  lesson,
  experiments = [],
}: MobileToolbarProps) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <>
      <header className="sm:hidden h-11 border-b border-white/10 bg-background/95 backdrop-blur flex items-center justify-between px-3 z-50 shrink-0">
        {/* Left — back arrow */}
        <Link
          href={backHref || "/"}
          className="text-muted-foreground hover:text-foreground transition-colors p-1"
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="m15 18-6-6 6-6" />
          </svg>
        </Link>

        {/* Center — logo + title */}
        <div className="flex items-center gap-2 min-w-0">
          {logoSrc ? (
            <div className="w-6 h-6 shrink-0 flex items-center justify-center bg-white rounded-sm p-0.5">
              <img
                src={logoSrc}
                alt="Logo"
                className="w-full h-full object-contain"
              />
            </div>
          ) : null}
          <div className="flex flex-col min-w-0">
            {product && (
              <span className="text-[8px] font-bold uppercase tracking-widest text-muted-foreground leading-none truncate">
                {product}
              </span>
            )}
            {lesson && (
              <span className="text-xs font-semibold text-foreground leading-none truncate">
                {lesson}
              </span>
            )}
          </div>
        </div>

        {/* Right — hamburger */}
        <button
          onClick={() => setMenuOpen(true)}
          className="text-muted-foreground hover:text-foreground transition-colors p-1"
          aria-label="Open menu"
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <line x1="3" y1="12" x2="21" y2="12" />
            <line x1="3" y1="6" x2="21" y2="6" />
            <line x1="3" y1="18" x2="21" y2="18" />
          </svg>
        </button>
      </header>

      {menuOpen && (
        <MobileMenu experiments={experiments} onClose={() => setMenuOpen(false)} />
      )}
    </>
  );
}
