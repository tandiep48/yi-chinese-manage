// tests/hooks/useFlashcardSource.test.tsx
// Resolving the flash-cards word list from the URL: the sessionStorage selection
// hand-off (read once, then cleared) and the ?passage_id lesson fetch, both
// normalised to LessonVocabRow.

import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { getLessonPassageVocab } from "@/lib/api/learner/lessons";
import { useFlashcardSource } from "@/hooks/lesson/useFlashcardSource";

let search = "";
vi.mock("next/navigation", () => ({
  useSearchParams: () => new URLSearchParams(search),
}));
vi.mock("@/lib/api/learner/lessons", () => ({ getLessonPassageVocab: vi.fn() }));

const mockLessonVocab = getLessonPassageVocab as unknown as ReturnType<typeof vi.fn>;

beforeEach(() => {
  vi.clearAllMocks();
  sessionStorage.clear();
  search = "";
});

describe("useFlashcardSource — selection", () => {
  it("reads the stashed selection, maps word->cn, and clears sessionStorage", async () => {
    search = "source=selection";
    sessionStorage.setItem(
      "selectedVocabFlashcards",
      JSON.stringify([
        { word: "学习", pinyin: "xuexi", meaning_vn: "hoc", meaning_en: "study", audio_key: "k1", level: "HSK1" },
        { cn: "你好", pinyin: "nihao", meaning_en: "hello", audio_key: "k2" },
      ])
    );

    const { result } = renderHook(() => useFlashcardSource());

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.words).toEqual([
      { cn: "学习", pinyin: "xuexi", meaning_vn: "hoc", meaning_en: "study", audio_key: "k1", hsk_level: "HSK1" },
      { cn: "你好", pinyin: "nihao", meaning_vn: "", meaning_en: "hello", audio_key: "k2", hsk_level: "" },
    ]);
    // Consumed so a refresh starts over.
    expect(sessionStorage.getItem("selectedVocabFlashcards")).toBeNull();
    expect(result.current.passageId).toBeUndefined();
  });

  it("resolves to an empty list when the selection is missing", async () => {
    search = "source=selection";
    const { result } = renderHook(() => useFlashcardSource());
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.words).toEqual([]);
  });
});

describe("useFlashcardSource — lesson deep link", () => {
  it("fetches the lesson part's vocab and exposes the passageId", async () => {
    search = "passage_id=H1_1_1";
    mockLessonVocab.mockResolvedValue([
      { cn: "水", pinyin: "shui", meaning_vn: "nuoc", meaning_en: "water", audio_key: "w", hsk_level: "HSK1" },
    ]);

    const { result } = renderHook(() => useFlashcardSource());

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(mockLessonVocab).toHaveBeenCalledWith("H1_1_1");
    expect(result.current.words).toHaveLength(1);
    expect(result.current.passageId).toBe("H1_1_1");
  });

  it("surfaces an error when the lesson fetch fails", async () => {
    search = "passage_id=H1_1_1";
    mockLessonVocab.mockRejectedValue(new Error("boom"));
    const { result } = renderHook(() => useFlashcardSource());
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.error).toBe("boom");
  });
});

describe("useFlashcardSource — no source", () => {
  it("stops loading with an empty list when neither param is present", async () => {
    const { result } = renderHook(() => useFlashcardSource());
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.words).toEqual([]);
  });
});
