// tests/hooks/lesson/useLessonMilestone.test.tsx
// The six-step milestone's client state (docs/plans/dashboard-tabs.md §10):
// resuming at the server's current_step, advancing a passive step through POST,
// and — the rule that keeps the milestone honest — a graded step advancing only
// when the server says it was passed.

import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import { getMilestone, markMilestoneStep } from "@/lib/api/learner/milestone";
import { useLessonMilestone } from "@/hooks/lesson/useLessonMilestone";
import type { Milestone } from "@/lib/api/learner/milestone";

vi.mock("@/lib/api/learner/milestone", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/api/learner/milestone")>()),
  getMilestone: vi.fn(),
  markMilestoneStep: vi.fn(),
}));

const mockGet = vi.mocked(getMilestone);
const mockMark = vi.mocked(markMilestoneStep);

const PASSAGE = "H1_2_1";

function milestone(done: number[]): Milestone {
  const steps = [1, 2, 3, 4, 5, 6].map((step) => ({
    step,
    completed: done.includes(step),
    completed_at: done.includes(step) ? "2026-09-01T12:00:00+00:00" : null,
  }));
  const incomplete = steps.filter((s) => !s.completed).map((s) => s.step);
  return {
    passage_id: PASSAGE,
    total_steps: 6,
    current_step: incomplete.length ? incomplete[0] : 7,
    steps,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  mockGet.mockResolvedValue(milestone([]));
});

describe("useLessonMilestone — loading", () => {
  it("resumes at the server's current_step", async () => {
    mockGet.mockResolvedValue(milestone([1, 2, 3]));
    const { result } = renderHook(() => useLessonMilestone(PASSAGE));

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.step).toBe(4);
  });

  it("clamps a finished part to the last step rather than step 7", async () => {
    mockGet.mockResolvedValue(milestone([1, 2, 3, 4, 5, 6]));
    const { result } = renderHook(() => useLessonMilestone(PASSAGE));

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.milestone?.current_step).toBe(7);
    expect(result.current.step).toBe(6);
  });

  it("honours an initial step from the URL over resume", async () => {
    mockGet.mockResolvedValue(milestone([1, 2, 3]));
    const { result } = renderHook(() => useLessonMilestone(PASSAGE, 2));

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.step).toBe(2);
  });

  it("does not fetch or report loading without a passage", async () => {
    const { result } = renderHook(() => useLessonMilestone(""));
    expect(result.current.loading).toBe(false);
    expect(mockGet).not.toHaveBeenCalled();
  });

  it("surfaces a failed load", async () => {
    mockGet.mockRejectedValue(new Error("boom"));
    const { result } = renderHook(() => useLessonMilestone(PASSAGE));
    await waitFor(() => expect(result.current.error).toBe("boom"));
  });
});

describe("useLessonMilestone — passive steps", () => {
  it("records the step and advances", async () => {
    const { result } = renderHook(() => useLessonMilestone(PASSAGE));
    await waitFor(() => expect(result.current.loading).toBe(false));
    mockMark.mockResolvedValue(milestone([1]));

    await act(() => result.current.completeAndAdvance());

    expect(mockMark).toHaveBeenCalledWith(PASSAGE, 1);
    expect(result.current.step).toBe(2);
    expect(result.current.isCompleted(1)).toBe(true);
  });

  it("still advances when the write fails", async () => {
    const { result } = renderHook(() => useLessonMilestone(PASSAGE));
    await waitFor(() => expect(result.current.loading).toBe(false));
    mockMark.mockRejectedValue(new Error("offline"));

    await act(() => result.current.completeAndAdvance());

    // Soft-fail: a lost row is re-derived or re-posted, and blocking the learner
    // on it would be worse than a missing timestamp.
    expect(result.current.step).toBe(2);
  });

  it("does not advance past the last step", async () => {
    mockGet.mockResolvedValue(milestone([1, 2, 3, 4, 5]));
    mockMark.mockResolvedValue(milestone([1, 2, 3, 4, 5]));
    const { result } = renderHook(() => useLessonMilestone(PASSAGE, 6));
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(() => result.current.completeAndAdvance());

    expect(result.current.step).toBe(6);
  });
});

describe("useLessonMilestone — graded steps", () => {
  it("advances after a run the server counted", async () => {
    mockGet.mockResolvedValue(milestone([1, 2]));
    const { result } = renderHook(() => useLessonMilestone(PASSAGE, 3));
    await waitFor(() => expect(result.current.loading).toBe(false));

    mockGet.mockResolvedValue(milestone([1, 2, 3]));
    await act(() => result.current.refreshAfterRun());

    expect(result.current.step).toBe(4);
    // Never posted — the vocab trainer's batch submit records step 3.
    expect(mockMark).not.toHaveBeenCalled();
  });

  it("stays put when the run did not reach the pass threshold", async () => {
    mockGet.mockResolvedValue(milestone([1, 2]));
    const { result } = renderHook(() => useLessonMilestone(PASSAGE, 3));
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(() => result.current.refreshAfterRun());

    expect(result.current.step).toBe(3);
    expect(result.current.isCompleted(3)).toBe(false);
  });

  it("leaves the step alone when the refresh itself fails", async () => {
    const { result } = renderHook(() => useLessonMilestone(PASSAGE, 6));
    await waitFor(() => expect(result.current.loading).toBe(false));

    mockGet.mockRejectedValue(new Error("offline"));
    await act(() => result.current.refreshAfterRun());

    expect(result.current.step).toBe(6);
  });
});

describe("useLessonMilestone — soft gating", () => {
  it("replays a completed step without rewinding progress", async () => {
    mockGet.mockResolvedValue(milestone([1, 2, 3, 4]));
    const { result } = renderHook(() => useLessonMilestone(PASSAGE));
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.step).toBe(5);

    act(() => result.current.goToStep(2));

    expect(result.current.step).toBe(2);
    expect(result.current.isCompleted(4)).toBe(true);
  });

  it("ignores a step outside the range", async () => {
    const { result } = renderHook(() => useLessonMilestone(PASSAGE));
    await waitFor(() => expect(result.current.loading).toBe(false));

    act(() => result.current.goToStep(0));
    act(() => result.current.goToStep(7));

    expect(result.current.step).toBe(1);
  });
});
