"use client";

// app/learner/lesson-learning/page.tsx
// "Learn This Lesson" — the dedicated per-line lesson-card page for a passage (its own
// route, like /vocab-learning for words and /lesson-training for the trainer). Reads
// ?passage_id, loads the passage, and shows the LessonCardStudy viewer inside the
// lesson-study shell. Ported from the #screen-lesson-card flow in
// Learning/web_app/static/reading/reading.js.

import { Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useLessonOverview } from "@/hooks/useLessonOverview";
import { lessonAudioFolder } from "@/lib/audio";
import { LessonStudyShell } from "@/components/page/learner/lesson/LessonStudyShell";
import { LessonCardStudy } from "@/components/page/learner/lesson/LessonCardStudy";
import { useT } from "@/components/i18n/I18nProvider";

function LessonLearningContent() {
  const { t } = useT();
  const router = useRouter();
  const searchParams = useSearchParams();
  const passageId = searchParams.get("passage_id") ?? "";
  const { loading, error, passage } = useLessonOverview(passageId);

  // Summary / finish returns to the study page's Lesson Summary tab.
  const backToSummary = () =>
    router.push(`/learner/lesson?passage_id=${encodeURIComponent(passageId)}&view=lesson`);

  return (
    <LessonStudyShell passageId={passageId} domain="lesson">
      {!passageId ? (
        <div className="lesson-learner-empty">{t("reading.failed_load_passage")}</div>
      ) : loading ? (
        <div className="lesson-learner-empty">{t("reading.loading_passage")}</div>
      ) : error || !passage ? (
        <div className="lesson-learner-empty">{t("reading.failed_load_passage")}</div>
      ) : (
        <LessonCardStudy
          lines={passage.lines}
          folder={lessonAudioFolder(passage)}
          onShowSummary={backToSummary}
        />
      )}
    </LessonStudyShell>
  );
}

export default function LessonLearningPage() {
  return (
    <Suspense fallback={null}>
      <LessonLearningContent />
    </Suspense>
  );
}
