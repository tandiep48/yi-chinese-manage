"use client";

// components/page/passage/PassageForm.tsx
// "Add passage" modal. Titles and lines are edited on the passage page.

import { useState } from "react";
import { Modal } from "@/components/shared/manager_ui/Modal/Modal";
import {
  errorCls,
  inputCls,
  labelCls,
  primaryButtonCls,
  secondaryButtonCls,
} from "@/components/page/passage/formStyles";
import type { PassageFormData } from "@/lib/types/lesson";
import { HSK_LEVELS } from "@/lib/types/common";

interface PassageFormProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: PassageFormData) => Promise<void>;
}

export function PassageForm({ open, onClose, onSubmit }: PassageFormProps) {
  const [passageId, setPassageId] = useState("");
  const [hskLevel, setHskLevel] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!passageId.trim()) {
      setError("Passage ID is required.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      await onSubmit({ passage_id: passageId.trim(), hsk_level: hskLevel || undefined });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal open={open} title="Add New Passage" onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="passage-id" className={labelCls}>
              Passage ID <span className="text-rose-500">*</span>
            </label>
            <input
              id="passage-id"
              value={passageId}
              onChange={(e) => setPassageId(e.target.value)}
              placeholder="H1_1_1"
              className={inputCls}
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

        {error && <p role="alert" className={errorCls}>{error}</p>}

        <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
          <button type="button" onClick={onClose} className={secondaryButtonCls}>
            Cancel
          </button>
          <button type="submit" disabled={saving} id="passage-form-submit" className={primaryButtonCls}>
            {saving ? "Saving…" : "Add Passage"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
