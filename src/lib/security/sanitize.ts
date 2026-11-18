/**
 * Input sanitization utilities.
 *
 * Rule: sanitize on the way IN (before storing), validate schema on the way IN,
 * and always escape on the way OUT (React handles this automatically for JSX).
 *
 * Zero-dependency pure string sanitizer:
 * Strips active script/style blocks, HTML tags, and control characters without
 * invoking heavy DOM implementations (e.g. jsdom) that break under serverless runtimes.
 */

export { getClientIp } from "./clientIp";

// ─────────────────────────────────────────────
// Text fields (node labels, diagram names)
// ─────────────────────────────────────────────

const MAX_LABEL_LENGTH    = 100;
const MAX_NAME_LENGTH     = 200;
const MAX_METADATA_LENGTH = 500;

/**
 * Strips HTML elements, active script/style tags, and event payloads from text.
 */
function stripHtmlTags(input: string): string {
  return input
    // Strip active executable tags along with their inner contents
    .replace(/<(script|style|svg|noscript)\b[^>]*>[\s\S]*?<\/\1>/gi, "")
    // Strip any dangling or self-closing executable tags
    .replace(/<(script|style|svg|noscript)\b[^>]*\/?>/gi, "")
    // Strip all remaining HTML tags
    .replace(/<[^>]*>/g, "");
}

/**
 * Sanitizes a user-provided label for a diagram node.
 * - Strips HTML tags (prevents XSS if a label is ever rendered as HTML)
 * - Trims whitespace
 * - Enforces max length
 */
export function sanitizeLabel(raw: unknown): string {
  if (typeof raw !== "string") return "";
  const stripped = stripHtmlTags(raw).trim();
  return stripped.slice(0, MAX_LABEL_LENGTH);
}

/**
 * Sanitizes a diagram name (used in file downloads and browser title).
 */
export function sanitizeDiagramName(raw: unknown): string {
  if (typeof raw !== "string") return "Untitled diagram";
  const stripped = stripHtmlTags(raw).trim();
  const sanitized = stripped.replace(/[<>:"\/\\|?*\x00-\x1F]/g, ""); // Remove filename-unsafe chars
  return sanitized.slice(0, MAX_NAME_LENGTH) || "Untitled diagram";
}

/**
 * Sanitizes a metadata string value.
 */
export function sanitizeMetadataValue(raw: unknown): string {
  if (typeof raw !== "string" && typeof raw !== "number") return "";
  const str = String(raw).trim();
  return stripHtmlTags(str).slice(0, MAX_METADATA_LENGTH);
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
