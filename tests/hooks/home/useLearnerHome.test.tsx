// tests/hooks/home/useLearnerHome.test.tsx
// URL state for the tabbed learner home (docs/plans/dashboard-tabs.md Phase 1):
// which tab `?tab=` selects, what an unknown value falls back to, the `?run=`
// round trip, and the guard that intercepts a tab switch made mid-run.

import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useLearnerHome } from "@/hooks/home/useLearnerHome";

const replace = vi.fn<(url: string, opts?: { scroll?: boolean }) => void>((url) => {
  // The real router updates window.location synchronously; the hook now reads the
  // live query string when writing, so the mock has to behave the same way or the
  // race this file guards against cannot be reproduced.
  window.history.replaceState({}, "", url);
});
let search = "";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace, push: vi.fn() }),
  usePathname: () => "/learner",
  useSearchParams: () => new URLSearchParams(search),
}));

function lastUrl(): string {
  return replace.mock.calls.at(-1)?.[0] ?? "";
}

// Keep the fake useSearchParams and the real window.location in step.
function setSearch(next: string) {
  search = next;
  window.history.replaceState({}, "", `/learner${next ? `?${next}` : ""}`);
}

beforeEach(() => {
  vi.clearAllMocks();
  setSearch("");
});

describe("useLearnerHome — tab from the URL", () => {
  it.each([
    ["tab=review", "review"],
    ["tab=lesson", "lesson"],
    ["tab=recommend", "recommend"],
  ])("reads %s", (query, expected) => {
    setSearch(query);
    const { result } = renderHook(() => useLearnerHome());
    expect(result.current.tab).toBe(expected);
  });

  it.each([["", "absent"], ["tab=", "empty"], ["tab=statistics", "unknown"], ["tab=REVIEW", "wrong case"]])(
    "falls back to review when the value is %s (%s)",
    (query) => {
      setSearch(query);
      const { result } = renderHook(() => useLearnerHome());
      expect(result.current.tab).toBe("review");
    }
  );
});

describe("useLearnerHome — writing the URL", () => {
  it("replaces rather than pushes, so Back leaves the dashboard", () => {
    const { result } = renderHook(() => useLearnerHome());
    act(() => result.current.requestTab("recommend"));
    expect(replace).toHaveBeenCalledTimes(1);
    expect(lastUrl()).toBe("/learner?tab=recommend");
    expect(replace.mock.calls[0][1]).toEqual({ scroll: false });
  });

  it("ignores a switch to the tab already showing", () => {
    setSearch("tab=lesson");
    const { result } = renderHook(() => useLearnerHome());
    act(() => result.current.requestTab("lesson"));
    expect(replace).not.toHaveBeenCalled();
  });

  it("keeps unrelated query params", () => {
    setSearch("tab=review&passage_id=H1_2_1");
    const { result } = renderHook(() => useLearnerHome());
    act(() => result.current.requestTab("lesson"));
    expect(lastUrl()).toContain("passage_id=H1_2_1");
    expect(lastUrl()).toContain("tab=lesson");
  });
});

describe("useLearnerHome — the run param", () => {
  it("round-trips ?run= and reports an active session", () => {
    setSearch("tab=review");
    const { result, rerender } = renderHook(() => useLearnerHome());
    expect(result.current.run).toBeNull();
    expect(result.current.sessionActive).toBe(false);

    act(() => result.current.setRun("vocab-trainer"));
    expect(lastUrl()).toBe("/learner?tab=review&run=vocab-trainer");

    setSearch("tab=review&run=vocab-trainer");
    rerender();
    expect(result.current.run).toBe("vocab-trainer");
    expect(result.current.sessionActive).toBe(true);
  });

  it("drops ?run= when the run ends", () => {
    setSearch("tab=review&run=vocab-trainer");
    const { result } = renderHook(() => useLearnerHome());
    act(() => result.current.setRun(null));
    expect(lastUrl()).toBe("/learner?tab=review");
  });
});

describe("useLearnerHome — mid-session guard", () => {
  it("switches straight away when nothing is running", () => {
    setSearch("tab=review");
    const { result } = renderHook(() => useLearnerHome());
    act(() => result.current.requestTab("recommend"));
    expect(result.current.pendingTab).toBeNull();
    expect(lastUrl()).toBe("/learner?tab=recommend");
  });

  it("holds the switch and writes nothing while a run is in flight", () => {
    setSearch("tab=review&run=vocab-trainer");
    const { result } = renderHook(() => useLearnerHome());

    act(() => result.current.requestTab("recommend"));

    expect(result.current.pendingTab).toBe("recommend");
    expect(result.current.tab).toBe("review");
    expect(replace).not.toHaveBeenCalled();
  });

  it("confirm switches the tab and ends the run", () => {
    setSearch("tab=review&run=vocab-trainer");
    const { result } = renderHook(() => useLearnerHome());

    act(() => result.current.requestTab("recommend"));
    act(() => result.current.confirmSwitch());

    expect(result.current.pendingTab).toBeNull();
    expect(lastUrl()).toBe("/learner?tab=recommend");
  });

  it("cancel stays put and leaves the run alone", () => {
    setSearch("tab=review&run=vocab-trainer");
    const { result } = renderHook(() => useLearnerHome());

    act(() => result.current.requestTab("recommend"));
    act(() => result.current.cancelSwitch());

    expect(result.current.pendingTab).toBeNull();
    expect(result.current.tab).toBe("review");
    expect(result.current.run).toBe("vocab-trainer");
    expect(replace).not.toHaveBeenCalled();
  });

  it("confirm is a no-op when nothing is pending", () => {
    setSearch("tab=review&run=vocab-trainer");
    const { result } = renderHook(() => useLearnerHome());
    act(() => result.current.confirmSwitch());
    expect(replace).not.toHaveBeenCalled();
  });
});

describe("useLearnerHome — a panel's cleanup must not undo a tab switch", () => {
  // Reported from use: Word Review -> Lesson -> Word Review did nothing. The
  // outgoing panel's unmount cleanup calls setRun(null), which used to rewrite
  // `tab` too — from the searchParams captured on its last render, i.e. the tab
  // the learner had just left. It put `?tab=lesson` straight back.
  it("setRun after a tab switch keeps the new tab", () => {
    // No run in flight — the Lesson tab is just showing a step, so the switch is
    // unguarded and goes straight through.
    setSearch("tab=lesson");
    const { result } = renderHook(() => useLearnerHome());

    // The learner clicks Word Review...
    act(() => result.current.requestTab("review"));
    expect(lastUrl()).toBe("/learner?tab=review");

    // ...and MilestoneRunner's unmount cleanup then reports "no run in flight",
    // through the callback it closed over while `tab` was still "lesson".
    act(() => result.current.setRun(null));

    expect(lastUrl()).toBe("/learner?tab=review");
    expect(new URLSearchParams(lastUrl().split("?")[1]).get("tab")).toBe("review");
  });

  it("setRun never writes the tab at all", () => {
    setSearch("tab=recommend");
    const { result } = renderHook(() => useLearnerHome());

    act(() => result.current.setRun("practice-multi"));

    expect(lastUrl()).toBe("/learner?tab=recommend&run=practice-multi");
  });

  it("switching tabs drops a run left behind by the outgoing panel", () => {
    setSearch("tab=review&run=vocab-trainer");
    const { result } = renderHook(() => useLearnerHome());

    act(() => result.current.requestTab("recommend"));
    act(() => result.current.confirmSwitch());

    expect(lastUrl()).toBe("/learner?tab=recommend");
  });
});
