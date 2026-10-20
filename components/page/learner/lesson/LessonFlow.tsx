"use client";

// components/page/learner/lesson/LessonFlow.tsx
// The whole lesson as one continuous flow, shared by the dashboard Lesson tab and
// the standalone /learner/lesson page. It drives the six-step MilestoneRunner
// through every part of the lesson, then — once the final part's final step is
// counted — rolls on to the lesson's Grammar screen, then its Translation screen,
// then the first part of the next lesson, all from one Previous / Next bar.
//
// Phases live in `domain` (reusing the study-sidebar's StudyDomain): "lesson" is the
// milestone, "grammar" and "translation" are the single-screen study panels with a
// flow nav bar. The sidebar still jumps anywhere (onSelectPart / onSelectDomain); the
// flow only adds the forward chain the milestone used to dead-end on.
//
// Progression is in place (no navigation) so it works identically in the embedded tab
// and the standalone page; the standalone page still mirrors the milestone step to
// ?step= via onStepChange for refresh-resume.

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowLeft, faArrowRight } from "@fortawesome/free-solid-svg-icons";
import { useT } from "@/components/i18n/I18nProvider";
import { useLessonParts } from "@/hooks/lesson/useLessonParts";
import { useGrammar } from "@/hooks/shared/useGrammar";
import { useTranslation } from "@/hooks/shared/useTranslation";
import { resolveNextLessonFirstPart } from "@/lib/api/learner/lessons";
import { hskLevelFromPassageId } from "@/lib/lessons/lessons";
import { MilestoneRunner } from "@/components/page/learner/milestone/MilestoneRunner";
import { GrammarPanel } from "@/components/page/learner/grammar/GrammarPanel";
import { TranslationPanel } from "@/components/page/learner/translation/TranslationPanel";
import { LessonStudyShell } from "./LessonStudyShell";
import type { StudyDomain } from "./LessonSidebar";
import "./lesson-flow-nav.css";

interface LessonFlowProps {
  // The part to open on. Changing it (a host swapping the current lesson) re-seeds
  // the flow to that part.
  passageId: string;
  // Seeds the milestone step for the opened part only (standalone ?step=).
  initialStep?: number;
  // Open on Grammar / Translation instead of the milestone (standalone ?view=).
  initialDomain?: StudyDomain;
  // Mirrors the milestone step back to the host (URL ?step= on the standalone page).
  onStepChange?: (step: number) => void;
  // True while a graded trainer step runs, for a host with a mid-session guard.
  onRunningChange?: (running: boolean) => void;
}

export function LessonFlow({
  passageId,
  initialStep,
  initialDomain,
  onStepChange,
  onRunningChange,
}: LessonFlowProps) {
  const { t } = useT();

  // The part switched to in place (sidebar, or the flow rolling to the next lesson).
  // Null means "the part the host opened on" (passageId).
  const [selectedPart, setSelectedPart] = useState<string | null>(null);
  const [domain, setDomain] = useState<StudyDomain>(initialDomain ?? "lesson");
  // Set once the flow runs out of lessons, so Translation's Next reads as done.
  const [atLastLesson, setAtLastLesson] = useState(false);
  const [nextPending, setNextPending] = useState(false);

  // Re-seed when the host swaps the opened part (e.g. the dashboard's current lesson
  // changes). An in-flow roll to the next lesson moves selectedPart, not passageId,
  // so it does not trip this.
  const seedRef = useRef(passageId);
  useEffect(() => {
    if (seedRef.current === passageId) return;
    seedRef.current = passageId;
    setSelectedPart(null);
    setDomain(initialDomain ?? "lesson");
    setAtLastLesson(false);
  }, [passageId, initialDomain]);

  const activePart = selectedPart ?? passageId;

  // The active lesson's ordered parts, so the milestone advances across them and
  // knows when the lesson is finished. Derived from the same sidebar parts fetch,
  // and re-derived for the next lesson once the flow rolls on.
  const { parts } = useLessonParts(activePart);
  const passageIds = useMemo(() => parts.map((p) => p.passageId), [parts]);

  const onSelectPart = useCallback((id: string) => {
    setSelectedPart(id);
    setDomain("lesson");
    setAtLastLesson(false);
  }, []);

  const goToNextLesson = useCallback(async () => {
    setNextPending(true);
    const next = await resolveNextLessonFirstPart(activePart);
    setNextPending(false);
    if (next) {
      setSelectedPart(next);
      setDomain("lesson");
    } else {
      // Last lesson of the level: there is nowhere further to go.
      setAtLastLesson(true);
    }
  }, [activePart]);

  return (
    <LessonStudyShell
      passageId={activePart}
      domain={domain}
      onSelectPart={onSelectPart}
      onSelectDomain={setDomain}
    >
      {domain === "grammar" ? (
        <GrammarView
          passageId={activePart}
          flow={{
            onPrev: () => setDomain("lesson"),
            onNext: () => setDomain("translation"),
            prevLabel: t("reading.prev"),
            nextLabel: t("reading.next"),
          }}
        />
      ) : domain === "translation" ? (
        <TranslationView
          passageId={activePart}
          flow={{
            onPrev: () => setDomain("grammar"),
            onNext: goToNextLesson,
            prevLabel: t("reading.prev"),
            nextLabel: atLastLesson ? t("milestone.lesson_complete") : t("milestone.next_lesson"),
            nextDisabled: atLastLesson || nextPending,
          }}
        />
      ) : (
        <MilestoneRunner
          passageId={activePart}
          passageIds={passageIds}
          // ?step= only seeds the part the host opened on.
          initialStep={selectedPart ? undefined : initialStep}
          onStepChange={onStepChange}
          onRunningChange={onRunningChange}
          // Lesson finished → straight into Grammar, continuing the chain.
          onLessonComplete={() => setDomain("grammar")}
        />
      )}
    </LessonStudyShell>
  );
}

interface FlowNav {
  onPrev: () => void;
  onNext: () => void;
  prevLabel: string;
  nextLabel: string;
  nextDisabled?: boolean;
}

function LessonFlowNav({ onPrev, onNext, prevLabel, nextLabel, nextDisabled }: FlowNav) {
  return (
    <div className="lesson-flow-nav">
      <button type="button" className="lesson-flow-nav-btn lesson-flow-nav-prev" onClick={onPrev}>
        <FontAwesomeIcon icon={faArrowLeft} aria-hidden />
        <span>{prevLabel}</span>
      </button>
      <button
        type="button"
        className="lesson-flow-nav-btn lesson-flow-nav-next"
        onClick={onNext}
        disabled={nextDisabled}
      >
        <span>{nextLabel}</span>
        <FontAwesomeIcon icon={faArrowRight} aria-hidden />
      </button>
    </div>
  );
}

// Grammar / Translation rendered in place, each above a flow nav bar when driven by
// the flow (the sidebar can also open them standalone, with no nav). Mirrors the
// breadcrumb + panel of /learner/grammar and /learner/translation.
function lessonBreadcrumb(passageId: string, lessonPrefix: string): string {
  const seg = passageId.split("_");
  return seg.length >= 2 ? `${hskLevelFromPassageId(passageId)} · ${lessonPrefix} ${seg[1]}` : "";
}

export function GrammarView({ passageId, flow }: { passageId: string; flow?: FlowNav }) {
  const { t } = useT();
  const { loading, error, sections } = useGrammar(passageId);
  return (
    <>
      <div className="lesson-study-topbar">
        <div className="lesson-study-breadcrumb">
          {lessonBreadcrumb(passageId, t("picker.lesson_prefix"))}
        </div>
      </div>
      <GrammarPanel sections={sections} loading={loading} error={error} />
      {flow && <LessonFlowNav {...flow} />}
    </>
  );
}

export function TranslationView({ passageId, flow }: { passageId: string; flow?: FlowNav }) {
  const { t } = useT();
  const { loading, error, rows } = useTranslation(passageId);
  return (
    <>
      <div className="lesson-study-topbar">
        <div className="lesson-study-breadcrumb">
          {lessonBreadcrumb(passageId, t("picker.lesson_prefix"))}
        </div>
      </div>
      <TranslationPanel rows={rows} loading={loading} error={error} />
      {flow && <LessonFlowNav {...flow} />}
    </>
  );
}
