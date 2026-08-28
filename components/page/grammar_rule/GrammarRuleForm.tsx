"use client";

// components/page/grammar_rule/GrammarRuleForm.tsx
// Create / Edit grammar rule modal form.

import { useEffect, useState } from "react";
import { Modal } from "@/components/shared/manager_ui/Modal/Modal";
import type { GrammarRule, GrammarRuleFormData } from "@/lib/types/types";
import { GRAMMAR_TYPES } from "@/lib/types/types";

interface GrammarRuleFormProps {
  open: boolean;
  initial?: GrammarRule | null; // null = create mode
  onClose: () => void;
  onSubmit: (data: GrammarRuleFormData) => Promise<void>;
}

const EMPTY: GrammarRuleFormData = {
  grammar_id: "",
  type: null,
  passage_number: null,
  vietnamese_content: "",
  english_content: "",
};

const inputCls =
  "w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm " +
  "text-slate-800 placeholder:text-slate-400 " +
  "focus:border-indigo-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-100 " +
  "transition-all";

const labelCls = "block text-xs font-semibold text-slate-600 mb-1";

export function GrammarRuleForm({ open, initial, onClose, onSubmit }: GrammarRuleFormProps) {
  const isEdit = !!initial;
  const [form, setForm] = useState<GrammarRuleFormData>(EMPTY);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // Sync form when initial changes
  useEffect(() => {
    if (open) {
      setForm(
        initial
          ? {
              grammar_id: initial.grammar_id ?? "",
              type: initial.type ?? null,
              passage_number: initial.passage_number ?? null,
              vietnamese_content: initial.vietnamese_content ?? "",
              english_content: initial.english_content ?? "",
            }
          : EMPTY
      );
      setError("");
    }
  }, [open, initial]);

  const setText = (key: "grammar_id" | "vietnamese_content" | "english_content") => (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const setNumber = (key: "type" | "passage_number") => (
    e: React.ChangeEvent<HTMLSelectElement | HTMLInputElement>
  ) =>
    setForm((f) => ({
      ...f,
      [key]: e.target.value === "" ? null : Number(e.target.value),
    }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.grammar_id.trim()) {
      setError("Grammar ID is required.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      await onSubmit(form);
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
      title={isEdit ? `Edit Grammar Rule — ${initial?.grammar_id}` : "Add New Grammar Rule"}
      onClose={onClose}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Row: grammar_id + type */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="grammar-rule-id" className={labelCls}>
              Grammar ID <span className="text-rose-500">*</span>
            </label>
            <input
              id="grammar-rule-id"
              value={form.grammar_id}
              onChange={setText("grammar_id")}
              placeholder="H1-2-1"
              disabled={isEdit}
              className={inputCls + (isEdit ? " opacity-60 cursor-not-allowed" : "")}
            />
          </div>
          <div>
            <label htmlFor="grammar-rule-type" className={labelCls}>Type</label>
            <select
              id="grammar-rule-type"
              value={form.type ?? ""}
              onChange={setNumber("type")}
              className={inputCls}
            >
              <option value="">— Select —</option>
              {GRAMMAR_TYPES.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Passage number */}
        <div>
          <label htmlFor="grammar-rule-passage-number" className={labelCls}>Passage Number</label>
          <input
            id="grammar-rule-passage-number"
            type="number"
            value={form.passage_number ?? ""}
            onChange={setNumber("passage_number")}
            placeholder="1"
            className={inputCls}
          />
        </div>

        {/* Vietnamese content */}
        <div>
          <label htmlFor="grammar-rule-vn" className={labelCls}>Vietnamese Content</label>
          <textarea
            id="grammar-rule-vn"
            value={form.vietnamese_content ?? ""}
            onChange={setText("vietnamese_content")}
            rows={3}
            placeholder="Nội dung tiếng Việt"
            className={inputCls}
          />
        </div>

        {/* English content */}
        <div>
          <label htmlFor="grammar-rule-en" className={labelCls}>English Content</label>
          <textarea
            id="grammar-rule-en"
            value={form.english_content ?? ""}
            onChange={setText("english_content")}
            rows={3}
            placeholder="English content"
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
            id="grammar-rule-form-submit"
            className="rounded-lg bg-indigo-500 px-5 py-2 text-sm font-semibold text-white hover:bg-indigo-600 disabled:opacity-60 transition-colors shadow-sm"
          >
            {saving ? "Saving…" : isEdit ? "Save Changes" : "Add Grammar Rule"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
