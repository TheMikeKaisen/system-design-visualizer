import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  plugins: [react(), tsconfigPaths()],
  test: {
    environment: "happy-dom",
    globals: true,
    setupFiles: ["./src/__tests__/setup.ts"],
    include: ["src/**/*.{test,spec}.{ts,tsx}"],
    exclude: ["node_modules", ".next"],
    coverage: {
      provider: "v8",
      reporter: ["text", "lcov", "html"],
      reportsDirectory: "./coverage",
      exclude: [
        "**/*.d.ts",
        "**/*.config.*",
        "src/__tests__/setup.ts",
        "src/app/**",          // Next.js route files — test via e2e
        "src/components/ui/**", // Shadcn generated — don't test third-party
      ],
      // Enforce minimums — the build fails if you go below these
      thresholds: {
        lines: 70,
        functions: 70,
        branches: 65,
      },
    },
  },
});