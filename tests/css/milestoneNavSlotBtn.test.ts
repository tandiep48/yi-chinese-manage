// @vitest-environment node
// tests/css/milestoneNavSlotBtn.test.ts
// Guards the colour of the trainer's Check / Continue button once it is portaled
// into the milestone nav bar's slot. On /learner/lesson that slot sits inside
// LessonStudyShell's `.lesson-study`, so `.lesson-study .btn` (0,2,0, muted) and
// `.lesson-study .btn:hover` (0,3,0, green) also match the button. A bare
// `.milestone-nav-slot .btn` (0,2,0) ties the base and loses to the hover, so the
// button's colour hinged on stylesheet source order (green on hover, muted
// otherwise). The fix targets the `.trainer-action-slot.milestone-nav-slot`
// compound and restates the colour on :hover; this test fails if a `.btn` colour
// rule drops back to the single-class form. See milestone-nav-slot.css.

import { readFileSync } from "node:fs";
import path from "node:path";
import postcss from "postcss";
import { describe, expect, it } from "vitest";

const css = readFileSync(
  path.resolve(__dirname, "../../components/page/learner/milestone/milestone-nav-slot.css"),
  "utf8"
);

// The strongest `.lesson-study` clobber of the button's colour is its :hover rule
// at (0,3,0) — three classes' worth of specificity. Every nav-slot `.btn` rule
// that sets colour must carry more classes than that to win regardless of order.
const LESSON_STUDY_CLOBBER_CLASS_COUNT = 2; // `.lesson-study` + `.btn`

interface BtnRule {
  selector: string;
  classCount: number;
  isHover: boolean;
  color?: string;
}

// Rules whose rightmost compound is the `.btn` leaf (optionally with pseudos) and
// that set a `color`.
function navSlotBtnColorRules(cssText: string): BtnRule[] {
  const out: BtnRule[] = [];
  postcss.parse(cssText).walkRules((rule) => {
    rule.selectors.forEach((selector) => {
      const rightmost = selector.trim().split(/\s*[>+~]\s*|\s+/).pop() ?? "";
      if (!/(^|\.)btn(:|$)/.test(rightmost)) return;
      let color: string | undefined;
      rule.walkDecls("color", (d) => {
        color = d.value;
      });
      if (color == null) return;
      out.push({
        selector,
        classCount: (selector.match(/\.[-\w]+/g) ?? []).length,
        isHover: selector.includes(":hover"),
        color,
      });
    });
  });
  return out;
}

describe("milestone nav-slot button keeps its colour over .lesson-study .btn", () => {
  const rules = navSlotBtnColorRules(css);

  it("pins the colour in both the base and the hover state", () => {
    expect(rules.some((r) => !r.isHover)).toBe(true);
    expect(rules.some((r) => r.isHover)).toBe(true);
  });

  it("out-specifies `.lesson-study .btn` with the two-class slot compound", () => {
    expect(rules.length).toBeGreaterThan(0);
    expect(rules.every((r) => r.classCount > LESSON_STUDY_CLOBBER_CLASS_COUNT)).toBe(true);
    // Belt and braces: the compound is spelt out, not reached via one class.
    expect(
      rules.every(
        (r) => r.selector.includes(".trainer-action-slot") && r.selector.includes(".milestone-nav-slot")
      )
    ).toBe(true);
  });
});
