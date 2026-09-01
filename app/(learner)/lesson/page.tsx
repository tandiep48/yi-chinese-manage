"use client";

// app/(learner)/lesson/page.tsx
// The lesson-part study page — the read-only two-domain view a learner lands on
// after selecting a part (e.g. HSK 2 · Lesson 2 · Part 2). Ported to match the
// Jinja design exactly: the shared Word Summary / Lesson Summary tab bar
// (Learning/web_app/templates/{vocab_learning,reading} + static/shared/lesson_ui2.css),
// with each tab a read-only panel. The graded trainers, speaking, and stroke
// order from the original are deferred to a later phase.

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faListUl, faBookOpen } from "@fortawesome/free-solid-svg-icons";
import { useLessonOverview } from "@/hooks/useLessonOverview";
import { WordSummary } from "@/components/page/learner/lesson/WordSummary";
import { LessonSummary } from "@/components/page/learner/lesson/LessonSummary";
import { LessonStudyShell } from "@/components/page/learner/lesson/LessonStudyShell";
import { useT } from "@/components/i18n/I18nProvider";

type Domain = "vocab" | "lesson";

export default function LessonPage() {
  return (
    <Suspense fallback={null}>
      <LessonPageContent />
    </Suspense>
  );
}

function LessonPageContent() {
  const { t } = useT();
  const searchParams = useSearchParams();
  const passageId = searchParams.get("passage_id") ?? "";

  // HSK parts open on the vocab (Word Summary) domain in the legacy flow; book
  // parts pass ?view=lesson to land on Lesson Summary, matching learning.js.
  const initialDomain: Domain = searchParams.get("view") === "lesson" ? "lesson" : "vocab";
  const [domain, setDomain] = useState<Domain>(initialDomain);
  const { loading, error, passage, vocab, vocabError } = useLessonOverview(passageId);

  return (
    <LessonStudyShell passageId={passageId} domain="lesson">
      <nav className="section-tabs lesson-view-tabs" role="tablist">
        <button
          type="button"
          role="tab"
          aria-selected={domain === "vocab"}
          className={`tab${domain === "vocab" ? " active" : ""}`}
          onClick={() => setDomain("vocab")}
        >
          <FontAwesomeIcon icon={faListUl} /> {t("sidebar.word_summary")}
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={domain === "lesson"}
          className={`tab${domain === "lesson" ? " active" : ""}`}
          onClick={() => setDomain("lesson")}
        >
          <FontAwesomeIcon icon={faBookOpen} /> {t("vocab_trainer.lesson_summary")}
        </button>
      </nav>

      {!passageId ? (
        <div className="lesson-learner-empty">{t("reading.failed_load_passage")}</div>
      ) : domain === "vocab" ? (
        <WordSummary vocab={vocab} loading={loading} error={vocabError} />
      ) : (
        <LessonSummary passage={passage} loading={loading} error={error} />
      )}
    </LessonStudyShell>
  );
}
