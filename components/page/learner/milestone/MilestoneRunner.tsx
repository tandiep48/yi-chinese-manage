"use client";

// components/page/learner/milestone/MilestoneRunner.tsx
// The six-step milestone for one HSK lesson part (docs/plans/dashboard-tabs.md
// §10). One shared component, mounted both by /learner/lesson and by the learner
// home's Lesson tab.
//
// Every step reuses an existing component unchanged except for chrome:
//
//   1 Vocab summary   WordSummary       hideActions
//   2 Vocab learner   FlashcardStudy    shell={false} — the host owns the shell
//   3 Vocab trainer   VocabTrainerPage  Phase 0 seam, contained
//   4 Lesson summary  LessonSummary     hideActions
//   5 Lesson learner  LessonCardStudy   direct, no second LessonStudyShell
//   6 Lesson trainer  LessonTrainerPage Phase 0 seam, contained
//
// Passive steps (1, 2, 4, 5) complete on Continue. Graded steps (3, 6) are never
// posted — their trainers already record them — so finishing one re-reads the
// milestone and advances only if the server counted it. That is also why a
// trainer quit below the pass threshold leaves the learner on the step.
//
// Gating is soft: the bar's segments jump anywhere, and the lesson sidebar still
// reaches other parts. The milestone guides; it does not lock.

import { useCallback, useEffect, useRef, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowRight } from "@fortawesome/free-solid-svg-icons";
import { useT } from "@/components/i18n/I18nProvider";
import { useLessonOverview } from "@/hooks/lesson/useLessonOverview";
import {
  useLessonMilestone,
  isPassiveStep,
  VOCAB_TRAINER_STEP,
  LESSON_TRAINER_STEP,
} from "@/hooks/lesson/useLessonMilestone";
import { WordSummary } from "@/components/page/learner/lesson/WordSummary";
import { LessonSummary } from "@/components/page/learner/lesson/LessonSummary";
import { LessonCardStudy } from "@/components/page/learner/lesson/LessonCardStudy";
import { FlashcardStudy } from "@/components/page/learner/vocab-learning/FlashcardStudy";
import { VocabTrainerPage } from "@/components/page/learner/vocab-training/VocabTrainerPage";
import { LessonTrainerPage } from "@/components/page/learner/lesson-training/LessonTrainerPage";
import { resolveTrainerWords } from "@/lib/api/learner/vocabTrainer";
import { invalidateCurrentLesson } from "@/hooks/lesson/useCurrentLesson";
import { invalidateVocabReview } from "@/hooks/vocab/useVocabReview";
import { lessonAudioFolder } from "@/lib/audio";
import type { TrainerWord } from "@/lib/lessons/vocabTrainer";
import { MilestoneBar } from "./MilestoneBar";
import "./milestone.css";

interface MilestoneRunnerProps {
  passageId: string;
  // The step to open on (from ?step=), overriding "resume where you left off".
  initialStep?: number;
  // Mirrors the viewed step back to the URL, so a refresh lands on it.
  onStepChange?: (step: number) => void;
  // True while a graded step's trainer is running, so a host with a mid-session
  // guard (the learner home's tab bar) can arm it.
  onRunningChange?: (running: boolean) => void;
}

export function MilestoneRunner({
  passageId,
  initialStep,
  onStepChange,
  onRunningChange,
}: MilestoneRunnerProps) {
  const { t } = useT();
  const overview = useLessonOverview(passageId);
  const milestone = useLessonMilestone(passageId, initialStep);
  const { step, goToStep, completeAndAdvance, refreshAfterRun } = milestone;

  // Step 3 needs normalized trainer rows. The passage's own vocab rows are a
  // different shape (cn/hsk_level, no word/level), and the standalone trainer
  // resolves ?passage_id through /api/vocab/words — so this makes the same call
  // rather than mapping the summary rows and hoping the shapes agree.
  const [trainerWords, setTrainerWords] = useState<TrainerWord[] | null>(null);

  useEffect(() => {
    if (step !== VOCAB_TRAINER_STEP || trainerWords || !passageId) return;
    let cancelled = false;
    resolveTrainerWords({ passage_id: passageId }).then((rows) => {
      if (!cancelled) setTrainerWords(rows);
    });
    return () => {
      cancelled = true;
    };
  }, [step, trainerWords, passageId]);

  // The host callbacks are held in a ref so the effects below can depend on the
  // *value* they report and nothing else. Both hosts build theirs from
  // useSearchParams, so their identity changes on every URL write — and a
  // running-state effect that re-ran on identity would fire its cleanup
  // (`false`) and then `true` again, each a URL write, each changing
  // useSearchParams: an infinite loop rather than a redundant render.
  const hostRef = useRef({ onStepChange, onRunningChange });
  useEffect(() => {
    hostRef.current = { onStepChange, onRunningChange };
  }, [onStepChange, onRunningChange]);

  useEffect(() => {
    hostRef.current.onStepChange?.(step);
  }, [step]);

  const running = step === VOCAB_TRAINER_STEP || step === LESSON_TRAINER_STEP;
  useEffect(() => {
    hostRef.current.onRunningChange?.(running);
    return () => hostRef.current.onRunningChange?.(false);
  }, [running]);

  // A trainer's exit (quit, or the recap's Home) hands the step back to us. The
  // server decides whether it counted.
  const onTrainerExit = useCallback(() => {
    // Finishing a part can move the learner on and changes which words are due,
    // so the two cached mount reads that would otherwise show yesterday's answer
    // are dropped here.
    invalidateCurrentLesson();
    invalidateVocabReview();
    void refreshAfterRun();
  }, [refreshAfterRun]);

  if (!passageId) {
    return <p className="milestone-state">{t("reading.failed_load_passage")}</p>;
  }
  if (milestone.error) {
    return <p className="milestone-state">{milestone.error}</p>;
  }

  const passage = overview.passage;
  const showContinue = isPassiveStep(step);

  // `.lesson-study` is the scope the four study steps are styled under:
  // word-summary.css, lesson-summary.css and flashcards.css define every rule as
  // `.lesson-study .…`, and none of those components carries a root class of its
  // own. /learner/lesson supplies the scope through LessonStudyShell, but the
  // dashboard's Lesson tab has no shell — without this they render unstyled there.
  //
  // It deliberately does NOT wrap steps 3 and 6. Those mount TrainerShell, which
  // brings its own root, and `.lesson-study` shares four leaf names with
  // lesson-trainer.css (`.vl-card`, `.vl-nav-row`, `.vl-card-progress`,
  // `.vl-learning-topbar`) plus `.app-container` — nesting the trainers under it
  // would put every one of those at a (0,2,0) specificity tie decided by
  // stylesheet source order. That is the §2 bug, through a side door.
  const studyScoped = isPassiveStep(step);

  return (
    <div className="milestone">
      <MilestoneBar
        step={step}
        totalSteps={milestone.totalSteps}
        isCompleted={milestone.isCompleted}
        onSelect={goToStep}
      />

      <div className={`milestone-step${studyScoped ? " lesson-study" : ""}`}>
        {step === 1 && (
          <WordSummary
            vocab={overview.vocab}
            loading={overview.loading}
            error={overview.vocabError}
            hideActions
          />
        )}

        {step === 2 && (
          <FlashcardStudy
            words={overview.vocab}
            loading={overview.loading}
            error={overview.vocabError}
            passageId={passageId}
            shell={false}
          />
        )}

        {step === VOCAB_TRAINER_STEP &&
          (trainerWords === null ? (
            <p className="milestone-state">{t("trainer.loading")}</p>
          ) : trainerWords.length === 0 ? (
            <p className="milestone-state">{t("milestone.no_vocab")}</p>
          ) : (
            <VocabTrainerPage words={trainerWords} contained onExit={onTrainerExit} />
          ))}

        {step === 4 && (
          <LessonSummary
            passage={passage}
            loading={overview.loading}
            error={overview.error}
            hideActions
          />
        )}

        {step === 5 &&
          (passage ? (
            <LessonCardStudy
              lines={passage.lines ?? []}
              folder={lessonAudioFolder(passage)}
              onShowSummary={() => goToStep(4)}
            />
          ) : (
            <p className="milestone-state">{t("reading.loading")}</p>
          ))}

        {step === LESSON_TRAINER_STEP && (
          <LessonTrainerPage passageIds={[passageId]} contained onExit={onTrainerExit} />
        )}
      </div>

      {showContinue && (
        <div className="milestone-actions">
          <button
            type="button"
            className="milestone-continue"
            disabled={milestone.saving}
            onClick={() => void completeAndAdvance()}
          >
            <span>{t("milestone.continue")}</span>
            <FontAwesomeIcon icon={faArrowRight} aria-hidden />
          </button>
        </div>
      )}
    </div>
  );
}
