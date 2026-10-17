// @vitest-environment node
// tests/lib/lessons/lessons.test.ts
// filterLessonsByQuery backs the HSK lesson picker's client-side search.

import { describe, it, expect } from "vitest";
import { filterLessonsByQuery } from "@/lib/lessons/lessons";

const LESSONS = [
  { lesson: "1", title: "Greetings" },
  { lesson: "2", title: "Family" },
  { lesson: "10", title: "At the Market" },
  { lesson: "Other" }, // no title
];

describe("filterLessonsByQuery", () => {
  it("returns a copy of everything for an empty or whitespace query", () => {
    expect(filterLessonsByQuery(LESSONS, "")).toEqual(LESSONS);
    expect(filterLessonsByQuery(LESSONS, "   ")).toEqual(LESSONS);
    // A copy, not the same reference (safe to sort/mutate downstream).
    expect(filterLessonsByQuery(LESSONS, "")).not.toBe(LESSONS);
  });

  it("matches the title case-insensitively", () => {
    expect(filterLessonsByQuery(LESSONS, "fam")).toEqual([{ lesson: "2", title: "Family" }]);
    expect(filterLessonsByQuery(LESSONS, "MARKET")).toEqual([{ lesson: "10", title: "At the Market" }]);
  });

  it("matches the lesson number", () => {
    expect(filterLessonsByQuery(LESSONS, "10")).toEqual([{ lesson: "10", title: "At the Market" }]);
    // "1" is a substring of "10" too, so both match.
    expect(filterLessonsByQuery(LESSONS, "1").map((l) => l.lesson)).toEqual(["1", "10"]);
  });

  it("matches the 'Other' bucket by its lesson key", () => {
    expect(filterLessonsByQuery(LESSONS, "oth")).toEqual([{ lesson: "Other" }]);
  });

  it("returns nothing when there is no match", () => {
    expect(filterLessonsByQuery(LESSONS, "zzz")).toEqual([]);
  });
});
