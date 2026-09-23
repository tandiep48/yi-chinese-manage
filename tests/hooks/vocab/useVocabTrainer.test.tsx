// tests/hooks/vocab/useVocabTrainer.test.tsx
// The embedding seam added for the tabbed learner home (docs/plans/dashboard-tabs.md
// Phase 0): words supplied as props bypass entry resolution entirely, onExit replaces
// the goHome navigation, and the pending answer batch is flushed on unmount so a tab
// switch mid-activity can't drop it.

import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import { I18nProvider } from "@/components/i18n/I18nProvider";
import {
  resolveTrainerWords,
  submitVocabBatch,
} from "@/lib/api/learner/vocabTrainer";
import { useVocabTrainer } from "@/hooks/vocab/useVocabTrainer";
import type { TrainerWord } from "@/lib/lessons/vocabTrainer";

const push = vi.fn();
const replace = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ push, replace }) }));
vi.mock("@/lib/api/learner/vocabTrainer", () => ({
  resolveTrainerWords: vi.fn(),
  submitVocabBatch: vi.fn(),
}));

const mockResolve = vi.mocked(resolveTrainerWords);
const mockSubmit = vi.mocked(submitVocabBatch);

const WORDS: TrainerWord[] = [
  { word: "学习", cn: "学习", pinyin: "xuéxí", meaning_en: "to study", meaning_vn: "học", audio_key: "a1", level: "HSK1" },
  { word: "你好", cn: "你好", pinyin: "nǐhǎo", meaning_en: "hello", meaning_vn: "xin chào", audio_key: "a2", level: "HSK1" },
];

function renderTrainer(opts: Parameters<typeof useVocabTrainer>[0] = {}) {
  return renderHook(() => useVocabTrainer(opts), { wrapper: I18nProvider });
}

beforeEach(() => {
  vi.clearAllMocks();
  sessionStorage.clear();
  window.history.replaceState({}, "", "/learner/vocab-training-batch?mode=6&passage_id=H1_1_3");
});

describe("useVocabTrainer — words as props", () => {
  it("starts from the given words without touching sessionStorage or the router", async () => {
    // I18nProvider reads its own key, so assert on the trainer's keys specifically.
    const getItem = vi.spyOn(Storage.prototype, "getItem");
    sessionStorage.setItem("selectedVocabTrainerWords", JSON.stringify(["别的"]));

    const { result } = renderTrainer({ words: WORDS });

    await waitFor(() => expect(result.current.screen).toBe("training"));
    expect(mockResolve).not.toHaveBeenCalled();
    expect(replace).not.toHaveBeenCalled();
    expect(getItem.mock.calls.map(([k]) => k)).not.toContain("selectedVocabTrainerWords");
    expect(getItem.mock.calls.map(([k]) => k)).not.toContain("lessonWideVocabTrainer");
    expect(getItem.mock.calls.map(([k]) => k)).not.toContain("vocabTrainerActivityTypes");
    // The ?mode=6 deep link in the URL is ignored too — no subtitle is derived.
    expect(result.current.subtitle).toBe("");
    // Entry keys are left for whoever owns them.
    expect(sessionStorage.getItem("selectedVocabTrainerWords")).not.toBeNull();
  });

  it("stays on the loading screen for an empty word list instead of redirecting", async () => {
    const { result } = renderTrainer({ words: [] });
    await act(async () => {});
    expect(result.current.screen).toBe("loading");
    expect(replace).not.toHaveBeenCalled();
  });

  it("still resolves from sessionStorage when no words are passed", async () => {
    sessionStorage.setItem("selectedVocabTrainerWords", JSON.stringify(["学习"]));
    mockResolve.mockResolvedValue(WORDS);

    const { result } = renderTrainer();

    await waitFor(() => expect(result.current.screen).toBe("training"));
    expect(mockResolve).toHaveBeenCalledWith({ words: ["学习"] });
  });
});

describe("useVocabTrainer — exit", () => {
  it("calls onExit instead of navigating", async () => {
    const onExit = vi.fn();
    const { result } = renderTrainer({ words: WORDS, onExit });
    await waitFor(() => expect(result.current.screen).toBe("training"));

    act(() => result.current.goHome());

    expect(onExit).toHaveBeenCalledTimes(1);
    expect(push).not.toHaveBeenCalled();
  });

  it("flushes pending answers before exiting", async () => {
    const onExit = vi.fn();
    const { result } = renderTrainer({ words: WORDS, onExit });
    await waitFor(() => expect(result.current.screen).toBe("training"));

    act(() => result.current.recordAnswer(WORDS[0], "typing", "学习", true, 900));
    act(() => result.current.goHome());

    expect(mockSubmit).toHaveBeenCalledTimes(1);
    expect(mockSubmit.mock.calls[0][1]).toHaveLength(1);
  });

  it("falls back to router.push when no onExit is given", async () => {
    sessionStorage.setItem("selectedVocabTrainerWords", JSON.stringify(["学习"]));
    mockResolve.mockResolvedValue(WORDS);
    const { result } = renderTrainer();
    await waitFor(() => expect(result.current.screen).toBe("training"));

    act(() => result.current.goHome());

    expect(push).toHaveBeenCalledWith("/learner/vocab");
  });
});

describe("useVocabTrainer — flush on unmount", () => {
  it("submits answers recorded since the last advance", async () => {
    const { result, unmount } = renderTrainer({ words: WORDS });
    await waitFor(() => expect(result.current.screen).toBe("training"));

    act(() => result.current.recordAnswer(WORDS[0], "typing", "学习", true, 900));
    act(() => result.current.recordAnswer(WORDS[1], "typing", "nope", false, 1200));
    expect(mockSubmit).not.toHaveBeenCalled();

    unmount();

    expect(mockSubmit).toHaveBeenCalledTimes(1);
    const [, batch] = mockSubmit.mock.calls[0];
    expect(batch.map((r) => r.word)).toEqual(["学习", "你好"]);
    expect(batch.map((r) => r.is_correct)).toEqual([true, false]);
  });

  it("submits nothing when the batch is already empty", async () => {
    const { result, unmount } = renderTrainer({ words: WORDS });
    await waitFor(() => expect(result.current.screen).toBe("training"));

    act(() => result.current.recordAnswer(WORDS[0], "typing", "学习", true, 900));
    act(() => result.current.advance());
    expect(mockSubmit).toHaveBeenCalledTimes(1);

    unmount();

    expect(mockSubmit).toHaveBeenCalledTimes(1);
  });
});
