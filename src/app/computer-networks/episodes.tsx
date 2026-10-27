import type { ReactNode } from "react";
import type { EpisodeAccent } from "@/components/ui/EpisodeCard";
import { Network, Globe, ShieldCheck, Cpu } from "lucide-react";

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

export const COMPUTER_NETWORKS_EPISODES: EpisodeMetadata[] = [
  {
    id: "ip-port-sockets",
    episodeNumber: 1,
    title: "IP Addresses, Ports & Sockets",
    description:
      "Watch how network interfaces, transport ports, and kernel socket 4-tuples route packets between client applications and server endpoints.",
    date: "27 October 2026",
    href: "/computer-networks/simulator/ip-port-sockets",
    accent: "teal",
    icon: <Network className="w-5 h-5" />,
  },
  {
    id: "dns-resolution",
    episodeNumber: 2,
    title: "DNS Resolution & Caching",
    description:
      "Trace recursive vs iterative queries from local resolver cache down through Root, TLD, and Authoritative nameservers.",
    date: "27 October 2026",
    href: "/computer-networks/simulator/dns-resolution",
    accent: "teal",
    icon: <Globe className="w-5 h-5" />,
  },
  {
    id: "tls-handshake",
    episodeNumber: 3,
    title: "TLS 1.3 Encryption & Handshake",
    description:
      "Inspect Diffie-Hellman ephemeral key exchanges, certificate validation, and cipher negotiation securing HTTPS packets.",
    date: "Coming Soon",
    href: "/computer-networks/simulator/ip-port-sockets",
    accent: "teal",
    icon: <ShieldCheck className="w-5 h-5" />,
  },
  {
    id: "tcp-flow-control",
    episodeNumber: 4,
    title: "TCP Flow Control & Sliding Window",
    description:
      "Observe receive window advertisements, ACK pacing, and congestion control (Slow Start & Congestion Avoidance).",
    date: "Coming Soon",
    href: "/computer-networks/simulator/ip-port-sockets",
    accent: "teal",
    icon: <Cpu className="w-5 h-5" />,
  },
];
