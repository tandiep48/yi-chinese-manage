"use client";

// app/learner/translation/page.tsx
// The lesson Translation study page — every sentence in the passage's lesson, drilled
// one card at a time: the meaning is shown and the learner types the Chinese. Ported
// from Learning/web_app/templates/translation/translation.html + static/translation/
// translation.js. Reached from the study sidebar's Translation section.

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useTranslation } from "@/hooks/useTranslation";
import { LessonStudyShell } from "@/components/page/learner/lesson/LessonStudyShell";
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
        <TranslationPanel rows={rows} loading={loading} error={error} />
      )}
    </LessonStudyShell>
  );
}
