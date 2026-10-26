import Link from "next/link";
import { AppNavbar } from "@/components/ui/AppNavbar";
import { DisciplineCard, DISCIPLINES } from "@/components/ui/DisciplineCard";
import { Network, ArrowRight } from "lucide-react";

export default function LearningPathsPage() {
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col font-sans selection:bg-amber-500/25 selection:text-amber-950 dark:selection:text-amber-200">
      {/* Standardized Navigation */}
      <AppNavbar backLink={{ href: "/", label: "Home" }} />

      {/* Main Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 pt-28 sm:pt-32 pb-16 sm:pb-24">
        {/* Editorial Heading */}
        <div className="text-center max-w-3xl mx-auto mb-12 sm:mb-16">
          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-[#0A0A0A] dark:text-zinc-50">
            Master Systems from the Inside Out
          </h1>
          <p className="mt-4 text-base sm:text-lg leading-relaxed text-zinc-600 dark:text-zinc-400 max-w-2xl mx-auto font-normal">
            Structured, interactive computational tracks exploring execution contexts, operating system scheduling, virtual machines, and distributed architecture.
          </p>
        </div>

        {/* 6-Card Unified Disciplines Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {DISCIPLINES.map((disc) => (
            <DisciplineCard key={disc.id} discipline={disc} />
          ))}

          {/* 6th Card: Canvas Studio */}
          <Link
            href="/canvas"
            className="group relative flex flex-col justify-between p-6 rounded-2xl border border-primary/25 hover:border-primary/70 bg-white dark:bg-zinc-900/70 backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-black/10 dark:hover:shadow-black/40 overflow-hidden shadow-[0_2px_10px_rgba(0,0,0,0.03)]"
          >
            {/* Top hairline highlight on hover */}
            <div
              className="absolute top-0 left-4 right-4 h-[1px] opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-gradient-to-r from-transparent via-primary to-transparent"
              aria-hidden="true"
            />

            <div>
              <div className="flex items-center justify-between mb-5">
                <div className="w-11 h-11 rounded-xl bg-primary/10 text-primary flex items-center justify-center transition-transform group-hover:scale-105 duration-300 border border-primary/20 shadow-sm">
                  <Network className="w-5 h-5" />
                </div>
                <span className="text-xs font-mono font-medium px-2.5 py-1 rounded-full bg-zinc-100 dark:bg-muted/60 text-zinc-700 dark:text-muted-foreground border border-zinc-200/80 dark:border-border/40">
                  Interactive Studio
                </span>
              </div>

              <h3 className="text-lg font-bold text-foreground mb-2 group-hover:text-primary transition-colors tracking-tight">
                Canvas Studio
              </h3>
              <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed mb-6 font-normal">
                Assemble multi-node distributed architectures. Simulate live packet flows, test circuit breakers, and observe rate-limiting dynamics.
              </p>
            </div>

            <div>
              <div className="flex flex-wrap gap-1.5 mb-5">
                {["API Gateway", "Event Streams", "Rate Limiting", "Circuit Breakers"].map((tag) => (
                  <span
                    key={tag}
                    className="text-[11px] font-mono px-2 py-0.5 rounded bg-zinc-100/90 dark:bg-muted/50 border border-zinc-200/80 dark:border-border/40 text-zinc-600 dark:text-muted-foreground group-hover:border-zinc-300 dark:group-hover:border-border/80 transition-colors"
                  >
                    {tag}
                  </span>
                ))}
              </div>

              <div className="flex items-center gap-1.5 text-xs font-semibold text-primary">
                <span>Launch Canvas Studio</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          </Link>
        </div>
      </main>
    </div>
  );
}
