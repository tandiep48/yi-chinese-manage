"use client";

// components/page/grammar_context/GrammarContextForm.tsx
// Create / Edit grammar context modal form.
// content_json is edited as raw JSON text and parsed on submit.

import { useEffect, useState } from "react";
import { Modal } from "@/components/shared/manager_ui/Modal/Modal";
import type { GrammarContext, GrammarContextFormData } from "@/lib/types/types";

interface GrammarContextFormProps {
  open: boolean;
  initial?: GrammarContext | null; // null = create mode
  onClose: () => void;
  onSubmit: (data: GrammarContextFormData) => Promise<void>;
}

const inputCls =
  "w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm " +
  "text-slate-800 placeholder:text-slate-400 " +
  "focus:border-indigo-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-100 " +
  "transition-all";

const monoInputCls = inputCls + " font-mono";

const labelCls = "block text-xs font-semibold text-slate-600 mb-1";

export function GrammarContextForm({ open, initial, onClose, onSubmit }: GrammarContextFormProps) {
  const isEdit = !!initial;
  const [grammarId, setGrammarId] = useState("");
  const [contentJsonText, setContentJsonText] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // Sync form when initial changes
  useEffect(() => {
    if (open) {
      setGrammarId(initial?.grammar_id ?? "");
      setContentJsonText(
        initial?.content_json != null ? JSON.stringify(initial.content_json, null, 2) : ""
      );
      setError("");
    }
  }, [open, initial]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!grammarId.trim()) {
      setError("Grammar ID is required.");
      return;
    }

    let contentJson: Record<string, unknown> | unknown[] | null = null;
    if (contentJsonText.trim()) {
      try {
        const parsed = JSON.parse(contentJsonText);
        if (typeof parsed !== "object" || parsed === null) {
          throw new Error("must be a JSON object or array");
        }
        contentJson = parsed;
      } catch {
        setError("Content JSON must be valid JSON (an object or array), or left blank.");
        return;
      }
    }

    setSaving(true);
    setError("");
    try {
      await onSubmit({ grammar_id: grammarId, content_json: contentJson });
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
      title={isEdit ? `Edit Grammar Context — ${initial?.grammar_id}` : "Add New Grammar Context"}
      onClose={onClose}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Grammar ID */}
        <div>
          <label htmlFor="grammar-context-id" className={labelCls}>
            Grammar ID <span className="text-rose-500">*</span>
          </label>
          <input
            id="grammar-context-id"
            value={grammarId}
            onChange={(e) => setGrammarId(e.target.value)}
            placeholder="H1-2-1"
            disabled={isEdit}
            className={inputCls + (isEdit ? " opacity-60 cursor-not-allowed" : "")}
          />
        </div>

        {/* Content JSON */}
        <div>
          <label htmlFor="grammar-context-content" className={labelCls}>Content JSON</label>
          <textarea
            id="grammar-context-content"
            value={contentJsonText}
            onChange={(e) => setContentJsonText(e.target.value)}
            rows={8}
            placeholder='{ "examples": ["..."] }'
            className={monoInputCls}
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
            id="grammar-context-form-submit"
            className="rounded-lg bg-indigo-500 px-5 py-2 text-sm font-semibold text-white hover:bg-indigo-600 disabled:opacity-60 transition-colors shadow-sm"
          >
            {saving ? "Saving…" : isEdit ? "Save Changes" : "Add Grammar Context"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
