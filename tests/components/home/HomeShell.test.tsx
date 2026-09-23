// tests/components/home/HomeShell.test.tsx
// The container from docs/plans/dashboard-tabs.md Phase 1: an ARIA tablist with
// roving focus, only the active panel mounted, the words-due badge fetched up
// front, and the mid-session guard that intercepts a tab switch made while a run
// is in flight (confirm flushes and switches; cancel stays).
//
// The three panels are next/dynamic chunks, so they are mocked here — this file is
// about the shell, not about what the tabs contain.

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { I18nProvider } from "@/components/i18n/I18nProvider";
import { getVocabReviewCount } from "@/lib/api/learner/vocab";
import { HomeShell } from "@/components/page/learner/home/HomeShell";

const replace = vi.fn();
let search = "";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace, push: vi.fn() }),
  usePathname: () => "/learner",
  useSearchParams: () => new URLSearchParams(search),
}));
// One stable user object — the real provider holds it in state, and a fresh
// object each render would re-fire the shell's count effect.
const AUTH = { user: { id: 1 }, loading: false };
vi.mock("@/components/auth/AuthProvider", () => ({ useAuth: () => AUTH }));
vi.mock("@/lib/api/learner/vocab", () => ({ getVocabReviewCount: vi.fn() }));
vi.mock("@/components/page/learner/home/ReviewTab", () => ({
  ReviewTab: () => <div data-testid="panel">review panel</div>,
}));
vi.mock("@/components/page/learner/home/LessonTab", () => ({
  LessonTab: () => <div data-testid="panel">lesson panel</div>,
}));
vi.mock("@/components/page/learner/home/RecommendTab", () => ({
  RecommendTab: () => <div data-testid="panel">recommend panel</div>,
}));

const mockCount = vi.mocked(getVocabReviewCount);

function renderShell() {
  return render(
    <I18nProvider>
      <HomeShell />
    </I18nProvider>
  );
}

const tab = (name: RegExp) => screen.getByRole("tab", { name });

beforeEach(() => {
  vi.clearAllMocks();
  search = "";
  mockCount.mockResolvedValue(0);
});

describe("HomeShell — tabs", () => {
  it("exposes a tablist with the three tabs, Word Review selected by default", async () => {
    renderShell();
    expect(screen.getByRole("tablist")).toBeInTheDocument();
    expect(tab(/Word Review/)).toHaveAttribute("aria-selected", "true");
    expect(tab(/Lesson/)).toHaveAttribute("aria-selected", "false");
    expect(tab(/Recommend/)).toHaveAttribute("aria-selected", "false");
    expect(await screen.findByText("review panel")).toBeInTheDocument();
  });

  it("mounts only the tab named by ?tab=", async () => {
    search = "tab=recommend";
    renderShell();
    expect(await screen.findByText("recommend panel")).toBeInTheDocument();
    expect(screen.getAllByTestId("panel")).toHaveLength(1);
    expect(screen.queryByText("review panel")).not.toBeInTheDocument();
  });

  it("keeps only the selected tab in the page tab order (roving tabindex)", () => {
    search = "tab=lesson";
    renderShell();
    expect(tab(/Lesson/)).toHaveAttribute("tabindex", "0");
    expect(tab(/Word Review/)).toHaveAttribute("tabindex", "-1");
    expect(tab(/Recommend/)).toHaveAttribute("tabindex", "-1");
  });

  it("wires the panel to its tab with aria-controls / aria-labelledby", () => {
    renderShell();
    expect(tab(/Word Review/)).toHaveAttribute("aria-controls", "learner-home-panel-review");
    expect(screen.getByRole("tabpanel")).toHaveAttribute("aria-labelledby", "learner-home-tab-review");
  });

  it("selects the next tab on ArrowRight", async () => {
    const user = userEvent.setup();
    search = "tab=review";
    renderShell();

    tab(/Word Review/).focus();
    await user.keyboard("{ArrowRight}");

    expect(replace).toHaveBeenLastCalledWith("/learner?tab=lesson", { scroll: false });
  });

  it("wraps from the last tab back to the first", async () => {
    const user = userEvent.setup();
    search = "tab=recommend";
    renderShell();

    tab(/Recommend/).focus();
    await user.keyboard("{ArrowRight}");

    expect(replace).toHaveBeenLastCalledWith("/learner?tab=review", { scroll: false });
  });

  it("wraps from the first tab back to the last on ArrowLeft", async () => {
    const user = userEvent.setup();
    search = "tab=review";
    renderShell();

    tab(/Word Review/).focus();
    await user.keyboard("{ArrowLeft}");

    expect(replace).toHaveBeenLastCalledWith("/learner?tab=recommend", { scroll: false });
  });

  it("jumps to the ends with Home and End", async () => {
    const user = userEvent.setup();
    search = "tab=lesson";
    renderShell();

    tab(/Lesson/).focus();
    await user.keyboard("{End}");
    expect(replace).toHaveBeenLastCalledWith("/learner?tab=recommend", { scroll: false });

    await user.keyboard("{Home}");
    expect(replace).toHaveBeenLastCalledWith("/learner?tab=review", { scroll: false });
  });
});

describe("HomeShell — words-due badge", () => {
  it("fetches the count up front, not the review list", async () => {
    mockCount.mockResolvedValue(253);
    renderShell();
    expect(await screen.findByText("253")).toBeInTheDocument();
    expect(mockCount).toHaveBeenCalledTimes(1);
  });

  it("shows no badge at zero", async () => {
    mockCount.mockResolvedValue(0);
    renderShell();
    await waitFor(() => expect(mockCount).toHaveBeenCalled());
    expect(screen.queryByText("0")).not.toBeInTheDocument();
  });

  it("does not count while a run is in flight", async () => {
    search = "tab=review&run=vocab-trainer";
    renderShell();
    await waitFor(() => expect(screen.getByRole("tablist")).toBeInTheDocument());
    expect(mockCount).not.toHaveBeenCalled();
  });

  it("re-counts once the run ends, since training is what changes the number", async () => {
    mockCount.mockResolvedValue(253);
    search = "tab=review&run=vocab-trainer";
    const { rerender } = renderShell();
    expect(mockCount).not.toHaveBeenCalled();

    search = "tab=review";
    rerender(
      <I18nProvider>
        <HomeShell />
      </I18nProvider>
    );

    expect(await screen.findByText("253")).toBeInTheDocument();
    expect(mockCount).toHaveBeenCalledTimes(1);
  });

  it("renders without a badge when the count fails", async () => {
    mockCount.mockRejectedValue(new Error("boom"));
    renderShell();
    await waitFor(() => expect(mockCount).toHaveBeenCalled());
    expect(tab(/Word Review/)).toBeInTheDocument();
  });
});

describe("HomeShell — mid-session guard", () => {
  it("switches straight away when no run is in flight", async () => {
    const user = userEvent.setup();
    search = "tab=review";
    renderShell();

    await user.click(tab(/Recommend/));

    expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument();
    expect(replace).toHaveBeenCalledWith("/learner?tab=recommend", { scroll: false });
  });

  it("opens the guard instead of switching while a run is in flight", async () => {
    const user = userEvent.setup();
    search = "tab=review&run=vocab-trainer";
    renderShell();

    await user.click(tab(/Recommend/));

    expect(screen.getByRole("alertdialog")).toBeInTheDocument();
    expect(replace).not.toHaveBeenCalled();
    expect(tab(/Word Review/)).toHaveAttribute("aria-selected", "true");
  });

  it("confirm ends the run and switches", async () => {
    const user = userEvent.setup();
    search = "tab=review&run=vocab-trainer";
    renderShell();

    await user.click(tab(/Recommend/));
    await user.click(screen.getByRole("button", { name: /End and switch/ }));

    // ?run= is dropped with the tab change — that is what ends the session.
    expect(replace).toHaveBeenCalledWith("/learner?tab=recommend", { scroll: false });
    expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument();
  });

  it("cancel stays on the tab and keeps the run", async () => {
    const user = userEvent.setup();
    search = "tab=review&run=vocab-trainer";
    renderShell();

    await user.click(tab(/Recommend/));
    await user.click(screen.getByRole("button", { name: /Stay here/ }));

    expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument();
    expect(replace).not.toHaveBeenCalled();
    expect(await screen.findByText("review panel")).toBeInTheDocument();
  });
});
