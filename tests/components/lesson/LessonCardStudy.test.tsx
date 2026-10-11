// tests/components/lesson/LessonCardStudy.test.tsx
// The per-line lesson-card viewer: card content, hidden-until-revealed pinyin/
// meaning, keyboard navigation (A/D) and reveal (S), the Summary controls, and the
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
  const utils = render(
    <LessonCardStudy lines={LINES} folder="HSK1" onShowSummary={onShowSummary} {...over} />
  );
  return { ...utils, onShowSummary };
}

const press = (key: string) => fireEvent.keyDown(document, { key });

describe("LessonCardStudy", () => {
  it("renders the first line and a 1 / N counter, meaning hidden", () => {
    const { container } = setup();
    expect(screen.getByText("你好")).toBeInTheDocument();
    expect(screen.getByText("1 / 2")).toBeInTheDocument();
    expect(container.querySelector(".vl-meaning")?.textContent).toBe("");
  });

  it("reveals pinyin and meaning with S", () => {
    setup();
    press("s");
    expect(screen.getByText("你好-py")).toBeInTheDocument();
    expect(screen.getByText("你好-en")).toBeInTheDocument();
  });

  it("navigates with A / D", () => {
    setup();
    press("d");
    expect(screen.getByText("再见")).toBeInTheDocument();
    expect(screen.getByText("2 / 2")).toBeInTheDocument();
    press("a");
    expect(screen.getByText("1 / 2")).toBeInTheDocument();
  });

  it("shows both Summary controls by default and returns to the summary", () => {
    const { onShowSummary } = setup();
    const summaryButtons = screen.getAllByRole("button", { name: /reading.summary/ });
    expect(summaryButtons).toHaveLength(2);
    fireEvent.click(summaryButtons[0]);
    expect(onShowSummary).toHaveBeenCalledTimes(1);
  });

  it("D past the last line returns to the summary", () => {
    const { onShowSummary } = setup();
    press("d");
    press("d");
    expect(onShowSummary).toHaveBeenCalledTimes(1);
  });

  // ── Milestone chrome (step 5) ──
  it("removes both Summary controls when hidden", () => {
    setup({ hideSummaryButton: true, hideBackSummary: true });
    expect(screen.queryAllByRole("button", { name: /reading.summary/ })).toHaveLength(0);
  });

  it("locks the last line when lockAtEnd is set", () => {
    const { onShowSummary } = setup({ lockAtEnd: true });
    press("d");
    expect(screen.getByText("2 / 2")).toBeInTheDocument();
    press("d");
    expect(onShowSummary).not.toHaveBeenCalled();
    expect(screen.getByText("2 / 2")).toBeInTheDocument();
  });
});
