"use client";

// components/page/learner/VocabOverview.tsx
// Read-only vocabulary list for one lesson part — ported from the "Word
// Summary" panel in Learning/web_app/static/reading/reading.js, renamed per
// the vocab_overview/lesson_overview naming convention (not "summary").

import { AudioButton } from "./AudioButton";
import { useT } from "@/components/i18n/I18nProvider";
import { vocabAudioUrl } from "@/lib/audio";
import type { LessonVocabRow } from "@/lib/types/types";

export function VocabOverview({
  vocab,
  loading,
  error,
}: {
  vocab: LessonVocabRow[];
  loading: boolean;
  error: string | null;
}) {
  const { t, lang } = useT();

  return (
    <section className="rounded-2xl border border-[var(--learner-border)] bg-[var(--learner-card)] p-6 shadow-sm">
      <h2 className="mb-4 text-lg font-bold text-[var(--learner-text)]">{t("reading.vocab_overview")}</h2>

      {loading ? (
        <p className="text-sm text-[var(--learner-text-muted)]">{t("dashboard.loading")}</p>
      ) : error ? (
        <p className="text-sm text-[var(--learner-text-muted)]">{t("reading.failed_load_vocabulary")}</p>
      ) : vocab.length === 0 ? (
        <p className="text-sm text-[var(--learner-text-muted)]">{t("reading.no_vocab_linked")}</p>
      ) : (
        <ul className="divide-y divide-[var(--learner-border)]">
          {vocab.map((v) => (
            <li key={v.cn} className="flex items-center gap-4 py-3">
              <AudioButton
                src={v.audio_key ? vocabAudioUrl(v.audio_key) : null}
                ariaLabel={t("reading.play_audio_for", { word: v.cn })}
              />
              <div className="min-w-0 flex-1">
                <div className="flex items-baseline gap-3">
                  <span className="text-lg font-semibold text-[var(--learner-text)]">{v.cn}</span>
                  {v.pinyin && <span className="text-sm text-[var(--learner-text-muted)]">{v.pinyin}</span>}
                </div>
                <p className="truncate text-sm text-[var(--learner-text-muted)]">
                  {(lang === "vi" ? v.meaning_vn : v.meaning_en) || v.meaning_en || v.meaning_vn}
                </p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
