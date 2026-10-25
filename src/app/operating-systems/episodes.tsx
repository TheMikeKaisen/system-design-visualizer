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

export const OPERATING_SYSTEMS_EPISODES: EpisodeMetadata[] = [
  {
    id: "process-states",
    episodeNumber: 1,
    title: "Process Lifecycle & Scheduling",
    description:
      "Watch Chrome, Spotify, and VS Code compete for the CPU. See how schedulers manage process states, I/O waiting, and preemptive vs non-preemptive scheduling.",
    date: "20 July 2026",
    href: "/operating-systems/simulator/process-states",
    accent: "sky",
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
        <path d="M8 12h8" />
        <path d="M12 8v8" />
      </svg>
    ),
  },
  {
    id: "cpu-scheduling",
    episodeNumber: 2,
    title: "CPU Scheduling Deep-Dive",
    description:
      "Compare FCFS and Round Robin with real-time queues. See how time quantums affect context switching and fairness.",
    date: "20 July 2026",
    href: "/operating-systems/simulator/cpu-scheduling",
    accent: "sky",
    icon: (
      <svg
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      >
        <rect x="3" y="3" width="18" height="18" rx="2" />
        <path d="M3 9h18" />
        <path d="M9 21V9" />
      </svg>
    ),
  },
  {
    id: "process-control-block",
    episodeNumber: 3,
    title: "Process Control Blocks (PCB)",
    description:
      "Dive into kernel memory. Explore the anatomy of a PCB and see how the OS performs Context Switches.",
    date: "21 July 2026",
    href: "/operating-systems/simulator/process-control-block",
    accent: "sky",
    icon: (
      <svg
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      >
        <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
        <polyline points="22,6 12,13 2,6" />
      </svg>
    ),
  },
  {
    id: "universal-cpu-scheduler",
    episodeNumber: 4,
    title: "CPU Schedulers",
    description:
      "A universal engine supporting FCFS, SJF, SRTF and RR scheduling. Compare algorithms side-by-side with identical inputs.",
    date: "22 July 2026",
    href: "/operating-systems/simulator/cpu-scheduling",
    accent: "sky",
    icon: (
      <svg
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      >
        <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
        <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
        <line x1="12" y1="22.08" x2="12" y2="12" />
      </svg>
    ),
  },
  {
    id: "producer-consumer",
    episodeNumber: 5,
    title: "Producer-Consumer Problem",
    description:
      "Visualize the Lost Update Problem and Race Conditions when threads access shared memory without synchronization.",
    date: "2 August 2026",
    href: "/operating-systems/simulator/producer-consumer",
    accent: "sky",
    icon: (
      <svg
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      >
        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    ),
  },
  {
    id: "printer-spooler",
    episodeNumber: 6,
    title: "Printer Spooler Problem",
    description:
      "Watch how two processes overwrite each other's print job when the shared spooler directory is accessed without synchronization.",
    date: "5 August 2026",
    href: "/operating-systems/simulator/printer-spooler",
    accent: "sky",
    icon: (
      <svg
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      >
        <path d="M6 9V2h12v7" />
        <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
        <path d="M6 14h12v8H6z" />
      </svg>
    ),
  },
  {
    id: "lock-variables",
    episodeNumber: 7,
    title: "Lock Variables",
    description:
      "See why a naive lock variable fails due to a race in the check-and-set gap, then watch how the atomic TSL hardware instruction solves it.",
    date: "5 August 2026",
    href: "/operating-systems/simulator/lock-variables",
    accent: "sky",
    icon: (
      <svg
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      >
        <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
        <path d="M7 11V7a5 5 0 0 1 10 0v4" />
      </svg>
    ),
  },
];
