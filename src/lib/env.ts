import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

export const env = createEnv({
  server: {
    NODE_ENV:             z.enum(["development", "test", "production"]),

    // Database
    DATABASE_URL:         z.string().url().optional(),

    // Auth.js — generate with: openssl rand -base64 32
    AUTH_SECRET:          z.string().min(32, "AUTH_SECRET must be at least 32 chars"),
    AUTH_GITHUB_ID:       z.string().optional(),
    AUTH_GITHUB_SECRET:   z.string().optional(),
    AUTH_GOOGLE_ID:       z.string().optional(),
    AUTH_GOOGLE_SECRET:   z.string().optional(),

    // Rate limiting (Upstash Redis)
    UPSTASH_REDIS_REST_URL:   z.string().url().optional(),
    UPSTASH_REDIS_REST_TOKEN: z.string().optional(),

    // Yjs WebSocket
    YJS_WEBSOCKET_URL:    z.string().url().optional(),
  },
  client: {
    NEXT_PUBLIC_APP_URL:           z.string().url().optional(),
    NEXT_PUBLIC_COLLAB_ENABLED:    z
      .string()
      .transform((v) => v === "true")
      .optional()
      .default("false"),
    NEXT_PUBLIC_PERSISTENCE_MODE:  z
      .enum(["localStorage", "database"])
      .optional()
      .default("localStorage"),
  },
  runtimeEnv: {
    NODE_ENV:                     process.env.NODE_ENV,
    DATABASE_URL:                 process.env.DATABASE_URL,
    AUTH_SECRET:                  process.env.AUTH_SECRET,
    AUTH_GITHUB_ID:               process.env.AUTH_GITHUB_ID,
    AUTH_GITHUB_SECRET:           process.env.AUTH_GITHUB_SECRET,
    AUTH_GOOGLE_ID:               process.env.AUTH_GOOGLE_ID,
    AUTH_GOOGLE_SECRET:           process.env.AUTH_GOOGLE_SECRET,
    UPSTASH_REDIS_REST_URL:       process.env.UPSTASH_REDIS_REST_URL,
    UPSTASH_REDIS_REST_TOKEN:     process.env.UPSTASH_REDIS_REST_TOKEN,
    YJS_WEBSOCKET_URL:            process.env.YJS_WEBSOCKET_URL,
    NEXT_PUBLIC_APP_URL:          process.env.NEXT_PUBLIC_APP_URL,
    NEXT_PUBLIC_COLLAB_ENABLED:   process.env.NEXT_PUBLIC_COLLAB_ENABLED,
    NEXT_PUBLIC_PERSISTENCE_MODE: process.env.NEXT_PUBLIC_PERSISTENCE_MODE,
  },
});