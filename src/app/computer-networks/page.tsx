import Link from "next/link";
import { AppNavbar } from "@/components/ui/AppNavbar";
import { EpisodeCard } from "@/components/ui/EpisodeCard";
import { ArrowLeft, Network } from "lucide-react";
import { COMPUTER_NETWORKS_EPISODES } from "./episodes";

export default function ComputerNetworksPathPage() {
  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden selection:bg-teal-500/25 selection:text-teal-950 dark:selection:text-teal-200">
      {/* Standardized Navigation */}
      <AppNavbar />

      {/* Main Content */}
      <main className="pt-28 sm:pt-32 pb-20 mx-auto max-w-6xl px-4 sm:px-6">
        {/* Header */}
        <div className="mb-14">
          <Link
            href="/learning-paths"
            className="inline-flex items-center gap-2 text-sm font-medium text-zinc-600 dark:text-zinc-400 hover:text-foreground mb-8 transition-colors group"
          >
            <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-0.5" />
            <span>Back to Learning Paths</span>
          </Link>

          <div className="flex items-center gap-5 mb-6">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center p-2 bg-teal-500/10 overflow-hidden shadow-sm border border-teal-500/20 text-teal-500 dark:text-teal-400">
              <Network className="w-9 h-9" />
            </div>
            <div>
              <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-[#0A0A0A] dark:text-zinc-50">
                Computer Networks
              </h1>
            </div>
          </div>

          <p className="text-base sm:text-lg text-zinc-600 dark:text-zinc-400 max-w-2xl leading-relaxed font-normal">
            Look under the hood of network communication. Explore how IP addressing directs packets to host interfaces, transport ports multiplex applications, and OS kernel sockets manage stateful TCP connections.
          </p>
        </div>

        {/* Modules Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {COMPUTER_NETWORKS_EPISODES.map((episode) => (
            <EpisodeCard key={episode.id} episode={episode} />
          ))}
        </div>
      </main>
    </div>
  );
}
