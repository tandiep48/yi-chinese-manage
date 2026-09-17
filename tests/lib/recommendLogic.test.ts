import { describe, it, expect } from "vitest";
import {
  RECOMMEND_PAGE_SIZE,
  recommendationKey,
  filterRecommendations,
  clampPage,
  pageSlice,
  getPageNumbers,
  parseProgress,
  toMultiItem,
  type RecommendFilters,
} from "@/lib/recommend/recommendLogic";
import type { RecommendedPractice } from "@/lib/types/dashboard";

function makeRec(overrides: Partial<RecommendedPractice> = {}): RecommendedPractice {
  return {
    level: 1,
    lesson: 1,
    progress: "1-5",
    skill: "reading",
    type: 1,
    category: "practice",
    unit_ids: [],
    total_words: 10,
    known_words: 9,
    coverage_pct: 90,
    matched_words: [],
    recent_matched_words: [],
    newest_learned_at: null,
    recent_score: 0,
    status: "Not start",
    question_count: 5,
    ...overrides,
  };
}

const ALL: RecommendFilters = {
  level: "all",
  skill: "all",
  category: "all",
  status: "all",
};

describe("recommendationKey", () => {
  it("joins category|level|lesson|progress and defaults category to practice", () => {
    expect(recommendationKey({ level: 2, lesson: 3, progress: "1-4" })).toBe(
      "practice|2|3|1-4"
    );
    expect(
      recommendationKey({ category: "exam", level: 5, lesson: 1, progress: "2" })
    ).toBe("exam|5|1|2");
  });
});

describe("filterRecommendations", () => {
  const recs = [
    makeRec({ level: 1, skill: "reading", category: "practice", status: "Not start" }),
    makeRec({ level: 2, skill: "listening", category: "exam", status: "Finish and success" }),
    makeRec({ level: 3, skill: "reading", category: "practice", status: "Finish and fail" }),
  ];

  it("returns all when every filter is 'all'", () => {
    expect(filterRecommendations(recs, ALL)).toHaveLength(3);
  });

  it("matches level loosely across string/number", () => {
    expect(filterRecommendations(recs, { ...ALL, level: "2" })).toEqual([recs[1]]);
  });

  it("filters by skill, category and status together", () => {
    expect(
      filterRecommendations(recs, {
        level: "all",
        skill: "reading",
        category: "practice",
        status: "Not start",
      })
    ).toEqual([recs[0]]);
  });

  it("treats a missing status as 'Not start'", () => {
    const noStatus = makeRec({ status: undefined as never });
    expect(
      filterRecommendations([noStatus], { ...ALL, status: "Not start" })
    ).toHaveLength(1);
  });
});

describe("clampPage / pageSlice", () => {
  it("clamps into the valid range", () => {
    expect(clampPage(0, 25)).toBe(1);
    expect(clampPage(99, 25)).toBe(3); // 25 items → 3 pages of 10
    expect(clampPage(1, 0)).toBe(1);
  });

  it("slices the right window", () => {
    const items = Array.from({ length: 25 }, (_, i) => i);
    expect(pageSlice(items, 1)).toEqual(items.slice(0, RECOMMEND_PAGE_SIZE));
    expect(pageSlice(items, 3)).toEqual([20, 21, 22, 23, 24]);
  });
});

describe("getPageNumbers", () => {
  it("lists every page when total <= 7", () => {
    expect(getPageNumbers(1, 5)).toEqual([1, 2, 3, 4, 5]);
  });
  it("collapses the tail near the start", () => {
    expect(getPageNumbers(2, 10)).toEqual([1, 2, 3, 4, 5, "...", 10]);
  });
  it("collapses the head near the end", () => {
    expect(getPageNumbers(9, 10)).toEqual([1, "...", 6, 7, 8, 9, 10]);
  });
  it("collapses both sides in the middle", () => {
    expect(getPageNumbers(6, 12)).toEqual([1, "...", 5, 6, 7, "...", 12]);
  });
});

describe("parseProgress", () => {
  it("handles none, single and range", () => {
    expect(parseProgress(null)).toEqual({ kind: "none" });
    expect(parseProgress("")).toEqual({ kind: "none" });
    expect(parseProgress("7")).toEqual({ kind: "single", n: "7" });
    expect(parseProgress("3-5")).toEqual({ kind: "range", a: "3", b: "5" });
  });
});

describe("toMultiItem", () => {
  it("keeps only the queue fields and defaults category", () => {
    expect(toMultiItem(makeRec({ level: 4, lesson: 2, progress: "1-3", category: "" }))).toEqual({
      level: 4,
      lesson: 2,
      progress: "1-3",
      category: "practice",
    });
  });
});
