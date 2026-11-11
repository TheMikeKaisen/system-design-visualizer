import { describe, it, expect } from "vitest";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { SubjectChannel } from "@prisma/client";
import {
  EpisodeReleaseEmail,
  SUBJECT_PALETTES,
  getSubjectPalette,
} from "@/emails/EpisodeReleaseEmail";
import { DoubleOptInEmail } from "@/emails/DoubleOptInEmail";
import { getEmailHeaders } from "@/emails/headers";
import { DISCIPLINES } from "@/components/ui/DisciplineCard";

describe("Challenger M3-1: Empirical Stress Harness for Email Templates & Accents", () => {
  // ───────────────────────────────────────────────────────────────────────────
  // Dimension 1: SubjectChannel Enum & Accent Token Alignment
  // ───────────────────────────────────────────────────────────────────────────
  describe("Dimension 1: SubjectChannel Enum & Canonical Accent Tokens", () => {
    const channelPaletteMap: Record<
      SubjectChannel,
      { accentColor: string; title: string; contrastTextColor: string }
    > = {
      [SubjectChannel.JAVASCRIPT]: {
        accentColor: "#f59e0b",
        title: "JavaScript",
        contrastTextColor: "#09090b",
      },
      [SubjectChannel.OPERATING_SYSTEMS]: {
        accentColor: "#0ea5e9",
        title: "Operating Systems",
        contrastTextColor: "#09090b",
      },
      [SubjectChannel.JAVA]: {
        accentColor: "#10b981",
        title: "Java & JVM Architecture",
        contrastTextColor: "#09090b",
      },
      [SubjectChannel.FRONTEND]: {
        accentColor: "#8b5cf6",
        title: "Frontend Architecture",
        contrastTextColor: "#ffffff",
      },
      [SubjectChannel.BACKEND]: {
        accentColor: "#3b82f6",
        title: "Backend Internals",
        contrastTextColor: "#ffffff",
      },
      [SubjectChannel.COMPUTER_NETWORKS]: {
        accentColor: "#14b8a6",
        title: "Computer Networks",
        contrastTextColor: "#09090b",
      },
      [SubjectChannel.ALL]: {
        accentColor: "#f59e0b",
        title: "All Disciplines",
        contrastTextColor: "#09090b",
      },
    };

    it.each(Object.values(SubjectChannel))(
      "renders EpisodeReleaseEmail with matching accent token for %s",
      (channel) => {
        const expected = channelPaletteMap[channel];
        const palette = getSubjectPalette(channel);

        expect(palette.accentColor.toLowerCase()).toBe(expected.accentColor.toLowerCase());
        expect(palette.contrastTextColor.toLowerCase()).toBe(expected.contrastTextColor.toLowerCase());
        expect(palette.title).toBe(expected.title);

        const html = renderToStaticMarkup(
          React.createElement(EpisodeReleaseEmail, {
            recipientEmail: "test@domain.com",
            unsubscribeToken: "token_test_123",
            subject: channel,
            title: `Release for ${channel}`,
            summary: `Summary for ${channel}`,
            ctaUrl: `https://systemsimulator.io/episodes/${channel.toLowerCase()}`,
          })
        );

        // Verify accent color appears in CTA button and badge styling
        expect(html).toContain(expected.accentColor);
        // Verify channel or title appears in the markup (HTML-escaped)
        const escapedTitle = palette.title.replace(/&/g, "&amp;");
        expect(html).toContain(escapedTitle);
      }
    );

    it("verifies exact hex alignment between SUBJECT_PALETTES and DisciplineCard DISCIPLINES", () => {
      // Cross-check all canonical disciplines in DisciplineCard.tsx
      for (const disc of DISCIPLINES) {
        const palette = SUBJECT_PALETTES[disc.id];
        expect(palette).toBeDefined();
        expect(palette.accentColor.toLowerCase()).toBe(disc.accentColor.toLowerCase());
      }
    });

    it("handles case-insensitive and hyphenated subject format variations", () => {
      const variations = [
        { input: "operating_systems", expected: "Operating Systems" },
        { input: "OPERATING_SYSTEMS", expected: "Operating Systems" },
        { input: "operating-systems", expected: "Operating Systems" },
        { input: "Operating_Systems", expected: "Operating Systems" },
        { input: "computer_networks", expected: "Computer Networks" },
        { input: "COMPUTER_NETWORKS", expected: "Computer Networks" },
        { input: "computer-networks", expected: "Computer Networks" },
        { input: "java", expected: "Java & JVM Architecture" },
        { input: "JAVA", expected: "Java & JVM Architecture" },
        { input: "frontend", expected: "Frontend Architecture" },
        { input: "FRONTEND", expected: "Frontend Architecture" },
        { input: "backend", expected: "Backend Internals" },
        { input: "BACKEND", expected: "Backend Internals" },
        { input: "javascript", expected: "JavaScript" },
        { input: "JAVASCRIPT", expected: "JavaScript" },
        { input: "all", expected: "All Disciplines" },
        { input: "ALL", expected: "All Disciplines" },
      ];

      for (const { input, expected } of variations) {
        const palette = getSubjectPalette(input);
        expect(palette.title).toBe(expected);
      }
    });

    it("gracefully falls back to ALL palette for null, undefined, empty string, or unknown subjects", () => {
      const fallbackCases = [undefined, "", "unknown_topic", "quantum-computing", "___"];
      for (const sub of fallbackCases) {
        const palette = getSubjectPalette(sub);
        expect(palette.channel).toBe("ALL");
        expect(palette.accentColor).toBe("#f59e0b");
      }
    });
  });

  // ───────────────────────────────────────────────────────────────────────────
  // Dimension 2: Edge Cases & Hostile Inputs in EpisodeReleaseEmail
  // ───────────────────────────────────────────────────────────────────────────
  describe("Dimension 2: Edge Cases & Hostile Inputs (EpisodeReleaseEmail)", () => {
    it("safely handles empty and omitted keyConcepts without rendering orphaned concepts container", () => {
      // 1. Explicit empty array
      const htmlEmpty = renderToStaticMarkup(
        React.createElement(EpisodeReleaseEmail, {
          title: "Title",
          summary: "Summary",
          ctaUrl: "https://systemsimulator.io",
          keyConcepts: [],
        })
      );
      expect(htmlEmpty).not.toContain("Key Concepts In This Simulation");

      // 2. Omitted keyConcepts
      const htmlOmitted = renderToStaticMarkup(
        React.createElement(EpisodeReleaseEmail, {
          title: "Title",
          summary: "Summary",
          ctaUrl: "https://systemsimulator.io",
        })
      );
      expect(htmlOmitted).not.toContain("Key Concepts In This Simulation");
    });

    it("handles extreme string lengths without crashing or overflowing call stack", () => {
      const hugeTitle = "A".repeat(5000);
      const hugeSummary = "B".repeat(20000);
      const manyConcepts = Array.from({ length: 100 }, (_, i) => `Concept_${i}_${"x".repeat(30)}`);

      const html = renderToStaticMarkup(
        React.createElement(EpisodeReleaseEmail, {
          title: hugeTitle,
          summary: hugeSummary,
          keyConcepts: manyConcepts,
          ctaUrl: "https://systemsimulator.io/episodes/extreme",
        })
      );

      expect(html).toContain(hugeTitle);
      expect(html).toContain(hugeSummary);
      expect(html).toContain("Concept_99_");
    });

    it("renders unicode, international characters, and emojis properly", () => {
      const unicodeTitle = "CPU スケジューラ & المجدول • 🚀⚡ (λ-calculus / O(n²))";
      const unicodeSummary = "Simulating π ≈ 3.14159, é/à/ç accents, and German straße & umlauts (ä, ö, ü).";
      const unicodeConcepts = ["🚀 Microtasks", "Schäfer Mutex", "日本語スレッド", "مزامنة"];

      const html = renderToStaticMarkup(
        React.createElement(EpisodeReleaseEmail, {
          title: unicodeTitle,
          summary: unicodeSummary,
          keyConcepts: unicodeConcepts,
          ctaUrl: "https://systemsimulator.io/episodes/unicode",
        })
      );

      // React escapes & to &amp;
      expect(html).toContain("CPU スケジューラ &amp; المجدول • 🚀⚡ (λ-calculus / O(n²))");
      expect(html).toContain("Simulating π ≈ 3.14159, é/à/ç accents, and German straße &amp; umlauts (ä, ö, ü).");
      expect(html).toContain("🚀 Microtasks");
      expect(html).toContain("日本語スレッド");
      expect(html).toContain("مزامنة");
    });

    it("neutralizes XSS injection payloads via React JSX escaping", () => {
      const xssTitle = '<script>alert("XSS_TITLE")</script>';
      const xssSummary = '"><img src=x onerror=alert("XSS_SUMMARY")>';
      const xssConcepts = ['<svg onload=alert("XSS_CONCEPT")>', '"><b onmouseover=alert(1)>Hover</b>'];

      const html = renderToStaticMarkup(
        React.createElement(EpisodeReleaseEmail, {
          title: xssTitle,
          summary: xssSummary,
          keyConcepts: xssConcepts,
          ctaUrl: "https://systemsimulator.io/episodes/xss",
        })
      );

      // Verify no executable raw tags exist
      expect(html).not.toContain("<script>");
      expect(html).not.toContain("<img src=x");
      expect(html).not.toContain("<svg onload=");
      // Verify escaped entities are present
      expect(html).toContain("&lt;script&gt;alert(&quot;XSS_TITLE&quot;)&lt;/script&gt;");
      expect(html).toContain("&quot;&gt;&lt;img src=x onerror=alert(&quot;XSS_SUMMARY&quot;)&gt;");
      expect(html).toContain("&lt;svg onload=alert(&quot;XSS_CONCEPT&quot;)&gt;");
    });

    it("renders episode badges with correct formatting for various episode numbers", () => {
      // Single digit episode
      const htmlSingle = renderToStaticMarkup(
        React.createElement(EpisodeReleaseEmail, {
          subject: "JAVASCRIPT",
          episodeNumber: 1,
          title: "Title",
          summary: "Summary",
          ctaUrl: "https://systemsimulator.io",
        })
      );
      expect(htmlSingle).toContain("JAVASCRIPT • EPISODE 01");

      // Double digit episode
      const htmlDouble = renderToStaticMarkup(
        React.createElement(EpisodeReleaseEmail, {
          subject: "OPERATING_SYSTEMS",
          episodeNumber: 14,
          title: "Title",
          summary: "Summary",
          ctaUrl: "https://systemsimulator.io",
        })
      );
      expect(htmlDouble).toContain("OPERATING SYSTEMS • EPISODE 14");

      // Omitted episode number
      const htmlNone = renderToStaticMarkup(
        React.createElement(EpisodeReleaseEmail, {
          subject: "JAVA",
          title: "Title",
          summary: "Summary",
          ctaUrl: "https://systemsimulator.io",
        })
      );
      expect(htmlNone).toContain("JAVA &amp; JVM ARCHITECTURE");
      expect(htmlNone).not.toContain("EPISODE");
    });
  });

  // ───────────────────────────────────────────────────────────────────────────
  // Dimension 3: Mobile Touch Ergonomics (Rule #7 Compliance)
  // ───────────────────────────────────────────────────────────────────────────
  describe("Dimension 3: Rule #7 Mobile Touch Ergonomics (min-height >= 44px)", () => {
    it("enforces >= 44px min-height touch target on EpisodeReleaseEmail CTA button", () => {
      const html = renderToStaticMarkup(
        React.createElement(EpisodeReleaseEmail, {
          title: "Touch Target Test",
          summary: "Summary",
          ctaUrl: "https://systemsimulator.io/interactive",
        })
      );

      // Verify explicit min-height:44px or minHeight: 44 inline styles
      expect(html).toMatch(/min-height:\s*44px/);
      expect(html).toMatch(/line-height:\s*44px/);
      // Verify CTA button anchor text
      expect(html).toContain("Launch Interactive Simulator →");
    });

    it("enforces >= 44px min-height touch target on DoubleOptInEmail CTA button", () => {
      const html = renderToStaticMarkup(
        React.createElement(DoubleOptInEmail, {
          verificationToken: "token-touch-test",
        })
      );

      // Verify explicit min-height:44px or minHeight: 44 inline styles
      expect(html).toMatch(/min-height:\s*44px/);
      expect(html).toMatch(/line-height:\s*44px/);
      // Verify CTA button anchor text
      expect(html).toContain("Verify Subscription →");
    });
  });

  // ───────────────────────────────────────────────────────────────────────────
  // Dimension 4: DoubleOptInEmail Rendering & Edge Cases
  // ───────────────────────────────────────────────────────────────────────────
  describe("Dimension 4: DoubleOptInEmail Rendering & Edge Cases", () => {
    it("renders mandatory 24-hour expiration notice with prominent badge", () => {
      const html = renderToStaticMarkup(
        React.createElement(DoubleOptInEmail, {
          verificationToken: "tok-exp-check",
        })
      );

      expect(html).toContain("⏳");
      expect(html).toContain("This verification link expires in 24 hours.");
      expect(html).toContain("After expiration, a new subscription request must be submitted.");
      expect(html).toContain("background-color:#272010");
    });

    it("renders security disclaimer for unintended recipients", () => {
      const html = renderToStaticMarkup(
        React.createElement(DoubleOptInEmail, {
          verificationToken: "tok-sec-check",
        })
      );

      expect(html).toContain("🔒");
      expect(html).toContain("Security Note:");
      expect(html).toContain(
        "If you didn&#x27;t request this subscription, you can safely ignore this email."
      );
    });

    it("encodes verification tokens with special characters properly in URLs", () => {
      const tokenWithSpecials = "tok+v1/secret==?val=42&user=test#hash";
      const html = renderToStaticMarkup(
        React.createElement(DoubleOptInEmail, {
          verificationToken: tokenWithSpecials,
          appUrl: "https://systemsimulator.io",
        })
      );

      const encoded = encodeURIComponent(tokenWithSpecials);
      expect(html).toContain(`token=${encoded}`);
      // Fallback box should contain the encoded URL
      expect(html).toContain(`https://systemsimulator.io/api/notifications/verify?token=${encoded}`);
    });

    it("uses custom verifyUrl prop when explicitly provided", () => {
      const customUrl = "https://custom.auth.io/verify?custom_param=123";
      const html = renderToStaticMarkup(
        React.createElement(DoubleOptInEmail, {
          verificationToken: "tok",
          verifyUrl: customUrl,
        })
      );

      expect(html).toContain(`href="${customUrl}"`);
      expect(html).toContain(customUrl);
    });

    it("renders empty subjects as 'All Disciplines'", () => {
      const html = renderToStaticMarkup(
        React.createElement(DoubleOptInEmail, {
          verificationToken: "tok",
          subjects: [],
        })
      );

      expect(html).toContain("Requested Disciplines");
      expect(html).toContain("All Disciplines");
    });

    it("renders multiple requested disciplines correctly", () => {
      const html = renderToStaticMarkup(
        React.createElement(DoubleOptInEmail, {
          verificationToken: "tok",
          subjects: ["JAVASCRIPT", "OPERATING_SYSTEMS", "COMPUTER_NETWORKS", "BACKEND"],
        })
      );

      expect(html).toContain("JavaScript");
      expect(html).toContain("Operating Systems");
      expect(html).toContain("Computer Networks");
      expect(html).toContain("Backend Internals");
    });

    it("handles recipientEmail formatting and fallback", () => {
      // With recipient email
      const htmlWithEmail = renderToStaticMarkup(
        React.createElement(DoubleOptInEmail, {
          verificationToken: "tok",
          recipientEmail: "alice@systems.dev",
        })
      );
      expect(htmlWithEmail).toContain("<strong>alice@systems.dev</strong>");

      // Without recipient email (fallback)
      const htmlFallback = renderToStaticMarkup(
        React.createElement(DoubleOptInEmail, {
          verificationToken: "tok",
        })
      );
      expect(htmlFallback).toContain("your email");
    });
  });

  // ───────────────────────────────────────────────────────────────────────────
  // Dimension 5: RFC 8058 Header Generation Variations
  // ───────────────────────────────────────────────────────────────────────────
  describe("Dimension 5: RFC 8058 Header Generation Variations (getEmailHeaders)", () => {
    it("handles trailing slashes on appUrl robustly", () => {
      const variations = [
        "https://systemsimulator.io/",
        "https://systemsimulator.io///",
        "https://systemsimulator.io/path/",
      ];

      for (const url of variations) {
        const headers = getEmailHeaders({
          unsubscribeToken: "token_123",
          appUrl: url,
        });
        const expectedBase = url.replace(/\/+$/, "");
        expect(headers["List-Unsubscribe"]).toContain(`${expectedBase}/api/notifications/unsubscribe`);
        expect(headers["List-Unsubscribe"]).not.toMatch(/\/\/\/api/);
      }
    });

    it("percent-encodes adversarial characters in unsubscribeToken to preserve angle brackets", () => {
      const adversarialTokens = [
        "tok>with>brackets<inside",
        "tok with spaces",
        'tok"with"quotes',
        "tok&param=injected",
        "tok#fragment",
      ];

      for (const tok of adversarialTokens) {
        const headers = getEmailHeaders({
          unsubscribeToken: tok,
          appUrl: "https://systemsimulator.io",
        });

        // The outer header MUST start with '<' and end with '>' exactly
        expect(headers["List-Unsubscribe"]).toMatch(/^<https:\/\/.*>$/);
        // The inside must NOT contain unencoded '<' or '>'
        const inside = headers["List-Unsubscribe"].slice(1, -1);
        expect(inside).not.toContain("<");
        expect(inside).not.toContain(">");
        expect(inside).toContain(`token=${encodeURIComponent(tok)}`);
      }
    });

    it("handles various subject formats and special characters in topic query param", () => {
      // 1. ALL topic
      const headersAll = getEmailHeaders({
        unsubscribeToken: "tok",
        subject: "ALL",
        appUrl: "https://systemsimulator.io",
      });
      expect(headersAll["List-Unsubscribe"]).toContain("&topic=ALL");

      // 2. Complex subject with space/symbols
      const headersComplex = getEmailHeaders({
        unsubscribeToken: "tok",
        subject: "OS & Kernel / Low-Level",
        appUrl: "https://systemsimulator.io",
      });
      expect(headersComplex["List-Unsubscribe"]).toContain(
        `&topic=${encodeURIComponent("OS & Kernel / Low-Level")}`
      );

      // 3. Empty string subject (should NOT append empty &topic=)
      const headersEmptySub = getEmailHeaders({
        unsubscribeToken: "tok",
        subject: "",
        appUrl: "https://systemsimulator.io",
      });
      expect(headersEmptySub["List-Unsubscribe"]).not.toContain("&topic=");
    });

    it("verifies exact RFC 8058 List-Unsubscribe-Post header constant", () => {
      const headers = getEmailHeaders({
        unsubscribeToken: "token_abc",
        appUrl: "https://systemsimulator.io",
      });
      expect(headers["List-Unsubscribe-Post"]).toBe("List-Unsubscribe=One-Click");
    });

    it("prevents CRLF header injection attacks via token or subject", () => {
      const crlfToken = "tok\r\nInjected-Header: evil\r\n\r\n<malicious>";
      const crlfSubject = "ALL\r\nCc: victim@evil.com\r\n";

      const headers = getEmailHeaders({
        unsubscribeToken: crlfToken,
        subject: crlfSubject,
        appUrl: "https://systemsimulator.io",
      });

      // Headers must never contain raw \r or \n
      expect(headers["List-Unsubscribe"]).not.toContain("\r");
      expect(headers["List-Unsubscribe"]).not.toContain("\n");
      // Must be safely percent-encoded
      expect(headers["List-Unsubscribe"]).toContain("%0D%0A");
    });
  });

  // ───────────────────────────────────────────────────────────────────────────
  // Dimension 6: Missing Tokens & Malformed Fields Handling
  // ───────────────────────────────────────────────────────────────────────────
  describe("Dimension 6: Missing Tokens & Malformed Fields Handling", () => {
    it("handles missing unsubscribeToken in EpisodeReleaseEmail with safe '#' fallbacks", () => {
      const html = renderToStaticMarkup(
        React.createElement(EpisodeReleaseEmail, {
          title: "Title",
          summary: "Summary",
          ctaUrl: "https://systemsimulator.io",
          // unsubscribeToken is omitted
        })
      );

      // Topic & ALL unsubscribe links should fall back to "#"
      expect(html).toContain('href="#"');
      // Preferences link should not append undefined token query
      expect(html).toContain('href="https://systemsimulator.io/unsubscribe"');
      expect(html).not.toContain("token=undefined");
      expect(html).not.toContain("token=null");
    });

    it("escapes malicious recipientEmail strings in EpisodeReleaseEmail and DoubleOptInEmail", () => {
      const maliciousEmail = '<script>alert("hacked")</script>@evil.com';

      // 1. EpisodeReleaseEmail
      const htmlRelease = renderToStaticMarkup(
        React.createElement(EpisodeReleaseEmail, {
          recipientEmail: maliciousEmail,
          title: "Title",
          summary: "Summary",
          ctaUrl: "https://systemsimulator.io",
        })
      );
      expect(htmlRelease).not.toContain("<script>alert(");
      expect(htmlRelease).toContain("&lt;script&gt;alert(&quot;hacked&quot;)&lt;/script&gt;@evil.com");

      // 2. DoubleOptInEmail
      const htmlOptIn = renderToStaticMarkup(
        React.createElement(DoubleOptInEmail, {
          recipientEmail: maliciousEmail,
          verificationToken: "tok",
        })
      );
      expect(htmlOptIn).not.toContain("<script>alert(");
      expect(htmlOptIn).toContain("&lt;script&gt;alert(&quot;hacked&quot;)&lt;/script&gt;@evil.com");
    });

    it("sanitizes trailing slashes on appUrl inside templates", () => {
      const dirtyUrl = "https://systemsimulator.io///";

      // EpisodeReleaseEmail
      const htmlRelease = renderToStaticMarkup(
        React.createElement(EpisodeReleaseEmail, {
          title: "Title",
          summary: "Summary",
          ctaUrl: "https://systemsimulator.io/c",
          unsubscribeToken: "tok",
          appUrl: dirtyUrl,
        })
      );
      expect(htmlRelease).not.toContain("systemsimulator.io///api");
      expect(htmlRelease).toContain("https://systemsimulator.io/api/notifications/unsubscribe");

      // DoubleOptInEmail
      const htmlOptIn = renderToStaticMarkup(
        React.createElement(DoubleOptInEmail, {
          verificationToken: "tok",
          appUrl: dirtyUrl,
        })
      );
      expect(htmlOptIn).not.toContain("systemsimulator.io///api");
      expect(htmlOptIn).toContain("https://systemsimulator.io/api/notifications/verify");
    });
  });
});
