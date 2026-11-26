"use client";

// components/page/passage/LineCard.tsx
// Editor for one lesson line, saved on its own. Also used for a new line.

import { useState } from "react";
import { useToast } from "@/components/shared/manager_ui/Toast/Toast";
import {
  errorCls,
  inputCls,
  labelCls,
  primaryButtonCls,
  secondaryButtonCls,
} from "@/components/page/passage/formStyles";
import { lessonAudioUrl } from "@/lib/audio";
import { formatTokens, parseTokens, tokensMatch } from "@/lib/lessons/lineTokens";
import type { LessonLine, LineFormData } from "@/lib/types/lesson";

interface LineCardProps {
  lineId: number | null;
  initial: LineFormData;
  isNew?: boolean;
  audioFolder: string;
  onSave: (data: LineFormData) => Promise<LessonLine>;
  onCancel?: () => void;
  // Reordering; omitted for a new line, undefined direction = already at that end.
  onMoveUp?: () => void;
  onMoveDown?: () => void;
}

type TextField = Exclude<keyof LineFormData, "tokens" | "flag">;

const TEXT_FIELDS: { field: TextField; label: string; maxLength?: number; wide?: boolean }[] = [
  { field: "speaker", label: "Speaker", maxLength: 50 },
  { field: "audio_key", label: "Audio key", maxLength: 100 },
  { field: "content", label: "Content (Chinese)", wide: true },
  { field: "pinyin", label: "Pinyin", wide: true },
  { field: "translation_en", label: "Translation (EN)" },
  { field: "translation_vi", label: "Translation (VI)" },
];

export function toLineDraft(line: LessonLine): LineFormData {
  return {
    speaker: line.speaker ?? "",
    content: line.content ?? "",
    pinyin: line.pinyin ?? "",
    audio_key: line.audio_key ?? "",
    translation_en: line.translation_en ?? "",
    translation_vi: line.translation_vi ?? "",
    tokens: line.tokens,
    flag: line.flag,
  };
}

export function LineCard({
  lineId,
  initial,
  isNew = false,
  audioFolder,
  onSave,
  onCancel,
  onMoveUp,
  onMoveDown,
}: LineCardProps) {
  const { toast } = useToast();
  const [saved, setSaved] = useState(initial);
  const [draft, setDraft] = useState(initial);
  const [tokenText, setTokenText] = useState(() => formatTokens(initial.tokens));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const tokens = parseTokens(tokenText);
  const tokensChanged = formatTokens(tokens) !== formatTokens(saved.tokens);
  const dirty = tokensChanged || JSON.stringify({ ...draft, tokens: [] }) !== JSON.stringify({ ...saved, tokens: [] });
  // As on the server, an untouched older mismatch does not block other edits.
  const mismatch =
    (isNew || tokensChanged || draft.content !== saved.content) &&
    !tokensMatch(draft.content, tokens);

  const set = (patch: Partial<LineFormData>) => setDraft((d) => ({ ...d, ...patch }));
  const prefix = `line-${lineId}`;

  const playAudio = () => {
    const audio = new Audio(lessonAudioUrl(audioFolder, draft.audio_key.trim()));
    audio.play().catch(() => toast(`Could not play audio "${draft.audio_key}".`, "error"));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      const next = toLineDraft(await onSave({ ...draft, tokens }));
      setSaved(next);
      setDraft(next);
      setTokenText(formatTokens(next.tokens));
      toast(`Line ${lineId} saved.`, "success");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed.");
    } finally {
      setSaving(false);
    }
  };

  const move = isNew ? null : (
    <div className="flex gap-2">
      <button
        type="button"
        onClick={onMoveUp}
        disabled={!onMoveUp}
        aria-label={`Move line ${lineId} up`}
        className={secondaryButtonCls}
      >
        ↑
      </button>
      <button
        type="button"
        onClick={onMoveDown}
        disabled={!onMoveDown}
        aria-label={`Move line ${lineId} down`}
        className={secondaryButtonCls}
      >
        ↓
      </button>
    </div>
  );

  return (
    <form
      onSubmit={handleSubmit}
      aria-label={isNew ? "New line" : `Line ${lineId}`}
      className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm space-y-3"
    >
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-sm font-bold text-slate-700">
          {isNew ? `New line ${lineId}` : `Line ${lineId ?? "—"}`}
          {dirty && !isNew && (
            <span className="ml-2 text-xs font-medium text-amber-600">Unsaved changes</span>
          )}
        </h3>
        {move}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {TEXT_FIELDS.map(({ field, label, maxLength, wide }) => (
          <div key={field} className={wide ? "sm:col-span-2" : undefined}>
            <label htmlFor={`${prefix}-${field}`} className={labelCls}>{label}</label>
            <div className="flex gap-2">
              <input
                id={`${prefix}-${field}`}
                maxLength={maxLength}
                value={draft[field]}
                onChange={(e) => set({ [field]: e.target.value })}
                className={inputCls}
              />
              {field === "audio_key" && (
                <button
                  type="button"
                  onClick={playAudio}
                  disabled={!draft.audio_key.trim()}
                  aria-label={`Play audio of line ${lineId}`}
                  className={secondaryButtonCls}
                >
                  ▶
                </button>
              )}
            </div>
          </div>
        ))}
        <div className="sm:col-span-2">
          <label htmlFor={`${prefix}-tokens`} className={labelCls}>
            Tokens (separate words with |)
          </label>
          <input
            id={`${prefix}-tokens`}
            value={tokenText}
            onChange={(e) => setTokenText(e.target.value)}
            aria-invalid={mismatch}
            className={inputCls}
          />
          {mismatch && (
            <p role="alert" className="mt-1 text-xs text-red-600">
              Tokens must spell out the content (punctuation aside). Fix them, or clear them to
              leave this line out of reorder tasks.
            </p>
          )}
        </div>
      </div>

      {error && <p role="alert" className={errorCls}>{error}</p>}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <label className="flex items-center gap-2 text-sm text-slate-600">
          <input
            type="checkbox"
            checked={draft.flag === 1}
            onChange={(e) => set({ flag: e.target.checked ? 1 : 0 })}
            className="h-4 w-4 accent-indigo-500"
          />
          Quizzed in lesson trainer
        </label>
        <div className="flex gap-2">
          {onCancel && (
            <button type="button" onClick={onCancel} className={secondaryButtonCls}>
              Cancel
            </button>
          )}
          <button
            type="submit"
            disabled={saving || mismatch || (!isNew && !dirty)}
            className={primaryButtonCls}
          >
            {saving ? "Saving…" : isNew ? "Add line" : "Save line"}
          </button>
        </div>
      </div>
    </form>
  );
}
