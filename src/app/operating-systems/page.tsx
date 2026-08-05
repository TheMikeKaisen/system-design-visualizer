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

          {/* Episode 2: CPU Scheduling Algorithms */}
          <Link href="/operating-systems/simulator/cpu-scheduling" className="group">
            <div className="relative h-full p-4 sm:p-6 rounded-2xl border border-border bg-card hover:border-teal-500/50 hover:shadow-[0_0_30px_-5px_rgba(6,182,212,0.2)] transition-all duration-300 flex flex-col justify-center">
              <div className="hidden sm:flex items-center justify-between mb-4">
                <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">Episode 2</div>
              </div>
              
              <div className="flex items-center sm:block gap-4 sm:gap-0">
                <div className="w-12 h-12 sm:w-10 sm:h-10 shrink-0 rounded-xl bg-teal-500/10 text-teal-500 flex items-center justify-center sm:mb-4 group-hover:scale-110 transition-transform duration-300">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18"/><path d="M9 21V9"/></svg>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex sm:hidden items-center gap-2 mb-1">
                    <span className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground/60">Episode 2</span>
                  </div>
                  <h3 className="text-base sm:text-xl font-bold text-foreground sm:mb-3 group-hover:text-teal-500 transition-colors line-clamp-2">CPU Scheduling Deep-Dive</h3>
                  <p className="hidden sm:block text-sm text-muted-foreground mb-6 leading-relaxed line-clamp-3">
                    Compare FCFS and Round Robin with real-time queues. See how time quantums affect context switching and fairness.
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

          {/* Episode 3: Process Control Block (PCB) */}
          <Link href="/operating-systems/simulator/process-control-block" className="group">
            <div className="relative h-full p-4 sm:p-6 rounded-2xl border border-border bg-card hover:border-amber-500/50 hover:shadow-[0_0_30px_-5px_rgba(245,158,11,0.2)] transition-all duration-300 flex flex-col justify-center">
              <div className="hidden sm:flex items-center justify-between mb-4">
                <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">Episode 3</div>
              </div>
              
              <div className="flex items-center sm:block gap-4 sm:gap-0">
                <div className="w-12 h-12 sm:w-10 sm:h-10 shrink-0 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center sm:mb-4 group-hover:scale-110 transition-transform duration-300">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex sm:hidden items-center gap-2 mb-1">
                    <span className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground/60">Episode 3</span>
                  </div>
                  <h3 className="text-base sm:text-xl font-bold text-foreground sm:mb-3 group-hover:text-amber-500 transition-colors line-clamp-2">Process Control Blocks (PCB)</h3>
                  <p className="hidden sm:block text-sm text-muted-foreground mb-6 leading-relaxed line-clamp-3">
                    Dive into kernel memory. Explore the anatomy of a PCB and see how the OS performs Context Switches.
                  </p>
                </div>
                <div className="sm:hidden flex items-center justify-center text-muted-foreground group-hover:text-amber-500 transition-colors">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 18l6-6-6-6"/></svg>
                </div>
              </div>

              <div className="hidden sm:flex items-center justify-between mt-auto pt-4 border-t border-border/40">
                <div className="flex items-center text-xs font-medium text-muted-foreground">
                  21 July 2026
                </div>
                <div className="flex items-center text-xs font-bold text-amber-500 bg-amber-500/10 px-3 py-1.5 rounded-lg group-hover:bg-amber-500/20 transition-colors">
                  Launch <svg className="ml-1.5 w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
                </div>
              </div>
            </div>
          </Link>

          {/* Episode 4: FCFS Interactive Scheduler */}
          {/* <Link href="/operating-systems/simulator/fcfs-scheduling" className="group">
            <div className="relative h-full p-4 sm:p-6 rounded-2xl border border-border bg-card hover:border-violet-500/50 hover:shadow-[0_0_30px_-5px_rgba(139,92,246,0.2)] transition-all duration-300 flex flex-col justify-center">
              <div className="hidden sm:flex items-center justify-between mb-4">
                <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">Episode 4</div>
              </div>
              
              <div className="flex items-center sm:block gap-4 sm:gap-0">
                <div className="w-12 h-12 sm:w-10 sm:h-10 shrink-0 rounded-xl bg-violet-500/10 text-violet-500 flex items-center justify-center sm:mb-4 group-hover:scale-110 transition-transform duration-300">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="6" width="20" height="12" rx="2"/><path d="M6 6v12"/><path d="M10 6v12"/><path d="M14 6v12"/><path d="M18 6v12"/></svg>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex sm:hidden items-center gap-2 mb-1">
                    <span className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground/60">Episode 4</span>
                  </div>
                  <h3 className="text-base sm:text-xl font-bold text-foreground sm:mb-3 group-hover:text-violet-500 transition-colors line-clamp-2">FCFS Interactive Scheduler</h3>
                  <p className="hidden sm:block text-sm text-muted-foreground mb-6 leading-relaxed line-clamp-3">
                    Enter your own process data and watch FCFS scheduling in action. Live Gantt charts, CPU progress, decision logs, and Convoy Effect detection.
                  </p>
                </div>
                <div className="sm:hidden flex items-center justify-center text-muted-foreground group-hover:text-violet-500 transition-colors">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 18l6-6-6-6"/></svg>
                </div>
              </div>

              <div className="hidden sm:flex items-center justify-between mt-auto pt-4 border-t border-border/40">
                <div className="flex items-center text-xs font-medium text-muted-foreground">
                  22 July 2026
                </div>
                <div className="flex items-center text-xs font-bold text-violet-500 bg-violet-500/10 px-3 py-1.5 rounded-lg group-hover:bg-violet-500/20 transition-colors">
                  Launch <svg className="ml-1.5 w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
                </div>
              </div>
            </div>
          </Link> */}

          {/* Episode 4: Universal CPU Scheduler */}
          <Link href="/operating-systems/simulator/cpu-scheduling" className="group">
            <div className="relative h-full p-4 sm:p-6 rounded-2xl border border-border bg-card hover:border-violet-500/50 hover:shadow-[0_0_30px_-5px_rgba(139,92,246,0.2)] transition-all duration-300 flex flex-col justify-center">
              <div className="hidden sm:flex items-center justify-between mb-4">
                <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">Episode 4</div>
              </div>
              
              <div className="flex items-center sm:block gap-4 sm:gap-0">
                <div className="w-12 h-12 sm:w-10 sm:h-10 shrink-0 rounded-xl bg-teal-500/10 text-teal-500 flex items-center justify-center sm:mb-4 group-hover:scale-110 transition-transform duration-300">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex sm:hidden items-center gap-2 mb-1">
                    <span className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground/60">Episode 5</span>
                  </div>
                  <h3 className="text-base sm:text-xl font-bold text-foreground sm:mb-3 group-hover:text-teal-500 transition-colors line-clamp-2">CPU Schedulers</h3>
                  <p className="hidden sm:block text-sm text-muted-foreground mb-6 leading-relaxed line-clamp-3">
                    A universal engine supporting FCFS, SJF, SRTF and RR scheduling. Compare algorithms side-by-side with identical inputs.
                  </p>
                </div>
                <div className="sm:hidden flex items-center justify-center text-muted-foreground group-hover:text-teal-500 transition-colors">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 18l6-6-6-6"/></svg>
                </div>
              </div>

              <div className="hidden sm:flex items-center justify-between mt-auto pt-4 border-t border-border/40">
                <div className="flex items-center text-xs font-medium text-muted-foreground">
                  22 July 2026
                </div>
                <div className="flex items-center text-xs font-bold text-teal-500 bg-teal-500/10 px-3 py-1.5 rounded-lg group-hover:bg-teal-500/20 transition-colors">
                  Launch <svg className="ml-1.5 w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
                </div>
              </div>
            </div>
          </Link>

          {/* Episode 5: Producer-Consumer Problem */}
          <Link href="/operating-systems/simulator/producer-consumer" className="group">
            <div className="relative h-full p-4 sm:p-6 rounded-2xl border border-border bg-card hover:border-pink-500/50 hover:shadow-[0_0_30px_-5px_rgba(236,72,153,0.2)] transition-all duration-300 flex flex-col justify-center">
              <div className="hidden sm:flex items-center justify-between mb-4">
                <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">Episode 5</div>
              </div>
              
              <div className="flex items-center sm:block gap-4 sm:gap-0">
                <div className="w-12 h-12 sm:w-10 sm:h-10 shrink-0 rounded-xl bg-pink-500/10 text-pink-500 flex items-center justify-center sm:mb-4 group-hover:scale-110 transition-transform duration-300">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex sm:hidden items-center gap-2 mb-1">
                    <span className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground/60">Episode 5</span>
                  </div>
                  <h3 className="text-base sm:text-xl font-bold text-foreground sm:mb-3 group-hover:text-pink-500 transition-colors line-clamp-2">Producer-Consumer Problem</h3>
                  <p className="hidden sm:block text-sm text-muted-foreground mb-6 leading-relaxed line-clamp-3">
                    Visualize the Lost Update Problem and Race Conditions when threads access shared memory without synchronization.
                  </p>
                </div>
                <div className="sm:hidden flex items-center justify-center text-muted-foreground group-hover:text-pink-500 transition-colors">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 18l6-6-6-6"/></svg>
                </div>
              </div>

              <div className="hidden sm:flex items-center justify-between mt-auto pt-4 border-t border-border/40">
                <div className="flex items-center text-xs font-medium text-muted-foreground">
                  2 August 2026
                </div>
                <div className="flex items-center text-xs font-bold text-pink-500 bg-pink-500/10 px-3 py-1.5 rounded-lg group-hover:bg-pink-500/20 transition-colors">
                  Launch <svg className="ml-1.5 w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
                </div>
              </div>
            </div>
          </Link>

          {/* Episode 6: Printer Spooler Problem */}
          <Link href="/operating-systems/simulator/printer-spooler" className="group">
            <div className="relative h-full p-4 sm:p-6 rounded-2xl border border-border bg-card hover:border-cyan-500/50 hover:shadow-[0_0_30px_-5px_rgba(6,182,212,0.2)] transition-all duration-300 flex flex-col justify-center">
              <div className="hidden sm:flex items-center justify-between mb-4">
                <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">Episode 6</div>
              </div>
              
              <div className="flex items-center sm:block gap-4 sm:gap-0">
                <div className="w-12 h-12 sm:w-10 sm:h-10 shrink-0 rounded-xl bg-cyan-500/10 text-cyan-500 flex items-center justify-center sm:mb-4 group-hover:scale-110 transition-transform duration-300">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 9V2h12v7"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><path d="M6 14h12v8H6z"/></svg>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex sm:hidden items-center gap-2 mb-1">
                    <span className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground/60">Episode 6</span>
                  </div>
                  <h3 className="text-base sm:text-xl font-bold text-foreground sm:mb-3 group-hover:text-cyan-500 transition-colors line-clamp-2">Printer Spooler Problem</h3>
                  <p className="hidden sm:block text-sm text-muted-foreground mb-6 leading-relaxed line-clamp-3">
                    Watch how two processes overwrite each other's print job when the shared spooler directory is accessed without synchronization.
                  </p>
                </div>
                <div className="sm:hidden flex items-center justify-center text-muted-foreground group-hover:text-cyan-500 transition-colors">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 18l6-6-6-6"/></svg>
                </div>
              </div>

              <div className="hidden sm:flex items-center justify-between mt-auto pt-4 border-t border-border/40">
                <div className="flex items-center text-xs font-medium text-muted-foreground">
                  5 August 2026
                </div>
                <div className="flex items-center text-xs font-bold text-cyan-500 bg-cyan-500/10 px-3 py-1.5 rounded-lg group-hover:bg-cyan-500/20 transition-colors">
                  Launch <svg className="ml-1.5 w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
                </div>
              </div>
            </div>
          </Link>

          {/* Episode 7: Lock Variables */}
          <Link href="/operating-systems/simulator/lock-variables" className="group">
            <div className="relative h-full p-4 sm:p-6 rounded-2xl border border-border bg-card hover:border-violet-500/50 hover:shadow-[0_0_30px_-5px_rgba(139,92,246,0.2)] transition-all duration-300 flex flex-col justify-center">
              <div className="hidden sm:flex items-center justify-between mb-4">
                <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">Episode 7</div>
              </div>
              
              <div className="flex items-center sm:block gap-4 sm:gap-0">
                <div className="w-12 h-12 sm:w-10 sm:h-10 shrink-0 rounded-xl bg-violet-500/10 text-violet-500 flex items-center justify-center sm:mb-4 group-hover:scale-110 transition-transform duration-300">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex sm:hidden items-center gap-2 mb-1">
                    <span className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground/60">Episode 7</span>
                  </div>
                  <h3 className="text-base sm:text-xl font-bold text-foreground sm:mb-3 group-hover:text-violet-500 transition-colors line-clamp-2">Lock Variables</h3>
                  <p className="hidden sm:block text-sm text-muted-foreground mb-6 leading-relaxed line-clamp-3">
                    See why a naive lock variable fails due to a race in the check-and-set gap, then watch how the atomic TSL hardware instruction solves it.
                  </p>
                </div>
                <div className="sm:hidden flex items-center justify-center text-muted-foreground group-hover:text-violet-500 transition-colors">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 18l6-6-6-6"/></svg>
                </div>
              </div>

              <div className="hidden sm:flex items-center justify-between mt-auto pt-4 border-t border-border/40">
                <div className="flex items-center text-xs font-medium text-muted-foreground">
                  5 August 2026
                </div>
                <div className="flex items-center text-xs font-bold text-violet-500 bg-violet-500/10 px-3 py-1.5 rounded-lg group-hover:bg-violet-500/20 transition-colors">
                  Launch <svg className="ml-1.5 w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
                </div>
              </div>
            </div>
          </Link>
        </div>
      </main>
    </div>
  );
}
