// tests/hooks/useCompetitionSetup.test.ts
// Book mode's source picker. The distinction that matters: a book-passages lookup that
// FAILS must not be reported as "this book has no saved words" — that sent us hunting
// for missing vocabulary when the endpoint was simply not deployed.

import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import { useCompetitionSetup } from "@/hooks/useCompetitionSetup";
import * as competitionApi from "@/lib/api/competition";
import * as learnerVocab from "@/lib/api/learnerVocab";

vi.mock("@/lib/api/competition");
vi.mock("@/lib/api/learnerVocab");
vi.mock("@/lib/api/lessons");
vi.mock("@/components/i18n/I18nProvider", () => ({
  useT: () => ({ t: (key: string) => key, lang: "en" }),
}));

const BOOKS = [{ book_code: "AML", name: "AI & Học máy" }];

describe("useCompetitionSetup book mode", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    vi.mocked(learnerVocab.getSavedBooks).mockResolvedValue(BOOKS);
  });

  it("swaps to the Book picker and reloads the vocab type set", async () => {
    const { result } = renderHook(() => useCompetitionSetup());
    await act(async () => await result.current.setMode("book"));

    expect(result.current.isBook).toBe(true);
    expect(result.current.types).toEqual(["typing", "listening", "reading"]);
    expect(result.current.bookOptions).toEqual([{ value: "AML", label: "AI & Học máy" }]);
  });

  it("reports a load failure, not an empty book, when the lookup breaks", async () => {
    vi.mocked(competitionApi.getBookPassages).mockRejectedValue(new Error("404"));
    const { result } = renderHook(() => useCompetitionSetup());
    await act(async () => await result.current.setMode("book"));

    await act(async () => await result.current.setBooks(["AML"]));

    expect(result.current.error).toBe("picker.failed_load_lessons");
  });

  it("reports an empty book when the lookup succeeds with no parts", async () => {
    vi.mocked(competitionApi.getBookPassages).mockResolvedValue([]);
    const { result } = renderHook(() => useCompetitionSetup());
    await act(async () => await result.current.setMode("book"));

    await act(async () => await result.current.setBooks(["AML"]));

    expect(result.current.error).toBe("competition.no_saved_books");
  });

  it("builds the lesson cascade from the book's parts, headed by the book code", async () => {
    vi.mocked(competitionApi.getBookPassages).mockResolvedValue([
      { passage_id: "AML_1_1" },
      { passage_id: "AML_1_2" },
      { passage_id: "AML_2_1" },
    ]);
    const { result } = renderHook(() => useCompetitionSetup());
    await act(async () => await result.current.setMode("book"));
    await act(async () => await result.current.setBooks(["AML"]));

    expect(result.current.error).toBe("");
    expect(result.current.lessonOptions.map((o) => o.value)).toEqual(["AML_1", "AML_2"]);

    act(() => result.current.setLessonKeys(["AML_1"]));
    await waitFor(() =>
      expect(result.current.partOptions.map((o) => o.value)).toEqual([
        "AML_1_1",
        "AML_1_2",
      ])
    );
  });

  it("clears the source picks and the cascade when the mode changes", async () => {
    vi.mocked(competitionApi.getBookPassages).mockResolvedValue([
      { passage_id: "AML_1_1" },
    ]);
    const { result } = renderHook(() => useCompetitionSetup());
    await act(async () => await result.current.setMode("book"));
    await act(async () => await result.current.setBooks(["AML"]));
    expect(result.current.books).toEqual(["AML"]);

    await act(async () => await result.current.setMode("vocab"));

    expect(result.current.isBook).toBe(false);
    expect(result.current.books).toEqual([]);
    expect(result.current.bookOptions).toEqual([]);
    expect(result.current.lessonOptions).toEqual([]);
    expect(result.current.partIds).toEqual([]);
  });
});
