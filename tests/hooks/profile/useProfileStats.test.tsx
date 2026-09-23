// tests/hooks/profile/useProfileStats.test.tsx
// The Learning Statistics reads after they moved off the dashboard
// (docs/plans/dashboard-tabs.md Phase 5). The behaviour that has to survive the
// move is the legacy page's soft-fail: a statistics widget that can't load
// renders empty, it never takes the page down with it.

import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import {
  getGlobalStats,
  getLearnedWordsLast3Days,
  getTimeLearnedLast3Days,
} from "@/lib/api/learner/dashboard";
import { useProfileStats } from "@/hooks/profile/useProfileStats";
import type { GlobalStats } from "@/lib/types/dashboard";

let auth: { user: { id: number } | null; loading: boolean } = { user: { id: 1 }, loading: false };
vi.mock("@/components/auth/AuthProvider", () => ({ useAuth: () => auth }));
vi.mock("@/lib/api/learner/dashboard", () => ({
  getGlobalStats: vi.fn(),
  getLearnedWordsLast3Days: vi.fn(),
  getTimeLearnedLast3Days: vi.fn(),
  // useCurrentLesson's one read, so the last test can mount it.
  getDashboardCurrentLesson: vi.fn(() => Promise.resolve({ has_recent: false })),
}));

const mockStats = vi.mocked(getGlobalStats);
const mockWords = vi.mocked(getLearnedWordsLast3Days);
const mockTime = vi.mocked(getTimeLearnedLast3Days);

const STATS = {
  total_time_ms: 1000,
  total_time_label: "16m",
  total_words: 253,
  buckets: {},
} as unknown as GlobalStats;

beforeEach(() => {
  vi.clearAllMocks();
  auth = { user: { id: 1 }, loading: false };
  mockStats.mockResolvedValue(STATS);
  mockWords.mockResolvedValue([{ date: "2026-09-18", count: 3 }]);
  mockTime.mockResolvedValue([{ date: "2026-09-18", minutes: 12, ms: 720000 }]);
});

describe("useProfileStats", () => {
  it("loads the headline figures and both charts", async () => {
    const { result } = renderHook(() => useProfileStats());

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.stats).toEqual(STATS);
    expect(result.current.wordsDays).toHaveLength(1);
    expect(result.current.timeDays).toHaveLength(1);
  });

  it("stops loading and fetches nothing when signed out", async () => {
    auth = { user: null, loading: false };
    const { result } = renderHook(() => useProfileStats());

    expect(result.current.loading).toBe(false);
    expect(mockStats).not.toHaveBeenCalled();
  });

  it("reports loading while auth is still resolving", () => {
    auth = { user: null, loading: true };
    const { result } = renderHook(() => useProfileStats());

    expect(result.current.loading).toBe(true);
    expect(mockStats).not.toHaveBeenCalled();
  });

  it("soft-fails the headline figures without blocking the charts", async () => {
    mockStats.mockRejectedValue(new Error("boom"));
    const { result } = renderHook(() => useProfileStats());

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.stats).toBeNull();
    expect(result.current.timeDays).toHaveLength(1);
  });

  it("falls back to an empty series per chart", async () => {
    mockWords.mockRejectedValue(new Error("boom"));
    mockTime.mockRejectedValue(new Error("boom"));
    const { result } = renderHook(() => useProfileStats());

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.wordsDays).toEqual([]);
    expect(result.current.timeDays).toEqual([]);
    // The headline figures still arrived — the failures are independent.
    expect(result.current.stats).toEqual(STATS);
  });
});

describe("the current-lesson hook no longer carries the statistics reads", () => {
  it("does not call any of them", async () => {
    const { useCurrentLesson } = await import("@/hooks/lesson/useCurrentLesson");
    renderHook(() => useCurrentLesson());

    expect(mockStats).not.toHaveBeenCalled();
    expect(mockWords).not.toHaveBeenCalled();
    expect(mockTime).not.toHaveBeenCalled();
  });
});
