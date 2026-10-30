import { describe, it, expect } from "vitest";
import {
  parseEpisodeDate,
  compareEpisodesLatest,
  getAllEpisodes,
  getLatestEpisodes,
  type LatestEpisode,
} from "../latest-episodes";
import { DISCIPLINES } from "@/components/ui/DisciplineCard";

describe("latest-episodes utility", () => {
  describe("parseEpisodeDate", () => {
    it("parses valid human-formatted dates into valid Date instances", () => {
      const d1 = parseEpisodeDate("29 October 2026");
      expect(d1).not.toBeNull();
      expect(d1?.getUTCFullYear()).toBe(2026);
      expect(d1?.getUTCMonth()).toBe(9); // October is month 9 (0-indexed)
      expect(d1?.getUTCDate()).toBe(29);

      const d2 = parseEpisodeDate("5 August 2026");
      expect(d2).not.toBeNull();
      expect(d2?.getUTCFullYear()).toBe(2026);
      expect(d2?.getUTCMonth()).toBe(7); // August
      expect(d2?.getUTCDate()).toBe(5);
    });

    it("returns null for Coming Soon, empty string, or undefined", () => {
      expect(parseEpisodeDate("Coming Soon")).toBeNull();
      expect(parseEpisodeDate("coming soon")).toBeNull();
      expect(parseEpisodeDate("")).toBeNull();
      expect(parseEpisodeDate(undefined)).toBeNull();
      expect(parseEpisodeDate("   ")).toBeNull();
      expect(parseEpisodeDate("Invalid Date String XYZ")).toBeNull();
    });
  });

  describe("compareEpisodesLatest", () => {
    const dummyDiscipline = DISCIPLINES[0];

    it("sorts newer date before older date", () => {
      const epOld: LatestEpisode = {
        id: "old",
        episodeNumber: 1,
        title: "Old Episode",
        description: "Desc",
        date: "14 July 2026",
        href: "/old",
        icon: null,
        discipline: dummyDiscipline,
        resolvedAccent: "amber",
      };

      const epNew: LatestEpisode = {
        id: "new",
        episodeNumber: 2,
        title: "New Episode",
        description: "Desc",
        date: "29 October 2026",
        href: "/new",
        icon: null,
        discipline: dummyDiscipline,
        resolvedAccent: "teal",
      };

      expect(compareEpisodesLatest(epNew, epOld)).toBeLessThan(0);
      expect(compareEpisodesLatest(epOld, epNew)).toBeGreaterThan(0);
    });

    it("breaks same-date ties by higher episode number first", () => {
      const epA: LatestEpisode = {
        id: "ep-1",
        episodeNumber: 1,
        title: "Episode 1",
        description: "Desc",
        date: "27 October 2026",
        href: "/ep1",
        icon: null,
        discipline: dummyDiscipline,
        resolvedAccent: "teal",
      };

      const epB: LatestEpisode = {
        id: "ep-2",
        episodeNumber: 2,
        title: "Episode 2",
        description: "Desc",
        date: "27 October 2026",
        href: "/ep2",
        icon: null,
        discipline: dummyDiscipline,
        resolvedAccent: "teal",
      };

      // epB (episodeNumber 2) should rank before epA (episodeNumber 1)
      expect(compareEpisodesLatest(epB, epA)).toBeLessThan(0);
      expect(compareEpisodesLatest(epA, epB)).toBeGreaterThan(0);
    });
  });

  describe("getAllEpisodes", () => {
    it("aggregates episodes across all registered disciplines with attached metadata", () => {
      const all = getAllEpisodes();
      expect(all.length).toBeGreaterThan(20);

      // Verify each item has a discipline attached and a valid accent
      for (const ep of all) {
        expect(ep.discipline).toBeDefined();
        expect(ep.discipline.title).toBeTruthy();
        expect(ep.resolvedAccent).toBeTruthy();
      }
    });
  });

  describe("getLatestEpisodes", () => {
    it("returns the top 6 released episodes sorted chronologically descending", () => {
      const latest = getLatestEpisodes(6);
      expect(latest).toHaveLength(6);

      // Verify no "Coming Soon" episodes leaked through
      for (const ep of latest) {
        expect(ep.date?.toLowerCase()).not.toContain("coming soon");
        expect(parseEpisodeDate(ep.date)).not.toBeNull();
      }

      // Verify descending order
      for (let i = 0; i < latest.length - 1; i++) {
        const timeCurrent = parseEpisodeDate(latest[i].date)!.getTime();
        const timeNext = parseEpisodeDate(latest[i + 1].date)!.getTime();
        expect(timeCurrent).toBeGreaterThanOrEqual(timeNext);
      }

      // The most recent episodes should include October 2026 releases (e.g. HTTP, TCP)
      const topTitles = latest.map((ep) => ep.title);
      expect(topTitles).toContain("HTTP Request & Response Lifecycle");
      expect(topTitles).toContain("TCP Connection Establishment & Lifecycle");
    });

    it("respects custom count parameter", () => {
      const latest3 = getLatestEpisodes(3);
      expect(latest3).toHaveLength(3);
    });
  });
});
