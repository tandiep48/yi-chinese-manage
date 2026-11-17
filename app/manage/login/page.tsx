"use client";

// app/manage/login/page.tsx
// Admin sign-in. Uses the same /api/auth/login session as the learner app, then
// requires the "manage:access" permission — other accounts are signed straight
// back out so a student never lands in /manage.

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/auth/AuthProvider";
import { canAccessManage } from "@/lib/auth/permissions";

const inputCls =
  "w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm " +
  "text-slate-800 placeholder:text-slate-400 " +
  "focus:border-indigo-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-100 " +
  "transition-all";

const labelCls = "block text-xs font-semibold text-slate-600 mb-1";

const NO_ACCESS_MESSAGE = "This account does not have access to the manage area.";

export default function ManageLoginPage() {
  const { user, loading, login, logout } = useAuth();
  const router = useRouter();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  // Already signed in with access (e.g. an existing session) — skip the form.
  useEffect(() => {
    if (!loading && canAccessManage(user)) router.replace("/manage");
  }, [loading, user, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    try {
      const signedIn = await login(username.trim(), password);
      if (!canAccessManage(signedIn)) {
        await logout();
        setError(NO_ACCESS_MESSAGE);
        return;
      }
      router.replace("/manage");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Sign in failed.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="flex h-full items-center justify-center p-4">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm space-y-4 rounded-xl border border-slate-200 bg-white p-6 shadow-sm"
      >
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-lg bg-indigo-500 flex items-center justify-center shadow-sm">
            <span className="text-white font-bold">易</span>
          </div>
          <div>
            <h1 className="text-lg font-semibold text-slate-800 leading-none">Sign in</h1>
            <p className="text-xs text-slate-400 mt-1">Yi Chinese admin</p>
          </div>
        </div>

        <div>
          <label htmlFor="manage-username" className={labelCls}>Username</label>
          <input
            id="manage-username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            autoComplete="username"
            required
            className={inputCls}
          />
        </div>

        <div>
          <label htmlFor="manage-password" className={labelCls}>Password</label>
          <input
            id="manage-password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
            required
            className={inputCls}
          />
        </div>

        {error && (
          <p
            role="alert"
            className="rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-600"
          >
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={submitting}
          id="manage-login-submit"
          className="w-full rounded-lg bg-indigo-500 px-5 py-2 text-sm font-semibold text-white hover:bg-indigo-600 disabled:opacity-60 transition-colors shadow-sm"
        >
          {submitting ? "Signing in…" : "Sign in"}
        </button>
      </form>
    </main>
  );
}
