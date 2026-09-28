// tests/components/home/RecommendTab.test.tsx
// The Recommend panel's in-place run (docs/plans/dashboard-tabs.md Phase 3):
// starting the selected queue flips ?run= and feeds PracticeRunner the items
// directly, leaving multi_practice_queue / practice_referrer unwritten and the
// page un-navigated; "try again" remounts the runner instead of reloading the
// page; and a reload with ?run= set but no queue falls back to the grid.

import { useState } from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { I18nProvider } from "@/components/i18n/I18nProvider";
import { getRecommendations } from "@/lib/api/learner/practice";
import { RecommendTab } from "@/components/page/learner/home/RecommendTab";
import type { RecommendedPractice } from "@/lib/types/dashboard";
import type { PracticeGroup } from "@/lib/types/practice";

vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn(), replace: vi.fn() }) }));
vi.mock("@/lib/api/learner/practice", () => ({
  getRecommendations: vi.fn(),
  getPracticeLesson: vi.fn(),
  getPracticeProgressGroup: vi.fn(),
  getPracticeMulti: vi.fn(),
  submitPractice: vi.fn(),
}));
vi.mock("@/lib/api/learner/vocab", () => ({ getVocabHasHistory: vi.fn() }));

const { getPracticeMulti } = await import("@/lib/api/learner/practice");
const mockRecs = vi.mocked(getRecommendations);
const mockMulti = vi.mocked(getPracticeMulti);

function rec(over: Partial<RecommendedPractice>): RecommendedPractice {
  return {
    level: 1,
    lesson: 1,
    progress: "1-5",
    skill: "reading",
    type: 1,
    category: "practice",
    unit_ids: [],
    total_words: 10,
    known_words: 5,
    coverage_pct: 50,
    matched_words: [],
    recent_matched_words: [],
    newest_learned_at: null,
    recent_score: 0,
    status: "Not start",
    question_count: 5,
    ...over,
  };
}

const RECS: RecommendedPractice[] = [
  rec({ level: 1, lesson: 1, progress: "1-5" }),
  rec({ level: 2, lesson: 3, progress: "6", skill: "listening", question_count: 3 }),
];

const GROUP = { progress: "1-5", lesson: "1", questions: [] } as unknown as PracticeGroup;

function Harness({ initialRun = null }: { initialRun?: string | null }) {
  const [run, setRun] = useState<string | null>(initialRun);
  return (
    <I18nProvider>
      <div data-testid="run">{run ?? "none"}</div>
      <RecommendTab run={run} setRun={setRun} />
    </I18nProvider>
  );
}

const runValue = () => screen.getByTestId("run").textContent;

beforeEach(() => {
  vi.clearAllMocks();
  sessionStorage.clear();
  mockRecs.mockResolvedValue(RECS);
  mockMulti.mockResolvedValue({ groups: [GROUP] });
});

describe("RecommendTab — starting a run", () => {
  it("runs the queue in the panel, writing neither handoff key", async () => {
    const user = userEvent.setup();
    render(<Harness />);

    await user.click(await screen.findByRole("checkbox", { name: "Select Lesson 1" }));
    await user.click(screen.getByRole("button", { name: "Start Selected" }));

    await waitFor(() => expect(runValue()).toBe("practice-multi"));
    expect(sessionStorage.getItem("multi_practice_queue")).toBeNull();
    expect(sessionStorage.getItem("practice_referrer")).toBeNull();
  });

  it("passes the selected items straight to the runner", async () => {
    const user = userEvent.setup();
    render(<Harness />);

    await user.click(await screen.findByRole("checkbox", { name: "Select Lesson 1" }));
    await user.click(screen.getByRole("checkbox", { name: "Select Lesson 3" }));
    await user.click(screen.getByRole("button", { name: "Start Selected" }));

    await waitFor(() => expect(mockMulti).toHaveBeenCalledTimes(1));
    const queued = mockMulti.mock.calls[0][0];
    expect(queued).toHaveLength(2);
    expect(queued.map((q) => q.level)).toEqual([1, 2]);
  });

  it("does nothing with an empty selection", async () => {
    const user = userEvent.setup();
    render(<Harness />);

    await screen.findByRole("checkbox", { name: "Select Lesson 1" });
    // The bar is always in the DOM (CSS hides it), so the click is real.
    await user.click(screen.getByRole("button", { name: "Start Selected" }));

    expect(runValue()).toBe("none");
    expect(mockMulti).not.toHaveBeenCalled();
  });
});

describe("RecommendTab — ending a run", () => {
  it("falls back to the grid when a reload arrives with ?run= but no queue", async () => {
    render(<Harness initialRun="practice-multi" />);

    await waitFor(() => expect(runValue()).toBe("none"));
    expect(await screen.findByRole("checkbox", { name: "Select Lesson 1" })).toBeInTheDocument();
    expect(mockMulti).not.toHaveBeenCalled();
  });

  it("hands back to the grid when the runner exits", async () => {
    const user = userEvent.setup();
    render(<Harness />);

    await user.click(await screen.findByRole("checkbox", { name: "Select Lesson 1" }));
    await user.click(screen.getByRole("button", { name: "Start Selected" }));
    await waitFor(() => expect(runValue()).toBe("practice-multi"));

    // Embedded, the back control is a <button>, not the <Link> the standalone
    // route renders (Phase 0). Its label is the arrow, so match on the title.
    const back = await screen.findByTitle("Back to Recommendations");
    expect(back.tagName).toBe("BUTTON");
    await user.click(back);

    await waitFor(() => expect(runValue()).toBe("none"));
    expect(await screen.findByRole("checkbox", { name: "Select Lesson 1" })).toBeInTheDocument();
  });
});

describe("RecommendTab — the standalone route is unchanged", () => {
  it("still stashes the queue and navigates when no onStartMulti is given", async () => {
    const user = userEvent.setup();
    const href = vi.fn();
    const original = Object.getOwnPropertyDescriptor(window, "location")!;
    Object.defineProperty(window, "location", {
      configurable: true,
      value: { ...window.location, set href(v: string) { href(v); } },
    });

    const { RecommendPage } = await import("@/components/page/learner/recommend/RecommendPage");
    render(
      <I18nProvider>
        <RecommendPage />
      </I18nProvider>
    );

    await user.click(await screen.findByRole("checkbox", { name: "Select Lesson 1" }));
    await user.click(screen.getByRole("button", { name: "Start Selected" }));

    expect(JSON.parse(sessionStorage.getItem("multi_practice_queue")!)).toHaveLength(1);
    expect(sessionStorage.getItem("practice_referrer")).toBe("recommend");
    expect(href).toHaveBeenCalledWith("/learner/practice/multi");

    Object.defineProperty(window, "location", original);
  });
});
