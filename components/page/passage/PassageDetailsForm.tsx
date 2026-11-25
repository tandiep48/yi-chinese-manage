"use client";

// components/page/passage/PassageDetailsForm.tsx
// The passage's own columns: HSK level and titles (book code is read-only).

import { useState } from "react";
import { useToast } from "@/components/shared/manager_ui/Toast/Toast";
import { errorCls, inputCls, labelCls, primaryButtonCls } from "@/components/page/passage/formStyles";
import { HSK_LEVELS } from "@/lib/types/common";
import type { LessonPassage, PassageDetailsData } from "@/lib/types/lesson";

interface PassageDetailsFormProps {
  passage: LessonPassage;
  onSave: (data: PassageDetailsData) => Promise<LessonPassage>;
}

function toDraft(passage: LessonPassage): PassageDetailsData {
  return {
    hsk_level: passage.hsk_level ?? "",
    title_en: passage.title_en ?? "",
    title_vn: passage.title_vn ?? "",
  };
}

export function PassageDetailsForm({ passage, onSave }: PassageDetailsFormProps) {
  const { toast } = useToast();
  const [draft, setDraft] = useState(() => toDraft(passage));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const saved = toDraft(passage);
  const dirty = (Object.keys(saved) as (keyof PassageDetailsData)[]).some(
    (key) => draft[key] !== saved[key]
  );
  const set = (patch: Partial<PassageDetailsData>) => setDraft((d) => ({ ...d, ...patch }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      setDraft(toDraft(await onSave(draft)));
      toast("Passage details saved.", "success");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      aria-label="Passage details"
      className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm space-y-4"
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label htmlFor="details-hsk" className={labelCls}>HSK Level</label>
          <select
            id="details-hsk"
            value={draft.hsk_level}
            onChange={(e) => set({ hsk_level: e.target.value })}
            className={inputCls}
          >
            <option value="">— None —</option>
            {HSK_LEVELS.map((l) => (
              <option key={l} value={l}>{l}</option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="details-book" className={labelCls}>Book code (read-only)</label>
          <input
            id="details-book"
            readOnly
            value={passage.book_code ?? ""}
            placeholder="Not part of a book"
            className={`${inputCls} cursor-not-allowed opacity-60`}
          />
        </div>
        <div>
          <label htmlFor="details-title-en" className={labelCls}>Title (EN)</label>
          <input
            id="details-title-en"
            maxLength={255}
            value={draft.title_en}
            onChange={(e) => set({ title_en: e.target.value })}
            className={inputCls}
          />
        </div>
        <div>
          <label htmlFor="details-title-vn" className={labelCls}>Title (VI)</label>
          <input
            id="details-title-vn"
            maxLength={255}
            value={draft.title_vn}
            onChange={(e) => set({ title_vn: e.target.value })}
            className={inputCls}
          />
        </div>
      </div>

      <p className="text-xs text-slate-400">
        Lesson titles are read from the lesson&apos;s first part (the passage ID ending in _1).
      </p>
      {error && <p role="alert" className={errorCls}>{error}</p>}
      <div className="flex justify-end">
        <button type="submit" disabled={!dirty || saving} className={primaryButtonCls}>
          {saving ? "Saving…" : "Save details"}
        </button>
      </div>
    </form>
  );
}
