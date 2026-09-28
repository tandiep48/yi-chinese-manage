// tests/hooks/practice/usePracticeEngine.test.tsx
// The embedding seam added for the tabbed learner home (docs/plans/dashboard-tabs.md
// Phase 0): the multi queue and the back target arrive as props instead of through the
// multi_practice_queue / practice_referrer sessionStorage handoffs, and onExit replaces
// the whole-page navigation an embedded run can't perform.

import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { getPracticeMulti } from "@/lib/api/learner/practice";
import { usePracticeEngine } from "@/hooks/practice/usePracticeEngine";
import type { PracticeGroup, PracticeMultiItem } from "@/lib/types/practice";

vi.mock("@/lib/api/learner/practice", () => ({
  getPracticeLesson: vi.fn(),
  getPracticeProgressGroup: vi.fn(),
  getPracticeMulti: vi.fn(),
  submitPractice: vi.fn(),
}));

const mockMulti = vi.mocked(getPracticeMulti);

const GROUP = { progress: "1", lesson: "L1", questions: [] } as unknown as PracticeGroup;
const ITEMS: PracticeMultiItem[] = [{ level: 1, lesson: "L1", progress: "1" }];

beforeEach(() => {
  vi.clearAllMocks();
  sessionStorage.clear();
  mockMulti.mockResolvedValue({ groups: [GROUP] });
});

describe("usePracticeEngine — embedded overrides", () => {
  it("loads the queue from props and leaves the sessionStorage handoff alone", async () => {
    sessionStorage.setItem("multi_practice_queue", JSON.stringify([{ level: 9, lesson: "L9", progress: "9" }]));

    const { result } = renderHook(() =>
      usePracticeEngine({ category: "practice", multi: true, items: ITEMS, onExit: vi.fn() })
    );

    await waitFor(() => expect(result.current.screen).toBe("practice"));
    expect(mockMulti).toHaveBeenCalledWith(ITEMS);
    expect(sessionStorage.getItem("multi_practice_queue")).not.toBeNull();
  });

  it("uses the referrer from props and leaves practice_referrer unconsumed", async () => {
    sessionStorage.setItem("practice_referrer", "recommend");
    const referrer = { href: "/learner?tab=recommend", title: "recommend" };

    const { result } = renderHook(() =>
      usePracticeEngine({ category: "practice", multi: true, items: ITEMS, referrer })
    );

    await waitFor(() => expect(result.current.screen).toBe("practice"));
    expect(result.current.referrer).toEqual(referrer);
    expect(sessionStorage.getItem("practice_referrer")).toBe("recommend");
  });

  it("exposes onExit so the shell renders a button rather than a link", async () => {
    const onExit = vi.fn();
    const { result } = renderHook(() =>
      usePracticeEngine({ category: "practice", multi: true, items: ITEMS, onExit })
    );

    await waitFor(() => expect(result.current.screen).toBe("practice"));
    expect(result.current.exit).toBe(onExit);
  });

  it("calls onRetry instead of reloading the page", async () => {
    const onRetry = vi.fn();
    const reload = vi.fn();
    const original = Object.getOwnPropertyDescriptor(window, "location")!;
    Object.defineProperty(window, "location", {
      configurable: true,
      value: { ...window.location, reload },
    });

    const { result } = renderHook(() =>
      usePracticeEngine({ category: "practice", multi: true, items: ITEMS, onRetry })
    );
    await waitFor(() => expect(result.current.screen).toBe("practice"));

    result.current.retry();

    expect(onRetry).toHaveBeenCalledTimes(1);
    expect(reload).not.toHaveBeenCalled();
    Object.defineProperty(window, "location", original);
  });

  it("surfaces an error instead of navigating when an embedded queue is empty", async () => {
    const { result } = renderHook(() =>
      usePracticeEngine({ category: "practice", multi: true, items: [], onExit: vi.fn() })
    );

    await waitFor(() => expect(result.current.error).toBe("load_failed"));
    expect(result.current.screen).toBe("loading");
    expect(mockMulti).not.toHaveBeenCalled();
  });
});

describe("usePracticeEngine — standalone is unchanged", () => {
  it("consumes practice_referrer and the stashed queue", async () => {
    sessionStorage.setItem("practice_referrer", "recommend");
    sessionStorage.setItem("multi_practice_queue", JSON.stringify(ITEMS));

    const { result } = renderHook(() => usePracticeEngine({ category: "practice", multi: true }));

    await waitFor(() => expect(result.current.screen).toBe("practice"));
    expect(mockMulti).toHaveBeenCalledWith(ITEMS);
    expect(result.current.referrer).toEqual({ href: "/learner/recommend", title: "recommend" });
    expect(sessionStorage.getItem("practice_referrer")).toBeNull();
    expect(result.current.exit).toBeNull();
  });
});
