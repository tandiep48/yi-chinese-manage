import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { useGrammar, splitGrammarByType1 } from "@/hooks/useGrammar";
import * as api from "@/lib/api/learner/lessons";
import type { LessonGrammarRule } from "@/lib/types/lesson";

vi.mock("@/lib/api/learner/lessons");

const RULES: LessonGrammarRule[] = [
  { grammar_id: "g1", type: 1, vietnamese_content: "Chủ đề A" },
  { grammar_id: "g2", type: 2, vietnamese_content: "Mô tả" },
  { grammar_id: "g3", type: 3, vietnamese_content: "你好 ~ Xin chào" },
  { grammar_id: "g4", type: 1, vietnamese_content: "Chủ đề B" },
  { grammar_id: "g5", type: 2, vietnamese_content: "Mô tả 2" },
];

describe("splitGrammarByType1", () => {
  it("starts a new section at each type=1 row", () => {
    const sections = splitGrammarByType1(RULES);
    expect(sections.map((s) => s.map((g) => g.grammar_id))).toEqual([
      ["g1", "g2", "g3"],
      ["g4", "g5"],
    ]);
  });

  it("opens a section for a leading non-title row", () => {
    const sections = splitGrammarByType1([
      { grammar_id: "x", type: 2, vietnamese_content: "orphan" },
      { grammar_id: "y", type: 1, vietnamese_content: "title" },
    ]);
    expect(sections).toHaveLength(2);
    expect(sections[0][0].grammar_id).toBe("x");
  });

  it("returns no sections for an empty list", () => {
    expect(splitGrammarByType1([])).toEqual([]);
  });
});

describe("useGrammar", () => {
  beforeEach(() => vi.resetAllMocks());

  it("loads and splits grammar into sections", async () => {
    vi.mocked(api.getPassageGrammar).mockResolvedValue(RULES);

    const { result } = renderHook(() => useGrammar("H2_2_2"));
    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(api.getPassageGrammar).toHaveBeenCalledWith("H2_2_2");
    expect(result.current.sections).toHaveLength(2);
    expect(result.current.error).toBeNull();
  });

  it("surfaces an error on failure", async () => {
    vi.mocked(api.getPassageGrammar).mockRejectedValue(new Error("nope"));

    const { result } = renderHook(() => useGrammar("H2_2_2"));
    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.error).toBe("nope");
    expect(result.current.sections).toEqual([]);
  });

  it("stays empty and skips the request for a blank passage id", async () => {
    const { result } = renderHook(() => useGrammar(""));
    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(api.getPassageGrammar).not.toHaveBeenCalled();
    expect(result.current.sections).toEqual([]);
  });
});
