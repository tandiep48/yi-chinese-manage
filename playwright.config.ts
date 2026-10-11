import { defineConfig, devices } from "@playwright/test";

/**
 * Playwright config for the learner responsive guard.
 *
 * These are end-to-end viewport checks, kept in `e2e/` and separate from the
 * Vitest unit suite (`npm test`). They drive a real browser at phone / tablet /
 * desktop widths and assert no learner page overflows its viewport.
 *
 * Requirements to run:
 *   - the Next dev server (reused if already on :3000, else started here)
 *   - the Flask backend on :5000 for the authenticated routes
 *   - E2E_USERNAME / E2E_PASSWORD env vars for a test learner (auth routes are
 *     skipped when these are absent, so the public checks still run in CI).
 */
const BASE_URL = process.env.E2E_BASE_URL ?? "http://localhost:3000";

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? "github" : "list",
  use: {
    baseURL: BASE_URL,
    trace: "on-first-retry",
  },
  projects: [
    { name: "setup", testMatch: /auth\.setup\.ts/ },
    {
      name: "mobile-393",
      use: { ...devices["Desktop Chrome"], viewport: { width: 393, height: 852 } },
      dependencies: ["setup"],
    },
    {
      name: "tablet-768",
      use: { ...devices["Desktop Chrome"], viewport: { width: 768, height: 1024 } },
      dependencies: ["setup"],
    },
    {
      name: "desktop-1280",
      use: { ...devices["Desktop Chrome"], viewport: { width: 1280, height: 900 } },
      dependencies: ["setup"],
    },
  ],
  webServer: {
    command: "npm run dev",
    url: BASE_URL,
    reuseExistingServer: true,
    timeout: 120_000,
  },
});
