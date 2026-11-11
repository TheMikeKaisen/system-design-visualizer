import { SQSClient } from "@aws-sdk/client-sqs";
import { PrismaClient, SubjectChannel, SubscriptionStatus } from "@prisma/client";
import { prisma as defaultPrisma } from "@/lib/db";
import { chunkArray, enqueueDispatchBatch, getSqsClient } from "./sqs";
import {
  fanoutMessageSchema,
  type FanoutMessagePayload,
  type FanoutRecipient,
  type FanoutResult,
  type SQSEvent,
  type SQSRecord,
  type SQSBatchResponse,
  type SQSBatchItemFailure,
  type LambdaContext,
  getWorkerEnv,
  type DispatchMessagePayload,
} from "./types";

export interface FanoutDependencies {
  db?: PrismaClient;
  sqsClient?: SQSClient;
  dispatchQueueUrl?: string;
  logger?: Pick<Console, "info" | "warn" | "error">;
}

export async function processEpisodeFanout(
  rawPayload: unknown,
  deps: FanoutDependencies = {}
): Promise<FanoutResult> {
  const db = deps.db ?? defaultPrisma;
  const logger = deps.logger ?? console;
  const dispatchQueueUrl = deps.dispatchQueueUrl ?? getWorkerEnv("SQS_DISPATCH_QUEUE_URL");
  const sqsClient = deps.sqsClient ?? getSqsClient();

  const parseResult = fanoutMessageSchema.safeParse(rawPayload);
  if (!parseResult.success) {
    const errorMsg = parseResult.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join(", ");
    throw new Error(`Fanout message validation failed: ${errorMsg}`);
  }

  const payload: FanoutMessagePayload = parseResult.data;
  const { subject, episodeId, episodeNumber, title, releaseCommitSha, summary, keyConcepts, ctaUrl, force } = payload;

  // 1. Idempotency Check: Prevent duplicate email blasts
  const existing = await db.publishedEpisode.findUnique({
    where: {
      subject_episodeId: {
        subject,
        episodeId,
      },
    },
  });

  if (existing?.dispatchedAt && !force) {
    logger.info(
      `[EpisodeFanout] Episode ${subject}/${episodeId} was already dispatched at ${existing.dispatchedAt.toISOString()}. Skipping.`
    );
    return {
      success: true,
      status: "ALREADY_DISPATCHED",
      subject,
      episodeId,
      totalRecipients: existing.totalRecipients,
      chunksDispatched: 0,
      dispatchedAt: existing.dispatchedAt,
    };
  }

  // 2. Query Active & Verified Subscribers for Topic OR ALL
  const targetSubjects: SubjectChannel[] =
    subject === SubjectChannel.ALL
      ? Object.values(SubjectChannel)
      : [subject, SubjectChannel.ALL];

  const rawSubscribers = await db.subscriber.findMany({
    distinct: ["email"],
    where: {
      status: SubscriptionStatus.ACTIVE,
      isVerified: true,
      subscriptions: {
        some: {
          subject: { in: targetSubjects },
        },
      },
    },
    select: {
      id: true,
      email: true,
      unsubscribeToken: true,
    },
  });

  // Deduplicate in-memory (defense-in-depth)
  const seenEmails = new Set<string>();
  const uniqueRecipients: FanoutRecipient[] = [];

  for (const sub of rawSubscribers) {
    const emailNorm = sub.email.toLowerCase().trim();
    if (!seenEmails.has(emailNorm)) {
      seenEmails.add(emailNorm);
      uniqueRecipients.push({
        email: emailNorm,
        unsubscribeToken: sub.unsubscribeToken,
      });
    }
  }

  const now = new Date();

  // 3. Handle Edge Case: 0 Subscribers
  if (uniqueRecipients.length === 0) {
    logger.info(
      `[EpisodeFanout] 0 active verified subscribers found for ${subject}. Updating PublishedEpisode metrics without dispatch.`
    );

    await db.publishedEpisode.upsert({
      where: {
        subject_episodeId: {
          subject,
          episodeId,
        },
      },
      update: {
        totalRecipients: 0,
        dispatchedAt: now,
        title,
        episodeNumber,
        releaseCommitSha,
      },
      create: {
        subject,
        episodeId,
        episodeNumber,
        title,
        releaseCommitSha,
        totalRecipients: 0,
        dispatchedAt: now,
      },
    });

    return {
      success: true,
      status: "NO_SUBSCRIBERS",
      subject,
      episodeId,
      totalRecipients: 0,
      chunksDispatched: 0,
      dispatchedAt: now,
    };
  }

  // 4. Slice into Chunks of <= 10 Recipients per Dispatch Message
  const recipientChunks = chunkArray(uniqueRecipients, 10);
  const dispatchPayloads: DispatchMessagePayload[] = recipientChunks.map((chunk) => ({
    episode: {
      episodeId,
      subject,
      episodeNumber,
      title,
      summary,
      keyConcepts,
      ctaUrl,
      releaseCommitSha,
    },
    recipients: chunk,
  }));

  // 5. Enqueue Chunks to SQS Dispatch Queue
  const enqueueResult = await enqueueDispatchBatch(
    dispatchPayloads,
    dispatchQueueUrl,
    sqsClient
  );

  if (enqueueResult.failedCount > 0) {
    throw new Error(
      `[EpisodeFanout] Failed to enqueue ${enqueueResult.failedCount} dispatch chunks to SQS queue.`
    );
  }

  // 6. Idempotently Upsert PublishedEpisode with Metric & Timestamp
  await db.publishedEpisode.upsert({
    where: {
      subject_episodeId: {
        subject,
        episodeId,
      },
    },
    update: {
      totalRecipients: uniqueRecipients.length,
      dispatchedAt: now,
      title,
      episodeNumber,
      releaseCommitSha,
    },
    create: {
      subject,
      episodeId,
      episodeNumber,
      title,
      releaseCommitSha,
      totalRecipients: uniqueRecipients.length,
      dispatchedAt: now,
    },
  });

  logger.info(
    `[EpisodeFanout] Successfully fanned out episode ${subject}/${episodeId} to ${uniqueRecipients.length} recipients across ${recipientChunks.length} chunks.`
  );

  return {
    success: true,
    status: "DISPATCHED",
    subject,
    episodeId,
    totalRecipients: uniqueRecipients.length,
    chunksDispatched: recipientChunks.length,
    dispatchedAt: now,
  };
}

export async function processFanoutRecord(
  record: SQSRecord,
  deps: FanoutDependencies = {}
): Promise<FanoutResult> {
  let parsedBody: unknown;
  try {
    parsedBody = JSON.parse(record.body);
  } catch (err) {
    throw new Error(`Invalid JSON in SQS record body (messageId: ${record.messageId}): ${(err as Error).message}`);
  }

  return processEpisodeFanout(parsedBody, deps);
}

export async function EpisodeFanoutHandler(
  event: SQSEvent,
  context?: LambdaContext,
  deps: FanoutDependencies = {}
): Promise<SQSBatchResponse> {
  const batchItemFailures: SQSBatchItemFailure[] = [];

  if (!event?.Records || !Array.isArray(event.Records) || event.Records.length === 0) {
    return { batchItemFailures };
  }

  for (const record of event.Records) {
    try {
      await processFanoutRecord(record, deps);
    } catch (error) {
      console.error(
        `[EpisodeFanoutHandler] Error processing SQS record ${record.messageId}:`,
        error
      );
      batchItemFailures.push({ itemIdentifier: record.messageId });
    }
  }

  return { batchItemFailures };
}

export const handler = EpisodeFanoutHandler;
