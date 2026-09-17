"use client";

// app/learner/lesson/page.tsx
// The lesson-part study page — the two-domain view a learner lands on after
// selecting a part (e.g. HSK 2 · Lesson 2 · Part 2). The shared Word Summary /
// Lesson Summary tab bar, each tab a study panel whose Learn/Train footer actions
// are now wired: Word Summary → flash cards / vocab trainer; Lesson Summary → the
// per-line lesson-card viewer / lesson trainer. Ported from
// Learning/web_app/templates/{vocab_learning,reading} + static/reading/reading.js.

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faListUl, faBookOpen } from "@fortawesome/free-solid-svg-icons";
import { useLessonOverview } from "@/hooks/useLessonOverview";
import { WordSummary } from "@/components/page/learner/lesson/WordSummary";
import { LessonSummary } from "@/components/page/learner/lesson/LessonSummary";
import { LessonStudyShell } from "@/components/page/learner/lesson/LessonStudyShell";
import { TrainTypePicker, type TrainerEngine } from "@/components/page/learner/trainer/TrainTypePicker";
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
  const router = useRouter();
  const searchParams = useSearchParams();
  const passageId = searchParams.get("passage_id") ?? "";

  // HSK parts open on the vocab (Word Summary) domain in the legacy flow; book
  // parts pass ?view=lesson to land on Lesson Summary, matching learning.js.
  const initialDomain: Domain = searchParams.get("view") === "lesson" ? "lesson" : "vocab";
  const [domain, setDomain] = useState<Domain>(initialDomain);
  const [trainEngine, setTrainEngine] = useState<TrainerEngine | null>(null);
  const { loading, error, passage, vocab, vocabError } = useLessonOverview(passageId);

  // Launch a trainer for this part: stash the chosen skills and open the route.
  function launchTraining(engine: TrainerEngine, types: string[]) {
    setTrainEngine(null);
    if (!passageId) return;
    try {
      if (engine === "vocab") {
        sessionStorage.setItem("vocabTrainerActivityTypes", JSON.stringify(types));
        router.push(`/learner/vocab-training-batch?mode=6&passage_id=${encodeURIComponent(passageId)}`);
      } else {
        sessionStorage.setItem("lessonTrainerActivityTypes", JSON.stringify(types));
        router.push(`/learner/lesson-training?passage_id=${encodeURIComponent(passageId)}`);
      }
    } catch {
      // sessionStorage unavailable (private mode); the trainer still starts, just
      // without a pre-filtered skill set.
      router.push(
        engine === "vocab"
          ? `/learner/vocab-training-batch?mode=6&passage_id=${encodeURIComponent(passageId)}`
          : `/learner/lesson-training?passage_id=${encodeURIComponent(passageId)}`
      );
    }
  }

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
        <WordSummary
          vocab={vocab}
          loading={loading}
          error={vocabError}
          onLearn={() => router.push(`/learner/vocab-learning?passage_id=${encodeURIComponent(passageId)}&flow=lesson-part`)}
          onTrain={() => setTrainEngine("vocab")}
        />
      ) : (
        <LessonSummary
          passage={passage}
          loading={loading}
          error={error}
          onLearn={() => router.push(`/learner/lesson-learning?passage_id=${encodeURIComponent(passageId)}`)}
          onTrain={() => setTrainEngine("lesson")}
        />
      )}

      {trainEngine && (
        <TrainTypePicker
          engine={trainEngine}
          onStart={(types) => launchTraining(trainEngine, types)}
          onCancel={() => setTrainEngine(null)}
        />
      )}
    </LessonStudyShell>
  );
}
