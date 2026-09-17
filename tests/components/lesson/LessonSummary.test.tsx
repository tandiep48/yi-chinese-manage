import { describe, it, expect } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { LessonSummary } from "@/components/page/learner/lesson/LessonSummary";
import { I18nProvider } from "@/components/i18n/I18nProvider";
import type { LessonPassageDetail } from "@/lib/types/lesson";

const PASSAGE: LessonPassageDetail = {
  passage_id: "H2_2_2",
  hsk_level: "HSK2",
  lines: [
    {
      line_id: 1,
      speaker: null,
      content: "你好",
      pinyin: "nǐ hǎo",
      audio_key: "line1",
      translations: { en: "hello", vi: "xin chào" },
      tokens: [],
      flag: 0,
    },
  ],
};

function renderWith(passage: LessonPassageDetail | null, loading = false, error: string | null = null) {
  return render(
    <I18nProvider>
      <LessonSummary passage={passage} loading={loading} error={error} />
    </I18nProvider>
  );
}

describe("LessonSummary", () => {
  it("renders a preview line per passage line", () => {
    const { container } = renderWith(PASSAGE);
    expect(container.querySelectorAll(".lesson-preview-line")).toHaveLength(1);
    expect(screen.getByText("你好")).toBeInTheDocument();
  });

  it("keeps pinyin hidden until the toggle is pressed", () => {
    const { container } = renderWith(PASSAGE);
    const pinyin = container.querySelector(".pinyin-text")!;
    expect(pinyin.className).not.toContain("show");
    fireEvent.click(screen.getByRole("button", { name: /Show Pinyin/ }));
    expect(container.querySelector(".pinyin-text")!.className).toContain("show");
  });

  it("reveals the meaning when the meaning toggle is pressed", () => {
    const { container } = renderWith(PASSAGE);
    fireEvent.click(screen.getByRole("button", { name: /Show Meaning/ }));
    expect(container.querySelector(".meaning-text")!.className).toContain("show");
  });

  it("shows the empty state when a passage has no lines", () => {
    renderWith({ ...PASSAGE, lines: [] });
    expect(screen.getByText("No passage lines found for this lesson part.")).toBeInTheDocument();
  });
});
