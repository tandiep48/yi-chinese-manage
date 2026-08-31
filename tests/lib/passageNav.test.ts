import { describe, it, expect } from "vitest";
import { lessonHrefForPassage } from "@/lib/lessons/passageNav";

describe("lessonHrefForPassage", () => {
  it("routes the two HSK1 pinyin placeholders to their guides", () => {
    expect(lessonHrefForPassage("H1_1_1")).toBe("/lesson/basic-pinyin");
    expect(lessonHrefForPassage("H1_1_2")).toBe("/lesson/advanced-pinyin");
  });

  it("routes a normal passage to the lesson view with an encoded id", () => {
    expect(lessonHrefForPassage("H2_3_1")).toBe("/lesson?passage_id=H2_3_1");
  });

  it("url-encodes book passage ids", () => {
    expect(lessonHrefForPassage("AML_1_2")).toBe("/lesson?passage_id=AML_1_2");
  });
});
