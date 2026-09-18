import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { useRecentLearning } from "@/hooks/useRecentLearning";
import * as recentApi from "@/lib/api/learner/recent";
import { useAuth } from "@/components/auth/AuthProvider";
import type { AuthUser } from "@/lib/types/user";

vi.mock("@/lib/api/learner/recent");
vi.mock("@/components/auth/AuthProvider", () => ({ useAuth: vi.fn() }));

const authValue = (user: AuthUser | null, loading = false) =>
  ({ user, loading, login: vi.fn(), register: vi.fn(), logout: vi.fn() }) as unknown as ReturnType<typeof useAuth>;

const USER = { id: 1, username: "lin" } as unknown as AuthUser;

describe("useRecentLearning", () => {
  beforeEach(() => vi.resetAllMocks());

  it("returns no recent lesson (and skips the API) when signed out", async () => {
    vi.mocked(useAuth).mockReturnValue(authValue(null));

    const { result } = renderHook(() => useRecentLearning());
    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.passageId).toBeNull();
    expect(recentApi.getRecentLearning).not.toHaveBeenCalled();
  });

  it("loads the recent passage id for a signed-in user", async () => {
    vi.mocked(useAuth).mockReturnValue(authValue(USER));
    vi.mocked(recentApi.getRecentLearning).mockResolvedValue({ passage_id: "H2_3_1" });

    const { result } = renderHook(() => useRecentLearning());
    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.passageId).toBe("H2_3_1");
  });
});
