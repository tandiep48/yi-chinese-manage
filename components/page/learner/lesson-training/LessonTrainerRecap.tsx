"use client";

// components/page/learner/lesson-training/LessonTrainerRecap.tsx
// The lesson trainer's completion screen, ported from the {% block screen_complete %}
// of Learning/web_app/templates/lesson/lesson.html: a "Lesson Complete" header, then
// either a recap table of the missed tasks (type / question / your answer / correct
// answer) with Retry Missed, or a perfect-round state.

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCircleCheck } from "@fortawesome/free-solid-svg-icons";
import { useT } from "@/components/i18n/I18nProvider";
import type { MissedTask } from "@/hooks/useLessonTrainer";

export function LessonTrainerRecap({
  missed,
  canRetry,
  onRetry,
  onHome,
}: {
  missed: MissedTask[];
  canRetry: boolean;
  onRetry: () => void;
  onHome: () => void;
}) {
  const { t } = useT();

  return (
    <>
      <div className="nav-buttons training-complete-actions training-complete-top-actions">
        <button type="button" className="btn primary" onClick={onHome}>
          {t("lesson.back_to_menu")}
        </button>
      </div>

      <div className="lesson-complete-icon" aria-hidden>
        <FontAwesomeIcon icon={faCircleCheck} />
      </div>
      <h1 className="lesson-complete-heading">{t("lesson.complete_title")}</h1>
      <p className="lesson-complete-body">{t("lesson.complete_body")}</p>

      {missed.length > 0 ? (
        <>
          <h2 className="training-complete-title">{t("lesson.recap_title")}</h2>
          <div className="training-complete-table-wrap">
            <table className="training-complete-table">
              <thead>
                <tr>
                  <th>{t("lesson.table_task_type")}</th>
                  <th>{t("lesson.table_question")}</th>
                  <th>{t("lesson.table_your_answer")}</th>
                  <th>{t("lesson.table_correct_answer")}</th>
                </tr>
              </thead>
              <tbody>
                {missed.map((m, i) => (
                  <tr key={`${m.task.passage_id}-${m.task.line_id}-${m.task.type}-${i}`}>
                    <td>{m.task.type}</td>
                    <td>{m.task.content || t("lesson.audio_fallback")}</td>
                    <td className="recap-your-answer">{m.userAnswer}</td>
                    <td className="recap-correct-answer">{m.task.correct_answer}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {canRetry && (
            <div className="nav-buttons training-complete-actions">
              <button type="button" className="btn primary" onClick={onRetry}>
                {t("lesson.retry_missed")}
              </button>
            </div>
          )}
        </>
      ) : (
        <div className="training-empty-state">{t("lesson.perfect")}</div>
      )}
    </>
  );
}
