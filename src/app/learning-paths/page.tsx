import Link from "next/link";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Logo } from "@/components/ui/Logo";

export default function LearningPathsPage() {
  return (
    <div className="min-h-screen bg-background flex flex-col font-sans">
      {/* Navigation */}
      <nav className="h-16 border-b border-border/50 bg-background/80 backdrop-blur-md sticky top-0 z-50">
        <div className="h-full px-6 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 group">
            <Logo size={24} />
            <span className="text-sm font-semibold tracking-tight text-foreground group-hover:text-primary transition-colors">
              System Design Visualizer
            </span>
          </Link>
          <ThemeToggle />
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-6 py-20">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-foreground">
            Learning Paths
          </h1>
          <p className="mt-5 text-lg leading-relaxed text-muted-foreground">
            Structured, interactive lessons that walk you through fundamental programming languages and system design concepts.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Active Route: Java */}
          <Link href="/java" className="group">
            <div className="relative h-full p-6 sm:p-8 rounded-2xl border border-border bg-card hover:border-primary/50 hover:shadow-[0_0_30px_-5px_rgba(var(--primary),0.2)] transition-all duration-300">
              <div className="w-12 h-12 rounded-xl bg-orange-500/10 text-orange-500 flex items-center justify-center mb-5 group-hover:scale-110 group-hover:bg-orange-500/20 transition-all duration-300">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/></svg>
              </div>
              <h3 className="text-xl font-bold text-foreground mb-3 group-hover:text-primary transition-colors">Java</h3>
              <p className="text-sm leading-relaxed text-muted-foreground mb-6">
                Understand how Java code is compiled, converted to bytecode, and executed by the JVM and CPU.
              </p>
              <div className="flex items-center text-sm font-semibold text-primary group-hover:translate-x-1 transition-transform">
                Explore Java Path <svg className="ml-1" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
              </div>
            </div>
          </Link>

          {/* Active Route: JavaScript */}
          <Link href="/javascript" className="group">
            <div className="relative h-full p-6 sm:p-8 rounded-2xl border border-border bg-card hover:border-yellow-500/50 hover:shadow-[0_0_30px_-5px_rgba(234,179,8,0.2)] transition-all duration-300">
              <div className="w-12 h-12 rounded-xl bg-yellow-500/10 text-yellow-500 flex items-center justify-center mb-5 group-hover:scale-110 group-hover:bg-yellow-500/20 transition-all duration-300">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="16 18 22 12 16 6"></polyline><polyline points="8 6 2 12 8 18"></polyline></svg>
              </div>
              <h3 className="text-xl font-bold text-foreground mb-3 group-hover:text-yellow-500 transition-colors">JavaScript</h3>
              <p className="text-sm leading-relaxed text-muted-foreground mb-6">
                Master the Execution Context, Call Stack, Memory Heap, and Event Loop in real-time.
              </p>
              <div className="flex items-center text-sm font-semibold text-yellow-500 group-hover:translate-x-1 transition-transform">
                Explore JS Path <svg className="ml-1" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
              </div>
            </div>
          </Link>

          {/* Active Route: Operating Systems */}
          <Link href="/operating-systems" className="group">
            <div className="relative h-full p-6 sm:p-8 rounded-2xl border border-border bg-card hover:border-teal-500/50 hover:shadow-[0_0_30px_-5px_rgba(6,182,212,0.2)] transition-all duration-300">
              <div className="w-12 h-12 rounded-xl bg-teal-500/10 text-teal-500 flex items-center justify-center mb-5 group-hover:scale-110 group-hover:bg-teal-500/20 transition-all duration-300">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="4" y="4" width="16" height="16" rx="2" />
                  <rect x="9" y="9" width="6" height="6" />
                  <path d="M15 2v2" /><path d="M15 20v2" /><path d="M2 15h2" /><path d="M2 9h2" />
                  <path d="M20 15h2" /><path d="M20 9h2" /><path d="M9 2v2" /><path d="M9 20v2" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-foreground mb-3 group-hover:text-teal-500 transition-colors">Operating Systems</h3>
              <p className="text-sm leading-relaxed text-muted-foreground mb-6">
                Visualize process states, CPU scheduling, memory management, and hardware interaction in real-time.
              </p>
              <div className="flex items-center text-sm font-semibold text-teal-500 group-hover:translate-x-1 transition-transform">
                Explore OS Path <svg className="ml-1" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
              </div>
            </div>
          </Link>

          {/* Active Route: Frontend */}
          <Link href="/frontend" className="group">
            <div className="relative h-full p-6 sm:p-8 rounded-2xl border border-border bg-card hover:border-blue-500/50 hover:shadow-[0_0_30px_-5px_rgba(59,130,246,0.2)] transition-all duration-300">
              <div className="w-12 h-12 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center mb-5 group-hover:scale-110 group-hover:bg-blue-500/20 transition-all duration-300">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10"></circle>
                  <ellipse cx="12" cy="12" rx="10" ry="4"></ellipse>
                  <ellipse cx="12" cy="12" rx="4" ry="10"></ellipse>
                </svg>
              </div>
              <h3 className="text-xl font-bold text-foreground mb-3 group-hover:text-blue-500 transition-colors">Frontend</h3>
              <p className="text-sm leading-relaxed text-muted-foreground mb-6">
                Visualize React's rendering pipeline, from JSX compilation down to Virtual DOM diffing and DOM reconciliation.
              </p>
              <div className="flex items-center text-sm font-semibold text-blue-500 group-hover:translate-x-1 transition-transform">
                Explore Frontend Path <svg className="ml-1" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
              </div>
            </div>
          </Link>
        {/* Active Route: Backend */}
          <Link href="/backend" className="group">
            <div className="relative h-full p-6 sm:p-8 rounded-2xl border border-border bg-card hover:border-emerald-500/50 hover:shadow-[0_0_30px_-5px_rgba(16,185,129,0.2)] transition-all duration-300">
              <div className="w-12 h-12 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center mb-5 group-hover:scale-110 group-hover:bg-emerald-500/20 transition-all duration-300">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="2" y="2" width="20" height="8" rx="2" ry="2"></rect>
                  <rect x="2" y="14" width="20" height="8" rx="2" ry="2"></rect>
                  <line x1="6" y1="6" x2="6.01" y2="6"></line>
                  <line x1="6" y1="18" x2="6.01" y2="18"></line>
                </svg>
              </div>
              <h3 className="text-xl font-bold text-foreground mb-3 group-hover:text-emerald-500 transition-colors">Backend</h3>
              <p className="text-sm leading-relaxed text-muted-foreground mb-6">
                Visualize Node.js internals, Thread Pools, non-blocking I/O, and the 5 phases of the Event Loop.
              </p>
              <div className="flex items-center text-sm font-semibold text-emerald-500 group-hover:translate-x-1 transition-transform">
                Explore Backend Path <svg className="ml-1" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
              </div>
            </div>
          </Link>
        </div>
      </main>
    </div>
  );
}
