import { describe, it, expect } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { WordSummary } from "@/components/page/learner/lesson/WordSummary";
import { I18nProvider } from "@/components/i18n/I18nProvider";
import type { LessonVocabRow } from "@/lib/types/vocab";

const VOCAB: LessonVocabRow[] = [
  { cn: "休息", pinyin: "xiūxī", meaning_vn: "nghỉ ngơi", meaning_en: "to rest", audio_key: "xiuxi_1", hsk_level: "HSK2" },
  { cn: "忙", pinyin: "máng", meaning_vn: "bận", meaning_en: "busy", audio_key: "", hsk_level: "HSK2" },
];

function renderWith(vocab: LessonVocabRow[], loading = false, error: string | null = null) {
  return render(
    <I18nProvider>
      <WordSummary vocab={vocab} loading={loading} error={error} />
    </I18nProvider>
  );
}

describe("WordSummary", () => {
  it("renders a numbered card per word with pinyin and meaning", () => {
    const { container } = renderWith(VOCAB);
    expect(container.querySelectorAll(".vocab-card")).toHaveLength(2);
    expect(screen.getByText("休息")).toBeInTheDocument();
    expect(screen.getByText("xiūxī")).toBeInTheDocument();
    expect(screen.getByText("to rest")).toBeInTheDocument();
  });

  it("groups pinyin and meaning in a text column for the phone layout", () => {
    // The responsive (phone) CSS stacks pinyin over meaning inside .vc-text; guard
    // that wrapper so the port of the vocabulary card layout is not silently undone.
    const { container } = renderWith(VOCAB);
    const text = container.querySelector(".vocab-card .vc-text");
    expect(text).not.toBeNull();
    expect(text!.querySelector(".vc-pinyin")?.textContent).toBe("xiūxī");
    expect(text!.querySelector(".vc-meaning")?.textContent).toBe("to rest");
  });

  it("renders an audio button only for words that have audio", () => {
    renderWith(VOCAB);
    expect(screen.getByRole("button", { name: /休息/ })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /忙/ })).not.toBeInTheDocument();
  });

  it("toggles a column's visibility via the header toggle", () => {
    const { container } = renderWith(VOCAB);
    const cards = container.querySelector(".vl-vocab-cards")!;
    expect(cards.className).not.toContain("hide-cn");
    fireEvent.click(screen.getByRole("button", { name: "Character" }));
    expect(cards.className).toContain("hide-cn");
  });

  it("shows the empty state when there is no vocab", () => {
    renderWith([]);
    expect(screen.getByText("No vocabulary linked to this passage.")).toBeInTheDocument();
  });

  it("disables Play All when nothing has audio", () => {
    renderWith([VOCAB[1]]);
    expect(screen.getByRole("button", { name: /Play All/ })).toBeDisabled();
  });
});
