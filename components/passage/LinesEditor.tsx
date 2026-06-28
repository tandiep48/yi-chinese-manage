"use client";

// components/passage/LinesEditor.tsx
// Dynamic list editor for lesson_lines inside PassageForm.

import type { LineFormData } from "@/lib/types";

interface LinesEditorProps {
  lines: LineFormData[];
  onChange: (lines: LineFormData[]) => void;
}

const inputCls =
  "w-full rounded-md border border-slate-200 bg-white px-2.5 py-1.5 text-xs " +
  "text-slate-800 placeholder:text-slate-300 " +
  "focus:border-indigo-400 focus:outline-none focus:ring-1 focus:ring-indigo-100 transition-all";

const labelCls = "block text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-1";

function emptyLine(index: number): LineFormData {
  return { line_id: index + 1 };
}

export function LinesEditor({ lines, onChange }: LinesEditorProps) {
  const setLine = (index: number, patch: Partial<LineFormData>) => {
    const updated = lines.map((l, i) => (i === index ? { ...l, ...patch } : l));
    onChange(updated);
  };

  const addLine = () => onChange([...lines, emptyLine(lines.length)]);

  const removeLine = (index: number) =>
    onChange(lines.filter((_, i) => i !== index));

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold text-slate-600">
          Lines{" "}
          <span className="ml-1 rounded-full bg-slate-100 px-1.5 py-0.5 text-[10px] font-bold text-slate-500">
            {lines.length}
          </span>
        </p>
        <button
          type="button"
          id="lines-add"
          onClick={addLine}
          className="inline-flex items-center gap-1 rounded-lg bg-indigo-50 px-3 py-1.5 text-xs font-semibold text-indigo-600 hover:bg-indigo-100 transition-colors"
        >
          + Add Line
        </button>
      </div>

      {lines.length === 0 && (
        <p className="rounded-lg border border-dashed border-slate-200 py-4 text-center text-xs text-slate-400">
          No lines yet. Click "Add Line" to start.
        </p>
      )}

      {lines.map((line, i) => (
        <div
          key={i}
          className="rounded-xl border border-slate-200 bg-slate-50 p-3 space-y-2"
        >
          {/* Line header */}
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Line {i + 1}
            </span>
            <button
              type="button"
              onClick={() => removeLine(i)}
              className="text-slate-300 hover:text-red-400 transition-colors p-0.5 rounded"
              title="Remove line"
            >
              <svg className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
                <path d="M6.28 5.22a.75.75 0 0 0-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 1 0 1.06 1.06L10 11.06l3.72 3.72a.75.75 0 1 0 1.06-1.06L11.06 10l3.72-3.72a.75.75 0 0 0-1.06-1.06L10 8.94 6.28 5.22Z" />
              </svg>
            </button>
          </div>

          {/* Row 1: line_id, speaker */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className={labelCls}>Line ID</label>
              <input
                type="number"
                value={line.line_id ?? ""}
                onChange={(e) => setLine(i, { line_id: Number(e.target.value) || undefined })}
                placeholder="1"
                className={inputCls}
              />
            </div>
            <div>
              <label className={labelCls}>Speaker</label>
              <input
                value={line.speaker ?? ""}
                onChange={(e) => setLine(i, { speaker: e.target.value })}
                placeholder="A"
                className={inputCls}
              />
            </div>
          </div>

          {/* Row 2: content, pinyin */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className={labelCls}>Content (Chinese)</label>
              <input
                value={line.content ?? ""}
                onChange={(e) => setLine(i, { content: e.target.value })}
                placeholder="你好！"
                className={inputCls}
              />
            </div>
            <div>
              <label className={labelCls}>Pinyin</label>
              <input
                value={line.pinyin ?? ""}
                onChange={(e) => setLine(i, { pinyin: e.target.value })}
                placeholder="nǐ hǎo"
                className={inputCls}
              />
            </div>
          </div>

          {/* Row 3: translation_en, translation_vi */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className={labelCls}>Translation (EN)</label>
              <input
                value={line.translation_en ?? ""}
                onChange={(e) => setLine(i, { translation_en: e.target.value })}
                placeholder="Hello!"
                className={inputCls}
              />
            </div>
            <div>
              <label className={labelCls}>Translation (VI)</label>
              <input
                value={line.translation_vi ?? ""}
                onChange={(e) => setLine(i, { translation_vi: e.target.value })}
                placeholder="Xin chào!"
                className={inputCls}
              />
            </div>
          </div>

          {/* Audio key */}
          <div>
            <label className={labelCls}>Audio Key</label>
            <input
              value={line.audio_key ?? ""}
              onChange={(e) => setLine(i, { audio_key: e.target.value })}
              placeholder="H1_1_1_01.mp3"
              className={inputCls}
            />
          </div>
        </div>
      ))}
    </div>
  );
}
