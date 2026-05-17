import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

export const env = createEnv({
  server: {
    NODE_ENV:            z.enum(["development", "test", "production"]),
    YJS_WEBSOCKET_URL:   z.string().url().optional(),
    DATABASE_URL:        z.string().url().optional(),
  },
  client: {
    NEXT_PUBLIC_APP_URL:           z.string().url().optional(),
    NEXT_PUBLIC_COLLAB_ENABLED:    z
      .string()
      .optional()
      .default("false")
      .transform((v) => v === "true"),
    NEXT_PUBLIC_PERSISTENCE_MODE:  z
      .enum(["localStorage", "database"])
      .optional()
      .default("localStorage"),
  },
  runtimeEnv: {
    NODE_ENV:                      process.env.NODE_ENV,
    YJS_WEBSOCKET_URL:             process.env.YJS_WEBSOCKET_URL,
    DATABASE_URL:                  process.env.DATABASE_URL,
    NEXT_PUBLIC_APP_URL:           process.env.NEXT_PUBLIC_APP_URL,
    NEXT_PUBLIC_COLLAB_ENABLED:    process.env.NEXT_PUBLIC_COLLAB_ENABLED,
    NEXT_PUBLIC_PERSISTENCE_MODE:  process.env.NEXT_PUBLIC_PERSISTENCE_MODE,
  },
});