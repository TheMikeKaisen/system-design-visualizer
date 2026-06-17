import NextAuth from "next-auth";
import GitHub   from "next-auth/providers/github";
import Google   from "next-auth/providers/google";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma }        from "@/lib/db";
import { env }           from "@/lib/env";

/**
 * Auth.js v5 configuration.
 *
 * Providers: GitHub + Google OAuth (add more as needed — pattern is identical).
 * Adapter:   PrismaAdapter so sessions and users persist in Postgres.
 *            Falls back to JWT sessions if DATABASE_URL is unset (localStorage mode).
 *
 * SECURITY DECISIONS:
 * - session.strategy "database" when DB available — server-side sessions are
 *   harder to hijack than JWTs (no token exposure in the browser).
 * - session.maxAge 30 days — reasonable for a productivity tool.
 * - Callbacks strip sensitive fields before sending to the client.
 */
export const { handlers, auth, signIn, signOut } = NextAuth({
  ...(env.DATABASE_URL ? { adapter: PrismaAdapter(prisma) } : {}),

  providers: [
    ...(env.AUTH_GITHUB_ID && env.AUTH_GITHUB_SECRET
      ? [GitHub({
          clientId:     env.AUTH_GITHUB_ID,
          clientSecret: env.AUTH_GITHUB_SECRET,
        })]
      : []),
    ...(env.AUTH_GOOGLE_ID && env.AUTH_GOOGLE_SECRET
      ? [Google({
          clientId:     env.AUTH_GOOGLE_ID,
          clientSecret: env.AUTH_GOOGLE_SECRET,
        })]
      : []),
  ],

  session: {
    strategy: env.DATABASE_URL ? "database" : "jwt",
    maxAge:   30 * 24 * 60 * 60, // 30 days
  },

  callbacks: {
    /**
     * Attach userId to the session so API routes can read it via auth().
     * NEVER put sensitive fields (password hashes, tokens) in the session.
     */
    async session({ session, user, token }) {
      if (user?.id)   session.user.id = user.id;
      if (token?.sub) session.user.id = token.sub;
      return session;
    },

    /**
     * Control which URLs we accept as redirect targets after sign-in.
     * Only allow redirects to our own origin — prevents open redirect attacks.
     */
    async redirect({ url, baseUrl }) {
      if (url.startsWith("/"))           return `${baseUrl}${url}`;
      if (new URL(url).origin === baseUrl) return url;
      return baseUrl;
    },
  },

  pages: {
    signIn:  "/auth/sign-in",
    error:   "/auth/error",
    signOut: "/auth/sign-out",
  },

  secret: env.AUTH_SECRET,

  // Trust the X-Forwarded-Host header — required when behind a reverse proxy
  trustHost: true,
});

// ─────────────────────────────────────────────
// Session type augmentation
// ─────────────────────────────────────────────

declare module "next-auth" {
  interface Session {
    user: {
      id:    string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
    };
  }
}
