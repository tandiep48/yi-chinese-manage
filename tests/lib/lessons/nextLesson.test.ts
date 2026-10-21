// @vitest-environment node
// tests/lib/lessons/nextLesson.test.ts
// nextLessonFirstPassageId backs the lesson flow's "roll on to the next lesson"
// step: after a part's Grammar/Translation are done, it picks the first part of the
// following lesson in the same HSK level.

import { describe, it, expect } from "vitest";
import { nextLessonFirstPassageId } from "@/lib/lessons/lessons";
import type { PickerPassage } from "@/lib/types/lesson";

const p = (id: string): PickerPassage => ({ passage_id: id, hsk_level: "HSK2" });

// Lesson 2 (parts 1-2), lesson 3 (parts 1-2), lesson 10 (part 1), given out of order.
const PASSAGES: PickerPassage[] = [
  p("H2_3_2"),
  p("H2_2_1"),
  p("H2_10_1"),
  p("H2_2_2"),
  p("H2_3_1"),
];

describe("nextLessonFirstPassageId", () => {
  it("returns the first part of the next lesson by lesson then part order", () => {
    // From any part of lesson 2, the next lesson is 3 and its first part is H2_3_1.
    expect(nextLessonFirstPassageId("H2_2_1", PASSAGES)).toBe("H2_3_1");
    expect(nextLessonFirstPassageId("H2_2_2", PASSAGES)).toBe("H2_3_1");
  });

  it("orders lessons numerically, not lexically (10 after 3)", () => {
    expect(nextLessonFirstPassageId("H2_3_1", PASSAGES)).toBe("H2_10_1");
  });

  it("returns null at the last lesson of the level", () => {
    expect(nextLessonFirstPassageId("H2_10_1", PASSAGES)).toBeNull();
  });

  it("returns null for a book part (no milestone flow)", () => {
    expect(nextLessonFirstPassageId("AML_1_1", [p("AML_1_1"), p("AML_2_1")])).toBeNull();
  });

  it("returns null when the current lesson is not in the list", () => {
    expect(nextLessonFirstPassageId("H2_99_1", PASSAGES)).toBeNull();
  });
});
