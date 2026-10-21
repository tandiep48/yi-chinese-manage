// tests/components/learner/VocabCardList.test.tsx
// The mobile card view of a page of vocab rows: it renders one card per word
// (hanzi / pinyin / meaning), selection flows through the same props the table
// uses, tapping a card opens the full-detail sheet, and the sheet's stroke
// button defers to the page's stroke modal.

import { describe, it, expect, vi } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { VocabCardList } from "@/components/page/learner/vocab/VocabCardList";
import { I18nProvider } from "@/components/i18n/I18nProvider";
import type { VocabRow } from "@/lib/types/vocab";

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

function renderList(props: Partial<Parameters<typeof VocabCardList>[0]> = {}) {
  const onToggleWord = vi.fn();
  const onTogglePage = vi.fn();
  const onOpenStroke = vi.fn();
  render(
    <I18nProvider>
      <VocabCardList
        rows={props.rows ?? [row("学习"), row("你好")]}
        isSelected={props.isSelected ?? (() => false)}
        allOnPageSelected={props.allOnPageSelected ?? false}
        onToggleWord={onToggleWord}
        onTogglePage={onTogglePage}
        onOpenStroke={onOpenStroke}
      />
    </I18nProvider>
  );
  return { onToggleWord, onTogglePage, onOpenStroke };
}

describe("VocabCardList", () => {
  it("renders a card per word with its pinyin and meaning", () => {
    renderList();
    expect(screen.getByText("学习")).toBeInTheDocument();
    expect(screen.getByText("学习-py")).toBeInTheDocument();
    expect(screen.getByText("学习-vn")).toBeInTheDocument();
    expect(screen.getByText("你好")).toBeInTheDocument();
  });

  it("ticks a card to select that word", async () => {
    const user = userEvent.setup();
    const { onToggleWord } = renderList();

    // The first checkbox is select-all; the rest are per-card.
    const boxes = screen.getAllByRole("checkbox");
    await user.click(boxes[1]);

    expect(onToggleWord).toHaveBeenCalledWith(
      expect.objectContaining({ word: "学习" }),
      true
    );
  });

  it("select-all passes every row through onTogglePage", async () => {
    const user = userEvent.setup();
    const { onTogglePage } = renderList();

    await user.click(screen.getByRole("checkbox", { name: /Select visible rows/i }));

    expect(onTogglePage).toHaveBeenCalledWith(
      expect.arrayContaining([expect.objectContaining({ word: "学习" })]),
      true
    );
  });

  it("tapping a card opens the detail sheet showing only the UI-language meaning", async () => {
    const user = userEvent.setup();
    renderList();

    // The EN meaning lives only in the detail sheet, not on the card.
    expect(screen.queryByText("学习-en")).toBeNull();
    await user.click(screen.getByRole("button", { name: /学习/ }));

    // Tests pin the UI language to English: the sheet shows the EN meaning and
    // not the VN one (no cross-language fallback inside the sheet).
    const sheet = screen.getByRole("dialog");
    expect(within(sheet).getByText("学习-en")).toBeInTheDocument();
    expect(within(sheet).queryByText("学习-vn")).toBeNull();
  });

  it("renders no checkboxes when selectable is false", () => {
    render(
      <I18nProvider>
        <VocabCardList rows={[row("学习"), row("你好")]} selectable={false} />
      </I18nProvider>
    );
    expect(screen.queryAllByRole("checkbox")).toHaveLength(0);
    // The cards themselves still render.
    expect(screen.getByText("学习")).toBeInTheDocument();
  });

  it("the detail sheet's stroke button defers to onOpenStroke", async () => {
    const user = userEvent.setup();
    const { onOpenStroke } = renderList();

    await user.click(screen.getByRole("button", { name: /学习/ }));
    await user.click(screen.getByRole("button", { name: /Stroke/i }));

    expect(onOpenStroke).toHaveBeenCalledWith("学习", "学习-py");
  });
});
