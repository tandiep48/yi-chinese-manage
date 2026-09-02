// tests/components/FlashcardView.test.tsx
// The flash-card review screen: card content, prev/next navigation (with the
// last card's "Finish" going back to the summary), the typing self-check, and
// the summary hand-off.

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { FlashcardView } from "@/components/page/learner/vocab-learning/FlashcardView";
import type { LessonVocabRow } from "@/lib/types/types";

vi.mock("@/components/i18n/I18nProvider", () => ({
  useT: () => ({
    t: (key: string) => key,
    lang: "en",
  }),
}));

const WORDS: LessonVocabRow[] = [
  { cn: "水", pinyin: "shuǐ", meaning_vn: "nước", meaning_en: "water", audio_key: "", hsk_level: "HSK1" },
  { cn: "火", pinyin: "huǒ", meaning_vn: "lửa", meaning_en: "fire", audio_key: "", hsk_level: "HSK1" },
];

beforeEach(() => {
  vi.clearAllMocks();
});

function setup(over: Partial<Parameters<typeof FlashcardView>[0]> = {}) {
  const onOpenStroke = vi.fn();
  const onShowSummary = vi.fn();
  render(
    <FlashcardView words={WORDS} onOpenStroke={onOpenStroke} onShowSummary={onShowSummary} {...over} />
  );
  return { onOpenStroke, onShowSummary };
}

describe("FlashcardView", () => {
  it("renders the first card and a 1 / N counter", () => {
    setup();
    expect(screen.getByText("水")).toBeInTheDocument();
    expect(screen.getByText("shuǐ")).toBeInTheDocument();
    expect(screen.getByText("water")).toBeInTheDocument();
    expect(screen.getByText("1 / 2")).toBeInTheDocument();
  });

  it("disables Prev on the first card and advances with Next", () => {
    setup();
    const prev = screen.getByRole("button", { name: /reading.prev/ });
    expect(prev).toBeDisabled();

    fireEvent.click(screen.getByRole("button", { name: /reading.next/ }));
    expect(screen.getByText("火")).toBeInTheDocument();
    expect(screen.getByText("2 / 2")).toBeInTheDocument();
  });

  it("shows Finish on the last card and returns to the summary", () => {
    const { onShowSummary } = setup();
    fireEvent.click(screen.getByRole("button", { name: /reading.next/ }));
    const finish = screen.getByRole("button", { name: /vocab_learning.finish/ });
    fireEvent.click(finish);
    expect(onShowSummary).toHaveBeenCalledTimes(1);
  });

  it("highlights the input when the typed characters match the word", () => {
    setup();
    const input = screen.getByPlaceholderText("vocab_learning.typing_placeholder");
    fireEvent.change(input, { target: { value: "火" } });
    expect(input).not.toHaveClass("success-highlight");
    fireEvent.change(input, { target: { value: "水" } });
    expect(input).toHaveClass("success-highlight");
  });

  it("clears the typing box when the card changes", () => {
    setup();
    const input = screen.getByPlaceholderText("vocab_learning.typing_placeholder") as HTMLInputElement;
    fireEvent.change(input, { target: { value: "水" } });
    expect(input.value).toBe("水");
    fireEvent.click(screen.getByRole("button", { name: /reading.next/ }));
    const nextInput = screen.getByPlaceholderText("vocab_learning.typing_placeholder") as HTMLInputElement;
    expect(nextInput.value).toBe("");
  });

  it("invokes onShowSummary from the Summary button", () => {
    const { onShowSummary } = setup();
    fireEvent.click(screen.getByRole("button", { name: /reading.summary/ }));
    expect(onShowSummary).toHaveBeenCalledTimes(1);
  });
});
