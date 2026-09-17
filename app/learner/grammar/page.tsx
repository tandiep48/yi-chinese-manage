"use client";

// app/learner/grammar/page.tsx
// The lesson Grammar study page — lesson-wide grammar rules for the passage's
// lesson (all parts). Ported from Learning/web_app/templates/grammar/grammar.html
// + static/grammar/grammar.js. Reached from the study sidebar's Grammar section.

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useGrammar } from "@/hooks/useGrammar";
import { LessonStudyShell } from "@/components/page/learner/lesson/LessonStudyShell";
import { GrammarPanel } from "@/components/page/learner/grammar/GrammarPanel";
import { hskLevelFromPassageId } from "@/lib/lessons/lessons";
import { useT } from "@/components/i18n/I18nProvider";

export default function GrammarPage() {
  return (
    <Suspense fallback={null}>
      <GrammarPageContent />
    </Suspense>
  );
}

function GrammarPageContent() {
  const { t } = useT();
  const searchParams = useSearchParams();
  const passageId = searchParams.get("passage_id") ?? "";
  const { loading, error, sections } = useGrammar(passageId);

  const seg = passageId.split("_");
  const lessonLabel = seg.length >= 2 ? `${hskLevelFromPassageId(passageId)} · ${t("picker.lesson_prefix")} ${seg[1]}` : "";

  return (
    <LessonStudyShell passageId={passageId} domain="grammar">
      <div className="lesson-study-topbar">
        <div className="lesson-study-breadcrumb">{lessonLabel}</div>
      </div>

      {!passageId ? (
        <div className="lesson-learner-empty">{t("grammar.error_loading")}</div>
      ) : (
        <GrammarPanel sections={sections} loading={loading} error={error} />
      )}
    </LessonStudyShell>
  );
}
