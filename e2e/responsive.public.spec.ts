import { test } from "@playwright/test";
import { expectNoHorizontalOverflow, gotoAndSettle } from "./helpers/overflow";
import { PUBLIC_ROUTES } from "./helpers/routes";

/**
 * Public learner routes must not overflow the viewport at any configured width
 * (project viewports: 393 / 768 / 1280). No login required.
 */
for (const route of PUBLIC_ROUTES) {
  test(`no horizontal overflow: ${route}`, async ({ page }, testInfo) => {
    await gotoAndSettle(page, route);
    await expectNoHorizontalOverflow(page, `${route} @ ${testInfo.project.name}`);
  });
}
