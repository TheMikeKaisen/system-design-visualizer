"use client";

import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  useSyncExternalStore,
} from "react";
import { createPortal } from "react-dom";
import { X, Mail, Check, AlertCircle, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/Input";
import { Logo } from "@/components/ui/Logo";
import {
  TopicChip,
  SubjectChannel,
  SUBJECT_METADATA_MAP,
} from "./TopicChip";
import { cn } from "@/lib/utils";

const ALL_INDIVIDUAL_SUBJECTS: SubjectChannel[] = [
  "JAVASCRIPT",
  "OPERATING_SYSTEMS",
  "JAVA",
  "FRONTEND",
  "BACKEND",
  "COMPUTER_NETWORKS",
];

export interface SubscribeModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialSubject?: SubjectChannel | string;
  initialSubjectTitle?: string;
  defaultEmail?: string;
  onSuccess?: (result: { requiresVerification: boolean; email: string }) => void;
}

interface SubscribeModalDialogProps {
  onClose: () => void;
  initialSubject?: SubjectChannel | string;
  initialSubjectTitle?: string;
  defaultEmail?: string;
  onSuccess?: (result: { requiresVerification: boolean; email: string }) => void;
}

function SubscribeModalDialog({
  onClose,
  initialSubject,
  initialSubjectTitle,
  defaultEmail = "",
  onSuccess,
}: SubscribeModalDialogProps) {
  const [email, setEmail] = useState(defaultEmail);
  const [selectedSubjects, setSelectedSubjects] = useState<SubjectChannel[]>(() => {
    if (initialSubject) {
      const normalized = initialSubject.toUpperCase().replace(/-/g, "_") as SubjectChannel;
      if (normalized === "ALL" || !ALL_INDIVIDUAL_SUBJECTS.includes(normalized)) {
        return ["ALL"];
      }
      return [normalized];
    }
    return ["ALL"];
  });
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [requiresVerification, setRequiresVerification] = useState(false);

  const modalRef = useRef<HTMLDivElement>(null);
  const emailInputRef = useRef<HTMLInputElement>(null);

  // Lock body scroll and set up focus restoration on mount/unmount
  useEffect(() => {
    const triggerEl = document.activeElement as HTMLElement | null;
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const timer = setTimeout(() => {
      emailInputRef.current?.focus();
    }, 50);

    return () => {
      document.body.style.overflow = originalOverflow;
      clearTimeout(timer);
      triggerEl?.focus();
    };
  }, []);

  // Focus trap & Escape key listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
        return;
      }

      if (e.key === "Tab" && modalRef.current) {
        const focusables = modalRef.current.querySelectorAll<HTMLElement>(
          'button:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])'
        );
        if (focusables.length === 0) return;

        const firstElement = focusables[0];
        const lastElement = focusables[focusables.length - 1];

        if (e.shiftKey) {
          if (document.activeElement === firstElement) {
            e.preventDefault();
            lastElement.focus();
          }
        } else {
          if (document.activeElement === lastElement) {
            e.preventDefault();
            firstElement.focus();
          }
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  // Master switch logic for toggling subject chips
  const handleToggle = useCallback((subject: SubjectChannel) => {
    setSelectedSubjects((prev) => {
      if (subject === "ALL") {
        return prev.includes("ALL") ? [] : ["ALL"];
      }

      let next: SubjectChannel[];
      if (prev.includes("ALL")) {
        next = ALL_INDIVIDUAL_SUBJECTS.filter((s) => s !== subject);
      } else if (prev.includes(subject)) {
        next = prev.filter((s) => s !== subject);
      } else {
        next = [...prev, subject];
      }

      const hasAllIndividuals = ALL_INDIVIDUAL_SUBJECTS.every((s) => next.includes(s));
      if (hasAllIndividuals) {
        return ["ALL"];
      }

      return next;
    });
  }, []);

  const validateEmail = (val: string): boolean => {
    const trimmed = val.trim();
    if (!trimmed) {
      setEmailError("Email address is required.");
      return false;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmed)) {
      setEmailError("Please enter a valid email address.");
      return false;
    }
    setEmailError(null);
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateEmail(email)) return;
    if (selectedSubjects.length === 0) {
      setErrorMessage("Please select at least one notification topic.");
      return;
    }

    setStatus("submitting");
    setErrorMessage(null);

    const payloadSubjects: SubjectChannel[] = selectedSubjects.includes("ALL")
      ? ["ALL"]
      : selectedSubjects;

    try {
      const res = await fetch("/api/notifications/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          subjects: payloadSubjects,
        }),
      });

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        throw new Error(data?.error || "Failed to process subscription.");
      }

      setRequiresVerification(!!data?.requiresVerification);
      setStatus("success");
      onSuccess?.({
        requiresVerification: !!data?.requiresVerification,
        email: email.trim(),
      });
    } catch (err: unknown) {
      setStatus("error");
      if (err instanceof Error) {
        setErrorMessage(err.message);
      } else {
        setErrorMessage("An unexpected error occurred. Please try again.");
      }
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 backdrop-blur-sm p-3 sm:p-4 overflow-y-auto animate-in fade-in-0 duration-200"
      onClick={onClose}
      data-testid="modal-backdrop"
    >
      <div
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="subscribe-modal-title"
        aria-describedby="subscribe-modal-description"
        onClick={(e) => e.stopPropagation()}
        className={cn(
          "w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl border border-border/80 bg-background shadow-2xl flex flex-col",
          "scale-100 transition-all duration-200 custom-scrollbar"
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 sm:px-6 py-4 border-b border-border/60 bg-muted/20 shrink-0">
          <div className="flex items-center gap-2.5">
            <Logo size={24} />
            <span className="text-xs font-mono font-medium uppercase tracking-wider text-muted-foreground">
              {initialSubjectTitle ? `${initialSubjectTitle} Releases` : "Release Updates"}
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="min-h-[44px] min-w-[44px] p-2.5 -mr-2 text-muted-foreground hover:text-foreground hover:bg-muted/50 rounded-lg transition-colors flex items-center justify-center touch-manipulation active:scale-95"
            aria-label="Close dialog"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 flex-1 flex flex-col">
          {status === "success" ? (
            /* Success State */
            <div
              className="flex flex-col items-center text-center py-6 sm:py-8 space-y-4"
              data-testid="subscribe-success"
            >
              <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-500">
                <Check className="w-7 h-7 stroke-[2.5]" />
              </div>
              <div className="space-y-1.5 max-w-sm">
                <h2
                  id="subscribe-modal-title"
                  className="text-xl font-bold tracking-tight text-foreground"
                >
                  {requiresVerification
                    ? "Check your inbox to verify"
                    : "Subscription confirmed!"}
                </h2>
                <p
                  id="subscribe-modal-description"
                  className="text-sm text-muted-foreground leading-relaxed"
                >
                  {requiresVerification ? (
                    <>
                      We sent a confirmation link to{" "}
                      <span className="font-semibold text-foreground">{email}</span>.
                      Please click the link within 24 hours to activate your subscription.
                    </>
                  ) : (
                    <>
                      You are now subscribed with{" "}
                      <span className="font-semibold text-foreground">{email}</span>. You
                      will receive release updates as new episodes go live.
                    </>
                  )}
                </p>
              </div>

              {/* Subscribed topics summary */}
              <div className="pt-2 flex flex-wrap justify-center gap-1.5 max-w-xs">
                {selectedSubjects.includes("ALL") ? (
                  <span className="text-xs px-2.5 py-1 rounded-full bg-indigo-500/10 text-indigo-500 dark:text-indigo-400 border border-indigo-500/30 font-medium">
                    All Disciplines
                  </span>
                ) : (
                  selectedSubjects.map((s) => (
                    <span
                      key={s}
                      className="text-xs px-2.5 py-1 rounded-full bg-muted border border-border text-foreground font-medium"
                    >
                      {SUBJECT_METADATA_MAP[s].title}
                    </span>
                  ))
                )}
              </div>

              <div className="pt-4 w-full">
                <button
                  type="button"
                  onClick={onClose}
                  className="min-h-[44px] w-full py-2.5 px-4 bg-primary text-primary-foreground font-semibold rounded-xl hover:opacity-90 active:scale-[0.98] transition-all touch-manipulation text-sm"
                >
                  Done
                </button>
              </div>
            </div>
          ) : (
            /* Form State */
            <form onSubmit={handleSubmit} className="flex flex-col gap-5">
              <div className="space-y-1">
                <h2
                  id="subscribe-modal-title"
                  className="text-xl font-bold tracking-tight text-foreground"
                >
                  Subscribe to Episode Releases
                </h2>
                <p
                  id="subscribe-modal-description"
                  className="text-xs text-muted-foreground leading-relaxed"
                >
                  Receive notifications whenever new interactive computational runtimes and
                  episodes are published. Zero spam, unsubscribe anytime.
                </p>
              </div>

              {/* Error Banner */}
              {status === "error" && errorMessage && (
                <div
                  role="alert"
                  className="p-3 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive dark:text-red-400 flex items-start gap-2.5 text-xs"
                >
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span className="leading-snug">{errorMessage}</span>
                </div>
              )}

              {/* Email Input */}
              <div className="space-y-1.5">
                <label
                  htmlFor="subscribe-email-input"
                  className="block text-xs font-medium text-foreground"
                >
                  Email address
                </label>
                <div className="relative">
                  <Input
                    ref={emailInputRef}
                    id="subscribe-email-input"
                    type="email"
                    name="email"
                    autoComplete="email"
                    placeholder="you@domain.com"
                    value={email}
                    disabled={status === "submitting"}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (emailError) validateEmail(e.target.value);
                    }}
                    onBlur={() => validateEmail(email)}
                    className={cn(
                      "min-h-[44px] h-11 text-base sm:text-sm px-3.5 pr-10",
                      emailError ? "border-destructive focus:ring-destructive/50" : ""
                    )}
                  />
                  <div className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-muted-foreground">
                    <Mail className="w-4 h-4" />
                  </div>
                </div>
                {emailError && (
                  <p className="text-[11px] text-destructive font-medium">{emailError}</p>
                )}
              </div>

              {/* Topic Selection */}
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-medium text-foreground">
                    Disciplines & Channels
                  </label>
                  <span className="text-[11px] text-muted-foreground">
                    {selectedSubjects.includes("ALL")
                      ? "All topics selected"
                      : `${selectedSubjects.length} selected`}
                  </span>
                </div>

                {/* Master ALL Chip */}
                <TopicChip
                  subject="ALL"
                  selected={selectedSubjects.includes("ALL")}
                  onToggle={handleToggle}
                  disabled={status === "submitting"}
                  isFullWidth
                />

                {/* Individual Discipline Chips */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {ALL_INDIVIDUAL_SUBJECTS.map((subject) => (
                    <TopicChip
                      key={subject}
                      subject={subject}
                      selected={
                        selectedSubjects.includes("ALL") ||
                        selectedSubjects.includes(subject)
                      }
                      onToggle={handleToggle}
                      disabled={status === "submitting"}
                    />
                  ))}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-2 flex items-center justify-end gap-3 border-t border-border/60">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={status === "submitting"}
                  className="min-h-[44px] px-4 py-2.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors touch-manipulation"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={
                    status === "submitting" ||
                    !email.trim() ||
                    selectedSubjects.length === 0
                  }
                  className="min-h-[44px] px-5 py-2.5 bg-primary text-primary-foreground font-semibold rounded-xl hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed touch-manipulation flex items-center gap-2 text-xs"
                >
                  {status === "submitting" ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Subscribing...</span>
                    </>
                  ) : (
                    <span>Subscribe</span>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

export function SubscribeModal({
  isOpen,
  onClose,
  initialSubject,
  initialSubjectTitle,
  defaultEmail = "",
  onSuccess,
}: SubscribeModalProps) {
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );

  if (!isOpen || !mounted) return null;

  return createPortal(
    <SubscribeModalDialog
      onClose={onClose}
      initialSubject={initialSubject}
      initialSubjectTitle={initialSubjectTitle}
      defaultEmail={defaultEmail}
      onSuccess={onSuccess}
    />,
    document.body
  );
}
