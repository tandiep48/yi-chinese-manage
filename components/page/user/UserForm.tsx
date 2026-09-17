"use client";

// components/user/UserForm.tsx
// Create / Edit user modal form.
// On edit, leaving the password blank keeps the current password.

import { useEffect, useState } from "react";
import { Modal } from "@/components/shared/manager_ui/Modal/Modal";
import type { User, UserFormData } from "@/lib/types/user";

interface UserFormProps {
  open: boolean;
  initial?: User | null; // null = create mode
  onClose: () => void;
  onSubmit: (data: UserFormData) => Promise<void>;
}

interface FormState {
  username: string;
  email: string;
  password: string;
  level: string;
}

const EMPTY: FormState = {
  username: "",
  email: "",
  password: "",
  level: "1",
};

const inputCls =
  "w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm " +
  "text-slate-800 placeholder:text-slate-400 " +
  "focus:border-indigo-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-100 " +
  "transition-all";

const labelCls = "block text-xs font-semibold text-slate-600 mb-1";

export function UserForm({ open, initial, onClose, onSubmit }: UserFormProps) {
  const isEdit = !!initial;
  const [form, setForm] = useState<FormState>(EMPTY);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (open) {
      setForm(
        initial
          ? {
              username: initial.username ?? "",
              email: initial.email ?? "",
              password: "",
              level: String(initial.level ?? 1),
            }
          : EMPTY
      );
      setError("");
    }
  }, [open, initial]);

  const set = (key: keyof FormState) => (
    e: React.ChangeEvent<HTMLInputElement>
  ) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const username = form.username.trim();
    const email = form.email.trim();
    if (!username) {
      setError("Username is required.");
      return;
    }
    if (!email) {
      setError("Email is required.");
      return;
    }
    if (!isEdit && !form.password) {
      setError("Password is required for a new user.");
      return;
    }
    const level = Number.parseInt(form.level, 10);
    if (Number.isNaN(level)) {
      setError("Level must be a whole number.");
      return;
    }

    const payload: UserFormData = { username, email, level };
    // Only send a password when one was actually entered.
    if (form.password) payload.password = form.password;

    setSaving(true);
    setError("");
    try {
      await onSubmit(payload);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      open={open}
      title={isEdit ? `Edit User — ${initial?.username}` : "Add New User"}
      onClose={onClose}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Row: username + level */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="user-username" className={labelCls}>
              Username <span className="text-rose-500">*</span>
            </label>
            <input
              id="user-username"
              value={form.username}
              onChange={set("username")}
              placeholder="jdoe"
              className={inputCls}
            />
          </div>
          <div>
            <label htmlFor="user-level" className={labelCls}>Level</label>
            <input
              id="user-level"
              type="number"
              min={1}
              value={form.level}
              onChange={set("level")}
              className={inputCls}
            />
          </div>
        </div>

        {/* Email */}
        <div>
          <label htmlFor="user-email" className={labelCls}>
            Email <span className="text-rose-500">*</span>
          </label>
          <input
            id="user-email"
            type="email"
            value={form.email}
            onChange={set("email")}
            placeholder="jdoe@example.com"
            className={inputCls}
          />
        </div>

        {/* Password */}
        <div>
          <label htmlFor="user-password" className={labelCls}>
            Password {!isEdit && <span className="text-rose-500">*</span>}
          </label>
          <input
            id="user-password"
            type="password"
            value={form.password}
            onChange={set("password")}
            placeholder={isEdit ? "Leave blank to keep current" : "••••••••"}
            autoComplete="new-password"
            className={inputCls}
          />
        </div>

        {/* Error */}
        {error && (
          <p className="rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-600">
            {error}
          </p>
        )}

        {/* Footer */}
        <div className="flex justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            id="user-form-submit"
            className="rounded-lg bg-indigo-500 px-5 py-2 text-sm font-semibold text-white hover:bg-indigo-600 disabled:opacity-60 transition-colors shadow-sm"
          >
            {saving ? "Saving…" : isEdit ? "Save Changes" : "Add User"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
