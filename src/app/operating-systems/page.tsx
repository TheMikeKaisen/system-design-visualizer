import Link from "next/link";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Logo } from "@/components/ui/Logo";

export default function OperatingSystemsPathPage() {
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
            <svg className="mr-2" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
            Back to Learning Paths
          </Link>
          <div className="flex items-center gap-5 mb-6">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center bg-teal-500/10 overflow-hidden shadow-sm">
              {/* OS Icon — CPU chip */}
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#06B6D4" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <rect x="4" y="4" width="16" height="16" rx="2" />
                <rect x="9" y="9" width="6" height="6" />
                <path d="M15 2v2" /><path d="M15 20v2" /><path d="M2 15h2" /><path d="M2 9h2" />
                <path d="M20 15h2" /><path d="M20 9h2" /><path d="M9 2v2" /><path d="M9 20v2" />
              </svg>
            </div>
            <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-foreground">Operating Systems</h1>
          </div>
          <p className="text-lg text-muted-foreground max-w-2xl leading-relaxed">
            Visualize how operating systems manage processes, memory, CPU scheduling, and hardware. Watch processes move between states in real-time.
          </p>
        </div>

        {/* Episodes Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Episode 1: Process States */}
          <Link href="/operating-systems/simulator/process-states" className="group">
            <div className="relative h-full p-4 sm:p-6 rounded-2xl border border-border bg-card hover:border-teal-500/50 hover:shadow-[0_0_30px_-5px_rgba(6,182,212,0.2)] transition-all duration-300 flex flex-col justify-center">
              <div className="hidden sm:flex items-center justify-between mb-4">
                <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">Episode 1</div>
              </div>
              
              <div className="flex items-center sm:block gap-4 sm:gap-0">
                <div className="w-12 h-12 sm:w-10 sm:h-10 shrink-0 rounded-xl bg-teal-500/10 text-teal-500 flex items-center justify-center sm:mb-4 group-hover:scale-110 transition-transform duration-300">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10" />
                    <path d="M8 12h8" /><path d="M12 8v8" />
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex sm:hidden items-center gap-2 mb-1">
                    <span className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground/60">Episode 1</span>
                  </div>
                  <h3 className="text-base sm:text-xl font-bold text-foreground sm:mb-3 group-hover:text-teal-500 transition-colors line-clamp-2">Process Lifecycle & Scheduling</h3>
                  <p className="hidden sm:block text-sm text-muted-foreground mb-6 leading-relaxed line-clamp-3">
                    Watch Chrome, Spotify, and VS Code compete for the CPU. See how schedulers manage process states, I/O waiting, and preemptive vs non-preemptive scheduling.
                  </p>
                </div>
                <div className="sm:hidden flex items-center justify-center text-muted-foreground group-hover:text-teal-500 transition-colors">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 18l6-6-6-6"/></svg>
                </div>
              </div>

              <div className="hidden sm:flex items-center justify-between mt-auto pt-4 border-t border-border/40">
                <div className="flex items-center text-xs font-medium text-muted-foreground">
                  20 July 2026
                </div>
                <div className="flex items-center text-xs font-bold text-teal-500 bg-teal-500/10 px-3 py-1.5 rounded-lg group-hover:bg-teal-500/20 transition-colors">
                  Launch <svg className="ml-1.5 w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
                </div>
              </div>
            </div>
          </Link>

          {/* Locked: CPU Scheduling Algorithms */}
          <div className="relative p-4 sm:p-6 rounded-2xl border border-border/40 bg-card/50 opacity-70 select-none">
            <div className="absolute top-4 right-4">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-muted-foreground/50">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
            </div>
            <div className="hidden sm:block text-[10px] font-bold uppercase tracking-widest text-muted-foreground/40 mb-4">Episode 2</div>
            <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center text-muted-foreground mb-4">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18"/><path d="M9 21V9"/></svg>
            </div>
            <h3 className="text-base sm:text-xl font-bold text-foreground/70 mb-3">CPU Scheduling Deep-Dive</h3>
            <p className="hidden sm:block text-sm leading-relaxed text-muted-foreground/70 mb-6">
              Compare FCFS, SJF, Priority, and Round Robin with Gantt charts and performance metrics.
            </p>
            <div className="inline-block px-2 py-1 text-[10px] font-bold tracking-widest uppercase bg-muted text-muted-foreground rounded">
              Coming Soon
            </div>
          </div>

          {/* Locked: Process Synchronization */}
          <div className="relative p-4 sm:p-6 rounded-2xl border border-border/40 bg-card/50 opacity-70 select-none">
            <div className="absolute top-4 right-4">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-muted-foreground/50">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
            </div>
            <div className="hidden sm:block text-[10px] font-bold uppercase tracking-widest text-muted-foreground/40 mb-4">Episode 3</div>
            <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center text-muted-foreground mb-4">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
            </div>
            <h3 className="text-base sm:text-xl font-bold text-foreground/70 mb-3">Process Synchronization</h3>
            <p className="hidden sm:block text-sm leading-relaxed text-muted-foreground/70 mb-6">
              Visualize mutex locks, semaphores, critical sections, and the producer-consumer problem.
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
