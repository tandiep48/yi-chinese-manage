// tests/hooks/lesson/useLessonTrainer.test.tsx
// The embedding seam added for the tabbed learner home (docs/plans/dashboard-tabs.md
// Phase 0): passage ids supplied as props bypass entry resolution, onExit replaces the
// goHome navigation, and every escape that used to router.replace away — the pinyin
// placeholders, the Numbers pseudo-part, an empty task list, a failed load — surfaces
// as blockedKey instead, because a panel has nowhere to navigate to.

import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import { I18nProvider } from "@/components/i18n/I18nProvider";
import { startLessonSession } from "@/lib/api/learner/lessons";
import { useLessonTrainer } from "@/hooks/lesson/useLessonTrainer";
import type { LessonTask } from "@/lib/types/lesson";

const push = vi.fn();
const replace = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ push, replace }) }));
vi.mock("@/lib/api/learner/lessons", () => ({
  startLessonSession: vi.fn(),
  submitLessonAnswer: vi.fn(),
  completeLessonPart: vi.fn(),
}));

const mockStart = vi.mocked(startLessonSession);

const TASK: LessonTask = {
  passage_id: "H1_2_1",
  line_id: 1,
  type: "meaning",
  content: "学习",
  correct_answer: "to study",
  options: ["to study", "hello"],
  hsk_level: "HSK1",
};

function renderTrainer(opts: Parameters<typeof useLessonTrainer>[0] = {}) {
  return renderHook(() => useLessonTrainer(opts), { wrapper: I18nProvider });
}

beforeEach(() => {
  vi.clearAllMocks();
  sessionStorage.clear();
  window.history.replaceState({}, "", "/learner/lesson-training?passage_id=H9_9_9");
  mockStart.mockResolvedValue({ session_id: 42, tasks: [TASK] });
});

describe("useLessonTrainer — passage ids as props", () => {
  it("starts from the given ids without touching sessionStorage or the URL", async () => {
    const getItem = vi.spyOn(Storage.prototype, "getItem");
    sessionStorage.setItem("lessonWideLessonTrainer", JSON.stringify({ passage_ids: ["H5_5_5"] }));

    const { result } = renderTrainer({ passageIds: ["H1_2_1"] });

    await waitFor(() => expect(result.current.screen).toBe("training"));
    // Not H9_9_9 from the URL, and not H5_5_5 from the stashed wide run.
    expect(mockStart).toHaveBeenCalledWith(["H1_2_1"], "part");
    expect(replace).not.toHaveBeenCalled();
    const keys = getItem.mock.calls.map(([k]) => k);
    expect(keys).not.toContain("lessonWideLessonTrainer");
    expect(keys).not.toContain("lessonTrainerActivityTypes");
    // Entry keys are left for whoever owns them.
    expect(sessionStorage.getItem("lessonWideLessonTrainer")).not.toBeNull();
  });

  it("infers master mode from more than one id, and honours an explicit mode", async () => {
    const { result } = renderTrainer({ passageIds: ["H1_2_1", "H1_2_2"] });
    await waitFor(() => expect(result.current.screen).toBe("training"));
    expect(mockStart).toHaveBeenCalledWith(["H1_2_1", "H1_2_2"], "master");

    mockStart.mockClear();
    renderTrainer({ passageIds: ["H1_2_1"], mode: "master" });
    await waitFor(() => expect(mockStart).toHaveBeenCalledWith(["H1_2_1"], "master"));
  });

  it("applies the task-type filter passed as props", async () => {
    mockStart.mockResolvedValue({
      session_id: 1,
      tasks: [TASK, { ...TASK, type: "typing" }],
    });

    const { result } = renderTrainer({ passageIds: ["H1_2_1"], types: ["typing"] });

    await waitFor(() => expect(result.current.screen).toBe("training"));
    expect(result.current.task?.type).toBe("typing");
  });

  it("still resolves from the URL when no ids are passed", async () => {
    window.history.replaceState({}, "", "/learner/lesson-training?passage_id=H1_2_1");
    const { result } = renderTrainer();
    await waitFor(() => expect(result.current.screen).toBe("training"));
    expect(mockStart).toHaveBeenCalledWith(["H1_2_1"], "part");
  });
});

describe("useLessonTrainer — embedded blocked states", () => {
  it.each([
    ["H1_1_1", "trainer.not_a_graded_part"],
    ["H1_1_2", "trainer.not_a_graded_part"],
    ["H1_5_99", "trainer.not_a_graded_part"],
  ])("renders a message for %s instead of navigating", async (id, key) => {
    const { result } = renderTrainer({ passageIds: [id] });

    await waitFor(() => expect(result.current.blockedKey).toBe(key));
    expect(replace).not.toHaveBeenCalled();
    expect(mockStart).not.toHaveBeenCalled();
    expect(result.current.screen).toBe("loading");
  });

  it("reports an empty id list", async () => {
    const { result } = renderTrainer({ passageIds: [] });
    await waitFor(() => expect(result.current.blockedKey).toBe("trainer.no_part_selected"));
    expect(replace).not.toHaveBeenCalled();
  });

  it("reports a part with no tasks", async () => {
    mockStart.mockResolvedValue({ session_id: 1, tasks: [] });
    const { result } = renderTrainer({ passageIds: ["H1_2_1"] });
    await waitFor(() => expect(result.current.blockedKey).toBe("trainer.no_tasks"));
    expect(replace).not.toHaveBeenCalled();
  });

  it("reports a failed session start", async () => {
    mockStart.mockRejectedValue(new Error("boom"));
    const { result } = renderTrainer({ passageIds: ["H1_2_1"] });
    await waitFor(() => expect(result.current.blockedKey).toBe("trainer.load_failed"));
    expect(replace).not.toHaveBeenCalled();
  });
});

describe("useLessonTrainer — standalone still redirects", () => {
  it("sends the pinyin placeholder to its guide page", async () => {
    window.history.replaceState({}, "", "/learner/lesson-training?passage_id=H1_1_1");
    const { result } = renderTrainer();
    await waitFor(() => expect(replace).toHaveBeenCalledWith("/learner/lesson/basic-pinyin"));
    expect(result.current.blockedKey).toBeNull();
  });

  it("sends an empty entry to the HSK picker", async () => {
    window.history.replaceState({}, "", "/learner/lesson-training");
    renderTrainer();
    await waitFor(() => expect(replace).toHaveBeenCalledWith("/learner/hsk"));
  });
});

describe("useLessonTrainer — exit", () => {
  it("calls onExit instead of navigating", async () => {
    const onExit = vi.fn();
    const { result } = renderTrainer({ passageIds: ["H1_2_1"], onExit });
    await waitFor(() => expect(result.current.screen).toBe("training"));

    act(() => result.current.goHome());

    expect(onExit).toHaveBeenCalledTimes(1);
    expect(push).not.toHaveBeenCalled();
  });

  it("falls back to router.push when no onExit is given", async () => {
    window.history.replaceState({}, "", "/learner/lesson-training?passage_id=H1_2_1");
    const { result } = renderTrainer();
    await waitFor(() => expect(result.current.screen).toBe("training"));

    act(() => result.current.goHome());

    expect(push).toHaveBeenCalledWith("/learner/lesson?passage_id=H1_2_1");
  });
});
