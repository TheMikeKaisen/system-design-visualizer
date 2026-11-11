/**
 * src/__tests__/notifications/challenger-m7-1.test.ts
 *
 * EMPIRICAL ADVERSARIAL CHALLENGER SUITE: M7-1
 * AST Differ & Git Chaos Challenger
 *
 * Stress-tests AST parsing and Git detection engine across 4 empirical chaos dimensions:
 * 1. Malformed & Edge-Case TSX Code
 * 2. Date Permutations & State Machine Invariants
 * 3. Array Mutation & Renumbering Chaos
 * 4. Git Tree Diffs & Multi-Subject Batching
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  SubjectChannel,
  SUBJECT_FILE_MAP,
  SUBJECT_SLUG_MAP,
  isReleasedDate,
  parseEpisodesFromTsx,
  detectNewEpisodesFromCode,
  detectNewEpisodes,
  main,
} from "../../../scripts/detect-new-episodes";
import { SubjectChannel as PrismaSubjectChannel } from "@prisma/client";
import { normalizeSubjectChannel } from "@/workers/types";

describe("Challenger M7-1: AST Differ & Git Chaos Empirical Test Suite", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  // ==========================================================================
  // Dimension 1: Malformed & Edge-Case TSX Code
  // ==========================================================================
  describe("Dimension 1: Malformed & Edge-Case TSX Code", () => {
    it("handles incomplete AST nodes and truncated TSX gracefully without throwing", () => {
      const truncatedTsx = `
        export const JAVASCRIPT_EPISODES: EpisodeMetadata[] = [
          {
            id: "partial-node",
            episodeNumber: 1,
            title: "Partial Title",
            date: "2026-10-01",
      `;

      // AST parser must not crash on incomplete / syntax-broken TSX
      expect(() => parseEpisodesFromTsx(truncatedTsx)).not.toThrow();
      const parsed = parseEpisodesFromTsx(truncatedTsx);
      // Parser recovers partial nodes where possible, or returns valid elements
      expect(Array.isArray(parsed)).toBe(true);
    });

    it("handles unclosed object literal after a valid object", () => {
      const malformedCode = `
        export const JAVASCRIPT_EPISODES = [
          {
            id: "ep-1",
            episodeNumber: 1,
            title: "Complete Episode",
            date: "2026-10-01",
          },
          {
            id: "ep-2-broken",
            title: "Unterminated
      `;

      const parsed = parseEpisodesFromTsx(malformedCode);
      expect(parsed.length).toBeGreaterThanOrEqual(1);
      expect(parsed[0].id).toBe("ep-1");
      expect(parsed[0].title).toBe("Complete Episode");
    });

    it("returns empty array for empty strings, whitespace, or non-array initializers", () => {
      expect(parseEpisodesFromTsx("")).toEqual([]);
      expect(parseEpisodesFromTsx("   \n\t  ")).toEqual([]);
      expect(
        parseEpisodesFromTsx("export const JAVASCRIPT_EPISODES = 'not an array';")
      ).toEqual([]);
      expect(
        parseEpisodesFromTsx("export const JAVASCRIPT_EPISODES = 42;")
      ).toEqual([]);
      expect(
        parseEpisodesFromTsx("export const JAVASCRIPT_EPISODES = null;")
      ).toEqual([]);
      expect(
        parseEpisodesFromTsx("export const OTHER_ITEMS = [{ id: 'x', title: 'y' }];")
      ).toEqual([]);
    });

    it("ignores single-line and multi-line comments inside and between array elements", () => {
      const tsxWithComments = `
        import React from "react";
        // Pre-array comment
        export const JAVASCRIPT_EPISODES = [
          // Leading comment before first element
          {
            /* Inline comment before id */
            id: "ep-comments",
            // Comment on episodeNumber
            episodeNumber: 1,
            title: "Episode With Comments",
            /* Multi-line
               block comment
               explaining the date */
            date: "15 October 2026",
            description: "Testing trivia parsing.",
            href: "/javascript/simulator/ep-comments",
            accent: "emerald",
          },
          // Middle separator comment
          /* Intermediary block comment */
          {
            id: "ep-placeholder",
            episodeNumber: 2,
            title: "Placeholder Episode",
            date: "Coming Soon",
          },
          // Trailing comment
        ];
      `;

      const parsed = parseEpisodesFromTsx(tsxWithComments);
      expect(parsed).toHaveLength(2);
      expect(parsed[0].id).toBe("ep-comments");
      expect(parsed[0].episodeNumber).toBe(1);
      expect(parsed[0].title).toBe("Episode With Comments");
      expect(parsed[0].date).toBe("15 October 2026");
      expect(parsed[0].accent).toBe("emerald");
      expect(parsed[1].id).toBe("ep-placeholder");
      expect(parsed[1].date).toBe("Coming Soon");
    });

    it("safely ignores JSX elements with complex props without throwing or failing", () => {
      const tsxWithJsx = `
        import React from "react";
        import { Cpu, Network, ShieldCheck } from "lucide-react";

        export const OPERATING_SYSTEMS_EPISODES = [
          {
            id: "cpu-scheduling",
            episodeNumber: 1,
            title: "CPU Scheduling Algorithms",
            description: "Interactive visualizer of FIFO, SJF, and Round Robin.",
            date: "2026-10-20",
            href: "/operating-systems/cpu-scheduling",
            icon: <Cpu className="w-5 h-5 text-amber-400" aria-hidden="true" data-testid="cpu-icon" />,
            badgeIcon: <ShieldCheck className="w-4 h-4 text-emerald-500" />,
            badge: "CORE",
            accent: "amber",
          },
          {
            id: "memory-management",
            episodeNumber: 2,
            title: "Virtual Memory & Paging",
            description: "Page tables and TLB cache.",
            date: "Coming Soon",
            icon: <Network className="w-5 h-5" />,
          }
        ];
      `;

      const parsed = parseEpisodesFromTsx(tsxWithJsx);
      expect(parsed).toHaveLength(2);
      expect(parsed[0].id).toBe("cpu-scheduling");
      expect(parsed[0].title).toBe("CPU Scheduling Algorithms");
      expect(parsed[0].date).toBe("2026-10-20");
      expect(parsed[0].badge).toBe("CORE");
      expect(parsed[0].accent).toBe("amber");
      // Verify JSX elements were safely skipped and not treated as invalid strings
      expect(Reflect.get(parsed[0], "icon")).toBeUndefined();
    });

    it("parses no-substitution template literals while ignoring substituted templates for string fields", () => {
      const tsxWithTemplates = `
        const DYNAMIC_SUFFIX = "Advanced";
        export const JAVASCRIPT_EPISODES = [
          {
            id: \`no-sub-id\`,
            episodeNumber: 1,
            title: \`No Substitution Title\`,
            description: \`A description inside template literal without expressions.\`,
            date: \`25 October 2026\`,
            href: \`/javascript/simulator/no-sub-id\`,
            accent: \`indigo\`,
          },
          {
            id: "substituted-id",
            episodeNumber: 2,
            // Substituted template expression: cannot be safely statically resolved without an evaluator
            title: \`JavaScript \${DYNAMIC_SUFFIX}\`,
            date: "2026-10-25",
          }
        ];
      `;

      const parsed = parseEpisodesFromTsx(tsxWithTemplates);
      // First episode has pure no-substitution template literals: must parse perfectly
      expect(parsed.some((e) => e.id === "no-sub-id")).toBe(true);
      const ep1 = parsed.find((e) => e.id === "no-sub-id")!;
      expect(ep1.title).toBe("No Substitution Title");
      expect(ep1.date).toBe("25 October 2026");
      expect(ep1.accent).toBe("indigo");

      // Second episode has substitution in title -> title is undefined -> required field missing -> dropped
      expect(parsed.some((e) => e.id === "substituted-id")).toBe(false);
    });

    it("parses numeric literal variations (hex, octal, binary, exponential, negative numbers)", () => {
      const tsxWithNumbers = `
        export const COMPUTER_NETWORKS_EPISODES = [
          {
            id: "hex-ep",
            episodeNumber: 0x10, // 16
            title: "Hexadecimal Episode",
            date: "2026-10-01",
          },
          {
            id: "binary-ep",
            episodeNumber: 0b101, // 5
            title: "Binary Episode",
            date: "2026-10-02",
          },
          {
            id: "octal-ep",
            episodeNumber: 0o70, // 56
            title: "Octal Episode",
            date: "2026-10-03",
          },
          {
            id: "exp-ep",
            episodeNumber: 1e2, // 100
            title: "Exponential Episode",
            date: "2026-10-04",
          },
          {
            id: "negative-ep",
            episodeNumber: -7, // -7
            title: "Negative Episode",
            date: "2026-10-05",
          },
        ];
      `;

      const parsed = parseEpisodesFromTsx(tsxWithNumbers);
      expect(parsed).toHaveLength(5);
      expect(parsed[0].episodeNumber).toBe(16);
      expect(parsed[1].episodeNumber).toBe(5);
      expect(parsed[2].episodeNumber).toBe(56);
      expect(parsed[3].episodeNumber).toBe(100);
      expect(parsed[4].episodeNumber).toBe(-7);
    });

    it("applies safe fallbacks for missing optional fields (href, description, accent, badge)", () => {
      const tsxMinimal = `
        export const JAVA_EPISODES = [
          {
            id: "minimal-ep",
            title: "Minimal Episode Without Optionals",
          }
        ];
      `;

      const parsed = parseEpisodesFromTsx(tsxMinimal);
      expect(parsed).toHaveLength(1);
      expect(parsed[0].id).toBe("minimal-ep");
      expect(parsed[0].title).toBe("Minimal Episode Without Optionals");
      expect(parsed[0].episodeNumber).toBe(0);
      expect(parsed[0].description).toBe("");
      expect(parsed[0].date).toBe("");
      expect(parsed[0].href).toBe("#");
      expect(parsed[0].accent).toBeUndefined();
      expect(parsed[0].badge).toBeUndefined();
    });

    it("drops elements missing required identifier fields (id or title)", () => {
      const tsxMissingRequired = `
        export const BACKEND_EPISODES = [
          {
            // Missing id!
            title: "No ID Episode",
            date: "2026-10-01",
          },
          {
            // Missing title!
            id: "no-title-ep",
            date: "2026-10-02",
          },
          {
            id: "valid-ep",
            title: "Valid Episode",
            date: "2026-10-03",
          }
        ];
      `;

      const parsed = parseEpisodesFromTsx(tsxMissingRequired);
      expect(parsed).toHaveLength(1);
      expect(parsed[0].id).toBe("valid-ep");
      expect(parsed[0].title).toBe("Valid Episode");
    });
  });

  // ==========================================================================
  // Dimension 2: Date Permutations & State Machine Invariants
  // ==========================================================================
  describe("Dimension 2: Date Permutations & State Machine Invariants", () => {
    describe("isReleasedDate Date Classification Permutations", () => {
      it("correctly flags all 'Coming Soon' case variations and decorations as unreleased (false)", () => {
        expect(isReleasedDate("coming soon")).toBe(false);
        expect(isReleasedDate("Coming Soon")).toBe(false);
        expect(isReleasedDate("COMING SOON")).toBe(false);
        expect(isReleasedDate("Coming soon...")).toBe(false);
        expect(isReleasedDate("  coming   soon  ")).toBe(false);
        expect(isReleasedDate("Coming Soon - Q4 2026")).toBe(false);
        expect(isReleasedDate("Coming Soon (Target: November 2026)")).toBe(false);
      });

      it("correctly flags empty, whitespace, and non-date placeholder strings as unreleased (false)", () => {
        expect(isReleasedDate(undefined)).toBe(false);
        expect(isReleasedDate("")).toBe(false);
        expect(isReleasedDate("   ")).toBe(false);
        expect(isReleasedDate("TBD")).toBe(false);
        expect(isReleasedDate("TBA")).toBe(false);
        expect(isReleasedDate("In Progress")).toBe(false);
        expect(isReleasedDate("Draft")).toBe(false);
        expect(isReleasedDate("Someday")).toBe(false);
        expect(isReleasedDate("Not a real date")).toBe(false);
      });

      it("correctly recognizes ISO 8601 dates as released (true)", () => {
        expect(isReleasedDate("2026-10-29")).toBe(true);
        expect(isReleasedDate("2026-10-29T12:00:00Z")).toBe(true);
        expect(isReleasedDate("2026-10-29T15:30:00.000+05:30")).toBe(true);
        expect(isReleasedDate("2026-01-01")).toBe(true);
      });

      it("correctly recognizes human-readable and month-name dates as released (true)", () => {
        expect(isReleasedDate("29 October 2026")).toBe(true);
        expect(isReleasedDate("Oct 29, 2026")).toBe(true);
        expect(isReleasedDate("October 2026")).toBe(true);
        expect(isReleasedDate("15 November 2026")).toBe(true);
        expect(isReleasedDate("March 2027")).toBe(true);
        expect(isReleasedDate("Q4 2026")).toBe(true);
      });
    });

    describe("State Machine Invariants via detectNewEpisodesFromCode", () => {
      it("Invariant 1: already released -> date modified must NOT re-release (0 false positives)", () => {
        const before = {
          "src/app/javascript/episodes.tsx": `
            export const JAVASCRIPT_EPISODES = [
              { id: "ep1", episodeNumber: 1, title: "Ep 1", date: "15 October 2026" }
            ];
          `,
        };
        const after = {
          "src/app/javascript/episodes.tsx": `
            export const JAVASCRIPT_EPISODES = [
              { id: "ep1", episodeNumber: 1, title: "Ep 1", date: "20 October 2026" }
            ];
          `,
        };

        const releases = detectNewEpisodesFromCode(before, after, "commit-sha-1");
        expect(releases).toHaveLength(0);
      });

      it("Invariant 2: already released -> title / description / metadata modified must NOT re-release", () => {
        const before = {
          "src/app/javascript/episodes.tsx": `
            export const JAVASCRIPT_EPISODES = [
              { id: "ep1", episodeNumber: 1, title: "Original Title", description: "Original", date: "15 October 2026" }
            ];
          `,
        };
        const after = {
          "src/app/javascript/episodes.tsx": `
            export const JAVASCRIPT_EPISODES = [
              { id: "ep1", episodeNumber: 1, title: "Updated Better Title", description: "Expanded description", date: "15 October 2026" }
            ];
          `,
        };

        const releases = detectNewEpisodesFromCode(before, after, "commit-sha-2");
        expect(releases).toHaveLength(0);
      });

      it("Invariant 3: Coming Soon -> released date MUST trigger a release event", () => {
        const before = {
          "src/app/javascript/episodes.tsx": `
            export const JAVASCRIPT_EPISODES = [
              { id: "ep2", episodeNumber: 2, title: "Closures", date: "Coming Soon" }
            ];
          `,
        };
        const after = {
          "src/app/javascript/episodes.tsx": `
            export const JAVASCRIPT_EPISODES = [
              { id: "ep2", episodeNumber: 2, title: "Closures", date: "28 October 2026", href: "/javascript/closures" }
            ];
          `,
        };

        const releases = detectNewEpisodesFromCode(before, after, "commit-sha-3");
        expect(releases).toHaveLength(1);
        expect(releases[0].episodeId).toBe("ep2");
        expect(releases[0].subject).toBe(SubjectChannel.JAVASCRIPT);
        expect(releases[0].title).toBe("Closures");
        expect(releases[0].ctaUrl).toBe("https://system-design-visualizer.com/javascript/closures");
      });

      it("Invariant 4: unreleased -> unreleased variation must NOT trigger release", () => {
        const before = {
          "src/app/javascript/episodes.tsx": `
            export const JAVASCRIPT_EPISODES = [
              { id: "ep3", episodeNumber: 3, title: "Async", date: "Coming Soon" }
            ];
          `,
        };
        const after = {
          "src/app/javascript/episodes.tsx": `
            export const JAVASCRIPT_EPISODES = [
              { id: "ep3", episodeNumber: 3, title: "Async", date: "Coming soon..." }
            ];
          `,
        };

        const releases = detectNewEpisodesFromCode(before, after, "commit-sha-4");
        expect(releases).toHaveLength(0);
      });

      it("Invariant 5: adding new unreleased placeholder must NOT trigger release", () => {
        const before = {
          "src/app/javascript/episodes.tsx": `
            export const JAVASCRIPT_EPISODES = [
              { id: "ep1", episodeNumber: 1, title: "Ep 1", date: "15 October 2026" }
            ];
          `,
        };
        const after = {
          "src/app/javascript/episodes.tsx": `
            export const JAVASCRIPT_EPISODES = [
              { id: "ep1", episodeNumber: 1, title: "Ep 1", date: "15 October 2026" },
              { id: "ep2-placeholder", episodeNumber: 2, title: "Ep 2", date: "Coming Soon" }
            ];
          `,
        };

        const releases = detectNewEpisodesFromCode(before, after, "commit-sha-5");
        expect(releases).toHaveLength(0);
      });

      it("Invariant 6: adding brand-new released episode MUST trigger release", () => {
        const before = {
          "src/app/javascript/episodes.tsx": `
            export const JAVASCRIPT_EPISODES = [
              { id: "ep1", episodeNumber: 1, title: "Ep 1", date: "15 October 2026" }
            ];
          `,
        };
        const after = {
          "src/app/javascript/episodes.tsx": `
            export const JAVASCRIPT_EPISODES = [
              { id: "ep1", episodeNumber: 1, title: "Ep 1", date: "15 October 2026" },
              { id: "ep2-new", episodeNumber: 2, title: "Ep 2 New", date: "29 October 2026" }
            ];
          `,
        };

        const releases = detectNewEpisodesFromCode(before, after, "commit-sha-6");
        expect(releases).toHaveLength(1);
        expect(releases[0].episodeId).toBe("ep2-new");
      });
    });
  });

  // ==========================================================================
  // Dimension 3: Array Mutation & Renumbering Chaos
  // ==========================================================================
  describe("Dimension 3: Array Mutation & Renumbering Chaos", () => {
    it("handles insertion at index 0 (prepend) without emitting false positives for shifted items", () => {
      const before = {
        "src/app/computer-networks/episodes.tsx": `
          export const COMPUTER_NETWORKS_EPISODES = [
            { id: "net-dns", episodeNumber: 1, title: "DNS", date: "2026-10-01" },
            { id: "net-tcp", episodeNumber: 2, title: "TCP", date: "2026-10-02" },
          ];
        `,
      };
      const after = {
        "src/app/computer-networks/episodes.tsx": `
          export const COMPUTER_NETWORKS_EPISODES = [
            { id: "net-osi", episodeNumber: 1, title: "OSI Model", date: "2026-10-25" },
            { id: "net-dns", episodeNumber: 2, title: "DNS", date: "2026-10-01" },
            { id: "net-tcp", episodeNumber: 3, title: "TCP", date: "2026-10-02" },
          ];
        `,
      };

      const releases = detectNewEpisodesFromCode(before, after, "commit-prepend");
      expect(releases).toHaveLength(1);
      expect(releases[0].episodeId).toBe("net-osi");
      expect(releases[0].episodeNumber).toBe(1);
    });

    it("handles insertion in the middle of array without false positives", () => {
      const before = {
        "src/app/computer-networks/episodes.tsx": `
          export const COMPUTER_NETWORKS_EPISODES = [
            { id: "net-dns", episodeNumber: 1, title: "DNS", date: "2026-10-01" },
            { id: "net-tls", episodeNumber: 2, title: "TLS", date: "Coming Soon" },
          ];
        `,
      };
      const after = {
        "src/app/computer-networks/episodes.tsx": `
          export const COMPUTER_NETWORKS_EPISODES = [
            { id: "net-dns", episodeNumber: 1, title: "DNS", date: "2026-10-01" },
            { id: "net-tcp", episodeNumber: 2, title: "TCP Handshake", date: "2026-10-20" },
            { id: "net-tls", episodeNumber: 3, title: "TLS", date: "Coming Soon" },
          ];
        `,
      };

      const releases = detectNewEpisodesFromCode(before, after, "commit-middle");
      expect(releases).toHaveLength(1);
      expect(releases[0].episodeId).toBe("net-tcp");
    });

    it("handles insertion at the end of array", () => {
      const before = {
        "src/app/computer-networks/episodes.tsx": `
          export const COMPUTER_NETWORKS_EPISODES = [
            { id: "net-dns", episodeNumber: 1, title: "DNS", date: "2026-10-01" },
          ];
        `,
      };
      const after = {
        "src/app/computer-networks/episodes.tsx": `
          export const COMPUTER_NETWORKS_EPISODES = [
            { id: "net-dns", episodeNumber: 1, title: "DNS", date: "2026-10-01" },
            { id: "net-tail", episodeNumber: 2, title: "Tail Episode", date: "2026-10-29" },
          ];
        `,
      };

      const releases = detectNewEpisodesFromCode(before, after, "commit-end");
      expect(releases).toHaveLength(1);
      expect(releases[0].episodeId).toBe("net-tail");
    });

    it("renumbers existing episodes without changing dates and produces 0 false releases", () => {
      // Direct reproduction of real-world git commit b4e3972
      const before = {
        "src/app/computer-networks/episodes.tsx": `
          export const COMPUTER_NETWORKS_EPISODES = [
            { id: "ep1", episodeNumber: 1, title: "Ep 1", date: "2026-10-01" },
            { id: "ep2", episodeNumber: 2, title: "Ep 2", date: "2026-10-02" },
            { id: "ep3", episodeNumber: 3, title: "Ep 3", date: "2026-10-03" },
            { id: "p4", episodeNumber: 4, title: "Placeholder 4", date: "Coming Soon" },
            { id: "p5", episodeNumber: 5, title: "Placeholder 5", date: "Coming Soon" },
          ];
        `,
      };
      const after = {
        "src/app/computer-networks/episodes.tsx": `
          export const COMPUTER_NETWORKS_EPISODES = [
            { id: "ep1", episodeNumber: 1, title: "Ep 1", date: "2026-10-01" },
            { id: "ep2", episodeNumber: 2, title: "Ep 2", date: "2026-10-02" },
            { id: "ep3", episodeNumber: 3, title: "Ep 3", date: "2026-10-03" },
            { id: "new-ep4", episodeNumber: 4, title: "Brand New Episode 4", date: "2026-10-29" },
            { id: "p4", episodeNumber: 5, title: "Placeholder 4 (Renumbered to 5)", date: "Coming Soon" },
            { id: "p5", episodeNumber: 6, title: "Placeholder 5 (Renumbered to 6)", date: "Coming Soon" },
          ];
        `,
      };

      const releases = detectNewEpisodesFromCode(before, after, "commit-b4e3972-sim");
      expect(releases).toHaveLength(1);
      expect(releases[0].episodeId).toBe("new-ep4");
      expect(releases[0].episodeNumber).toBe(4);
    });

    it("deleting episodes must produce 0 releases", () => {
      const before = {
        "src/app/operating-systems/episodes.tsx": `
          export const OPERATING_SYSTEMS_EPISODES = [
            { id: "os-1", episodeNumber: 1, title: "OS 1", date: "2026-10-01" },
            { id: "os-2", episodeNumber: 2, title: "OS 2", date: "2026-10-02" },
            { id: "os-3", episodeNumber: 3, title: "OS 3", date: "2026-10-03" },
          ];
        `,
      };
      // Delete os-2
      const after = {
        "src/app/operating-systems/episodes.tsx": `
          export const OPERATING_SYSTEMS_EPISODES = [
            { id: "os-1", episodeNumber: 1, title: "OS 1", date: "2026-10-01" },
            { id: "os-3", episodeNumber: 2, title: "OS 3", date: "2026-10-03" },
          ];
        `,
      };

      const releases = detectNewEpisodesFromCode(before, after, "commit-delete");
      expect(releases).toHaveLength(0);
    });

    it("swapping array order of existing episodes must produce 0 releases", () => {
      const before = {
        "src/app/frontend/episodes.tsx": `
          export const FRONTEND_EPISODES = [
            { id: "fe-dom", episodeNumber: 1, title: "DOM", date: "2026-10-01" },
            { id: "fe-fiber", episodeNumber: 2, title: "Fiber", date: "2026-10-02" },
            { id: "fe-ssr", episodeNumber: 3, title: "SSR", date: "Coming Soon" },
          ];
        `,
      };
      // Swap order: fe-fiber, fe-ssr, fe-dom
      const after = {
        "src/app/frontend/episodes.tsx": `
          export const FRONTEND_EPISODES = [
            { id: "fe-fiber", episodeNumber: 1, title: "Fiber", date: "2026-10-02" },
            { id: "fe-ssr", episodeNumber: 2, title: "SSR", date: "Coming Soon" },
            { id: "fe-dom", episodeNumber: 3, title: "DOM", date: "2026-10-01" },
          ];
        `,
      };

      const releases = detectNewEpisodesFromCode(before, after, "commit-swap");
      expect(releases).toHaveLength(0);
    });
  });

  // ==========================================================================
  // Dimension 4: Git Tree Diffs & Multi-Subject Batching
  // ==========================================================================
  describe("Dimension 4: Git Tree Diffs & Multi-Subject Batching", () => {
    it("detects newly released episodes across all 6 subjects in a single commit batch", () => {
      const beforeFiles: Record<string, string | null> = {
        "src/app/javascript/episodes.tsx": `
          export const JAVASCRIPT_EPISODES = [
            { id: "js-ep1", episodeNumber: 1, title: "JS Ep 1", date: "2026-10-01" },
          ];
        `,
        "src/app/operating-systems/episodes.tsx": `
          export const OPERATING_SYSTEMS_EPISODES = [
            { id: "os-ep1", episodeNumber: 1, title: "OS Ep 1", date: "Coming Soon" },
          ];
        `,
        "src/app/java/episodes.tsx": `
          export const JAVA_EPISODES = [
            { id: "java-ep1", episodeNumber: 1, title: "Java Ep 1", date: "2026-10-01" },
          ];
        `,
        "src/app/computer-networks/episodes.tsx": `
          export const COMPUTER_NETWORKS_EPISODES = [
            { id: "net-ep1", episodeNumber: 1, title: "Net Ep 1", date: "Coming Soon" },
          ];
        `,
        "src/app/backend/episodes.tsx": `
          export const BACKEND_EPISODES = [
            { id: "backend-ep1", episodeNumber: 1, title: "Backend Ep 1", date: "2026-10-01" },
          ];
        `,
        "src/app/frontend/episodes.tsx": `
          export const FRONTEND_EPISODES = [
            { id: "fe-ep1", episodeNumber: 1, title: "FE Ep 1", date: "2026-10-01" },
          ];
        `,
      };

      const afterFiles: Record<string, string | null> = {
        "src/app/javascript/episodes.tsx": `
          export const JAVASCRIPT_EPISODES = [
            { id: "js-ep1", episodeNumber: 1, title: "JS Ep 1", date: "2026-10-01" },
            { id: "js-async", episodeNumber: 2, title: "Async Await", date: "2026-10-29", href: "/javascript/async" },
          ];
        `,
        "src/app/operating-systems/episodes.tsx": `
          export const OPERATING_SYSTEMS_EPISODES = [
            { id: "os-ep1", episodeNumber: 1, title: "OS Ep 1 (Released)", date: "2026-10-29", href: "/os/ep1" },
          ];
        `,
        "src/app/java/episodes.tsx": `
          export const JAVA_EPISODES = [
            { id: "java-ep1", episodeNumber: 1, title: "Java Ep 1", date: "2026-10-01" },
            { id: "java-vthreads", episodeNumber: 2, title: "Virtual Threads", date: "2026-10-29", href: "/java/vthreads" },
          ];
        `,
        "src/app/computer-networks/episodes.tsx": `
          export const COMPUTER_NETWORKS_EPISODES = [
            { id: "net-ep1", episodeNumber: 1, title: "Net Ep 1 (Released)", date: "2026-10-29", href: "/net/ep1" },
          ];
        `,
        "src/app/backend/episodes.tsx": `
          export const BACKEND_EPISODES = [
            { id: "backend-ep1", episodeNumber: 1, title: "Backend Ep 1", date: "2026-10-01" },
            { id: "backend-raft", episodeNumber: 2, title: "Raft Consensus", date: "2026-10-29", href: "/backend/raft" },
          ];
        `,
        "src/app/frontend/episodes.tsx": `
          export const FRONTEND_EPISODES = [
            { id: "fe-ep1", episodeNumber: 1, title: "FE Ep 1", date: "2026-10-01" },
            { id: "fe-virtual", episodeNumber: 2, title: "Virtualized List", date: "2026-10-29", href: "/frontend/virtual" },
          ];
        `,
      };

      const releases = detectNewEpisodesFromCode(beforeFiles, afterFiles, "multi-subject-commit");
      expect(releases).toHaveLength(6);

      const detectedSubjects = releases.map((r) => r.subject);
      expect(detectedSubjects).toContain(SubjectChannel.JAVASCRIPT);
      expect(detectedSubjects).toContain(SubjectChannel.OPERATING_SYSTEMS);
      expect(detectedSubjects).toContain(SubjectChannel.JAVA);
      expect(detectedSubjects).toContain(SubjectChannel.COMPUTER_NETWORKS);
      expect(detectedSubjects).toContain(SubjectChannel.BACKEND);
      expect(detectedSubjects).toContain(SubjectChannel.FRONTEND);
    });

    it("verifies 100% enum compatibility with canonical Prisma SubjectChannel", () => {
      // 1. Check SUBJECT_FILE_MAP values against Prisma enum
      for (const [filePath, channel] of Object.entries(SUBJECT_FILE_MAP)) {
        expect(Object.values(PrismaSubjectChannel)).toContain(channel);
        expect(normalizeSubjectChannel(channel)).toBe(channel);
        expect(filePath.startsWith("src/app/")).toBe(true);
      }

      // 2. Check SUBJECT_SLUG_MAP aliases all map to valid Prisma SubjectChannel enums
      for (const [slug, channel] of Object.entries(SUBJECT_SLUG_MAP)) {
        expect(Object.values(PrismaSubjectChannel)).toContain(channel);
        // The resolved channel must normalize cleanly in worker types
        expect(normalizeSubjectChannel(channel)).toBe(channel);
        expect(typeof slug).toBe("string");
      }
    });

    it("handles empty Git tree fallback (4b825dc642cb6eb9a060e54bf8d69288fbee4904) correctly", () => {
      const EMPTY_TREE_SHA = "4b825dc642cb6eb9a060e54bf8d69288fbee4904";
      const HEAD_SHA = "head-commit-sha-12345";

      // Mock gitRunner simulating git show
      const mockGitRunner = vi.fn((args: string[]) => {
        const fullCmd = args.join(" ");
        // At the empty tree commit, all files do not exist
        if (fullCmd.includes(EMPTY_TREE_SHA)) {
          throw new Error("fatal: path does not exist in empty tree");
        }
        if (fullCmd.includes(`${HEAD_SHA}:src/app/javascript/episodes.tsx`)) {
          return `
            export const JAVASCRIPT_EPISODES = [
              { id: "js-initial-1", episodeNumber: 1, title: "Initial Ep 1", date: "2026-10-01" },
              { id: "js-placeholder", episodeNumber: 2, title: "Coming Soon Ep", date: "Coming Soon" },
            ];
          `;
        }
        if (fullCmd.includes(`${HEAD_SHA}:src/app/operating-systems/episodes.tsx`)) {
          return `
            export const OPERATING_SYSTEMS_EPISODES = [
              { id: "os-initial-1", episodeNumber: 1, title: "Initial OS 1", date: "2026-10-02" },
            ];
          `;
        }
        return "";
      });

      const releases = detectNewEpisodes(EMPTY_TREE_SHA, HEAD_SHA, {
        gitRunner: mockGitRunner,
      });

      // From an empty tree, all released episodes are detected, while Coming Soon episodes remain suppressed
      expect(releases).toHaveLength(2);
      expect(releases.map((r) => r.episodeId)).toEqual(["js-initial-1", "os-initial-1"]);
      expect(releases.some((r) => r.episodeId === "js-placeholder")).toBe(false);
    });

    it("verifies CLI main fallback to empty tree SHA when rev-parse HEAD~1 fails", async () => {
      // Test that main() doesn't crash when running on a commit with no parent
      const originalEnv = { ...process.env };
      const consoleLogSpy = vi.spyOn(console, "log").mockImplementation(() => {});

      try {
        process.env.DRY_RUN = "true";
        process.env.HEAD_SHA = "orphan-initial-commit";
        delete process.env.BASE_SHA;
        delete process.env.GITHUB_BASE_REF;

        const exitCode = await main(["node", "scripts/detect-new-episodes.ts", "--dry-run", "--commit", "test-orphan"]);
        expect(exitCode).toBe(0);
      } finally {
        process.env = originalEnv;
        consoleLogSpy.mockRestore();
      }
    });
  });
});
