import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { useTranslation } from "@/hooks/useTranslation";
import * as api from "@/lib/api/translation";
import type { TranslationRow } from "@/lib/types/lesson";

vi.mock("@/lib/api/translation");

const ROWS: TranslationRow[] = [
  { translation_id: "H2_2_1", cn: "起床了吗？", vn: "Dậy chưa?", en: "Are you up?" },
  { translation_id: "H2_2_2", cn: "他很忙。", vn: "Anh ấy bận.", en: "He is busy." },
];

describe("useTranslation", () => {
  beforeEach(() => vi.resetAllMocks());

  it("derives HSK level + lesson from the passage id and loads rows", async () => {
    vi.mocked(api.getLessonTranslations).mockResolvedValue(ROWS);

    const { result } = renderHook(() => useTranslation("H2_2_2"));
    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(api.getLessonTranslations).toHaveBeenCalledWith("HSK2", "2");
    expect(result.current.rows).toEqual(ROWS);
    expect(result.current.error).toBeNull();
  });

  it("surfaces an error on failure", async () => {
    vi.mocked(api.getLessonTranslations).mockRejectedValue(new Error("down"));

    const { result } = renderHook(() => useTranslation("H2_2_2"));
    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.error).toBe("down");
    expect(result.current.rows).toEqual([]);
  });

  it("skips the request when the passage id has no lesson segment", async () => {
    const { result } = renderHook(() => useTranslation("H2"));
    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(api.getLessonTranslations).not.toHaveBeenCalled();
    expect(result.current.rows).toEqual([]);
  });
});
