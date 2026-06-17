# OWASP Top 10 — Coverage Map

Last reviewed: Phase 8 implementation

| OWASP Risk | Status | How we address it |
|---|---|---|
| A01 Broken Access Control | ✅ | `requireAuth()` on all API routes. `requireDiagramOwnership()` prevents IDOR — returns 404 not 403 to avoid revealing existence. Route protection in `middleware.ts`. |
| A02 Cryptographic Failures | ✅ | Auth.js manages tokens. HSTS header (enable after SSL). No sensitive data in localStorage. Passwords never handled — OAuth only. |
| A03 Injection | ✅ | Prisma uses parameterized queries — no raw SQL. `sanitizeLabel()` + `sanitizeMetadata()` strip HTML/JS from all user inputs. Zod validates all API payloads before touching the database. |
| A04 Insecure Design | ✅ | Auth architecture designed from Phase 1 (serializable commands for collab). Threat model documented here. Defense-in-depth: 5 layers. |
| A05 Security Misconfiguration | ✅ | `src/lib/env.ts` validates all env vars at build time — app refuses to start with weak/missing config. `X-Powered-By` stripped in middleware. Security headers on every route. |
| A06 Vulnerable Components | ⚠️ | Run `npm audit` before each release. Dependabot alerts enabled in GitHub. No known vulnerabilities at Phase 8 implementation. |
| A07 Identification & Authentication Failures | ✅ | Auth.js handles sessions. Rate limiting on `/api/auth` routes (10 req/min). OAuth-only — no password storage. Session invalidation on sign-out. |
| A08 Software & Data Integrity Failures | ✅ | CSP blocks unsigned scripts. `deserializeDiagram()` validates every imported file with Zod before applying to canvas. No dynamic `eval()` in production. |
| A09 Security Logging & Monitoring | ⚠️ | Middleware logs 429 rate limit hits. API errors logged server-side. TODO: integrate structured logging (Pino/Axiom) in Phase 9. |
| A10 SSRF | ✅ | No server-side URL fetching based on user input. Diagram imports are file uploads parsed as JSON — no network requests triggered by import data. |

## Additional hardening (beyond OWASP Top 10)

- **Clickjacking**: `X-Frame-Options: DENY` + CSP `frame-ancestors 'none'`
- **MIME sniffing**: `X-Content-Type-Options: nosniff`
- **Open redirect**: `redirect` callback in Auth.js only allows same-origin redirects
- **Referrer leakage**: `Referrer-Policy: strict-origin-when-cross-origin`
- **CSRF**: Auth.js generates CSRF tokens automatically for all form submissions
- **XSS**: CSP nonce per request + React's built-in HTML escaping + DOMPurify on input
- **Prototype pollution**: Zod parsing rejects unexpected keys before they reach Prisma
