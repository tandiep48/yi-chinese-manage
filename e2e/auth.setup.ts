import { test as setup, expect } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";
import { AUTH_FILE, E2E_USERNAME, E2E_PASSWORD, hasCreds } from "./helpers/auth";

/**
 * Logs in a test learner through the real login form and caches the session as
 * storage state, so the authenticated responsive checks don't each re-login.
 * Skipped when no E2E_USERNAME / E2E_PASSWORD are set (public checks still run).
 * Requires the Flask backend on :5000.
 */
setup("authenticate learner", async ({ page }) => {
  setup.skip(!hasCreds, "Set E2E_USERNAME and E2E_PASSWORD to check auth routes");

  await page.goto("/learner/login");
  await page.getByRole("textbox", { name: "Username" }).fill(E2E_USERNAME);
  await page.getByLabel("Password").fill(E2E_PASSWORD);
  await page.getByRole("button", { name: "Log In" }).click();

  // Landed on the dashboard and the signed-in chrome is present.
  await page.waitForURL("**/learner");
  await expect(page.getByRole("button", { name: /log ?out/i })).toBeVisible({
    timeout: 15_000,
  });

  fs.mkdirSync(path.dirname(AUTH_FILE), { recursive: true });
  await page.context().storageState({ path: AUTH_FILE });
});
