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

// The three tables render ~1350 nodes, hundreds of them role="button" cells, so
// every *ByRole({ name }) recomputes accessible names across the lot — ~600ms a
// call, and again after each click. That is what pushed these cases past the 5s
// default under load. Syllables are unique text, so address them that way and
// assert the button role explicitly where it is the thing under test.
const syllable = (text: string) => screen.getByText(text);

describe("AdvancedPinyinTable", () => {
  it("renders the initial headers and final row labels", () => {
    renderTable();
    // 3 tables each repeat the 21 initial column headers.
    const headers = screen.getAllByText("zh");
    expect(headers).toHaveLength(3);
    expect(headers.map((h) => h.tagName)).toEqual(["TH", "TH", "TH"]);
    // The bare-final syllable appears twice: as the row label and as a clickable
    // cell. Only the cell carries the button role.
    const ang = screen.getAllByText("ang");
    expect(ang.filter((el) => el.getAttribute("role") === "button")).toHaveLength(1);
  });

  it("opens a tone popover with the four tones of the clicked syllable", () => {
    renderTable();
    fireEvent.click(syllable("bao"));
    // The tones are real buttons; check that once here, then by text.
    expect(syllable("bāo").tagName).toBe("BUTTON");
    expect(syllable("báo")).toBeInTheDocument();
    expect(syllable("bǎo")).toBeInTheDocument();
    expect(syllable("bào")).toBeInTheDocument();
  });

  it("speaks the toned syllable and closes the popover when a tone is chosen", () => {
    renderTable();
    fireEvent.click(syllable("bao"));
    fireEvent.click(syllable("bǎo"));
    // Advanced syllables have no bucket recording, so they are spoken directly
    // (no failing .mp3 request).
    expect(window.speechSynthesis.speak).toHaveBeenCalled();
    const utterance = (window.speechSynthesis.speak as unknown as ReturnType<typeof vi.fn>).mock
      .calls[0][0];
    expect(utterance.text).toBe("bǎo");
    expect(screen.queryByText("bǎo")).not.toBeInTheDocument();
  });

  it("toggles the popover closed when the same syllable is clicked again", () => {
    renderTable();
    const cell = syllable("bao");
    fireEvent.click(cell);
    expect(syllable("bāo")).toBeInTheDocument();
    fireEvent.click(cell);
    expect(screen.queryByText("bāo")).not.toBeInTheDocument();
  });
});
