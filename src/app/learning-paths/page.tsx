import Link from "next/link";
import { AppNavbar } from "@/components/ui/AppNavbar";
import { ArrowLeft, ArrowRight, Cpu, Terminal, Database, Layers, Server, Network } from "lucide-react";
import { EditorialDisciplineCard } from "@/components/learning-paths/EditorialDisciplineCard";

// Verified Single Sources of Truth for episode counts
import { OPERATING_SYSTEMS_EPISODES } from "@/app/operating-systems/episodes";
import { COMPUTER_NETWORKS_EPISODES } from "@/app/computer-networks/episodes";
import { JAVASCRIPT_EPISODES } from "@/app/javascript/episodes";
import { JAVA_EPISODES } from "@/app/java/episodes";
import { FRONTEND_EPISODES } from "@/app/frontend/episodes";
import { BACKEND_EPISODES } from "@/app/backend/episodes";

export default function LearningPathsPage() {
  const osCount = OPERATING_SYSTEMS_EPISODES.length;
  const networkCount = COMPUTER_NETWORKS_EPISODES.length;
  const jsCount = JAVASCRIPT_EPISODES.length;
  const javaCount = JAVA_EPISODES.length;
  const frontendCount = FRONTEND_EPISODES.length;
  const backendCount = BACKEND_EPISODES.length;
  const totalEpisodes = osCount + networkCount + jsCount + javaCount + frontendCount + backendCount;

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col font-sans selection:bg-amber-500/25 selection:text-amber-950 dark:selection:text-amber-200">
      {/* Standardized Navigation */}
      <AppNavbar />

      {/* Main Content Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 pt-28 sm:pt-32 pb-20 sm:pb-28">
        {/* Navigation Breadcrumb matching /subject pages */}
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm font-medium text-zinc-600 dark:text-zinc-400 hover:text-foreground mb-10 transition-colors group"
        >
          <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-0.5" />
          <span>Back to Home</span>
        </Link>

        {/* Editorial Header */}
        <div className="max-w-3xl mb-14 sm:mb-16">
          <div className="inline-flex items-center gap-2 text-xs font-mono font-semibold tracking-wider text-zinc-500 dark:text-zinc-400 uppercase mb-3">
            <span>SYSTEM SIMULATOR</span>
            <span className="text-zinc-400 dark:text-zinc-600">/</span>
            <span>LEARNING PATHS</span>
          </div>

          <h1
            className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-[#0A0A0A] dark:text-zinc-50 leading-[1.12]"
            style={{ textWrap: "balance" }}
          >
            Understand systems.{" "}
            <span className="block sm:inline text-zinc-500 dark:text-zinc-400 font-bold">
              From the inside out.
            </span>
          </h1>

          <p className="mt-5 text-base sm:text-lg leading-relaxed text-zinc-600 dark:text-zinc-400 max-w-2xl font-normal">
            Interactive simulations of the internals you usually can’t see — from OS schedulers and language runtimes to network protocols.          </p>

          <div className="mt-6 flex flex-wrap items-center gap-3">
            <Link
              href="/canvas"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800/80 dark:hover:bg-zinc-700/80 text-zinc-800 dark:text-zinc-200 border border-zinc-200/80 dark:border-zinc-700/60 transition-colors"
            >
              <Network className="w-3.5 h-3.5 text-primary" />
              <span>Open Canvas Studio</span>
              <ArrowRight className="w-3 h-3 text-muted-foreground" />
            </Link>

            <span className="text-xs font-mono text-zinc-600 dark:text-zinc-300 px-3 py-1.5 rounded-lg border border-border/40 bg-muted/20">
              {totalEpisodes} Curated Episodes
            </span>
          </div>
        </div>

        {/* ── Stratum 1: Foundations (Operating Systems & Computer Networks) ── */}
        <section className="mb-12 sm:mb-14" aria-labelledby="stratum-foundations-heading">
          <div className="flex items-baseline justify-between border-b border-border/60 pb-3 mb-6">
            <h2
              id="stratum-foundations-heading"
              className="text-lg sm:text-xl font-bold tracking-tight text-foreground flex items-center gap-2"
            >
              <span>Foundations</span>
              <span className="text-xs font-mono font-normal text-zinc-500 dark:text-zinc-400">
                (Kernel, Hardware & Network Substrate)
              </span>
            </h2>
            <span className="text-xs font-mono text-zinc-500">
              {osCount + networkCount} Modules
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Operating Systems */}
            <EditorialDisciplineCard
              id="operating-systems"
              title="Operating Systems"
              eyebrow="Foundations // Kernel Architecture"
              badge={`${osCount}`}
              description="Explore how schedulers allocate CPU time, processes compete for memory, and threads synchronize without data corruption."
              topics={["CPU Scheduling", "Process Control Blocks", "Mutex Synchronization", "Race Conditions"]}
              icon={Cpu}
              accentColor="#0ea5e9"
              accentBg="bg-sky-500/10"
              accentBorder="border-border/60 hover:border-sky-500/70 dark:hover:border-sky-500/60"
              accentText="text-sky-500 dark:text-sky-400"
              ctaText="Explore Operating Systems"
              href="/operating-systems"
            />

            {/* Computer Networks */}
            <EditorialDisciplineCard
              id="computer-networks"
              title="Computer Networks"
              eyebrow="Foundations // Network Substrate"
              badge={`${networkCount}`}
              description="Watch how network interfaces, transport ports, and kernel socket 4-tuples route packets between client applications and server endpoints."
              topics={["Socket 4-Tuples", "TCP 3-Way Handshake", "Port Multiplexing", "Packet Encapsulation"]}
              icon={Network}
              accentColor="#14b8a6"
              accentBg="bg-teal-500/10"
              accentBorder="border-border/60 hover:border-teal-500/70 dark:hover:border-teal-500/60"
              accentText="text-teal-500 dark:text-teal-400"
              ctaText="Explore Computer Networks"
              href="/computer-networks"
            />
          </div>
        </section>

        {/* ── Stratum 2: Runtimes (JavaScript & Java/JVM) ── */}
        <section className="mb-12 sm:mb-14" aria-labelledby="stratum-runtimes-heading">
          <div className="flex items-baseline justify-between border-b border-border/60 pb-3 mb-6">
            <h2
              id="stratum-runtimes-heading"
              className="text-lg sm:text-xl font-bold tracking-tight text-foreground flex items-center gap-2"
            >
              <span>Runtimes</span>
              <span className="text-xs font-mono font-normal text-zinc-500 dark:text-zinc-400">
                (Execution Engines & Memory Models)
              </span>
            </h2>
            <span className="text-xs font-mono text-zinc-500">
              {jsCount + javaCount} Modules
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* JavaScript Card */}
            <EditorialDisciplineCard
              id="javascript"
              title="JavaScript"
              eyebrow="Runtime // V8 Engine"
              badge={`${jsCount}`}
              description="Follow the call stack, lexical scope chains, closures, and the event loop as code executes one discrete step at a time."
              topics={["Call Stack", "Scope Chains", "Closures", "Event Loop"]}
              icon={Terminal}
              accentColor="#f59e0b"
              accentBg="bg-amber-500/10"
              accentBorder="border-border/60 hover:border-amber-500/70 dark:hover:border-amber-500/60"
              accentText="text-amber-500 dark:text-amber-400"
              ctaText="Explore JavaScript Runtime"
              href="/javascript"
            />

            {/* Java & JVM Architecture Card */}
            <EditorialDisciplineCard
              id="java"
              title="Java & JVM Architecture"
              eyebrow="Runtime // Virtual Machine"
              badge={`${javaCount}`}
              description="Trace the journey from source code and bytecode verification down to JVM runtime memory and CPU instruction execution."
              topics={["Bytecode Execution", "Class Loading", "Stack vs Heap", "Typecasting"]}
              icon={Database}
              accentColor="#10b981"
              accentBg="bg-emerald-500/10"
              accentBorder="border-border/60 hover:border-emerald-500/70 dark:hover:border-emerald-500/60"
              accentText="text-emerald-500 dark:text-emerald-400"
              ctaText="Explore Java & JVM"
              href="/java"
            />
          </div>
        </section>

        {/* ── Stratum 3: Application Architecture (Frontend & Backend) ── */}
        <section className="mb-12 sm:mb-14" aria-labelledby="stratum-application-heading">
          <div className="flex items-baseline justify-between border-b border-border/60 pb-3 mb-6">
            <h2
              id="stratum-application-heading"
              className="text-lg sm:text-xl font-bold tracking-tight text-foreground flex items-center gap-2"
            >
              <span>Application Architecture</span>
              <span className="text-xs font-mono font-normal text-zinc-500 dark:text-zinc-400">
                (Rendering, Concurrency & Network Layers)
              </span>
            </h2>
            <span className="text-xs font-mono text-zinc-500">
              {frontendCount + backendCount} Modules
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Frontend Architecture Card */}
            <EditorialDisciplineCard
              id="frontend"
              title="Frontend Architecture"
              eyebrow="Application // Browser Internals"
              badge={`${frontendCount}`}
              description="Understand reconciliation, state update batching, effect lifecycles, and the mechanics behind modern UI frameworks."
              topics={["Virtual DOM Diffing", "useState Batching", "useEffect Pipeline", "Render Timing"]}
              icon={Layers}
              accentColor="#8b5cf6"
              accentBg="bg-violet-500/10"
              accentBorder="border-border/60 hover:border-violet-500/70 dark:hover:border-violet-500/60"
              accentText="text-violet-500 dark:text-violet-400"
              ctaText="Explore Frontend Architecture"
              href="/frontend"
            />

            {/* Backend Internals Card */}
            <EditorialDisciplineCard
              id="backend"
              title="Backend Internals"
              eyebrow="Application // Server Runtimes"
              badge={`${backendCount}`}
              description="Investigate Node.js architecture, non-blocking I/O handoffs, and the multi-phase libuv event loop handling server requests."
              topics={["Node.js Architecture", "Non-Blocking I/O", "libuv Event Loop", "Thread Pools"]}
              icon={Server}
              accentColor="#3b82f6"
              accentBg="bg-blue-500/10"
              accentBorder="border-border/60 hover:border-blue-500/70 dark:hover:border-blue-500/60"
              accentText="text-blue-500 dark:text-blue-400"
              ctaText="Explore Backend Internals"
              href="/backend"
            />
          </div>
        </section>

        {/* ── Stratum 4: Distributed Systems Studio (Canvas Studio) ── */}
        <section aria-labelledby="stratum-studio-heading">
          <div className="flex items-baseline justify-between border-b border-border/60 pb-3 mb-6">
            <h2
              id="stratum-studio-heading"
              className="text-lg sm:text-xl font-bold tracking-tight text-foreground flex items-center gap-2"
            >
              <span>Distributed Systems Studio</span>
              <span className="text-xs font-mono font-normal text-zinc-500 dark:text-zinc-400">
                (Multi-Node Sandbox)
              </span>
            </h2>
            <span className="text-xs font-mono text-zinc-500">
              Interactive Canvas
            </span>
          </div>

          <Link
            href="/canvas"
            className="group relative flex flex-col md:flex-row items-start md:items-center justify-between p-6 sm:p-8 rounded-2xl border border-border/60 hover:border-primary/70 bg-white dark:bg-zinc-900/70 backdrop-blur-sm transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] hover:-translate-y-0.5 hover:shadow-xl hover:shadow-black/10 dark:hover:shadow-black/40 overflow-hidden shadow-[0_2px_10px_rgba(0,0,0,0.03)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 dark:focus-visible:ring-offset-zinc-950"
          >
            {/* Top hairline highlight on hover */}
            <div
              className="absolute top-0 left-6 right-6 h-[1.5px] opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-gradient-to-r from-transparent via-primary to-transparent pointer-events-none"
              aria-hidden="true"
            />

            <div className="max-w-2xl">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-11 h-11 rounded-xl bg-primary/10 text-primary flex items-center justify-center transition-transform group-hover:scale-105 duration-300 border border-primary/20 shadow-sm shrink-0">
                  <Network className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-[11px] font-mono uppercase tracking-wider text-zinc-500 dark:text-zinc-400 block font-semibold">
                    Interactive Workshop
                  </span>
                  <h3 className="text-xl sm:text-2xl font-bold text-foreground group-hover:text-primary transition-colors tracking-tight">
                    Canvas Studio
                  </h3>
                </div>
              </div>

              <p className="text-sm sm:text-base text-zinc-600 dark:text-zinc-400 leading-relaxed mb-5 font-normal max-w-xl">
                Assemble multi-node distributed architectures. Simulate live packet flows, test circuit breakers, and observe rate-limiting dynamics across client, gateway, service, and database tiers.
              </p>

              <div className="flex flex-wrap gap-1.5">
                {[
                  "API Gateway",
                  "Event Streams",
                  "Rate Limiting",
                  "Circuit Breakers",
                  "Distributed Caching",
                  "Live Packet Flow",
                ].map((tag) => (
                  <span
                    key={tag}
                    className="text-[11px] font-mono px-2 py-0.5 rounded bg-zinc-100/90 dark:bg-muted/50 border border-zinc-200/80 dark:border-border/40 text-zinc-600 dark:text-zinc-300 group-hover:border-zinc-300 dark:group-hover:border-border/80 transition-colors"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>

            <div className="mt-6 md:mt-0 flex items-center gap-2 text-sm font-semibold text-primary shrink-0 self-end md:self-center">
              <span className="hidden sm:inline">Launch Canvas Studio</span>
              <span className="sm:hidden">Launch Studio</span>
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
              </div>
            </div>
          </Link>
        </section>
      </main>
    </div>
  );
}
