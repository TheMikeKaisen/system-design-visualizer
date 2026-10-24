import type { ReactNode } from "react";
import type { EpisodeAccent } from "@/components/ui/EpisodeCard";

export interface EpisodeMetadata {
  id: string;
  episodeNumber: number | string;
  title: string;
  description: string;
  date: string;
  href: string;
  icon: ReactNode;
  accent?: EpisodeAccent;
  badge?: string;
}

export const JAVASCRIPT_EPISODES: EpisodeMetadata[] = [
  {
    id: "call-stack",
    episodeNumber: 1,
    title: "Execution Contexts & Call Stack",
    description:
      "Watch exactly how JavaScript executes code. See functions get pushed to the stack, memory getting allocated during hoisting, and variables updating in real-time.",
    date: "13 July 2026",
    href: "/javascript/simulator/call-stack",
    accent: "amber",
    icon: (
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
        <line x1="12" y1="20" x2="12" y2="10" />
        <line x1="18" y1="20" x2="18" y2="4" />
        <line x1="6" y1="20" x2="6" y2="16" />
      </svg>
    ),
  },
  {
    id: "hoisting",
    episodeNumber: 2,
    title: "Hoisting & The TDZ",
    description:
      "Master the nuances of var vs let/const, function declarations vs expressions, and see the Temporal Dead Zone in action.",
    date: "14 July 2026",
    href: "/javascript/simulator/hoisting",
    accent: "amber",
    icon: (
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
        <path d="M12 19V5" />
        <path d="m5 12 7-7 7 7" />
      </svg>
    ),
  },
  {
    id: "scope",
    episodeNumber: 3,
    title: "Scope Chaining",
    description:
      "Watch exactly how JavaScript traverses the lexical environment to resolve variables, and understand shadowing.",
    date: "14 July 2026",
    href: "/javascript/simulator/scope",
    accent: "amber",
    icon: (
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
        <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
        <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
      </svg>
    ),
  },
  {
    id: "let-const",
    episodeNumber: 4,
    title: "let, const & var (TDZ)",
    description:
      "Discover the differences between declarations. See the Temporal Dead Zone block access, and learn about reassignment rules.",
    date: "14 July 2026",
    href: "/javascript/simulator/let-const",
    accent: "amber",
    icon: (
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
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      </svg>
    ),
  },
  {
    id: "block-scope",
    episodeNumber: 5,
    title: "Block Scope & Shadowing",
    description:
      "Variables live inside rooms, and JavaScript searches through rooms. Understand how blocks create scopes and shadowing.",
    date: "15 July 2026",
    href: "/javascript/simulator/block-scope",
    accent: "amber",
    icon: (
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
        <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
        <line x1="9" y1="3" x2="9" y2="21" />
      </svg>
    ),
  },
  {
    id: "closures",
    episodeNumber: 6,
    title: "Closures & Callbacks",
    description:
      "See exactly how a function retains access to its lexical scope even after its outer function has finished executing. Learn data hiding and Web APIs.",
    date: "16 July 2026",
    href: "/javascript/simulator/closures",
    accent: "amber",
    icon: (
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
        <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
        <polyline points="3.29 7 12 12 20.71 7" />
        <line x1="12" y1="22" x2="12" y2="12" />
      </svg>
    ),
  },
  {
    id: "event-loop",
    episodeNumber: 7,
    title: "The Event Loop & Web APIs",
    description:
      "Watch asynchronous JavaScript in action. See how the Event Loop coordinates the Microtask Queue, Callback Queue, and Call Stack.",
    date: "17 July 2026",
    href: "/javascript/simulator/event-loop",
    accent: "amber",
    icon: (
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
        <circle cx="12" cy="12" r="10" />
        <polyline points="12 6 12 12 16 14" />
      </svg>
    ),
  },
];
