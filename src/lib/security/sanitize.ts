/**
 * Input sanitization utilities.
 *
 * Rule: sanitize on the way IN (before storing), validate schema on the way IN,
 * and always escape on the way OUT (React handles this automatically for JSX).
 *
 * DOMPurify removes XSS vectors from HTML strings.
 * We use isomorphic-dompurify so this also works in server components / API routes.
 */
import DOMPurify from "isomorphic-dompurify";

// ─────────────────────────────────────────────
// Text fields (node labels, diagram names)
// ─────────────────────────────────────────────

const MAX_LABEL_LENGTH    = 100;
const MAX_NAME_LENGTH     = 200;
const MAX_METADATA_LENGTH = 500;

/**
 * Sanitizes a user-provided label for a diagram node.
 * - Strips HTML tags (prevents XSS if a label is ever rendered as HTML)
 * - Trims whitespace
 * - Enforces max length
 */
export function sanitizeLabel(raw: unknown): string {
  if (typeof raw !== "string") return "";
  const stripped = DOMPurify.sanitize(raw, { ALLOWED_TAGS: [] }).trim();
  return stripped.slice(0, MAX_LABEL_LENGTH);
}

/**
 * Sanitizes a diagram name (used in file downloads and browser title).
 */
export function sanitizeDiagramName(raw: unknown): string {
  if (typeof raw !== "string") return "Untitled diagram";
  const stripped = DOMPurify.sanitize(raw, { ALLOWED_TAGS: [] }).trim();
  const sanitized = stripped.replace(/[<>:"\/\\|?*\x00-\x1F]/g, ""); // Remove filename-unsafe chars
  return sanitized.slice(0, MAX_NAME_LENGTH) || "Untitled diagram";
}

/**
 * Sanitizes a metadata string value.
 */
export function sanitizeMetadataValue(raw: unknown): string {
  if (typeof raw !== "string" && typeof raw !== "number") return "";
  const str = String(raw).trim();
  return DOMPurify.sanitize(str, { ALLOWED_TAGS: [] }).slice(0, MAX_METADATA_LENGTH);
}

/**
 * Sanitizes the full metadata record on a node.
 * Applies sanitizeMetadataValue to every string value.
 */
export function sanitizeMetadata(
  raw: Record<string, unknown>
): Record<string, string | number | boolean> {
  const result: Record<string, string | number | boolean> = {};
  for (const [key, value] of Object.entries(raw)) {
    if (typeof value === "boolean") {
      result[key] = value;
    } else if (typeof value === "number") {
      result[key] = isFinite(value) ? value : 0;
    } else {
      result[key] = sanitizeMetadataValue(value);
    }
  }
  return result;
}

// ─────────────────────────────────────────────
// IP extraction (for rate limiting)
// ─────────────────────────────────────────────

/**
 * Extracts the real client IP from a Next.js request.
 * Handles common reverse proxy setups (Vercel, Cloudflare, Nginx).
 * Falls back to "unknown" rather than throwing.
 */
export function getClientIp(request: Request): string {
  // Vercel / Cloudflare
  const cfIp  = request.headers.get("cf-connecting-ip");
  if (cfIp) return cfIp;

  const xReal = request.headers.get("x-real-ip");
  if (xReal) return xReal;

  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();

  return "unknown";
}
