import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

/**
 * Validates all environment variables at build time.
 * The app throws a descriptive error at startup if any required variable
 * is missing or has the wrong shape — rather than silently failing at runtime.
 *
 * Add variables here as you introduce features. Never read process.env directly
 * elsewhere in the codebase — always import from this file.
 */
export const env = createEnv({
  server: {
    // Yjs WebSocket server URL (optional for dev, required for production)
    YJS_WEBSOCKET_URL: z.string().url().optional(),
    // Node environment
    NODE_ENV: z.enum(["development", "test", "production"]),
  },
  client: {
    // Public-facing variables — must be prefixed NEXT_PUBLIC_
    NEXT_PUBLIC_APP_URL: z.string().url().optional(),
    NEXT_PUBLIC_COLLAB_ENABLED: z
      .string()
      .optional()
      .default("false")
      .transform((v) => v === "true"),
  },
  runtimeEnv: {
    YJS_WEBSOCKET_URL: process.env.YJS_WEBSOCKET_URL,
    NODE_ENV: process.env.NODE_ENV,
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
    NEXT_PUBLIC_COLLAB_ENABLED: process.env.NEXT_PUBLIC_COLLAB_ENABLED,
  },
});