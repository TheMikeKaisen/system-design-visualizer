import Link from "next/link";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Logo } from "@/components/ui/Logo";
import { DisciplineCard, DISCIPLINES } from "@/components/ui/DisciplineCard";
import { Network, ArrowRight, ArrowLeft } from "lucide-react";

export default function LearningPathsPage() {
  return (
    <div className="min-h-screen bg-background flex flex-col font-sans selection:bg-amber-500/20 selection:text-amber-300">
      {/* Navigation */}
      <nav className="h-16 border-b border-border/50 bg-background/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto h-full px-4 sm:px-6 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5 group" aria-label="System Simulator home">
            <Logo size={28} />
            <span className="text-base font-semibold tracking-tight text-foreground group-hover:text-primary transition-colors">
              System Simulator
            </span>
          </Link>

          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Home</span>
            </Link>
            <ThemeToggle />
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-12 sm:py-20">
        <div className="text-center max-w-3xl mx-auto mb-12 sm:mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 mb-4 rounded-full border border-border/60 bg-muted/40 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            All Learning Tracks
          </div>
          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-foreground">
            Master Systems from the Inside Out
          </h1>
          <p className="mt-4 text-base sm:text-lg leading-relaxed text-muted-foreground max-w-2xl mx-auto">
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
            className="group relative flex flex-col justify-between p-6 rounded-2xl border border-border/60 bg-gradient-to-br from-card/90 via-card/70 to-primary/5 hover:border-primary/50 hover:shadow-xl hover:shadow-black/25 backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.05)] overflow-hidden"
          >
            {/* Top hairline highlight on hover */}
            <div
              className="absolute top-0 left-4 right-4 h-[1px] opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-gradient-to-r from-transparent via-primary to-transparent"
              aria-hidden="true"
            />

            <div>
              <div className="flex items-center justify-between mb-5">
                <div className="w-11 h-11 rounded-xl bg-primary/10 text-primary flex items-center justify-center transition-transform group-hover:scale-105 duration-300 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.1)]">
                  <Network className="w-5 h-5" />
                </div>
                <span className="text-xs font-mono font-medium px-2.5 py-1 rounded-full bg-primary/10 text-primary border border-primary/20">
                  Interactive Studio
                </span>
              </div>

              <h3 className="text-lg font-bold text-foreground mb-2 group-hover:text-primary transition-colors tracking-tight">
                Canvas Studio
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed mb-6">
                Assemble multi-node distributed architectures. Simulate live packet flows, test circuit breakers, and observe rate-limiting dynamics.
              </p>
            </div>

            <div>
              <div className="flex flex-wrap gap-1.5 mb-5">
                {["API Gateway", "Event Streams", "Rate Limiting", "Circuit Breakers"].map((tag) => (
                  <span
                    key={tag}
                    className="text-[11px] font-mono px-2 py-0.5 rounded bg-muted/50 border border-border/40 text-muted-foreground group-hover:border-border/80 transition-colors"
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
