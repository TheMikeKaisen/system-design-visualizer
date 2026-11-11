import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma as defaultPrisma } from "@/lib/db";
import { env } from "@/lib/env";
import {
  fanoutMessageSchema,
  type FanoutMessagePayload,
  getWorkerEnv,
} from "@/workers/types";
import { enqueueFanoutMessage } from "@/workers/sqs";
import { verifyReleaseSignatureDetailed } from "@/lib/security/releaseSignature";
import type { PrismaClient } from "@prisma/client";
import type { SQSClient } from "@aws-sdk/client-sqs";

// ============================================================================
// Request Payload Schema & Types (Reusing fanoutMessageSchema - Rule #6)
// ============================================================================

export const publishEpisodePayloadSchema = fanoutMessageSchema.extend({
  ctaUrl: z
    .string()
    .url("ctaUrl must be a valid URL")
    .refine((url) => /^https?:\/\//i.test(url), {
      message: "ctaUrl must use http or https protocol",
    })
    .optional()
    .or(z.literal("").transform(() => undefined))
    .or(z.null().transform(() => undefined)),
});

export type PublishEpisodePayload = z.infer<typeof publishEpisodePayloadSchema>;

// ============================================================================
// Dependency Injection Interface (Rule #5: Rigorous Testability)
// ============================================================================

export interface PublishEpisodeDependencies {
  db?: PrismaClient;
  enqueueFanout?: (
    payload: FanoutMessagePayload,
    queueUrl?: string,
    client?: SQSClient
  ) => Promise<string | undefined>;
  verifySignature?: typeof verifyReleaseSignatureDetailed;
  queueUrl?: string;
  secret?: string;
  sqsClient?: SQSClient;
  logger?: Pick<Console, "info" | "warn" | "error">;
  now?: number;
  toleranceSeconds?: number;
}

// ============================================================================
// Core Ingest Handler
// ============================================================================

export async function handlePublishEpisode(
  request: Request,
  deps: PublishEpisodeDependencies = {}
): Promise<NextResponse> {
  const logger = deps.logger ?? console;
  const db = deps.db ?? defaultPrisma;
  const enqueueFanout = deps.enqueueFanout ?? enqueueFanoutMessage;
  const verifySignature = deps.verifySignature ?? verifyReleaseSignatureDetailed;

  // 1. Release secret configuration check
  const releaseSecret =
    deps.secret ??
    process.env.INTERNAL_RELEASE_SECRET ??
    (env as Record<string, unknown>).INTERNAL_RELEASE_SECRET as string | undefined;

  if (!releaseSecret || releaseSecret.trim().length === 0) {
    logger.error("[PublishRoute] INTERNAL_RELEASE_SECRET is not configured.");
    return NextResponse.json(
      { error: "Internal release secret is not configured on the server." },
      { status: 500 }
    );
  }

  // 2. Read raw request payload as text before parsing (preserves byte sequence for HMAC)
  let rawBody: string;
  try {
    rawBody = await request.text();
  } catch {
    return NextResponse.json(
      { error: "Unable to read request payload." },
      { status: 400 }
    );
  }

  // 3. Cryptographic Authentication: HMAC-SHA256 signature & Anti-Replay window
  const verification = verifySignature({
    payload: rawBody,
    headers: request.headers,
    secret: releaseSecret,
    now: deps.now,
    toleranceSeconds: deps.toleranceSeconds,
  });

  if (!verification.valid) {
    return NextResponse.json(
      {
        error: verification.error ?? "Invalid release signature or timestamp.",
      },
      { status: verification.status ?? 401 }
    );
  }

  // 4. Parse JSON payload
  let parsedJson: unknown;
  try {
    parsedJson = JSON.parse(rawBody);
  } catch {
    return NextResponse.json(
      { error: "Malformed JSON payload." },
      { status: 400 }
    );
  }

  // 5. Zod schema validation
  let parseResult;
  try {
    parseResult = publishEpisodePayloadSchema.safeParse(parsedJson);
  } catch (schemaErr) {
    return NextResponse.json(
      {
        error: schemaErr instanceof Error ? schemaErr.message : "Validation failed.",
      },
      { status: 400 }
    );
  }
  if (!parseResult.success) {
    return NextResponse.json(
      {
        error: parseResult.error.issues[0]?.message ?? "Validation failed.",
        details: parseResult.error.flatten().fieldErrors,
      },
      { status: 400 }
    );
  }

  const validatedData: FanoutMessagePayload = parseResult.data;

  // 6. Read-Only Fast-Path Idempotency & In-Flight Protection (Defense-in-depth)
  try {
    const existing = await db.publishedEpisode.findUnique({
      where: {
        subject_episodeId: {
          subject: validatedData.subject,
          episodeId: validatedData.episodeId,
        },
      },
    });

    if (existing && !validatedData.force) {
      if (existing.dispatchedAt) {
        logger.info(
          `[PublishRoute] Episode ${validatedData.subject}/${validatedData.episodeId} was already dispatched at ${existing.dispatchedAt.toISOString()}. Skipping queue.`
        );
        return NextResponse.json(
          {
            success: true,
            status: "already_published",
            alreadyDispatched: true,
            episodeId: validatedData.episodeId,
            subject: validatedData.subject,
            dispatchedAt: existing.dispatchedAt,
            message: "Episode was already published and dispatched.",
          },
          { status: 200 }
        );
      }

      // Operational In-Flight Deduplication Guard (Prevents SQS enqueue race under CI/CD retries)
      // If an existing record was enqueued recently (within 10 minutes) and dispatchedAt is still null,
      // the message is already durably buffered or in-flight in Lambda. Skip duplicate enqueue.
      const publishedAtMs = existing.publishedAt ? new Date(existing.publishedAt).getTime() : 0;
      const ageMs = (deps.now ?? Date.now()) - publishedAtMs;
      const IN_FLIGHT_GRACE_WINDOW_MS = 10 * 60 * 1000; // 10 minutes

      if (ageMs >= 0 && ageMs < IN_FLIGHT_GRACE_WINDOW_MS) {
        logger.info(
          `[PublishRoute] Episode ${validatedData.subject}/${validatedData.episodeId} is already in-flight (enqueued ${Math.round(ageMs / 1000)}s ago). Skipping duplicate SQS enqueue.`
        );
        return NextResponse.json(
          {
            success: true,
            status: "already_published",
            alreadyDispatched: false,
            alreadyQueued: true,
            episodeId: validatedData.episodeId,
            subject: validatedData.subject,
            message: "Episode release is already in-flight in processing queue.",
          },
          { status: 200 }
        );
      }
    }
  } catch (checkErr) {
    // If DB read fails here, log warning and continue to SQS enqueue anyway.
    // Database downtime must not prevent durable message intake into SQS.
    logger.warn(
      "[PublishRoute] Read-only idempotency check failed, continuing to SQS:",
      checkErr
    );
  }

  // 7. SQS-FIRST SAFE ENQUEUE ORDERING (CRITICAL)
  // Enqueue to AWS SQS fanout queue BEFORE recording in PostgreSQL database.
  const targetQueueUrl =
    deps.queueUrl ??
    getWorkerEnv("SQS_FANOUT_QUEUE_URL") ??
    ((env as Record<string, unknown>).SQS_FANOUT_QUEUE_URL as string | undefined);
  let messageId: string | undefined;

  try {
    messageId = await enqueueFanout(
      validatedData,
      targetQueueUrl,
      deps.sqsClient
    );
  } catch (sqsError) {
    logger.error("[PublishRoute] SQS enqueue failed:", sqsError);
    return NextResponse.json(
      {
        error: "Failed to enqueue release notification event to SQS.",
        details:
          sqsError instanceof Error ? sqsError.message : String(sqsError),
      },
      { status: 500 }
    );
  }

  // 8. DATABASE RECORDING (POST-ENQUEUE RESILIENCE)
  // SQS has durably acknowledged the message. Attempt to upsert PublishedEpisode.
  // If DB upsert fails now, return HTTP 202: EpisodeFanoutHandler will perform fallback upsert.
  try {
    await db.publishedEpisode.upsert({
      where: {
        subject_episodeId: {
          subject: validatedData.subject,
          episodeId: validatedData.episodeId,
        },
      },
      update: {
        episodeNumber: validatedData.episodeNumber,
        title: validatedData.title,
        releaseCommitSha: validatedData.releaseCommitSha,
      },
      create: {
        subject: validatedData.subject,
        episodeId: validatedData.episodeId,
        episodeNumber: validatedData.episodeNumber,
        title: validatedData.title,
        releaseCommitSha: validatedData.releaseCommitSha,
        totalRecipients: 0,
        dispatchedAt: null,
      },
    });

    return NextResponse.json(
      {
        success: true,
        episodeId: validatedData.episodeId,
        subject: validatedData.subject,
        queued: true,
        messageId,
        message: "Episode release queued successfully.",
      },
      { status: 200 }
    );
  } catch (dbError) {
    logger.warn(
      "[PublishRoute] DB upsert failed after successful SQS enqueue. Lambda worker will perform fallback upsert:",
      dbError
    );
    return NextResponse.json(
      {
        success: true,
        episodeId: validatedData.episodeId,
        subject: validatedData.subject,
        queued: true,
        messageId,
        warning: "Database record creation deferred to Lambda worker.",
      },
      { status: 202 }
    );
  }
}

// Next.js App Router HTTP POST Entrypoint
export async function POST(request: Request): Promise<NextResponse> {
  return handlePublishEpisode(request);
}
