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

          {/* Locked Route: Computer Networks */}
          <div className="relative p-6 sm:p-8 rounded-2xl border border-border/40 bg-card/50 opacity-70 select-none">
            <div className="absolute top-4 right-4">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-muted-foreground/50">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
            </div>
            <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center text-muted-foreground mb-5">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 17h2a4 4 0 0 0 4-4V7a4 4 0 0 1 4-4h2"/><circle cx="5" cy="17" r="2"/><circle cx="19" cy="7" r="2"/></svg>
            </div>
            <h3 className="text-xl font-bold text-foreground/70 mb-3">Computer Networks</h3>
            <p className="text-sm leading-relaxed text-muted-foreground/70 mb-6">
              Learn the foundations of networking: TCP/IP, DNS, Routing, and Load Balancing in real-time.
            </p>
            <div className="inline-block px-2 py-1 text-[10px] font-bold tracking-widest uppercase bg-muted text-muted-foreground rounded">
              Coming Soon
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
