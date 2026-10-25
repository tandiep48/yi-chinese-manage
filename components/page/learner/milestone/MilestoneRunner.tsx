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
// milestone (for the progress markers) and advances. Gating is soft: Next moves the
// learner on whether or not the run passed; only an explicit Quit steps back.
//
// Auto-advance across parts: when the runner is given the lesson's ordered parts
// (the Lesson tab passes `passageIds`), finishing the *final* step of a part moves
// on to the next part on its own, opened at its own resume step. The standalone
// /learner/lesson page passes a single part and
// so never advances — its URL owns which part is shown. This only crosses a part
// boundary; within a part the per-step gating below is unchanged.
//
// Gating is soft: the bar's segments jump anywhere, and the lesson sidebar still
// reaches other parts. The milestone guides; it does not lock.

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faArrowRight,
  faArrowLeft,
  faRightFromBracket,
  faTriangleExclamation,
} from "@fortawesome/free-solid-svg-icons";
import { useT } from "@/components/i18n/I18nProvider";
import { useLessonOverview } from "@/hooks/lesson/useLessonOverview";
import {
  useLessonMilestone,
  isPassiveStep,
  VOCAB_TRAINER_STEP,
  LESSON_TRAINER_STEP,
} from "@/hooks/lesson/useLessonMilestone";
import { WordSummary } from "@/components/page/learner/lesson/WordSummary";
import {
  VocabStrokeModal,
  type StrokeModalState,
} from "@/components/page/learner/vocab/VocabStrokeModal";
import { LessonSummary } from "@/components/page/learner/lesson/LessonSummary";
import { LessonCardStudy } from "@/components/page/learner/lesson/LessonCardStudy";
import { FlashcardStudy } from "@/components/page/learner/vocab-learning/FlashcardStudy";
import { VocabTrainerPage } from "@/components/page/learner/vocab-training/VocabTrainerPage";
import { LessonTrainerPage } from "@/components/page/learner/lesson-training/LessonTrainerPage";
import type { TrainerScreen } from "@/components/page/learner/trainer/TrainerShell";
import { TrainTypePicker, type TrainerEngine } from "@/components/page/learner/trainer/TrainTypePicker";
import { resolveTrainerWords } from "@/lib/api/learner/vocabTrainer";
import { invalidateCurrentLesson } from "@/hooks/lesson/useCurrentLesson";
import { invalidateVocabReview } from "@/hooks/vocab/useVocabReview";
import { lessonAudioFolder } from "@/lib/audio";
import type { TrainerWord, VocabActivityType } from "@/lib/lessons/vocabTrainer";
import type { LessonTaskType } from "@/lib/types/lesson";
import { MilestoneBar } from "./MilestoneBar";
import "./milestone.css";
import "./milestone-nav-slot.css";

interface MilestoneRunnerProps {
  passageId: string;
  // The lesson's ordered parts. Given (the Lesson tab), finishing a part's final
  // step advances to the next entry; `passageId` is the part to open on. Omitted
  // (the standalone page) means a single part with no cross-part advance.
  passageIds?: string[];
  // The step to open on (from ?step=), overriding "resume where you left off".
  // Applies only to the part the learner opened on, not to auto-advanced ones.
  initialStep?: number;
  // Mirrors the viewed step back to the URL, so a refresh lands on it.
  onStepChange?: (step: number) => void;
  // True while a graded step's trainer is running, so a host with a mid-session
  // guard (the learner home's tab bar) can arm it.
  onRunningChange?: (running: boolean) => void;
  // The lesson's final part's final step was finished and counted — there is no
  // next part to advance to. The host rolls the flow on from here (Grammar →
  // Translation → next lesson). Fires for a single-part run too.
  onLessonComplete?: () => void;
}

export function MilestoneRunner({
  passageId,
  passageIds,
  initialStep,
  onStepChange,
  onRunningChange,
  onLessonComplete,
}: MilestoneRunnerProps) {
  // The parts to run through. With no list this is the single given part, so the
  // standalone page behaves exactly as before.
  const parts = useMemo(
    () => (passageIds && passageIds.length ? passageIds : [passageId]),
    [passageIds, passageId]
  );
  const initialIndex = Math.max(0, parts.indexOf(passageId));
  const [activeIndex, setActiveIndex] = useState(initialIndex);

  // A different lesson can arrive under the same mount (a host can swap the part
  // without unmounting), so re-seed the active part when the inputs really change.
  // Keyed on the content, not array identity, so a re-fetch of the same list does
  // not rewind an in-session advance.
  const seedKey = `${parts.join("|")}@${passageId}`;
  const seedRef = useRef(seedKey);
  useEffect(() => {
    if (seedRef.current === seedKey) return;
    seedRef.current = seedKey;
    setActiveIndex(initialIndex);
  }, [seedKey, initialIndex]);

  const activePassageId = parts[activeIndex] ?? passageId;

  const onPartComplete = useCallback(() => {
    if (activeIndex + 1 < parts.length) {
      setActiveIndex(activeIndex + 1);
    } else {
      // No next part: the lesson's parts are all done. Hand off to the host, which
      // continues the flow (Grammar → Translation → next lesson). A single-part run
      // (the standalone page) lands here directly instead of dead-ending on step 6.
      onLessonComplete?.();
    }
  }, [activeIndex, parts.length, onLessonComplete]);

  return (
    <MilestonePart
      // Remount per part so the milestone hook re-seeds to the new part's own
      // resume step instead of carrying the last part's step across.
      key={activePassageId}
      passageId={activePassageId}
      // The ?step= deep link only seeds the part the learner opened on.
      initialStep={activeIndex === initialIndex ? initialStep : undefined}
      onStepChange={onStepChange}
      onRunningChange={onRunningChange}
      onPartComplete={onPartComplete}
    />
  );
}

interface MilestonePartProps {
  passageId: string;
  initialStep?: number;
  onStepChange?: (step: number) => void;
  onRunningChange?: (running: boolean) => void;
  // The final step of this part was finished and counted by the server.
  onPartComplete?: () => void;
}

function MilestonePart({
  passageId,
  initialStep,
  onStepChange,
  onRunningChange,
  onPartComplete,
}: MilestonePartProps) {
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

  // Continuing out of a learner step into its trainer (step 2 → vocab trainer,
  // step 5 → lesson trainer) first asks which skills to drill, mirroring the
  // standalone trainers' launch. The chosen ids are passed to the trainer step as
  // its `types` filter; the other passive steps (1, 4) just advance.
  const [pickerEngine, setPickerEngine] = useState<TrainerEngine | null>(null);
  const [vocabTypes, setVocabTypes] = useState<VocabActivityType[] | undefined>(undefined);
  const [lessonTypes, setLessonTypes] = useState<LessonTaskType[] | undefined>(undefined);

  // The trainer steps (3, 6) hand their Check/Next action to the nav bar's right
  // slot and report their screen, so the bar shows Quit + that action while
  // training and Previous + Next on the recap. The trainer's own bottom bar is gone.
  const [trainerSlot, setTrainerSlot] = useState<HTMLElement | null>(null);
  const [trainerScreen, setTrainerScreen] = useState<TrainerScreen>("loading");
  const [quitOpen, setQuitOpen] = useState(false);
  // Step 1's word cards open the shared stroke-order modal on a hanzi tap (the
  // desktop card's paintbrush and the phone detail sheet's stroke button).
  const [stroke, setStroke] = useState<StrokeModalState>(null);

  const handleContinue = useCallback(() => {
    if (step + 1 === VOCAB_TRAINER_STEP) {
      setPickerEngine("vocab");
    } else if (step + 1 === LESSON_TRAINER_STEP) {
      setPickerEngine("lesson");
    } else {
      void completeAndAdvance();
    }
  }, [step, completeAndAdvance]);

  const startTrainerWithSkills = useCallback(
    (ids: string[]) => {
      if (pickerEngine === "vocab") setVocabTypes(ids as VocabActivityType[]);
      else if (pickerEngine === "lesson") setLessonTypes(ids as LessonTaskType[]);
      setPickerEngine(null);
      void completeAndAdvance();
    },
    [pickerEngine, completeAndAdvance]
  );

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

  // A trainer's exit (quit, its recap's action, or — for the lesson trainer —
  // finishing a round) hands the step back to us. Gating is soft: finishing moves
  // the learner on whether or not the run passed, and finishing this part's last
  // step moves on to the next part.
  const onTrainerExit = useCallback(async () => {
    // Finishing a part can move the learner on and changes which words are due,
    // so the two cached mount reads that would otherwise show yesterday's answer
    // are dropped here.
    invalidateCurrentLesson();
    invalidateVocabReview();
    await refreshAfterRun();
    // Only the final step crosses a part boundary; an earlier step (e.g. 3) advances
    // to the next step inside refreshAfterRun and must not skip ahead a part here.
    if (step === milestone.totalSteps) onPartComplete?.();
  }, [refreshAfterRun, step, milestone.totalSteps, onPartComplete]);

  // The fixed bottom bar is the milestone's one navigation control. Previous
  // always steps back (soft gating: any earlier step is replayable). Next
  // continues a passive step, or on a graded trainer step re-reads the milestone
  // and advances only if the server counted the run (`onTrainerExit`) -- the
  // pass-gating the trainers' own recap buttons used to carry.
  const onTrainerStep = step === VOCAB_TRAINER_STEP || step === LESSON_TRAINER_STEP;
  const handleNext = useCallback(() => {
    if (onTrainerStep) void onTrainerExit();
    else handleContinue();
  }, [onTrainerStep, onTrainerExit, handleContinue]);

  if (!passageId) {
    return <p className="milestone-state">{t("reading.failed_load_passage")}</p>;
  }
  if (milestone.error) {
    return <p className="milestone-state">{milestone.error}</p>;
  }

  const passage = overview.passage;

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

  // While a trainer step is actively training, the nav bar carries the trainer's
  // own Quit + Check/Next (the trainer's bottom bar is suppressed). On its recap,
  // and on every passive step, it is the plain Previous / Next pair.
  const trainerActive = onTrainerStep && trainerScreen === "training";

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
            onOpenStroke={(word, pinyin) => setStroke({ mode: "word", word, pinyin })}
          />
        )}

        {step === 2 && (
          <FlashcardStudy
            words={overview.vocab}
            loading={overview.loading}
            error={overview.vocabError}
            passageId={passageId}
            shell={false}
            hideSummaryButton
            lockAtEnd
          />
        )}

        {step === VOCAB_TRAINER_STEP &&
          (trainerWords === null ? (
            <p className="milestone-state">{t("trainer.loading")}</p>
          ) : trainerWords.length === 0 ? (
            <p className="milestone-state">{t("milestone.no_vocab")}</p>
          ) : (
            <VocabTrainerPage
              words={trainerWords}
              types={vocabTypes}
              contained
              onExit={onTrainerExit}
              bottomBarSlot={trainerSlot}
              onScreenChange={setTrainerScreen}
            />
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
              hideSummaryButton
              hideBackSummary
              lockAtEnd
            />
          ) : (
            <p className="milestone-state">{t("reading.loading")}</p>
          ))}

        {step === LESSON_TRAINER_STEP && (
          <LessonTrainerPage
            passageIds={[passageId]}
            types={lessonTypes}
            contained
            onExit={onTrainerExit}
            onComplete={onTrainerExit}
            bottomBarSlot={trainerSlot}
            onScreenChange={setTrainerScreen}
          />
        )}
      </div>

      <div className="milestone-navbar">
        {trainerActive ? (
          <button
            type="button"
            className="milestone-nav-btn milestone-nav-quit"
            onClick={() => setQuitOpen(true)}
          >
            <FontAwesomeIcon icon={faRightFromBracket} aria-hidden />
            <span>{t("trainer.quit_session_btn")}</span>
          </button>
        ) : (
          <button
            type="button"
            className="milestone-nav-btn milestone-nav-prev"
            onClick={() => goToStep(step - 1)}
            disabled={step <= 1}
          >
            <FontAwesomeIcon icon={faArrowLeft} aria-hidden />
            <span>{t("reading.prev")}</span>
          </button>
        )}

        {trainerActive ? (
          // The trainer's Check/Next button portals in here (TrainerShell gets this
          // element as its bottomBarSlot). The .trainer-action-slot class keeps the
          // vocab trainer's Enter-key shortcut working.
          <div className="trainer-action-slot milestone-nav-slot" ref={setTrainerSlot} />
        ) : (
          <button
            type="button"
            className="milestone-nav-btn milestone-nav-next"
            onClick={handleNext}
            disabled={isPassiveStep(step) && milestone.saving}
          >
            <span>{t("reading.next")}</span>
            <FontAwesomeIcon icon={faArrowRight} aria-hidden />
          </button>
        )}
      </div>

      {quitOpen && (
        <div
          className="milestone-quit-overlay"
          onClick={(e) => {
            if (e.target === e.currentTarget) setQuitOpen(false);
          }}
        >
          <div className="milestone-quit-modal">
            <div className="milestone-quit-icon" aria-hidden>
              <FontAwesomeIcon icon={faTriangleExclamation} />
            </div>
            <h3 className="milestone-quit-title">{t("trainer.quit_modal_title")}</h3>
            <p
              className="milestone-quit-body"
              dangerouslySetInnerHTML={{ __html: t("trainer.quit_modal_body") }}
            />
            <div className="milestone-quit-btns">
              <button
                type="button"
                className="milestone-quit-cancel"
                onClick={() => setQuitOpen(false)}
              >
                {t("trainer.cancel")}
              </button>
              <button
                type="button"
                className="milestone-quit-confirm"
                onClick={() => {
                  setQuitOpen(false);
                  goToStep(step - 1);
                }}
              >
                {t("trainer.yes_quit")}
              </button>
            </div>
          </div>
        </div>
      )}

      {pickerEngine && (
        <TrainTypePicker
          engine={pickerEngine}
          onStart={startTrainerWithSkills}
          onCancel={() => setPickerEngine(null)}
        />
      )}

      <VocabStrokeModal state={stroke} onClose={() => setStroke(null)} />
    </div>
  );
}
