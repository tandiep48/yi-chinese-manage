// tests/lib/typingGlow.test.ts
// The per-character typing feedback shared by every typed milestone step.

import { describe, it, expect } from "vitest";
import { typingCharClasses } from "@/lib/lessons/typingGlow";

describe("typingCharClasses", () => {
  it("marks matching characters correct and mismatched ones wrong", () => {
    expect(typingCharClasses([..."你好"], "你是")).toEqual(["char-correct", "char-wrong"]);
  });

  it("leaves not-yet-typed positions unjudged", () => {
    expect(typingCharClasses([..."你好世界"], "你好")).toEqual([
      "char-correct",
      "char-correct",
      "",
      "",
    ]);
  });

  it("does not judge a position still holding IME/pinyin composition", () => {
    // A latin letter in the typed slot is still being composed, so no glow yet.
    expect(typingCharClasses([..."好"], "hao")).toEqual([""]);
  });

  it("skips 、 separators without consuming typed input", () => {
    // The separator is never judged; the character after it lines up with the next
    // typed character, not one shifted by the separator.
    expect(typingCharClasses([..."你、好"], "你好")).toEqual([
      "char-correct",
      "",
      "char-correct",
    ]);
  });
});
