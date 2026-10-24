import Link from "next/link";
import { type ReactNode } from "react";
import { cn } from "@/lib/utils";

export type EpisodeAccent =
  | "amber"
  | "yellow"
  | "orange"
  | "teal"
  | "cyan"
  | "sky"
  | "blue"
  | "indigo"
  | "green"
  | "emerald"
  | "pink"
  | "purple"
  | "violet"
  | "rose";

export interface EpisodeMetadata {
  id?: string;
  episodeNumber?: number | string;
  title: string;
  description: string;
  date?: string;
  href: string;
  icon: ReactNode;
  accent?: EpisodeAccent;
  badge?: string;
  launchLabel?: string;
}

export interface EpisodeCardProps extends Partial<EpisodeMetadata> {
  episode?: EpisodeMetadata;
  className?: string;
}

interface AccentConfig {
  cardBorder: string;
  cardShadow: string;
  iconBg: string;
  iconText: string;
  titleHover: string;
  chevronHover: string;
  launchBtn: string;
  badge: string;
}

const ACCENT_STYLES: Record<EpisodeAccent, AccentConfig> = {
  amber: {
    cardBorder: "hover:border-[#F7DF1E]/50",
    cardShadow: "hover:shadow-[0_0_30px_-5px_rgba(247,223,30,0.2)]",
    iconBg: "bg-[#F7DF1E]/10",
    iconText: "text-amber-500",
    titleHover: "group-hover:text-amber-500",
    chevronHover: "group-hover:text-amber-500",
    launchBtn: "text-amber-500 bg-amber-500/10 group-hover:bg-amber-500/20",
    badge: "bg-[#F7DF1E]/10 text-amber-500",
  },
  yellow: {
    cardBorder: "hover:border-yellow-500/50",
    cardShadow: "hover:shadow-[0_0_30px_-5px_rgba(234,179,8,0.2)]",
    iconBg: "bg-yellow-500/10",
    iconText: "text-yellow-500",
    titleHover: "group-hover:text-yellow-500",
    chevronHover: "group-hover:text-yellow-500",
    launchBtn: "text-yellow-500 bg-yellow-500/10 group-hover:bg-yellow-500/20",
    badge: "bg-yellow-500/10 text-yellow-500",
  },
  orange: {
    cardBorder: "hover:border-orange-500/50",
    cardShadow: "hover:shadow-[0_0_30px_-5px_rgba(249,115,22,0.2)]",
    iconBg: "bg-orange-500/10",
    iconText: "text-orange-500",
    titleHover: "group-hover:text-orange-500",
    chevronHover: "group-hover:text-orange-500",
    launchBtn: "text-orange-500 bg-orange-500/10 group-hover:bg-orange-500/20",
    badge: "bg-orange-500/10 text-orange-500",
  },
  teal: {
    cardBorder: "hover:border-teal-500/50",
    cardShadow: "hover:shadow-[0_0_30px_-5px_rgba(6,182,212,0.2)]",
    iconBg: "bg-teal-500/10",
    iconText: "text-teal-500",
    titleHover: "group-hover:text-teal-500",
    chevronHover: "group-hover:text-teal-500",
    launchBtn: "text-teal-500 bg-teal-500/10 group-hover:bg-teal-500/20",
    badge: "bg-teal-500/10 text-teal-500",
  },
  cyan: {
    cardBorder: "hover:border-cyan-500/50",
    cardShadow: "hover:shadow-[0_0_30px_-5px_rgba(6,182,212,0.2)]",
    iconBg: "bg-cyan-500/10",
    iconText: "text-cyan-500",
    titleHover: "group-hover:text-cyan-500",
    chevronHover: "group-hover:text-cyan-500",
    launchBtn: "text-cyan-500 bg-cyan-500/10 group-hover:bg-cyan-500/20",
    badge: "bg-cyan-500/10 text-cyan-500",
  },
  sky: {
    cardBorder: "hover:border-sky-500/50",
    cardShadow: "hover:shadow-[0_0_30px_-5px_rgba(14,165,233,0.2)]",
    iconBg: "bg-sky-500/10",
    iconText: "text-sky-500",
    titleHover: "group-hover:text-sky-500",
    chevronHover: "group-hover:text-sky-500",
    launchBtn: "text-sky-500 bg-sky-500/10 group-hover:bg-sky-500/20",
    badge: "bg-sky-500/10 text-sky-500",
  },
  blue: {
    cardBorder: "hover:border-blue-500/50",
    cardShadow: "hover:shadow-[0_0_30px_-5px_rgba(59,130,246,0.2)]",
    iconBg: "bg-blue-500/10",
    iconText: "text-blue-500",
    titleHover: "group-hover:text-blue-500",
    chevronHover: "group-hover:text-blue-500",
    launchBtn: "text-blue-500 bg-blue-500/10 group-hover:bg-blue-500/20",
    badge: "bg-blue-500/10 text-blue-500",
  },
  indigo: {
    cardBorder: "hover:border-indigo-500/50",
    cardShadow: "hover:shadow-[0_0_30px_-5px_rgba(99,102,241,0.2)]",
    iconBg: "bg-indigo-500/10",
    iconText: "text-indigo-500",
    titleHover: "group-hover:text-indigo-500",
    chevronHover: "group-hover:text-indigo-500",
    launchBtn: "text-indigo-500 bg-indigo-500/10 group-hover:bg-indigo-500/20",
    badge: "bg-indigo-500/10 text-indigo-500",
  },
  green: {
    cardBorder: "hover:border-green-500/50",
    cardShadow: "hover:shadow-[0_0_30px_-5px_rgba(34,197,94,0.2)]",
    iconBg: "bg-green-500/10",
    iconText: "text-green-500",
    titleHover: "group-hover:text-green-500",
    chevronHover: "group-hover:text-green-500",
    launchBtn: "text-green-500 bg-green-500/10 group-hover:bg-green-500/20",
    badge: "bg-green-500/10 text-green-500",
  },
  emerald: {
    cardBorder: "hover:border-emerald-500/50",
    cardShadow: "hover:shadow-[0_0_30px_-5px_rgba(16,185,129,0.2)]",
    iconBg: "bg-emerald-500/10",
    iconText: "text-emerald-500",
    titleHover: "group-hover:text-emerald-500",
    chevronHover: "group-hover:text-emerald-500",
    launchBtn: "text-emerald-500 bg-emerald-500/10 group-hover:bg-emerald-500/20",
    badge: "bg-emerald-500/10 text-emerald-500",
  },
  pink: {
    cardBorder: "hover:border-pink-500/50",
    cardShadow: "hover:shadow-[0_0_30px_-5px_rgba(236,72,153,0.2)]",
    iconBg: "bg-pink-500/10",
    iconText: "text-pink-500",
    titleHover: "group-hover:text-pink-500",
    chevronHover: "group-hover:text-pink-500",
    launchBtn: "text-pink-500 bg-pink-500/10 group-hover:bg-pink-500/20",
    badge: "bg-pink-500/10 text-pink-500",
  },
  purple: {
    cardBorder: "hover:border-purple-500/50",
    cardShadow: "hover:shadow-[0_0_30px_-5px_rgba(168,85,247,0.2)]",
    iconBg: "bg-purple-500/10",
    iconText: "text-purple-500",
    titleHover: "group-hover:text-purple-500",
    chevronHover: "group-hover:text-purple-500",
    launchBtn: "text-purple-500 bg-purple-500/10 group-hover:bg-purple-500/20",
    badge: "bg-purple-500/10 text-purple-500",
  },
  violet: {
    cardBorder: "hover:border-violet-500/50",
    cardShadow: "hover:shadow-[0_0_30px_-5px_rgba(139,92,246,0.2)]",
    iconBg: "bg-violet-500/10",
    iconText: "text-violet-500",
    titleHover: "group-hover:text-violet-500",
    chevronHover: "group-hover:text-violet-500",
    launchBtn: "text-violet-500 bg-violet-500/10 group-hover:bg-violet-500/20",
    badge: "bg-violet-500/10 text-violet-500",
  },
  rose: {
    cardBorder: "hover:border-rose-500/50",
    cardShadow: "hover:shadow-[0_0_30px_-5px_rgba(244,63,94,0.2)]",
    iconBg: "bg-rose-500/10",
    iconText: "text-rose-500",
    titleHover: "group-hover:text-rose-500",
    chevronHover: "group-hover:text-rose-500",
    launchBtn: "text-rose-500 bg-rose-500/10 group-hover:bg-rose-500/20",
    badge: "bg-rose-500/10 text-rose-500",
  },
};

function formatEpisodeLabel(num?: number | string): string {
  if (num === undefined || num === null || num === "") return "";
  const str = String(num).trim();
  if (/^episode\b/i.test(str)) return str;
  if (/^\d+$/.test(str)) return `Episode ${str}`;
  return str;
}

export function EpisodeCard(props: EpisodeCardProps) {
  const merged = props.episode ? { ...props.episode, ...props } : props;
  const {
    episodeNumber,
    title = "",
    description = "",
    date = "",
    href = "#",
    icon,
    accent = "amber",
    badge,
    launchLabel = "Launch",
    className,
  } = merged;

  const styles = ACCENT_STYLES[accent] ?? ACCENT_STYLES.amber;
  const episodeLabel = formatEpisodeLabel(episodeNumber);
  const ariaLabel =
    episodeLabel && title
      ? `${episodeLabel}: ${title}`
      : title || episodeLabel || "Launch episode";

  return (
    <Link
      href={href}
      className={cn("group block h-full", className)}
      aria-label={ariaLabel}
    >
      <div
        className={cn(
          "relative h-full p-4 sm:p-6 rounded-2xl border border-border bg-card transition-all duration-300 flex flex-col justify-center",
          styles.cardBorder,
          styles.cardShadow
        )}
      >
        {(episodeLabel || badge) && (
          <div className="hidden sm:flex items-center justify-between mb-4">
            {episodeLabel && (
              <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                {episodeLabel}
              </div>
            )}
            {badge && (
              <div
                className={cn(
                  "text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded ml-auto",
                  styles.badge
                )}
              >
                {badge}
              </div>
            )}
          </div>
        )}

        <div className="flex items-center sm:block gap-4 sm:gap-0">
          <div
            className={cn(
              "w-12 h-12 sm:w-10 sm:h-10 shrink-0 rounded-xl flex items-center justify-center sm:mb-4 group-hover:scale-110 transition-transform duration-300",
              styles.iconBg,
              styles.iconText
            )}
            aria-hidden="true"
          >
            {icon}
          </div>
          <div className="flex-1 min-w-0">
            {(episodeLabel || badge) && (
              <div className="flex sm:hidden items-center gap-2 mb-1">
                {episodeLabel && (
                  <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    {episodeLabel}
                  </span>
                )}
                {badge && (
                  <span
                    className={cn(
                      "text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded ml-auto",
                      styles.badge
                    )}
                  >
                    {badge}
                  </span>
                )}
              </div>
            )}
            <h3
              className={cn(
                "text-base sm:text-xl font-bold text-foreground sm:mb-3 transition-colors line-clamp-2",
                styles.titleHover
              )}
            >
              {title}
            </h3>
            <p className="hidden sm:block text-sm text-muted-foreground mb-6 leading-relaxed line-clamp-3">
              {description}
            </p>
          </div>
          <div
            className={cn(
              "sm:hidden flex items-center justify-center text-muted-foreground transition-colors",
              styles.chevronHover
            )}
            aria-hidden="true"
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M9 18l6-6-6-6" />
            </svg>
          </div>
        </div>

        <div className="hidden sm:flex items-center justify-between mt-auto pt-4 border-t border-border/40">
          <div className="flex items-center text-xs font-medium text-muted-foreground">
            {date}
          </div>
          <div
            className={cn(
              "flex items-center text-xs font-bold px-3 py-1.5 rounded-lg transition-colors",
              styles.launchBtn
            )}
          >
            {launchLabel}{" "}
            <svg
              className="ml-1.5 w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              aria-hidden="true"
            >
              <path d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          </div>
        </div>
      </div>
    </Link>
  );
}
