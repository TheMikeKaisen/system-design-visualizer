import Link from "next/link";
import { AppNavbar } from "@/components/ui/AppNavbar";
import { EpisodeCard } from "@/components/ui/EpisodeCard";
import { ArrowLeft } from "lucide-react";
import { JAVASCRIPT_EPISODES } from "./episodes";

export default function JavascriptPathPage() {
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
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center p-2 bg-[#F7DF1E]/10 overflow-hidden shadow-sm border border-amber-500/20">
              {/* JS Logo SVG */}
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 630 630" className="w-12 h-12">
                <rect width="630" height="630" fill="#f7df1e" />
                <path d="m423.2 492.19c12.69 20.72 29.2 35.95 58.4 35.95 24.53 0 40.2-12.26 40.2-29.2 0-20.3-16.1-27.49-43.1-39.3l-14.8-6.35c-42.72-18.2-71.1-41-71.1-89.2 0-44.4 33.83-78.2 86.7-78.2 37.64 0 64.7 13.1 84.2 47.4l-46.1 29.6c-10.15-18.2-21.1-25.37-38.1-25.37-17.34 0-28.33 11-28.33 25.37 0 17.76 11 24.95 36.4 35.95l14.8 6.34c50.3 21.57 78.7 43.56 78.7 93 0 53.3-41.87 82.5-98.1 82.5-54.98 0-90.5-26.2-107.88-60.54zm-209.13 5.13c9.3 16.5 17.76 30.45 38.1 30.45 19.45 0 31.72-7.61 31.72-37.2v-201.3h59.2v202.1c0 61.3-35.94 89.2-88.4 89.2-47.4 0-74.85-24.53-88.81-54.07z" />
              </svg>
            </div>
            <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-[#0A0A0A] dark:text-zinc-50">
              JavaScript
            </h1>
          </div>

          <p className="text-base sm:text-lg text-zinc-600 dark:text-zinc-400 max-w-2xl leading-relaxed font-normal">
            Look under the hood of the V8 engine. Explore how JavaScript creates execution contexts, manages the call stack, and handles asynchronous events.
          </p>
        </div>

        {/* Modules Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {JAVASCRIPT_EPISODES.map((episode) => (
            <EpisodeCard key={episode.id} episode={episode} />
          ))}
        </div>
      </main>
    </div>
  );
}
