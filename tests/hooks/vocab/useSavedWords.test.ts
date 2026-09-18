import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor, act } from "@testing-library/react";
import { useSavedWords } from "@/hooks/vocab/useSavedWords";
import * as api from "@/lib/api/learner/learnerVocab";
import type { LessonPassageDetail } from "@/lib/types/lesson";

vi.mock("@/lib/api/learner/learnerVocab");

const HSK: LessonPassageDetail = { passage_id: "H2_2_2", hsk_level: "HSK2", lines: [] };
const BOOK: LessonPassageDetail = { passage_id: "AML_1_1", hsk_level: null, book_code: "AML", lines: [] };

describe("useSavedWords", () => {
  beforeEach(() => vi.resetAllMocks());

  it("is disabled and never fetches for HSK passages", async () => {
    const { result } = renderHook(() => useSavedWords(HSK));
    await waitFor(() => expect(result.current.enabled).toBe(false));
    expect(api.getSavedWords).not.toHaveBeenCalled();
  });

  it("loads the saved words for a book passage", async () => {
    vi.mocked(api.getSavedWords).mockResolvedValue(["忙", "累"]);
    const { result } = renderHook(() => useSavedWords(BOOK));
    await waitFor(() => expect(result.current.saved.size).toBe(2));
    expect(api.getSavedWords).toHaveBeenCalledWith("AML_1_1");
    expect(result.current.saved.has("忙")).toBe(true);
  });

  it("optimistically adds then persists via the API", async () => {
    vi.mocked(api.getSavedWords).mockResolvedValue([]);
    vi.mocked(api.addSavedWord).mockResolvedValue();
    const { result } = renderHook(() => useSavedWords(BOOK));
    await waitFor(() => expect(result.current.enabled).toBe(true));

    await act(async () => {
      await result.current.toggle("累");
    });
    expect(api.addSavedWord).toHaveBeenCalledWith("AML_1_1", "累");
    expect(result.current.saved.has("累")).toBe(true);
  });

  it("reverts the optimistic add when the API call fails", async () => {
    vi.mocked(api.getSavedWords).mockResolvedValue([]);
    vi.mocked(api.addSavedWord).mockRejectedValue(new Error("boom"));
    const { result } = renderHook(() => useSavedWords(BOOK));
    await waitFor(() => expect(result.current.enabled).toBe(true));

    await act(async () => {
      await result.current.toggle("累");
    });
    expect(result.current.saved.has("累")).toBe(false);
  });
});
