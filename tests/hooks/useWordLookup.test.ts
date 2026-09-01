import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { useWordLookup } from "@/hooks/useWordLookup";
import * as api from "@/lib/api/learnerVocab";
import type { LessonPassageLine, VocabLookup } from "@/lib/types/types";

vi.mock("@/lib/api/learnerVocab");

function line(id: number, tokens: string[]): LessonPassageLine {
  return {
    line_id: id,
    speaker: null,
    content: tokens.join(""),
    pinyin: null,
    audio_key: null,
    translations: { en: null, vi: null },
    tokens,
    flag: 0,
  };
}

const ENTRY: VocabLookup = { pinyin: "máng", meaning_vn: "bận", meaning_en: "busy", audio_key: "mang_1" };

describe("useWordLookup", () => {
  beforeEach(() => vi.resetAllMocks());

  it("looks up the unique non-punctuation words and exposes them", async () => {
    vi.mocked(api.lookupWordsBatch).mockResolvedValue({ 忙: ENTRY });

    const lines = [line(1, ["我", "很", "忙", "。"]), line(2, ["忙", "！"])];
    const { result } = renderHook(() => useWordLookup(lines));
    await waitFor(() => expect(result.current.ready).toBe(true));

    // Punctuation excluded, duplicates de-duped.
    const called = vi.mocked(api.lookupWordsBatch).mock.calls[0][0].sort();
    expect(called).toEqual(["我", "忙", "很"].sort());
    expect(result.current.lookupMap["忙"]).toEqual(ENTRY);
  });

  it("is immediately ready with an empty map when there are no words", async () => {
    const { result } = renderHook(() => useWordLookup([line(1, ["。", "！"])]));
    await waitFor(() => expect(result.current.ready).toBe(true));
    expect(api.lookupWordsBatch).not.toHaveBeenCalled();
    expect(result.current.lookupMap).toEqual({});
  });

  it("chunks requests above the 80-word batch cap", async () => {
    vi.mocked(api.lookupWordsBatch).mockResolvedValue({});
    const tokens = Array.from({ length: 100 }, (_, i) => `词${i}`);
    const { result } = renderHook(() => useWordLookup([line(1, tokens)]));
    await waitFor(() => expect(result.current.ready).toBe(true));
    expect(api.lookupWordsBatch).toHaveBeenCalledTimes(2);
    expect(vi.mocked(api.lookupWordsBatch).mock.calls[0][0]).toHaveLength(80);
    expect(vi.mocked(api.lookupWordsBatch).mock.calls[1][0]).toHaveLength(20);
  });

  it("stays ready with an empty map when the lookup fails", async () => {
    vi.mocked(api.lookupWordsBatch).mockRejectedValue(new Error("401"));
    const { result } = renderHook(() => useWordLookup([line(1, ["忙"])]));
    await waitFor(() => expect(result.current.ready).toBe(true));
    expect(result.current.lookupMap).toEqual({});
  });
});
