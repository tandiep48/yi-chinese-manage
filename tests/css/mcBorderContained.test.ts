// @vitest-environment node
// tests/css/mcBorderContained.test.ts
// Guards the listen/meaning answer-choice border inside a *contained* lesson
// trainer (the milestone's step 6). trainer-shell.css restates the base button
// with `.trainer-shell.contained .btn { border: none }` at specificity (0,3,0).
// The MC buttons carry both `.btn` and `.lt-mc-btn`, so without a higher-
// specificity restore their border, transparent fill and primary text vanish the
// moment the trainer runs embedded. lesson-trainer.css restores them under
// `.trainer-shell.contained.lesson-trainer .lt-mc-btn` (0,4,0); this test fails
// if that restore is dropped or weakened. See lesson-trainer.css
// "Contained (milestone step 6)".

import { readFileSync } from "node:fs";
import path from "node:path";
import postcss from "postcss";
import { describe, expect, it } from "vitest";

const css = readFileSync(
  path.resolve(__dirname, "../../components/page/learner/lesson-training/lesson-trainer.css"),
  "utf8"
);

// The clobbering rule lives at (0,3,0), so the restore must carry at least four
// classes to win deterministically regardless of stylesheet source order.
const CLOBBER_CLASS_COUNT = 3;

interface McRule {
  selector: string;
  classCount: number;
  border?: string;
}

// Rules whose rightmost compound is exactly `.lt-mc-btn` (the base MC button,
// not an answered `.lt-correct` / `.lt-wrong` state) and that are scoped to the
// contained shell.
function containedBaseMcRules(cssText: string): McRule[] {
  const out: McRule[] = [];
  postcss.parse(cssText).walkRules((rule) => {
    rule.selectors.forEach((selector) => {
      if (!selector.includes(".contained")) return;
      const rightmost = selector.trim().split(/\s*[>+~]\s*|\s+/).pop() ?? "";
      if (rightmost !== ".lt-mc-btn") return;
      let border: string | undefined;
      rule.walkDecls("border", (d) => {
        border = d.value;
      });
      out.push({
        selector,
        classCount: (selector.match(/\.[-\w]+/g) ?? []).length,
        border,
      });
    });
  });
  return out;
}

describe("contained lesson trainer keeps the MC answer-choice border", () => {
  const rules = containedBaseMcRules(css);

  it("restores the .lt-mc-btn border under .contained", () => {
    expect(rules.length).toBeGreaterThan(0);
    expect(rules.every((r) => r.border != null && r.border !== "none")).toBe(true);
  });

  it("wins the cascade against `.trainer-shell.contained .btn`", () => {
    // Every restore must out-specify the (0,3,0) clobber via more classes.
    expect(rules.every((r) => r.classCount > CLOBBER_CLASS_COUNT)).toBe(true);
  });
});
