/**
 * Content Security Policy builder.
 *
 * In development we allow 'unsafe-eval' for React Fast Refresh.
 * In production all scripts must come from our own origin or the explicit allowlist.
 *
 * ARCHITECTURE NOTE:
 * We generate a nonce per-request in Next.js Middleware and inject it into
 * the CSP header. This allows inline scripts (React hydration) while blocking
 * injected scripts (XSS). The nonce is passed to the layout via headers.
 */

const SELF     = "'self'";
const NONE     = "'none'";
const DATA     = "data:";
const BLOB     = "blob:";

// Hosts we load assets from — CDNs for fonts, icons, etc.
const FONT_HOSTS  = ["https://fonts.googleapis.com", "https://fonts.gstatic.com"];
const SCRIPT_CDNS = ["https://cdnjs.cloudflare.com"];

export function buildCsp(nonce: string, isDev: boolean): string {
  const scriptSrc = isDev
    ? [SELF, `'unsafe-inline'`, `'unsafe-eval'`, ...SCRIPT_CDNS]
    : [SELF, `'unsafe-inline'`, ...SCRIPT_CDNS];

  const directives: Record<string, string[]> = {
    "default-src":      [SELF],
    "script-src":       scriptSrc,
    "style-src":        [SELF, "'unsafe-inline'", ...FONT_HOSTS],
    "font-src":         [SELF, DATA, ...FONT_HOSTS],
    "img-src":          [SELF, DATA, BLOB, "https:"],
    "connect-src":      [
      SELF,
      "wss:",           // WebSockets (y-webrtc signaling, y-websocket)
      "ws:",            // Dev WebSocket HMR
      "https://signaling.yjs.dev",
      "https://*.upstash.io",   // Upstash Redis (rate limiter)
    ],
    "worker-src":       [SELF, BLOB],
    "frame-ancestors":  [NONE],
    "form-action":      [SELF],
    "base-uri":         [SELF],
    "object-src":       [NONE],
    "upgrade-insecure-requests": [],
  };

  return Object.entries(directives)
    .map(([key, values]) =>
      values.length > 0 ? `${key} ${values.join(" ")}` : key
    )
    .join("; ");
}
