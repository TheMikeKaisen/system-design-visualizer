import crypto from "node:crypto";

export interface SvixHeaders {
  "svix-id"?: string | null;
  "svix-timestamp"?: string | null;
  "svix-signature"?: string | null;
  [key: string]: string | null | undefined;
}

export interface VerifySvixSignatureOptions {
  payload: string;
  headers: SvixHeaders | Headers | Record<string, string | null | undefined>;
  secret: string;
  toleranceSeconds?: number;
}

export interface SvixVerificationResult {
  valid: boolean;
  error?: string;
}

function extractHeader(
  headers: VerifySvixSignatureOptions["headers"],
  name: string
): string | null {
  if (!headers) return null;
  if (typeof (headers as Headers).get === "function") {
    return (headers as Headers).get(name);
  }
  const record = headers as Record<string, string | null | undefined>;
  return record[name] ?? record[name.toLowerCase()] ?? null;
}

/**
 * Verifies a Svix / Resend webhook signature using constant-time HMAC-SHA256 comparison.
 * Implements anti-replay timestamp tolerance check (default 300s) and secret rotation support.
 */
export function verifySvixSignatureDetailed({
  payload,
  headers,
  secret,
  toleranceSeconds = 300,
}: VerifySvixSignatureOptions): SvixVerificationResult {
  if (!secret || typeof secret !== "string" || secret.trim().length === 0) {
    return { valid: false, error: "Missing or invalid secret" };
  }

  const svixId = extractHeader(headers, "svix-id");
  const svixTimestamp = extractHeader(headers, "svix-timestamp");
  const svixSignature = extractHeader(headers, "svix-signature");

  if (!svixId || !svixTimestamp || !svixSignature) {
    return { valid: false, error: "Missing required Svix headers" };
  }

  const timestampSeconds = parseInt(svixTimestamp, 10);
  if (Number.isNaN(timestampSeconds)) {
    return { valid: false, error: "Invalid Svix timestamp header" };
  }

  // Anti-replay: check timestamp tolerance window (default 5 minutes)
  const nowSeconds = Math.floor(Date.now() / 1000);
  if (Math.abs(nowSeconds - timestampSeconds) > toleranceSeconds) {
    return { valid: false, error: "Webhook timestamp outside tolerance window" };
  }

  // Strip 'whsec_' prefix if present and decode base64 secret bytes
  const cleanSecret = secret.startsWith("whsec_") ? secret.slice(6) : secret;
  let secretKey: Buffer;
  try {
    secretKey = Buffer.from(cleanSecret, "base64");
    if (secretKey.length === 0) {
      return { valid: false, error: "Decoded secret key is empty" };
    }
  } catch {
    return { valid: false, error: "Invalid secret key format" };
  }

  // Construct canonical payload to sign: `${svix_id}.${svix_timestamp}.${raw_body}`
  const toSign = `${svixId}.${svixTimestamp}.${payload}`;
  const computedHmac = crypto
    .createHmac("sha256", secretKey)
    .update(toSign)
    .digest();

  // svix-signature may contain multiple space-delimited signatures (e.g. during key rotation)
  const candidateEntries = svixSignature.split(" ").map((s) => s.trim()).filter(Boolean);
  for (const entry of candidateEntries) {
    const [version, signatureValue] = entry.split(",");
    if (version !== "v1" || !signatureValue) {
      continue;
    }

    try {
      const candidateBuffer = Buffer.from(signatureValue, "base64");
      if (
        candidateBuffer.length === computedHmac.length &&
        crypto.timingSafeEqual(candidateBuffer, computedHmac)
      ) {
        return { valid: true };
      }
    } catch {
      // Continue inspecting other candidate signatures in case of key rotation
      continue;
    }
  }

  return { valid: false, error: "Signature mismatch" };
}

/**
 * Convenience boolean predicate for Svix signature verification.
 */
export function verifySvixSignature(options: VerifySvixSignatureOptions): boolean {
  return verifySvixSignatureDetailed(options).valid;
}
