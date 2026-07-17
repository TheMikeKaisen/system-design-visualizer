import Link from "next/link";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Logo } from "@/components/ui/Logo";

export default function JavascriptPathPage() {
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
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center p-2 bg-[#F7DF1E]/10 overflow-hidden shadow-sm">
               {/* JS Logo SVG */}
               <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 630 630" className="w-12 h-12">
                 <rect width="630" height="630" fill="#f7df1e"/>
                 <path d="m423.2 492.19c12.69 20.72 29.2 35.95 58.4 35.95 24.53 0 40.2-12.26 40.2-29.2 0-20.3-16.1-27.49-43.1-39.3l-14.8-6.35c-42.72-18.2-71.1-41-71.1-89.2 0-44.4 33.83-78.2 86.7-78.2 37.64 0 64.7 13.1 84.2 47.4l-46.1 29.6c-10.15-18.2-21.1-25.37-38.1-25.37-17.34 0-28.33 11-28.33 25.37 0 17.76 11 24.95 36.4 35.95l14.8 6.34c50.3 21.57 78.7 43.56 78.7 93 0 53.3-41.87 82.5-98.1 82.5-54.98 0-90.5-26.2-107.88-60.54zm-209.13 5.13c9.3 16.5 17.76 30.45 38.1 30.45 19.45 0 31.72-7.61 31.72-37.2v-201.3h59.2v202.1c0 61.3-35.94 89.2-88.4 89.2-47.4 0-74.85-24.53-88.81-54.07z"/>
               </svg>
            </div>
            <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-foreground">JavaScript</h1>
          </div>
          <p className="text-lg text-muted-foreground max-w-2xl leading-relaxed">
            Look under the hood of the V8 engine. Explore how JavaScript creates execution contexts, manages the call stack, and handles asynchronous events.
          </p>
        </div>

        {/* Modules Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Episode 1: The Call Stack */}
          <Link href="/javascript/simulator/call-stack" className="group">
            <div className="relative h-full p-4 sm:p-6 rounded-2xl border border-border bg-card hover:border-[#F7DF1E]/50 hover:shadow-[0_0_30px_-5px_rgba(247,223,30,0.2)] transition-all duration-300 flex flex-col justify-center">
              <div className="hidden sm:flex items-center justify-between mb-4">
                <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">Episode 1</div>
                {/* <div className="bg-[#F7DF1E]/10 text-amber-500 text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded">Interactive</div> */}
              </div>
              
              <div className="flex items-center sm:block gap-4 sm:gap-0">
                <div className="w-12 h-12 sm:w-10 sm:h-10 shrink-0 rounded-xl bg-[#F7DF1E]/10 text-amber-500 flex items-center justify-center sm:mb-4 group-hover:scale-110 transition-transform duration-300">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="20" x2="12" y2="10"></line><line x1="18" y1="20" x2="18" y2="4"></line><line x1="6" y1="20" x2="6" y2="16"></line></svg>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex sm:hidden items-center gap-2 mb-1">
                    <span className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground/60">Episode 1</span>
                  </div>
                  <h3 className="text-base sm:text-xl font-bold text-foreground sm:mb-3 group-hover:text-amber-500 transition-colors line-clamp-2">Execution Contexts & Call Stack</h3>
                  <p className="hidden sm:block text-sm text-muted-foreground mb-6 leading-relaxed line-clamp-3">
                    Watch exactly how JavaScript executes code. See functions get pushed to the stack, memory getting allocated during hoisting, and variables updating in real-time.
                  </p>
                </div>
                <div className="sm:hidden flex items-center justify-center text-muted-foreground group-hover:text-amber-500 transition-colors">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 18l6-6-6-6"/></svg>
                </div>
              </div>

              <div className="hidden sm:flex items-center justify-between mt-auto pt-4 border-t border-border/40">
                <div className="flex items-center text-xs font-medium text-muted-foreground">
                  13 July 2026
                </div>
                <div className="flex items-center text-xs font-bold text-amber-500 bg-amber-500/10 px-3 py-1.5 rounded-lg group-hover:bg-amber-500/20 transition-colors">
                  Launch <svg className="ml-1.5 w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
                </div>
              </div>
            </div>
          </Link>

          {/* Episode 2: Hoisting */}
          <Link href="/javascript/simulator/hoisting" className="group">
            <div className="relative h-full p-4 sm:p-6 rounded-2xl border border-border bg-card hover:border-[#F7DF1E]/50 hover:shadow-[0_0_30px_-5px_rgba(247,223,30,0.2)] transition-all duration-300 flex flex-col justify-center">
              <div className="hidden sm:flex items-center justify-between mb-4">
                <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">Episode 2</div>
              </div>
              
              <div className="flex items-center sm:block gap-4 sm:gap-0">
                <div className="w-12 h-12 sm:w-10 sm:h-10 shrink-0 rounded-xl bg-[#F7DF1E]/10 text-amber-500 flex items-center justify-center sm:mb-4 group-hover:scale-110 transition-transform duration-300">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 19V5"/><path d="m5 12 7-7 7 7"/></svg>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex sm:hidden items-center gap-2 mb-1">
                    <span className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground/60">Episode 2</span>
                  </div>
                  <h3 className="text-base sm:text-xl font-bold text-foreground sm:mb-3 group-hover:text-amber-500 transition-colors line-clamp-2">Hoisting & The TDZ</h3>
                  <p className="hidden sm:block text-sm text-muted-foreground mb-6 leading-relaxed line-clamp-3">
                    Master the nuances of var vs let/const, function declarations vs expressions, and see the Temporal Dead Zone in action.
                  </p>
                </div>
                <div className="sm:hidden flex items-center justify-center text-muted-foreground group-hover:text-amber-500 transition-colors">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 18l6-6-6-6"/></svg>
                </div>
              </div>

              <div className="hidden sm:flex items-center justify-between mt-auto pt-4 border-t border-border/40">
                <div className="flex items-center text-xs font-medium text-muted-foreground">
                  14 July 2026
                </div>
                <div className="flex items-center text-xs font-bold text-amber-500 bg-amber-500/10 px-3 py-1.5 rounded-lg group-hover:bg-amber-500/20 transition-colors">
                  Launch <svg className="ml-1.5 w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
                </div>
              </div>
            </div>
          </Link>

          {/* Episode 3: Scope Chaining */}
          <Link href="/javascript/simulator/scope" className="group">
            <div className="relative h-full p-4 sm:p-6 rounded-2xl border border-border bg-card hover:border-[#F7DF1E]/50 hover:shadow-[0_0_30px_-5px_rgba(247,223,30,0.2)] transition-all duration-300 flex flex-col justify-center">
              <div className="hidden sm:flex items-center justify-between mb-4">
                <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">Episode 3</div>
              </div>
              
              <div className="flex items-center sm:block gap-4 sm:gap-0">
                <div className="w-12 h-12 sm:w-10 sm:h-10 shrink-0 rounded-xl bg-[#F7DF1E]/10 text-amber-500 flex items-center justify-center sm:mb-4 group-hover:scale-110 transition-transform duration-300">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path></svg>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex sm:hidden items-center gap-2 mb-1">
                    <span className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground/60">Episode 3</span>
                  </div>
                  <h3 className="text-base sm:text-xl font-bold text-foreground sm:mb-3 group-hover:text-amber-500 transition-colors line-clamp-2">Scope Chaining</h3>
                  <p className="hidden sm:block text-sm text-muted-foreground mb-6 leading-relaxed line-clamp-3">
                    Watch exactly how JavaScript traverses the lexical environment to resolve variables, and understand shadowing.
                  </p>
                </div>
                <div className="sm:hidden flex items-center justify-center text-muted-foreground group-hover:text-amber-500 transition-colors">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 18l6-6-6-6"/></svg>
                </div>
              </div>

              <div className="hidden sm:flex items-center justify-between mt-auto pt-4 border-t border-border/40">
                <div className="flex items-center text-xs font-medium text-muted-foreground">
                  14 July 2026
                </div>
                <div className="flex items-center text-xs font-bold text-amber-500 bg-amber-500/10 px-3 py-1.5 rounded-lg group-hover:bg-amber-500/20 transition-colors">
                  Launch <svg className="ml-1.5 w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
                </div>
              </div>
            </div>
          </Link>

          {/* Episode 4: let, const & var */}
          <Link href="/javascript/simulator/let-const" className="group">
            <div className="relative h-full p-4 sm:p-6 rounded-2xl border border-border bg-card hover:border-[#F7DF1E]/50 hover:shadow-[0_0_30px_-5px_rgba(247,223,30,0.2)] transition-all duration-300 flex flex-col justify-center">
              <div className="hidden sm:flex items-center justify-between mb-4">
                <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">Episode 4</div>
              </div>
              
              <div className="flex items-center sm:block gap-4 sm:gap-0">
                <div className="w-12 h-12 sm:w-10 sm:h-10 shrink-0 rounded-xl bg-[#F7DF1E]/10 text-amber-500 flex items-center justify-center sm:mb-4 group-hover:scale-110 transition-transform duration-300">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex sm:hidden items-center gap-2 mb-1">
                    <span className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground/60">Episode 4</span>
                  </div>
                  <h3 className="text-base sm:text-xl font-bold text-foreground sm:mb-3 group-hover:text-amber-500 transition-colors line-clamp-2">let, const & var (TDZ)</h3>
                  <p className="hidden sm:block text-sm text-muted-foreground mb-6 leading-relaxed line-clamp-3">
                    Discover the differences between declarations. See the Temporal Dead Zone block access, and learn about reassignment rules.
                  </p>
                </div>
                <div className="sm:hidden flex items-center justify-center text-muted-foreground group-hover:text-amber-500 transition-colors">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 18l6-6-6-6"/></svg>
                </div>
              </div>

              <div className="hidden sm:flex items-center justify-between mt-auto pt-4 border-t border-border/40">
                <div className="flex items-center text-xs font-medium text-muted-foreground">
                  14 July 2026
                </div>
                <div className="flex items-center text-xs font-bold text-amber-500 bg-amber-500/10 px-3 py-1.5 rounded-lg group-hover:bg-amber-500/20 transition-colors">
                  Launch <svg className="ml-1.5 w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
                </div>
              </div>
            </div>
          </Link>

          {/* Episode 5: Block Scope */}
          <Link href="/javascript/simulator/block-scope" className="group">
            <div className="relative h-full p-4 sm:p-6 rounded-2xl border border-border bg-card hover:border-[#F7DF1E]/50 hover:shadow-[0_0_30px_-5px_rgba(247,223,30,0.2)] transition-all duration-300 flex flex-col justify-center">
              <div className="hidden sm:flex items-center justify-between mb-4">
                <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">Episode 5</div>
              </div>
              
              <div className="flex items-center sm:block gap-4 sm:gap-0">
                <div className="w-12 h-12 sm:w-10 sm:h-10 shrink-0 rounded-xl bg-[#F7DF1E]/10 text-amber-500 flex items-center justify-center sm:mb-4 group-hover:scale-110 transition-transform duration-300">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><line x1="9" y1="3" x2="9" y2="21"></line></svg>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex sm:hidden items-center gap-2 mb-1">
                    <span className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground/60">Episode 5</span>
                  </div>
                  <h3 className="text-base sm:text-xl font-bold text-foreground sm:mb-3 group-hover:text-amber-500 transition-colors line-clamp-2">Block Scope & Shadowing</h3>
                  <p className="hidden sm:block text-sm text-muted-foreground mb-6 leading-relaxed line-clamp-3">
                    Variables live inside rooms, and JavaScript searches through rooms. Understand how blocks create scopes and shadowing.
                  </p>
                </div>
                <div className="sm:hidden flex items-center justify-center text-muted-foreground group-hover:text-amber-500 transition-colors">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 18l6-6-6-6"/></svg>
                </div>
              </div>

              <div className="hidden sm:flex items-center justify-between mt-auto pt-4 border-t border-border/40">
                <div className="flex items-center text-xs font-medium text-muted-foreground">
                  15 July 2026
                </div>
                <div className="flex items-center text-xs font-bold text-amber-500 bg-amber-500/10 px-3 py-1.5 rounded-lg group-hover:bg-amber-500/20 transition-colors">
                  Launch <svg className="ml-1.5 w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
                </div>
              </div>
            </div>
          </Link>

          {/* Episode 6: Closures */}
          <Link href="/javascript/simulator/closures" className="group">
            <div className="relative h-full p-4 sm:p-6 rounded-2xl border border-border bg-card hover:border-[#F7DF1E]/50 hover:shadow-[0_0_30px_-5px_rgba(247,223,30,0.2)] transition-all duration-300 flex flex-col justify-center">
              <div className="hidden sm:flex items-center justify-between mb-4">
                <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">Episode 6</div>
              </div>
              
              <div className="flex items-center sm:block gap-4 sm:gap-0">
                <div className="w-12 h-12 sm:w-10 sm:h-10 shrink-0 rounded-xl bg-[#F7DF1E]/10 text-amber-500 flex items-center justify-center sm:mb-4 group-hover:scale-110 transition-transform duration-300">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path><polyline points="3.29 7 12 12 20.71 7"></polyline><line x1="12" y1="22" x2="12" y2="12"></line></svg>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex sm:hidden items-center gap-2 mb-1">
                    <span className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground/60">Episode 6</span>
                  </div>
                  <h3 className="text-base sm:text-xl font-bold text-foreground sm:mb-3 group-hover:text-amber-500 transition-colors line-clamp-2">Closures & Callbacks</h3>
                  <p className="hidden sm:block text-sm text-muted-foreground mb-6 leading-relaxed line-clamp-3">
                    See exactly how a function retains access to its lexical scope even after its outer function has finished executing. Learn data hiding and Web APIs.
                  </p>
                </div>
                <div className="sm:hidden flex items-center justify-center text-muted-foreground group-hover:text-amber-500 transition-colors">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 18l6-6-6-6"/></svg>
                </div>
              </div>

              <div className="hidden sm:flex items-center justify-between mt-auto pt-4 border-t border-border/40">
                <div className="flex items-center text-xs font-medium text-muted-foreground">
                  16 July 2026
                </div>
                <div className="flex items-center text-xs font-bold text-amber-500 bg-amber-500/10 px-3 py-1.5 rounded-lg group-hover:bg-amber-500/20 transition-colors">
                  Launch <svg className="ml-1.5 w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
                </div>
              </div>
            </div>
          </Link>

          {/* Episode 7: The Event Loop */}
          <Link href="/javascript/simulator/event-loop" className="group">
            <div className="relative h-full p-4 sm:p-6 rounded-2xl border border-border bg-card hover:border-[#F7DF1E]/50 hover:shadow-[0_0_30px_-5px_rgba(247,223,30,0.2)] transition-all duration-300 flex flex-col justify-center">
              <div className="hidden sm:flex items-center justify-between mb-4">
                <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">Episode 7</div>
              </div>
              
              <div className="flex items-center sm:block gap-4 sm:gap-0">
                <div className="w-12 h-12 sm:w-10 sm:h-10 shrink-0 rounded-xl bg-[#F7DF1E]/10 text-amber-500 flex items-center justify-center sm:mb-4 group-hover:scale-110 transition-transform duration-300">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex sm:hidden items-center gap-2 mb-1">
                    <span className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground/60">Episode 7</span>
                  </div>
                  <h3 className="text-base sm:text-xl font-bold text-foreground sm:mb-3 group-hover:text-amber-500 transition-colors line-clamp-2">The Event Loop & Web APIs</h3>
                  <p className="hidden sm:block text-sm text-muted-foreground mb-6 leading-relaxed line-clamp-3">
                    Watch asynchronous JavaScript in action. See how the Event Loop coordinates the Microtask Queue, Callback Queue, and Call Stack.
                  </p>
                </div>
                <div className="sm:hidden flex items-center justify-center text-muted-foreground group-hover:text-amber-500 transition-colors">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 18l6-6-6-6"/></svg>
                </div>
              </div>

              <div className="hidden sm:flex items-center justify-between mt-auto pt-4 border-t border-border/40">
                <div className="flex items-center text-xs font-medium text-muted-foreground">
                  17 July 2026
                </div>
                <div className="flex items-center text-xs font-bold text-amber-500 bg-amber-500/10 px-3 py-1.5 rounded-lg group-hover:bg-amber-500/20 transition-colors">
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
