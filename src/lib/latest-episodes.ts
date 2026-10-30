import { JAVASCRIPT_EPISODES } from "@/app/javascript/episodes";
import { OPERATING_SYSTEMS_EPISODES } from "@/app/operating-systems/episodes";
import { JAVA_EPISODES } from "@/app/java/episodes";
import { FRONTEND_EPISODES } from "@/app/frontend/episodes";
import { BACKEND_EPISODES } from "@/app/backend/episodes";
import { COMPUTER_NETWORKS_EPISODES } from "@/app/computer-networks/episodes";
import { DISCIPLINES, type DisciplineItem } from "@/components/ui/DisciplineCard";
import type { EpisodeMetadata, EpisodeAccent } from "@/components/ui/EpisodeCard";

export interface LatestEpisode extends EpisodeMetadata {
  discipline: DisciplineItem;
  resolvedAccent: EpisodeAccent;
}

const DISCIPLINE_DEFAULT_ACCENTS: Record<string, EpisodeAccent> = {
  javascript: "amber",
  "operating-systems": "sky",
  java: "emerald",
  frontend: "violet",
  backend: "blue",
  "computer-networks": "teal",
};

const MONTH_MAP: Record<string, number> = {
  january: 0,
  jan: 0,
  february: 1,
  feb: 1,
  march: 2,
  mar: 2,
  april: 3,
  apr: 3,
  may: 4,
  june: 5,
  jun: 5,
  july: 6,
  jul: 6,
  august: 7,
  aug: 7,
  september: 8,
  sep: 8,
  sept: 8,
  october: 9,
  oct: 9,
  november: 10,
  nov: 10,
  december: 11,
  dec: 11,
};

/**
 * Safely parses human-readable episode release dates (e.g. "29 October 2026").
 * Returns null for "Coming Soon", empty values, or invalid date strings.
 */
export function parseEpisodeDate(dateStr?: string): Date | null {
  if (!dateStr) return null;
  const trimmed = dateStr.trim();
  if (!trimmed || /coming\s*soon/i.test(trimmed)) return null;

  // Prefer structured UTC parsing for "DD Month YYYY" so timezone offsets never skew dates
  const parts = trimmed.split(/\s+/);
  if (parts.length === 3) {
    const day = parseInt(parts[0], 10);
    const monthKey = parts[1].toLowerCase();
    const year = parseInt(parts[2], 10);
    if (!isNaN(day) && !isNaN(year) && monthKey in MONTH_MAP) {
      return new Date(Date.UTC(year, MONTH_MAP[monthKey], day));
    }
  }

  // Fallback to standard Date.parse
  const timestamp = Date.parse(trimmed);
  if (!isNaN(timestamp)) {
    return new Date(timestamp);
  }

  return null;
}

/**
 * Comparator to order episodes by release date (newest first),
 * breaking ties by episode number descending and discipline name.
 */
export function compareEpisodesLatest(a: LatestEpisode, b: LatestEpisode): number {
  const dateA = parseEpisodeDate(a.date);
  const dateB = parseEpisodeDate(b.date);

  const timeA = dateA ? dateA.getTime() : 0;
  const timeB = dateB ? dateB.getTime() : 0;

  if (timeB !== timeA) {
    return timeB - timeA;
  }

  const numA = typeof a.episodeNumber === "number" ? a.episodeNumber : parseFloat(String(a.episodeNumber)) || 0;
  const numB = typeof b.episodeNumber === "number" ? b.episodeNumber : parseFloat(String(b.episodeNumber)) || 0;
  if (numB !== numA) {
    return numB - numA;
  }

  return a.discipline.title.localeCompare(b.discipline.title);
}

const REGISTRY_MAP: Record<string, EpisodeMetadata[]> = {
  javascript: JAVASCRIPT_EPISODES,
  "operating-systems": OPERATING_SYSTEMS_EPISODES,
  java: JAVA_EPISODES,
  frontend: FRONTEND_EPISODES,
  backend: BACKEND_EPISODES,
  "computer-networks": COMPUTER_NETWORKS_EPISODES,
};

/**
 * Aggregates all registered episodes across all disciplines, tagging each with
 * parent discipline metadata and resolved accent colors.
 */
export function getAllEpisodes(): LatestEpisode[] {
  const result: LatestEpisode[] = [];

  for (const disc of DISCIPLINES) {
    const episodes = REGISTRY_MAP[disc.id] ?? [];
    const defaultAccent = DISCIPLINE_DEFAULT_ACCENTS[disc.id] ?? "amber";

    for (const ep of episodes) {
      result.push({
        ...ep,
        discipline: disc,
        resolvedAccent: ep.accent ?? defaultAccent,
      });
    }
  }

  return result;
}

/**
 * Returns the N most recently released episodes across all disciplines.
 * Automatically excludes "Coming Soon" unreleased modules.
 */
export function getLatestEpisodes(count = 6): LatestEpisode[] {
  return getAllEpisodes()
    .filter((ep) => parseEpisodeDate(ep.date) !== null)
    .sort(compareEpisodesLatest)
    .slice(0, count);
}
