import Link from "next/link";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Logo } from "@/components/ui/Logo";

export default function JavaPathPage() {
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
            <Link
              href="/canvas"
              className="inline-flex items-center px-4 py-2 text-sm font-medium text-primary-foreground bg-primary rounded-lg hover:opacity-90 transition-opacity"
            >
              Open Canvas
            </Link>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="pt-32 pb-20 mx-auto max-w-5xl px-6">
        {/* Header */}
        <div className="mb-16">
          <Link href="/" className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-foreground mb-8 transition-colors">
            <svg className="mr-2" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
            Back to Home
          </Link>
          <div className="flex items-center gap-5 mb-6">
            <div className="w-16 h-16 rounded-2xl bg-orange-500/10 text-orange-500 flex items-center justify-center">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/></svg>
            </div>
            <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-foreground">Java Internals</h1>
          </div>
          <p className="text-lg text-muted-foreground max-w-2xl leading-relaxed">
            Deep dive into the Java ecosystem. Explore how the JVM works, how code is compiled, and visualize the execution flow under the hood.
          </p>
        </div>

        {/* Modules Grid */}
        <div className="grid sm:grid-cols-2 gap-6">
          {/* Episode 1: Java Code Execution */}
          <Link href="/java/canvas/flow-of-execution" className="group">
            <div className="relative h-full p-8 rounded-2xl border border-border bg-card hover:border-primary/50 hover:shadow-[0_0_30px_-5px_rgba(var(--primary),0.2)] transition-all duration-300">
              <div className="absolute top-4 left-4 text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">Episode 1</div>
              <div className="absolute top-4 right-4 bg-primary/10 text-primary text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded">Interactive</div>
              <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-6 mt-4 group-hover:scale-110 transition-transform duration-300">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
              </div>
              <h3 className="text-2xl font-bold text-foreground mb-3 group-hover:text-primary transition-colors">Java Code Execution</h3>
              <p className="text-base text-muted-foreground mb-10 leading-relaxed">
                Follow a piece of Java code from source file to bytecode, through the JVM, and down to the CPU in a fully interactive canvas.
              </p>
              <div className="flex items-center justify-between mt-auto">
                <div className="flex -space-x-3">
                  <span className="w-10 h-10 rounded-full bg-blue-500/20 text-blue-500 border-4 border-card flex items-center justify-center text-xs font-bold z-30" title="Source">.java</span>
                  <span className="w-10 h-10 rounded-full bg-green-500/20 text-green-500 border-4 border-card flex items-center justify-center text-xs font-bold z-20" title="Bytecode">.class</span>
                  <span className="w-10 h-10 rounded-full bg-purple-500/20 text-purple-500 border-4 border-card flex items-center justify-center text-xs font-bold z-10" title="JVM">JVM</span>
                </div>
                <div className="flex items-center text-sm font-semibold text-primary group-hover:translate-x-1 transition-transform">
                  Launch <svg className="ml-2" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
                </div>
              </div>
            </div>
          </Link>

          {/* Episode 2: Platform Independence */}
          <Link href="/java/canvas/platform-independence" className="group">
            <div className="relative h-full p-8 rounded-2xl border border-border bg-card hover:border-amber-500/50 hover:shadow-[0_0_30px_-5px_rgba(245,158,11,0.25)] transition-all duration-300">
              <div className="absolute top-4 left-4 text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">Episode 2</div>
              <div className="absolute top-4 right-4 bg-amber-500/10 text-amber-500 text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded">New</div>
              <div className="w-12 h-12 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center mb-6 mt-4 group-hover:scale-110 transition-transform duration-300">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>
              </div>
              <h3 className="text-2xl font-bold text-foreground mb-3 group-hover:text-amber-500 transition-colors">How Can The Same Program Run Everywhere?</h3>
              <p className="text-base text-muted-foreground mb-10 leading-relaxed">
                Understand why Hello.class runs on Windows, Linux, and macOS without recompiling — and watch it cross the platform boundary live.
              </p>
              <div className="flex items-center justify-between mt-auto">
                <div className="flex -space-x-3">
                  <span className="w-10 h-10 rounded-full bg-green-500/20 text-green-500 border-4 border-card flex items-center justify-center text-xs font-bold z-30" title="Bytecode">.class</span>
                  <span className="w-10 h-10 rounded-full bg-blue-500/20 text-blue-500 border-4 border-card flex items-center justify-center text-[9px] font-bold z-20" title="Windows">Win</span>
                  <span className="w-10 h-10 rounded-full bg-orange-500/20 text-orange-500 border-4 border-card flex items-center justify-center text-[9px] font-bold z-10" title="Linux">Lnx</span>
                </div>
                <div className="flex items-center text-sm font-semibold text-amber-500 group-hover:translate-x-1 transition-transform">
                  Launch <svg className="ml-2" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
                </div>
              </div>
            </div>
          </Link>

          {/* Locked Lesson: Garbage Collection */}
          <div className="relative h-full p-8 rounded-2xl border border-border/40 bg-card/40 opacity-80 cursor-not-allowed">
            <div className="absolute top-4 right-4 text-muted-foreground/60">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
            </div>
            <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center text-muted-foreground mb-6">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>
            </div>
            <h3 className="text-2xl font-bold text-foreground/50 mb-3">Garbage Collection</h3>
            <p className="text-base text-muted-foreground/60 mb-8 leading-relaxed">
              Visualize how the JVM manages memory. Watch objects move from Eden space to Tenured generation, and see the Mark-and-Sweep algorithm in action.
            </p>
            <div className="mt-auto">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 text-xs font-bold uppercase tracking-widest bg-muted text-muted-foreground rounded-md">
                Coming Soon
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
