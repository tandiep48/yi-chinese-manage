"use client";

// components/page/learner/vocab-training/VocabTrainerRecap.tsx
// The trainer's completion screen, ported from the {% block screen_complete %} of
// Learning/web_app/templates/vocab/vocab_training_batch.html: a recap table of the
// missed words (character / pinyin / meaning) with Retry Missed, or a "no missed
// words" state on a perfect round.

import { useT } from "@/components/i18n/I18nProvider";
import { pickMeaning } from "@/lib/lessons/meaning";
import type { TrainerWord } from "@/lib/lessons/vocabTrainer";
import "@/components/page/learner/trainer/trainer-recap.css";

export function VocabTrainerRecap({
  missed,
  canRetry,
  onRetry,
  onHome,
}: {
  missed: TrainerWord[];
  canRetry: boolean;
  onRetry: () => void;
  onHome: () => void;
}) {
  const { t, lang } = useT();

  return (
    <>
      <div className="nav-buttons training-complete-actions training-complete-top-actions">
        <button type="button" className="btn primary" onClick={onHome}>
          {t("vocab_trainer.back_to_vocabulary")}
        </button>
      </div>

      {missed.length > 0 ? (
        <>
          <h2 className="training-complete-title">{t("vocab_trainer.recap_title")}</h2>
          <div className="training-complete-table-wrap">
            <table className="training-complete-table">
              <thead>
                <tr>
                  <th>{t("dashboard.table_character")}</th>
                  <th>{t("dashboard.table_pinyin")}</th>
                  <th>{t("dashboard.table_meaning_vn")}</th>
                </tr>
              </thead>
              <tbody>
                {missed.map((row) => (
                  <tr key={row.word}>
                    <td className="complete-word">{row.word}</td>
                    <td>{row.pinyin || ""}</td>
                    <td>{pickMeaning(row, lang)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      ) : (
        <div className="training-complete-table-wrap">
          <div className="training-empty-state">{t("vocab_trainer.perfect")}</div>
        </div>
      )}

      {canRetry && (
        <div className="nav-buttons training-complete-actions">
          <button type="button" className="btn primary" onClick={onRetry}>
            {t("lesson.retry_missed")}
          </button>
        </div>
      )}
    </>
  );
}
