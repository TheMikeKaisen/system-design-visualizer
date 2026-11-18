import type { ReactNode } from "react";
import type { EpisodeAccent } from "@/components/ui/EpisodeCard";
import { ShieldCheck } from "lucide-react";

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
  launchLabel?: string;
}

export const CLOUD_EPISODES: EpisodeMetadata[] = [
  {
    id: "aws-iam",
    episodeNumber: 1,
    title: "AWS IAM: Who Gets Access to What?",
    description:
      "Watch the AWS IAM evaluation engine process API requests in real time. Explore Least Privilege, the Default Deny baseline, and witness the explicit Deny circuit breaker override AdministratorAccess.",
    date: "2026-11-15",
    href: "/cloud/simulator/aws-iam",
    accent: "orange",
    icon: <ShieldCheck className="w-5 h-5" />,
  },
];
