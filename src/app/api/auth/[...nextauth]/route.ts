/**
 * Auth.js route handler.
 * Handles all /api/auth/* routes: sign-in, sign-out, callback, CSRF, session.
 * Auth.js generates CSRF tokens automatically — we don't need manual CSRF
 * middleware for routes going through this handler.
 */
import { handlers } from "@/lib/auth/auth";
export const { GET, POST } = handlers;
