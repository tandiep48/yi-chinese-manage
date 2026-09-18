import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { useLessonParts } from "@/hooks/useLessonParts";
import * as lessonsApi from "@/lib/api/learner/lessons";
import * as booksApi from "@/lib/api/learner/learnerBooks";
import type { LearnerBookDetail } from "@/lib/types/book";
import type { PickerPassage, PickerProgressSummary } from "@/lib/types/lesson";

vi.mock("@/lib/api/learner/lessons");
vi.mock("@/lib/api/learner/learnerBooks");

const HSK2_PASSAGES: PickerPassage[] = [
  { passage_id: "H2_2_2", hsk_level: "HSK2", title: "Too busy." },
  { passage_id: "H2_2_1", hsk_level: "HSK2", title: "Lili likes to run." },
  { passage_id: "H2_3_1", hsk_level: "HSK2", title: "Other lesson." },
];

const HSK2_PROGRESS: PickerProgressSummary = {
  lessons: {},
  parts: {
    H2_2_1: { total_words: 10, learned_words: 10, lesson_learned: 1, lesson_total: 1, progress_pct: 100 },
    H2_2_2: { total_words: 8, learned_words: 4, lesson_learned: 0, lesson_total: 1, progress_pct: 50 },
  },
};

const BOOK: LearnerBookDetail = {
  book_code: "AML",
  book_name: "A Month in Life",
  lessons: [
    {
      lesson: 1,
      title: "Arrival",
      part_count: 2,
      done_count: 0,
      parts: [
        { part: 2, passage_id: "AML_1_2" },
        { part: 1, passage_id: "AML_1_1" },
      ],
    },
  ],
};

describe("useLessonParts", () => {
  beforeEach(() => vi.resetAllMocks());

  it("loads the HSK lesson's parts, sorted, with progress and header", async () => {
    vi.mocked(lessonsApi.getPassages).mockResolvedValue(HSK2_PASSAGES);
    vi.mocked(lessonsApi.getPickerProgress).mockResolvedValue(HSK2_PROGRESS);

    const { result } = renderHook(() => useLessonParts("H2_2_2"));
    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(lessonsApi.getPassages).toHaveBeenCalledWith("HSK2");
    expect(result.current.header).toEqual({ badge: "HSK2", lessonNum: "2", isBook: false });

    // Only lesson 2's parts, ordered by part number, other lessons excluded.
    expect(result.current.parts.map((p) => p.passageId)).toEqual(["H2_2_1", "H2_2_2"]);
    expect(result.current.parts[1].progress).toMatchObject({ learnedWords: 4, totalWords: 8, progressPct: 50 });
    expect(result.current.error).toBeNull();
  });

  it("still lists parts when progress is unavailable (signed out)", async () => {
    vi.mocked(lessonsApi.getPassages).mockResolvedValue(HSK2_PASSAGES);
    vi.mocked(lessonsApi.getPickerProgress).mockResolvedValue(null);

    const { result } = renderHook(() => useLessonParts("H2_2_1"));
    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.parts).toHaveLength(2);
    expect(result.current.parts.every((p) => p.progress === null)).toBe(true);
  });

  it("loads book parts from the book endpoint, sorted, without progress", async () => {
    vi.mocked(booksApi.getLearnerBook).mockResolvedValue(BOOK);

    const { result } = renderHook(() => useLessonParts("AML_1_2"));
    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(booksApi.getLearnerBook).toHaveBeenCalledWith("AML");
    expect(lessonsApi.getPassages).not.toHaveBeenCalled();
    expect(result.current.header).toEqual({ badge: "AML", lessonNum: "1", isBook: true });
    expect(result.current.parts.map((p) => p.passageId)).toEqual(["AML_1_1", "AML_1_2"]);
    expect(result.current.parts.every((p) => p.progress === null)).toBe(true);
  });

  it("flags an invalid passage id without calling the API", async () => {
    const { result } = renderHook(() => useLessonParts("H2"));
    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.error).toBe("invalid");
    expect(result.current.parts).toEqual([]);
    expect(lessonsApi.getPassages).not.toHaveBeenCalled();
  });

  it("surfaces an error when the parts request fails", async () => {
    vi.mocked(lessonsApi.getPassages).mockRejectedValue(new Error("boom"));
    vi.mocked(lessonsApi.getPickerProgress).mockResolvedValue(null);

    const { result } = renderHook(() => useLessonParts("H2_2_2"));
    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.error).toBe("boom");
  });
});
