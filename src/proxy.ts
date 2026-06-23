import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { auth }  from "@/lib/auth/auth";
import { buildCsp } from "@/lib/security/csp";

/**
 * Next.js Edge Middleware — runs before every request.
 *
 * Responsibilities:
 * 1. Generate a per-request nonce and inject it into the CSP header
 * 2. (No hard auth gate) — the canvas is publicly accessible.
 *    Authentication is optional and surfaces as a soft prompt inside the app.
 *    Collaboration features gate themselves client-side via CollabProvider.
 *
 * WHY NONCE IN MIDDLEWARE:
 * A static CSP header blocks all inline scripts (including React hydration).
 * A per-request nonce allows inline scripts that we explicitly trust while
 * still blocking attacker-injected scripts (XSS defense).
 *
 * WHY NO AUTH REDIRECT HERE:
 * Guest users should be able to open the canvas, drop nodes, and run the
 * simulation without an account. localStorage handles persistence. Sign-in
 * is prompted only when a feature requires a server identity (collaboration,
 * cloud save). Blocking the canvas entirely kills user activation.
 */

export default auth(async function middleware(request) {
  const { pathname } = request.nextUrl;
  const isDev        = process.env.NODE_ENV === "development";

  // ── 1. Generate nonce ─────────────────────────────────────────────
  const nonce      = Buffer.from(crypto.randomUUID()).toString("base64");
  const cspHeader  = buildCsp(nonce, isDev);

  // ── 2. No hard auth gate — canvas is publicly accessible.
  //    Collaboration and cloud-save features gate themselves client-side.

  // ── 3. Build response with security headers ───────────────────────
  const response = NextResponse.next({
    request: {
      headers: new Headers({
        ...Object.fromEntries(request.headers),
        "x-nonce": nonce, // Pass nonce to server components
      }),
    },
  });

  // Inject CSP + nonce into the response
  response.headers.set("Content-Security-Policy", cspHeader);

  // Remove the X-Powered-By header — don't advertise the framework
  response.headers.delete("X-Powered-By");

  return response;
});

export const config = {
  /**
   * Run middleware on all routes EXCEPT:
   * - _next/static (static files)
   * - _next/image (image optimization)
   * - favicon.ico
   * - Public assets
   *
   * The negative lookahead prevents middleware running on static assets
   * which would waste compute and can't benefit from auth checks.
   */
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
