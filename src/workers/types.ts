import { z } from "zod";
import { SubjectChannel } from "@prisma/client";

// ============================================================================
// Subject Channel Normalization Helper
// ============================================================================

export const SUBJECT_CHANNEL_MAP: Record<string, SubjectChannel> = {
  javascript: SubjectChannel.JAVASCRIPT,
  "operating-systems": SubjectChannel.OPERATING_SYSTEMS,
  java: SubjectChannel.JAVA,
  "computer-networks": SubjectChannel.COMPUTER_NETWORKS,
  backend: SubjectChannel.BACKEND,
  frontend: SubjectChannel.FRONTEND,
  all: SubjectChannel.ALL,
};

export function normalizeSubjectChannel(input: string): SubjectChannel {
  if (!input || typeof input !== "string") {
    throw new Error(`Invalid subject channel: '${input}'`);
  }
  const lower = input.toLowerCase().trim();
  if (lower in SUBJECT_CHANNEL_MAP) {
    return SUBJECT_CHANNEL_MAP[lower];
  }
  const upper = input.toUpperCase().trim() as SubjectChannel;
  if (Object.values(SubjectChannel).includes(upper)) {
    return upper;
  }
  throw new Error(`Invalid subject channel: '${input}'`);
}

// ============================================================================
// Worker Environment Variable Helper (Safe in Node, Lambda, and test runners)
// ============================================================================

export function getWorkerEnv(key: string, fallback?: string): string | undefined {
  if (typeof process !== "undefined" && process.env && process.env[key] !== undefined && process.env[key] !== "") {
    return process.env[key];
  }
  return fallback;
}

const subjectSchema = z.preprocess((val) => {
  if (typeof val === "string") {
    return normalizeSubjectChannel(val);
  }
  return val;
}, z.nativeEnum(SubjectChannel));

// ============================================================================
// SQS Fanout Message Schemas & Types
// ============================================================================

export const fanoutMessageSchema = z.object({
  episodeId: z.string().min(1, "episodeId is required"),
  subject: subjectSchema,
  episodeNumber: z.coerce.number().int().positive("episodeNumber must be a positive integer"),
  title: z.string().min(1, "title is required"),
  releaseCommitSha: z.string().min(1, "releaseCommitSha is required"),
  summary: z.string().optional().default(""),
  keyConcepts: z.array(z.string()).optional().default([]),
  ctaUrl: z
    .string()
    .url("ctaUrl must be a valid URL")
    .refine((url) => /^https?:\/\//i.test(url), {
      message: "ctaUrl must use http or https protocol",
    })
    .optional(),
  force: z.boolean().optional().default(false),
});

export type FanoutMessagePayload = z.infer<typeof fanoutMessageSchema>;
export type EpisodeFanoutPayload = FanoutMessagePayload;

export interface FanoutRecipient {
  email: string;
  unsubscribeToken: string;
}

export interface FanoutResult {
  success: boolean;
  status: "DISPATCHED" | "ALREADY_DISPATCHED" | "NO_SUBSCRIBERS";
  subject: SubjectChannel;
  episodeId: string;
  totalRecipients: number;
  chunksDispatched: number;
  dispatchedAt?: Date;
}

// ============================================================================
// SQS Dispatch Message Schemas & Types (Chunks of <= 10 recipients)
// ============================================================================

export const dispatchRecipientSchema = z.object({
  email: z.string().trim().toLowerCase().email("Invalid recipient email"),
  unsubscribeToken: z.string().min(1, "unsubscribeToken is required"),
});

export type DispatchRecipient = z.infer<typeof dispatchRecipientSchema>;

export const dispatchEpisodeSchema = z.object({
  episodeId: z.string().min(1, "episodeId is required"),
  subject: subjectSchema,
  episodeNumber: z.coerce.number().int().positive("episodeNumber must be a positive integer"),
  title: z.string().min(1, "title is required"),
  summary: z.string().optional().default(""),
  keyConcepts: z.array(z.string()).optional().default([]),
  ctaUrl: z
    .string()
    .url("ctaUrl must be a valid URL")
    .refine((url) => /^https?:\/\//i.test(url), {
      message: "ctaUrl must use http or https protocol",
    })
    .optional(),
  releaseCommitSha: z.string().optional().default(""),
});

export type DispatchEpisodeMetadata = z.infer<typeof dispatchEpisodeSchema>;
export type DispatchEpisode = DispatchEpisodeMetadata;

export const dispatchMessagePayloadSchema = z.object({
  episode: dispatchEpisodeSchema,
  recipients: z.array(dispatchRecipientSchema).min(1, "At least 1 recipient is required").max(10, "At most 10 recipients are allowed"),
});

export const dispatchMessageSchema = dispatchMessagePayloadSchema;

export type DispatchMessagePayload = z.infer<typeof dispatchMessagePayloadSchema>;
export type EpisodeDispatchMessage = DispatchMessagePayload;

// ============================================================================
// Resend Batch API Request & Response Types
// ============================================================================

export interface ResendEmailItem {
  from: string;
  to: string | string[];
  subject: string;
  html: string;
  headers: Record<string, string>;
}

export interface ResendBatchSuccessResponse {
  data: Array<{ id: string }>;
}

// ============================================================================
// AWS Lambda SQS Event & Response Interfaces (ReportBatchItemFailures)
// ============================================================================

export interface SQSBatchItemFailure {
  itemIdentifier: string;
}

export interface SQSBatchResponse {
  batchItemFailures: SQSBatchItemFailure[];
}

export interface SQSRecordAttributes {
  ApproximateReceiveCount?: string;
  SentTimestamp?: string;
  SenderId?: string;
  ApproximateFirstReceiveTimestamp?: string;
  SequenceNumber?: string;
  MessageGroupId?: string;
  MessageDeduplicationId?: string;
  [key: string]: string | undefined;
}

export interface SQSRecord {
  messageId: string;
  receiptHandle: string;
  body: string;
  attributes?: SQSRecordAttributes;
  messageAttributes?: Record<string, unknown>;
  md5OfBody?: string;
  eventSource?: string;
  eventSourceARN?: string;
  awsRegion?: string;
}

export interface SQSEvent {
  Records: SQSRecord[];
}

export interface LambdaContext {
  awsRequestId?: string;
  functionName?: string;
  functionVersion?: string;
  invokedFunctionArn?: string;
  memoryLimitInMB?: string;
  getRemainingTimeInMillis?: () => number;
}
