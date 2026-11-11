"use client";

import React, { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Logo } from "@/components/ui/Logo";
import { CheckCircle2, Clock, AlertOctagon, Loader2, ArrowRight } from "lucide-react";

export const dynamic = "force-dynamic";

export type VerifyState = "loading" | "success" | "expired" | "error";

export interface VerifyContentProps {
  forcedToken?: string;
  forcedStatus?: string;
}

export function VerifyContent({ forcedToken, forcedStatus }: VerifyContentProps) {
  const searchParams = useSearchParams();
  const token = forcedToken ?? searchParams?.get("token");
  const initialStatus = forcedStatus ?? searchParams?.get("status");

  const [state, setState] = useState<VerifyState>(() => {
    if (initialStatus === "success") return "success";
    if (!token) return "error";
    return "loading";
  });

  const [errorMessage, setErrorMessage] = useState<string>(() => {
    if (!token && initialStatus !== "success") {
      return "No verification token provided. Please check the link from your email.";
    }
    return "";
  });

  useEffect(() => {
    if (initialStatus === "success" || !token) {
      return;
    }

    let isMounted = true;
    const verifyToken = async () => {
      try {
        const res = await fetch(`/api/notifications/verify?token=${encodeURIComponent(token)}`, {
          method: "GET",
          headers: { Accept: "application/json" },
        });

        if (!isMounted) return;

        if (res.ok) {
          setState("success");
        } else if (res.status === 410) {
          setState("expired");
          const data = await res.json().catch(() => null);
          setErrorMessage(data?.error || "Verification token has expired. Please subscribe again.");
        } else {
          setState("error");
          const data = await res.json().catch(() => null);
          setErrorMessage(data?.error || "Invalid verification token or token already used.");
        }
      } catch {
        if (!isMounted) return;
        setState("error");
        setErrorMessage("Network error occurred while verifying your email. Please try again.");
      }
    };

    verifyToken();
    return () => {
      isMounted = false;
    };
  }, [token, initialStatus]);

  return (
    <div
      className="w-full max-w-md border border-zinc-800/80 bg-zinc-950/70 backdrop-blur-xl rounded-2xl p-6 sm:p-8 flex flex-col gap-6 shadow-2xl"
      role={state === "error" || state === "expired" ? "alert" : "region"}
      aria-live={state === "error" || state === "expired" ? "assertive" : "polite"}
    >
      {/* Brand Header */}
      <div className="flex items-center justify-center gap-2.5">
        <Logo size={28} />
        <span className="text-lg font-semibold tracking-tight text-zinc-100">System Simulator</span>
      </div>

      {/* State A: Loading */}
      {state === "loading" && (
        <div className="flex flex-col items-center text-center py-6 gap-4" data-testid="verify-loading">
          <div className="w-12 h-12 rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
            <Loader2 className="w-6 h-6 text-amber-500 animate-spin" />
          </div>
          <div>
            <h1 className="text-lg font-medium text-zinc-100">Verifying Subscription...</h1>
            <p className="text-xs text-zinc-400 mt-1 max-w-xs">
              Confirming your one-time verification token with our notification registry.
            </p>
          </div>
        </div>
      )}

      {/* State B: Success */}
      {state === "success" && (
        <div className="flex flex-col items-center text-center py-4 gap-4" data-testid="verify-success">
          <div className="w-12 h-12 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
            <CheckCircle2 className="w-6 h-6 text-emerald-400" />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-zinc-100">Subscription Confirmed!</h1>
            <p className="text-xs sm:text-sm text-zinc-400 mt-2">
              Your email has been verified. You will receive real-time notifications and deep architectural
              breakdowns as new computational episodes are released.
            </p>
          </div>
          <div className="w-full flex flex-col gap-3 mt-3">
            <Link
              href="/learning-paths"
              className="w-full min-h-[44px] flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-semibold text-sm transition-colors shadow-lg shadow-amber-500/20 active:scale-95 touch-manipulation"
            >
              Explore Learning Paths
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/canvas"
              className="w-full min-h-[44px] flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl border border-zinc-800 hover:bg-zinc-900 text-zinc-300 font-medium text-sm transition-colors active:scale-95 touch-manipulation"
            >
              Open Canvas Studio
            </Link>
          </div>
        </div>
      )}

      {/* State C: Expired (410) */}
      {state === "expired" && (
        <div className="flex flex-col items-center text-center py-4 gap-4" data-testid="verify-expired">
          <div className="w-12 h-12 rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
            <Clock className="w-6 h-6 text-amber-400" />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-zinc-100">Verification Link Expired</h1>
            <p className="text-xs sm:text-sm text-zinc-400 mt-2">
              {errorMessage || "Verification links expire after 24 hours for security. Please subscribe again to receive a fresh verification link."}
            </p>
          </div>
          <div className="w-full flex flex-col gap-3 mt-3">
            <Link
              href="/learning-paths?subscribe=true"
              className="w-full min-h-[44px] flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-semibold text-sm transition-colors shadow-lg shadow-amber-500/20 active:scale-95 touch-manipulation"
            >
              Request New Verification Link
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
        <div className="flex flex-col items-center text-center py-4 gap-4" data-testid="verify-error">
          <div className="w-12 h-12 rounded-full bg-rose-500/10 border border-rose-500/20 flex items-center justify-center">
            <AlertOctagon className="w-6 h-6 text-rose-400" />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-zinc-100">Verification Failed</h1>
            <p className="text-xs sm:text-sm text-zinc-400 mt-2">
              {errorMessage || "We could not verify your email address. The link may be malformed or already used."}
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

export default function VerifyPage() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-[#0b0c0f] text-zinc-200 px-4 py-12 selection:bg-amber-500/20 selection:text-amber-300">
      <Suspense fallback={<div className="text-xs text-zinc-500">Loading verification...</div>}>
        <VerifyContent />
      </Suspense>
    </main>
  );
}
