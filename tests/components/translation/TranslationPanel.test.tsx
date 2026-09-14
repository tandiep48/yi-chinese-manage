import { describe, it, expect } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { TranslationPanel } from "@/components/page/learner/translation/TranslationPanel";
import { I18nProvider } from "@/components/i18n/I18nProvider";
import type { TranslationRow } from "@/lib/types/types";

const ROWS: TranslationRow[] = [
  { translation_id: "H2_2_1", cn: "起床了吗？", vn: "Dậy chưa?", en: "Are you up?" },
];

const DECK: TranslationRow[] = [
  ...ROWS,
  { translation_id: "H2_2_2", cn: "我在吃饭。", vn: "Tôi đang ăn.", en: "I am eating." },
  { translation_id: "H2_2_3", cn: "明天见。", vn: "Hẹn gặp lại.", en: "See you tomorrow." },
];

function renderPanel(rows: TranslationRow[], loading = false, error: string | null = null) {
  return render(
    <I18nProvider>
      <TranslationPanel rows={rows} loading={loading} error={error} />
    </I18nProvider>
  );
}

const input = () => screen.getByPlaceholderText("Type the Chinese here");

describe("TranslationPanel", () => {
  it("shows the meaning and an input, hiding the answer until revealed", () => {
    renderPanel(ROWS);
    expect(screen.getByText("Are you up?")).toBeInTheDocument();
    expect(input()).toBeInTheDocument();
    expect(screen.queryByText("起床了吗？")).not.toBeInTheDocument();
  });

  it("reveals and hides the Chinese answer on toggle", () => {
    renderPanel(ROWS);
    fireEvent.click(screen.getByRole("button", { name: "Show answer" }));
    expect(screen.getByText("起床了吗？")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Hide answer" }));
    expect(screen.queryByText("起床了吗？")).not.toBeInTheDocument();
  });

  it("shows loading, error and empty states", () => {
    const { rerender } = renderPanel([], true);
    expect(screen.getByText("Loading translations...")).toBeInTheDocument();

    rerender(
      <I18nProvider>
        <TranslationPanel rows={[]} loading={false} error="boom" />
      </I18nProvider>
    );
    expect(screen.getByText("Failed to load translations.")).toBeInTheDocument();

    rerender(
      <I18nProvider>
        <TranslationPanel rows={[]} loading={false} error={null} />
      </I18nProvider>
    );
    expect(screen.getByText("No translations found for this lesson.")).toBeInTheDocument();
  });
});

// The card drill: one sentence at a time, navigated with the buttons or the arrow keys.
describe("TranslationPanel card drill", () => {
  it("shows one card at a time with a counter", () => {
    renderPanel(DECK);
    expect(screen.getByText("1 / 3")).toBeInTheDocument();
    expect(screen.getByText("Are you up?")).toBeInTheDocument();
    expect(screen.queryByText("I am eating.")).not.toBeInTheDocument();
  });

  it("disables Prev on the first card and Next on the last", () => {
    renderPanel(DECK);
    expect(screen.getByRole("button", { name: /Prev/ })).toBeDisabled();
    expect(screen.getByRole("button", { name: /Next/ })).toBeEnabled();

    fireEvent.click(screen.getByRole("button", { name: /Next/ }));
    fireEvent.click(screen.getByRole("button", { name: /Next/ }));

    expect(screen.getByText("3 / 3")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Next/ })).toBeDisabled();
    expect(screen.getByRole("button", { name: /Prev/ })).toBeEnabled();
  });

  it("clears the typed answer and re-hides the reveal on a card change", () => {
    renderPanel(DECK);
    fireEvent.change(input(), { target: { value: "起床了吗？" } });
    fireEvent.click(screen.getByRole("button", { name: "Show answer" }));
    expect(screen.getByText("起床了吗？")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /Next/ }));

    expect(input()).toHaveValue("");
    expect(screen.getByRole("button", { name: "Show answer" })).toBeInTheDocument();
  });

  it("highlights the input once the typed Chinese matches, ignoring surrounding space", () => {
    renderPanel(DECK);
    expect(input().className).not.toContain("success-highlight");

    fireEvent.change(input(), { target: { value: "起床了" } });
    expect(input().className).not.toContain("success-highlight");

    fireEvent.change(input(), { target: { value: "  起床了吗？ " } });
    expect(input().className).toContain("success-highlight");
  });

  it("moves between cards with the arrow keys", () => {
    renderPanel(DECK);
    input().blur();

    fireEvent.keyDown(document, { key: "ArrowRight" });
    expect(screen.getByText("2 / 3")).toBeInTheDocument();
  });

  // Arrow keys belong to the caret while the learner is typing, so the drill ignores
  // them then — and each card autofocuses its input, exactly as translation.js does.
  it("ignores the arrow keys while the input has focus", () => {
    renderPanel(DECK);
    input().focus();

    fireEvent.keyDown(document, { key: "ArrowRight" });
    expect(screen.getByText("1 / 3")).toBeInTheDocument();
  });

  it("shuffles the deck back to the first card", () => {
    renderPanel(DECK);
    fireEvent.click(screen.getByRole("button", { name: /Next/ }));
    expect(screen.getByText("2 / 3")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /Shuffle/ }));

    expect(screen.getByText("1 / 3")).toBeInTheDocument();
    // The deck keeps its size; which sentence leads is random.
    expect(screen.getByRole("button", { name: /Prev/ })).toBeDisabled();
  });
});
