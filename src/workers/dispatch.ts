import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { Resend } from "resend";
import { prisma as defaultPrisma } from "@/lib/db";
import { EpisodeReleaseEmail, getSubjectPalette } from "@/emails/EpisodeReleaseEmail";
import { getEmailHeaders } from "@/emails/headers";
import {
  dispatchMessagePayloadSchema,
  getWorkerEnv,
  type DispatchMessagePayload,
  type ResendEmailItem,
  type SQSEvent,
  type SQSRecord,
  type SQSBatchResponse,
  type SQSBatchItemFailure,
  type LambdaContext,
} from "./types";
import { getResendClient, resetDefaultResendClient } from "@/lib/resend";
export { getResendClient, resetDefaultResendClient };

export class RatePacer {
  private lastCallTime = 0;

  async wait(minIntervalMs: number): Promise<void> {
    if (minIntervalMs <= 0) return;
    const now = Date.now();
    const elapsed = now - this.lastCallTime;
    if (elapsed < minIntervalMs) {
      await new Promise((resolve) => setTimeout(resolve, minIntervalMs - elapsed));
    }
    this.lastCallTime = Date.now();
  }

  reset(): void {
    this.lastCallTime = 0;
  }
}

export const defaultPacer = new RatePacer();

export interface DispatchHandlerOptions {
  resendClient?: Resend;
  apiKey?: string;
  fromEmail?: string;
  appUrl?: string;
  prismaClient?: typeof defaultPrisma;
  pacer?: RatePacer;
  pacingDelayMs?: number;
  maxRetries?: number;
  fetchFn?: typeof fetch;
  sleepFn?: (ms: number) => Promise<void>;
}

export function buildBatchEmailItems(
  payload: DispatchMessagePayload,
  options: DispatchHandlerOptions = {}
): ResendEmailItem[] {
  const baseAppUrl = (
    options.appUrl ||
    getWorkerEnv("NEXT_PUBLIC_APP_URL") ||
    "https://systemsimulator.io"
  ).replace(/\/+$/, "");

  const rawFrom =
    options.fromEmail ||
    getWorkerEnv("RESEND_FROM_EMAIL") ||
    "System Simulator <notifications@systemsimulator.io>";

  const from = rawFrom.includes("<") ? rawFrom : `System Simulator <${rawFrom}>`;
  const palette = getSubjectPalette(payload.episode.subject);

  const defaultCta = `${baseAppUrl}/${payload.episode.subject.toLowerCase().replace(/_/g, "-")}/episodes/${payload.episode.episodeId}`;
  const ctaUrl = payload.episode.ctaUrl || defaultCta;

  return payload.recipients.map((recipient) => {
    const htmlBody = renderToStaticMarkup(
      React.createElement(EpisodeReleaseEmail, {
        recipientEmail: recipient.email,
        unsubscribeToken: recipient.unsubscribeToken,
        subject: payload.episode.subject,
        episodeId: payload.episode.episodeId,
        episodeNumber: payload.episode.episodeNumber,
        title: payload.episode.title,
        summary:
          payload.episode.summary ||
          `Episode ${payload.episode.episodeNumber} of ${payload.episode.title} is now live on System Simulator.`,
        keyConcepts: payload.episode.keyConcepts ?? [],
        ctaUrl,
        appUrl: baseAppUrl,
      })
    );

    const headers = getEmailHeaders({
      unsubscribeToken: recipient.unsubscribeToken,
      subject: payload.episode.subject,
      appUrl: baseAppUrl,
    });

    return {
      from,
      to: recipient.email,
      subject: `${palette.title} Release: ${payload.episode.title}`,
      html: `<!DOCTYPE html>${htmlBody}`,
      headers: {
        "List-Unsubscribe": headers["List-Unsubscribe"],
        "List-Unsubscribe-Post": headers["List-Unsubscribe-Post"],
      },
    };
  });
}

export async function sendResendBatch(
  emailItems: ResendEmailItem[],
  options: DispatchHandlerOptions = {}
): Promise<{ ids: string[] }> {
  const apiKey =
    options.apiKey || getWorkerEnv("RESEND_API_KEY");

  const pacer = options.pacer || defaultPacer;
  const pacingDelayMs = options.pacingDelayMs ?? 600; // <= 1.66 req/s safe pacing
  const maxRetries = options.maxRetries ?? 2;
  const sleep = options.sleepFn ?? ((ms: number) => new Promise((resolve) => setTimeout(resolve, ms)));

  await pacer.wait(pacingDelayMs);

  // If custom fetch function is provided, use HTTP API directly
  if (options.fetchFn) {
    if (!apiKey) {
      throw new Error("RESEND_API_KEY is not configured.");
    }

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        const response = await options.fetchFn("https://api.resend.com/emails/batch", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${apiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(emailItems),
        });

        if (response.ok) {
          const json = (await response.json()) as { data?: Array<{ id: string }> };
          const ids = (json.data || []).map((d) => d.id);
          return { ids };
        }

        if (response.status === 429) {
          if (attempt < maxRetries) {
            const retryAfter = response.headers?.get?.("retry-after");
            const retrySec = retryAfter ? parseInt(retryAfter, 10) : NaN;
            const delayMs =
              !isNaN(retrySec) && retrySec > 0
                ? retrySec * 1000
                : Math.min(1000 * Math.pow(2, attempt) + Math.random() * 200, 4000);
            await sleep(delayMs);
            continue;
          }
        }

        const errorText = await response.text();
        throw new Error(`Resend batch API failed with HTTP ${response.status}: ${errorText}`);
      } catch (err) {
        if (attempt < maxRetries && (err as Error).message?.includes("429")) {
          const backoff = 500 * Math.pow(2, attempt);
          await sleep(backoff);
          continue;
        }
        throw err;
      }
    }
    throw new Error("Resend batch API exhausted all retries.");
  }

  // Otherwise use Resend SDK client
  const resend = options.resendClient || getResendClient(options.apiKey);

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    const result = await resend.batch.send(
      emailItems.map((item) => ({
        from: item.from,
        to: Array.isArray(item.to) ? item.to : [item.to],
        subject: item.subject,
        html: item.html,
        headers: item.headers,
      }))
    );

    if (!result.error) {
      const ids = (result.data?.data || []).map((d) => d.id);
      return { ids };
    }

    const errorObj = result.error as { statusCode?: number; name?: string; message: string };
    const statusCode = errorObj.statusCode;
    const isRateLimit = statusCode === 429 || errorObj.message?.includes("429") || errorObj.name === "rate_limit_exceeded";

    if (isRateLimit && attempt < maxRetries) {
      const delayMs = Math.min(1000 * Math.pow(2, attempt) + Math.random() * 200, 4000);
      await sleep(delayMs);
      continue;
    }

    throw new Error(`Resend batch send error: ${errorObj.name} - ${errorObj.message}`);
  }

  throw new Error("Resend batch send exhausted all retries.");
}

async function stampDispatchedTimestamp(
  payload: DispatchMessagePayload,
  prismaClient?: typeof defaultPrisma
): Promise<void> {
  const db = prismaClient || defaultPrisma;
  if (!db?.publishedEpisode) return;

  try {
    await db.publishedEpisode.updateMany({
      where: {
        subject: payload.episode.subject,
        episodeId: payload.episode.episodeId,
        dispatchedAt: null,
      },
      data: {
        dispatchedAt: new Date(),
      },
    });
  } catch (err) {
    console.warn(
      `[EmailDispatchHandler] Non-fatal: Failed to update dispatchedAt for ${payload.episode.episodeId}:`,
      err
    );
  }
}

export async function processDispatchRecord(
  record: SQSRecord,
  options: DispatchHandlerOptions = {}
): Promise<{ dispatchedCount: number }> {
  // 1. Parse JSON body
  let rawJson: unknown;
  try {
    rawJson = JSON.parse(record.body);
  } catch (err) {
    throw new Error(`Invalid JSON in SQS record body (messageId: ${record.messageId}): ${(err as Error).message}`);
  }

  // 2. Validate dispatch schema
  const parsed = dispatchMessagePayloadSchema.safeParse(rawJson);
  if (!parsed.success) {
    const errorMsg = parsed.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join(", ");
    throw new Error(`Dispatch message validation failed: ${errorMsg}`);
  }

  const payload: DispatchMessagePayload = parsed.data;

  // 3. Render HTML templates and construct RFC 8058 headers
  const emailItems = buildBatchEmailItems(payload, options);

  // 4. Send batch to Resend with rate limit pacing and retry logic
  await sendResendBatch(emailItems, options);

  // 5. Update telemetry in database idempotently (non-fatal)
  await stampDispatchedTimestamp(payload, options.prismaClient);

  return { dispatchedCount: payload.recipients.length };
}

export async function EmailDispatchHandler(
  event: SQSEvent,
  context?: LambdaContext,
  options: DispatchHandlerOptions = {}
): Promise<SQSBatchResponse> {
  const batchItemFailures: SQSBatchItemFailure[] = [];

  if (!event?.Records || !Array.isArray(event.Records) || event.Records.length === 0) {
    return { batchItemFailures };
  }

  for (const record of event.Records) {
    try {
      await processDispatchRecord(record, options);
    } catch (error) {
      console.error(
        `[EmailDispatchHandler] Failed to dispatch SQS record ${record.messageId}:`,
        error
      );
      batchItemFailures.push({ itemIdentifier: record.messageId });
    }
  }

  return { batchItemFailures };
}

export const handleEmailDispatch = EmailDispatchHandler;
export const handler = EmailDispatchHandler;
