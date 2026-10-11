import { test } from "@playwright/test";
import { expectNoHorizontalOverflow, gotoAndSettle } from "./helpers/overflow";
import { AUTH_ROUTES } from "./helpers/routes";
import { AUTH_FILE, hasCreds } from "./helpers/auth";

/**
 * Authenticated learner routes must not overflow the viewport at any configured
 * width. Reuses the cached learner session from auth.setup.ts. Skipped unless
 * E2E_USERNAME / E2E_PASSWORD are set (and the Flask backend on :5000 is up).
 */
test.skip(!hasCreds, "Set E2E_USERNAME and E2E_PASSWORD to check auth routes");
test.use({ storageState: AUTH_FILE });

for (const route of AUTH_ROUTES) {
  test(`no horizontal overflow: ${route}`, async ({ page }, testInfo) => {
    await gotoAndSettle(page, route);
    await expectNoHorizontalOverflow(page, `${route} @ ${testInfo.project.name}`);
  });
}
