"use client";

import React, { Suspense, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Logo } from "@/components/ui/Logo";
import { MailMinus, CheckCircle2, AlertOctagon, Loader2, ArrowRight } from "lucide-react";

export const dynamic = "force-dynamic";

export type UnsubscribeState = "confirm" | "loading" | "success" | "error";

export interface UnsubscribeContentProps {
  forcedToken?: string;
  forcedTopic?: string;
}

const TOPIC_NAMES: Record<string, string> = {
  ALL: "All Disciplines",
  JAVASCRIPT: "JavaScript",
  OPERATING_SYSTEMS: "Operating Systems",
  JAVA: "Java & JVM",
  COMPUTER_NETWORKS: "Computer Networks",
  BACKEND: "Backend Internals",
  FRONTEND: "Frontend Architecture",
};

export function UnsubscribeContent({ forcedToken, forcedTopic }: UnsubscribeContentProps) {
  const searchParams = useSearchParams();
  const token = forcedToken ?? searchParams?.get("token");
  const rawTopic = (forcedTopic ?? searchParams?.get("topic") ?? "ALL").toUpperCase();
  const topicLabel = TOPIC_NAMES[rawTopic] || rawTopic;

  const [state, setState] = useState<UnsubscribeState>(() => {
    return token ? "confirm" : "error";
  });
  const [errorMessage, setErrorMessage] = useState<string>(() => {
    return token ? "" : "No unsubscription token provided. Please use the link provided in your email.";
  });
  const [remainingTopics, setRemainingTopics] = useState<string[]>([]);

  const handleConfirm = async () => {
    if (!token) return;
    setState("loading");

    try {
      const res = await fetch("/api/notifications/unsubscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, topic: rawTopic }),
      });

      const data = await res.json().catch(() => null);

      if (res.ok && data?.success) {
        setState("success");
        if (Array.isArray(data.remainingTopics)) {
          setRemainingTopics(data.remainingTopics);
        }
      } else {
        setState("error");
        setErrorMessage(data?.error || "Failed to process unsubscription. The link may have expired.");
      }
    } catch {
      setState("error");
      setErrorMessage("Network error occurred while processing unsubscription. Please check your connection.");
    }
  };

  return (
    <div
      className="w-full max-w-md border border-zinc-800/80 bg-zinc-950/70 backdrop-blur-xl rounded-2xl p-6 sm:p-8 flex flex-col gap-6 shadow-2xl"
      role={state === "error" ? "alert" : "region"}
      aria-live={state === "error" ? "assertive" : "polite"}
    >
      {/* Brand Header */}
      <div className="flex items-center justify-center gap-2.5">
        <Logo size={28} />
        <span className="text-lg font-semibold tracking-tight text-zinc-100">System Simulator</span>
      </div>

      {/* State A: Confirmation */}
      {state === "confirm" && (
        <div className="flex flex-col items-center text-center py-4 gap-4" data-testid="unsubscribe-confirm">
          <div className="w-12 h-12 rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
            <MailMinus className="w-6 h-6 text-amber-400" />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-zinc-100">Confirm Unsubscribe</h1>
            <p className="text-xs sm:text-sm text-zinc-400 mt-2">
              Are you sure you want to unsubscribe from{" "}
              <strong className="text-zinc-200 font-semibold">{topicLabel}</strong> release notifications?
            </p>
            {rawTopic !== "ALL" && (
              <p className="text-[11px] text-zinc-500 mt-1">
                Your subscriptions to other disciplines will remain unaffected.
              </p>
            )}
          </div>
          <div className="w-full flex flex-col gap-3 mt-3">
            <button
              type="button"
              onClick={handleConfirm}
              className="w-full min-h-[44px] flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-semibold text-sm transition-colors shadow-lg shadow-red-900/20 active:scale-95 touch-manipulation"
            >
              Confirm Unsubscribe
            </button>
            <Link
              href="/learning-paths"
              className="w-full min-h-[44px] flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl border border-zinc-800 hover:bg-zinc-900 text-zinc-300 font-medium text-sm transition-colors active:scale-95 touch-manipulation"
            >
              Keep My Subscription
            </Link>
          </div>
        </div>
      )}

      {/* State B: Loading */}
      {state === "loading" && (
        <div className="flex flex-col items-center text-center py-6 gap-4" data-testid="unsubscribe-loading">
          <div className="w-12 h-12 rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
            <Loader2 className="w-6 h-6 text-amber-500 animate-spin" />
          </div>
          <div>
            <h1 className="text-lg font-medium text-zinc-100">Updating Preferences...</h1>
            <p className="text-xs text-zinc-400 mt-1">Removing your email from the selected notification channel.</p>
          </div>
        </div>
      )}

      {/* State C: Success */}
      {state === "success" && (
        <div className="flex flex-col items-center text-center py-4 gap-4" data-testid="unsubscribe-success">
          <div className="w-12 h-12 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
            <CheckCircle2 className="w-6 h-6 text-emerald-400" />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-zinc-100">Unsubscribed Successfully</h1>
            <p className="text-xs sm:text-sm text-zinc-400 mt-2">
              You have been unsubscribed from <strong className="text-zinc-200">{topicLabel}</strong> updates.
            </p>
            {remainingTopics.length > 0 && (
              <div className="mt-4 p-3 rounded-lg bg-zinc-900/60 border border-zinc-800 text-left">
                <span className="text-[11px] font-medium text-zinc-400 uppercase tracking-wider block mb-1">
                  Active Subscriptions Remaining:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {remainingTopics.map((top) => (
                    <span
                      key={top}
                      className="px-2 py-0.5 rounded text-[11px] bg-zinc-800 text-zinc-300 border border-zinc-700/50"
                    >
                      {TOPIC_NAMES[top] || top}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
          <div className="w-full flex flex-col gap-3 mt-3">
            <Link
              href="/learning-paths?subscribe=true"
              className="w-full min-h-[44px] flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-semibold text-sm transition-colors shadow-lg shadow-amber-500/20 active:scale-95 touch-manipulation"
            >
              Re-subscribe or Change Topics
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/"
              className="w-full min-h-[44px] flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl border border-zinc-800 hover:bg-zinc-900 text-zinc-300 font-medium text-sm transition-colors active:scale-95 touch-manipulation"
            >
              Return to Home
            </Link>
          </div>
        </div>
      )}

      {/* State D: Error */}
      {state === "error" && (
        <div className="flex flex-col items-center text-center py-4 gap-4" data-testid="unsubscribe-error">
          <div className="w-12 h-12 rounded-full bg-rose-500/10 border border-rose-500/20 flex items-center justify-center">
            <AlertOctagon className="w-6 h-6 text-rose-400" />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-zinc-100">Unable to Unsubscribe</h1>
            <p className="text-xs sm:text-sm text-zinc-400 mt-2">
              {errorMessage || "We could not process this unsubscription request. The link may have expired or already been processed."}
            </p>
          </div>
          <div className="w-full flex flex-col gap-3 mt-3">
            <Link
              href="/learning-paths"
              className="w-full min-h-[44px] flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-semibold text-sm transition-colors shadow-lg shadow-amber-500/20 active:scale-95 touch-manipulation"
            >
              Go to Learning Paths
            </Link>
            <Link
              href="/"
              className="w-full min-h-[44px] flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl border border-zinc-800 hover:bg-zinc-900 text-zinc-300 font-medium text-sm transition-colors active:scale-95 touch-manipulation"
            >
              Return to Home
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}

export default function UnsubscribePage() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-[#0b0c0f] text-zinc-200 px-4 py-12 selection:bg-amber-500/20 selection:text-amber-300">
      <Suspense fallback={<div className="text-xs text-zinc-500">Loading unsubscription...</div>}>
        <UnsubscribeContent />
      </Suspense>
    </main>
  );
}
