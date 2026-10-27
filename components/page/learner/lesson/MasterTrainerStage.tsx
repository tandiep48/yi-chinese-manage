"use client";

// components/page/learner/lesson/MasterTrainerStage.tsx
// One end-of-lesson "master" trainer — the Vocab trainer over every word in the
// lesson, or the Lesson trainer over every part (mode="master") — embedded in the
// lesson flow between the last part and Grammar. It reuses the standalone trainers
// unchanged, hosting their Check/Next in a milestone-style nav bar (the same
// bottomBarSlot seam MilestoneRunner uses) so the chrome matches the per-part
// steps. The nav's left button skips the trainer; on the recap its right button
// continues the flow. Both call onDone.

import { useEffect, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowRight, faForward } from "@fortawesome/free-solid-svg-icons";
import { useT } from "@/components/i18n/I18nProvider";
import { VocabTrainerPage } from "@/components/page/learner/vocab-training/VocabTrainerPage";
import { LessonTrainerPage } from "@/components/page/learner/lesson-training/LessonTrainerPage";
import type { TrainerScreen } from "@/components/page/learner/trainer/TrainerShell";
import { resolveTrainerWords } from "@/lib/api/learner/vocabTrainer";
import type { TrainerWord } from "@/lib/lessons/vocabTrainer";
import "@/components/page/learner/milestone/milestone.css";
import "@/components/page/learner/milestone/milestone-nav-slot.css";
import "./master-trainer.css";

interface MasterTrainerStageProps {
  engine: "vocab" | "lesson";
  // The lesson's part ids to drill, already filtered for this engine (vocab keeps
  // the Numbers part, the lesson trainer drops it — see LessonFlow).
  passageIds: string[];
  // Continue the flow: the next master confirm, or Grammar after the last one.
  onDone: () => void;
}

export function MasterTrainerStage({ engine, passageIds, onDone }: MasterTrainerStageProps) {
  const { t } = useT();
  const [slot, setSlot] = useState<HTMLElement | null>(null);
  const [screen, setScreen] = useState<TrainerScreen>("loading");
  // Vocab resolves the lesson-wide word set the same way the per-part step does
  // (/api/vocab/words unions + de-dupes the parts). The lesson trainer takes the
  // part ids directly, so it needs no pre-resolution.
  const [words, setWords] = useState<TrainerWord[] | null>(engine === "vocab" ? null : []);

  useEffect(() => {
    if (engine !== "vocab") return;
    let cancelled = false;
    resolveTrainerWords({ passage_ids: passageIds }).then((rows) => {
      if (!cancelled) setWords(rows);
    });
    return () => {
      cancelled = true;
    };
  }, [engine, passageIds]);

  const emptyVocab = engine === "vocab" && words !== null && words.length === 0;
  // The recap (or an empty vocab set) is the end of the stage: swap the skip +
  // action slot for a single Continue.
  const showContinue = screen === "complete" || emptyVocab;

  return (
    <div className="milestone master-trainer-stage">
      <div className="master-trainer-head">
        <h2 className="master-trainer-title">
          {engine === "vocab"
            ? t("milestone.master_vocab_title")
            : t("milestone.master_lesson_title")}
        </h2>
      </div>

      <div className="milestone-step">
        {engine === "vocab" ? (
          words === null ? (
            <p className="milestone-state">{t("trainer.loading")}</p>
          ) : words.length === 0 ? (
            <p className="milestone-state">{t("milestone.no_vocab")}</p>
          ) : (
            <VocabTrainerPage
              words={words}
              contained
              bottomBarSlot={slot}
              onScreenChange={setScreen}
              onExit={onDone}
            />
          )
        ) : (
          <LessonTrainerPage
            passageIds={passageIds}
            mode="master"
            contained
            bottomBarSlot={slot}
            onScreenChange={setScreen}
            onExit={onDone}
          />
        )}
      </div>

      <div className="milestone-navbar">
        {showContinue ? (
          <span className="master-trainer-nav-spacer" aria-hidden />
        ) : (
          <button
            type="button"
            className="milestone-nav-btn milestone-nav-prev"
            onClick={onDone}
          >
            <FontAwesomeIcon icon={faForward} aria-hidden />
            <span>{t("milestone.confirm_skip_btn")}</span>
          </button>
        )}

        {showContinue ? (
          <button
            type="button"
            className="milestone-nav-btn milestone-nav-next"
            onClick={onDone}
          >
            <span>{t("milestone.confirm_continue_btn")}</span>
            <FontAwesomeIcon icon={faArrowRight} aria-hidden />
          </button>
        ) : (
          // The trainer's Check/Next button portals in here while it runs.
          <div className="trainer-action-slot milestone-nav-slot" ref={setSlot} />
        )}
      </div>
    </div>
  );
}
