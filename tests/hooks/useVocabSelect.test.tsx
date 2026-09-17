// tests/hooks/useVocabSelect.test.tsx
// Covers the reset cascades and derived state the vocab selection page relies
// on: mode -> filters resets, the HSK -> lesson -> part grouping (numeric sort
// with "Other" last, grouped part options across multiple lessons), history
// modes loading immediately, the cross-page selection set, and debounced search.

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { act, renderHook, waitFor } from "@testing-library/react";

import { getPassages } from "@/lib/api/lessons";
import {
  getVocabTable,
  getLearnedVocab,
  searchVocab,
} from "@/lib/api/learnerVocab";
import { useVocabSelect } from "@/hooks/useVocabSelect";
import type { VocabRow } from "@/lib/types/vocab";

vi.mock("@/components/i18n/I18nProvider", () => ({
  useT: () => ({
    t: (key: string, vars?: Record<string, unknown>) =>
      vars ? `${key} ${JSON.stringify(vars)}` : key,
  }),
}));

vi.mock("@/lib/api/lessons", () => ({ getPassages: vi.fn() }));
vi.mock("@/lib/api/learnerVocab", () => ({
  getVocabTable: vi.fn(),
  getLearnedVocab: vi.fn(),
  searchVocab: vi.fn(),
}));

const mockPassages = getPassages as unknown as ReturnType<typeof vi.fn>;
const mockTable = getVocabTable as unknown as ReturnType<typeof vi.fn>;
const mockLearned = getLearnedVocab as unknown as ReturnType<typeof vi.fn>;
const mockSearch = searchVocab as unknown as ReturnType<typeof vi.fn>;

function row(word: string, over: Partial<VocabRow> = {}): VocabRow {
  return {
    word,
    cn: word,
    pinyin: `${word}-py`,
    meaning_vn: `${word}-vn`,
    meaning_en: `${word}-en`,
    audio_key: `${word}-key`,
    level: "HSK1",
    ...over,
  };
}

function tableResponse(rows: VocabRow[], over = {}) {
  return {
    rows,
    page: 1,
    page_size: 20,
    total: rows.length,
    total_pages: 1,
    ...over,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  mockTable.mockResolvedValue(tableResponse([]));
  mockLearned.mockResolvedValue(tableResponse([]));
  mockSearch.mockResolvedValue(tableResponse([]));
  mockPassages.mockResolvedValue([]);
});

afterEach(() => {
  vi.useRealTimers();
});

describe("useVocabSelect — initial state", () => {
  it("starts in standard mode with the choose-filters prompt and no rows", () => {
    const { result } = renderHook(() => useVocabSelect());
    expect(result.current.mode).toBe("standard");
    expect(result.current.rows).toEqual([]);
    expect(result.current.tableState.status).toBe("prompt");
    expect(result.current.tableState.message).toBe("vocab.state_choose_filters");
    expect(result.current.isHistoryMode).toBe(false);
  });
});

describe("useVocabSelect — history modes", () => {
  it("loads recent (learned) vocab immediately from the learned-vocab endpoint", async () => {
    mockLearned.mockResolvedValue(tableResponse([row("学习"), row("你好")]));
    const { result } = renderHook(() => useVocabSelect());

    act(() => result.current.setMode("recent"));

    await waitFor(() => expect(result.current.rows).toHaveLength(2));
    expect(mockLearned).toHaveBeenCalledWith(1, 20);
    expect(mockTable).not.toHaveBeenCalled();
    expect(result.current.isHistoryMode).toBe(true);
  });

  it("loads unlearn mode from the table endpoint with mode=unlearn", async () => {
    mockTable.mockResolvedValue(tableResponse([row("水")]));
    const { result } = renderHook(() => useVocabSelect());

    act(() => result.current.setMode("unlearn"));

    await waitFor(() => expect(result.current.rows).toHaveLength(1));
    expect(mockTable).toHaveBeenCalledWith(
      expect.objectContaining({ mode: "unlearn", page: 1 })
    );
  });
});

describe("useVocabSelect — standard cascade", () => {
  it("groups passages into lessons with 'Other' sorted last", async () => {
    mockPassages.mockResolvedValue([
      { passage_id: "H1_2_1", hsk_level: "HSK1" },
      { passage_id: "H1_1_1", hsk_level: "HSK1" },
      { passage_id: "H1_1_2", hsk_level: "HSK1" },
      { passage_id: "H1", hsk_level: "HSK1" }, // no lesson segment -> "Other"
    ]);
    const { result } = renderHook(() => useVocabSelect());

    act(() => result.current.setHskLevel("HSK1"));

    await waitFor(() => expect(result.current.lessonOptions).toHaveLength(3));
    expect(mockPassages).toHaveBeenCalledWith("HSK1");
    expect(result.current.lessonOptions.map((o) => o.value)).toEqual([
      "1",
      "2",
      "Other",
    ]);
  });

  it("builds ungrouped part options for a single lesson, then loads the table", async () => {
    mockPassages.mockResolvedValue([
      { passage_id: "H1_1_1", hsk_level: "HSK1" },
      { passage_id: "H1_1_2", hsk_level: "HSK1" },
    ]);
    mockTable.mockResolvedValue(tableResponse([row("一"), row("二")]));
    const { result } = renderHook(() => useVocabSelect());

    act(() => result.current.setHskLevel("HSK1"));
    await waitFor(() => expect(result.current.lessonOptions).toHaveLength(1));

    act(() => result.current.changeLessons(["1"]));
    await waitFor(() => expect(result.current.partOptions).toHaveLength(2));
    expect(result.current.partOptions.map((o) => o.value)).toEqual([
      "H1_1_1",
      "H1_1_2",
    ]);
    expect(result.current.partOptions.every((o) => !o.group)).toBe(true);

    act(() => result.current.changeParts(["H1_1_1"]));
    await waitFor(() => expect(result.current.rows).toHaveLength(2));
    expect(mockTable).toHaveBeenCalledWith(
      expect.objectContaining({ mode: "standard", passages: ["H1_1_1"] })
    );
  });

  it("groups part options by lesson when multiple lessons are selected", async () => {
    mockPassages.mockResolvedValue([
      { passage_id: "H1_1_1", hsk_level: "HSK1" },
      { passage_id: "H1_2_1", hsk_level: "HSK1" },
    ]);
    const { result } = renderHook(() => useVocabSelect());

    act(() => result.current.setHskLevel("HSK1"));
    await waitFor(() => expect(result.current.lessonOptions).toHaveLength(2));

    act(() => result.current.changeLessons(["1", "2"]));
    await waitFor(() => expect(result.current.partOptions).toHaveLength(2));
    expect(result.current.partOptions.every((o) => o.group)).toBe(true);
  });

  it("changing mode clears the HSK level and lesson/part selections", async () => {
    mockPassages.mockResolvedValue([{ passage_id: "H1_1_1", hsk_level: "HSK1" }]);
    const { result } = renderHook(() => useVocabSelect());

    act(() => result.current.setHskLevel("HSK1"));
    await waitFor(() => expect(result.current.lessonOptions).toHaveLength(1));

    act(() => result.current.setMode("free"));
    expect(result.current.hskLevel).toBe("");
    expect(result.current.lessonOptions).toEqual([]);
    expect(result.current.selectedLessons).toEqual([]);
    expect(result.current.selectedParts).toEqual([]);
  });
});

describe("useVocabSelect — free mode", () => {
  it("loads the table straight from HSK level with mode=free", async () => {
    mockTable.mockResolvedValue(tableResponse([row("我")]));
    const { result } = renderHook(() => useVocabSelect());

    act(() => result.current.setMode("free"));
    act(() => result.current.setHskLevel("HSK2"));

    await waitFor(() => expect(result.current.rows).toHaveLength(1));
    expect(mockTable).toHaveBeenCalledWith(
      expect.objectContaining({ mode: "free", hskLevel: "HSK2" })
    );
  });
});

describe("useVocabSelect — selection", () => {
  it("tracks selected words across toggles and reports all-on-page", async () => {
    mockLearned.mockResolvedValue(tableResponse([row("A"), row("B")]));
    const { result } = renderHook(() => useVocabSelect());
    act(() => result.current.setMode("recent"));
    await waitFor(() => expect(result.current.rows).toHaveLength(2));

    const [a, b] = result.current.rows;
    act(() => result.current.toggleWord(a, true));
    expect(result.current.selectedCount).toBe(1);
    expect(result.current.isSelected(a)).toBe(true);
    expect(result.current.allOnPageSelected).toBe(false);

    act(() => result.current.togglePage([a, b], true));
    expect(result.current.selectedCount).toBe(2);
    expect(result.current.allOnPageSelected).toBe(true);

    act(() => result.current.clearSelection());
    expect(result.current.selectedCount).toBe(0);
  });
});

describe("useVocabSelect — search", () => {
  it("runs a debounced search and exposes searchMode while the box is non-empty", async () => {
    vi.useFakeTimers();
    mockSearch.mockResolvedValue(tableResponse([row("查")]));
    const { result } = renderHook(() => useVocabSelect());

    act(() => result.current.setSearchQuery("cha"));
    expect(result.current.searchMode).toBe(true);
    // Not fired yet (debounce pending).
    expect(mockSearch).not.toHaveBeenCalled();

    await act(async () => {
      vi.advanceTimersByTime(300);
    });
    expect(mockSearch).toHaveBeenCalledWith("cha", 1, 20);

    act(() => result.current.setSearchQuery(""));
    expect(result.current.searchMode).toBe(false);
  });
});
