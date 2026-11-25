// @vitest-environment node
// tests/css/competitionPalette.test.ts
// Learn Together wears the milestone trainers' palette through the shared learner
// tokens; the old sage colours must not come back.

import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const read = (name: string) =>
  readFileSync(path.resolve(__dirname, "../../components/page/learner/competition", name), "utf8");

const SAGE = /#576856|#455544|#738a72|#90a496|rgba\(87, 104, 86/i;

describe("Learn Together palette", () => {
  it.each(["competition-shell.css", "competition-trainer.css", "competition-multiselect.css"])(
    "%s has no sage colours",
    (name) => {
      expect(read(name)).not.toMatch(SAGE);
    }
  );

  it("takes its accent and text colour from the learner theme", () => {
    const shell = read("competition-shell.css");
    expect(shell).toContain("--primary: var(--learner-nav);");
    expect(shell).toContain("--text-main: var(--learner-ink);");
  });
});
