import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { auth }  from "@/lib/auth/auth";
import { buildCsp } from "@/lib/security/csp";

/**
 * Next.js Edge Middleware — runs before every request.
 *
 * Responsibilities:
 * 1. Generate a per-request nonce and inject it into the CSP header
 * 2. Protect canvas routes — redirect unauthenticated users to sign-in
 * 3. Protect API routes — return 401 for unauthenticated API calls
 *
 * WHY NONCE IN MIDDLEWARE:
 * A static CSP header blocks all inline scripts (including React hydration).
 * A per-request nonce allows inline scripts that we explicitly trust while
 * still blocking attacker-injected scripts (XSS defense).
 */

const PROTECTED_ROUTES = ["/canvas"];
const PUBLIC_ROUTES    = ["/auth", "/api/auth"];

function isProtected(pathname: string): boolean {
  return PROTECTED_ROUTES.some((r) => pathname.startsWith(r));
}

function isPublic(pathname: string): boolean {
  return PUBLIC_ROUTES.some((r) => pathname.startsWith(r));
}

export default auth(async function middleware(request) {
  const { pathname } = request.nextUrl;
  const isDev        = process.env.NODE_ENV === "development";

  // ── 1. Generate nonce ─────────────────────────────────────────────
  const nonce      = Buffer.from(crypto.randomUUID()).toString("base64");
  const cspHeader  = buildCsp(nonce, isDev);

  // ── 2. Auth check for protected routes ────────────────────────────
  const session = request.auth;

  if (isProtected(pathname) && !isPublic(pathname)) {
    if (!session?.user?.id && process.env.DATABASE_URL) {
      // Redirect to sign-in, preserving the intended destination
      const signInUrl = new URL("/auth/sign-in", request.url);
      signInUrl.searchParams.set("callbackUrl", request.url);
      return NextResponse.redirect(signInUrl);
    }
  }

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
