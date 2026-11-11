"use client";

import React, { useState } from "react";
import { Bell } from "lucide-react";
import { SubjectChannel } from "@/components/notifications/TopicChip";
import { SubscribeModal } from "@/components/notifications/SubscribeModal";
import { cn } from "@/lib/utils";

export interface SubscribeButtonProps {
  /** The contextual subject channel (e.g. SubjectChannel.JAVASCRIPT, or ALL) */
  subject?: SubjectChannel;
  /** Human-friendly title of the subject (e.g. "JavaScript", "Computer Networks") */
  subjectTitle?: string;
  /** Custom label override (defaults to "Get Release Notifications" or "Subscribe to {subject}") */
  label?: string;
  /** Visual presentation variant */
  variant?: "primary" | "secondary" | "accent" | "outline" | "icon";
  /** Size variant */
  size?: "sm" | "md" | "lg";
  /** Optional custom class names */
  className?: string;
  /** Optional callback fired when the trigger button is clicked */
  onClick?: () => void;
}

export function SubscribeButton({
  subject = SubjectChannel.ALL,
  subjectTitle,
  label,
  variant = "accent",
  size = "md",
  className,
  onClick,
}: SubscribeButtonProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const displayTitle =
    subjectTitle ??
    (subject === SubjectChannel.ALL ? "All Disciplines" : subject.replace(/_/g, " "));
  const defaultLabel =
    subject === SubjectChannel.ALL ? "Get Release Notifications" : `Subscribe to ${displayTitle}`;
  const buttonText = label ?? defaultLabel;

  const handleClick = () => {
    onClick?.();
    setIsModalOpen(true);
  };

  return (
    <>
      <button
        type="button"
        onClick={handleClick}
        aria-haspopup="dialog"
        aria-expanded={isModalOpen}
        aria-label={`Subscribe to ${displayTitle} notifications`}
        className={cn(
          "inline-flex items-center justify-center gap-2 font-semibold transition-all duration-200 select-none",
          "touch-manipulation active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 dark:focus-visible:ring-offset-zinc-950",
          // Rule #7: Minimum 44px touch target on mobile (< sm), compact on desktop (sm:)
          "min-h-[44px] sm:min-h-[38px] px-4 py-2 sm:py-1.5 rounded-xl text-xs sm:text-sm",
          variant === "accent" &&
            "bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/30 hover:bg-amber-500/20 shadow-xs",
          variant === "outline" &&
            "bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800/80 dark:hover:bg-zinc-700/80 text-zinc-800 dark:text-zinc-200 border border-zinc-200/80 dark:border-zinc-700/60",
          variant === "primary" && "bg-primary text-primary-foreground hover:opacity-90 shadow-sm",
          variant === "icon" &&
            "p-2 min-w-[44px] min-h-[44px] rounded-lg border border-border/60 hover:bg-muted text-muted-foreground hover:text-foreground",
          size === "sm" && "text-xs px-3 py-1 sm:min-h-[34px]",
          size === "lg" && "text-base px-5 py-2.5 sm:min-h-[44px]",
          className
        )}
      >
        <Bell className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
        {variant !== "icon" && <span>{buttonText}</span>}
      </button>

      {/* Accessible Dialog */}
      <SubscribeModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        initialSubject={subject}
        initialSubjectTitle={displayTitle}
      />
    </>
  );
}
