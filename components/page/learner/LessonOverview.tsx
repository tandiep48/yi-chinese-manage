"use client";

// components/page/learner/LessonOverview.tsx
// Read-only passage content for one lesson part — ported from the reading
// screen in Learning/web_app/static/reading/reading.js, renamed per the
// vocab_overview/lesson_overview naming convention (not "summary").

import { useState } from "react";
import { AudioButton } from "./AudioButton";
import { useT } from "@/components/i18n/I18nProvider";
import { lessonAudioUrl } from "@/lib/audio";
import type { LessonPassageDetail } from "@/lib/types/types";

export function LessonOverview({
  passage,
  loading,
  error,
}: {
  passage: LessonPassageDetail | null;
  loading: boolean;
  error: string | null;
}) {
  const { t, lang } = useT();
  const [showPinyin, setShowPinyin] = useState(false);
  const [showMeaning, setShowMeaning] = useState(false);

  return (
    <section className="rounded-2xl border border-[var(--learner-border)] bg-[var(--learner-card)] p-6 shadow-sm">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-bold text-[var(--learner-text)]">{t("reading.lesson_overview")}</h2>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setShowPinyin((v) => !v)}
            className="rounded-lg border border-[var(--learner-border)] px-3 py-1.5 text-xs font-semibold text-[var(--learner-text)] hover:bg-[var(--learner-bg)] transition-colors"
          >
            {t(showPinyin ? "reading.hide_pinyin" : "reading.show_pinyin")}
          </button>
          <button
            type="button"
            onClick={() => setShowMeaning((v) => !v)}
            className="rounded-lg border border-[var(--learner-border)] px-3 py-1.5 text-xs font-semibold text-[var(--learner-text)] hover:bg-[var(--learner-bg)] transition-colors"
          >
            {t(showMeaning ? "reading.hide_meaning" : "reading.show_meaning")}
          </button>
        </div>
      </div>

      {loading ? (
        <p className="text-sm text-[var(--learner-text-muted)]">{t("reading.loading_passage")}</p>
      ) : error ? (
        <p className="text-sm text-[var(--learner-text-muted)]">{t("reading.failed_load_passage")}</p>
      ) : !passage || passage.lines.length === 0 ? (
        <p className="text-sm text-[var(--learner-text-muted)]">{t("reading.no_lines_found")}</p>
      ) : (
        <ol className="space-y-4">
          {passage.lines.map((line, i) => (
            <li key={line.line_id} className="flex items-start gap-3 border-b border-[var(--learner-border)] pb-4 last:border-0 last:pb-0">
              <AudioButton
                src={line.audio_key ? lessonAudioUrl(line.audio_key) : null}
                ariaLabel={t("reading.play_passage_line", { n: i + 1 })}
              />
              <div className="min-w-0 flex-1">
                {line.speaker && (
                  <p className="text-xs font-semibold uppercase tracking-wide text-[var(--learner-text-muted)]">
                    {line.speaker}
                  </p>
                )}
                <p className="text-lg text-[var(--learner-text)]">{line.content}</p>
                {showPinyin && line.pinyin && (
                  <p className="text-sm text-[var(--learner-text-muted)]">{line.pinyin}</p>
                )}
                {showMeaning && (
                  <p className="text-sm text-[var(--learner-text-muted)]">
                    {(lang === "vi" ? line.translations.vi : line.translations.en) ||
                      line.translations.en ||
                      line.translations.vi}
                  </p>
                )}
              </div>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
