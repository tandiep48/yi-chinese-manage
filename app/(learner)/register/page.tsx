"use client";

// app/(learner)/register/page.tsx
// Learner sign-up — posts to /api/auth/register via useAuth(), which creates
// the account and immediately signs the caller in (same as the old Jinja
// register flow's follow-up login, but in one step).

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/auth/AuthProvider";
import { useT } from "@/components/i18n/I18nProvider";
import { Button } from "@/components/shared/customer_ui/Button/Button";

const inputCls =
  "w-full rounded-lg border border-black/10 bg-white px-3 py-2.5 text-[15px] " +
  "text-[var(--learner-text)] placeholder:text-[var(--learner-text-muted)] " +
  "focus:border-[var(--learner-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--learner-primary)]/20 " +
  "transition-all";

const labelCls = "block text-sm font-semibold text-[var(--learner-text)] mb-1.5";

export default function RegisterPage() {
  const { t } = useT();
  const { register } = useAuth();
  const router = useRouter();

  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    try {
      await register(username, email, password);
      router.push("/");
    } catch (err) {
      setError(err instanceof Error ? err.message : t("flash.database_error"));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex flex-1 items-center justify-center p-6">
      <div className="w-full max-w-sm rounded-2xl border border-black/5 bg-white p-8 shadow-[0_8px_32px_rgba(0,0,0,0.06)]">
        <h1 className="mb-6 text-center text-2xl font-extrabold text-[var(--learner-text)]">
          {t("auth.register_heading")}
        </h1>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="register-username" className={labelCls}>
              {t("auth.username_label")}
            </label>
            <input
              id="register-username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoComplete="username"
              required
              className={inputCls}
            />
          </div>

          <div>
            <label htmlFor="register-email" className={labelCls}>
              {t("auth.email_label")}
            </label>
            <input
              id="register-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              required
              className={inputCls}
            />
          </div>

          <div>
            <label htmlFor="register-password" className={labelCls}>
              {t("auth.password_label")}
            </label>
            <input
              id="register-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="new-password"
              minLength={8}
              required
              className={inputCls}
            />
          </div>

          {error && (
            <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600">
              {error}
            </p>
          )}

          <Button
            type="submit"
            id="register-submit"
            variant="primary"
            size="md"
            className="w-full justify-center"
            isLoading={submitting}
          >
            {t("auth.register_button")}
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-[var(--learner-text-muted)]">
          {t("auth.have_account_prompt")}{" "}
          <Link href="/login" className="font-semibold text-[var(--learner-primary)] hover:underline">
            {t("auth.login_here")}
          </Link>
        </p>
      </div>
    </div>
  );
}
