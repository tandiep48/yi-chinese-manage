"use client";

// components/passage/PassageForm.tsx
// Create / Edit passage modal form with embedded LinesEditor.

import { useEffect, useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { LinesEditor } from "@/components/passage/LinesEditor";
import type { LessonPassage, PassageFormData, LineFormData } from "@/lib/types";
import { HSK_LEVELS } from "@/lib/types";

interface PassageFormProps {
  open: boolean;
  initial?: LessonPassage | null;
  onClose: () => void;
  onSubmit: (data: PassageFormData) => Promise<void>;
}

const EMPTY: PassageFormData = { passage_id: "", hsk_level: "", lines: [] };

const inputCls =
  "w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm " +
  "text-slate-800 placeholder:text-slate-400 " +
  "focus:border-indigo-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-100 transition-all";
const labelCls = "block text-xs font-semibold text-slate-600 mb-1";

export function PassageForm({ open, initial, onClose, onSubmit }: PassageFormProps) {
  const isEdit = !!initial;
  const [passageId, setPassageId] = useState("");
  const [hskLevel, setHskLevel] = useState("");
  const [lines, setLines] = useState<LineFormData[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (open) {
      if (initial) {
        setPassageId(initial.passage_id ?? "");
        setHskLevel(initial.hsk_level ?? "");
        setLines(
          (initial.lines ?? []).map((l) => ({
            line_id: l.line_id ?? undefined,
            speaker: l.speaker ?? undefined,
            content: l.content ?? undefined,
            pinyin: l.pinyin ?? undefined,
            audio_key: l.audio_key ?? undefined,
            translation_en: l.translation_en ?? undefined,
            translation_vi: l.translation_vi ?? undefined,
            tokens: l.tokens ?? [],
          }))
        );
      } else {
        setPassageId("");
        setHskLevel("");
        setLines([]);
      }
      setError("");
    }
  }, [open, initial]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!passageId.trim()) {
      setError("Passage ID is required.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      const data: PassageFormData = {
        passage_id: passageId.trim(),
        hsk_level: hskLevel || undefined,
        lines,
      };
      await onSubmit(data);
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
      title={isEdit ? `Edit Passage — ${initial?.passage_id}` : "Add New Passage"}
      onClose={onClose}
      maxWidth="max-w-2xl"
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Row: passage_id + hsk_level */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="passage-id" className={labelCls}>
              Passage ID <span className="text-rose-500">*</span>
            </label>
            <input
              id="passage-id"
              value={passageId}
              onChange={(e) => setPassageId(e.target.value)}
              placeholder="H1_1_1"
              disabled={isEdit}
              className={inputCls + (isEdit ? " opacity-60 cursor-not-allowed" : "")}
            />
          </div>
          <div>
            <label htmlFor="passage-hsk" className={labelCls}>HSK Level</label>
            <select
              id="passage-hsk"
              value={hskLevel}
              onChange={(e) => setHskLevel(e.target.value)}
              className={inputCls}
            >
              <option value="">— Select —</option>
              {HSK_LEVELS.map((l) => (
                <option key={l} value={l}>{l}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-slate-100" />

        {/* Lines editor */}
        <LinesEditor lines={lines} onChange={setLines} />

        {/* Error */}
        {error && (
          <p className="rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-600">
            {error}
          </p>
        )}

        {/* Footer */}
        <div className="flex justify-end gap-3 pt-1 border-t border-slate-100">
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
            id="passage-form-submit"
            className="rounded-lg bg-indigo-500 px-5 py-2 text-sm font-semibold text-white hover:bg-indigo-600 disabled:opacity-60 transition-colors shadow-sm"
          >
            {saving ? "Saving…" : isEdit ? "Save Changes" : "Add Passage"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
