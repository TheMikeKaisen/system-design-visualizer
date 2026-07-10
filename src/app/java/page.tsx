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
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center p-2 bg-white overflow-hidden shadow-sm">
              <img src="/logo/java.png" alt="Java Logo" className="w-full h-full object-contain" />
            </div>
            <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-foreground">Java Internals</h1>
          </div>
          <p className="text-lg text-muted-foreground max-w-2xl leading-relaxed">
            Deep dive into the Java ecosystem. Explore how the JVM works, how code is compiled, and visualize the execution flow under the hood.
          </p>
        </div>

        {/* Modules Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Episode 1: Java Code Execution */}
          <Link href="/java/canvas/flow-of-execution" className="group">
            <div className="relative h-full p-4 sm:p-6 rounded-2xl border border-border bg-card hover:border-primary/50 hover:shadow-[0_0_30px_-5px_rgba(var(--primary),0.2)] transition-all duration-300 flex flex-col justify-center">
              <div className="hidden sm:flex items-center justify-between mb-4">
                <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">Episode 1</div>
                <div className="bg-primary/10 text-primary text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded">Interactive</div>
              </div>
              
              <div className="flex items-center sm:block gap-4 sm:gap-0">
                <div className="w-12 h-12 sm:w-10 sm:h-10 shrink-0 rounded-xl bg-primary/10 text-primary flex items-center justify-center sm:mb-4 group-hover:scale-110 transition-transform duration-300">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex sm:hidden items-center gap-2 mb-1">
                    <span className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground/60">Episode 1</span>
                  </div>
                  <h3 className="text-base sm:text-xl font-bold text-foreground sm:mb-3 group-hover:text-primary transition-colors line-clamp-2">Java Code Execution</h3>
                  <p className="hidden sm:block text-sm text-muted-foreground mb-6 leading-relaxed line-clamp-3">
                    Follow a piece of Java code from source file to bytecode, through the JVM, and down to the CPU in a fully interactive canvas.
                  </p>
                </div>
                <div className="sm:hidden flex items-center justify-center text-muted-foreground group-hover:text-primary transition-colors">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 18l6-6-6-6"/></svg>
                </div>
              </div>

              <div className="hidden sm:flex items-center justify-between mt-auto pt-4 border-t border-border/40">
                <div className="flex items-center text-xs font-medium text-muted-foreground">
                  7 July 2026
                </div>
                <div className="flex items-center text-xs font-bold text-primary bg-primary/10 px-3 py-1.5 rounded-lg group-hover:bg-primary/20 transition-colors">
                  Launch <svg className="ml-1.5 w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
                </div>
              </div>
            </div>
          </Link>

          {/* Episode 2: Platform Independence */}
          <Link href="/java/canvas/platform-independence" className="group">
            <div className="relative h-full p-4 sm:p-6 rounded-2xl border border-border bg-card hover:border-amber-500/50 hover:shadow-[0_0_30px_-5px_rgba(245,158,11,0.25)] transition-all duration-300 flex flex-col justify-center">
              <div className="hidden sm:flex items-center justify-between mb-4">
                <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">Episode 2</div>
                <div className="bg-amber-500/10 text-amber-500 text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded">New</div>
              </div>
              
              <div className="flex items-center sm:block gap-4 sm:gap-0">
                <div className="w-12 h-12 sm:w-10 sm:h-10 shrink-0 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center sm:mb-4 group-hover:scale-110 transition-transform duration-300">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex sm:hidden items-center gap-2 mb-1">
                    <span className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground/60">Episode 2</span>
                  </div>
                  <h3 className="text-base sm:text-xl font-bold text-foreground sm:mb-3 group-hover:text-amber-500 transition-colors line-clamp-2">How Can The Same Program Run Everywhere?</h3>
                  <p className="hidden sm:block text-sm text-muted-foreground mb-6 leading-relaxed line-clamp-3">
                    Understand why Hello.class runs on Windows, Linux, and macOS without recompiling — and watch it cross the platform boundary live.
                  </p>
                </div>
                <div className="sm:hidden flex items-center justify-center text-muted-foreground group-hover:text-amber-500 transition-colors">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 18l6-6-6-6"/></svg>
                </div>
              </div>

              <div className="hidden sm:flex items-center justify-between mt-auto pt-4 border-t border-border/40">
                <div className="flex items-center text-xs font-medium text-muted-foreground">
                  7 July 2026
                </div>
                <div className="flex items-center text-xs font-bold text-amber-500 bg-amber-500/10 px-3 py-1.5 rounded-lg group-hover:bg-amber-500/20 transition-colors">
                  Launch <svg className="ml-1.5 w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
                </div>
              </div>
            </div>
          </Link>

          {/* Episode 3: Class Loading */}
          <Link href="/java/canvas/how-java-loads-classes" className="group">
            <div className="relative h-full p-4 sm:p-6 rounded-2xl border border-border bg-card hover:border-purple-500/50 hover:shadow-[0_0_30px_-5px_rgba(168,85,247,0.25)] transition-all duration-300 flex flex-col justify-center">
              <div className="hidden sm:flex items-center justify-between mb-4">
                <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">Episode 3</div>
                <div className="bg-purple-500/10 text-purple-500 text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded">New</div>
              </div>
              
              <div className="flex items-center sm:block gap-4 sm:gap-0">
                <div className="w-12 h-12 sm:w-10 sm:h-10 shrink-0 rounded-xl bg-purple-500/10 text-purple-500 flex items-center justify-center sm:mb-4 group-hover:scale-110 transition-transform duration-300">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex sm:hidden items-center gap-2 mb-1">
                    <span className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground/60">Episode 3</span>
                  </div>
                  <h3 className="text-base sm:text-xl font-bold text-foreground sm:mb-3 group-hover:text-purple-500 transition-colors line-clamp-2">How Does Java Find Classes?</h3>
                  <p className="hidden sm:block text-sm text-muted-foreground mb-6 leading-relaxed line-clamp-3">
                    When you run `java Hello`, where does the JVM look? Understand the class path, external JARs, and why `java.lang.String` doesn't need to be downloaded.
                  </p>
                </div>
                <div className="sm:hidden flex items-center justify-center text-muted-foreground group-hover:text-purple-500 transition-colors">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 18l6-6-6-6"/></svg>
                </div>
              </div>

              <div className="hidden sm:flex items-center justify-between mt-auto pt-4 border-t border-border/40">
                <div className="flex items-center text-xs font-medium text-muted-foreground">
                  9 July 2026
                </div>
                <div className="flex items-center text-xs font-bold text-purple-500 bg-purple-500/10 px-3 py-1.5 rounded-lg group-hover:bg-purple-500/20 transition-colors">
                  Launch <svg className="ml-1.5 w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
                </div>
              </div>
            </div>
          </Link>

          {/* Episode 4: The Class Lifecycle */}
          <Link href="/java/canvas/class-lifecycle" className="group">
            <div className="relative h-full p-4 sm:p-6 rounded-2xl border border-border bg-card hover:border-emerald-500/50 hover:shadow-[0_0_30px_-5px_rgba(16,185,129,0.25)] transition-all duration-300 flex flex-col justify-center">
              <div className="hidden sm:flex items-center justify-between mb-4">
                <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">Episode 4</div>
                <div className="bg-emerald-500/10 text-emerald-500 text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded">New</div>
              </div>
              
              <div className="flex items-center sm:block gap-4 sm:gap-0">
                <div className="w-12 h-12 sm:w-10 sm:h-10 shrink-0 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center sm:mb-4 group-hover:scale-110 transition-transform duration-300">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="m9 12 2 2 4-4"/></svg>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex sm:hidden items-center gap-2 mb-1">
                    <span className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground/60">Episode 4</span>
                  </div>
                  <h3 className="text-base sm:text-xl font-bold text-foreground sm:mb-3 group-hover:text-emerald-500 transition-colors line-clamp-2">The Class Lifecycle</h3>
                  <p className="hidden sm:block text-sm text-muted-foreground mb-6 leading-relaxed line-clamp-3">
                    Loading, Linking, and Initialization. Watch how the JVM prepares a class before you can even create an object.
                  </p>
                </div>
                <div className="sm:hidden flex items-center justify-center text-muted-foreground group-hover:text-emerald-500 transition-colors">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 18l6-6-6-6"/></svg>
                </div>
              </div>

              <div className="hidden sm:flex items-center justify-between mt-auto pt-4 border-t border-border/40">
                <div className="flex items-center text-xs font-medium text-muted-foreground">
                  10 July 2026
                </div>
                <div className="flex items-center text-xs font-bold text-emerald-500 bg-emerald-500/10 px-3 py-1.5 rounded-lg group-hover:bg-emerald-500/20 transition-colors">
                  Launch <svg className="ml-1.5 w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
                </div>
              </div>
            </div>
          </Link>

          {/* Episode 5 (Coming Soon) */}
          <div className="relative h-full p-4 sm:p-6 rounded-2xl border border-border/40 bg-card/40 opacity-80 cursor-not-allowed flex flex-col justify-center">
            <div className="hidden sm:flex items-center justify-between mb-4">
              <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/40">Episode 5</div>
              <div className="text-muted-foreground/60">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
              </div>
            </div>
            
            <div className="flex items-center sm:block gap-4 sm:gap-0">
              <div className="w-12 h-12 sm:w-10 sm:h-10 shrink-0 rounded-xl bg-muted flex items-center justify-center text-muted-foreground sm:mb-4">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex sm:hidden items-center gap-2 mb-1">
                  <span className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground/40">Episode 5</span>
                </div>
                <h3 className="text-base sm:text-xl font-bold text-foreground/50 sm:mb-3 line-clamp-2">Garbage Collection</h3>
                <p className="hidden sm:block text-sm text-muted-foreground/60 mb-6 leading-relaxed line-clamp-3">
                  Visualize how the JVM manages memory. Watch objects move from Eden space to Tenured generation, and see the Mark-and-Sweep algorithm in action.
                </p>
              </div>
              <div className="sm:hidden flex items-center justify-center text-muted-foreground/40">
                 <span className="text-[9px] font-bold uppercase tracking-widest">Soon</span>
              </div>
            </div>

            <div className="hidden sm:block mt-auto pt-4 border-t border-border/20">
              <div className="inline-flex items-center justify-center w-full px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest bg-muted text-muted-foreground rounded-lg">
                Coming Soon
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
