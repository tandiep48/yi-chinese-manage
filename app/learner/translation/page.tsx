"use client";

// app/learner/translation/page.tsx
// The lesson Translation study page — every sentence in the passage's lesson, drilled
// one card at a time: the meaning is shown and the learner types the Chinese. Ported
// from Learning/web_app/templates/translation/translation.html + static/translation/
// translation.js. Reached from the study sidebar's Translation section. Next on the
// last sentence asks, then opens the next lesson's first part.

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useTranslation } from "@/hooks/shared/useTranslation";
import { resolveNextLessonFirstPart } from "@/lib/api/learner/lessons";
import { saveRecentLearning } from "@/lib/api/learner/recent";
import { invalidateCurrentLesson } from "@/hooks/lesson/useCurrentLesson";
import { LessonStudyShell } from "@/components/page/learner/lesson/LessonStudyShell";
import { LessonConfirmDialog } from "@/components/page/learner/lesson/LessonConfirmDialog";
import { TranslationPanel } from "@/components/page/learner/translation/TranslationPanel";
import { hskLevelFromPassageId } from "@/lib/lessons/lessons";
import { useT } from "@/components/i18n/I18nProvider";

export default function TranslationPage() {
  return (
    <Suspense fallback={null}>
      <TranslationPageContent />
    </Suspense>
  );
}

function TranslationPageContent() {
  const { t } = useT();
  const searchParams = useSearchParams();
  const passageId = searchParams.get("passage_id") ?? "";
  const { loading, error, rows } = useTranslation(passageId);
  const router = useRouter();
  const [confirmNext, setConfirmNext] = useState(false);
  const [nextPending, setNextPending] = useState(false);
  // Set once there is no further lesson in the level.
  const [atLastLesson, setAtLastLesson] = useState(false);

  async function goToNextLesson() {
    setConfirmNext(false);
    setNextPending(true);
    const next = await resolveNextLessonFirstPart(passageId);
    setNextPending(false);
    if (!next) {
      setAtLastLesson(true);
      return;
    }
    // Same bookkeeping as the in-flow roll: the next lesson becomes the current one.
    void saveRecentLearning(next);
    invalidateCurrentLesson();
    router.push(`/learner/lesson?passage_id=${encodeURIComponent(next)}`);
  }

  const seg = passageId.split("_");
  const lessonLabel = seg.length >= 2 ? `${hskLevelFromPassageId(passageId)} · ${t("picker.lesson_prefix")} ${seg[1]}` : "";

  return (
    <LessonStudyShell passageId={passageId} domain="translation">
      <div className="lesson-study-topbar">
        <div className="lesson-study-breadcrumb">{lessonLabel}</div>
      </div>

      {!passageId ? (
        <div className="lesson-learner-empty">{t("translation.failed_load")}</div>
      ) : (
        <TranslationPanel
          rows={rows}
          loading={loading}
          error={error}
          finish={{
            label: atLastLesson ? t("milestone.lesson_complete") : t("milestone.next_lesson"),
            onClick: () => setConfirmNext(true),
            disabled: atLastLesson || nextPending,
          }}
        />
      )}

      {confirmNext && (
        <LessonConfirmDialog
          title={t("milestone.next_lesson_confirm_title")}
          body={t("milestone.next_lesson_confirm_body")}
          confirmLabel={t("milestone.next_lesson")}
          cancelLabel={t("milestone.confirm_cancel_btn")}
          onConfirm={() => void goToNextLesson()}
          onCancel={() => setConfirmNext(false)}
        />
      )}
    </LessonStudyShell>
  );
}
