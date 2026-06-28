"use client";

// components/vocab/VocabForm.tsx
// Create / Edit vocabulary modal form.

import { useEffect, useState } from "react";
import { Modal } from "@/components/ui/Modal";
import type { Vocab, VocabFormData } from "@/lib/types";
import { HSK_LEVELS } from "@/lib/types";

interface VocabFormProps {
  open: boolean;
  initial?: Vocab | null;  // null = create mode
  onClose: () => void;
  onSubmit: (data: VocabFormData) => Promise<void>;
}

const EMPTY: VocabFormData = {
  cn: "",
  pinyin: "",
  meaning_en: "",
  meaning_vn: "",
  audio_key: "",
  hsk_level: "",
  source: "",
};

const inputCls =
  "w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm " +
  "text-slate-800 placeholder:text-slate-400 " +
  "focus:border-indigo-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-100 " +
  "transition-all";

const labelCls = "block text-xs font-semibold text-slate-600 mb-1";

export function VocabForm({ open, initial, onClose, onSubmit }: VocabFormProps) {
  const isEdit = !!initial;
  const [form, setForm] = useState<VocabFormData>(EMPTY);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // Sync form when initial changes
  useEffect(() => {
    if (open) {
      setForm(
        initial
          ? {
              cn: initial.cn ?? "",
              pinyin: initial.pinyin ?? "",
              meaning_en: initial.meaning_en ?? "",
              meaning_vn: initial.meaning_vn ?? "",
              audio_key: initial.audio_key ?? "",
              hsk_level: initial.hsk_level ?? "",
              source: initial.source ?? "",
            }
          : EMPTY
      );
      setError("");
    }
  }, [open, initial]);

  const set = (key: keyof VocabFormData) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.cn.trim()) {
      setError("Chinese word (cn) is required.");
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
      title={isEdit ? `Edit Vocabulary — ${initial?.cn}` : "Add New Vocabulary"}
      onClose={onClose}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Row: cn + hsk_level */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="vocab-cn" className={labelCls}>
              Chinese Word <span className="text-rose-500">*</span>
            </label>
            <input
              id="vocab-cn"
              value={form.cn}
              onChange={set("cn")}
              placeholder="你好"
              disabled={isEdit}
              className={inputCls + (isEdit ? " opacity-60 cursor-not-allowed" : "")}
            />
          </div>
          <div>
            <label htmlFor="vocab-hsk" className={labelCls}>HSK Level</label>
            <select
              id="vocab-hsk"
              value={form.hsk_level}
              onChange={set("hsk_level")}
              className={inputCls}
            >
              <option value="">— Select —</option>
              {HSK_LEVELS.map((l) => (
                <option key={l} value={l}>{l}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Pinyin */}
        <div>
          <label htmlFor="vocab-pinyin" className={labelCls}>Pinyin</label>
          <input
            id="vocab-pinyin"
            value={form.pinyin}
            onChange={set("pinyin")}
            placeholder="nǐ hǎo"
            className={inputCls}
          />
        </div>

        {/* Row: meaning_en + meaning_vn */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="vocab-en" className={labelCls}>Meaning (English)</label>
            <input
              id="vocab-en"
              value={form.meaning_en}
              onChange={set("meaning_en")}
              placeholder="Hello"
              className={inputCls}
            />
          </div>
          <div>
            <label htmlFor="vocab-vn" className={labelCls}>Meaning (Vietnamese)</label>
            <input
              id="vocab-vn"
              value={form.meaning_vn}
              onChange={set("meaning_vn")}
              placeholder="Xin chào"
              className={inputCls}
            />
          </div>
        </div>

        {/* Row: audio_key + source */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="vocab-audio" className={labelCls}>Audio Key</label>
            <input
              id="vocab-audio"
              value={form.audio_key}
              onChange={set("audio_key")}
              placeholder="ni_hao.mp3"
              className={inputCls}
            />
          </div>
          <div>
            <label htmlFor="vocab-source" className={labelCls}>Source</label>
            <input
              id="vocab-source"
              value={form.source}
              onChange={set("source")}
              placeholder="textbook"
              className={inputCls}
            />
          </div>
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
            id="vocab-form-submit"
            className="rounded-lg bg-indigo-500 px-5 py-2 text-sm font-semibold text-white hover:bg-indigo-600 disabled:opacity-60 transition-colors shadow-sm"
          >
            {saving ? "Saving…" : isEdit ? "Save Changes" : "Add Vocabulary"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
