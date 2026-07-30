import Link from "next/link";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Logo } from "@/components/ui/Logo";
import { ChevronRight, Play } from "lucide-react";

export default function FrontendPathPage() {
  return (
    <div className="min-h-screen bg-background flex flex-col font-sans selection:bg-blue-500/30">
      {/* Navigation */}
      <nav className="h-16 border-b border-border/50 bg-background/80 backdrop-blur-md sticky top-0 z-50">
        <div className="h-full px-6 flex items-center justify-between max-w-6xl mx-auto">
          <div className="flex items-center gap-4">
            <Link href="/" className="flex items-center gap-2 group">
              <Logo size={24} />
            </Link>
            <div className="h-4 w-px bg-border hidden sm:block" />
            <Link href="/learning-paths" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors hidden sm:block">
              Paths
            </Link>
            <ChevronRight className="w-4 h-4 text-muted-foreground hidden sm:block" />
            <span className="text-sm font-semibold text-foreground">Frontend</span>
          </div>
          <ThemeToggle />
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-6 py-12 sm:py-20">
        <div className="max-w-3xl mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 text-blue-500 text-sm font-medium mb-6">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"></circle>
              <ellipse cx="12" cy="12" rx="10" ry="4"></ellipse>
              <ellipse cx="12" cy="12" rx="4" ry="10"></ellipse>
            </svg>
            Frontend Architecture
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-foreground mb-6">
            React Under the Hood
          </h1>
          <p className="text-lg leading-relaxed text-muted-foreground">
            Understand how modern frontend frameworks really work. We strip away the magic and visualize the exact steps from JSX compilation down to the browser's DOM.
          </p>
        </div>

        {/* Episodes List */}
        <div className="space-y-4">
          <h2 className="text-2xl font-bold tracking-tight text-foreground mb-6">Episodes</h2>

          {/* Episode 1 */}
          <Link href="/frontend/episodes/1" className="block group">
            <div className="relative p-6 sm:p-8 rounded-2xl border border-border bg-card hover:border-blue-500/50 hover:shadow-[0_0_30px_-5px_rgba(59,130,246,0.2)] transition-all duration-300 overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-bl-full -mr-8 -mt-8 transition-transform group-hover:scale-110" />
              
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 relative">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-3">
                    <span className="text-sm font-bold tracking-wider text-blue-500 uppercase">Episode 1</span>
                    <span className="px-2 py-0.5 rounded-full bg-border text-xs font-medium text-muted-foreground">Interactive</span>
                  </div>
                  <h3 className="text-2xl font-bold text-foreground mb-2 group-hover:text-blue-500 transition-colors">
                    JSX, Virtual DOM &amp; Reconciliation
                  </h3>
                  <p className="text-muted-foreground leading-relaxed max-w-2xl">
                    Discover how React transforms your components into a Virtual DOM tree, performs diffing to find exactly what changed, and updates the real DOM with pinpoint accuracy.
                  </p>
                </div>
                
                <div className="shrink-0 flex items-center justify-center w-12 h-12 rounded-full bg-blue-500 text-white shadow-lg shadow-blue-500/25 group-hover:scale-110 group-hover:shadow-blue-500/40 transition-all duration-300">
                  <Play className="w-5 h-5 ml-1" fill="currentColor" />
                </div>
              </div>
            </div>
          </Link>

          {/* Episode 2 */}
          <Link href="/frontend/episodes/2" className="block group">
            <div className="relative p-6 sm:p-8 rounded-2xl border border-border bg-card hover:border-violet-500/50 hover:shadow-[0_0_30px_-5px_rgba(139,92,246,0.2)] transition-all duration-300 overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-violet-500/5 rounded-bl-full -mr-8 -mt-8 transition-transform group-hover:scale-110" />

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 relative">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-3">
                    <span className="text-sm font-bold tracking-wider text-violet-500 uppercase">Episode 2</span>
                    <span className="px-2 py-0.5 rounded-full bg-border text-xs font-medium text-muted-foreground">Interactive</span>
                  </div>
                  <h3 className="text-2xl font-bold text-foreground mb-2 group-hover:text-violet-500 transition-colors">
                    Props, State &amp; One-Way Data Flow
                  </h3>
                  <p className="text-muted-foreground leading-relaxed max-w-2xl">
                    Visualize how props flow downward from parent to child, why components can never modify their own props, and how the &quot;lifting state up&quot; pattern keeps your app predictable.
                  </p>
                </div>

                <div className="shrink-0 flex items-center justify-center w-12 h-12 rounded-full bg-violet-500 text-white shadow-lg shadow-violet-500/25 group-hover:scale-110 group-hover:shadow-violet-500/40 transition-all duration-300">
                  <Play className="w-5 h-5 ml-1" fill="currentColor" />
                </div>
              </div>
            </div>
          </Link>

          {/* Episode 3 */}
          <Link href="/frontend/episodes/3" className="block group">
            <div className="relative p-6 sm:p-8 rounded-2xl border border-border bg-card hover:border-amber-500/50 hover:shadow-[0_0_30px_-5px_rgba(245,158,11,0.2)] transition-all duration-300 overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 rounded-bl-full -mr-8 -mt-8 transition-transform group-hover:scale-110" />

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 relative">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-3">
                    <span className="text-sm font-bold tracking-wider text-amber-500 uppercase">Episode 3</span>
                    <span className="px-2 py-0.5 rounded-full bg-border text-xs font-medium text-muted-foreground">Interactive</span>
                  </div>
                  <h3 className="text-2xl font-bold text-foreground mb-2 group-hover:text-amber-500 transition-colors">
                    useState — Batching &amp; Stale State
                  </h3>
                  <p className="text-muted-foreground leading-relaxed max-w-2xl">
                    Unpack the #1 live-coding interview trap: calling setState multiple times in one handler. Watch React&apos;s update queue in real time and see exactly why the functional update form exists.
                  </p>
                </div>

                <div className="shrink-0 flex items-center justify-center w-12 h-12 rounded-full bg-amber-500 text-white shadow-lg shadow-amber-500/25 group-hover:scale-110 group-hover:shadow-amber-500/40 transition-all duration-300">
                  <Play className="w-5 h-5 ml-1" fill="currentColor" />
                </div>
              </div>
            </div>
          </Link>

          {/* Episode 4 */}
          <Link href="/frontend/episodes/4" className="block group">
            <div className="relative p-6 sm:p-8 rounded-2xl border border-border bg-card hover:border-emerald-500/50 hover:shadow-[0_0_30px_-5px_rgba(52,211,153,0.2)] transition-all duration-300 overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-bl-full -mr-8 -mt-8 transition-transform group-hover:scale-110" />

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 relative">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-3">
                    <span className="text-sm font-bold tracking-wider text-emerald-500 uppercase">Episode 4</span>
                    <span className="px-2 py-0.5 rounded-full bg-border text-xs font-medium text-muted-foreground">Interactive</span>
                  </div>
                  <h3 className="text-2xl font-bold text-foreground mb-2 group-hover:text-emerald-500 transition-colors">
                    useEffect — Side Effects &amp; the Dependency Array
                  </h3>
                  <p className="text-muted-foreground leading-relaxed max-w-2xl">
                    Understand why side effects can&apos;t live inside the render body, trace the exact render → DOM update → paint → effect pipeline, and master all three forms of the dependency array.
                  </p>
                </div>

                <div className="shrink-0 flex items-center justify-center w-12 h-12 rounded-full bg-emerald-500 text-white shadow-lg shadow-emerald-500/25 group-hover:scale-110 group-hover:shadow-emerald-500/40 transition-all duration-300">
                  <Play className="w-5 h-5 ml-1" fill="currentColor" />
                </div>
              </div>
            </div>
          </Link>

          {/* Episode 5 */}
          <Link href="/frontend/episodes/5" className="block group">
            <div className="relative p-6 sm:p-8 rounded-2xl border border-border bg-card hover:border-rose-500/50 hover:shadow-[0_0_30px_-5px_rgba(244,63,94,0.2)] transition-all duration-300 overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-rose-500/5 rounded-bl-full -mr-8 -mt-8 transition-transform group-hover:scale-110" />

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 relative">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-3">
                    <span className="text-sm font-bold tracking-wider text-rose-500 uppercase">Episode 5</span>
                    <span className="px-2 py-0.5 rounded-full bg-border text-xs font-medium text-muted-foreground">Interactive</span>
                  </div>
                  <h3 className="text-2xl font-bold text-foreground mb-2 group-hover:text-rose-500 transition-colors">
                    Cleanup &amp; Race Conditions
                  </h3>
                  <p className="text-muted-foreground leading-relaxed max-w-2xl">
                    If your effect sets something up, your cleanup tears it down. Trace the exact cleanup lifecycle, fix the LiveClock bug, and watch how a stale network response overwrites the UI — and how to stop it.
                  </p>
                </div>

                <div className="shrink-0 flex items-center justify-center w-12 h-12 rounded-full bg-rose-500 text-white shadow-lg shadow-rose-500/25 group-hover:scale-110 group-hover:shadow-rose-500/40 transition-all duration-300">
                  <Play className="w-5 h-5 ml-1" fill="currentColor" />
                </div>
              </div>
            </div>
          </Link>

          {/* Episode 6 */}
          <Link href="/frontend/episodes/6" className="block group">
            <div className="relative p-6 sm:p-8 rounded-2xl border border-border bg-card hover:border-purple-500/50 hover:shadow-[0_0_30px_-5px_rgba(168,85,247,0.2)] transition-all duration-300 overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/5 rounded-bl-full -mr-8 -mt-8 transition-transform group-hover:scale-110" />

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 relative">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-3">
                    <span className="text-sm font-bold tracking-wider text-purple-500 uppercase">Episode 6</span>
                    <span className="px-2 py-0.5 rounded-full bg-border text-xs font-medium text-muted-foreground">Interactive</span>
                  </div>
                  <h3 className="text-2xl font-bold text-foreground mb-2 group-hover:text-purple-500 transition-colors">
                    useLayoutEffect vs useEffect
                  </h3>
                  <p className="text-muted-foreground leading-relaxed max-w-2xl">
                    Both run after the DOM is updated — only one runs before the browser paints. Watch the tooltip flicker bug appear with useEffect and disappear with useLayoutEffect, then learn why useLayoutEffect is almost never the right default.
                  </p>
                </div>

                <div className="shrink-0 flex items-center justify-center w-12 h-12 rounded-full bg-purple-500 text-white shadow-lg shadow-purple-500/25 group-hover:scale-110 group-hover:shadow-purple-500/40 transition-all duration-300">
                  <Play className="w-5 h-5 ml-1" fill="currentColor" />
                </div>
              </div>
            </div>
          </Link>

        </div>

      </main>
    </div>
  );
}
