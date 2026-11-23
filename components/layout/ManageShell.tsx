"use client";

// components/layout/ManageShell.tsx
// Auth gate for /manage: signed-out users and accounts whose role lacks
// "manage:access" are sent to /manage/login. The login page itself renders bare.
// This is UX only — the /api/admin routes enforce the same permissions server-side.

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/components/auth/AuthProvider";
import { Sidebar } from "@/components/layout/Sidebar";
import { canAccessManage } from "@/lib/auth/permissions";

export const MANAGE_LOGIN_PATH = "/manage/login";

export function ManageShell({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  const isLoginPage = pathname === MANAGE_LOGIN_PATH;
  const allowed = canAccessManage(user);

  useEffect(() => {
    if (!loading && !isLoginPage && !allowed) router.replace(MANAGE_LOGIN_PATH);
  }, [loading, isLoginPage, allowed, router]);

  if (isLoginPage) return <>{children}</>;

  if (loading || !allowed) {
    return (
      <div
        role="status"
        className="flex h-full items-center justify-center text-sm text-slate-400"
      >
        Checking access…
      </div>
    );
  }

  return (
    <div className="h-full flex">
      <Sidebar />
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">{children}</div>
    </div>
  );
}
