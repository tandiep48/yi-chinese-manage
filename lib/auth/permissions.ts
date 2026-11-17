// lib/auth/permissions.ts
// Permission names mirror the `permissions` table in Learning/schema_sql_file/schema.sql.

import type { AuthUser } from "@/lib/types/user";

export const MANAGE_ACCESS = "manage:access";

export function hasPermission(
  user: Pick<AuthUser, "permissions"> | null | undefined,
  permission: string
): boolean {
  return !!user?.permissions?.includes(permission);
}

export function canAccessManage(user: AuthUser | null | undefined): boolean {
  return hasPermission(user, MANAGE_ACCESS);
}
