import type { Metadata } from "next";
import { EC2EpisodeShell } from "@/components/cloud-simulator/ec2/EC2EpisodeShell";

export const metadata: Metadata = {
  title: "Amazon EC2: The Invisible Handshake | System Simulator",
  description:
    "Interactive Amazon EC2 SSH connection visualizer. Explore public vs private IPv4, VPC Internet Gateways, Security Group stateful filtering, the .pem key container, and zero-knowledge cryptographic authentication.",
};

export default function AwsEc2SimulatorPage() {
  return (
    <EC2EpisodeShell
      episodeNumber={2}
      episodeTitle="Amazon EC2: The Invisible Handshake"
      backHref="/cloud"
      backLabel="Back to Cloud Engineering"
    />
  );
}
