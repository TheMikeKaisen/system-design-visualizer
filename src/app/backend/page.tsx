import Link from "next/link";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Logo } from "@/components/ui/Logo";
import { Database, Server, Activity, ArrowRight } from "lucide-react";

export default function BackendPathPage() {
  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-md">
        <div className="mx-auto max-w-6xl px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5 group">
            <Logo size={28} />
            <span className="text-sm font-semibold tracking-tight text-foreground">System Simulator</span>
          </Link>
          <div className="flex items-center gap-3">
            <ThemeToggle />
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="pt-32 pb-20 mx-auto max-w-5xl px-6">
        {/* Header */}
        <div className="mb-16">
          <Link href="/learning-paths" className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-foreground mb-8 transition-colors">
            <ArrowRight className="w-4 h-4 mr-2 rotate-180" />
            Back to Learning Paths
          </Link>
          <div className="flex items-center gap-5 mb-6">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center bg-emerald-500/10 overflow-hidden shadow-sm border border-emerald-500/20">
               <Server className="w-8 h-8 text-emerald-500" />
            </div>
            <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-foreground">Backend internals</h1>
          </div>
          <p className="text-lg text-muted-foreground max-w-2xl leading-relaxed">
            Go inside the runtime. Understand why Node can handle 10,000 connections with a single thread — and exactly when it can't.
          </p>
        </div>

        {/* Modules Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          
          {/* Episode 1 */}
          <Link href="/backend/episodes/1" className="group">
            <div className="relative h-full p-4 sm:p-6 rounded-2xl border border-border bg-card hover:border-emerald-500/50 hover:shadow-[0_0_30px_-5px_rgba(16,185,129,0.2)] transition-all duration-300 flex flex-col justify-center">
              <div className="hidden sm:flex items-center justify-between mb-4">
                <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">Episode 1</div>
              </div>
              <div className="flex items-center sm:block gap-4 sm:gap-0">
                <div className="w-12 h-12 sm:w-10 sm:h-10 shrink-0 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center sm:mb-4 group-hover:scale-110 transition-transform duration-300">
                  <Server className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex sm:hidden items-center gap-2 mb-1">
                    <span className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground/60">Episode 1</span>
                  </div>
                  <h3 className="text-base sm:text-lg font-semibold text-foreground mb-1 group-hover:text-emerald-500 transition-colors truncate sm:whitespace-normal">Node Architecture</h3>
                  <p className="text-sm text-muted-foreground line-clamp-2 hidden sm:block">What happens when you type `node server.js`? Threads, V8, and libuv.</p>
                </div>
              </div>
            </div>
          </Link>

          {/* Episode 2 */}
          <Link href="/backend/episodes/2" className="group">
            <div className="relative h-full p-4 sm:p-6 rounded-2xl border border-border bg-card hover:border-emerald-500/50 hover:shadow-[0_0_30px_-5px_rgba(16,185,129,0.2)] transition-all duration-300 flex flex-col justify-center">
              <div className="hidden sm:flex items-center justify-between mb-4">
                <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">Episode 2</div>
              </div>
              <div className="flex items-center sm:block gap-4 sm:gap-0">
                <div className="w-12 h-12 sm:w-10 sm:h-10 shrink-0 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center sm:mb-4 group-hover:scale-110 transition-transform duration-300">
                  <Activity className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex sm:hidden items-center gap-2 mb-1">
                    <span className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground/60">Episode 2</span>
                  </div>
                  <h3 className="text-base sm:text-lg font-semibold text-foreground mb-1 group-hover:text-emerald-500 transition-colors truncate sm:whitespace-normal">Blocking vs Non-Blocking</h3>
                  <p className="text-sm text-muted-foreground line-clamp-2 hidden sm:block">Compare a frozen server against Node's instant handoffs.</p>
                </div>
              </div>
            </div>
          </Link>

          {/* Episode 3 */}
          <Link href="/backend/episodes/3" className="group">
            <div className="relative h-full p-4 sm:p-6 rounded-2xl border border-border bg-card hover:border-emerald-500/50 hover:shadow-[0_0_30px_-5px_rgba(16,185,129,0.2)] transition-all duration-300 flex flex-col justify-center">
              <div className="hidden sm:flex items-center justify-between mb-4">
                <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">Episode 3</div>
              </div>
              <div className="flex items-center sm:block gap-4 sm:gap-0">
                <div className="w-12 h-12 sm:w-10 sm:h-10 shrink-0 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center sm:mb-4 group-hover:scale-110 transition-transform duration-300">
                  <Database className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex sm:hidden items-center gap-2 mb-1">
                    <span className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground/60">Episode 3</span>
                  </div>
                  <h3 className="text-base sm:text-lg font-semibold text-foreground mb-1 group-hover:text-emerald-500 transition-colors truncate sm:whitespace-normal">Event Loop Phases</h3>
                  <p className="text-sm text-muted-foreground line-clamp-2 hidden sm:block">Trace nextTick, Microtasks, and the 5 libuv phases step by step.</p>
                </div>
              </div>
            </div>
          </Link>

        </div>
      </main>
    </div>
  );
}
