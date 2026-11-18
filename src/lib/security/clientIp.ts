/**
 * Client IP extraction utility for rate limiting and audit logging.
 *
 * Extracts the real client IP from incoming Next.js requests across
 * common reverse proxy environments (Vercel, Cloudflare, AWS CloudFront, Nginx).
 *
 * Defensive by design: zero external dependencies, falls back to "unknown" rather than throwing.
 */

export function getClientIp(request: Request): string {
  // Cloudflare
  const cfIp = request.headers.get("cf-connecting-ip");
  if (cfIp) return cfIp.trim();

  // Nginx / Vercel single-hop proxy
  const xReal = request.headers.get("x-real-ip");
  if (xReal) return xReal.trim();

  // Standard multi-hop proxy header (take the leftmost client IP)
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    const firstIp = forwarded.split(",")[0]?.trim();
    if (firstIp) return firstIp;
  }

  return "unknown";
}

