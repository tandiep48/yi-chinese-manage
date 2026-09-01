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

  it("appends the view when given, so book parts land on Lesson Summary", () => {
    expect(lessonHrefForPassage("AML_1_2", "lesson")).toBe("/lesson?passage_id=AML_1_2&view=lesson");
    expect(lessonHrefForPassage("H2_3_1", "vocab")).toBe("/lesson?passage_id=H2_3_1&view=vocab");
  });

  it("ignores the view for the pinyin guide placeholders", () => {
    expect(lessonHrefForPassage("H1_1_1", "lesson")).toBe("/lesson/basic-pinyin");
  });
});
