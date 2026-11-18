import type { Metadata } from "next";
import { CloudEpisodeShell } from "@/components/cloud-simulator/CloudEpisodeShell";

export const metadata: Metadata = {
  title: "AWS IAM: Who Gets Access to What? | System Simulator",
  description:
    "Interactive AWS IAM Policy Decision Point evaluation engine. Explore Least Privilege, Default Deny, and the Explicit Deny circuit breaker.",
};

export default function AwsIamSimulatorPage() {
  return (
    <CloudEpisodeShell
      episodeNumber={1}
      episodeTitle="AWS IAM: Who Gets Access to What?"
      backHref="/cloud"
      backLabel="Back to Cloud Engineering"
    />
  );
}
