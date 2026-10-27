// tests/components/home/ReviewTab.test.tsx
// The Word Review dashboard panel is watch-only: it mounts the shared
// VocabReviewPage embedded (no trainer, no run/setRun), which hides the
// back-to-dashboard link and shows the two word lists. The list behaviour itself
// is covered by tests/components/learner/VocabReviewPage.test.tsx.

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { I18nProvider } from "@/components/i18n/I18nProvider";
import { getLearnedVocab, getReviewRecent } from "@/lib/api/learner/vocab";
import { invalidateVocabReview } from "@/hooks/vocab/useVocabReview";
import { ReviewTab } from "@/components/page/learner/home/ReviewTab";
import type { VocabRow } from "@/lib/types/vocab";

vi.mock("@/lib/api/learner/vocab", () => ({
  getLearnedVocab: vi.fn(),
  getReviewRecent: vi.fn(),
}));

const mockRecent = getLearnedVocab as unknown as ReturnType<typeof vi.fn>;
const mockReview = getReviewRecent as unknown as ReturnType<typeof vi.fn>;

const ROWS: VocabRow[] = [
  { word: "学习", cn: "学习", pinyin: "xuéxí", meaning_en: "to study", meaning_vn: "học", audio_key: "a1", level: "HSK1" },
  { word: "你好", cn: "你好", pinyin: "nǐhǎo", meaning_en: "hello", meaning_vn: "xin chào", audio_key: "a2", level: "HSK1" },
];

beforeEach(() => {
  vi.clearAllMocks();
  invalidateVocabReview();
  mockRecent.mockResolvedValue({ rows: ROWS, page: 1, page_size: 50, total: 2, total_pages: 1 });
  mockReview.mockResolvedValue({ rows: [], page: 1, page_size: 50, total: 0, total_pages: 1 });
});

describe("ReviewTab", () => {
  it("renders the embedded, watch-only review list", async () => {
    render(
      <I18nProvider>
        <ReviewTab />
      </I18nProvider>
    );

    await screen.findByText("学习");
    // Watch-only: no selection, no trainer start.
    expect(screen.queryAllByRole("checkbox")).toHaveLength(0);
    expect(screen.queryByRole("button", { name: /start/i })).toBeNull();
    // Embedded: the back-to-dashboard link is suppressed.
    expect(screen.queryByText(/back to dashboard/i)).toBeNull();
  });

  it("offers both source tabs", async () => {
    render(
      <I18nProvider>
        <ReviewTab />
      </I18nProvider>
    );

    await screen.findByText("学习");
    expect(screen.getByRole("tab", { name: "Recent learn word" })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "Review word" })).toBeInTheDocument();
  });
});
