/**
 * scripts/detect-new-episodes.ts
 *
 * Automated GitOps episode release detector.
 * Scans Git diffs across `src/app/{subject}/episodes.tsx` files, extracts new episode
 * metadata using TypeScript AST parsing, signs HMAC-SHA256 payloads with anti-replay
 * timestamps, and dispatches release notifications to POST /api/internal/episodes/publish
 * with exponential backoff and anti-replay timestamp refresh.
 */

import { execFileSync } from "node:child_process";
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import ts from "typescript";
import { computeReleaseSignature } from "@/lib/security/releaseSignature";
import type { FanoutMessagePayload } from "@/workers/types";

// ============================================================================
// 1. Canonical Subject Channels & File Mappings
// ============================================================================

export enum SubjectChannel {
  ALL = "ALL",
  JAVASCRIPT = "JAVASCRIPT",
  OPERATING_SYSTEMS = "OPERATING_SYSTEMS",
  JAVA = "JAVA",
  COMPUTER_NETWORKS = "COMPUTER_NETWORKS",
  BACKEND = "BACKEND",
  FRONTEND = "FRONTEND",
}

export const SUBJECT_FILE_MAP: Record<string, SubjectChannel> = {
  "src/app/javascript/episodes.tsx": SubjectChannel.JAVASCRIPT,
  "src/app/operating-systems/episodes.tsx": SubjectChannel.OPERATING_SYSTEMS,
  "src/app/java/episodes.tsx": SubjectChannel.JAVA,
  "src/app/computer-networks/episodes.tsx": SubjectChannel.COMPUTER_NETWORKS,
  "src/app/backend/episodes.tsx": SubjectChannel.BACKEND,
  "src/app/frontend/episodes.tsx": SubjectChannel.FRONTEND,
};

// Aliases supporting alternate slug conventions
export const SUBJECT_SLUG_MAP: Record<string, SubjectChannel> = {
  javascript: SubjectChannel.JAVASCRIPT,
  "operating-systems": SubjectChannel.OPERATING_SYSTEMS,
  os: SubjectChannel.OPERATING_SYSTEMS,
  java: SubjectChannel.JAVA,
  "computer-networks": SubjectChannel.COMPUTER_NETWORKS,
  networks: SubjectChannel.COMPUTER_NETWORKS,
  backend: SubjectChannel.BACKEND,
  "backend-internals": SubjectChannel.BACKEND,
  frontend: SubjectChannel.FRONTEND,
  "frontend-system-design": SubjectChannel.FRONTEND,
  all: SubjectChannel.ALL,
};

// ============================================================================
// 2. Types & Data Contracts
// ============================================================================

export interface ParsedEpisode {
  id: string;
  episodeNumber: number;
  title: string;
  description: string;
  date: string;
  href: string;
  accent?: string;
  badge?: string;
}

export interface NewEpisodeRelease {
  subject: SubjectChannel;
  episodeId: string;
  episodeNumber: number;
  title: string;
  releaseCommitSha: string;
  summary: string;
  ctaUrl?: string;
  force?: boolean;
}

export interface DispatchConfig {
  appUrl: string;
  releaseSecret: string;
  dryRun?: boolean;
  verbose?: boolean;
  force?: boolean;
  maxRetries?: number;
  initialDelayMs?: number;
  backoffFactor?: number;
  maxDelayMs?: number;
}

export interface DispatchResult {
  episodeId: string;
  subject: string;
  success: boolean;
  statusCode?: number;
  messageId?: string;
  alreadyPublished?: boolean;
  error?: string;
  attempts: number;
}

export interface DispatchDependencies {
  fetchFn?: typeof fetch;
  sleepFn?: (ms: number) => Promise<void>;
  logger?: Pick<Console, "info" | "warn" | "error" | "debug" | "log">;
  now?: () => number;
}

// ============================================================================
// 3. Date Validation Utility
// ============================================================================

/**
 * Determines whether an episode's date string represents a released date.
 * Returns false for "Coming Soon", empty strings, or undefined values.
 */
export function isReleasedDate(dateStr?: string): boolean {
  if (!dateStr) return false;
  const trimmed = dateStr.trim();
  if (trimmed.length === 0) return false;
  if (/coming\s*soon/i.test(trimmed)) return false;

  // Verify it contains recognized date indicators (year or month or valid parse)
  const parsed = Date.parse(trimmed);
  if (!Number.isNaN(parsed) && parsed > 0) return true;

  const monthOrYearRegex =
    /(?:january|february|march|april|may|june|july|august|september|october|november|december|\b20\d\d\b)/i;
  return monthOrYearRegex.test(trimmed);
}

// ============================================================================
// 4. AST Parser for episodes.tsx Files
// ============================================================================

/**
 * Parses episode objects from a TypeScript / TSX source file using the TypeScript
 * Compiler API. Extracts id, episodeNumber, title, description, date, href, accent, badge.
 * Ignores JSX elements (such as icons) and formatting differences.
 */
export function parseEpisodesFromTsx(code: string): ParsedEpisode[] {
  if (!code || code.trim().length === 0) return [];

  const sourceFile = ts.createSourceFile(
    "episodes-ast.tsx",
    code,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TSX
  );

  const episodes: ParsedEpisode[] = [];

  function visit(node: ts.Node) {
    if (
      ts.isVariableDeclaration(node) &&
      ts.isIdentifier(node.name) &&
      node.name.text.endsWith("_EPISODES") &&
      node.initializer &&
      ts.isArrayLiteralExpression(node.initializer)
    ) {
      for (const element of node.initializer.elements) {
        if (ts.isObjectLiteralExpression(element)) {
          const ep: Partial<ParsedEpisode> = {};

          for (const prop of element.properties) {
            if (ts.isPropertyAssignment(prop) && prop.name) {
              let key = "";
              if (ts.isIdentifier(prop.name) || ts.isStringLiteral(prop.name)) {
                key = prop.name.text;
              }

              if (key) {
                if (
                  ts.isStringLiteral(prop.initializer) ||
                  ts.isNoSubstitutionTemplateLiteral(prop.initializer)
                ) {
                  (ep as Record<string, unknown>)[key] = prop.initializer.text;
                } else if (ts.isNumericLiteral(prop.initializer)) {
                  (ep as Record<string, unknown>)[key] = Number(prop.initializer.text);
                } else if (
                  ts.isPrefixUnaryExpression(prop.initializer) &&
                  prop.initializer.operator === ts.SyntaxKind.MinusToken &&
                  ts.isNumericLiteral(prop.initializer.operand)
                ) {
                  (ep as Record<string, unknown>)[key] = -Number(
                    prop.initializer.operand.text
                  );
                }
              }
            }
          }

          if (ep.id && ep.title) {
            episodes.push({
              id: ep.id,
              episodeNumber:
                typeof ep.episodeNumber === "number" ? ep.episodeNumber : 0,
              title: ep.title,
              description: ep.description || "",
              date: ep.date || "",
              href: ep.href || "#",
              accent: ep.accent,
              badge: ep.badge,
            });
          }
        }
      }
    }
    ts.forEachChild(node, visit);
  }

  visit(sourceFile);
  return episodes;
}

// ============================================================================
// 5. Git CLI Interface
// ============================================================================

export function runGit(args: string[], cwd?: string): string {
  try {
    return execFileSync("git", args, {
      encoding: "utf8",
      cwd: cwd ?? process.cwd(),
      stdio: ["pipe", "pipe", "pipe"],
    }).trim();
  } catch (err) {
    throw new Error(`Git command failed: git ${args.join(" ")}\n${String(err)}`);
  }
}

export function getFileAtCommit(
  commit: string,
  filePath: string,
  gitRunner: (args: string[]) => string = runGit
): string | null {
  try {
    const gitPath = filePath.replace(/\\/g, "/");
    return gitRunner(["show", `${commit}:${gitPath}`]);
  } catch {
    return null;
  }
}

// ============================================================================
// 6. Semantic AST State Differ
// ============================================================================

export interface DetectEpisodesOptions {
  baseUrl?: string;
  force?: boolean;
  gitRunner?: (args: string[]) => string;
}

/**
 * Pure semantic diffing function operating on in-memory before/after code representations.
 * Ideal for deterministic unit tests and CI executions.
 */
export function detectNewEpisodesFromCode(
  beforeFiles: Record<string, string | null>,
  afterFiles: Record<string, string | null>,
  headCommitSha: string,
  options: { baseUrl?: string; force?: boolean } = {}
): NewEpisodeRelease[] {
  const baseUrl = options.baseUrl ?? "https://system-design-visualizer.com";
  const force = Boolean(options.force);
  const newReleases: NewEpisodeRelease[] = [];

  for (const [filePath, subject] of Object.entries(SUBJECT_FILE_MAP)) {
    const beforeCode = beforeFiles[filePath] ?? "";
    const afterCode = afterFiles[filePath] ?? "";

    if (!afterCode || afterCode.trim().length === 0) {
      continue; // File deleted or empty — ignore deleted episodes
    }

    const beforeEpisodes = parseEpisodesFromTsx(beforeCode);
    const afterEpisodes = parseEpisodesFromTsx(afterCode);

    const beforeMap = new Map<string, ParsedEpisode>();
    for (const ep of beforeEpisodes) {
      beforeMap.set(ep.id, ep);
    }

    for (const ep of afterEpisodes) {
      // Must be a valid released date in the after state
      if (!isReleasedDate(ep.date)) {
        continue;
      }

      const prev = beforeMap.get(ep.id);
      const isBrandNew = !prev;
      const isNewlyReleased = prev && !isReleasedDate(prev.date);

      if (isBrandNew || isNewlyReleased) {
        const ctaUrl =
          ep.href && ep.href.startsWith("/")
            ? `${baseUrl.replace(/\/+$/, "")}${ep.href}`
            : undefined;

        newReleases.push({
          subject,
          episodeId: ep.id,
          episodeNumber: ep.episodeNumber,
          title: ep.title,
          releaseCommitSha: headCommitSha,
          summary: ep.description,
          ctaUrl,
          force,
        });
      }
    }
  }

  return newReleases;
}

/**
 * Diffs git commits between baseCommit and headCommit across all subject episode registries.
 */
export function detectNewEpisodes(
  baseCommit: string,
  headCommit: string,
  options: DetectEpisodesOptions = {}
): NewEpisodeRelease[] {
  const gitRunner = options.gitRunner ?? runGit;
  const beforeFiles: Record<string, string | null> = {};
  const afterFiles: Record<string, string | null> = {};

  for (const filePath of Object.keys(SUBJECT_FILE_MAP)) {
    beforeFiles[filePath] = getFileAtCommit(baseCommit, filePath, gitRunner);
    afterFiles[filePath] = getFileAtCommit(headCommit, filePath, gitRunner);
  }

  return detectNewEpisodesFromCode(beforeFiles, afterFiles, headCommit, {
    baseUrl: options.baseUrl,
    force: options.force,
  });
}

// ============================================================================
// 7. Dispatch Configuration & Environment Resolution
// ============================================================================

export function resolveDispatchConfig(
  cliOverrides: {
    appUrl?: string;
    secret?: string;
    dryRun?: boolean;
    verbose?: boolean;
    force?: boolean;
  } = {}
): DispatchConfig {
  const isDryRun = Boolean(cliOverrides.dryRun);

  // 1. Resolve Release Secret
  let releaseSecret =
    cliOverrides.secret ?? process.env.INTERNAL_RELEASE_SECRET ?? "";

  if (!releaseSecret || releaseSecret.trim().length === 0) {
    if (isDryRun) {
      releaseSecret = "dry-run-secret-placeholder";
    } else {
      throw new Error(
        "Missing required environment variable: INTERNAL_RELEASE_SECRET. " +
          "Ensure INTERNAL_RELEASE_SECRET is set in GitHub Secrets or environment."
      );
    }
  }

  // 2. Resolve APP_URL
  const rawAppUrl =
    cliOverrides.appUrl ??
    process.env.APP_URL ??
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : undefined) ??
    (isDryRun ? "http://localhost:3000" : "");

  if (!rawAppUrl || rawAppUrl.trim().length === 0) {
    throw new Error(
      "Missing required environment variable: APP_URL. " +
        "Specify APP_URL or pass --url <url>."
    );
  }

  const sanitizedAppUrl = rawAppUrl.trim().replace(/\/+$/, "");
  try {
    const parsed = new URL(sanitizedAppUrl);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      throw new Error("Invalid protocol");
    }
  } catch {
    throw new Error(
      `Invalid APP_URL format: '${rawAppUrl}'. Must be a valid HTTP or HTTPS URL.`
    );
  }

  return {
    appUrl: sanitizedAppUrl,
    releaseSecret,
    dryRun: isDryRun,
    verbose: Boolean(cliOverrides.verbose),
    force: Boolean(cliOverrides.force),
    maxRetries: 3,
    initialDelayMs: 1000,
    backoffFactor: 2,
    maxDelayMs: 10000,
  };
}

// ============================================================================
// 8. Cryptographic Release Signature Generation
// ============================================================================

export function generateReleaseHeaders(
  payload: FanoutMessagePayload | unknown,
  secret: string,
  nowMs: number = Date.now()
): {
  rawBody: string;
  timestamp: string;
  signature: string;
  headers: Record<string, string>;
} {
  const rawBody = JSON.stringify(payload);
  const timestamp = Math.floor(nowMs / 1000).toString();

  let signature: string;
  try {
    signature = computeReleaseSignature({
      payload: rawBody,
      secret,
      timestamp,
      bound: true,
      prefix: true,
    });
  } catch {
    // Robust standalone fallback
    const toSign = `${timestamp}.${rawBody}`;
    const hex = crypto.createHmac("sha256", secret).update(toSign, "utf8").digest("hex");
    signature = `sha256=${hex}`;
  }

  return {
    rawBody,
    timestamp,
    signature,
    headers: {
      "Content-Type": "application/json",
      "x-release-timestamp": timestamp,
      "x-release-signature": signature,
      "User-Agent": "SystemSimulator-GitOps-ReleaseDispatch/1.0",
    },
  };
}

// ============================================================================
// 9. HTTP Dispatch Pipeline with Retry Backoff & Anti-Replay Refresh
// ============================================================================

export async function dispatchEpisodeRelease(
  payload: FanoutMessagePayload,
  config: DispatchConfig,
  deps: DispatchDependencies = {}
): Promise<DispatchResult> {
  const fetchFn = deps.fetchFn ?? fetch;
  const sleepFn =
    deps.sleepFn ?? ((ms: number) => new Promise((resolve) => setTimeout(resolve, ms)));
  const logger = deps.logger ?? console;
  const now = deps.now ?? Date.now;

  const endpointUrl = `${config.appUrl}/api/internal/episodes/publish`;

  // Dry-Run Handling
  if (config.dryRun) {
    const { timestamp, signature } = generateReleaseHeaders(
      payload,
      config.releaseSecret,
      now()
    );

    logger.info(
      `[DRY-RUN] Release dispatch simulated for episode: ${payload.subject}/${payload.episodeId}`
    );
    logger.info(`[DRY-RUN] Target URL: ${endpointUrl}`);
    logger.info(`[DRY-RUN] Timestamp:  ${timestamp}`);
    logger.info(`[DRY-RUN] Signature:  ${signature}`);
    logger.info(`[DRY-RUN] Payload:\n${JSON.stringify(payload, null, 2)}`);

    return {
      episodeId: payload.episodeId,
      subject: payload.subject,
      success: true,
      statusCode: 200,
      attempts: 1,
    };
  }

  // Live Dispatch Retry Loop
  const maxRetries = config.maxRetries ?? 3;
  const initialDelay = config.initialDelayMs ?? 1000;
  const backoffFactor = config.backoffFactor ?? 2;
  const maxDelay = config.maxDelayMs ?? 10000;

  let attempt = 0;

  while (attempt <= maxRetries) {
    attempt++;

    // CRITICAL: Fresh timestamp and fresh signature on each retry attempt
    const { rawBody, timestamp, signature, headers } = generateReleaseHeaders(
      payload,
      config.releaseSecret,
      now()
    );

    if (config.verbose) {
      logger.info(
        `[Dispatch] Attempt ${attempt}/${maxRetries + 1} for ${payload.subject}/${payload.episodeId} ` +
          `(ts: ${timestamp}, sig: ${signature.slice(0, 15)}...)`
      );
    }

    try {
      const response = await fetchFn(endpointUrl, {
        method: "POST",
        headers,
        body: rawBody,
      });

      const statusCode = response.status;
      let responseBody: Record<string, unknown> = {};
      try {
        responseBody = (await response.json()) as Record<string, unknown>;
      } catch {
        // Fallback for empty or non-JSON response body
      }

      // Success Cases: HTTP 200 or 202
      if (statusCode === 200) {
        if (responseBody.status === "already_published" || responseBody.alreadyDispatched) {
          logger.info(
            `[Dispatch] Episode ${payload.subject}/${payload.episodeId} was already published. Idempotent skip.`
          );
          return {
            episodeId: payload.episodeId,
            subject: payload.subject,
            success: true,
            statusCode: 200,
            alreadyPublished: true,
            attempts: attempt,
          };
        }

        logger.info(
          `[Dispatch] Episode ${payload.subject}/${payload.episodeId} successfully queued to SQS ` +
            `(MessageId: ${(responseBody.messageId as string) ?? "unknown"}).`
        );
        return {
          episodeId: payload.episodeId,
          subject: payload.subject,
          success: true,
          statusCode: 200,
          messageId: responseBody.messageId as string | undefined,
          attempts: attempt,
        };
      }

      if (statusCode === 202) {
        logger.warn(
          `[Dispatch] Episode ${payload.subject}/${payload.episodeId} enqueued to SQS, but DB upsert deferred to Lambda worker.`
        );
        return {
          episodeId: payload.episodeId,
          subject: payload.subject,
          success: true,
          statusCode: 202,
          messageId: responseBody.messageId as string | undefined,
          attempts: attempt,
        };
      }

      // Non-Transient Permanent Client Errors: Fail fast immediately
      if (statusCode >= 400 && statusCode < 500 && statusCode !== 429) {
        const errorMsg =
          (responseBody.error as string) ??
          `Client error HTTP ${statusCode}: ${response.statusText}`;
        logger.error(
          `[Dispatch] Fatal non-retryable error dispatching ${payload.subject}/${payload.episodeId} ` +
            `(HTTP ${statusCode}): ${errorMsg}`
        );
        return {
          episodeId: payload.episodeId,
          subject: payload.subject,
          success: false,
          statusCode,
          error: errorMsg,
          attempts: attempt,
        };
      }

      // Transient Server Errors (500, 502, 503, 504, 429): Retry with exponential backoff
      if (attempt <= maxRetries) {
        const delay = Math.min(
          initialDelay * Math.pow(backoffFactor, attempt - 1),
          maxDelay
        );
        const jitter = Math.floor(Math.random() * 200);
        const totalDelay = delay + jitter;

        logger.warn(
          `[Dispatch] Transient HTTP ${statusCode} for ${payload.subject}/${payload.episodeId}. ` +
            `Retrying in ${totalDelay}ms (attempt ${attempt}/${maxRetries})...`
        );
        await sleepFn(totalDelay);
        continue;
      }

      // Exhausted retries
      logger.error(
        `[Dispatch] Exhausted all ${maxRetries} retries for ${payload.subject}/${payload.episodeId} ` +
          `due to persistent HTTP ${statusCode}.`
      );
      return {
        episodeId: payload.episodeId,
        subject: payload.subject,
        success: false,
        statusCode,
        error: (responseBody.error as string) ?? `Server error HTTP ${statusCode}`,
        attempts: attempt,
      };
    } catch (networkErr) {
      // Network / Fetch failure (ECONNREFUSED, timeout, socket reset)
      const errMessage =
        networkErr instanceof Error ? networkErr.message : String(networkErr);

      if (attempt <= maxRetries) {
        const delay = Math.min(
          initialDelay * Math.pow(backoffFactor, attempt - 1),
          maxDelay
        );
        const jitter = Math.floor(Math.random() * 200);
        const totalDelay = delay + jitter;

        logger.warn(
          `[Dispatch] Network failure (${errMessage}) dispatching ${payload.subject}/${payload.episodeId}. ` +
            `Retrying in ${totalDelay}ms (attempt ${attempt}/${maxRetries})...`
        );
        await sleepFn(totalDelay);
        continue;
      }

      logger.error(
        `[Dispatch] Exhausted all ${maxRetries} retries for ${payload.subject}/${payload.episodeId} ` +
          `due to network failure: ${errMessage}`
      );
      return {
        episodeId: payload.episodeId,
        subject: payload.subject,
        success: false,
        error: `Network failure: ${errMessage}`,
        attempts: attempt,
      };
    }
  }

  return {
    episodeId: payload.episodeId,
    subject: payload.subject,
    success: false,
    error: "Unknown dispatch failure",
    attempts: attempt,
  };
}

// ============================================================================
// 10. Multi-Episode Batch Coordinator
// ============================================================================

export async function dispatchAllEpisodes(
  episodes: FanoutMessagePayload[],
  config: DispatchConfig,
  deps: DispatchDependencies = {}
): Promise<{ success: boolean; results: DispatchResult[] }> {
  const logger = deps.logger ?? console;

  if (episodes.length === 0) {
    logger.info("[Dispatch] No new episodes to dispatch. Exiting cleanly.");
    return { success: true, results: [] };
  }

  logger.info(
    `[Dispatch] Beginning release dispatch for ${episodes.length} detected episode(s)...`
  );

  const results: DispatchResult[] = [];
  let allSuccess = true;

  for (const episode of episodes) {
    const result = await dispatchEpisodeRelease(episode, config, deps);
    results.push(result);
    if (!result.success) {
      allSuccess = false;
    }
  }

  // Summary Table Output
  logger.info("\n================= RELEASE DISPATCH SUMMARY =================");
  for (const r of results) {
    const status = r.success
      ? r.alreadyPublished
        ? "SKIPPED (ALREADY PUBLISHED)"
        : "SUCCESS (QUEUED)"
      : `FAILED (${r.error ?? `HTTP ${r.statusCode}`})`;
    logger.info(`* [${r.subject}] ${r.episodeId}: ${status} (${r.attempts} attempt(s))`);
  }
  logger.info("============================================================\n");

  return { success: allSuccess, results };
}

// ============================================================================
// 11. CLI Entry Point & Runner
// ============================================================================

export interface ParsedCliArgs {
  dryRun: boolean;
  verbose: boolean;
  force: boolean;
  commit?: string;
  base?: string;
  url?: string;
  secret?: string;
  help?: boolean;
}

export function parseCliArgs(argv: string[]): ParsedCliArgs {
  const args = argv.slice(2);
  const result: ParsedCliArgs = {
    dryRun: false,
    verbose: false,
    force: false,
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === "--dry-run") {
      result.dryRun = true;
    } else if (arg === "--verbose" || arg === "-v") {
      result.verbose = true;
    } else if (arg === "--force") {
      result.force = true;
    } else if (arg === "--help" || arg === "-h") {
      result.help = true;
    } else if (arg === "--commit" && i + 1 < args.length) {
      result.commit = args[++i];
    } else if (arg === "--base" && i + 1 < args.length) {
      result.base = args[++i];
    } else if (arg === "--url" && i + 1 < args.length) {
      result.url = args[++i];
    } else if (arg === "--secret" && i + 1 < args.length) {
      result.secret = args[++i];
    }
  }

  if (process.env.DRY_RUN === "true") result.dryRun = true;
  if (process.env.VERBOSE === "true") result.verbose = true;
  if (process.env.FORCE_RELEASE === "true") result.force = true;

  return result;
}

export async function main(argv: string[] = process.argv): Promise<number> {
  const cliArgs = parseCliArgs(argv);

  if (cliArgs.help) {
    console.log(`
System Simulator — GitOps Episode Release Detector

Usage:
  npx tsx scripts/detect-new-episodes.ts [options]

Options:
  --dry-run          Simulate detection and payload signing without HTTP dispatch
  --commit <sha>     Explicit commit SHA to associate with detected releases (defaults to HEAD)
  --base <ref>       Base Git reference or commit SHA to diff against (defaults to HEAD~1)
  --url <url>        Override APP_URL for release dispatch API
  --secret <secret>  Override INTERNAL_RELEASE_SECRET
  --force            Force dispatch even if episode was previously published
  --verbose, -v      Enable verbose logging
  --help, -h         Show this help message
`);
    return 0;
  }

  // 1. Resolve Git Commit SHAs
  let headSha = cliArgs.commit ?? process.env.HEAD_SHA ?? process.env.GITHUB_SHA;
  if (!headSha) {
    try {
      headSha = runGit(["rev-parse", "HEAD"]);
    } catch {
      headSha = "HEAD";
    }
  }

  let baseSha = cliArgs.base ?? process.env.BASE_SHA ?? process.env.GITHUB_BASE_REF;
  if (!baseSha || baseSha === "0000000000000000000000000000000000000000") {
    try {
      baseSha = runGit(["rev-parse", `${headSha}~1`]);
    } catch {
      // Empty tree SHA fallback
      baseSha = "4b825dc642cb6eb9a060e54bf8d69288fbee4904";
    }
  }

  console.log("==========================================================");
  console.log(" System Simulator GitOps Release Detection Engine");
  console.log(` Comparing Base: ${baseSha.slice(0, 7)} -> Head: ${headSha.slice(0, 7)}`);
  if (cliArgs.dryRun) console.log(" Mode: DRY-RUN (Network dispatch disabled)");
  console.log("==========================================================");

  // 2. Detect New Episode Releases
  const detectedReleases = detectNewEpisodes(baseSha, headSha, {
    baseUrl: cliArgs.url ?? process.env.APP_URL,
    force: cliArgs.force,
  });

  if (detectedReleases.length === 0) {
    console.log("[GitOps Detector] No new released episodes detected. Exiting cleanly (0).");
    try {
      fs.writeFileSync(
        "release-summary.md",
        "### Release Detection Summary\n\n- **Status**: No new released episodes detected.\n- **Base**: `" +
          baseSha.slice(0, 7) +
          "`\n- **Head**: `" +
          headSha.slice(0, 7) +
          "`\n",
        "utf8"
      );
    } catch {
      // Non-critical write
    }
    return 0;
  }

  console.log(
    `[GitOps Detector] Detected ${detectedReleases.length} newly released episode(s):`
  );
  for (const ep of detectedReleases) {
    console.log(
      `  - [${ep.subject}] #${ep.episodeNumber} ${ep.title} (ID: ${ep.episodeId})`
    );
  }

  // 3. Resolve Dispatch Configuration
  let config: DispatchConfig;
  try {
    config = resolveDispatchConfig({
      appUrl: cliArgs.url,
      secret: cliArgs.secret,
      dryRun: cliArgs.dryRun,
      verbose: cliArgs.verbose,
      force: cliArgs.force,
    });
  } catch (configErr) {
    console.error(
      `[GitOps Detector] Configuration error: ${configErr instanceof Error ? configErr.message : String(configErr)}`
    );
    return 1;
  }

  // 4. Transform to FanoutMessagePayload
  const payloads: FanoutMessagePayload[] = detectedReleases.map((ep) => ({
    subject: ep.subject,
    episodeId: ep.episodeId,
    episodeNumber: ep.episodeNumber,
    title: ep.title,
    releaseCommitSha: ep.releaseCommitSha,
    summary: ep.summary,
    keyConcepts: [] as string[],
    ctaUrl: ep.ctaUrl,
    force: Boolean(ep.force),
  }));

  // 5. Dispatch
  const { success, results } = await dispatchAllEpisodes(payloads, config);

  // Write step summary markdown for CI
  try {
    let md = `### Release Detection Summary\n\n`;
    md += `| Subject | Episode ID | Episode # | Title | Result | Attempts |\n`;
    md += `| :--- | :--- | :---: | :--- | :--- | :---: |\n`;
    for (const r of results) {
      const ep = detectedReleases.find((e) => e.episodeId === r.episodeId);
      const title = ep ? ep.title : r.episodeId;
      const epNum = ep ? ep.episodeNumber : "-";
      const status = r.success
        ? r.alreadyPublished
          ? "Skipped (Already Published)"
          : "Queued (200 OK)"
        : `Failed (${r.error ?? r.statusCode})`;
      md += `| \`${r.subject}\` | \`${r.episodeId}\` | ${epNum} | ${title} | ${status} | ${r.attempts} |\n`;
    }
    fs.writeFileSync("release-summary.md", md, "utf8");
  } catch {
    // Non-critical write
  }

  return success ? 0 : 1;
}

// Direct CLI Execution
if (
  process.argv[1] &&
  (pathToFileURL(process.argv[1]).href === import.meta.url ||
    path.resolve(process.argv[1]) === path.resolve("scripts/detect-new-episodes.ts"))
) {
  main().then((exitCode) => {
    if (exitCode !== 0) {
      process.exit(exitCode);
    }
  });
}
