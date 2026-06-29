"use client";

/**
 * HeroVisual — An abstract, animated SVG composition that previews
 * the system design canvas: servers, load balancers, databases,
 * caches, and flowing request packets.
 *
 * Pure SVG + CSS animations. Zero JS animation libraries.
 */
export function HeroVisual({ className }: { className?: string }) {
  /* ── Muted palette ──────────────────────────────────────── */
  const slate = {
    node:       "var(--color-foreground)",
    nodeFill:   "var(--color-muted)",
    border:     "var(--color-border)",
    line:       "var(--color-muted-foreground)",
    accent:     "oklch(0.55 0.12 260)",   /* muted indigo */
    accentSoft: "oklch(0.55 0.12 260 / 0.15)",
    packet:     "oklch(0.6 0.14 260)",
    packet2:    "oklch(0.55 0.1 200)",
    text:       "var(--color-muted-foreground)",
  };

  return (
    <div className={className} aria-hidden="true">
      <svg
        viewBox="0 0 560 420"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-auto"
        role="img"
        aria-label="Abstract system architecture visualization"
      >
        {/* ── Background grid dots ──────────────────────────── */}
        <defs>
          <pattern id="hero-dots" x="0" y="0" width="28" height="28" patternUnits="userSpaceOnUse">
            <circle cx="14" cy="14" r="0.8" fill={slate.border} opacity="0.5" />
          </pattern>
          {/* Gradient for glow effects */}
          <radialGradient id="node-glow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor={slate.accent} stopOpacity="0.08" />
            <stop offset="100%" stopColor={slate.accent} stopOpacity="0" />
          </radialGradient>
        </defs>
        <rect width="560" height="420" fill="url(#hero-dots)" opacity="0.6" />

        {/* ── Connection lines (drawn before nodes) ─────────── */}
        {/* Client → Load Balancer */}
        <path
          d="M 130 110 C 180 110, 200 170, 230 190"
          stroke={slate.line}
          strokeWidth="1.2"
          strokeDasharray="4 3"
          opacity="0.3"
          className="stroke-animate"
        />
        {/* LB → Service 1 */}
        <path
          id="path-lb-s1"
          d="M 280 190 C 310 170, 340 140, 370 130"
          stroke={slate.line}
          strokeWidth="1.2"
          strokeDasharray="4 3"
          opacity="0.3"
          className="stroke-animate"
          style={{ animationDelay: "0.3s" }}
        />
        {/* LB → Service 2 */}
        <path
          id="path-lb-s2"
          d="M 280 210 C 310 230, 340 250, 370 260"
          stroke={slate.line}
          strokeWidth="1.2"
          strokeDasharray="4 3"
          opacity="0.3"
          className="stroke-animate"
          style={{ animationDelay: "0.4s" }}
        />
        {/* Service 1 → Database */}
        <path
          id="path-s1-db"
          d="M 420 130 C 440 140, 450 160, 460 195"
          stroke={slate.line}
          strokeWidth="1.2"
          strokeDasharray="4 3"
          opacity="0.3"
          className="stroke-animate"
          style={{ animationDelay: "0.6s" }}
        />
        {/* Service 1 → Cache */}
        <path
          id="path-s1-cache"
          d="M 420 120 C 430 90, 440 70, 460 60"
          stroke={slate.line}
          strokeWidth="1.2"
          strokeDasharray="4 3"
          opacity="0.3"
          className="stroke-animate"
          style={{ animationDelay: "0.5s" }}
        />
        {/* Service 2 → Queue */}
        <path
          id="path-s2-q"
          d="M 420 260 C 440 270, 450 300, 460 320"
          stroke={slate.line}
          strokeWidth="1.2"
          strokeDasharray="4 3"
          opacity="0.3"
          className="stroke-animate"
          style={{ animationDelay: "0.7s" }}
        />

        {/* ── Full path for packets (Client → LB → S1 → DB) ── */}
        <path
          id="packet-path-1"
          d="M 130 110 C 180 110, 200 170, 250 190 C 280 190, 310 170, 370 130 C 400 130, 440 150, 460 195"
          stroke="none"
          fill="none"
        />
        {/* Packet path 2: Client → LB → S2 → Queue */}
        <path
          id="packet-path-2"
          d="M 130 110 C 180 110, 200 170, 250 200 C 280 210, 310 230, 370 260 C 400 270, 440 300, 460 320"
          stroke="none"
          fill="none"
        />
        {/* Packet path 3: S1 → Cache */}
        <path
          id="packet-path-3"
          d="M 400 120 C 420 100, 440 80, 465 60"
          stroke="none"
          fill="none"
        />

        {/* ── Animated packets ──────────────────────────────── */}
        <circle
          r="4"
          fill={slate.packet}
          className="packet-dot"
          style={{ offsetPath: `path("M 130 110 C 180 110, 200 170, 250 190 C 280 190, 310 170, 370 130 C 400 130, 440 150, 460 195")` }}
        />
        <circle
          r="3.5"
          fill={slate.packet2}
          className="packet-dot-alt"
          style={{ offsetPath: `path("M 130 110 C 180 110, 200 170, 250 200 C 280 210, 310 230, 370 260 C 400 270, 440 300, 460 320")` }}
        />
        <circle
          r="3"
          fill={slate.packet}
          className="packet-dot-slow"
          style={{ offsetPath: `path("M 400 120 C 420 100, 440 80, 465 60")` }}
        />

        {/* ═════════════════════════════════════════════════════
            NODES
            ═════════════════════════════════════════════════════ */}

        {/* ── Client node ───────────────────────────────────── */}
        <g className="float-gentle">
          <circle cx="112" cy="110" r="36" fill="url(#node-glow)" />
          <rect x="88" y="86" width="48" height="48" rx="12" fill={slate.nodeFill} stroke={slate.border} strokeWidth="1" />
          {/* User icon */}
          <circle cx="112" cy="103" r="6" stroke={slate.node} strokeWidth="1.2" fill="none" />
          <path d="M 100 124 C 100 116 106 112 112 112 C 118 112 124 116 124 124" stroke={slate.node} strokeWidth="1.2" fill="none" strokeLinecap="round" />
          <text x="112" y="150" textAnchor="middle" fill={slate.text} fontSize="10" fontFamily="var(--font-geist-sans)" fontWeight="500">Client</text>
        </g>

        {/* ── Load Balancer ──────────────────────────────────── */}
        <g className="float-gentle-delayed">
          <circle cx="255" cy="200" r="36" fill="url(#node-glow)" />
          <rect x="231" y="176" width="48" height="48" rx="12" fill={slate.nodeFill} stroke={slate.accent} strokeWidth="1.2" />
          {/* LB icon: branching */}
          <circle cx="255" cy="190" r="4" stroke={slate.accent} strokeWidth="1.2" fill="none" />
          <line x1="255" y1="194" x2="255" y2="200" stroke={slate.accent} strokeWidth="1.2" />
          <line x1="255" y1="200" x2="244" y2="210" stroke={slate.accent} strokeWidth="1.2" strokeLinecap="round" />
          <line x1="255" y1="200" x2="266" y2="210" stroke={slate.accent} strokeWidth="1.2" strokeLinecap="round" />
          <circle cx="244" cy="212" r="2.5" stroke={slate.accent} strokeWidth="1" fill="none" />
          <circle cx="266" cy="212" r="2.5" stroke={slate.accent} strokeWidth="1" fill="none" />
          <text x="255" y="240" textAnchor="middle" fill={slate.text} fontSize="10" fontFamily="var(--font-geist-sans)" fontWeight="500">Load Balancer</text>
          {/* Pulse ring */}
          <circle cx="255" cy="200" r="24" stroke={slate.accent} strokeWidth="0.5" fill="none" className="pulse-ring" />
        </g>

        {/* ── Service 1 ─────────────────────────────────────── */}
        <g className="float-gentle-slow">
          <rect x="370" y="106" width="48" height="48" rx="10" fill={slate.nodeFill} stroke={slate.border} strokeWidth="1" />
          {/* Server icon */}
          <rect x="382" y="118" width="24" height="8" rx="2" stroke={slate.node} strokeWidth="1" fill="none" />
          <rect x="382" y="130" width="24" height="8" rx="2" stroke={slate.node} strokeWidth="1" fill="none" />
          <circle cx="386" cy="122" r="1" fill={slate.accent} />
          <circle cx="386" cy="134" r="1" fill={slate.accent} />
          <text x="394" y="170" textAnchor="middle" fill={slate.text} fontSize="10" fontFamily="var(--font-geist-sans)" fontWeight="500">Service</text>
        </g>

        {/* ── Service 2 ─────────────────────────────────────── */}
        <g className="float-gentle">
          <rect x="370" y="236" width="48" height="48" rx="10" fill={slate.nodeFill} stroke={slate.border} strokeWidth="1" />
          <rect x="382" y="248" width="24" height="8" rx="2" stroke={slate.node} strokeWidth="1" fill="none" />
          <rect x="382" y="260" width="24" height="8" rx="2" stroke={slate.node} strokeWidth="1" fill="none" />
          <circle cx="386" cy="252" r="1" fill={slate.accent} />
          <circle cx="386" cy="264" r="1" fill={slate.accent} />
          <text x="394" y="300" textAnchor="middle" fill={slate.text} fontSize="10" fontFamily="var(--font-geist-sans)" fontWeight="500">Service</text>
        </g>

        {/* ── Database (cylinder) ────────────────────────────── */}
        <g className="float-gentle-delayed">
          <circle cx="475" cy="210" r="30" fill="url(#node-glow)" />
          <ellipse cx="475" cy="195" rx="18" ry="7" fill={slate.nodeFill} stroke={slate.border} strokeWidth="1" />
          <path d="M 457 195 L 457 222 C 457 226 465 230 475 230 C 485 230 493 226 493 222 L 493 195" stroke={slate.border} strokeWidth="1" fill={slate.nodeFill} />
          <ellipse cx="475" cy="222" rx="18" ry="7" fill="none" stroke={slate.border} strokeWidth="1" />
          <ellipse cx="475" cy="208" rx="18" ry="5" fill="none" stroke={slate.border} strokeWidth="0.6" opacity="0.4" />
          <text x="475" y="248" textAnchor="middle" fill={slate.text} fontSize="10" fontFamily="var(--font-geist-sans)" fontWeight="500">Database</text>
        </g>

        {/* ── Cache ──────────────────────────────────────────── */}
        <g className="float-gentle-slow">
          <rect x="450" y="38" width="44" height="40" rx="8" fill={slate.nodeFill} stroke={slate.border} strokeWidth="1" />
          <rect x="459" y="48" width="26" height="8" rx="2" stroke={slate.node} strokeWidth="0.8" fill="none" />
          <rect x="459" y="60" width="26" height="8" rx="2" stroke={slate.node} strokeWidth="0.8" fill="none" />
          <circle cx="463" cy="52" r="1" fill={slate.packet} />
          <circle cx="463" cy="64" r="1" fill={slate.packet} />
          <text x="472" y="92" textAnchor="middle" fill={slate.text} fontSize="10" fontFamily="var(--font-geist-sans)" fontWeight="500">Cache</text>
        </g>

        {/* ── Message Queue ──────────────────────────────────── */}
        <g className="float-gentle-delayed">
          <rect x="445" y="308" width="48" height="38" rx="8" fill={slate.nodeFill} stroke={slate.border} strokeWidth="1" />
          {/* Queue lines */}
          <line x1="456" y1="320" x2="482" y2="320" stroke={slate.node} strokeWidth="1" strokeLinecap="round" />
          <line x1="456" y1="327" x2="476" y2="327" stroke={slate.node} strokeWidth="1" strokeLinecap="round" />
          <line x1="456" y1="334" x2="479" y2="334" stroke={slate.node} strokeWidth="1" strokeLinecap="round" />
          <text x="469" y="360" textAnchor="middle" fill={slate.text} fontSize="10" fontFamily="var(--font-geist-sans)" fontWeight="500">Queue</text>
        </g>

        {/* ── Subtle decorative ring ────────────────────────── */}
        <circle cx="280" cy="210" r="160" stroke={slate.border} strokeWidth="0.5" fill="none" opacity="0.2" strokeDasharray="6 4" />
      </svg>
    </div>
  );
}
