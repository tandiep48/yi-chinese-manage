import { describe, it, expect } from "vitest";
import { canAccessManage, hasPermission } from "@/lib/auth/permissions";
import type { AuthUser } from "@/lib/types/user";

const user = (permissions: string[]) => ({ permissions }) as unknown as AuthUser;

describe("permissions", () => {
  it("grants manage access only with manage:access", () => {
    expect(canAccessManage(user(["manage:access", "user:read"]))).toBe(true);
    expect(canAccessManage(user(["user:read"]))).toBe(false);
    expect(canAccessManage(user([]))).toBe(false);
  });

  it("treats a missing user or missing permission list as no access", () => {
    expect(canAccessManage(null)).toBe(false);
    expect(canAccessManage(undefined)).toBe(false);
    expect(hasPermission({} as AuthUser, "user:read")).toBe(false);
  });
});
