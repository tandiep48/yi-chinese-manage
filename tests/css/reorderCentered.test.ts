// @vitest-environment node
// tests/css/reorderCentered.test.ts
// Guards the horizontal centering of the sentence-reorder task. The reorder
// element carries both `.lt-task` (width: 100%) and `.lt-reorder` (max-width:
// 640px), so it is narrower than the task card. A block with max-width is not
// centered by the card's `text-align: center`, so `.lt-reorder` must set an auto
// horizontal margin or it hugs the card's left edge. See lesson-trainer.css
// "Reorder".

import { readFileSync } from "node:fs";
import path from "node:path";
import postcss from "postcss";
import { describe, expect, it } from "vitest";

const css = readFileSync(
  path.resolve(__dirname, "../../components/page/learner/lesson-training/lesson-trainer.css"),
  "utf8"
);

function marginValuesFor(cssText: string, selectorLeaf: string): string[] {
  const out: string[] = [];
  postcss.parse(cssText).walkRules((rule) => {
    rule.selectors.forEach((selector) => {
      const rightmost = selector.trim().split(/\s*[>+~]\s*|\s+/).pop() ?? "";
      if (rightmost !== selectorLeaf) return;
      rule.walkDecls(/^(margin|margin-inline|margin-left|margin-right)$/, (d) => {
        out.push(d.value);
      });
    });
  });
  return out;
}

describe("sentence-reorder task is horizontally centered", () => {
  it("gives .lt-reorder an auto horizontal margin", () => {
    const margins = marginValuesFor(css, ".lt-reorder");
    expect(margins.some((v) => /\bauto\b/.test(v))).toBe(true);
  });
});
