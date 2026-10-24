import React from "react";

export interface LogoProps {
  size?: number;
  className?: string;
}

/**
 * System Simulator brand mark: "The Isometric Strata & Core"
 * Represents multi-layered computational systems (Application, Runtime/Kernel, Distributed Infrastructure)
 * anchored by an active execution nucleus.
 */
export function Logo({ size = 28, className }: LogoProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      {/* Infrastructure Foundation & Outer Chassis */}
      <path
        d="M5 9.5V22.5L16 28.75L27 22.5V9.5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity="0.35"
      />

      {/* Central Execution Spine */}
      <path
        d="M16 15.75V28.75"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        opacity="0.45"
      />

      {/* Intermediate Runtime Strata Shelf (Kernel / Memory boundary) */}
      <path
        d="M5 16L16 22.25L27 16"
        stroke="currentColor"
        strokeWidth="1.25"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity="0.55"
      />

      {/* Top Application Stratum Facet */}
      <path
        d="M16 3.25L27 9.5L16 15.75L5 9.5Z"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Active Execution Nucleus (Amber Core) */}
      <polygon
        points="16,6.25 21,9.5 16,12.75 11,9.5"
        className="fill-amber-500 dark:fill-amber-400"
      />
      <circle
        cx="16"
        cy="9.5"
        r="1.5"
        className="fill-white dark:fill-amber-100"
      />
    </svg>
  );
}
