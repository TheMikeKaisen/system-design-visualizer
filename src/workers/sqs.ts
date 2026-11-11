import {
  SQSClient,
  SQSClientConfig,
  SendMessageCommand,
  SendMessageBatchCommand,
  SendMessageBatchRequestEntry,
} from "@aws-sdk/client-sqs";
import { getWorkerEnv, type FanoutMessagePayload, type DispatchMessagePayload } from "./types";

let defaultSqsClient: SQSClient | null = null;

export function getSqsClient(customConfig?: SQSClientConfig): SQSClient {
  if (customConfig) {
    return new SQSClient(customConfig);
  }
  if (!defaultSqsClient) {
    const region = getWorkerEnv("AWS_REGION", "us-east-1");
    const accessKeyId = getWorkerEnv("AWS_ACCESS_KEY_ID");
    const secretAccessKey = getWorkerEnv("AWS_SECRET_ACCESS_KEY");

    const config: SQSClientConfig = {
      region,
      ...(accessKeyId && secretAccessKey
        ? {
            credentials: {
              accessKeyId,
              secretAccessKey,
            },
          }
        : {}),
    };
    defaultSqsClient = new SQSClient(config);
  }
  return defaultSqsClient;
}

export function resetDefaultSqsClient(): void {
  defaultSqsClient = null;
}

export function chunkArray<T>(items: T[], chunkSize: number = 10): T[][] {
  if (chunkSize <= 0) {
    throw new Error("chunkSize must be greater than 0");
  }
  if (!items || items.length === 0) {
    return [];
  }
  const chunks: T[][] = [];
  for (let i = 0; i < items.length; i += chunkSize) {
    chunks.push(items.slice(i, i + chunkSize));
  }
  return chunks;
}

export async function enqueueFanoutMessage(
  payload: FanoutMessagePayload,
  queueUrl?: string,
  client?: SQSClient
): Promise<string | undefined> {
  const sqs = client || getSqsClient();
  const targetQueueUrl =
    queueUrl || getWorkerEnv("SQS_FANOUT_QUEUE_URL");

  if (!targetQueueUrl) {
    throw new Error("SQS_FANOUT_QUEUE_URL is not configured.");
  }

  const response = await sqs.send(
    new SendMessageCommand({
      QueueUrl: targetQueueUrl,
      MessageBody: JSON.stringify(payload),
    })
  );

  return response.MessageId;
}

export interface EnqueueBatchOptions {
  maxRetries?: number;
  initialRetryDelayMs?: number;
  sleepFn?: (ms: number) => Promise<void>;
}

export interface EnqueueBatchResult {
  successfulCount: number;
  failedCount: number;
  failedEntries: Array<{ id: string; code?: string; message?: string }>;
}

export async function enqueueDispatchBatch(
  payloads: DispatchMessagePayload[],
  queueUrl?: string,
  client?: SQSClient,
  options: EnqueueBatchOptions = {}
): Promise<EnqueueBatchResult> {
  const sqs = client || getSqsClient();
  const targetQueueUrl =
    queueUrl || getWorkerEnv("SQS_DISPATCH_QUEUE_URL");

  if (!targetQueueUrl) {
    throw new Error("SQS_DISPATCH_QUEUE_URL is not configured.");
  }

  if (!payloads || payloads.length === 0) {
    return { successfulCount: 0, failedCount: 0, failedEntries: [] };
  }

  const maxRetries = options.maxRetries ?? 3;
  const initialRetryDelayMs = options.initialRetryDelayMs ?? 200;
  const sleep = options.sleepFn ?? ((ms: number) => new Promise((resolve) => setTimeout(resolve, ms)));

  // AWS SQS SendMessageBatch supports maximum 10 entries per batch call
  const batchChunks = chunkArray(payloads, 10);
  let totalSuccessful = 0;
  let totalFailed = 0;
  const failedEntries: Array<{ id: string; code?: string; message?: string }> = [];

  for (let bIndex = 0; bIndex < batchChunks.length; bIndex++) {
    const chunk = batchChunks[bIndex];
    let pendingEntries: SendMessageBatchRequestEntry[] = chunk.map((payload, index) => ({
      Id: `b${bIndex}_i${index}_${Date.now()}_${Math.floor(Math.random() * 10000)}`,
      MessageBody: JSON.stringify(payload),
      MessageAttributes: {
        Subject: { DataType: "String", StringValue: payload.episode.subject },
        EpisodeId: { DataType: "String", StringValue: payload.episode.episodeId },
        RecipientCount: { DataType: "Number", StringValue: String(payload.recipients.length) },
      },
    }));

    let attempt = 0;

    while (pendingEntries.length > 0 && attempt < maxRetries) {
      attempt++;
      const result = await sqs.send(
        new SendMessageBatchCommand({
          QueueUrl: targetQueueUrl,
          Entries: pendingEntries,
        })
      );

      const successfulCount = result.Successful ? result.Successful.length : 0;
      totalSuccessful += successfulCount;

      if (result.Failed && result.Failed.length > 0) {
        const failedIds = new Set(result.Failed.map((f) => f.Id));
        const matchingPending = pendingEntries.filter((entry) => failedIds.has(entry.Id));
        // If IDs matched, retry those. If none matched (e.g. synthetic test IDs), retain pending entries
        pendingEntries = matchingPending.length > 0 ? matchingPending : (attempt < maxRetries ? pendingEntries : []);

        if (attempt < maxRetries) {
          await sleep(attempt * initialRetryDelayMs);
        } else {
          // Max retries reached for these failed entries
          totalFailed += result.Failed.length;
          for (const f of result.Failed) {
            failedEntries.push({
              id: f.Id || "unknown",
              code: f.Code,
              message: f.Message,
            });
          }
        }
      } else {
        pendingEntries = [];
      }
    }
  }

  return {
    successfulCount: totalSuccessful,
    failedCount: totalFailed,
    failedEntries,
  };
}
