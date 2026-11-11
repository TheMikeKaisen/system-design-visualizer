import { Resend } from "resend";

let defaultResendClient: Resend | null = null;

/**
 * Returns a shared or custom instance of the Resend client.
 * Decoupled from AWS Lambda workers so Next.js App Router routes
 * can import it without pulling in Lambda worker dependencies.
 */
export function getResendClient(customApiKey?: string): Resend {
  const apiKey =
    customApiKey ||
    (typeof process !== "undefined" && process.env ? process.env.RESEND_API_KEY : undefined);

  if (!apiKey) {
    throw new Error("RESEND_API_KEY is not configured.");
  }

  if (!defaultResendClient || customApiKey) {
    const client = new Resend(apiKey);
    if (!customApiKey) defaultResendClient = client;
    return client;
  }
  return defaultResendClient;
}

export function resetDefaultResendClient(): void {
  defaultResendClient = null;
}
