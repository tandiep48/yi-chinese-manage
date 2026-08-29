import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { AdvancedPinyinTable } from "@/components/page/learner/pinyin/AdvancedPinyinTable";
import { I18nProvider } from "@/components/i18n/I18nProvider";

// jsdom implements neither audio playback nor speech synthesis; stub speech so a
// tone click (which speaks the syllable) exercises the handler without throwing.
beforeEach(() => {
  // @ts-expect-error minimal speechSynthesis stub
  window.speechSynthesis = { speak: vi.fn(), cancel: vi.fn() };
  // jsdom has no SpeechSynthesisUtterance; a stub that records the text is enough.
  class UtteranceStub {
    text: string;
    lang = "";
    constructor(text: string) {
      this.text = text;
    }
  }
  // @ts-expect-error assign stub onto the test global
  window.SpeechSynthesisUtterance = UtteranceStub;
});

function renderTable() {
  return render(
    <I18nProvider>
      <AdvancedPinyinTable />
    </I18nProvider>
  );
}

describe("AdvancedPinyinTable", () => {
  it("renders the initial headers and final row labels", () => {
    renderTable();
    // 3 tables each repeat the 21 initial column headers.
    expect(screen.getAllByRole("columnheader", { name: "zh" })).toHaveLength(3);
    // The bare-final syllable is itself a clickable cell.
    expect(screen.getByRole("button", { name: "ang" })).toBeInTheDocument();
  });

  it("opens a tone popover with the four tones of the clicked syllable", () => {
    renderTable();
    fireEvent.click(screen.getByRole("button", { name: "bao" }));
    expect(screen.getByRole("button", { name: "bāo" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "báo" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "bǎo" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "bào" })).toBeInTheDocument();
  });

  it("speaks the toned syllable and closes the popover when a tone is chosen", () => {
    renderTable();
    fireEvent.click(screen.getByRole("button", { name: "bao" }));
    fireEvent.click(screen.getByRole("button", { name: "bǎo" }));
    // Advanced syllables have no bucket recording, so they are spoken directly
    // (no failing .mp3 request).
    expect(window.speechSynthesis.speak).toHaveBeenCalled();
    const utterance = (window.speechSynthesis.speak as unknown as ReturnType<typeof vi.fn>).mock
      .calls[0][0];
    expect(utterance.text).toBe("bǎo");
    expect(screen.queryByRole("button", { name: "bǎo" })).not.toBeInTheDocument();
  });

  it("toggles the popover closed when the same syllable is clicked again", () => {
    renderTable();
    const cell = screen.getByRole("button", { name: "bao" });
    fireEvent.click(cell);
    expect(screen.getByRole("button", { name: "bāo" })).toBeInTheDocument();
    fireEvent.click(cell);
    expect(screen.queryByRole("button", { name: "bāo" })).not.toBeInTheDocument();
  });
});
