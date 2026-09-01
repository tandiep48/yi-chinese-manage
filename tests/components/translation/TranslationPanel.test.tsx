import { describe, it, expect } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { TranslationPanel } from "@/components/page/learner/translation/TranslationPanel";
import { I18nProvider } from "@/components/i18n/I18nProvider";
import type { TranslationRow } from "@/lib/types/types";

const ROWS: TranslationRow[] = [
  { translation_id: "H2_2_1", cn: "起床了吗？", vn: "Dậy chưa?", en: "Are you up?" },
];

function renderPanel(rows: TranslationRow[], loading = false, error: string | null = null) {
  return render(
    <I18nProvider>
      <TranslationPanel rows={rows} loading={loading} error={error} />
    </I18nProvider>
  );
}

describe("TranslationPanel", () => {
  it("shows the meaning and an input, hiding the answer until revealed", () => {
    renderPanel(ROWS);
    expect(screen.getByText("Are you up?")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Type the Chinese here")).toBeInTheDocument();
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
