// tests/components/learner/VocabReviewPage.test.tsx
// The review page is watch-only now: two tabs ("Recent learn word" / "Review
// word"), no selection checkboxes and no Start button. Covers the default tab's
// list + count, the empty / error states, the absence of the selection + start UI,
// switching to the review tab (which hits the other endpoint), and the pager.
//
// The list is the vocabulary page's VocabTable with selection turned off, so the
// meaning column is the one that table defines — VN, falling back to EN.

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { VocabReviewPage } from "@/components/page/learner/vocab-review/VocabReviewPage";
import { I18nProvider } from "@/components/i18n/I18nProvider";
import { invalidateVocabReview } from "@/hooks/vocab/useVocabReview";
import { getLearnedVocab, getReviewRecent } from "@/lib/api/learner/vocab";
import type { VocabRow } from "@/lib/types/vocab";

vi.mock("@/lib/api/learner/vocab", () => ({
  getLearnedVocab: vi.fn(),
  getReviewRecent: vi.fn(),
}));

const mockRecent = getLearnedVocab as unknown as ReturnType<typeof vi.fn>;
const mockReview = getReviewRecent as unknown as ReturnType<typeof vi.fn>;

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

function response(rows: VocabRow[], over = {}) {
  return { rows, page: 1, page_size: 50, total: rows.length, total_pages: 1, ...over };
}

function renderPage() {
  return render(
    <I18nProvider>
      <VocabReviewPage />
    </I18nProvider>
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  invalidateVocabReview();
  mockRecent.mockResolvedValue(response([]));
  mockReview.mockResolvedValue(response([]));
});

describe("VocabReviewPage", () => {
  it("renders the recent tab's words with pinyin, meaning and the loaded count", async () => {
    mockRecent.mockResolvedValue(response([row("学习"), row("你好")]));
    const { container } = renderPage();

    await screen.findByText("学习");
    expect(screen.getByText("学习-py")).toBeInTheDocument();
    expect(screen.getByText("学习-vn")).toBeInTheDocument();
    expect(screen.getByText("你好")).toBeInTheDocument();
    expect(container.querySelector(".review-count")).toHaveTextContent("2");
    expect(mockRecent).toHaveBeenCalledWith(1, 50);
  });

  it("is watch-only: no selection checkboxes and no start button", async () => {
    mockRecent.mockResolvedValue(response([row("水"), row("火")]));
    renderPage();
    await screen.findByText("水");

    expect(screen.queryAllByRole("checkbox")).toHaveLength(0);
    expect(screen.queryByRole("button", { name: /start/i })).toBeNull();
  });

  it("shows the recent tab's empty state", async () => {
    renderPage();
    expect(await screen.findByText("You haven't mastered any words yet.")).toBeInTheDocument();
  });

  it("shows the failure message when the list cannot be loaded", async () => {
    mockRecent.mockRejectedValue(new Error("network"));
    renderPage();
    expect(
      await screen.findByText("Could not load your words. Please try again.")
    ).toBeInTheDocument();
  });

  it("switches to the Review word tab and loads the other endpoint", async () => {
    mockRecent.mockResolvedValue(response([row("学习")]));
    mockReview.mockResolvedValue(response([row("复习")]));
    const user = userEvent.setup();
    renderPage();
    await screen.findByText("学习");

    await user.click(screen.getByRole("tab", { name: "Review word" }));

    await screen.findByText("复习");
    expect(mockReview).toHaveBeenCalledWith(1, 50);
    expect(screen.queryByText("学习")).toBeNull();
    // The subtitle follows the active tab.
    expect(
      screen.getByText("Words to revisit — not yet mastered, or answered slowly.")
    ).toBeInTheDocument();
  });

  it("shows the review tab's own empty state", async () => {
    const user = userEvent.setup();
    renderPage();
    // Wait for the recent tab's (empty) load first.
    await screen.findByText("You haven't mastered any words yet.");

    await user.click(screen.getByRole("tab", { name: "Review word" }));
    expect(await screen.findByText("Nothing to review right now.")).toBeInTheDocument();
  });

  it("shows no pager for a single page of results", async () => {
    mockRecent.mockResolvedValue(response([row("独")]));
    renderPage();
    await screen.findByText("独");
    expect(screen.queryByRole("button", { name: "Next page" })).toBeNull();
  });

  it("navigates to the next page and loads its rows", async () => {
    mockRecent.mockResolvedValueOnce(
      response([row("前")], { page: 1, total: 60, total_pages: 2 })
    );
    const user = userEvent.setup();
    renderPage();
    await screen.findByText("前");

    expect(screen.getByRole("button", { name: "Previous page" })).toBeDisabled();
    expect(screen.getByText("1-50 of 60")).toBeInTheDocument();

    mockRecent.mockResolvedValueOnce(
      response([row("后")], { page: 2, total: 60, total_pages: 2 })
    );
    await user.click(screen.getByRole("button", { name: "Next page" }));

    await screen.findByText("后");
    expect(mockRecent).toHaveBeenLastCalledWith(2, 50);
    expect(screen.queryByText("前")).toBeNull();
    await waitFor(() =>
      expect(screen.getByRole("button", { name: "Previous page" })).toBeEnabled()
    );
  });
});
