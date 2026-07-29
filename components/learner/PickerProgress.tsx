"use client";

// components/learner/PickerProgress.tsx
// Progress bars for the lesson picker — ports _progressBar() from the
// Learning app's passage_picker.js (words + lesson-progress bars).

import type { Progress } from "@/lib/lessons";
import { useT } from "@/components/i18n/I18nProvider";

function pctClass(pct: number): string {
  if (pct <= 25) return "pct-red";
  if (pct <= 50) return "pct-orange";
  if (pct <= 75) return "pct-yellow";
  return "pct-green";
}

function ProgressBar({
  label,
  done,
  total,
  asPercentage = false,
}: {
  label: string;
  done: number;
  total: number;
  asPercentage?: boolean;
}) {
  if (!total) return null;
  const pct = Math.max(0, Math.min(100, Math.round((done / total) * 100)));
  const text = asPercentage ? `${pct}%` : `${done} / ${total}`;
  return (
    <div className="picker-progress-row">
      <span className="picker-progress-label">{label}</span>
      <div
        className={`picker-progress-track ${pctClass(pct)}`}
        role="progressbar"
        aria-label={`${label} progress`}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={pct}
      >
        <span className="picker-progress-fill" style={{ width: `${pct}%` }} />
      </div>
      <span className="picker-progress-pct">{text}</span>
    </div>
  );
}

function Bars({ progress }: { progress: Progress }) {
  const { t } = useT();
  return (
    <>
      <ProgressBar
        label={t("picker.words_label")}
        done={progress.learnedWords}
        total={progress.totalWords}
      />
      <ProgressBar
        label={t("picker.lesson_progress_label")}
        done={progress.progressPct}
        total={100}
        asPercentage
      />
    </>
  );
}

// Used inside lesson cards and part items.
export function ProgressLines({
  progress,
  centered = false,
}: {
  progress: Progress;
  centered?: boolean;
}) {
  return (
    <div className={`picker-progress-lines${centered ? " picker-progress-lines-centered" : ""}`}>
      <Bars progress={progress} />
    </div>
  );
}

// Used inside the part-picker trainer action card.
export function LessonProgress({ progress }: { progress: Progress }) {
  return (
    <div className="picker-lesson-progress">
      <Bars progress={progress} />
    </div>
  );
}
