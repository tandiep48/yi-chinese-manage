// @vitest-environment node
// tests/css/supportClearsTrainerBar.test.ts
// The floating Help button must sit above the milestone's bottom bar on phone
// trainer steps, where it otherwise covers Check / Skip.

import { readFileSync } from "node:fs";
import path from "node:path";
import postcss, { type AtRule, type Rule } from "postcss";
import { describe, expect, it } from "vitest";

const css = readFileSync(
  path.resolve(__dirname, "../../components/page/learner/support/support.css"),
  "utf8"
);

describe("support widget on trainer steps", () => {
  it("is lifted above the bar, on phones only", () => {
    let rule: Rule | undefined;
    postcss.parse(css).walkRules("body:has(.trainer-shell.compact) .support-widget", (found) => {
      rule = found;
    });
    expect(rule?.toString()).toContain("bottom: 6.75rem");
    expect((rule?.parent as AtRule).params).toBe("(max-width: 640px)");
  });
});
