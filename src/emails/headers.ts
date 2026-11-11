export interface EmailHeadersParams {
  unsubscribeToken: string;
  subject?: string;
  appUrl?: string;
}

export interface EmailHeaders {
  "List-Unsubscribe": string;
  "List-Unsubscribe-Post": "List-Unsubscribe=One-Click";
}

/**
 * Generates RFC 8058 compliant email headers for 1-click unsubscription in Mail User Agents (MUAs).
 *
 * @param params.unsubscribeToken The unique subscriber unsubscribeToken
 * @param params.subject The topic channel or discipline (e.g. OPERATING_SYSTEMS)
 * @param params.appUrl Base URL of the application (defaults to process.env.NEXT_PUBLIC_APP_URL)
 */
export function getEmailHeaders({
  unsubscribeToken,
  subject,
  appUrl,
}: EmailHeadersParams): EmailHeaders {
  const base = (
    appUrl ||
    process.env.NEXT_PUBLIC_APP_URL ||
    "https://systemsimulator.io"
  ).replace(/\/+$/, "");

  const topicQuery = subject ? `&topic=${encodeURIComponent(subject)}` : "";
  const unsubscribeUrl = `${base}/api/notifications/unsubscribe?token=${encodeURIComponent(
    unsubscribeToken
  )}${topicQuery}`;

  return {
    "List-Unsubscribe": `<${unsubscribeUrl}>`,
    "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
  };
}
