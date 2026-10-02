// tests/components/lesson/LessonCardStudy.test.tsx
// The per-line lesson-card viewer: card content, prev/next navigation (the last
// line's "Finish" returning to the summary), the Summary controls, and the
// milestone chrome props that hide those controls and lock the last line.

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { LessonCardStudy } from "@/components/page/learner/lesson/LessonCardStudy";
import type { LessonPassageLine } from "@/lib/types/lesson";

vi.mock("@/components/i18n/I18nProvider", () => ({
  useT: () => ({ t: (key: string) => key, lang: "en" }),
}));

function line(content: string, over: Partial<LessonPassageLine> = {}): LessonPassageLine {
  return {
    line_id: content.length,
    speaker: null,
    content,
    pinyin: `${content}-py`,
    // Empty audio_key: the audio effect returns early, so no <audio> is built.
    audio_key: "",
    translations: { en: `${content}-en`, vi: `${content}-vi` },
    tokens: [],
    flag: 0,
    ...over,
  };
}

const LINES = [line("你好"), line("再见")];

beforeEach(() => {
  vi.clearAllMocks();
});

function setup(over: Partial<Parameters<typeof LessonCardStudy>[0]> = {}) {
  const onShowSummary = vi.fn();
  render(<LessonCardStudy lines={LINES} folder="HSK1" onShowSummary={onShowSummary} {...over} />);
  return { onShowSummary };
}

describe("LessonCardStudy", () => {
  it("renders the first line and a 1 / N counter", () => {
    setup();
    expect(screen.getByText("你好")).toBeInTheDocument();
    expect(screen.getByText("你好-en")).toBeInTheDocument();
    expect(screen.getByText("1 / 2")).toBeInTheDocument();
  });

  it("disables Prev on the first line and advances with Next", () => {
    setup();
    expect(screen.getByRole("button", { name: /reading.prev/ })).toBeDisabled();
    fireEvent.click(screen.getByRole("button", { name: /reading.next/ }));
    expect(screen.getByText("再见")).toBeInTheDocument();
    expect(screen.getByText("2 / 2")).toBeInTheDocument();
  });

  it("shows both Summary controls by default and returns to the summary", () => {
    const { onShowSummary } = setup();
    // The topbar back button and the nav-row Summary button both read "Summary".
    const summaryButtons = screen.getAllByRole("button", { name: /reading.summary/ });
    expect(summaryButtons).toHaveLength(2);

    fireEvent.click(summaryButtons[0]);
    expect(onShowSummary).toHaveBeenCalledTimes(1);
  });

  it("shows Finish on the last line and returns to the summary", () => {
    const { onShowSummary } = setup();
    fireEvent.click(screen.getByRole("button", { name: /reading.next/ }));
    fireEvent.click(screen.getByRole("button", { name: /grammar.finish/ }));
    expect(onShowSummary).toHaveBeenCalledTimes(1);
  });

  // ── Milestone chrome (step 5) ──
  it("removes both Summary controls when hidden", () => {
    setup({ hideSummaryButton: true, hideBackSummary: true });
    expect(screen.queryAllByRole("button", { name: /reading.summary/ })).toHaveLength(0);
  });

  it("locks the last line instead of showing Finish when lockAtEnd is set", () => {
    const { onShowSummary } = setup({ lockAtEnd: true });
    fireEvent.click(screen.getByRole("button", { name: /reading.next/ }));
    expect(screen.getByText("2 / 2")).toBeInTheDocument();

    expect(screen.queryByRole("button", { name: /grammar.finish/ })).toBeNull();
    const next = screen.getByRole("button", { name: /reading.next/ });
    expect(next).toBeDisabled();
    fireEvent.click(next);
    expect(onShowSummary).not.toHaveBeenCalled();
  });
});
