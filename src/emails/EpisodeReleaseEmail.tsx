import React from "react";

export interface SubjectPalette {
  channel: string;
  title: string;
  accentColor: string;
  accentBg: string;
  accentBorder: string;
  contrastTextColor: string;
}

export const SUBJECT_PALETTES: Record<string, SubjectPalette> = {
  javascript: {
    channel: "JAVASCRIPT",
    title: "JavaScript",
    accentColor: "#f59e0b",
    accentBg: "#2e2305",
    accentBorder: "#78350f",
    contrastTextColor: "#09090b",
  },
  "operating-systems": {
    channel: "OPERATING_SYSTEMS",
    title: "Operating Systems",
    accentColor: "#0ea5e9",
    accentBg: "#082f49",
    accentBorder: "#0369a1",
    contrastTextColor: "#09090b",
  },
  java: {
    channel: "JAVA",
    title: "Java & JVM Architecture",
    accentColor: "#10b981",
    accentBg: "#064e3b",
    accentBorder: "#047857",
    contrastTextColor: "#09090b",
  },
  frontend: {
    channel: "FRONTEND",
    title: "Frontend Architecture",
    accentColor: "#8b5cf6",
    accentBg: "#2e1065",
    accentBorder: "#6d28d9",
    contrastTextColor: "#ffffff",
  },
  backend: {
    channel: "BACKEND",
    title: "Backend Internals",
    accentColor: "#3b82f6",
    accentBg: "#172554",
    accentBorder: "#1d4ed8",
    contrastTextColor: "#ffffff",
  },
  "computer-networks": {
    channel: "COMPUTER_NETWORKS",
    title: "Computer Networks",
    accentColor: "#14b8a6",
    accentBg: "#134e4a",
    accentBorder: "#0f766e",
    contrastTextColor: "#09090b",
  },
  all: {
    channel: "ALL",
    title: "All Disciplines",
    accentColor: "#f59e0b",
    accentBg: "#2e2305",
    accentBorder: "#78350f",
    contrastTextColor: "#09090b",
  },
};

export function getSubjectPalette(subject?: string): SubjectPalette {
  if (!subject) return SUBJECT_PALETTES.all;
  const normalized = subject.toLowerCase().replace(/_/g, "-");
  return SUBJECT_PALETTES[normalized] ?? SUBJECT_PALETTES.all;
}

export interface EpisodeReleaseEmailProps {
  recipientEmail?: string;
  subscriberId?: string;
  unsubscribeToken?: string;
  subject?: string;
  episodeId?: string;
  episodeNumber?: number;
  title: string;
  summary: string;
  keyConcepts?: string[];
  ctaUrl: string;
  appUrl?: string;
}

/**
 * System Simulator canonical brand mark for email environments:
 * Adapted from `src/components/ui/Logo.tsx` with explicit inline hex colors
 * and high-contrast text fallback for email clients that strip SVGs.
 */
function EmailBrandHeader() {
  return (
    <table
      cellPadding="0"
      cellSpacing="0"
      border={0}
      style={{ width: "100%", marginBottom: "28px" }}
    >
      <tbody>
        <tr>
          <td style={{ verticalAlign: "middle", width: "40px" }}>
            <svg
              width="32"
              height="32"
              viewBox="0 0 32 32"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              style={{ display: "block" }}
            >
              {/* Outer chassis */}
              <path
                d="M5 9.5V22.5L16 28.75L27 22.5V9.5"
                stroke="#71717a"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                opacity="0.6"
              />
              {/* Central execution spine */}
              <path
                d="M16 15.75V28.75"
                stroke="#71717a"
                strokeWidth="1.5"
                strokeLinecap="round"
                opacity="0.7"
              />
              {/* Intermediate runtime strata shelf */}
              <path
                d="M5 16L16 22.25L27 16"
                stroke="#a1a1aa"
                strokeWidth="1.25"
                strokeLinecap="round"
                strokeLinejoin="round"
                opacity="0.8"
              />
              {/* Top application facet */}
              <path
                d="M16 3.25L27 9.5L16 15.75L5 9.5Z"
                stroke="#f4f4f5"
                strokeWidth="1.75"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              {/* Active execution nucleus */}
              <polygon
                points="16,6.25 21,9.5 16,12.75 11,9.5"
                fill="#f59e0b"
              />
              <circle cx="16" cy="9.5" r="1.5" fill="#ffffff" />
            </svg>
          </td>
          <td style={{ verticalAlign: "middle", paddingLeft: "12px" }}>
            <div
              style={{
                fontFamily:
                  "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
                fontSize: "16px",
                fontWeight: 800,
                letterSpacing: "2px",
                color: "#ffffff",
                lineHeight: "1.2",
              }}
            >
              SYSTEM SIMULATOR
            </div>
            <div
              style={{
                fontFamily:
                  "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
                fontSize: "11px",
                fontWeight: 500,
                letterSpacing: "1px",
                color: "#71717a",
                textTransform: "uppercase",
                marginTop: "2px",
              }}
            >
              Interactive Architectural Visualizer
            </div>
          </td>
        </tr>
      </tbody>
    </table>
  );
}

export function EpisodeReleaseEmail({
  recipientEmail,
  unsubscribeToken,
  subject,
  episodeNumber,
  title,
  summary,
  keyConcepts = [],
  ctaUrl,
  appUrl,
}: EpisodeReleaseEmailProps) {
  const palette = getSubjectPalette(subject);
  const base = (
    appUrl ||
    process.env.NEXT_PUBLIC_APP_URL ||
    "https://systemsimulator.io"
  ).replace(/\/+$/, "");

  const safeToken = unsubscribeToken ? encodeURIComponent(unsubscribeToken) : "";
  const topicUnsubscribeUrl = safeToken
    ? `${base}/api/notifications/unsubscribe?token=${safeToken}&topic=${encodeURIComponent(
        palette.channel
      )}`
    : "#";
  const allUnsubscribeUrl = safeToken
    ? `${base}/api/notifications/unsubscribe?token=${safeToken}&topic=ALL`
    : "#";
  const preferencesUrl = safeToken
    ? `${base}/unsubscribe?token=${safeToken}`
    : `${base}/unsubscribe`;

  const episodeBadgeText = episodeNumber
    ? `${palette.title.toUpperCase()} • EPISODE ${String(episodeNumber).padStart(2, "0")}`
    : palette.title.toUpperCase();

  return (
    <div
      style={{
        backgroundColor: "#090a0d",
        margin: 0,
        padding: "32px 16px",
        fontFamily:
          "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
        color: "#f4f4f5",
      }}
    >
      {/* Inbox Preheader Preview Text */}
      <div
        style={{
          display: "none",
          maxHeight: 0,
          overflow: "hidden",
          fontSize: "1px",
          lineHeight: "1px",
          color: "#090a0d",
        }}
      >
        {`${palette.title} Release: ${title}. ${summary}`}
      </div>

      <table
        cellPadding="0"
        cellSpacing="0"
        border={0}
        align="center"
        style={{
          maxWidth: "600px",
          width: "100%",
          margin: "0 auto",
          backgroundColor: "#121316",
          borderRadius: "12px",
          border: "1px solid #27272a",
          overflow: "hidden",
        }}
      >
        <tbody>
          <tr>
            <td style={{ padding: "32px" }}>
              {/* Brand Header */}
              <EmailBrandHeader />

              {/* Eyebrow Badge */}
              <div style={{ marginBottom: "16px" }}>
                <span
                  style={{
                    display: "inline-block",
                    backgroundColor: palette.accentBg,
                    border: `1px solid ${palette.accentBorder}`,
                    color: palette.accentColor,
                    padding: "4px 12px",
                    borderRadius: "9999px",
                    fontSize: "11px",
                    fontWeight: 700,
                    letterSpacing: "0.5px",
                  }}
                >
                  {episodeBadgeText}
                </span>
              </div>

              {/* Title */}
              <h1
                style={{
                  fontSize: "24px",
                  fontWeight: 800,
                  color: "#ffffff",
                  lineHeight: "1.3",
                  margin: "0 0 14px 0",
                  letterSpacing: "-0.5px",
                }}
              >
                {title}
              </h1>

              {/* Synopsis / Summary */}
              <p
                style={{
                  fontSize: "15px",
                  color: "#a1a1aa",
                  lineHeight: "1.6",
                  margin: "0 0 24px 0",
                }}
              >
                {summary}
              </p>

              {/* Key Concepts Pills */}
              {keyConcepts && keyConcepts.length > 0 && (
                <div style={{ marginBottom: "28px" }}>
                  <div
                    style={{
                      fontSize: "11px",
                      fontWeight: 700,
                      color: "#71717a",
                      letterSpacing: "1px",
                      textTransform: "uppercase",
                      marginBottom: "10px",
                    }}
                  >
                    Key Concepts In This Simulation
                  </div>
                  <table cellPadding="0" cellSpacing="0" border={0}>
                    <tbody>
                      <tr>
                        <td style={{ paddingTop: "2px" }}>
                          {keyConcepts.map((concept, index) => (
                            <span
                              key={`${concept}-${index}`}
                              style={{
                                display: "inline-block",
                                backgroundColor: "#1c1d22",
                                border: "1px solid #2e3038",
                                color: "#d4d4d8",
                                padding: "4px 10px",
                                borderRadius: "9999px",
                                fontSize: "12px",
                                fontFamily: "monospace",
                                marginRight: "6px",
                                marginBottom: "6px",
                              }}
                            >
                              {concept}
                            </span>
                          ))}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              )}

              {/* Deep-link CTA Button (min-height 44px for touch ergonomics per Rule #7) */}
              <div style={{ marginBottom: "32px" }}>
                <table cellPadding="0" cellSpacing="0" border={0}>
                  <tbody>
                    <tr>
                      <td
                        align="center"
                        style={{
                          backgroundColor: palette.accentColor,
                          borderRadius: "8px",
                          minHeight: "44px",
                        }}
                      >
                        <a
                          href={ctaUrl}
                          style={{
                            display: "inline-block",
                            minHeight: "44px",
                            lineHeight: "44px",
                            padding: "0 28px",
                            backgroundColor: palette.accentColor,
                            color: palette.contrastTextColor,
                            borderRadius: "8px",
                            textDecoration: "none",
                            fontWeight: 700,
                            fontSize: "15px",
                            letterSpacing: "0.2px",
                            boxSizing: "border-box",
                          }}
                        >
                          Launch Interactive Simulator →
                        </a>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Divider */}
              <div
                style={{
                  height: "1px",
                  backgroundColor: "#27272a",
                  margin: "24px 0",
                }}
              />

              {/* RFC 8058 Footer & Unsubscription Links */}
              <div
                style={{
                  fontSize: "12px",
                  color: "#71717a",
                  lineHeight: "1.6",
                }}
              >
                <p style={{ margin: "0 0 8px 0" }}>
                  Sent to{" "}
                  <span style={{ color: "#a1a1aa" }}>
                    {recipientEmail || "your subscribed email"}
                  </span>{" "}
                  because you subscribed to {palette.title} release alerts on System Simulator.
                </p>
                <p style={{ margin: "0" }}>
                  <a
                    href={topicUnsubscribeUrl}
                    style={{
                      color: "#a1a1aa",
                      textDecoration: "underline",
                      marginRight: "14px",
                    }}
                  >
                    1-Click Unsubscribe from {palette.title}
                  </a>
                  <a
                    href={allUnsubscribeUrl}
                    style={{
                      color: "#a1a1aa",
                      textDecoration: "underline",
                      marginRight: "14px",
                    }}
                  >
                    Unsubscribe from all notifications
                  </a>
                  <a
                    href={preferencesUrl}
                    style={{
                      color: "#71717a",
                      textDecoration: "underline",
                    }}
                  >
                    Manage preferences
                  </a>
                </p>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}
