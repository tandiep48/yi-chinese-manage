import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { WordPopup } from "@/components/page/learner/lesson/WordPopup";
import { I18nProvider } from "@/components/i18n/I18nProvider";
import type { VocabLookup } from "@/lib/types/vocab";

// StrokeOrder pulls in HanziWriter (dynamic import + CDN); stub it out.
vi.mock("@/components/page/learner/lesson/StrokeOrder", () => ({
  StrokeOrder: ({ word }: { word: string }) => <div data-testid="stroke-order">{word}</div>,
}));

const ENTRY: VocabLookup = { pinyin: "máng", meaning_vn: "bận", meaning_en: "busy", audio_key: "mang_1" };

function renderPopup(props: Partial<Parameters<typeof WordPopup>[0]> = {}) {
  const onClose = vi.fn();
  const onToggleSave = vi.fn();
  render(
    <I18nProvider>
      <WordPopup
        word="忙"
        entry={ENTRY}
        saveEnabled={false}
        isSaved={false}
        onToggleSave={onToggleSave}
        onClose={onClose}
        {...props}
      />
    </I18nProvider>
  );
  return { onClose, onToggleSave };
}

describe("WordPopup", () => {
  it("shows the word, pinyin, both meanings and an audio button when found", () => {
    renderPopup();
    expect(screen.getByText("忙")).toBeInTheDocument();
    expect(screen.getByText("máng")).toBeInTheDocument();
    expect(screen.getByText("bận")).toBeInTheDocument();
    expect(screen.getByText("busy")).toBeInTheDocument();
    expect(screen.getByText("Listen")).toBeInTheDocument();
  });

  it("shows the not-found state and hides the audio button for unknown words", () => {
    renderPopup({ entry: null });
    expect(screen.getByText("Not found in vocabulary")).toBeInTheDocument();
    expect(screen.queryByText("Listen")).not.toBeInTheDocument();
  });

  it("hides the audio button when the found word has no audio", () => {
    renderPopup({ entry: { ...ENTRY, audio_key: null } });
    expect(screen.queryByText("Listen")).not.toBeInTheDocument();
  });

  it("shows the save toggle only for book lessons and known words", () => {
    const { onToggleSave } = renderPopup({ saveEnabled: true });
    const saveBtn = screen.getByText("Add to list");
    fireEvent.click(saveBtn);
    expect(onToggleSave).toHaveBeenCalled();
  });

  it("reflects the saved state on the toggle", () => {
    renderPopup({ saveEnabled: true, isSaved: true });
    expect(screen.getByText("Added")).toBeInTheDocument();
    expect(screen.queryByText("Add to list")).not.toBeInTheDocument();
  });

  it("does not offer saving for HSK lessons even when the word is known", () => {
    renderPopup({ saveEnabled: false });
    expect(screen.queryByText("Add to list")).not.toBeInTheDocument();
  });

  it("toggles the stroke-order panel", () => {
    renderPopup();
    expect(screen.queryByTestId("stroke-order")).not.toBeInTheDocument();
    fireEvent.click(screen.getByText("Stroke"));
    expect(screen.getByTestId("stroke-order")).toBeInTheDocument();
  });

  it("closes on the close button, the backdrop and Escape", () => {
    const { onClose } = renderPopup();
    fireEvent.click(screen.getByLabelText("Close"));
    expect(onClose).toHaveBeenCalledTimes(1);

    fireEvent.keyDown(window, { key: "Escape" });
    expect(onClose).toHaveBeenCalledTimes(2);
  });
});
