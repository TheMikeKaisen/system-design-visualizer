import Link from "next/link";
import { AppNavbar } from "@/components/ui/AppNavbar";
import { EpisodeCard } from "@/components/ui/EpisodeCard";
import { Server, ArrowLeft } from "lucide-react";
import { BACKEND_EPISODES } from "./episodes";

export default function BackendPathPage() {
  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden selection:bg-amber-500/25 selection:text-amber-950 dark:selection:text-amber-200">
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
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center bg-blue-500/10 overflow-hidden shadow-sm border border-blue-500/20">
              <Server className="w-8 h-8 text-blue-500" />
            </div>
            <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-[#0A0A0A] dark:text-zinc-50">
              Backend Internals
            </h1>
          </div>

          <p className="text-base sm:text-lg text-zinc-600 dark:text-zinc-400 max-w-2xl leading-relaxed font-normal">
            Go inside the runtime. Understand why Node can handle 10,000 connections with a single thread — and exactly when it can&apos;t.
          </p>
        </div>

        {/* Modules Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {BACKEND_EPISODES.map((ep) => (
            <EpisodeCard key={ep.id} episode={ep} />
          ))}
        </div>
      </main>
    </div>
  );
}
