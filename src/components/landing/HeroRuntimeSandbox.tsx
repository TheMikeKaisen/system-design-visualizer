"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  Play,
  Pause,
  SkipForward,
  SkipBack,
  RotateCcw,
  ArrowRight,
  Cpu,
  Database,
  Terminal,
} from "lucide-react";

/* ═══════════════════════════════════════════════════════════════
   DISCIPLINE SCENARIO DATA MODELS
   Adheres to AGENTS.md Simulation Guidelines:
   1. Data-Driven State Isolation
   2. Transparency Rendering Principle
   3. Strict React Key Strategies
   4. Explicit Terminal Theming (Hardcoded text colors)
   5. Multi-modal Feedback Architecture
   6. Execution Context Lifecycle
   7. Strict Two-Phase Context Creation
   ═══════════════════════════════════════════════════════════════ */

interface JSStep {
  line: number;
  explanation: string;
  badge: string;
  callStack: Array<{ id: string; name: string; phase: "creation" | "execution"; active: boolean }>;
  scopes: Array<{
    id: string;
    name: string;
    vars: Array<{ name: string; value: string; isTDZ?: boolean }>;
  }>;
}

interface OSStep {
  line: number;
  explanation: string;
  badge: string;
  cpu: { pid: string; name: string; pc: string; quantumRemaining: number } | null;
  readyQueue: Array<{ id: string; pid: string; name: string; state: string }>;
  waitingQueue: Array<{ id: string; pid: string; name: string; reason: string }>;
}

interface JavaStep {
  line: number;
  explanation: string;
  badge: string;
  stackFrames: Array<{
    id: string;
    name: string;
    vars: Array<{ name: string; type: string; value: string; isRef?: boolean; refId?: string }>;
  }>;
  heapObjects: Array<{
    id: string;
    className: string;
    address: string;
    fields: Array<{ name: string; value: string }>;
  }>;
}

/* ───────────────────────────────────────────────────────────────
   1. JavaScript Scenario: Call Stack, Scope & Closures
   ─────────────────────────────────────────────────────────────── */
const JS_CODE_LINES = [
  "function makeCounter() {",
  "  let count = 0;",
  "  return function increment() {",
  "    count += 1;",
  "    return count;",
  "  };",
  "}",
  "const counter = makeCounter();",
  "counter(); // -> returns 1",
];

const JS_STEPS: JSStep[] = [
  {
    line: 0,
    badge: "Engine Init",
    explanation: "V8 Engine initializes Global Execution Context. Call stack is currently empty.",
    callStack: [],
    scopes: [
      {
        id: "global-init",
        name: "Global Scope",
        vars: [
          { name: "makeCounter", value: "ƒ makeCounter()" },
          { name: "counter", value: "<TDZ>", isTDZ: true },
        ],
      },
    ],
  },
  {
    line: 1,
    badge: "Declaration",
    explanation: "makeCounter() declared in Global Scope. Function memory reference registered.",
    callStack: [
      { id: "g-exec-0", name: "Global", phase: "creation", active: true },
    ],
    scopes: [
      {
        id: "global-scope-1",
        name: "Global Scope",
        vars: [
          { name: "makeCounter", value: "ƒ makeCounter()" },
          { name: "counter", value: "<TDZ>", isTDZ: true },
        ],
      },
    ],
  },
  {
    line: 8,
    badge: "Function Call",
    explanation: "makeCounter() invoked. Pushing new Execution Context to Call Stack in Creation Phase.",
    callStack: [
      { id: "g-exec-1", name: "Global", phase: "execution", active: false },
      { id: "mc-create-2", name: "makeCounter()", phase: "creation", active: true },
    ],
    scopes: [
      {
        id: "mc-scope-2",
        name: "makeCounter Scope",
        vars: [{ name: "count", value: "<TDZ>", isTDZ: true }],
      },
      {
        id: "global-scope-2",
        name: "Global Scope",
        vars: [
          { name: "makeCounter", value: "ƒ makeCounter()" },
          { name: "counter", value: "<TDZ>", isTDZ: true },
        ],
      },
    ],
  },
  {
    line: 2,
    badge: "Assignment",
    explanation: "let count = 0 initialized in local scope. Entering Execution Phase.",
    callStack: [
      { id: "g-exec-2", name: "Global", phase: "execution", active: false },
      { id: "mc-exec-3", name: "makeCounter()", phase: "execution", active: true },
    ],
    scopes: [
      {
        id: "mc-scope-3",
        name: "makeCounter Scope",
        vars: [{ name: "count", value: "0" }],
      },
      {
        id: "global-scope-3",
        name: "Global Scope",
        vars: [
          { name: "makeCounter", value: "ƒ makeCounter()" },
          { name: "counter", value: "<TDZ>", isTDZ: true },
        ],
      },
    ],
  },
  {
    line: 3,
    badge: "Closure Formed",
    explanation: "makeCounter returns increment(). Function bundles count variable into closure scope [[Scopes]].",
    callStack: [
      { id: "g-exec-3", name: "Global", phase: "execution", active: true },
    ],
    scopes: [
      {
        id: "closure-scope-4",
        name: "Closure (makeCounter)",
        vars: [{ name: "count", value: "0" }],
      },
      {
        id: "global-scope-4",
        name: "Global Scope",
        vars: [
          { name: "makeCounter", value: "ƒ makeCounter()" },
          { name: "counter", value: "ƒ increment()" },
        ],
      },
    ],
  },
  {
    line: 9,
    badge: "Scope Lookup",
    explanation: "counter() called. Looks up count in Closure scope, increments to 1, and returns 1.",
    callStack: [
      { id: "g-exec-4", name: "Global", phase: "execution", active: false },
      { id: "inc-exec-5", name: "increment()", phase: "execution", active: true },
    ],
    scopes: [
      {
        id: "closure-scope-5",
        name: "Closure (makeCounter)",
        vars: [{ name: "count", value: "1" }],
      },
      {
        id: "global-scope-5",
        name: "Global Scope",
        vars: [
          { name: "makeCounter", value: "ƒ makeCounter()" },
          { name: "counter", value: "ƒ increment()" },
        ],
      },
    ],
  },
];

/* ───────────────────────────────────────────────────────────────
   2. Operating Systems Scenario: CPU Scheduling & Context Switch
   ─────────────────────────────────────────────────────────────── */
const OS_CODE_LINES = [
  "// Round-Robin CPU Scheduler (Quantum = 20ms)",
  "void schedule() {",
  "  Process* prev = current_process;",
  "  save_context(&prev->pcb);",
  "  Process* next = dequeue_ready();",
  "  load_context(&next->pcb);",
  "  dispatch_to_cpu(next);",
  "}",
];

const OS_STEPS: OSStep[] = [
  {
    line: 1,
    badge: "Round-Robin",
    explanation: "Scheduler assigns CPU to P1 (Browser). Time quantum set to 20ms.",
    cpu: { pid: "P1", name: "Browser", pc: "0x0040", quantumRemaining: 20 },
    readyQueue: [
      { id: "os-p2", pid: "P2", name: "Music", state: "Ready" },
      { id: "os-p3", pid: "P3", name: "Terminal", state: "Ready" },
    ],
    waitingQueue: [],
  },
  {
    line: 2,
    badge: "Timer Interrupt",
    explanation: "Hardware timer interrupt fires. P1 time slice depleted (0ms left).",
    cpu: { pid: "P1", name: "Browser", pc: "0x0058", quantumRemaining: 0 },
    readyQueue: [
      { id: "os-p2-b", pid: "P2", name: "Music", state: "Ready" },
      { id: "os-p3-b", pid: "P3", name: "Terminal", state: "Ready" },
    ],
    waitingQueue: [],
  },
  {
    line: 3,
    badge: "Save State",
    explanation: "Registers, Program Counter (PC: 0x0058), and stack pointers saved to P1 PCB.",
    cpu: null,
    readyQueue: [
      { id: "os-p2-c", pid: "P2", name: "Music", state: "Ready" },
      { id: "os-p3-c", pid: "P3", name: "Terminal", state: "Ready" },
      { id: "os-p1-c", pid: "P1", name: "Browser", state: "Ready" },
    ],
    waitingQueue: [],
  },
  {
    line: 4,
    badge: "Dispatch P2",
    explanation: "Context switch complete. P2 (Music) loaded into CPU registers at PC 0x10A4.",
    cpu: { pid: "P2", name: "Music", pc: "0x10A4", quantumRemaining: 20 },
    readyQueue: [
      { id: "os-p3-d", pid: "P3", name: "Terminal", state: "Ready" },
      { id: "os-p1-d", pid: "P1", name: "Browser", state: "Ready" },
    ],
    waitingQueue: [],
  },
  {
    line: 6,
    badge: "I/O Trap",
    explanation: "P2 requests audio buffer read (sys_read). Moved from CPU to I/O Blocked queue.",
    cpu: null,
    readyQueue: [
      { id: "os-p3-e", pid: "P3", name: "Terminal", state: "Ready" },
      { id: "os-p1-e", pid: "P1", name: "Browser", state: "Ready" },
    ],
    waitingQueue: [
      { id: "os-p2-wait", pid: "P2", name: "Music", reason: "Disk DMA Read" },
    ],
  },
  {
    line: 7,
    badge: "Avoid Idle",
    explanation: "CPU immediately dispatches P3 (Terminal) without wasting clock cycles.",
    cpu: { pid: "P3", name: "Terminal", pc: "0x8200", quantumRemaining: 20 },
    readyQueue: [
      { id: "os-p1-f", pid: "P1", name: "Browser", state: "Ready" },
    ],
    waitingQueue: [
      { id: "os-p2-wait-f", pid: "P2", name: "Music", reason: "Disk DMA Read" },
    ],
  },
];

/* ───────────────────────────────────────────────────────────────
   3. Java Scenario: JVM Stack Frames & Heap Object Allocation
   ─────────────────────────────────────────────────────────────── */
const JAVA_CODE_LINES = [
  "public class Main {",
  "  public static void main(String[] args) {",
  '    User user = new User("Alice");',
  "    user.login();",
  "  }",
  "}",
];

const JAVA_STEPS: JavaStep[] = [
  {
    line: 1,
    badge: "JVM Stack",
    explanation: "JVM starts execution. main() stack frame pushed with args parameter array.",
    stackFrames: [
      {
        id: "java-main-0",
        name: "main(String[] args)",
        vars: [
          { name: "args", type: "String[]", value: "0x01A0", isRef: true, refId: "obj-args" },
          { name: "user", type: "User", value: "null" },
        ],
      },
    ],
    heapObjects: [
      {
        id: "obj-args",
        className: "String[]",
        address: "0x01A0",
        fields: [{ name: "length", value: "0" }],
      },
    ],
  },
  {
    line: 2,
    badge: "Heap Allocation",
    explanation: "new User(\"Alice\") allocates memory in Eden Heap space at address 0x7A4F.",
    stackFrames: [
      {
        id: "java-main-1",
        name: "main(String[] args)",
        vars: [
          { name: "args", type: "String[]", value: "0x01A0", isRef: true, refId: "obj-args" },
          { name: "user", type: "User", value: "0x7A4F", isRef: true, refId: "obj-user" },
        ],
      },
    ],
    heapObjects: [
      {
        id: "obj-args-1",
        className: "String[]",
        address: "0x01A0",
        fields: [{ name: "length", value: "0" }],
      },
      {
        id: "obj-user",
        className: "User",
        address: "0x7A4F",
        fields: [
          { name: "name", value: '"Alice"' },
          { name: "isOnline", value: "false" },
        ],
      },
    ],
  },
  {
    line: 3,
    badge: "Method Push",
    explanation: "user.login() pushes login() frame to JVM stack with 'this' reference pointer.",
    stackFrames: [
      {
        id: "java-main-2",
        name: "main(String[] args)",
        vars: [
          { name: "args", type: "String[]", value: "0x01A0", isRef: true, refId: "obj-args" },
          { name: "user", type: "User", value: "0x7A4F", isRef: true, refId: "obj-user" },
        ],
      },
      {
        id: "java-act-2",
        name: "User.login()",
        vars: [
          { name: "this", type: "User", value: "0x7A4F", isRef: true, refId: "obj-user" },
        ],
      },
    ],
    heapObjects: [
      {
        id: "obj-args-2",
        className: "String[]",
        address: "0x01A0",
        fields: [{ name: "length", value: "0" }],
      },
      {
        id: "obj-user-2",
        className: "User",
        address: "0x7A4F",
        fields: [
          { name: "name", value: '"Alice"' },
          { name: "isOnline", value: "true" },
        ],
      },
    ],
  },
  {
    line: 4,
    badge: "Frame Pop",
    explanation: "login() completes and pops from Stack. user object remains alive in Heap.",
    stackFrames: [
      {
        id: "java-main-3",
        name: "main(String[] args)",
        vars: [
          { name: "args", type: "String[]", value: "0x01A0", isRef: true, refId: "obj-args" },
          { name: "user", type: "User", value: "0x7A4F", isRef: true, refId: "obj-user" },
        ],
      },
    ],
    heapObjects: [
      {
        id: "obj-args-3",
        className: "String[]",
        address: "0x01A0",
        fields: [{ name: "length", value: "0" }],
      },
      {
        id: "obj-user-3",
        className: "User",
        address: "0x7A4F",
        fields: [
          { name: "name", value: '"Alice"' },
          { name: "isOnline", value: "true" },
        ],
      },
    ],
  },
];

/* ───────────────────────────────────────────────────────────────
   TAB DEFINITIONS
   ─────────────────────────────────────────────────────────────── */
interface TabConfig {
  id: "javascript" | "os" | "java";
  label: string;
  discipline: string;
  icon: React.ComponentType<{ className?: string }>;
  accentColor: string;
  accentBorder: string;
  accentBg: string;
  accentText: string;
  targetUrl: string;
}

const TABS: TabConfig[] = [
  {
    id: "javascript",
    label: "JavaScript",
    discipline: "Call Stack & Closures",
    icon: Terminal,
    accentColor: "#f59e0b",
    accentBorder: "border-amber-500/40",
    accentBg: "bg-amber-500/10",
    accentText: "text-amber-500 dark:text-amber-400",
    targetUrl: "/javascript/simulator/closures",
  },
  {
    id: "os",
    label: "Operating Systems",
    discipline: "Process States & CPU",
    icon: Cpu,
    accentColor: "#0ea5e9",
    accentBorder: "border-sky-500/40",
    accentBg: "bg-sky-500/10",
    accentText: "text-sky-500 dark:text-sky-400",
    targetUrl: "/operating-systems/simulator/process-states",
  },
  {
    id: "java",
    label: "Java & JVM",
    discipline: "Stack Frames & Heap",
    icon: Database,
    accentColor: "#10b981",
    accentBorder: "border-emerald-500/40",
    accentBg: "bg-emerald-500/10",
    accentText: "text-emerald-500 dark:text-emerald-400",
    targetUrl: "/java/simulator/oop-basics",
  },
];

const STEP_INTERVAL_MS = 2400; // Time per step during auto-play
const SUBJECT_TRANSITION_DELAY_MS = 2200; // Pause at end of scenario before switching subject

export function HeroRuntimeSandbox() {
  const [activeTab, setActiveTab] = useState<"javascript" | "os" | "java">("javascript");
  const [stepIndex, setStepIndex] = useState(0);
  const [isAutoCycling, setIsAutoCycling] = useState(true); // Auto-plays step-by-step then changes subject until user interacts
  const [isPlayingManual, setIsPlayingManual] = useState(false);

  const autoStepTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Maximum step count for current active scenario
  const maxSteps =
    activeTab === "javascript"
      ? JS_STEPS.length
      : activeTab === "os"
      ? OS_STEPS.length
      : JAVA_STEPS.length;

  const currentStep = Math.max(0, Math.min(stepIndex, maxSteps - 1));

  // Switch to specific tab manually (pauses auto-cycling)
  const selectTab = useCallback((tabId: "javascript" | "os" | "java") => {
    setIsAutoCycling(false);
    setIsPlayingManual(false);
    setActiveTab(tabId);
    setStepIndex(0);
  }, []);

  // Natural continuous simulation progression:
  // Completes all steps for current subject -> brief pause -> switches to next subject -> auto-plays
  useEffect(() => {
    if (!isAutoCycling && !isPlayingManual) {
      if (autoStepTimerRef.current) clearTimeout(autoStepTimerRef.current);
      return;
    }

    const isLastStep = stepIndex >= maxSteps - 1;
    const delay = isLastStep ? SUBJECT_TRANSITION_DELAY_MS : STEP_INTERVAL_MS;

    autoStepTimerRef.current = setTimeout(() => {
      if (!isLastStep) {
        setStepIndex((prev) => prev + 1);
      } else if (isAutoCycling) {
        const tabOrder: Array<"javascript" | "os" | "java"> = ["javascript", "os", "java"];
        const nextIndex = (tabOrder.indexOf(activeTab) + 1) % tabOrder.length;
        setActiveTab(tabOrder[nextIndex]);
        setStepIndex(0);
      } else {
        setIsPlayingManual(false);
      }
    }, delay);

    return () => {
      if (autoStepTimerRef.current) clearTimeout(autoStepTimerRef.current);
    };
  }, [isAutoCycling, isPlayingManual, stepIndex, maxSteps, activeTab]);

  // Step controls (disable auto-cycle when clicked by user)
  const handleNext = () => {
    setIsAutoCycling(false);
    setIsPlayingManual(false);
    setStepIndex((prev) => Math.min(maxSteps - 1, prev + 1));
  };

  const handlePrev = () => {
    setIsAutoCycling(false);
    setIsPlayingManual(false);
    setStepIndex((prev) => Math.max(0, prev - 1));
  };

  const handleReset = () => {
    setIsAutoCycling(false);
    setIsPlayingManual(false);
    setStepIndex(0);
  };

  const togglePlay = () => {
    if (isAutoCycling) {
      setIsAutoCycling(false);
      setIsPlayingManual(false);
    } else {
      if (currentStep >= maxSteps - 1) {
        setStepIndex(0);
      }
      setIsPlayingManual((prev) => !prev);
    }
  };

  const activeConfig = TABS.find((t) => t.id === activeTab) ?? TABS[0];
  const isPlayingActive = isAutoCycling || isPlayingManual;

  return (
    <div
      className="w-full rounded-2xl bg-[#0f1013]/95 border border-zinc-800/80 shadow-2xl backdrop-blur-xl overflow-hidden flex flex-col text-zinc-100 transition-all duration-300"
      role="region"
      aria-label="Interactive Multi-Discipline System Simulator Sandbox"
    >
      {/* ── Top Window Bar: Tactile Tab Navigation ── */}
      <div className="border-b border-zinc-800/80 bg-[#14151b] px-4 py-3 flex flex-wrap items-center justify-between gap-3 select-none">
        {/* Left: Window Dots & Tabs */}
        <div className="flex items-center gap-3">
          {/* OS Window dots */}
          <div className="hidden sm:flex items-center gap-1.5 mr-2">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500/80" />
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500/80" />
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/80" />
          </div>

          {/* Interactive Tabs */}
          <div className="flex items-center gap-1.5 p-1 bg-zinc-900/90 border border-zinc-800/70 rounded-xl" role="tablist">
            {TABS.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => selectTab(tab.id)}
                  role="tab"
                  aria-selected={isActive}
                  aria-controls={`panel-${tab.id}`}
                  className={`relative flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 ${
                    isActive
                      ? "text-zinc-100 bg-zinc-800/90 shadow-sm"
                      : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/40"
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 ${isActive ? tab.accentText : "text-zinc-500"}`} />
                  <span className="tracking-tight">{tab.label}</span>

                  {/* Active running pulse indicator */}
                  {isActive && isPlayingActive && (
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse ml-0.5" />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Right: Direct Track Link CTA */}
        <div className="flex items-center gap-3">
          <Link
            href={activeConfig.targetUrl}
            className="flex items-center gap-1.5 text-xs font-medium text-zinc-300 hover:text-white transition-colors group"
          >
            <span>Run simulation</span>
            <ArrowRight className="w-3.5 h-3.5 text-zinc-400 group-hover:translate-x-0.5 transition-transform" />
          </Link>
        </div>
      </div>

      {/* ── Center Stage: Code Inspector + Runtime Simulation ── */}
      <div className="p-4 sm:p-6 flex-1 grid grid-cols-1 lg:grid-cols-12 gap-5 min-h-[380px]">
        {/* Left Column: Synchronized Code Panel (5 cols) */}
        <div className="lg:col-span-5 flex flex-col bg-[#0b0c0f] border border-zinc-800/80 rounded-xl overflow-hidden shadow-inner">
          <div className="px-3.5 py-2.5 border-b border-zinc-800/80 bg-zinc-900/60 flex items-center justify-between text-[11px] text-zinc-400 font-mono">
            <span className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: activeConfig.accentColor }} />
              {activeTab === "javascript" && "counter.js"}
              {activeTab === "os" && "scheduler.c"}
              {activeTab === "java" && "Main.java"}
            </span>
            <span className="text-zinc-500 text-[10px]">
              Step {currentStep + 1} of {maxSteps}
            </span>
          </div>

          {/* Syntax Code Body */}
          <div className="p-3.5 font-mono text-xs leading-relaxed overflow-x-auto text-zinc-300 select-none flex-1 flex flex-col justify-center">
            {activeTab === "javascript" &&
              JS_CODE_LINES.map((codeLine, idx) => {
                const isCurrent = JS_STEPS[currentStep].line === idx + 1;
                return (
                  <div
                    key={`js-line-${idx}`}
                    className={`flex items-center px-2 py-0.5 rounded transition-all duration-200 ${
                      isCurrent
                        ? "bg-amber-500/20 text-amber-200 border-l-2 border-amber-500 font-medium translate-x-0.5"
                        : "hover:bg-zinc-800/30 text-zinc-400"
                    }`}
                  >
                    <span className="w-6 text-[10px] text-zinc-600 select-none text-right pr-2">
                      {idx + 1}
                    </span>
                    <span className="whitespace-pre">{codeLine}</span>
                  </div>
                );
              })}

            {activeTab === "os" &&
              OS_CODE_LINES.map((codeLine, idx) => {
                const isCurrent = OS_STEPS[currentStep].line === idx + 1;
                return (
                  <div
                    key={`os-line-${idx}`}
                    className={`flex items-center px-2 py-0.5 rounded transition-all duration-200 ${
                      isCurrent
                        ? "bg-sky-500/20 text-sky-200 border-l-2 border-sky-500 font-medium translate-x-0.5"
                        : "hover:bg-zinc-800/30 text-zinc-400"
                    }`}
                  >
                    <span className="w-6 text-[10px] text-zinc-600 select-none text-right pr-2">
                      {idx + 1}
                    </span>
                    <span className="whitespace-pre">{codeLine}</span>
                  </div>
                );
              })}

            {activeTab === "java" &&
              JAVA_CODE_LINES.map((codeLine, idx) => {
                const isCurrent = JAVA_STEPS[currentStep].line === idx + 1;
                return (
                  <div
                    key={`java-line-${idx}`}
                    className={`flex items-center px-2 py-0.5 rounded transition-all duration-200 ${
                      isCurrent
                        ? "bg-emerald-500/20 text-emerald-200 border-l-2 border-emerald-500 font-medium translate-x-0.5"
                        : "hover:bg-zinc-800/30 text-zinc-400"
                    }`}
                  >
                    <span className="w-6 text-[10px] text-zinc-600 select-none text-right pr-2">
                      {idx + 1}
                    </span>
                    <span className="whitespace-pre">{codeLine}</span>
                  </div>
                );
              })}
          </div>
        </div>

        {/* Right Column: Architectural Runtime Engine (7 cols) */}
        <div className="lg:col-span-7 flex flex-col bg-[#0b0c0f] border border-zinc-800/80 rounded-xl p-4 relative overflow-hidden shadow-inner">
          <AnimatePresence>
            {/* 1. JAVASCRIPT: CALL STACK & SCOPE CHAIN */}
            {activeTab === "javascript" && (
              <motion.div
                key="tab-panel-js"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
                className="flex-1 flex flex-col gap-3.5"
              >
                {/* Call Stack Section */}
                <div>
                  <div className="text-[11px] font-semibold uppercase tracking-wider text-amber-400/90 mb-2 flex items-center justify-between">
                    <span>Call Stack (LIFO)</span>
                    <span className="text-[10px] text-zinc-500 font-normal">
                      {JS_STEPS[currentStep].callStack.length === 0 ? "Empty" : `${JS_STEPS[currentStep].callStack.length} Frame(s)`}
                    </span>
                  </div>
                  <div className="min-h-[80px] bg-zinc-900/60 rounded-lg p-2.5 border border-zinc-800/60 flex flex-col-reverse gap-1.5 justify-end">
                    {JS_STEPS[currentStep].callStack.length === 0 ? (
                      <div className="text-xs text-zinc-500 italic py-2.5 text-center">
                        Engine idle — Stack is empty
                      </div>
                    ) : (
                      JS_STEPS[currentStep].callStack.map((frame) => (
                        <div
                          key={`cs-${frame.id}`}
                          className={`flex items-center justify-between px-3 py-1.5 rounded text-xs font-mono transition-all ${
                            frame.active
                              ? "bg-amber-500/20 border border-amber-500/50 text-amber-200"
                              : "bg-zinc-800/50 text-zinc-400 opacity-60"
                          }`}
                        >
                          <span className="font-semibold">{frame.name}</span>
                          <span className="text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded bg-zinc-900/80 text-zinc-300">
                            {frame.phase}
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* Scope & Memory Environment */}
                <div className="flex-1">
                  <div className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400 mb-2">
                    Scope Environment & Closures
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {JS_STEPS[currentStep].scopes.map((scope) => (
                      <div
                        key={`scope-${scope.id}`}
                        className="bg-zinc-900/60 border border-zinc-800/60 rounded-lg p-3 flex flex-col gap-1.5"
                      >
                        <span className="text-[10px] font-medium text-amber-400/80 uppercase tracking-tight">
                          {scope.name}
                        </span>
                        <div className="flex flex-col gap-1.5 font-mono text-xs">
                          {scope.vars.map((v) => (
                            <div key={`var-${scope.id}-${v.name}`} className="flex items-center justify-between">
                              <span className="text-zinc-400">{v.name}:</span>
                              <span className={v.isTDZ ? "text-rose-400 text-[10px] font-semibold" : "text-emerald-400"}>
                                {v.value}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}

            {/* 2. OPERATING SYSTEMS: CPU SCHEDULER & QUEUES */}
            {activeTab === "os" && (
              <motion.div
                key="tab-panel-os"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
                className="flex-1 flex flex-col gap-3.5"
              >
                {/* Active CPU Core */}
                <div>
                  <div className="text-[11px] font-semibold uppercase tracking-wider text-sky-400/90 mb-2 flex items-center justify-between">
                    <span>CPU Core (Hardware Execution)</span>
                    <span className="text-[10px] text-zinc-500 font-normal">Quantum: 20ms</span>
                  </div>
                  <div className="min-h-[72px] bg-zinc-900/60 rounded-lg p-3 border border-zinc-800/60 flex items-center justify-between">
                    {OS_STEPS[currentStep].cpu ? (
                      <div className="w-full flex items-center justify-between px-2">
                        <div className="flex items-center gap-3">
                          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                          <div>
                            <span className="text-xs font-mono font-bold text-sky-200">
                              {OS_STEPS[currentStep].cpu?.pid}
                            </span>
                            <span className="text-xs text-zinc-400 ml-2">
                              {OS_STEPS[currentStep].cpu?.name}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-3 font-mono text-xs">
                          <span className="text-zinc-500">
                            PC: <strong className="text-zinc-300">{OS_STEPS[currentStep].cpu?.pc}</strong>
                          </span>
                          <span className="text-[10px] px-2 py-0.5 rounded bg-sky-500/20 text-sky-300 border border-sky-500/30 font-semibold">
                            {OS_STEPS[currentStep].cpu?.quantumRemaining}ms left
                          </span>
                        </div>
                      </div>
                    ) : (
                      <div className="w-full text-center text-xs text-zinc-500 italic py-2">
                        Context Switch in progress... CPU pipeline flushing
                      </div>
                    )}
                  </div>
                </div>

                {/* Ready & Waiting Queues */}
                <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {/* Ready Queue */}
                  <div className="bg-zinc-900/60 border border-zinc-800/60 rounded-lg p-3 flex flex-col gap-1.5">
                    <span className="text-[10px] font-medium text-sky-400/80 uppercase tracking-tight">
                      Ready Queue (FIFO)
                    </span>
                    <div className="flex flex-col gap-1.5 font-mono text-xs">
                      {OS_STEPS[currentStep].readyQueue.length === 0 ? (
                        <span className="text-zinc-600 text-xs italic">Queue empty</span>
                      ) : (
                        OS_STEPS[currentStep].readyQueue.map((proc) => (
                          <div key={proc.id} className="flex items-center justify-between px-2.5 py-1 bg-zinc-800/40 rounded">
                            <span className="text-zinc-300 font-semibold">{proc.pid}: {proc.name}</span>
                            <span className="text-[10px] text-zinc-500">{proc.state}</span>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  {/* Blocked / I/O Queue */}
                  <div className="bg-zinc-900/60 border border-zinc-800/60 rounded-lg p-3 flex flex-col gap-1.5">
                    <span className="text-[10px] font-medium text-rose-400/80 uppercase tracking-tight">
                      I/O Wait Queue (Blocked)
                    </span>
                    <div className="flex flex-col gap-1.5 font-mono text-xs">
                      {OS_STEPS[currentStep].waitingQueue.length === 0 ? (
                        <span className="text-zinc-600 text-xs italic">No blocked processes</span>
                      ) : (
                        OS_STEPS[currentStep].waitingQueue.map((proc) => (
                          <div key={proc.id} className="flex items-center justify-between px-2.5 py-1 bg-rose-500/10 border border-rose-500/20 rounded">
                            <span className="text-rose-200 font-semibold">{proc.pid}</span>
                            <span className="text-[10px] text-rose-300/80">{proc.reason}</span>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* 3. JAVA: JVM STACK FRAMES & HEAP MEMORY */}
            {activeTab === "java" && (
              <motion.div
                key="tab-panel-java"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
                className="flex-1 flex flex-col gap-3.5"
              >
                {/* JVM Stack Frames */}
                <div>
                  <div className="text-[11px] font-semibold uppercase tracking-wider text-emerald-400/90 mb-2 flex items-center justify-between">
                    <span>JVM Thread Stack</span>
                    <span className="text-[10px] text-zinc-500 font-normal">LIFO Frames</span>
                  </div>
                  <div className="min-h-[80px] bg-zinc-900/60 rounded-lg p-2.5 border border-zinc-800/60 flex flex-col-reverse gap-1.5 justify-end">
                    {JAVA_STEPS[currentStep].stackFrames.map((frame, fIdx) => (
                      <div
                        key={frame.id}
                        className={`px-3 py-1.5 rounded text-xs font-mono ${
                          fIdx === JAVA_STEPS[currentStep].stackFrames.length - 1
                            ? "bg-emerald-500/15 border border-emerald-500/40 text-emerald-200"
                            : "bg-zinc-800/40 text-zinc-400"
                        }`}
                      >
                        <div className="flex items-center justify-between font-semibold mb-1">
                          <span>{frame.name}</span>
                          <span className="text-[10px] text-zinc-500">Frame</span>
                        </div>
                        <div className="flex flex-wrap gap-x-4 text-[11px]">
                          {frame.vars.map((v) => (
                            <span key={`${frame.id}-${v.name}`} className="text-zinc-400">
                              {v.name}:{" "}
                              <strong className={v.isRef ? "text-emerald-300 font-semibold underline decoration-dotted" : "text-zinc-200"}>
                                {v.value}
                              </strong>
                            </span>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* JVM Heap Space */}
                <div className="flex-1">
                  <div className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400 mb-2">
                    Heap Space (Eden Generation)
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {JAVA_STEPS[currentStep].heapObjects.map((obj) => (
                      <div
                        key={obj.id}
                        className="bg-zinc-900/60 border border-zinc-800/60 rounded-lg p-3 flex flex-col gap-1.5 font-mono text-xs"
                      >
                        <div className="flex items-center justify-between pb-1 border-b border-zinc-800/60">
                          <span className="text-emerald-400 font-semibold">{obj.className}</span>
                          <span className="text-[10px] text-zinc-500">{obj.address}</span>
                        </div>
                        <div className="flex flex-col gap-1">
                          {obj.fields.map((f) => (
                            <div key={`${obj.id}-${f.name}`} className="flex items-center justify-between text-[11px]">
                              <span className="text-zinc-400">{f.name}:</span>
                              <span className="text-zinc-200 font-medium">{f.value}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* ── Bottom Bar: Multi-Modal Step Explanation & Controls ── */}
      <div className="border-t border-zinc-800/80 bg-[#14151b] px-4 py-3 flex flex-wrap items-center justify-between gap-3">
        {/* Step Explanation Banner */}
        <div className="flex items-center gap-2.5 flex-1 min-w-[240px]">
          <span
            className="w-2 h-2 rounded-full shrink-0 animate-pulse"
            style={{ backgroundColor: activeConfig.accentColor }}
          />
          <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-zinc-800/90 text-zinc-300 shrink-0">
            {activeTab === "javascript" && JS_STEPS[currentStep].badge}
            {activeTab === "os" && OS_STEPS[currentStep].badge}
            {activeTab === "java" && JAVA_STEPS[currentStep].badge}
          </span>
          <p className="text-xs text-zinc-300 line-clamp-1">
            {activeTab === "javascript" && JS_STEPS[currentStep].explanation}
            {activeTab === "os" && OS_STEPS[currentStep].explanation}
            {activeTab === "java" && JAVA_STEPS[currentStep].explanation}
          </p>
        </div>

        {/* Micro-Step Controls */}
        <div className="flex items-center gap-1.5 bg-zinc-900/90 border border-zinc-800/80 rounded-xl p-1 shrink-0">
          <button
            onClick={handleReset}
            title="Reset simulation to step 1"
            className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/60 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={handlePrev}
            disabled={currentStep === 0}
            title="Previous step"
            className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/60 disabled:opacity-40 disabled:hover:bg-transparent transition-colors"
          >
            <SkipBack className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={togglePlay}
            title={isPlayingActive ? "Pause simulation" : "Play simulation"}
            className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-zinc-800 hover:bg-zinc-700 text-zinc-100 transition-colors flex items-center gap-1.5"
          >
            {isPlayingActive ? (
              <>
                <Pause className="w-3 h-3 text-amber-400" />
                <span>Pause</span>
              </>
            ) : (
              <>
                <Play className="w-3 h-3 text-emerald-400" />
                <span>Step Run</span>
              </>
            )}
          </button>
          <button
            onClick={handleNext}
            disabled={currentStep === maxSteps - 1}
            title="Next step"
            className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/60 disabled:opacity-40 disabled:hover:bg-transparent transition-colors"
          >
            <SkipForward className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
