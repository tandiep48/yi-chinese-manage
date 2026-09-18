// tests/components/learner/VocabReviewPage.test.tsx
// Covers what the review page renders on top of useVocabReview: the word list and
// its count, the start button's selection-aware label and disabled state, and the
// sessionStorage handoff to the batch trainer.

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { VocabReviewPage } from "@/components/page/learner/vocab-review/VocabReviewPage";
import { I18nProvider } from "@/components/i18n/I18nProvider";
import { getVocabReview } from "@/lib/api/learner/vocab";
import { useRouter } from "next/navigation";
import type { VocabRow } from "@/lib/types/vocab";

vi.mock("@/lib/api/learner/vocab", () => ({ getVocabReview: vi.fn() }));
vi.mock("next/navigation", () => ({ useRouter: vi.fn() }));

const mockReview = getVocabReview as unknown as ReturnType<typeof vi.fn>;
const push = vi.fn();

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
  return { rows, page: 1, page_size: 100, total: rows.length, total_pages: 1, ...over };
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
  sessionStorage.clear();
  vi.mocked(useRouter).mockReturnValue({ push } as unknown as ReturnType<typeof useRouter>);
  mockReview.mockResolvedValue(response([]));
});

describe("VocabReviewPage", () => {
  it("renders each word with its pinyin and meaning, and the loaded count", async () => {
    mockReview.mockResolvedValue(response([row("学习"), row("你好")]));
    renderPage();

    await screen.findByText("学习");
    expect(screen.getByText("学习-py")).toBeInTheDocument();
    expect(screen.getByText("学习-en")).toBeInTheDocument();
    expect(screen.getByText("你好")).toBeInTheDocument();
    expect(screen.getByText("2")).toBeInTheDocument();
  });

  it("shows the empty state when there is nothing to review", async () => {
    renderPage();
    expect(await screen.findByText("Nothing to review right now.")).toBeInTheDocument();
  });

  it("shows the failure message when the list cannot be loaded", async () => {
    mockReview.mockRejectedValue(new Error("network"));
    renderPage();

    expect(
      await screen.findByText("Could not load your words. Please try again.")
    ).toBeInTheDocument();
  });

  it("keeps the start button disabled until a word is picked, and counts the picks", async () => {
    mockReview.mockResolvedValue(response([row("水"), row("火")]));
    const user = userEvent.setup();
    renderPage();
    await screen.findByText("水");

    const start = screen.getByRole("button", { name: /Start training/ });
    expect(start).toBeDisabled();

    // The first checkbox is select-all; the rest are the word rows.
    const boxes = screen.getAllByRole("checkbox");
    await user.click(boxes[1]);

    expect(screen.getByRole("button", { name: "Start training (1)" })).toBeEnabled();
  });

  it("select-all ticks every row", async () => {
    mockReview.mockResolvedValue(response([row("上"), row("下")]));
    const user = userEvent.setup();
    renderPage();
    await screen.findByText("上");

    await user.click(screen.getAllByRole("checkbox")[0]);

    expect(screen.getByRole("button", { name: "Start training (2)" })).toBeEnabled();
    screen.getAllByRole("checkbox").forEach((box) => expect(box).toBeChecked());
  });

  it("hands the selected words to the batch trainer", async () => {
    mockReview.mockResolvedValue(response([row("左"), row("右")]));
    const user = userEvent.setup();
    renderPage();
    await screen.findByText("左");

    await user.click(screen.getAllByRole("checkbox")[1]);
    await user.click(screen.getByRole("button", { name: "Start training (1)" }));

    expect(sessionStorage.getItem("selectedVocabTrainerWords")).toBe(
      JSON.stringify(["左"])
    );
    expect(push).toHaveBeenCalledWith("/learner/vocab-training-batch");
  });

  it("offers Load more only while pages remain, then appends them", async () => {
    mockReview.mockResolvedValueOnce(
      response([row("前")], { page: 1, total_pages: 2, total: 2 })
    );
    const user = userEvent.setup();
    renderPage();
    await screen.findByText("前");

    mockReview.mockResolvedValueOnce(
      response([row("后")], { page: 2, total_pages: 2, total: 2 })
    );
    await user.click(screen.getByRole("button", { name: "Load more" }));

    await screen.findByText("后");
    await waitFor(() =>
      expect(screen.queryByRole("button", { name: "Load more" })).toBeNull()
    );
  });
});
