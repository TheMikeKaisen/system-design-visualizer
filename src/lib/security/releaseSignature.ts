import crypto from "node:crypto";

export interface ReleaseSignatureHeaders {
  "x-release-signature"?: string | null;
  "x-release-timestamp"?: string | null;
  [key: string]: string | null | undefined;
}

export interface VerifyReleaseSignatureOptions {
  payload: string;
  headers: ReleaseSignatureHeaders | Headers | Record<string, string | null | undefined>;
  secret: string;
  toleranceSeconds?: number; // Defaults to 300 (5 minutes)
  now?: number;              // Optional timestamp injection for deterministic unit testing
}

export interface ReleaseVerificationResult {
  valid: boolean;
  status: 200 | 400 | 401 | 500;
  error?: string;
  timestampMs?: number;
}

export interface TimestampValidationResult {
  valid: boolean;
  status: 200 | 400 | 401;
  error?: string;
  timestampMs?: number;
}

export interface ComputeReleaseSignatureOptions {
  payload: string;
  secret: string;
  timestamp?: string | number | null;
  bound?: boolean;
  prefix?: boolean;
}

/**
 * Robust case-insensitive header lookup across Headers instances and plain objects.
 */
export function extractHeader(
  headers: VerifyReleaseSignatureOptions["headers"],
  name: string
): string | null {
  if (!headers) return null;
  if (typeof (headers as Headers).get === "function") {
    return (headers as Headers).get(name);
  }
  const record = headers as Record<string, string | null | undefined>;
  const lowerName = name.toLowerCase();
  for (const [key, val] of Object.entries(record)) {
    if (key.toLowerCase() === lowerName && val != null) {
      return String(val);
    }
  }
  return null;
}

/**
 * Robust timestamp parser supporting:
 * 1. ISO-8601 strings (e.g. "2026-11-01T12:00:00.000Z")
 * 2. Epoch in seconds (e.g. "1730462400", 10 digits)
 * 3. Epoch in milliseconds (e.g. "1730462400000", 13 digits)
 * Returns epoch in milliseconds, or null if invalid/negative.
 */
export function parseTimestamp(input: string | number | null | undefined): number | null {
  if (input === null || input === undefined) return null;

  if (typeof input === "number") {
    if (Number.isNaN(input) || !Number.isFinite(input) || input < 0) return null;
    return input < 100_000_000_000 ? Math.floor(input * 1000) : Math.floor(input);
  }

  if (typeof input !== "string") return null;
  const trimmed = input.trim();
  if (trimmed.length === 0) return null;

  // Purely numeric string (epoch)
  if (/^-?\d+$/.test(trimmed)) {
    const num = parseInt(trimmed, 10);
    if (Number.isNaN(num) || !Number.isFinite(num) || num < 0) return null;
    return trimmed.length <= 10 ? num * 1000 : num;
  }

  // ISO-8601 / RFC 2822
  const parsed = Date.parse(trimmed);
  if (Number.isNaN(parsed) || parsed < 0) return null;
  return parsed;
}

/**
 * Validates timestamp anti-replay window against current time.
 * Tolerance is +- toleranceSeconds (default: 300s / 5 minutes).
 */
export function validateReleaseTimestamp(
  timestampHeader: string | null | undefined,
  toleranceSeconds: number = 300,
  nowMs: number = Date.now()
): TimestampValidationResult {
  if (!timestampHeader || timestampHeader.trim().length === 0) {
    return {
      valid: false,
      status: 400,
      error: "Missing required x-release-timestamp header",
    };
  }

  const parsedTimestampMs = parseTimestamp(timestampHeader);
  if (parsedTimestampMs === null) {
    return {
      valid: false,
      status: 400,
      error: "Invalid x-release-timestamp format: expected ISO-8601 string or numeric epoch timestamp",
    };
  }

  const diffMs = nowMs - parsedTimestampMs;
  const toleranceMs = toleranceSeconds * 1000;

  if (diffMs > toleranceMs) {
    return {
      valid: false,
      status: 401,
      error: "Timestamp expired / replay detected: request timestamp is older than tolerance window (5 minutes)",
      timestampMs: parsedTimestampMs,
    };
  }

  if (diffMs < -toleranceMs) {
    return {
      valid: false,
      status: 401,
      error: "Timestamp in the future: clock skew exceeds tolerance window (5 minutes)",
      timestampMs: parsedTimestampMs,
    };
  }

  return {
    valid: true,
    status: 200,
    timestampMs: parsedTimestampMs,
  };
}

/**
 * Constant-time comparison using crypto.timingSafeEqual with mandatory buffer length check.
 * Prevents RangeError exceptions when candidate signature length !== 32 bytes.
 */
function constantTimeHexEqual(candidateHex: string, expectedHex: string): boolean {
  try {
    const candidateBuf = Buffer.from(candidateHex, "hex");
    const expectedBuf = Buffer.from(expectedHex, "hex");

    if (candidateBuf.length !== expectedBuf.length) {
      return false;
    }

    return crypto.timingSafeEqual(candidateBuf, expectedBuf);
  } catch {
    return false;
  }
}

/**
 * Computes an HMAC-SHA256 hex digest for a given payload and secret.
 * Exported for test suites and GitOps release dispatch scripts.
 */
export function computeReleaseSignature({
  payload,
  secret,
  timestamp,
  bound,
  prefix = true,
}: ComputeReleaseSignatureOptions): string {
  const shouldBind = bound !== false && timestamp !== undefined && timestamp !== null;
  const toSign = shouldBind ? `${timestamp}.${payload}` : payload;
  const hex = crypto.createHmac("sha256", secret).update(toSign, "utf8").digest("hex");
  return prefix ? `sha256=${hex}` : hex;
}

/**
 * Verifies HMAC-SHA256 release signature with constant-time equality check
 * and anti-replay timestamp validation window.
 */
export function verifyReleaseSignatureDetailed({
  payload,
  headers,
  secret,
  toleranceSeconds = 300,
  now = Date.now(),
}: VerifyReleaseSignatureOptions): ReleaseVerificationResult {
  // 1. Server Secret Guard
  if (!secret || typeof secret !== "string" || secret.trim().length === 0) {
    return {
      valid: false,
      status: 500,
      error: "Internal release secret is not configured on this server",
    };
  }

  // 2. Anti-Replay Timestamp Validation
  const rawTimestamp = extractHeader(headers, "x-release-timestamp");
  const timestampValidation = validateReleaseTimestamp(rawTimestamp, toleranceSeconds, now);
  if (!timestampValidation.valid) {
    return {
      valid: false,
      status: timestampValidation.status,
      error: timestampValidation.error,
      timestampMs: timestampValidation.timestampMs,
    };
  }

  // 3. Signature Header Extraction
  const rawSignature = extractHeader(headers, "x-release-signature");
  if (!rawSignature || rawSignature.trim().length === 0) {
    return {
      valid: false,
      status: 401,
      error: "Missing required x-release-signature header",
      timestampMs: timestampValidation.timestampMs,
    };
  }

  // 4. Compute Expected Bound Hash (${timestamp}.${payload})
  // Strictly enforce timestamp binding into HMAC-SHA256 to prevent HMAC anti-replay bypass (SEC-04)
  const trimmedTimestamp = rawTimestamp ? rawTimestamp.trim() : "";
  const expectedBoundHex = trimmedTimestamp
    ? crypto
        .createHmac("sha256", secret)
        .update(`${trimmedTimestamp}.${payload}`, "utf8")
        .digest("hex")
        .toLowerCase()
    : null;

  if (!expectedBoundHex) {
    return {
      valid: false,
      status: 401,
      error: "Missing required x-release-timestamp header for bound signature verification",
      timestampMs: timestampValidation.timestampMs,
    };
  }

  // 5. Parse Candidate Signatures (supports rotation: multiple space/comma separated signatures)
  const candidateEntries = rawSignature
    .split(/[\s,]+/)
    .map((s) => s.trim())
    .filter(Boolean);

  let validHexFormatCount = 0;

  for (const entry of candidateEntries) {
    let cleanHex = entry;
    if (cleanHex.toLowerCase().startsWith("sha256=")) {
      cleanHex = cleanHex.slice(7).trim();
    }

    // SHA-256 digest in hex must be exactly 64 hexadecimal characters
    if (!/^[0-9a-fA-F]{64}$/.test(cleanHex)) {
      continue;
    }

    validHexFormatCount++;
    const candidateLower = cleanHex.toLowerCase();

    // Constant-time check against timestamp-bound digest (SEC-04)
    if (constantTimeHexEqual(candidateLower, expectedBoundHex)) {
      return {
        valid: true,
        status: 200,
        timestampMs: timestampValidation.timestampMs,
      };
    }
  }

  // If no candidate signatures had a valid 64-hex format
  if (validHexFormatCount === 0) {
    return {
      valid: false,
      status: 401,
      error: "Invalid signature format: expected 64-character hex digest",
      timestampMs: timestampValidation.timestampMs,
    };
  }

  return {
    valid: false,
    status: 401,
    error: "Signature mismatch",
    timestampMs: timestampValidation.timestampMs,
  };
}

/**
 * Convenience boolean predicate.
 */
export function verifyReleaseSignature(options: VerifyReleaseSignatureOptions): boolean {
  return verifyReleaseSignatureDetailed(options).valid;
}
