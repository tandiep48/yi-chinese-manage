import { describe, it, expect } from "vitest";
import { isPunctToken } from "@/lib/lessons/tokens";

describe("isPunctToken", () => {
  it("treats CJK and ASCII punctuation as non-clickable", () => {
    for (const p of ["。", "，", "？", "！", "、", "：", "…", "（", "）", ".", "?", "!", ",", " "]) {
      expect(isPunctToken(p)).toBe(true);
    }
  });

  it("treats Chinese words as clickable (not punctuation)", () => {
    for (const w of ["你", "星期天", "学校", "忙"]) {
      expect(isPunctToken(w)).toBe(false);
    }
  });
});
