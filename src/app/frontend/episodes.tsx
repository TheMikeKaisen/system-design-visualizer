import type { ReactNode } from "react";
import type { EpisodeAccent } from "@/components/ui/EpisodeCard";
import { Monitor, Workflow, Layers, Zap, Shield, Paintbrush, Link2 } from "lucide-react";

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

export const FRONTEND_EPISODES: EpisodeMetadata[] = [
  {
    id: "jsx-virtual-dom",
    episodeNumber: 1,
    title: "JSX & Virtual DOM",
    description: "Discover how React transforms components into a Virtual DOM tree.",
    date: "25 July 2026",
    href: "/frontend/episodes/1",
    accent: "violet",
    icon: <Monitor className="w-5 h-5" />,
  },
  {
    id: "props-state",
    episodeNumber: 2,
    title: "Props & State",
    description: "Visualize downward data flow and lifting state up.",
    date: "26 July 2026",
    href: "/frontend/episodes/2",
    accent: "violet",
    icon: <Workflow className="w-5 h-5" />,
  },
  {
    id: "usestate-batching",
    episodeNumber: 3,
    title: "useState Batching",
    description: "Watch React's update queue in real time and understand stale state.",
    date: "27 July 2026",
    href: "/frontend/episodes/3",
    accent: "violet",
    icon: <Layers className="w-5 h-5" />,
  },
  {
    id: "useeffect-pipeline",
    episodeNumber: 4,
    title: "useEffect Pipeline",
    description: "Trace the render → DOM update → paint → effect pipeline.",
    date: "28 July 2026",
    href: "/frontend/episodes/4",
    accent: "violet",
    icon: <Zap className="w-5 h-5" />,
  },
  {
    id: "cleanup-race-conditions",
    episodeNumber: 5,
    title: "Cleanup & Race Conditions",
    description: "Trace the cleanup lifecycle and watch network race conditions.",
    date: "29 July 2026",
    href: "/frontend/episodes/5",
    accent: "violet",
    icon: <Shield className="w-5 h-5" />,
  },
  {
    id: "uselayouteffect",
    episodeNumber: 6,
    title: "useLayoutEffect",
    description: "Watch the tooltip flicker bug appear and disappear.",
    date: "30 July 2026",
    href: "/frontend/episodes/6",
    accent: "violet",
    icon: <Paintbrush className="w-5 h-5" />,
  },
  {
    id: "useref-dom",
    episodeNumber: 7,
    title: "useRef & The DOM",
    description: "Persist values safely and access real DOM nodes without extra re-renders.",
    date: "31 July 2026",
    href: "/frontend/episodes/7",
    accent: "violet",
    icon: <Link2 className="w-5 h-5" />,
  },
];
