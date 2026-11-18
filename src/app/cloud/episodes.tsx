import type { ReactNode } from "react";
import type { EpisodeAccent } from "@/components/ui/EpisodeCard";
import { ShieldCheck, Server } from "lucide-react";

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
  {
    id: "aws-ec2",
    episodeNumber: 2,
    title: "Amazon EC2: The Invisible Handshake",
    description:
      "Step inside the wire of an Amazon EC2 SSH connection. Demystify public and private IPv4 routing, VPC Internet Gateways, Security Groups, the .pem key container, and zero-knowledge cryptographic signature verification.",
    date: "2026-11-19",
    href: "/cloud/simulator/aws-ec2",
    accent: "orange",
    icon: <Server className="w-5 h-5" />,
  },
];
