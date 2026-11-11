import React from "react";
import { env } from "@/lib/env";
import { getSubjectPalette } from "./EpisodeReleaseEmail";

export interface DoubleOptInEmailProps {
  recipientEmail?: string;
  verificationToken: string;
  verifyUrl?: string;
  subjects?: string[];
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

export function DoubleOptInEmail({
  recipientEmail,
  verificationToken,
  verifyUrl,
  subjects = [],
  appUrl,
}: DoubleOptInEmailProps) {
  const base = (
    appUrl ||
    env.NEXT_PUBLIC_APP_URL ||
    process.env.NEXT_PUBLIC_APP_URL ||
    "https://systemsimulator.io"
  ).replace(/\/+$/, "");

  const safeToken = encodeURIComponent(verificationToken);
  const targetVerifyUrl =
    verifyUrl || `${base}/api/notifications/verify?token=${safeToken}`;

  const resolvedSubjects =
    subjects.length > 0
      ? subjects.map((sub) => getSubjectPalette(sub).title)
      : ["All Disciplines"];

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
        Please confirm your subscription to System Simulator release alerts.
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
                    backgroundColor: "#2e2305",
                    border: "1px solid #78350f",
                    color: "#f59e0b",
                    padding: "4px 12px",
                    borderRadius: "9999px",
                    fontSize: "11px",
                    fontWeight: 700,
                    letterSpacing: "0.5px",
                    textTransform: "uppercase",
                  }}
                >
                  Subscription Confirmation
                </span>
              </div>

              {/* Heading */}
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
                Confirm your subscription
              </h1>

              {/* Description */}
              <p
                style={{
                  fontSize: "15px",
                  color: "#a1a1aa",
                  lineHeight: "1.6",
                  margin: "0 0 20px 0",
                }}
              >
                Thank you for subscribing to System Simulator. Please confirm your email
                address ({recipientEmail ? <strong>{recipientEmail}</strong> : "your email"}) to
                begin receiving release alerts whenever new interactive simulations are published.
              </p>

              {/* Requested Topics Chips */}
              <div style={{ marginBottom: "24px" }}>
                <div
                  style={{
                    fontSize: "11px",
                    fontWeight: 700,
                    color: "#71717a",
                    letterSpacing: "1px",
                    textTransform: "uppercase",
                    marginBottom: "8px",
                  }}
                >
                  Requested Disciplines
                </div>
                <div>
                  {resolvedSubjects.map((sub, index) => (
                    <span
                      key={`${sub}-${index}`}
                      style={{
                        display: "inline-block",
                        backgroundColor: "#1c1d22",
                        border: "1px solid #2e3038",
                        color: "#d4d4d8",
                        padding: "4px 10px",
                        borderRadius: "9999px",
                        fontSize: "12px",
                        marginRight: "6px",
                        marginBottom: "6px",
                      }}
                    >
                      {sub}
                    </span>
                  ))}
                </div>
              </div>

              {/* Primary Verification CTA Button (min-height 44px for touch ergonomics per Rule #7) */}
              <div style={{ marginBottom: "20px" }}>
                <table cellPadding="0" cellSpacing="0" border={0}>
                  <tbody>
                    <tr>
                      <td
                        align="center"
                        style={{
                          backgroundColor: "#f59e0b",
                          borderRadius: "8px",
                          minHeight: "44px",
                        }}
                      >
                        <a
                          href={targetVerifyUrl}
                          style={{
                            display: "inline-block",
                            minHeight: "44px",
                            lineHeight: "44px",
                            padding: "0 28px",
                            backgroundColor: "#f59e0b",
                            color: "#09090b",
                            borderRadius: "8px",
                            textDecoration: "none",
                            fontWeight: 700,
                            fontSize: "15px",
                            letterSpacing: "0.2px",
                            boxSizing: "border-box",
                          }}
                        >
                          Verify Subscription →
                        </a>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Plaintext Link Fallback */}
              <div style={{ marginBottom: "24px" }}>
                <div
                  style={{
                    fontSize: "11px",
                    color: "#71717a",
                    marginBottom: "6px",
                  }}
                >
                  Or copy and paste this link into your browser:
                </div>
                <div
                  style={{
                    backgroundColor: "#18191e",
                    border: "1px solid #27272a",
                    borderRadius: "6px",
                    padding: "8px 12px",
                    fontFamily: "monospace",
                    fontSize: "11px",
                    color: "#a1a1aa",
                    wordBreak: "break-all",
                  }}
                >
                  {targetVerifyUrl}
                </div>
              </div>

              {/* 24-Hour Expiration Notice */}
              <div
                style={{
                  backgroundColor: "#272010",
                  border: "1px solid #78350f",
                  borderRadius: "8px",
                  padding: "12px 16px",
                  marginBottom: "20px",
                  fontSize: "13px",
                  color: "#f59e0b",
                  lineHeight: "1.5",
                }}
              >
                ⏳ <strong>Notice:</strong> This verification link expires in 24 hours. After
                expiration, a new subscription request must be submitted.
              </div>

              {/* Security Disclaimer */}
              <div
                style={{
                  fontSize: "12px",
                  color: "#71717a",
                  lineHeight: "1.5",
                  marginBottom: "24px",
                }}
              >
                🔒 <strong>Security Note:</strong> If you didn&apos;t request this subscription,
                you can safely ignore this email. No alerts will ever be sent without verification.
              </div>

              {/* Divider */}
              <div
                style={{
                  height: "1px",
                  backgroundColor: "#27272a",
                  marginBottom: "20px",
                }}
              />

              {/* Footer */}
              <div
                style={{
                  fontSize: "11px",
                  color: "#52525b",
                  textAlign: "center",
                  letterSpacing: "0.5px",
                }}
              >
                System Simulator • Interactive Architectural Visualizer & Runtime Schedulers
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}
