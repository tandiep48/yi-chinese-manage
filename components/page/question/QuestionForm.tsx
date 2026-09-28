"use client";

// components/page/question/QuestionForm.tsx
// Create / Edit question-bank modal form.
// `options` is edited as raw JSON (must be a JSON object or blank).

import { useEffect, useState } from "react";
import { Modal } from "@/components/shared/manager_ui/Modal/Modal";
import type { Question, QuestionFormData } from "@/lib/types/question";
import { QUESTION_CATEGORIES, QUESTION_SKILLS } from "@/lib/types/question";

interface QuestionFormProps {
  open: boolean;
  initial?: Question | null; // null = create mode
  onClose: () => void;
  onSubmit: (data: QuestionFormData) => Promise<void>;
}

interface FormState {
  category: string;
  skill: string;
  level: string;
  lesson: string;
  no: string;
  type: string;
  progress: string;
  unit_id: string;
  answer: string;
  image: string;
  audio_key: string;
  content: string;
  question: string;
  options: string;
}

const EMPTY: FormState = {
  category: "practice",
  skill: "",
  level: "",
  lesson: "",
  no: "",
  type: "",
  progress: "",
  unit_id: "",
  answer: "",
  image: "",
  audio_key: "",
  content: "",
  question: "",
  options: "",
};

const inputCls =
  "w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm " +
  "text-slate-800 placeholder:text-slate-400 " +
  "focus:border-indigo-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-100 " +
  "transition-all";

const labelCls = "block text-xs font-semibold text-slate-600 mb-1";
const req = <span className="text-rose-500">*</span>;

function toFormState(q: Question): FormState {
  return {
    category: q.category ?? "practice",
    skill: q.skill ?? "",
    level: String(q.level ?? ""),
    lesson: String(q.lesson ?? ""),
    no: String(q.no ?? ""),
    type: String(q.type ?? ""),
    progress: q.progress ?? "",
    unit_id: q.unit_id ?? "",
    answer: q.answer ?? "",
    image: q.image ?? "",
    audio_key: q.audio_key ?? "",
    content: q.content ?? "",
    question: q.question ?? "",
    options: q.options ? JSON.stringify(q.options, null, 2) : "",
  };
}

export function QuestionForm({ open, initial, onClose, onSubmit }: QuestionFormProps) {
  const isEdit = !!initial;
  const [form, setForm] = useState<FormState>(EMPTY);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (open) {
      setForm(initial ? toFormState(initial) : EMPTY);
      setError("");
    }
  }, [open, initial]);

  const set = (key: keyof FormState) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Required numeric fields
    const nums: Record<string, number> = {};
    for (const key of ["level", "lesson", "no", "type"] as const) {
      const n = Number.parseInt(form[key], 10);
      if (Number.isNaN(n)) {
        setError(`Field '${key}' must be a whole number.`);
        return;
      }
      nums[key] = n;
    }
    if (!form.progress.trim()) {
      setError("Field 'progress' is required.");
      return;
    }

    // Options — must be a JSON object or blank
    let options: Record<string, unknown> | null = null;
    const optText = form.options.trim();
    if (optText) {
      let parsed: unknown;
      try {
        parsed = JSON.parse(optText);
      } catch {
        setError("Options is not valid JSON.");
        return;
      }
      if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
        setError('Options must be a JSON object, e.g. {"A": true, "B": false}.');
        return;
      }
      options = parsed as Record<string, unknown>;
    }

    const payload: QuestionFormData = {
      category: form.category,
      level: nums.level,
      lesson: nums.lesson,
      no: nums.no,
      type: nums.type,
      progress: form.progress.trim(),
      skill: form.skill || null,
      unit_id: form.unit_id.trim(),
      answer: form.answer.trim() || null,
      image: form.image.trim() || null,
      audio_key: form.audio_key.trim() || null,
      content: form.content || null,
      question: form.question || null,
      options,
    };

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
      maxWidth="max-w-2xl"
      title={isEdit ? `Edit Question #${initial?.id}` : "Add New Question"}
      onClose={onClose}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Row: category + skill + type */}
        <div className="grid grid-cols-3 gap-4">
          <div>
            <label htmlFor="q-category" className={labelCls}>Category {req}</label>
            <select id="q-category" value={form.category} onChange={set("category")} className={inputCls}>
              {QUESTION_CATEGORIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="q-skill" className={labelCls}>Skill</label>
            <select id="q-skill" value={form.skill} onChange={set("skill")} className={inputCls}>
              <option value="">— None —</option>
              {QUESTION_SKILLS.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="q-type" className={labelCls}>Type {req}</label>
            <input id="q-type" type="number" value={form.type} onChange={set("type")} placeholder="1" className={inputCls} />
          </div>
        </div>

        {/* Row: level + lesson + no */}
        <div className="grid grid-cols-3 gap-4">
          <div>
            <label htmlFor="q-level" className={labelCls}>Level {req}</label>
            <input id="q-level" type="number" value={form.level} onChange={set("level")} placeholder="1" className={inputCls} />
          </div>
          <div>
            <label htmlFor="q-lesson" className={labelCls}>Lesson {req}</label>
            <input id="q-lesson" type="number" value={form.lesson} onChange={set("lesson")} placeholder="3" className={inputCls} />
          </div>
          <div>
            <label htmlFor="q-no" className={labelCls}>No {req}</label>
            <input id="q-no" type="number" value={form.no} onChange={set("no")} placeholder="1" className={inputCls} />
          </div>
        </div>

        {/* Row: progress + unit_id + answer */}
        <div className="grid grid-cols-3 gap-4">
          <div>
            <label htmlFor="q-progress" className={labelCls}>Progress {req}</label>
            <input id="q-progress" value={form.progress} onChange={set("progress")} placeholder="1 or 1-5" className={inputCls} />
          </div>
          <div>
            <label htmlFor="q-unit" className={labelCls}>Unit ID</label>
            <input id="q-unit" value={form.unit_id} onChange={set("unit_id")} placeholder="HP1_3_1" className={inputCls} />
          </div>
          <div>
            <label htmlFor="q-answer" className={labelCls}>Answer</label>
            <input id="q-answer" value={form.answer} onChange={set("answer")} placeholder="A" className={inputCls} />
          </div>
        </div>

        {/* Content */}
        <div>
          <label htmlFor="q-content" className={labelCls}>Content</label>
          <textarea id="q-content" value={form.content} onChange={set("content")} rows={2} className={inputCls} />
        </div>

        {/* Question */}
        <div>
          <label htmlFor="q-question" className={labelCls}>Question</label>
          <textarea id="q-question" value={form.question} onChange={set("question")} rows={2} placeholder="text or image filename" className={inputCls} />
        </div>

        {/* Row: image + audio_key */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="q-image" className={labelCls}>Image</label>
            <input id="q-image" value={form.image} onChange={set("image")} placeholder="1.3.1.jpg" className={inputCls} />
          </div>
          <div>
            <label htmlFor="q-audio" className={labelCls}>Audio Key</label>
            <input id="q-audio" value={form.audio_key} onChange={set("audio_key")} placeholder="audio.mp3" className={inputCls} />
          </div>
        </div>

        {/* Options (JSON) */}
        <div>
          <label htmlFor="q-options" className={labelCls}>
            Options <span className="font-normal text-slate-400">(JSON object, optional)</span>
          </label>
          <textarea
            id="q-options"
            value={form.options}
            onChange={set("options")}
            rows={3}
            placeholder={'{ "A": true, "B": false }'}
            className={inputCls + " font-mono text-xs"}
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
            id="question-form-submit"
            className="rounded-lg bg-indigo-500 px-5 py-2 text-sm font-semibold text-white hover:bg-indigo-600 disabled:opacity-60 transition-colors shadow-sm"
          >
            {saving ? "Saving…" : isEdit ? "Save Changes" : "Add Question"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
