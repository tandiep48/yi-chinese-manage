// tests/components/FlashcardView.test.tsx
// The flash-card review screen: card content, the hidden-until-revealed pinyin/
// meaning, keyboard navigation (A/D), reveal (S/W), shuffle (Space), stroke (Q),
// the typing self-check, and the Summary hand-off.

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { FlashcardView } from "@/components/page/learner/vocab-learning/FlashcardView";
import type { LessonVocabRow } from "@/lib/types/vocab";

vi.mock("@/components/i18n/I18nProvider", () => ({
  useT: () => ({ t: (key: string) => key, lang: "en" }),
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
  const utils = render(
    <FlashcardView words={WORDS} onOpenStroke={onOpenStroke} onShowSummary={onShowSummary} {...over} />
  );
  return { ...utils, onOpenStroke, onShowSummary };
}

const press = (key: string) => fireEvent.keyDown(document, { key });

describe("FlashcardView", () => {
  it("renders the first card and a 1 / N counter, pinyin/meaning hidden", () => {
    const { container } = setup();
    expect(screen.getByText("水")).toBeInTheDocument();
    expect(screen.getByText("1 / 2")).toBeInTheDocument();
    expect(container.querySelector(".vl-pinyin")?.textContent).toBe("");
    expect(container.querySelector(".vl-meaning")?.textContent).toBe("");
  });

  it("reveals pinyin and meaning with S", () => {
    setup();
    press("s");
    expect(screen.getByText("shuǐ")).toBeInTheDocument();
    expect(screen.getByText("water")).toBeInTheDocument();
  });

  it("navigates with A / D and re-hides the reveal on the new card", () => {
    const { container } = setup();
    press("s");
    expect(screen.getByText("shuǐ")).toBeInTheDocument();
    press("d");
    expect(screen.getByText("2 / 2")).toBeInTheDocument();
    expect(container.querySelector(".vl-pinyin")?.textContent).toBe("");
    press("a");
    expect(screen.getByText("1 / 2")).toBeInTheDocument();
  });

  it("D past the last card returns to the summary", () => {
    const { onShowSummary } = setup();
    press("d");
    press("d");
    expect(onShowSummary).toHaveBeenCalledTimes(1);
  });

  it("Space shuffles and resets to the first card", () => {
    setup();
    press("d");
    expect(screen.getByText("2 / 2")).toBeInTheDocument();
    press(" ");
    expect(screen.getByText("1 / 2")).toBeInTheDocument();
  });

  it("opens stroke order with Q", () => {
    const { onOpenStroke } = setup();
    press("q");
    expect(onOpenStroke).toHaveBeenCalledWith("水", "shuǐ");
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
    press("d");
    const nextInput = screen.getByPlaceholderText("vocab_learning.typing_placeholder") as HTMLInputElement;
    expect(nextInput.value).toBe("");
  });

  it("invokes onShowSummary from the Summary button", () => {
    const { onShowSummary } = setup();
    fireEvent.click(screen.getByRole("button", { name: /reading.summary/ }));
    expect(onShowSummary).toHaveBeenCalledTimes(1);
  });

  // ── Milestone chrome (step 2) ──
  it("hides the Summary button when hideSummaryButton is set", () => {
    setup({ hideSummaryButton: true });
    expect(screen.queryByRole("button", { name: /reading.summary/ })).toBeNull();
  });

  it("locks the last card when lockAtEnd is set", () => {
    const { onShowSummary } = setup({ lockAtEnd: true });
    press("d");
    expect(screen.getByText("2 / 2")).toBeInTheDocument();
    press("d");
    expect(onShowSummary).not.toHaveBeenCalled();
    expect(screen.getByText("2 / 2")).toBeInTheDocument();
  });
});
