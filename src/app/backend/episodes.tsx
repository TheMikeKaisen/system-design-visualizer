import type { ReactNode } from "react";
import type { EpisodeAccent } from "@/components/ui/EpisodeCard";
import { Server, Activity, Database } from "lucide-react";

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

export const BACKEND_EPISODES: EpisodeMetadata[] = [
  {
    id: "node-architecture",
    episodeNumber: 1,
    title: "Node Architecture",
    description: "What happens when you type node server.js? Threads, V8, and libuv.",
    date: "29 July 2026",
    href: "/backend/episodes/1",
    accent: "emerald",
    icon: <Server className="w-5 h-5" />,
  },
  {
    id: "blocking-vs-non-blocking",
    episodeNumber: 2,
    title: "Blocking vs Non-Blocking",
    description: "Compare a frozen server against Node's instant handoffs.",
    date: "29 July 2026",
    href: "/backend/episodes/2",
    accent: "emerald",
    icon: <Activity className="w-5 h-5" />,
  },
  {
    id: "event-loop-phases",
    episodeNumber: 3,
    title: "Event Loop Phases",
    description: "Trace nextTick, Microtasks, and the 5 libuv phases step by step.",
    date: "29 July 2026",
    href: "/backend/episodes/3",
    accent: "emerald",
    icon: <Database className="w-5 h-5" />,
  },
];
