import Link from "next/link";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Logo } from "@/components/ui/Logo";
import { Monitor, Workflow, Layers, Zap, Shield, Paintbrush, Link2, ArrowRight } from "lucide-react";

export default function FrontendPathPage() {
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
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center bg-blue-500/10 overflow-hidden shadow-sm border border-blue-500/20">
               <Monitor className="w-8 h-8 text-blue-500" />
            </div>
            <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-foreground">Frontend Architecture</h1>
          </div>
          <p className="text-lg text-muted-foreground max-w-2xl leading-relaxed">
            Understand how modern frontend frameworks really work. We strip away the magic and visualize the exact steps from JSX compilation down to the browser's DOM.
          </p>
        </div>

        {/* Modules Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          
          {/* Episode 1 */}
          <Link href="/frontend/episodes/1" className="group">
            <div className="relative h-full p-4 sm:p-6 rounded-2xl border border-border bg-card hover:border-blue-500/50 hover:shadow-[0_0_30px_-5px_rgba(59,130,246,0.2)] transition-all duration-300 flex flex-col justify-center">
              <div className="hidden sm:flex items-center justify-between mb-4">
                <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">Episode 1</div>
              </div>
              <div className="flex items-center sm:block gap-4 sm:gap-0">
                <div className="w-12 h-12 sm:w-10 sm:h-10 shrink-0 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center sm:mb-4 group-hover:scale-110 transition-transform duration-300">
                  <Monitor className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex sm:hidden items-center gap-2 mb-1">
                    <span className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground/60">Episode 1</span>
                  </div>
                  <h3 className="text-base sm:text-lg font-semibold text-foreground mb-1 group-hover:text-blue-500 transition-colors truncate sm:whitespace-normal">JSX & Virtual DOM</h3>
                  <p className="text-sm text-muted-foreground line-clamp-2 hidden sm:block mb-6">Discover how React transforms components into a Virtual DOM tree.</p>
                </div>
              </div>
              <div className="hidden sm:flex items-center justify-between mt-auto pt-4 border-t border-border/40">
                <div className="flex items-center text-xs font-medium text-muted-foreground">
                  25 July 2026
                </div>
                <div className="flex items-center text-xs font-bold text-blue-500 bg-blue-500/10 px-3 py-1.5 rounded-lg group-hover:bg-blue-500/20 transition-colors">
                  Launch <svg className="ml-1.5 w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
                </div>
              </div>
            </div>
          </Link>

          {/* Episode 2 */}
          <Link href="/frontend/episodes/2" className="group">
            <div className="relative h-full p-4 sm:p-6 rounded-2xl border border-border bg-card hover:border-violet-500/50 hover:shadow-[0_0_30px_-5px_rgba(139,92,246,0.2)] transition-all duration-300 flex flex-col justify-center">
              <div className="hidden sm:flex items-center justify-between mb-4">
                <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">Episode 2</div>
              </div>
              <div className="flex items-center sm:block gap-4 sm:gap-0">
                <div className="w-12 h-12 sm:w-10 sm:h-10 shrink-0 rounded-xl bg-violet-500/10 text-violet-500 flex items-center justify-center sm:mb-4 group-hover:scale-110 transition-transform duration-300">
                  <Workflow className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex sm:hidden items-center gap-2 mb-1">
                    <span className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground/60">Episode 2</span>
                  </div>
                  <h3 className="text-base sm:text-lg font-semibold text-foreground mb-1 group-hover:text-violet-500 transition-colors truncate sm:whitespace-normal">Props & State</h3>
                  <p className="text-sm text-muted-foreground line-clamp-2 hidden sm:block mb-6">Visualize downward data flow and lifting state up.</p>
                </div>
              </div>
              <div className="hidden sm:flex items-center justify-between mt-auto pt-4 border-t border-border/40">
                <div className="flex items-center text-xs font-medium text-muted-foreground">
                  26 July 2026
                </div>
                <div className="flex items-center text-xs font-bold text-violet-500 bg-violet-500/10 px-3 py-1.5 rounded-lg group-hover:bg-violet-500/20 transition-colors">
                  Launch <svg className="ml-1.5 w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
                </div>
              </div>
            </div>
          </Link>

          {/* Episode 3 */}
          <Link href="/frontend/episodes/3" className="group">
            <div className="relative h-full p-4 sm:p-6 rounded-2xl border border-border bg-card hover:border-amber-500/50 hover:shadow-[0_0_30px_-5px_rgba(245,158,11,0.2)] transition-all duration-300 flex flex-col justify-center">
              <div className="hidden sm:flex items-center justify-between mb-4">
                <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">Episode 3</div>
              </div>
              <div className="flex items-center sm:block gap-4 sm:gap-0">
                <div className="w-12 h-12 sm:w-10 sm:h-10 shrink-0 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center sm:mb-4 group-hover:scale-110 transition-transform duration-300">
                  <Layers className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex sm:hidden items-center gap-2 mb-1">
                    <span className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground/60">Episode 3</span>
                  </div>
                  <h3 className="text-base sm:text-lg font-semibold text-foreground mb-1 group-hover:text-amber-500 transition-colors truncate sm:whitespace-normal">useState Batching</h3>
                  <p className="text-sm text-muted-foreground line-clamp-2 hidden sm:block mb-6">Watch React's update queue in real time and understand stale state.</p>
                </div>
              </div>
              <div className="hidden sm:flex items-center justify-between mt-auto pt-4 border-t border-border/40">
                <div className="flex items-center text-xs font-medium text-muted-foreground">
                  27 July 2026
                </div>
                <div className="flex items-center text-xs font-bold text-amber-500 bg-amber-500/10 px-3 py-1.5 rounded-lg group-hover:bg-amber-500/20 transition-colors">
                  Launch <svg className="ml-1.5 w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
                </div>
              </div>
            </div>
          </Link>

          {/* Episode 4 */}
          <Link href="/frontend/episodes/4" className="group">
            <div className="relative h-full p-4 sm:p-6 rounded-2xl border border-border bg-card hover:border-emerald-500/50 hover:shadow-[0_0_30px_-5px_rgba(16,185,129,0.2)] transition-all duration-300 flex flex-col justify-center">
              <div className="hidden sm:flex items-center justify-between mb-4">
                <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">Episode 4</div>
              </div>
              <div className="flex items-center sm:block gap-4 sm:gap-0">
                <div className="w-12 h-12 sm:w-10 sm:h-10 shrink-0 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center sm:mb-4 group-hover:scale-110 transition-transform duration-300">
                  <Zap className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex sm:hidden items-center gap-2 mb-1">
                    <span className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground/60">Episode 4</span>
                  </div>
                  <h3 className="text-base sm:text-lg font-semibold text-foreground mb-1 group-hover:text-emerald-500 transition-colors truncate sm:whitespace-normal">useEffect Pipeline</h3>
                  <p className="text-sm text-muted-foreground line-clamp-2 hidden sm:block mb-6">Trace the render → DOM update → paint → effect pipeline.</p>
                </div>
              </div>
              <div className="hidden sm:flex items-center justify-between mt-auto pt-4 border-t border-border/40">
                <div className="flex items-center text-xs font-medium text-muted-foreground">
                  28 July 2026
                </div>
                <div className="flex items-center text-xs font-bold text-emerald-500 bg-emerald-500/10 px-3 py-1.5 rounded-lg group-hover:bg-emerald-500/20 transition-colors">
                  Launch <svg className="ml-1.5 w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
                </div>
              </div>
            </div>
          </Link>

          {/* Episode 5 */}
          <Link href="/frontend/episodes/5" className="group">
            <div className="relative h-full p-4 sm:p-6 rounded-2xl border border-border bg-card hover:border-rose-500/50 hover:shadow-[0_0_30px_-5px_rgba(244,63,94,0.2)] transition-all duration-300 flex flex-col justify-center">
              <div className="hidden sm:flex items-center justify-between mb-4">
                <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">Episode 5</div>
              </div>
              <div className="flex items-center sm:block gap-4 sm:gap-0">
                <div className="w-12 h-12 sm:w-10 sm:h-10 shrink-0 rounded-xl bg-rose-500/10 text-rose-500 flex items-center justify-center sm:mb-4 group-hover:scale-110 transition-transform duration-300">
                  <Shield className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex sm:hidden items-center gap-2 mb-1">
                    <span className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground/60">Episode 5</span>
                  </div>
                  <h3 className="text-base sm:text-lg font-semibold text-foreground mb-1 group-hover:text-rose-500 transition-colors truncate sm:whitespace-normal">Cleanup & Race Conditions</h3>
                  <p className="text-sm text-muted-foreground line-clamp-2 hidden sm:block mb-6">Trace the cleanup lifecycle and watch network race conditions.</p>
                </div>
              </div>
              <div className="hidden sm:flex items-center justify-between mt-auto pt-4 border-t border-border/40">
                <div className="flex items-center text-xs font-medium text-muted-foreground">
                  29 July 2026
                </div>
                <div className="flex items-center text-xs font-bold text-rose-500 bg-rose-500/10 px-3 py-1.5 rounded-lg group-hover:bg-rose-500/20 transition-colors">
                  Launch <svg className="ml-1.5 w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
                </div>
              </div>
            </div>
          </Link>

          {/* Episode 6 */}
          <Link href="/frontend/episodes/6" className="group">
            <div className="relative h-full p-4 sm:p-6 rounded-2xl border border-border bg-card hover:border-purple-500/50 hover:shadow-[0_0_30px_-5px_rgba(168,85,247,0.2)] transition-all duration-300 flex flex-col justify-center">
              <div className="hidden sm:flex items-center justify-between mb-4">
                <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">Episode 6</div>
              </div>
              <div className="flex items-center sm:block gap-4 sm:gap-0">
                <div className="w-12 h-12 sm:w-10 sm:h-10 shrink-0 rounded-xl bg-purple-500/10 text-purple-500 flex items-center justify-center sm:mb-4 group-hover:scale-110 transition-transform duration-300">
                  <Paintbrush className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex sm:hidden items-center gap-2 mb-1">
                    <span className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground/60">Episode 6</span>
                  </div>
                  <h3 className="text-base sm:text-lg font-semibold text-foreground mb-1 group-hover:text-purple-500 transition-colors truncate sm:whitespace-normal">useLayoutEffect</h3>
                  <p className="text-sm text-muted-foreground line-clamp-2 hidden sm:block mb-6">Watch the tooltip flicker bug appear and disappear.</p>
                </div>
              </div>
              <div className="hidden sm:flex items-center justify-between mt-auto pt-4 border-t border-border/40">
                <div className="flex items-center text-xs font-medium text-muted-foreground">
                  30 July 2026
                </div>
                <div className="flex items-center text-xs font-bold text-purple-500 bg-purple-500/10 px-3 py-1.5 rounded-lg group-hover:bg-purple-500/20 transition-colors">
                  Launch <svg className="ml-1.5 w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
                </div>
              </div>
            </div>
          </Link>

          {/* Episode 7 */}
          <Link href="/frontend/episodes/7" className="group">
            <div className="relative h-full p-4 sm:p-6 rounded-2xl border border-border bg-card hover:border-cyan-500/50 hover:shadow-[0_0_30px_-5px_rgba(6,182,212,0.2)] transition-all duration-300 flex flex-col justify-center">
              <div className="hidden sm:flex items-center justify-between mb-4">
                <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">Episode 7</div>
              </div>
              <div className="flex items-center sm:block gap-4 sm:gap-0">
                <div className="w-12 h-12 sm:w-10 sm:h-10 shrink-0 rounded-xl bg-cyan-500/10 text-cyan-500 flex items-center justify-center sm:mb-4 group-hover:scale-110 transition-transform duration-300">
                  <Link2 className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex sm:hidden items-center gap-2 mb-1">
                    <span className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground/60">Episode 7</span>
                  </div>
                  <h3 className="text-base sm:text-lg font-semibold text-foreground mb-1 group-hover:text-cyan-500 transition-colors truncate sm:whitespace-normal">useRef & The DOM</h3>
                  <p className="text-sm text-muted-foreground line-clamp-2 hidden sm:block mb-6">Persist values safely and access real DOM nodes without extra re-renders.</p>
                </div>
              </div>
              <div className="hidden sm:flex items-center justify-between mt-auto pt-4 border-t border-border/40">
                <div className="flex items-center text-xs font-medium text-muted-foreground">
                  31 July 2026
                </div>
                <div className="flex items-center text-xs font-bold text-cyan-500 bg-cyan-500/10 px-3 py-1.5 rounded-lg group-hover:bg-cyan-500/20 transition-colors">
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
