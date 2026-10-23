// tests/components/lesson/WordSummaryScroll.test.tsx
// Item 4: "Play all" in the vocab summary (milestone step 1) follows the playing
// word — the highlighted card scrolls into view, matching LessonSummary. The audio
// sequence is mocked so a chosen activeKey can be asserted without real playback.

import { describe, it, expect, beforeEach, afterAll, vi } from "vitest";
import { render } from "@testing-library/react";
import { WordSummary } from "@/components/page/learner/lesson/WordSummary";
import { I18nProvider } from "@/components/i18n/I18nProvider";
import type { LessonVocabRow } from "@/lib/types/vocab";

const seq = vi.hoisted(() => ({ activeKey: "休息" as string | null }));
vi.mock("@/hooks/shared/useAudioSequence", () => ({
  useAudioSequence: () => ({
    activeKey: seq.activeKey,
    sequenceActive: seq.activeKey != null,
    playSingle: () => {},
    toggleSequence: () => {},
    stop: () => {},
  }),
}));

const VOCAB: LessonVocabRow[] = [
  { cn: "休息", pinyin: "xiūxī", meaning_vn: "nghỉ ngơi", meaning_en: "to rest", audio_key: "xiuxi_1", hsk_level: "HSK2" },
  { cn: "忙", pinyin: "máng", meaning_vn: "bận", meaning_en: "busy", audio_key: "mang_1", hsk_level: "HSK2" },
];

const scrollSpy = vi.fn();
const realScroll = Element.prototype.scrollIntoView;
Element.prototype.scrollIntoView = scrollSpy;
afterAll(() => {
  Element.prototype.scrollIntoView = realScroll;
});

function renderWith() {
  return render(
    <I18nProvider>
      <WordSummary vocab={VOCAB} loading={false} error={null} hideActions />
    </I18nProvider>
  );
}

describe("WordSummary play-all follows the active word", () => {
  beforeEach(() => {
    scrollSpy.mockClear();
  });

  it("scrolls the highlighted card into view", () => {
    seq.activeKey = "休息";
    const { container } = renderWith();
    expect(scrollSpy).toHaveBeenCalledWith({ behavior: "smooth", block: "center" });
    const active = container.querySelector(".playing-highlight");
    expect(active?.textContent).toContain("休息");
    // The scroll fired on the highlighted card itself, not some other element.
    expect(scrollSpy.mock.contexts[0]).toBe(active);
  });

  it("does not scroll when no word is playing", () => {
    seq.activeKey = null;
    renderWith();
    expect(scrollSpy).not.toHaveBeenCalled();
  });
});
