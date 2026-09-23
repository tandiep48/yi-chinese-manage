// tests/components/home/ReviewTab.test.tsx
// The Word Review panel's in-place run (docs/plans/dashboard-tabs.md Phase 2):
// starting a trainer flips ?run= and feeds it the selected rows directly, with no
// sessionStorage hand-off, no navigation and no /api/vocab/words round trip;
// exiting hands the panel back to the list; and a reload that arrives with ?run=
// set but no selection falls back to the list instead of an empty trainer.

import { useState } from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { I18nProvider } from "@/components/i18n/I18nProvider";
import { getVocabReview } from "@/lib/api/learner/vocab";
import { resolveTrainerWords } from "@/lib/api/learner/vocabTrainer";
import { ReviewTab } from "@/components/page/learner/home/ReviewTab";
import type { VocabRow } from "@/lib/types/vocab";

const push = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push, replace: vi.fn() }),
}));
vi.mock("@/lib/api/learner/vocab", () => ({ getVocabReview: vi.fn() }));
vi.mock("@/lib/api/learner/vocabTrainer", () => ({
  resolveTrainerWords: vi.fn(),
  submitVocabBatch: vi.fn(),
}));

const mockReview = vi.mocked(getVocabReview);
const mockResolve = vi.mocked(resolveTrainerWords);

const ROWS: VocabRow[] = [
  { word: "学习", cn: "学习", pinyin: "xuéxí", meaning_en: "to study", meaning_vn: "học", audio_key: "a1", level: "HSK1" },
  { word: "你好", cn: "你好", pinyin: "nǐhǎo", meaning_en: "hello", meaning_vn: "xin chào", audio_key: "a2", level: "HSK1" },
];

// A stand-in for HomeShell: holds ?run= the way the URL does, so the panel can be
// driven end to end without a router.
function Harness({ initialRun = null }: { initialRun?: string | null }) {
  const [run, setRun] = useState<string | null>(initialRun);
  return (
    <I18nProvider>
      <div data-testid="run">{run ?? "none"}</div>
      <ReviewTab run={run} setRun={setRun} />
    </I18nProvider>
  );
}

const runValue = () => screen.getByTestId("run").textContent;

beforeEach(() => {
  vi.clearAllMocks();
  sessionStorage.clear();
  mockReview.mockResolvedValue({ rows: ROWS, page: 1, page_size: 100, total: 2, total_pages: 1 });
});

describe("ReviewTab — starting a run", () => {
  it("runs the trainer in the panel instead of navigating to it", async () => {
    const user = userEvent.setup();
    render(<Harness />);

    await screen.findByText("学习");
    await user.click(screen.getByRole("checkbox", { name: /Select all/i }));
    await user.click(screen.getByRole("button", { name: /Start training/ }));

    // The trainer's chrome replaces the list, in place.
    await waitFor(() => expect(runValue()).toBe("vocab-trainer"));
    expect(push).not.toHaveBeenCalled();
    expect(sessionStorage.getItem("selectedVocabTrainerWords")).toBeNull();
    expect(screen.queryByRole("button", { name: /Start training/ })).not.toBeInTheDocument();
  });

  it("feeds the selected rows straight in, with no /api/vocab/words round trip", async () => {
    const user = userEvent.setup();
    render(<Harness />);

    await screen.findByText("学习");
    await user.click(screen.getByRole("checkbox", { name: /Select all/i }));
    await user.click(screen.getByRole("button", { name: /Start training/ }));

    await waitFor(() => expect(runValue()).toBe("vocab-trainer"));
    expect(mockResolve).not.toHaveBeenCalled();
    // The trainer started: its quit button is part of the running shell.
    expect(await screen.findByRole("button", { name: "Quit Session" })).toBeInTheDocument();
  });

  it("does nothing when no word is selected", async () => {
    const user = userEvent.setup();
    render(<Harness />);

    await screen.findByText("学习");
    const start = screen.getByRole("button", { name: /Start training/ });
    expect(start).toBeDisabled();
    await user.click(start);

    expect(runValue()).toBe("none");
  });
});

describe("ReviewTab — ending a run", () => {
  it("falls back to the list when a reload arrives with ?run= but no selection", async () => {
    render(<Harness initialRun="vocab-trainer" />);

    await waitFor(() => expect(runValue()).toBe("none"));
    expect(await screen.findByText("学习")).toBeInTheDocument();
  });

  it("returns to the list when the trainer exits", async () => {
    const user = userEvent.setup();
    render(<Harness />);

    await screen.findByText("学习");
    await user.click(screen.getByRole("checkbox", { name: /Select all/i }));
    await user.click(screen.getByRole("button", { name: /Start training/ }));
    await waitFor(() => expect(runValue()).toBe("vocab-trainer"));

    // Quit -> confirm, which is the trainer's goHome and therefore our onExit.
    await user.click(screen.getByRole("button", { name: "Quit Session" }));
    await user.click(screen.getByRole("button", { name: "Yes, Quit" }));

    await waitFor(() => expect(runValue()).toBe("none"));
    expect(push).not.toHaveBeenCalled();
    expect(await screen.findByRole("button", { name: /Start training/ })).toBeInTheDocument();
  });
});

describe("ReviewTab — the standalone route is unchanged", () => {
  it("still stashes the selection and navigates when no onStart is given", async () => {
    const user = userEvent.setup();
    const { VocabReviewPage } = await import("@/components/page/learner/vocab-review/VocabReviewPage");
    render(
      <I18nProvider>
        <VocabReviewPage />
      </I18nProvider>
    );

    await screen.findByText("学习");
    await user.click(screen.getByRole("checkbox", { name: /Select all/i }));
    await user.click(screen.getByRole("button", { name: /Start training/ }));

    expect(JSON.parse(sessionStorage.getItem("selectedVocabTrainerWords")!)).toEqual(["学习", "你好"]);
    expect(push).toHaveBeenCalledWith("/learner/vocab-training-batch");
  });
});
